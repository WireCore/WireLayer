import {
    addMinutes,
    agendaSections,
    checkEventDrop,
    createDataController,
    daysRange,
    describeRecurrence,
    eventCounts,
    expandEvents,
    formatDayRange,
    nowIn,
    parseLocal,
    pluralText,
    sameDay,
    scheduler,
    schedulerDays,
    schedulerWeeks,
    shiftEvent,
    shiftView,
    startOfDay,
    toIsoDate,
    toIsoDateTime,
    weekendDays,
    withZoneOffset,
    zonedEvent,
    type DataSource,
    type DataState,
    type RecurrenceScope,
    type SchedulerBusinessHours,
    type SchedulerEvent,
    type SchedulerResource,
    type Translations,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { Select } from '../Select/Select.js';
import { SchedulerTimeGrid } from './SchedulerTimeGrid.js';
import { SchedulerAgenda, SchedulerMonth, type SchedulerKit } from './SchedulerViews.js';

/** Views of the Scheduler on a phone: list, time grid of a day or a week (a few days in view), compact month */
export type SchedulerMobileView = 'agenda' | 'day' | 'week' | 'month';

/** A moved event: new start and end (series: applyEventChange) */
export interface SchedulerChange {
    event: SchedulerEvent;
    start: string;
    end: string;
    /** Resource of the event – set when the Scheduler has resources */
    resourceId?: string;
    /** Occurrence of a series: only this one or the whole series (see applyEventChange) */
    scope?: RecurrenceScope;
}

/** An empty time or day that was chosen */
export interface SchedulerSlot {
    start: string;
    end: string;
    allDay: boolean;
    /** The resource of the filter – set when one resource is shown */
    resourceId?: string;
}

/** The shown range of dates (end exclusive) and the view – load the events for it */
export interface SchedulerRange {
    start: string;
    end: string;
    view: SchedulerMobileView;
}

export interface SchedulerProps extends ViewProps {
    /** Events; with `dataSource` they are shown together with the loaded ones */
    events?: SchedulerEvent[];
    /** Shown view; controlled together with onViewChange */
    view?: SchedulerMobileView;
    /** View at the start (default `agenda`) */
    defaultView?: SchedulerMobileView;
    onViewChange?: (view: SchedulerMobileView) => void;
    /** Views offered in the toolbar (default all four) */
    views?: SchedulerMobileView[];
    /** Shown date ("2026-10-20"); controlled together with onDateChange */
    date?: string;
    /** Date at the start (default today) */
    defaultDate?: string;
    onDateChange?: (date: string) => void;
    /** First hour of the day and week view (default 7) */
    startHour?: number;
    /** Hour the day and week view end with (default 19) */
    endHour?: number;
    /** Steps for new events and for moving, in minutes (default 30) */
    slotMinutes?: number;
    /** Steps for moving events (drag and the accessibility actions), in minutes – default slotMinutes */
    dragSnapMinutes?: number;
    /** First day of the week: 0 Sunday, 1 Monday (default) */
    weekStartsOn?: number;
    /** Leaves out the weekend days of the locale in the week and month view */
    hideWeekends?: boolean;
    /** Days of the week view in view at once; the others are reached by scrolling sideways (default 3) */
    daysInView?: number;
    /** Time the day and week view scroll to ("08:00") */
    startScrollTime?: string;
    /** Height of the scrolling area below the toolbar in pt (default 480) */
    height?: number;
    /**
     * Events can be moved: accessibility actions on each event (a step or a day earlier/later), buttons in the detail
     * sheet, and long press + drag in the day and week view
     */
    editable?: boolean;
    /** Nothing can be changed or chosen: no moving, no new events */
    readOnly?: boolean;
    /** People, rooms or machines: a filter in the toolbar; events show their resource (and its colour) */
    resources?: SchedulerResource[];
    /** Shown resource (id; empty: all); controlled together with onResourceFilterChange */
    resourceFilter?: string;
    defaultResourceFilter?: string;
    onResourceFilterChange?: (resourceId: string) => void;
    /** Opening hours by weekday – times outside are shaded in the day and week view (resources can have their own) */
    businessHours?: SchedulerBusinessHours[];
    /** Whether an event may be moved there – a refused move is announced */
    canDrop?: (event: SchedulerEvent, start: string, end: string, resourceId?: string) => boolean;
    /** No overlapping events per resource (without resources: at all) */
    preventOverlap?: boolean;
    /** Moving an occurrence of a series: ask (default), or always only this one / the whole series */
    recurrenceEditScope?: 'ask' | RecurrenceScope;
    /** Loads the events of the shown range (`range` of the query) – cancelled when the range changes, cached */
    dataSource?: DataSource<SchedulerEvent>;
    /** How long loaded ranges are reused, in ms (default 0) */
    cacheTime?: number;
    /** Shows the loading state (e.g. while you load on onRangeChange yourself) */
    loading?: boolean;
    /** IANA time zone the times are shown in ("Europe/Berlin"); times with offset are converted, changes get it */
    timeZone?: string;
    /** Accessible name of the calendar (default "Calendar") */
    label?: string;
    /** Level of the title heading (default 2); the day headings are one level below */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    locale?: string;
    /** An event was pressed – without it a sheet shows its details */
    onEventClick?: (event: SchedulerEvent) => void;
    /** An empty time (day and week) or day (month) was chosen – e.g. to create an event there */
    onSlotSelect?: (slot: SchedulerSlot) => void;
    /** An event was moved – apply start and end to your data (series: applyEventChange) */
    onEventChange?: (change: SchedulerChange) => void;
    /** The shown range changed (also at the start) – load its events */
    onRangeChange?: (range: SchedulerRange) => void;
    className?: string;
}

const MOBILE_VIEWS: SchedulerMobileView[] = ['agenda', 'day', 'week', 'month'];
/** Value of "All resources" in the filter (the filter itself is empty then) */
const ALL = '\u0000all';
const LONG_DATE: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
// Today and the current time, per minute
const subscribeMinute = (tick: () => void) => {
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
};
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;

type Times = { start: string; end: string };
type SheetState = { mode: 'detail'; id: string } | { mode: 'series'; id: string; next: Times };

/** The announcement of the loading state */
function loadText(state: DataState<SchedulerEvent>, t: Translations['scheduler'], locale: string) {
    if (state.status === 'loading') return t.loading;
    if (state.status === 'error') return t.error;
    if (state.status === 'success') return pluralText(t.loaded, state.items.length, locale);
    return '';
}

/**
 * Calendar for phones: toolbar (back, today, forward, the period as heading, resource filter, views), agenda as a list
 * per day, day and week as a time grid, a compact month with the events of the chosen day. Events are buttons named
 * with title, time, resource and series; editable events move with accessibility actions, buttons in the detail sheet
 * or by long press and drag.
 */
export function Scheduler({
    events = [],
    view: viewProp,
    defaultView = 'agenda',
    onViewChange,
    views = MOBILE_VIEWS,
    date,
    defaultDate,
    onDateChange,
    startHour = 7,
    endHour = 19,
    slotMinutes = 30,
    dragSnapMinutes,
    weekStartsOn = 1,
    hideWeekends = false,
    daysInView = 3,
    startScrollTime,
    height = 480,
    editable = false,
    readOnly = false,
    resources = [],
    resourceFilter: resourceFilterProp,
    defaultResourceFilter = '',
    onResourceFilterChange,
    businessHours,
    canDrop,
    preventOverlap = false,
    recurrenceEditScope = 'ask',
    dataSource,
    cacheTime = 0,
    loading = false,
    timeZone,
    label,
    headingLevel = 2,
    locale: localeProp,
    onEventClick,
    onSlotSelect,
    onEventChange,
    onRangeChange,
    className,
    ...props
}: SchedulerProps) {
    const styles = scheduler();
    const localeContext = useLocale();
    const translations = localeContext.translations;
    const t = translations.scheduler;
    const locale = localeProp ?? localeContext.locale;
    const { announce, region } = useAnnouncer();

    const shownViews = views.filter((option) => MOBILE_VIEWS.includes(option));
    const [view, setView] = useControllable(viewProp, defaultView, onViewChange);
    const [isoDate, setIsoDate] = useControllable(date, defaultDate ?? toIsoDate(new Date()), onDateChange);
    const [filter, setFilter] = useControllable(resourceFilterProp, defaultResourceFilter, onResourceFilterChange);
    const current = parseLocal(isoDate);
    const setDate = (next: Date) => setIsoDate(toIsoDate(next));
    const openDay = (day: Date) => {
        setDate(day);
        setView('day');
    };

    const days = schedulerDays(view, current, { weekStartsOn, hideWeekends, locale });
    const range = daysRange(days);
    const first = days[0]!;
    const last = days.at(-1)!;
    const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options);
    const longDate = (day: Date) => format(LONG_DATE).format(day);
    const clock = format({ hour: '2-digit', minute: '2-digit' });
    const title =
        view === 'day'
            ? longDate(first)
            : view === 'month'
              ? format({ month: 'long', year: 'numeric' }).format(current)
              : formatDayRange(first, last, locale, { day: 'numeric', month: 'long', year: 'numeric' });
    const nowTime = useSyncExternalStore(subscribeMinute, currentMinute, currentMinute);
    const today = nowIn(timeZone, new Date(nowTime));

    // The shown range: reported (also at the start) and loaded from the data source
    const latest = useRef({ onRangeChange, t, locale, announce });
    useEffect(() => {
        latest.current = { onRangeChange, t, locale, announce };
    });
    useEffect(() => {
        latest.current.onRangeChange?.({ start: range.start, end: range.end, view });
    }, [range.start, range.end, view]);
    const [loaded, setLoaded] = useState<DataState<SchedulerEvent>>({ status: 'idle', items: [] });
    const [controller] = useState(() =>
        createDataController<SchedulerEvent>({
            source: { getItems: async () => ({ items: [] }) },
            onChange: (state) => {
                setLoaded(state);
                latest.current.announce(loadText(state, latest.current.t, latest.current.locale));
            },
        })
    );
    useEffect(() => {
        if (!dataSource) return;
        controller.configure({ source: dataSource, ttl: cacheTime });
        void controller.load({ range: { start: range.start, end: range.end } });
    }, [controller, dataSource, cacheTime, range.start, range.end]);
    useEffect(() => () => controller.abort(), [controller]);
    const busy = loading || loaded.status === 'loading';
    const failed = !!dataSource && loaded.status === 'error';

    // Events: given and loaded, in the time zone, series expanded for the shown range, filtered by resource
    const sourceEvents = dataSource ? [...events, ...loaded.items] : events;
    const sourceById = new Map(sourceEvents.map((event) => [event.id, event]));
    const zoned = timeZone ? sourceEvents.map((event) => zonedEvent(event, timeZone)) : sourceEvents;
    const expanded = expandEvents(zoned, range, timeZone);
    const filtered = filter ? expanded.filter((event) => event.resourceId === filter) : expanded;
    const foreground = filtered.filter((event) => !event.background);
    const backgrounds = filtered.filter((event) => event.background);
    const byId = new Map(expanded.map((event) => [event.id, event]));
    /** The event as reported: the given object, or the occurrence of a series */
    const reported = (event: SchedulerEvent) => sourceById.get(event.id) ?? event;
    const resourceOf = (id?: string) => resources.find((resource) => resource.id === id);
    const filteredResource = resourceOf(filter);
    const seriesText = (event: SchedulerEvent) => {
        const series = event.seriesId ? sourceById.get(event.seriesId) : undefined;
        return series?.rrule
            ? `${t.series}: ${describeRecurrence(series.rrule, translations, locale, series.start)}`
            : t.series;
    };
    const timeText = (event: SchedulerEvent) =>
        event.allDay ? t.allDay : `${clock.format(parseLocal(event.start))}–${clock.format(parseLocal(event.end))}`;
    const whenText = (event: SchedulerEvent, times: Times = event) => {
        const start = parseLocal(times.start);
        const end = parseLocal(times.end);
        if (event.allDay) return sameDay(start, end) ? longDate(start) : formatDayRange(start, end, locale, LONG_DATE);
        return sameDay(start, end)
            ? `${longDate(start)}, ${clock.format(start)}–${clock.format(end)}`
            : `${longDate(start)}, ${clock.format(start)} – ${longDate(end)}, ${clock.format(end)}`;
    };

    // Changes: checked against the rules, asked for series, reported and announced
    const editing = editable && !readOnly;
    const snap = dragSnapMinutes ?? slotMinutes;
    const [sheet, setSheet] = useState<SheetState | null>(null);
    const output = (value: string, allDay?: boolean) =>
        timeZone && !allDay && value.length > 10 ? withZoneOffset(value, timeZone) : value;
    const commit = (event: SchedulerEvent, next: Times, scope?: RecurrenceScope) => {
        announce(t.changed(event.title, whenText(event, next)));
        onEventChange?.({
            event: reported(event),
            start: output(next.start, event.allDay),
            end: output(next.end, event.allDay),
            ...(resources.length && event.resourceId ? { resourceId: event.resourceId } : {}),
            ...(scope ? { scope } : {}),
        });
    };
    const requestChange = (event: SchedulerEvent, next: Times) => {
        if (!editing) return;
        const rejection = checkEventDrop({
            events: expanded,
            event,
            start: next.start,
            end: next.end,
            resourceId: event.resourceId,
            preventOverlap,
            canDrop: canDrop && ((_, start, end, resourceId) => canDrop(reported(event), start, end, resourceId)),
        });
        if (rejection) {
            const reason = rejection.conflict ? t.overlaps(rejection.conflict.title) : t.notAllowed;
            announce(t.rejected(event.title, reason));
            return;
        }
        if (event.seriesId && recurrenceEditScope === 'ask') {
            setSheet({ mode: 'series', id: event.id, next });
            return;
        }
        commit(event, next, event.seriesId ? (recurrenceEditScope as RecurrenceScope) : undefined);
    };
    /** The moves offered for an event: a step and a day earlier or later (all-day events by days only) */
    const shiftsOf = (event: SchedulerEvent) =>
        [
            ...(event.allDay
                ? []
                : [
                      { name: 'earlier', minutes: -snap, days: 0 },
                      { name: 'later', minutes: snap, days: 0 },
                  ]),
            { name: 'dayEarlier', minutes: 0, days: -1 },
            { name: 'dayLater', minutes: 0, days: 1 },
        ].map((shift) => ({ ...shift, label: t.shift(shift.minutes, shift.days) }));
    const move = (event: SchedulerEvent, minutes: number, dayShift: number) =>
        requestChange(event, shiftEvent(event, minutes, dayShift));

    const selectSlot = (day: Date, minutes?: number) => {
        if (!onSlotSelect || readOnly) return;
        const resource = filter ? { resourceId: filter } : {};
        if (minutes === undefined) {
            onSlotSelect({ start: toIsoDate(day), end: toIsoDate(day), allDay: true, ...resource });
            return;
        }
        const start = addMinutes(startOfDay(day), minutes);
        onSlotSelect({
            start: output(toIsoDateTime(start)),
            end: output(toIsoDateTime(addMinutes(start, slotMinutes))),
            allDay: false,
            ...resource,
        });
    };

    const kit: SchedulerKit = {
        t,
        locale,
        name: (event) =>
            [event.title, timeText(event), resourceOf(event.resourceId)?.label, event.seriesId ? t.series : '']
                .filter(Boolean)
                .join(', '),
        time: timeText,
        resource: (event) => resourceOf(event.resourceId)?.label,
        tone: (event) => event.tone ?? resourceOf(event.resourceId)?.tone,
        longDate,
        open: (event) => (onEventClick ? onEventClick(reported(event)) : setSheet({ mode: 'detail', id: event.id })),
        actions: (event) => {
            if (!editing) return {};
            const shifts = shiftsOf(event);
            return {
                accessibilityActions: shifts.map(({ name, label: actionLabel }) => ({ name, label: actionLabel })),
                onAccessibilityAction: (action) => {
                    const shift = shifts.find((entry) => entry.name === action.nativeEvent.actionName);
                    if (shift) move(event, shift.minutes, shift.days);
                },
            };
        },
        slot: onSlotSelect && !readOnly ? selectSlot : undefined,
        today,
    };

    const sheetEvent = sheet ? byId.get(sheet.id) : undefined;
    const sheetResource = resourceOf(sheetEvent?.resourceId);
    const closeSheet = () => setSheet(null);
    const perWeek = hideWeekends && view === 'month' ? 7 - weekendDays(locale).length : 7;
    const level = Math.min(6, headingLevel + 1);

    return (
        <View
            role="region"
            aria-label={label ?? t.label}
            aria-busy={busy || undefined}
            {...props}
            className={styles.base({ class: className })}
        >
            <View className={styles.toolbar()}>
                <Text role="heading" aria-level={headingLevel} aria-live="polite" className={styles.title()}>
                    {title}
                </Text>
                <View className={styles.toolbarRow()}>
                    <View className={styles.nav()}>
                        <IconButton
                            icon={ChevronLeft}
                            label={t.previous}
                            variant="text"
                            size="sm"
                            hitSlop={6}
                            onPress={() => setDate(shiftView(view, current, -1))}
                        />
                        <Button variant="outline" size="sm" onPress={() => setDate(today)}>
                            {t.today}
                        </Button>
                        <IconButton
                            icon={ChevronRight}
                            label={t.next}
                            variant="text"
                            size="sm"
                            hitSlop={6}
                            onPress={() => setDate(shiftView(view, current, 1))}
                        />
                    </View>
                    {resources.length > 0 && (
                        <View className={styles.filter()}>
                            <Select
                                aria-label={t.resourceFilter}
                                size="sm"
                                items={[
                                    { value: ALL, label: t.allResources },
                                    ...resources.map((resource) => ({ value: resource.id, label: resource.label })),
                                ]}
                                value={filter || ALL}
                                onValueChange={(next) => setFilter(next && next !== ALL ? next : '')}
                            />
                        </View>
                    )}
                </View>
                {shownViews.length > 1 && (
                    <SegmentedControl
                        label={t.view}
                        size="sm"
                        block
                        items={shownViews.map((option) => ({ value: option, label: t.views[option] ?? option }))}
                        value={view}
                        onValueChange={(next) => setView(next as SchedulerMobileView)}
                    />
                )}
            </View>
            {busy && <View className={styles.loadingBar()} aria-hidden />}
            {failed && (
                <View role="alert" className={styles.alert()}>
                    <Text className={styles.alertText()}>{t.error}</Text>
                    <Button variant="outline" size="sm" onPress={() => void controller.refresh()}>
                        {t.retry}
                    </Button>
                </View>
            )}

            {view === 'agenda' && (
                <SchedulerAgenda sections={agendaSections(foreground, days)} kit={kit} height={height} level={level} />
            )}
            {(view === 'day' || view === 'week') && (
                <SchedulerTimeGrid
                    kit={kit}
                    days={days}
                    current={current}
                    events={foreground}
                    backgrounds={backgrounds}
                    startHour={startHour}
                    endHour={endHour}
                    snap={snap}
                    daysInView={view === 'day' ? 1 : daysInView}
                    height={height}
                    startScrollTime={startScrollTime}
                    businessHours={filteredResource?.businessHours ?? businessHours}
                    editing={editing}
                    onMove={move}
                    onDayPress={view === 'week' && shownViews.includes('day') ? openDay : undefined}
                />
            )}
            {view === 'month' && (
                <SchedulerMonth
                    weeks={schedulerWeeks(days, perWeek)}
                    current={current}
                    events={foreground}
                    counts={eventCounts(foreground, days)}
                    kit={kit}
                    height={height}
                    title={title}
                    level={level}
                    onSelectDay={setDate}
                />
            )}

            {/* One sheet for the details and the question about a series, so only one modal is shown at a time */}
            <Sheet
                open={!!sheetEvent}
                onClose={closeSheet}
                title={sheet?.mode === 'series' ? t.seriesTitle : (sheetEvent?.title ?? '')}
                {...(sheet?.mode === 'series' && sheetEvent ? { description: t.seriesQuestion(sheetEvent.title) } : {})}
                closeLabel={translations.common.close}
                focusClose
            >
                {!!sheetEvent && sheet?.mode === 'detail' && (
                    <View className={styles.sheetBody()}>
                        <Text className={styles.detailText()}>{whenText(sheetEvent)}</Text>
                        {!!sheetResource && (
                            <Text className={styles.detailMeta()}>{`${t.resource}: ${sheetResource.label}`}</Text>
                        )}
                        {!!sheetEvent.seriesId && <Text className={styles.detailMeta()}>{seriesText(sheetEvent)}</Text>}
                        {editing && (
                            <View className={styles.actions()}>
                                {shiftsOf(sheetEvent).map((shift) => (
                                    <Button
                                        key={shift.name}
                                        variant="outline"
                                        size="sm"
                                        onPress={() => move(sheetEvent, shift.minutes, shift.days)}
                                    >
                                        {shift.label}
                                    </Button>
                                ))}
                            </View>
                        )}
                    </View>
                )}
                {!!sheetEvent && sheet?.mode === 'series' && (
                    <View className={styles.sheetBody()}>
                        <View className={styles.actions()}>
                            <Button
                                onPress={() => {
                                    closeSheet();
                                    commit(sheetEvent, sheet.next, 'occurrence');
                                }}
                            >
                                {t.onlyThis}
                            </Button>
                            <Button
                                variant="outline"
                                onPress={() => {
                                    closeSheet();
                                    commit(sheetEvent, sheet.next, 'series');
                                }}
                            >
                                {t.allInSeries}
                            </Button>
                            <Button variant="text" onPress={closeSheet}>
                                {translations.common.cancel}
                            </Button>
                        </View>
                    </View>
                )}
            </Sheet>
            {region}
        </View>
    );
}
