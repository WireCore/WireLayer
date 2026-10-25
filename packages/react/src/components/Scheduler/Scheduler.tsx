import {
    addMinutes,
    checkEventDrop,
    closedRanges,
    closedTimes,
    createDataController,
    daysRange,
    describeRecurrence,
    eventCounts,
    eventsOn,
    expandRecurrence,
    inColumn,
    layoutDay,
    layoutTimeline,
    nowIn,
    parseLocal,
    pluralText,
    sameDay,
    scheduler as schedulerRecipe,
    resourcePage,
    schedulerColumns,
    schedulerDays,
    SCHEDULER_DRAG_TYPE,
    daysBetween,
    shiftEvent,
    shiftView,
    startOfDay,
    timelineOffset,
    timelineSegments,
    timelineTimeAt,
    toIsoDate,
    toIsoDateTime,
    weekendDays,
    withZoneOffset,
    zonedEvent,
    type DataSource,
    type DataState,
    type OverlayHandle,
    type RecipeClasses,
    type RecurrenceScope,
    type SchedulerBusinessHours,
    type SchedulerColumn,
    type SchedulerDropReason,
    type SchedulerEvent,
    type SchedulerGroupBy,
    type SchedulerOverlapMode,
    type SchedulerResource,
    type SchedulerTimelineRange,
    type SchedulerView,
    type Translations,
} from '@wirecore/wirelayer-recipes';
import { ChevronLeft, ChevronRight, Repeat, ZoomIn, ZoomOut } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type ComponentProps,
    type CSSProperties,
    type DragEvent,
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
} from 'react';
import { Avatar } from '../Avatar/Avatar.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { NativeSelect } from '../NativeSelect/NativeSelect.js';
import { Popover, PopoverContent } from '../Popover/Popover.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { SegmentedControlItem } from '../SegmentedControl/SegmentedControlItem.js';
import { SchedulerSeriesDialog } from './SchedulerSeriesDialog.js';
import { SchedulerYear } from './SchedulerYear.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SchedulerChange {
    event: SchedulerEvent;
    start: string;
    end: string;
    /** New resource – set when the Scheduler has resources */
    resourceId?: string;
    /** Occurrence of a series: only this one or the whole series (see applyEventChange) */
    scope?: RecurrenceScope;
}

export interface SchedulerSlot {
    start: string;
    end: string;
    allDay: boolean;
    /** Resource of the column or row – set when the Scheduler has resources */
    resourceId?: string;
}

/** A move or resize that was not applied */
export interface SchedulerDropRejection {
    event: SchedulerEvent;
    start: string;
    end: string;
    resourceId?: string;
    /** `rule`: canDrop/canResize said no; `overlap`: preventOverlap */
    reason: SchedulerDropReason;
}

/** The shown range of dates (end exclusive) and the view – load the events for it */
export interface SchedulerRange {
    start: string;
    end: string;
    view: SchedulerView;
}

/** Something dragged in from outside (e.g. a list of unplanned orders) and dropped on a time */
export interface SchedulerExternalDrop {
    /** The JSON of the `application/x-wirecore-event` data, else null */
    data: unknown;
    /** The text of the drag (text/plain) */
    text: string;
    start: string;
    end: string;
    allDay: boolean;
    resourceId?: string;
}

/** An event dragged out of the calendar and released outside of it */
export interface SchedulerDropOutside {
    event: SchedulerEvent;
    clientX: number;
    clientY: number;
    /** Element under the pointer */
    target: Element | null;
}

export interface SchedulerProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue'> {
    /** Events; with `dataSource` they are shown together with the loaded ones */
    events?: readonly SchedulerEvent[];
    /** Shown view; controlled together with onViewChange */
    view?: SchedulerView;
    defaultView?: SchedulerView;
    onViewChange?: (view: SchedulerView) => void;
    /** Shown date ("2026-10-20"); controlled together with onDateChange */
    date?: string;
    defaultDate?: string;
    onDateChange?: (date: string) => void;
    /** Views offered in the toolbar ('timeline' and 'year' as well) */
    views?: readonly SchedulerView[];
    /** Hours shown in the day and week view (and the day of the timeline) */
    startHour?: number;
    endHour?: number;
    /** Steps for creating, moving and resizing events, in minutes */
    slotMinutes?: number;
    /** Steps for moving events (dragging and Alt+arrow keys), in minutes – default slotMinutes */
    dragSnapMinutes?: number;
    /** Steps for resizing events, in minutes – default slotMinutes */
    resizeSnapMinutes?: number;
    /** First day of the week: 0 Sunday, 1 Monday */
    weekStartsOn?: number;
    /** Events can be moved and resized: drag (day, week, timeline; moved by days in the month), or Alt(+Shift)+arrow keys on the event */
    editable?: boolean;
    /** Nothing can be changed or chosen: no moving, no new events, no drops */
    readOnly?: boolean;
    /** Height of the time grid (CSS length); it scrolls inside */
    height?: string;
    /** Time the day and week view scroll to at the start ("08:00") */
    startScrollTime?: string;
    /** People, rooms or machines: columns in the day and week view, rows in the timeline, a filter in the toolbar */
    resources?: readonly SchedulerResource[];
    /**
     * Day and week view with many resources: at most this many resources as columns at a time, buttons in the toolbar
     * page through them (default: all, side by side)
     */
    resourcesPerPage?: number;
    /** Resource columns per day (`date`, default) or per resource */
    groupBy?: SchedulerGroupBy;
    /** Shown resource (id; empty: all); controlled together with onResourceFilterChange */
    resourceFilter?: string;
    defaultResourceFilter?: string;
    onResourceFilterChange?: (resourceId: string) => void;
    /** Span of the timeline: a day in hours, a week or a month in days; controlled with onTimelineRangeChange */
    timelineRange?: SchedulerTimelineRange;
    defaultTimelineRange?: SchedulerTimelineRange;
    onTimelineRangeChange?: (range: SchedulerTimelineRange) => void;
    /** Zoom of the timeline (0.5–3, width of its slots); controlled together with onZoomChange */
    zoom?: number;
    defaultZoom?: number;
    onZoomChange?: (zoom: number) => void;
    /** Opening hours by weekday – times outside are hatched (resources can have their own) */
    businessHours?: readonly SchedulerBusinessHours[];
    /** Leaves out the weekend days of the locale in the week, month and timeline views */
    hideWeekends?: boolean;
    /** Overlapping events side by side (`columns`, default) or stacked with an offset */
    overlapMode?: SchedulerOverlapMode;
    /** Whether an event may be dropped there – a refused move is marked, announced and reported (onDropRejected) */
    canDrop?: (event: SchedulerEvent, start: string, end: string, resourceId?: string) => boolean;
    /** Whether an event may get this length */
    canResize?: (event: SchedulerEvent, start: string, end: string) => boolean;
    /** No overlapping events per resource (without resources: at all) */
    preventOverlap?: boolean;
    /** Moving an occurrence of a series: ask (default), or always only this one / the whole series */
    recurrenceEditScope?: 'ask' | RecurrenceScope;
    /** Events shown per day in the month before "+N more" */
    monthEventLimit?: number;
    /** "+N more" opens a popover with all events of the day (instead of the day view) */
    morePopover?: boolean;
    /** Below this width (px) the month view becomes a compact month with the list of the chosen day below */
    compactBreakpoint?: number;
    /** Accepts items dragged in from outside (application/x-wirecore-event or text) – see onExternalDrop */
    droppable?: boolean;
    /** Loads the events of the shown range (`range` of the query) – cancelled when the range changes, cached */
    dataSource?: DataSource<SchedulerEvent>;
    /** How long loaded ranges are reused, in ms (default 0) */
    cacheTime?: number;
    /** Shows the loading state (e.g. while you load on onRangeChange yourself) */
    loading?: boolean;
    /** IANA time zone the times are shown in ("Europe/Berlin"); times with offset are converted, changes get it */
    timeZone?: string;
    /** Accessible name of the calendar */
    label?: string;
    /** Level of the title heading */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    locale?: string;
    /** An event was clicked (or chosen with Enter/Space) */
    onEventClick?: (event: SchedulerEvent) => void;
    /** An empty time or day was chosen – e.g. to create an event there */
    onSlotSelect?: (slot: SchedulerSlot) => void;
    /** An event was moved or resized – apply start and end to your data (series: applyEventChange) */
    onEventChange?: (change: SchedulerChange) => void;
    /** A move or resize was refused by canDrop, canResize or preventOverlap */
    onDropRejected?: (rejection: SchedulerDropRejection) => void;
    /** The shown range changed (also at the start) – load its events */
    onRangeChange?: (range: SchedulerRange) => void;
    /** Something from outside was dropped on a time (droppable) */
    onExternalDrop?: (drop: SchedulerExternalDrop) => void;
    /** An event was dragged out of the calendar */
    onEventDropOutside?: (drop: SchedulerDropOutside) => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof schedulerRecipe>;
}

const HOUR = 48;
const LANE = 30;
const VIRTUAL_ROWS = 40;
const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3];
const MOVE_KEYS = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Alt+Shift+ArrowUp Alt+Shift+ArrowDown';
// Today and the current time, per minute – none on the server, so server and client render alike
const subscribeMinute = (tick: () => void) => {
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
};
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const noTime = () => null;
const minutesOf = (value: string) => {
    const [hour = 0, minute = 0] = value.split(':').map(Number);
    return hour * 60 + minute;
};
const roundTo = (date: Date, minutes: number) => {
    const ofDay = date.getHours() * 60 + date.getMinutes();
    return addMinutes(startOfDay(date), Math.round(ofDay / minutes) * minutes);
};

/** The JSON of dragged data, null when there is none or it is no JSON */
const readJson = (text: string | undefined): unknown => {
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
};

type Preview = { start: string; end: string; resourceId?: string };
interface Drag {
    id: string;
    resize: boolean;
    preview: Preview | null;
    invalid: boolean;
}
interface TimelineRow {
    key: string;
    group?: string;
    resource?: SchedulerResource;
    items: ReturnType<typeof layoutTimeline>;
    top: number;
    height: number;
    index: number;
}

/** The announcement of the loading state */
function loadText(state: DataState<SchedulerEvent>, t: Translations['scheduler'], locale: string) {
    if (state.status === 'loading') return t.loading;
    if (state.status === 'error') return t.error;
    if (state.status === 'success') return pluralText(t.loaded, state.items.length, locale);
    return '';
}

/** Calendar: toolbar (today, back/forward, title, views); events are buttons named by title and time */
export function Scheduler({
    events = [],
    view: viewProp,
    defaultView = 'week',
    onViewChange,
    date,
    defaultDate,
    onDateChange,
    views = ['day', 'week', 'month', 'agenda'],
    startHour = 7,
    endHour = 19,
    slotMinutes = 30,
    dragSnapMinutes,
    resizeSnapMinutes,
    weekStartsOn = 1,
    editable = false,
    readOnly = false,
    height = '600px',
    startScrollTime,
    resources,
    groupBy = 'date',
    resourceFilter: resourceFilterProp,
    resourcesPerPage,
    defaultResourceFilter = '',
    onResourceFilterChange,
    timelineRange: timelineRangeProp,
    defaultTimelineRange = 'week',
    onTimelineRangeChange,
    zoom: zoomProp,
    defaultZoom = 1,
    onZoomChange,
    businessHours,
    hideWeekends = false,
    overlapMode = 'columns',
    canDrop,
    canResize,
    preventOverlap = false,
    recurrenceEditScope = 'ask',
    monthEventLimit = 3,
    morePopover = false,
    compactBreakpoint,
    droppable = false,
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
    onDropRejected,
    onRangeChange,
    onExternalDrop,
    onEventDropOutside,
    classes,
    className,
    ...props
}: SchedulerProps) {
    const scheduler = useRecipe('scheduler', schedulerRecipe, classes);
    const styles = scheduler();
    const localeContext = useLocale();
    const translations = useTranslations();
    const t = translations.scheduler;
    const locale = localeProp ?? localeContext.locale;
    const rtl = localeContext.dir === 'rtl';

    const [internalView, setInternalView] = useState(defaultView);
    const view = viewProp ?? internalView;
    const [internalDate, setInternalDate] = useState(() => defaultDate ?? toIsoDate(new Date()));
    const current = parseLocal(date ?? internalDate);
    const [internalFilter, setInternalFilter] = useState(defaultResourceFilter);
    const resourceFilter = resourceFilterProp ?? internalFilter;
    const [internalRange, setInternalRange] = useState(defaultTimelineRange);
    const timelineRange = timelineRangeProp ?? internalRange;
    const [internalZoom, setInternalZoom] = useState(defaultZoom);
    const zoom = zoomProp ?? internalZoom;
    const setView = (next: SchedulerView) => {
        setInternalView(next);
        onViewChange?.(next);
    };
    const setDate = (next: Date) => {
        setInternalDate(toIsoDate(next));
        onDateChange?.(toIsoDate(next));
    };
    const openDay = (day: Date) => {
        setDate(day);
        setView('day');
    };
    const setFilter = (next: string) => {
        setInternalFilter(next);
        onResourceFilterChange?.(next);
    };
    const setRange = (next: SchedulerTimelineRange) => {
        setInternalRange(next);
        onTimelineRangeChange?.(next);
    };
    const setZoom = (step: 1 | -1) => {
        const index = ZOOMS.findIndex((value) => value >= zoom);
        const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (index < 0 ? ZOOMS.length - 1 : index) + step))]!;
        setInternalZoom(next);
        onZoomChange?.(next);
    };

    const days = schedulerDays(view, current, { weekStartsOn, hideWeekends, locale, timelineRange });
    const perWeek = hideWeekends && view === 'month' ? 7 - weekendDays(locale).length : 7;
    const weeks = Array.from({ length: Math.ceil(days.length / perWeek) }, (_, index) =>
        days.slice(index * perWeek, index * perWeek + perWeek)
    );
    const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
    const totalMinutes = (endHour - startHour) * 60;
    const range = daysRange(days);

    const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options);
    const longDate = (day: Date) =>
        format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(day);
    const time = (value: Date) => format({ hour: '2-digit', minute: '2-digit' }).format(value);
    const timeRange = (event: SchedulerEvent) =>
        event.allDay ? t.allDay : `${time(parseLocal(event.start))}–${time(parseLocal(event.end))}`;
    const first = days[0]!;
    const last = days.at(-1)!;
    const span = view === 'timeline' ? timelineRange : view;
    const title =
        span === 'year'
            ? format({ year: 'numeric' }).format(current)
            : span === 'day'
              ? longDate(first)
              : span === 'month'
                ? format({ month: 'long', year: 'numeric' }).format(current)
                : format({ day: 'numeric', month: 'long', year: 'numeric' }).formatRange(first, last);
    const weekday = (day: Date) => format({ weekday: 'short' }).format(day);
    const hourLabel = (hour: number) => time(new Date(2000, 0, 1, hour));

    const nowTime = useSyncExternalStore(subscribeMinute, currentMinute, noTime);
    const wallNow = nowTime === null ? null : nowIn(timeZone, new Date(nowTime));
    const isToday = (day: Date) => !!wallNow && sameDay(day, wallNow);
    const nowTop = wallNow
        ? ((wallNow.getHours() * 60 + wallNow.getMinutes() - startHour * 60) / totalMinutes) * 100
        : -1;

    // The shown range: reported (also at the start) and loaded from the data source
    const latest = useRef({ onRangeChange, t, locale });
    useEffect(() => {
        latest.current = { onRangeChange, t, locale };
    });
    useEffect(() => {
        latest.current.onRangeChange?.({ start: range.start, end: range.end, view });
    }, [range.start, range.end, view]);
    const [status, setStatus] = useState('');
    const [loaded, setLoaded] = useState<DataState<SchedulerEvent>>({ status: 'idle', items: [] });
    const [controller] = useState(() =>
        createDataController<SchedulerEvent>({
            source: { getItems: async () => ({ items: [] }) },
            onChange: (state) => {
                setLoaded(state);
                setStatus(loadText(state, latest.current.t, latest.current.locale));
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
    const failed = loaded.status === 'error';

    // Events: given and loaded, in the time zone, series expanded for the shown range, filtered by resource
    const sourceEvents = dataSource ? [...events, ...loaded.items] : events;
    const sourceById = new Map(sourceEvents.map((event) => [event.id, event]));
    const zoned = timeZone ? sourceEvents.map((event) => zonedEvent(event, timeZone)) : sourceEvents;
    const expanded = zoned.some((event) => event.rrule)
        ? zoned.flatMap((event) => (event.rrule ? expandRecurrence(event, range, timeZone) : [event]))
        : zoned;
    const resourceList = resources ?? [];
    const visibleResources = resourceFilter
        ? resourceList.filter((resource) => resource.id === resourceFilter)
        : resourceList;
    const filtered = resourceFilter ? expanded.filter((event) => event.resourceId === resourceFilter) : expanded;
    const baseById = new Map(expanded.map((event) => [event.id, event]));
    /** The event in wall-clock time (for calculations) */
    const base = (id: string) => baseById.get(id)!;
    /** The event as reported: the given object, or the occurrence of a series */
    const reported = (id: string) => sourceById.get(id) ?? base(id);
    const seriesTexts = new Map(
        sourceEvents
            .filter((event) => event.rrule)
            .map((event) => [
                event.id,
                `${t.series}: ${describeRecurrence(event.rrule!, translations, locale, event.start)}`,
            ])
    );
    const seriesText = (event: SchedulerEvent) => (event.seriesId ? (seriesTexts.get(event.seriesId) ?? t.series) : '');
    const resourceOf = (id?: string) => resourceList.find((resource) => resource.id === id);
    const toneOf = (event: SchedulerEvent) => event.tone ?? resourceOf(event.resourceId)?.tone;

    // Dragging: a preview while the pointer moves (marked when it may not be dropped), the change on release
    const [drag, setDrag] = useState<Drag | null>(null);
    const dragStart = useRef({
        x: 0,
        y: 0,
        width: 1,
        perMinute: 1,
        moved: false,
        column: 0,
        timeline: false,
        offset: 0,
        length: 0,
        row: 0,
        // Month view: the day the event was taken from (moved by whole days to the cell under the pointer)
        month: false,
        anchor: '',
    });
    const suppressClick = useRef(false);
    const foreground = filtered
        .filter((event) => !event.background)
        .map((event) => (drag?.id === event.id && drag.preview ? { ...event, ...drag.preview } : event));
    const backgrounds = filtered.filter((event) => event.background);
    const snap = (resize: boolean) => (resize ? resizeSnapMinutes : dragSnapMinutes) ?? slotMinutes;
    const editing = editable && !readOnly;
    const checkPreview = (id: string, next: Preview, resize: boolean) => {
        const event = base(id);
        return checkEventDrop({
            events: expanded,
            event,
            start: next.start,
            end: next.end,
            resourceId: next.resourceId ?? event.resourceId,
            resize,
            preventOverlap,
            canDrop: canDrop && ((_, start, end, resourceId) => canDrop(reported(id), start, end, resourceId)),
            canResize: canResize && ((_, start, end) => canResize(reported(id), start, end)),
        });
    };
    const setPreview = (next: Preview | null) =>
        setDrag(
            (old) =>
                old && {
                    ...old,
                    preview: next,
                    invalid: !!next && !!checkPreview(old.id, next, old.resize),
                }
        );

    // Changes: checked against the rules, asked for series, reported, announced; the focus follows the event
    const root = useRef<HTMLDivElement>(null);
    const focusAfter = useRef<string | null>(null);
    const seriesFocus = useRef('');
    const [pending, setPending] = useState<{ id: string; next: Preview } | null>(null);
    const eventElement = (id: string) =>
        root.current?.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(id)}"]`) ?? null;
    useEffect(() => {
        if (!focusAfter.current) return;
        eventElement(focusAfter.current)?.focus();
        focusAfter.current = null;
    }, [events]);
    const output = (value: string, allDay?: boolean) =>
        timeZone && !allDay && value.length > 10 ? withZoneOffset(value, timeZone) : value;
    const whenText = (event: SchedulerEvent, next: Preview) => {
        const start = parseLocal(next.start);
        const when = event.allDay
            ? longDate(start)
            : `${longDate(start)}, ${time(start)}–${time(parseLocal(next.end))}`;
        const resource = next.resourceId ? resourceOf(next.resourceId) : undefined;
        return resource && next.resourceId !== event.resourceId ? `${when}, ${resource.label}` : when;
    };
    const commit = (id: string, next: Preview, scope?: RecurrenceScope) => {
        const event = base(id);
        setStatus(t.changed(event.title, whenText(event, next)));
        focusAfter.current = id;
        onEventChange?.({
            event: reported(id),
            start: output(next.start, event.allDay),
            end: output(next.end, event.allDay),
            ...(resourceList.length && next.resourceId ? { resourceId: next.resourceId } : {}),
            ...(scope ? { scope } : {}),
        });
    };
    const requestChange = (id: string, next: Preview, resize: boolean) => {
        if (!editing) return;
        const event = base(id);
        const target = { ...next, resourceId: next.resourceId ?? event.resourceId };
        const rejection = checkPreview(id, target, resize);
        if (rejection) {
            const reason = rejection.conflict ? t.overlaps(rejection.conflict.title) : t.notAllowed;
            setStatus(t.rejected(event.title, reason));
            onDropRejected?.({
                event: reported(id),
                start: output(target.start, event.allDay),
                end: output(target.end, event.allDay),
                ...(target.resourceId ? { resourceId: target.resourceId } : {}),
                reason: rejection.reason,
            });
            return;
        }
        if (event.seriesId && recurrenceEditScope === 'ask') {
            seriesFocus.current = id;
            setPending({ id, next: target });
            return;
        }
        commit(id, target, event.seriesId ? (recurrenceEditScope as RecurrenceScope) : undefined);
    };
    const onSeriesChoice = (scope: RecurrenceScope | null) => {
        const request = pending;
        setPending(null);
        if (request && scope) commit(request.id, request.next, scope);
    };

    // Day and week: columns per day, with resources per day and resource (a page of them with resourcesPerPage)
    const timeGrid = view === 'day' || view === 'week';
    const [resourcePageIndex, setResourcePage] = useState(0);
    const pageOfResources = resourcePage(visibleResources, resourcePageIndex, timeGrid ? resourcesPerPage : undefined);
    const gridResources = pageOfResources.items;
    const columns = schedulerColumns(days, timeGrid ? gridResources : [], groupBy);
    const headGroups =
        groupBy === 'resource'
            ? gridResources.map((resource) => ({
                  key: resource.id,
                  resource,
                  day: undefined,
                  span: days.length,
              }))
            : days.map((day) => ({
                  key: String(day.getTime()),
                  day,
                  resource: undefined,
                  span: gridResources.length,
              }));
    const columnLabel = (column: SchedulerColumn) =>
        column.resource ? `${longDate(column.day)}, ${column.resource.label}` : longDate(column.day);
    const hoursOf = (resource?: SchedulerResource) => resource?.businessHours ?? businessHours;
    const allDayEvents = (column: SchedulerColumn) =>
        eventsOn(foreground, column.day).filter((event) => event.allDay && inColumn(event, column));
    const backgroundsIn = (column: SchedulerColumn) =>
        eventsOn(backgrounds, column.day).filter((event) => !event.resourceId || inColumn(event, column));
    const eventPlace = (item: { top: number; height: number; column: number; columns: number }): CSSProperties =>
        overlapMode === 'stack'
            ? {
                  top: `${item.top}%`,
                  height: `${item.height}%`,
                  insetInlineStart: `${item.column * 1.25}rem`,
                  width: `calc(100% - ${item.column * 1.25}rem)`,
              }
            : {
                  top: `${item.top}%`,
                  height: `${item.height}%`,
                  insetInlineStart: `${(item.column / item.columns) * 100}%`,
                  width: `${100 / item.columns}%`,
              };

    // Timeline: resources as rows (stacked lanes for overlapping events), time along the row
    const segments = timelineSegments(days, timelineRange, startHour, endHour);
    const slotWidth = Math.round((timelineRange === 'day' ? 64 : timelineRange === 'week' ? 160 : 48) * zoom);
    const pxPerMinute = slotWidth / (timelineRange === 'day' ? 60 : 1440);
    const axisMinutes = segments.reduce((sum, segment) => sum + segment.minutes, 0);
    const timelineSlots =
        timelineRange === 'day'
            ? hours.map((hour) => ({ key: hour, label: hourLabel(hour), sub: '' }))
            : days.map((day) => ({
                  key: day.getTime(),
                  label: format(
                      timelineRange === 'week'
                          ? { weekday: 'short', day: 'numeric', month: 'numeric' }
                          : { day: 'numeric' }
                  ).format(day),
                  sub: timelineRange === 'month' ? format({ weekday: 'narrow' }).format(day) : '',
              }));
    const timelineRows: TimelineRow[] = [];
    if (view === 'timeline') {
        let top = 0;
        let lastGroup: string | undefined;
        visibleResources.forEach((resource, index) => {
            if (resource.group && resource.group !== lastGroup) {
                timelineRows.push({
                    key: `group-${resource.group}`,
                    group: resource.group,
                    items: [],
                    top,
                    height: LANE,
                    index: -1,
                });
                top += LANE;
            }
            lastGroup = resource.group;
            const items = layoutTimeline(
                foreground.filter((event) => event.resourceId === resource.id),
                segments
            );
            const rowHeight = Math.max(1, items[0]?.lanes ?? 1) * LANE + 12;
            timelineRows.push({ key: resource.id, resource, items, top, height: rowHeight, index });
            top += rowHeight;
        });
    }
    const timelineHeight = timelineRows.reduce((sum, row) => sum + row.height, 0);
    const timelineItem = (id: string) => {
        for (const row of timelineRows) {
            const item = row.items.find((entry) => entry.event.id === id);
            if (item) return { ...item, row: row.index };
        }
        return undefined;
    };
    // Window of rows for many resources: only the rows in view (and some around) are rendered
    const [scroll, setScroll] = useState({ top: 0, viewport: 600 });
    const virtual = visibleResources.length > VIRTUAL_ROWS;
    const windowRows = (() => {
        if (!virtual) return { rows: timelineRows, before: 0, after: 0 };
        const from = scroll.top - 400;
        const to = scroll.top + scroll.viewport + 400;
        const rows = timelineRows.filter((row) => row.top + row.height > from && row.top < to);
        const lastRow = rows.at(-1);
        return {
            rows,
            before: rows[0]?.top ?? 0,
            after: timelineHeight - (lastRow ? lastRow.top + lastRow.height : 0),
        };
    })();
    const timelineScroll = useRef<HTMLDivElement>(null);
    const scrollFrame = useRef(0);
    useEffect(() => {
        const element = timelineScroll.current;
        if (element) setScroll((old) => ({ ...old, viewport: element.clientHeight || 600 }));
    }, [view]);
    const onTimelineScroll = () => {
        if (!virtual) return;
        cancelAnimationFrame(scrollFrame.current);
        scrollFrame.current = requestAnimationFrame(() =>
            setScroll({
                top: timelineScroll.current?.scrollTop ?? 0,
                viewport: timelineScroll.current?.clientHeight || 600,
            })
        );
    };
    const timelineClosed = (resource?: SchedulerResource) => {
        const open = hoursOf(resource);
        if (!open) return [];
        let offset = 0;
        return segments.flatMap((segment) => {
            const from = segment.start.getHours() * 60 + segment.start.getMinutes();
            const blocks = closedRanges(open, segment.start)
                .map(([start, end]) => [Math.max(start, from), Math.min(end, from + segment.minutes)] as const)
                .filter(([start, end]) => end > start)
                .map(([start, end]) => ({
                    left: (offset + start - from) * pxPerMinute,
                    width: (end - start) * pxPerMinute,
                }));
            offset += segment.minutes;
            return blocks;
        });
    };
    const timelineBackgrounds = (resource?: SchedulerResource) =>
        layoutTimeline(
            backgrounds.filter((event) => !event.resourceId || event.resourceId === resource?.id),
            segments
        );
    const nowOffset = wallNow ? timelineOffset(segments, wallNow) : 0;
    const nowLeft = wallNow && nowOffset > 0 && nowOffset < axisMinutes ? nowOffset * pxPerMinute : -1;
    const timelinePreview = (event: SchedulerEvent, minutes: number, dy: number, resize: boolean) => {
        const rows = timelineRows.filter((row) => row.resource);
        const startRow = timelineRows.find((row) => row.index === dragStart.current.row);
        const y = (startRow ? startRow.top + startRow.height / 2 : 0) + dy;
        const target = resize ? undefined : rows.find((row) => y >= row.top && y < row.top + row.height)?.resource;
        const resourceId = target?.id ?? event.resourceId;
        let next: { start: string; end: string };
        if (event.allDay) next = shiftEvent(event, 0, Math.round(minutes / 1440), resize);
        else if (resize) {
            const end = roundTo(
                timelineTimeAt(segments, dragStart.current.offset + dragStart.current.length + minutes),
                snap(true)
            );
            const start = parseLocal(event.start);
            next = { start: event.start, end: toIsoDateTime(end > start ? end : addMinutes(start, snap(true))) };
        } else {
            const start = roundTo(timelineTimeAt(segments, dragStart.current.offset + minutes), snap(false));
            const duration = parseLocal(event.end).getTime() - parseLocal(event.start).getTime();
            next = { start: toIsoDateTime(start), end: toIsoDateTime(new Date(start.getTime() + duration)) };
        }
        if (next.start === event.start && next.end === event.end && resourceId === event.resourceId) return null;
        return { ...next, resourceId };
    };

    // Pointer handlers read the newest render through a ref (the window listeners stay the same)
    const onPointerMove = (pointer: globalThis.PointerEvent) => {
        if (!drag) return;
        const start = dragStart.current;
        const dx = pointer.clientX - start.x;
        const dy = pointer.clientY - start.y;
        start.moved ||= Math.abs(dx) > 3 || Math.abs(dy) > 3;
        if (!start.moved) return;
        const event = base(drag.id);
        const direction = rtl ? -1 : 1;
        if (start.month) {
            const cell = document
                .elementFromPoint(pointer.clientX, pointer.clientY)
                ?.closest<HTMLElement>('[data-month-day]');
            const days = cell && root.current?.contains(cell) ? daysBetween(start.anchor, cell.dataset.monthDay!) : 0;
            return setPreview(days ? shiftEvent(event, 0, days, false) : null);
        }
        if (start.timeline)
            return setPreview(timelinePreview(event, (direction * dx) / start.perMinute, dy, drag.resize));
        const minutes = Math.round(dy / start.perMinute / snap(drag.resize)) * snap(drag.resize);
        const shift = drag.resize ? 0 : Math.round((direction * dx) / start.width);
        if (!resourceList.length) {
            const dayShift = view === 'day' ? 0 : shift;
            if (!minutes && !dayShift) return setPreview(null);
            return setPreview(shiftEvent(event, minutes, dayShift, drag.resize));
        }
        const from = columns[start.column]!;
        const target = columns[Math.min(columns.length - 1, Math.max(0, start.column + shift))]!;
        const dayShift = Math.round((startOfDay(target.day).getTime() - startOfDay(from.day).getTime()) / 86_400_000);
        if (!minutes && !dayShift && target.resource?.id === event.resourceId) return setPreview(null);
        setPreview({ ...shiftEvent(event, minutes, dayShift, drag.resize), resourceId: target.resource?.id });
    };
    const onPointerUp = (pointer: globalThis.PointerEvent) => {
        const done = drag;
        setDrag(null);
        suppressClick.current = dragStart.current.moved;
        if (!done) return;
        const box = root.current?.getBoundingClientRect();
        const outside =
            dragStart.current.moved &&
            !!box &&
            (pointer.clientX < box.left ||
                pointer.clientX > box.right ||
                pointer.clientY < box.top ||
                pointer.clientY > box.bottom);
        if (outside) {
            onEventDropOutside?.({
                event: reported(done.id),
                clientX: pointer.clientX,
                clientY: pointer.clientY,
                target: document.elementFromPoint(pointer.clientX, pointer.clientY),
            });
            return;
        }
        if (done.preview) requestChange(done.id, done.preview, done.resize);
    };
    const handlers = useRef({ move: onPointerMove, up: onPointerUp });
    useEffect(() => {
        handlers.current = { move: onPointerMove, up: onPointerUp };
    });
    const dragging = drag !== null;
    useEffect(() => {
        if (!dragging) return;
        const move = (pointer: globalThis.PointerEvent) => handlers.current.move(pointer);
        const up = (pointer: globalThis.PointerEvent) => handlers.current.up(pointer);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up, { once: true });
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, [dragging]);
    const onPointerDown = (id: string, resize: boolean, pointer: PointerEvent<HTMLElement>, column = 0) => {
        const event = base(id);
        const month = view === 'month';
        if (!editing || pointer.button !== 0 || (event.allDay && view !== 'timeline' && !month)) return;
        if (resize) pointer.stopPropagation();
        const timeline = view === 'timeline';
        const box = pointer.currentTarget.closest<HTMLElement>(
            timeline ? '[data-timeline-track]' : month ? '[data-month-day]' : '[data-day-column]'
        )!;
        const item = timeline ? timelineItem(id) : undefined;
        dragStart.current = {
            x: pointer.clientX,
            y: pointer.clientY,
            width: box.offsetWidth,
            perMinute: timeline ? pxPerMinute : box.offsetHeight / totalMinutes,
            moved: false,
            column,
            timeline,
            offset: item?.offset ?? 0,
            length: item?.length ?? 0,
            row: item?.row ?? 0,
            month,
            anchor: box.dataset.monthDay ?? '',
        };
        setDrag({ id, resize, preview: null, invalid: false });
    };
    const onEventKey = (id: string, key: KeyboardEvent) => {
        if (!editing || !key.altKey) return;
        const event = base(id);
        const direction = rtl ? -1 : 1;
        const horizontal: Record<string, number> = { ArrowLeft: -direction, ArrowRight: direction };
        const resourceIndex = visibleResources.findIndex((resource) => resource.id === event.resourceId);
        if (view === 'timeline') {
            if (key.key === 'ArrowUp' || key.key === 'ArrowDown') {
                if (key.shiftKey) return;
                const target = visibleResources[resourceIndex + (key.key === 'ArrowUp' ? -1 : 1)];
                key.preventDefault();
                if (target) requestChange(id, { start: event.start, end: event.end, resourceId: target.id }, false);
                return;
            }
            const step = horizontal[key.key];
            if (!step) return;
            key.preventDefault();
            const byDays = event.allDay || timelineRange !== 'day';
            const next = byDays
                ? shiftEvent(event, 0, step, key.shiftKey)
                : shiftEvent(event, step * snap(key.shiftKey), 0, key.shiftKey);
            requestChange(id, next, key.shiftKey);
            return;
        }
        const month = view === 'month' || event.allDay;
        if (key.shiftKey && !month && resourceList.length && horizontal[key.key]) {
            const index = resourceIndex + horizontal[key.key]!;
            const target = visibleResources[index];
            key.preventDefault();
            if (!target) return;
            // A resource on another page: the page follows the event
            if (resourcesPerPage) setResourcePage(Math.floor(index / resourcesPerPage));
            requestChange(id, { start: event.start, end: event.end, resourceId: target.id }, false);
            return;
        }
        const step = snap(key.shiftKey);
        const moves: Record<string, [number, number]> = {
            ArrowUp: month ? [0, -7] : [-step, 0],
            ArrowDown: month ? [0, 7] : [step, 0],
            ArrowLeft: [0, -direction],
            ArrowRight: [0, direction],
        };
        const move = moves[key.key];
        if (!move || (key.shiftKey && (month || move[1] !== 0))) return;
        key.preventDefault();
        requestChange(id, shiftEvent(event, move[0], move[1], key.shiftKey), key.shiftKey);
    };
    const keyShortcuts = !editing
        ? undefined
        : view === 'timeline'
          ? 'Alt+ArrowLeft Alt+ArrowRight Alt+Shift+ArrowLeft Alt+Shift+ArrowRight Alt+ArrowUp Alt+ArrowDown'
          : resourceList.length
            ? `${MOVE_KEYS} Alt+Shift+ArrowLeft Alt+Shift+ArrowRight`
            : MOVE_KEYS;
    const onEventClickInternal = (id: string) => {
        if (suppressClick.current) {
            suppressClick.current = false;
            return;
        }
        onEventClick?.(reported(id));
    };

    // Choosing empty time: a click into the column, or the "new event" button at the top of each day (keyboard)
    const selectTime = (day: Date, minutes: number, resourceId?: string) => {
        if (readOnly) return;
        const start = addMinutes(startOfDay(day), startHour * 60 + minutes);
        onSlotSelect?.({
            start: output(toIsoDateTime(start)),
            end: output(toIsoDateTime(addMinutes(start, slotMinutes))),
            allDay: false,
            ...(resourceId ? { resourceId } : {}),
        });
    };
    const minutesAt = (pointer: MouseEvent<HTMLElement>) => {
        const box = pointer.currentTarget.getBoundingClientRect();
        if (!box.height) return 0;
        const minutes = ((pointer.clientY - box.top) / box.height) * totalMinutes;
        return Math.max(0, Math.floor(minutes / slotMinutes) * slotMinutes);
    };
    const onColumnClick = (day: Date, pointer: MouseEvent<HTMLElement>, resourceId?: string) => {
        if (pointer.target !== pointer.currentTarget) return;
        selectTime(day, minutesAt(pointer), resourceId);
    };
    const selectDay = (day: Date, pointer?: MouseEvent<HTMLElement>, resourceId?: string) => {
        if (readOnly || (pointer && pointer.target !== pointer.currentTarget)) return;
        const id = resourceId ?? (resourceFilter || undefined);
        onSlotSelect?.({
            start: toIsoDate(day),
            end: toIsoDate(day),
            allDay: true,
            ...(id ? { resourceId: id } : {}),
        });
    };

    // Dropping from outside: application/x-wirecore-event (JSON with title, duration in minutes …) or text
    const accepts = (dragEvent: DragEvent) =>
        droppable &&
        !readOnly &&
        [...dragEvent.dataTransfer.types].some((type) => type === SCHEDULER_DRAG_TYPE || type === 'text/plain');
    const onDragOver = (dragEvent: DragEvent) => {
        if (!accepts(dragEvent)) return;
        dragEvent.preventDefault();
        dragEvent.dataTransfer.dropEffect = 'copy';
    };
    const onDrop = (
        dragEvent: DragEvent<HTMLElement>,
        day: Date,
        options: { allDay?: boolean; resourceId?: string; start?: Date } = {}
    ) => {
        if (!accepts(dragEvent)) return;
        dragEvent.preventDefault();
        const text = dragEvent.dataTransfer.getData('text/plain');
        const data = readJson(dragEvent.dataTransfer.getData(SCHEDULER_DRAG_TYPE));
        const duration = Number((data as { duration?: number } | null)?.duration) || slotMinutes;
        const resourceId = options.resourceId ?? (resourceFilter || undefined);
        const drop = (start: string, end: string, allDay: boolean) =>
            onExternalDrop?.({ data, text, start, end, allDay, ...(resourceId ? { resourceId } : {}) });
        if (options.allDay) return drop(toIsoDate(day), toIsoDate(day), true);
        const start = options.start ?? addMinutes(startOfDay(day), startHour * 60 + minutesAt(dragEvent));
        drop(output(toIsoDateTime(start)), output(toIsoDateTime(addMinutes(start, duration))), false);
    };
    const trackTime = (pointer: MouseEvent<HTMLElement>) => {
        const box = pointer.currentTarget.getBoundingClientRect();
        const x = rtl ? box.right - pointer.clientX : pointer.clientX - box.left;
        return timelineTimeAt(segments, x / pxPerMinute);
    };
    const onTrackClick = (pointer: MouseEvent<HTMLElement>, resource: SchedulerResource) => {
        if (pointer.target !== pointer.currentTarget || readOnly) return;
        const at = trackTime(pointer);
        if (timelineRange !== 'day') return selectDay(startOfDay(at), undefined, resource.id);
        const start = roundTo(at, slotMinutes);
        onSlotSelect?.({
            start: output(toIsoDateTime(start)),
            end: output(toIsoDateTime(addMinutes(start, slotMinutes))),
            allDay: false,
            resourceId: resource.id,
        });
    };
    const onTrackDrop = (dragEvent: DragEvent<HTMLElement>, resource: SchedulerResource) => {
        const at = trackTime(dragEvent);
        if (timelineRange !== 'day')
            return onDrop(dragEvent, startOfDay(at), { allDay: true, resourceId: resource.id });
        onDrop(dragEvent, at, { resourceId: resource.id, start: roundTo(at, slotMinutes) });
    };
    const newInRow = (resource: SchedulerResource) => {
        if (timelineRange === 'day') return selectTime(days[0]!, 0, resource.id);
        selectDay(days[0]!, undefined, resource.id);
    };

    // The day and week view (and the timeline of a day) scroll to startScrollTime
    const body = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!startScrollTime) return;
        const minutes = minutesOf(startScrollTime) - startHour * 60;
        if (body.current) body.current.scrollTop = Math.max(0, (minutes / 60) * HOUR);
        if (timelineScroll.current && timelineRange === 'day')
            timelineScroll.current.scrollLeft = Math.max(0, minutes * pxPerMinute);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the view changes
    }, [view]);

    // Month: "+N more" (day view or popover), compact month with the list of the chosen day on small screens
    const morePanel = useRef<OverlayHandle>(null);
    const [moreDay, setMoreDay] = useState<Date | null>(null);
    const onMore = (day: Date, pointer: MouseEvent<HTMLElement>) => {
        if (!morePopover) return openDay(day);
        setMoreDay(day);
        morePanel.current?.open(pointer.currentTarget);
    };
    const onMoreEvent = (id: string) => {
        morePanel.current?.close();
        onEventClickInternal(id);
    };
    const [width, setWidth] = useState<number | null>(null);
    useEffect(() => {
        if (compactBreakpoint === undefined || typeof ResizeObserver === 'undefined' || !root.current) return;
        const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? null));
        observer.observe(root.current);
        return () => observer.disconnect();
    }, [compactBreakpoint]);
    const compact = compactBreakpoint !== undefined && width !== null && width < compactBreakpoint;
    const [chosenDay, setChosenDay] = useState<string | null>(null);
    const compactDay = parseLocal(chosenDay ?? toIsoDate(current));

    const counts = view === 'year' ? eventCounts(foreground, days) : new Map<string, number>();
    const openMonth = (day: Date) => {
        setDate(day);
        setView('month');
    };
    const agendaDays = days
        .map((day) => ({ day, events: eventsOn(foreground, day) }))
        .filter((entry) => entry.events.length);
    const Heading = `h${headingLevel}` as const;
    const SubHeading = `h${Math.min(6, headingLevel + 1)}` as 'h3';
    const dayHead = (day: Date) => (
        <>
            <span className={styles.weekday()}>{weekday(day)}</span>
            <span className={styles.dayNumber()}>{day.getDate()}</span>
        </>
    );
    const resourceHead = (resource: SchedulerResource) => (
        <>
            <Avatar
                className={styles.avatar()}
                name={resource.label}
                src={resource.avatar}
                size="sm"
                aria-hidden="true"
            />
            <span className={styles.resourceName()}>{resource.label}</span>
        </>
    );
    const seriesIcon = (event: SchedulerEvent) =>
        event.seriesId && <Repeat className={styles.seriesIcon()} aria-hidden="true" />;
    const seriesSr = (event: SchedulerEvent) =>
        event.seriesId && <span className={styles.srOnly()}>{seriesText(event)}</span>;
    const monthLabel = (event: SchedulerEvent) =>
        event.allDay ? event.title : `${time(parseLocal(event.start))} ${event.title}`;

    return (
        <div
            {...props}
            ref={root}
            className={styles.base({ class: className })}
            role="region"
            aria-label={label ?? t.label}
            aria-busy={busy || undefined}
        >
            <div className={styles.toolbar()}>
                <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>
                    {t.today}
                </Button>
                <div className={styles.nav()}>
                    <IconButton
                        icon={ChevronLeft}
                        label={t.previous}
                        variant="text"
                        size="sm"
                        onClick={() => setDate(shiftView(view, current, -1, timelineRange))}
                    />
                    <IconButton
                        icon={ChevronRight}
                        label={t.next}
                        variant="text"
                        size="sm"
                        onClick={() => setDate(shiftView(view, current, 1, timelineRange))}
                    />
                </div>
                <Heading className={styles.title()} aria-live="polite">
                    {title}
                </Heading>
                {resourceList.length > 0 && (
                    <NativeSelect
                        className={styles.filter()}
                        size="sm"
                        aria-label={t.resourceFilter}
                        placeholder={t.allResources}
                        items={resourceList.map((resource) => ({ value: resource.id, label: resource.label }))}
                        value={resourceFilter}
                        onValueChange={setFilter}
                    />
                )}
                {pageOfResources.pageCount > 1 && (
                    <div className={styles.toolGroup()}>
                        <IconButton
                            icon={ChevronLeft}
                            label={t.previousResources}
                            variant="text"
                            size="sm"
                            disabled={pageOfResources.page === 0}
                            onClick={() => setResourcePage(pageOfResources.page - 1)}
                        />
                        <span className={styles.resourcePage()} aria-live="polite">
                            {t.resourceRange(pageOfResources.from, pageOfResources.to, visibleResources.length)}
                        </span>
                        <IconButton
                            icon={ChevronRight}
                            label={t.nextResources}
                            variant="text"
                            size="sm"
                            disabled={pageOfResources.page === pageOfResources.pageCount - 1}
                            onClick={() => setResourcePage(pageOfResources.page + 1)}
                        />
                    </div>
                )}
                {view === 'timeline' && (
                    <>
                        <SegmentedControl
                            label={t.range}
                            size="sm"
                            value={timelineRange}
                            onValueChange={(next) => next && setRange(next as SchedulerTimelineRange)}
                        >
                            {['day', 'week', 'month'].map((option) => (
                                <SegmentedControlItem key={option} value={option}>
                                    {t.ranges[option]}
                                </SegmentedControlItem>
                            ))}
                        </SegmentedControl>
                        <div className={styles.toolGroup()}>
                            <IconButton
                                icon={ZoomOut}
                                label={t.zoomOut}
                                variant="text"
                                size="sm"
                                disabled={zoom <= ZOOMS[0]!}
                                onClick={() => setZoom(-1)}
                            />
                            <IconButton
                                icon={ZoomIn}
                                label={t.zoomIn}
                                variant="text"
                                size="sm"
                                disabled={zoom >= ZOOMS.at(-1)!}
                                onClick={() => setZoom(1)}
                            />
                        </div>
                    </>
                )}
                {views.length > 1 && (
                    <SegmentedControl
                        label={t.view}
                        size="sm"
                        value={view}
                        onValueChange={(next) => next && setView(next as SchedulerView)}
                    >
                        {views.map((option) => (
                            <SegmentedControlItem key={option} value={option}>
                                {t.views[option]}
                            </SegmentedControlItem>
                        ))}
                    </SegmentedControl>
                )}
            </div>
            {busy && <div className={styles.loadingBar()} aria-hidden="true" />}
            {failed && (
                <div className={styles.alert()} role="alert">
                    {t.error}
                    <Button variant="outline" size="sm" onClick={() => void controller.refresh()}>
                        {t.retry}
                    </Button>
                </div>
            )}

            {timeGrid ? (
                // Day and week: header, all-day row, time grid
                <div
                    className={styles.grid()}
                    style={{ '--wc-days': columns.length, '--wc-hour': `${HOUR}px` } as CSSProperties}
                >
                    {visibleResources.length ? (
                        // With resources: the groups (days or resources) above, the columns below
                        <>
                            <span className={styles.corner()} />
                            {headGroups.map((group) =>
                                group.day && view === 'week' ? (
                                    <button
                                        key={group.key}
                                        type="button"
                                        className={styles.dayHead()}
                                        style={{ gridColumn: `span ${group.span}` }}
                                        aria-current={isToday(group.day) ? 'date' : undefined}
                                        onClick={() => openDay(group.day!)}
                                    >
                                        {dayHead(group.day)}
                                        <span className={styles.srOnly()}>{longDate(group.day)}</span>
                                    </button>
                                ) : group.day ? (
                                    <div
                                        key={group.key}
                                        className={styles.dayHead()}
                                        style={{ gridColumn: `span ${group.span}` }}
                                        aria-current={isToday(group.day) ? 'date' : undefined}
                                    >
                                        {dayHead(group.day)}
                                    </div>
                                ) : (
                                    <div
                                        key={group.key}
                                        className={styles.groupHead()}
                                        style={{ gridColumn: `span ${group.span}` }}
                                    >
                                        {resourceHead(group.resource!)}
                                    </div>
                                )
                            )}
                            <span className={styles.corner()} />
                            {columns.map((column) => {
                                const key = `head-${column.day.getTime()}-${column.resource!.id}`;
                                if (groupBy === 'date')
                                    return (
                                        <div key={key} className={styles.resourceHead()}>
                                            {resourceHead(column.resource!)}
                                        </div>
                                    );
                                return view === 'week' ? (
                                    <button
                                        key={key}
                                        type="button"
                                        className={styles.dayHead()}
                                        aria-current={isToday(column.day) ? 'date' : undefined}
                                        onClick={() => openDay(column.day)}
                                    >
                                        {dayHead(column.day)}
                                        <span className={styles.srOnly()}>{longDate(column.day)}</span>
                                    </button>
                                ) : (
                                    <div
                                        key={key}
                                        className={styles.dayHead()}
                                        aria-current={isToday(column.day) ? 'date' : undefined}
                                    >
                                        {dayHead(column.day)}
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        <>
                            <span className={styles.corner()} />
                            {days.map((day) =>
                                view === 'week' ? (
                                    <button
                                        key={day.getTime()}
                                        type="button"
                                        className={styles.dayHead()}
                                        aria-current={isToday(day) ? 'date' : undefined}
                                        onClick={() => openDay(day)}
                                    >
                                        {dayHead(day)}
                                        <span className={styles.srOnly()}>{longDate(day)}</span>
                                    </button>
                                ) : (
                                    <div
                                        key={day.getTime()}
                                        className={styles.dayHead()}
                                        aria-current={isToday(day) ? 'date' : undefined}
                                    >
                                        {dayHead(day)}
                                    </div>
                                )
                            )}
                        </>
                    )}
                    <span className={styles.allDayLabel()}>{t.allDay}</span>
                    {columns.map((column) => (
                        <div
                            key={`all-${column.day.getTime()}-${column.resource?.id}`}
                            className={styles.allDayCell()}
                            onClick={(pointer) => selectDay(column.day, pointer, column.resource?.id)}
                            onDragOver={onDragOver}
                            onDrop={(dragEvent) =>
                                onDrop(dragEvent, column.day, { allDay: true, resourceId: column.resource?.id })
                            }
                        >
                            {backgroundsIn(column)
                                .filter((item) => item.allDay)
                                .map((event) => (
                                    <span
                                        key={event.id}
                                        className={scheduler({ tone: toneOf(event) }).allDayBackground()}
                                    >
                                        {event.title}
                                    </span>
                                ))}
                            {allDayEvents(column).map((event) => (
                                <button
                                    key={event.id}
                                    type="button"
                                    data-event-id={event.id}
                                    className={scheduler({ tone: toneOf(event) }).allDayEvent()}
                                    onClick={() => onEventClickInternal(event.id)}
                                    onKeyDown={(key) => onEventKey(event.id, key)}
                                >
                                    {seriesIcon(event)}
                                    {event.title}
                                    {seriesSr(event)}
                                </button>
                            ))}
                        </div>
                    ))}
                    <div ref={body} className={styles.body()} style={{ maxHeight: height }}>
                        <div className={styles.hours()} style={{ height: hours.length * HOUR }} aria-hidden="true">
                            {hours.map((hour, index) => (
                                <span key={hour} className={styles.hour()} style={{ top: index * HOUR }}>
                                    {hourLabel(hour)}
                                </span>
                            ))}
                        </div>
                        {columns.map((column, columnIndex) => (
                            <div
                                key={`time-${column.day.getTime()}-${column.resource?.id}`}
                                role="group"
                                data-day-column=""
                                aria-label={columnLabel(column)}
                                className={styles.dayColumn()}
                                style={{ height: hours.length * HOUR }}
                                onClick={(pointer) => onColumnClick(column.day, pointer, column.resource?.id)}
                                onDragOver={onDragOver}
                                onDrop={(dragEvent) =>
                                    onDrop(dragEvent, column.day, { resourceId: column.resource?.id })
                                }
                            >
                                {!readOnly && (
                                    <button
                                        type="button"
                                        className={styles.newEvent()}
                                        onClick={() => selectTime(column.day, 0, column.resource?.id)}
                                    >
                                        {column.resource
                                            ? t.newEventFor(column.resource.label, longDate(column.day))
                                            : t.newEvent(longDate(column.day))}
                                    </button>
                                )}
                                {closedTimes(hoursOf(column.resource), column.day, startHour, endHour).map(
                                    (block, index) => (
                                        <span
                                            key={`closed-${index}`}
                                            className={styles.closed()}
                                            style={{ top: `${block.top}%`, height: `${block.height}%` }}
                                            aria-hidden="true"
                                        />
                                    )
                                )}
                                {backgroundsIn(column)
                                    .filter((item) => item.allDay)
                                    .map((event) => (
                                        <span
                                            key={`bg-${event.id}`}
                                            className={scheduler({ tone: toneOf(event) }).backgroundEvent()}
                                            style={{ top: 0, height: '100%' }}
                                            aria-hidden="true"
                                        />
                                    ))}
                                {layoutDay(backgroundsIn(column), column.day, startHour, endHour).map((item) => (
                                    <span
                                        key={`bg-${item.event.id}`}
                                        className={scheduler({ tone: toneOf(item.event) }).backgroundEvent()}
                                        style={{ top: `${item.top}%`, height: `${item.height}%` }}
                                    >
                                        {item.event.title}
                                    </span>
                                ))}
                                {layoutDay(
                                    foreground.filter((event) => inColumn(event, column)),
                                    column.day,
                                    startHour,
                                    endHour
                                ).map((item) => (
                                    <button
                                        key={item.event.id}
                                        type="button"
                                        data-event-id={item.event.id}
                                        data-dragging={drag?.id === item.event.id || undefined}
                                        data-invalid={(drag?.id === item.event.id && drag.invalid) || undefined}
                                        aria-keyshortcuts={keyShortcuts}
                                        className={scheduler({ tone: toneOf(item.event) }).event()}
                                        style={eventPlace(item)}
                                        onClick={() => onEventClickInternal(item.event.id)}
                                        onKeyDown={(key) => onEventKey(item.event.id, key)}
                                        onPointerDown={(pointer) =>
                                            onPointerDown(item.event.id, false, pointer, columnIndex)
                                        }
                                    >
                                        <span className={styles.eventTitle()}>
                                            {seriesIcon(item.event)}
                                            {item.event.title}
                                        </span>
                                        <span className={styles.eventTime()}>{timeRange(item.event)}</span>
                                        {seriesSr(item.event)}
                                        {editing && (
                                            <span
                                                className={styles.resizeHandle()}
                                                aria-hidden="true"
                                                onPointerDown={(pointer) =>
                                                    onPointerDown(item.event.id, true, pointer, columnIndex)
                                                }
                                            />
                                        )}
                                    </button>
                                ))}
                                {isToday(column.day) && nowTop >= 0 && nowTop <= 100 && (
                                    <span className={styles.now()} style={{ top: `${nowTop}%` }} aria-hidden="true" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : view === 'timeline' ? (
                // Timeline: resources as rows, time along the row
                <div
                    ref={timelineScroll}
                    className={styles.timeline()}
                    style={{ maxHeight: height }}
                    onScroll={onTimelineScroll}
                >
                    <div className={styles.timelineGrid()}>
                        <div className={styles.timelineCorner()}>{t.resource}</div>
                        <div className={styles.timelineHead()} aria-hidden="true">
                            {timelineSlots.map((slot) => (
                                <span
                                    key={slot.key}
                                    className={styles.timelineSlot()}
                                    style={{ width: `${slotWidth}px` }}
                                >
                                    {slot.sub && <span>{slot.sub}</span>}
                                    {slot.label}
                                </span>
                            ))}
                        </div>
                        {windowRows.before > 0 && (
                            <div className={styles.timelineSpacer()} style={{ height: `${windowRows.before}px` }} />
                        )}
                        {windowRows.rows.map((row) =>
                            row.group ? (
                                <div
                                    key={row.key}
                                    className={styles.timelineGroup()}
                                    style={{ height: `${row.height}px` }}
                                >
                                    {row.group}
                                </div>
                            ) : (
                                <div
                                    key={row.key}
                                    role="group"
                                    aria-label={row.resource!.label}
                                    className={styles.timelineRow()}
                                    style={{ height: `${row.height}px` }}
                                >
                                    <div className={styles.timelineLabel()}>{resourceHead(row.resource!)}</div>
                                    <div
                                        data-timeline-track=""
                                        className={styles.timelineTrack()}
                                        style={
                                            {
                                                width: `${axisMinutes * pxPerMinute}px`,
                                                '--wc-slot': `${slotWidth}px`,
                                            } as CSSProperties
                                        }
                                        onClick={(pointer) => onTrackClick(pointer, row.resource!)}
                                        onDragOver={onDragOver}
                                        onDrop={(dragEvent) => onTrackDrop(dragEvent, row.resource!)}
                                    >
                                        {!readOnly && (
                                            <button
                                                type="button"
                                                className={styles.newEvent()}
                                                onClick={() => newInRow(row.resource!)}
                                            >
                                                {t.newEventFor(row.resource!.label, longDate(days[0]!))}
                                            </button>
                                        )}
                                        {timelineClosed(row.resource).map((block, index) => (
                                            <span
                                                key={`closed-${index}`}
                                                className={styles.closed()}
                                                style={{
                                                    insetInlineStart: `${block.left}px`,
                                                    width: `${block.width}px`,
                                                    top: 0,
                                                    bottom: 0,
                                                }}
                                                aria-hidden="true"
                                            />
                                        ))}
                                        {timelineBackgrounds(row.resource).map((item) => (
                                            <span
                                                key={`bg-${item.event.id}`}
                                                className={scheduler({ tone: toneOf(item.event) }).backgroundEvent()}
                                                style={{
                                                    insetInlineStart: `${item.offset * pxPerMinute}px`,
                                                    width: `${item.length * pxPerMinute}px`,
                                                    top: 0,
                                                    bottom: 0,
                                                }}
                                            >
                                                {item.event.title}
                                            </span>
                                        ))}
                                        {row.items.map((item) => (
                                            <button
                                                key={item.event.id}
                                                type="button"
                                                data-event-id={item.event.id}
                                                data-dragging={drag?.id === item.event.id || undefined}
                                                data-invalid={(drag?.id === item.event.id && drag.invalid) || undefined}
                                                aria-keyshortcuts={keyShortcuts}
                                                className={scheduler({ tone: toneOf(item.event) }).timelineEvent()}
                                                style={{
                                                    insetInlineStart: `${item.offset * pxPerMinute}px`,
                                                    width: `${Math.max(8, item.length * pxPerMinute)}px`,
                                                    top: `${6 + item.lane * LANE}px`,
                                                    height: `${LANE - 4}px`,
                                                }}
                                                onClick={() => onEventClickInternal(item.event.id)}
                                                onKeyDown={(key) => onEventKey(item.event.id, key)}
                                                onPointerDown={(pointer) =>
                                                    onPointerDown(item.event.id, false, pointer)
                                                }
                                            >
                                                <span className={styles.eventTitle()}>
                                                    {seriesIcon(item.event)}
                                                    {item.event.title}
                                                </span>
                                                <span className={styles.srOnly()}>{timeRange(item.event)}</span>
                                                {seriesSr(item.event)}
                                                {editing && (
                                                    <span
                                                        className={styles.timelineResize()}
                                                        aria-hidden="true"
                                                        onPointerDown={(pointer) =>
                                                            onPointerDown(item.event.id, true, pointer)
                                                        }
                                                    />
                                                )}
                                            </button>
                                        ))}
                                        {nowLeft >= 0 && (
                                            <span
                                                className={styles.timelineNow()}
                                                style={{ insetInlineStart: `${nowLeft}px` }}
                                                aria-hidden="true"
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                        {windowRows.after > 0 && (
                            <div className={styles.timelineSpacer()} style={{ height: `${windowRows.after}px` }} />
                        )}
                    </div>
                </div>
            ) : view === 'month' ? (
                // Month: weeks as table rows
                <div className={styles.monthScroll()}>
                    <table className={styles.month()}>
                        <caption className={styles.caption()}>{title}</caption>
                        <thead>
                            <tr>
                                {days.slice(0, perWeek).map((day) => (
                                    <th key={day.getTime()} scope="col" className={styles.monthHead()}>
                                        {weekday(day)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {weeks.map((week) => (
                                <tr key={week[0]!.getTime()}>
                                    {week.map((day) => {
                                        const dayEvents = eventsOn(foreground, day);
                                        return (
                                            <td
                                                key={day.getTime()}
                                                className={styles.monthCell()}
                                                data-month-day={toIsoDate(day)}
                                                data-outside={day.getMonth() !== current.getMonth() || undefined}
                                                onClick={(pointer) => selectDay(day, pointer)}
                                                onDragOver={onDragOver}
                                                onDrop={(dragEvent) => onDrop(dragEvent, day, { allDay: true })}
                                            >
                                                {compact ? (
                                                    <button
                                                        type="button"
                                                        className={styles.monthDay()}
                                                        aria-label={
                                                            dayEvents.length
                                                                ? `${longDate(day)}, ${pluralText(t.eventCount, dayEvents.length, locale)}`
                                                                : longDate(day)
                                                        }
                                                        aria-pressed={sameDay(day, compactDay)}
                                                        aria-current={isToday(day) ? 'date' : undefined}
                                                        onClick={() => setChosenDay(toIsoDate(day))}
                                                    >
                                                        {day.getDate()}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className={styles.monthDay()}
                                                        aria-label={longDate(day)}
                                                        aria-current={isToday(day) ? 'date' : undefined}
                                                        onClick={() => openDay(day)}
                                                    >
                                                        {day.getDate()}
                                                    </button>
                                                )}
                                                {compact ? (
                                                    dayEvents.length > 0 && (
                                                        <span className={styles.monthDot()} aria-hidden="true" />
                                                    )
                                                ) : (
                                                    <div className={styles.monthEvents()}>
                                                        {eventsOn(backgrounds, day).map((event) => (
                                                            <span
                                                                key={`bg-${event.id}`}
                                                                className={scheduler({
                                                                    tone: toneOf(event),
                                                                }).allDayBackground()}
                                                            >
                                                                {event.title}
                                                            </span>
                                                        ))}
                                                        {dayEvents.slice(0, monthEventLimit).map((event) => (
                                                            <button
                                                                key={event.id}
                                                                type="button"
                                                                data-event-id={event.id}
                                                                className={scheduler({
                                                                    tone: toneOf(event),
                                                                }).allDayEvent()}
                                                                onClick={() => onEventClickInternal(event.id)}
                                                                onKeyDown={(key) => onEventKey(event.id, key)}
                                                                onPointerDown={(pointer) =>
                                                                    onPointerDown(event.id, false, pointer)
                                                                }
                                                            >
                                                                {seriesIcon(event)}
                                                                {monthLabel(event)}
                                                                {seriesSr(event)}
                                                            </button>
                                                        ))}
                                                        {dayEvents.length > monthEventLimit && (
                                                            <button
                                                                type="button"
                                                                className={styles.more()}
                                                                onClick={(pointer) => onMore(day, pointer)}
                                                            >
                                                                {t.more(dayEvents.length - monthEventLimit)}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {compact && (
                        <section className={styles.compactList()}>
                            <SubHeading className={styles.agendaDay()}>{longDate(compactDay)}</SubHeading>
                            {eventsOn(foreground, compactDay).length ? (
                                <ul className={styles.agendaList()}>
                                    {eventsOn(foreground, compactDay).map((event) => (
                                        <li key={event.id}>
                                            <button
                                                type="button"
                                                data-event-id={event.id}
                                                className={scheduler({ tone: toneOf(event) }).agendaEvent()}
                                                onClick={() => onEventClickInternal(event.id)}
                                            >
                                                <span className={styles.agendaTime()}>{timeRange(event)}</span>
                                                <span>{event.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className={styles.empty()}>{t.empty}</p>
                            )}
                        </section>
                    )}
                    {morePopover && (
                        <Popover ref={morePanel} placement="bottom-start">
                            <PopoverContent title={moreDay ? longDate(moreDay) : ''}>
                                <div className={styles.moreList()}>
                                    {(moreDay ? eventsOn(foreground, moreDay) : []).map((event) => (
                                        <button
                                            key={event.id}
                                            type="button"
                                            className={scheduler({ tone: toneOf(event) }).allDayEvent()}
                                            onClick={() => onMoreEvent(event.id)}
                                        >
                                            {monthLabel(event)}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            ) : view === 'year' ? (
                // Year: twelve small months
                <SchedulerYear
                    year={current.getFullYear()}
                    date={toIsoDate(current)}
                    counts={counts}
                    today={wallNow ? toIsoDate(wallNow) : null}
                    weekStartsOn={weekStartsOn}
                    locale={locale}
                    rtl={rtl}
                    headingLevel={Math.min(6, headingLevel + 1)}
                    eventCount={t.eventCount}
                    styles={styles}
                    onOpen={openDay}
                    onMonth={openMonth}
                />
            ) : (
                // Agenda: the next 30 days with events
                <div className={styles.agenda()}>
                    {agendaDays.map((entry) => (
                        <section key={entry.day.getTime()}>
                            <SubHeading className={styles.agendaDay()}>{longDate(entry.day)}</SubHeading>
                            <ul className={styles.agendaList()}>
                                {entry.events.map((event) => (
                                    <li key={event.id}>
                                        <button
                                            type="button"
                                            data-event-id={event.id}
                                            className={scheduler({ tone: toneOf(event) }).agendaEvent()}
                                            onClick={() => onEventClickInternal(event.id)}
                                        >
                                            <span className={styles.agendaTime()}>{timeRange(event)}</span>
                                            <span>
                                                {seriesIcon(event)}
                                                {event.title}
                                            </span>
                                            {seriesSr(event)}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                    {agendaDays.length === 0 && <p className={styles.empty()}>{t.empty}</p>}
                </div>
            )}
            <p role="status" className={styles.status()}>
                {status}
            </p>
            <SchedulerSeriesDialog
                open={!!pending}
                title={t.seriesTitle}
                description={pending ? t.seriesQuestion(base(pending.id).title) : ''}
                cancelLabel={translations.common.cancel}
                onlyLabel={t.onlyThis}
                allLabel={t.allInSeries}
                returnFocus={() => eventElement(seriesFocus.current)}
                onChoose={onSeriesChoice}
            />
        </div>
    );
}
