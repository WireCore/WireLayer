<script setup lang="ts">
import { ChevronLeft, ChevronRight, Repeat, ZoomIn, ZoomOut } from '@lucide/vue';
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
    type DataController,
    type DataSource,
    type DataState,
    type RecipeClasses,
    type RecurrenceScope,
    type SchedulerBusinessHours,
    type SchedulerDropReason,
    type SchedulerEvent,
    type SchedulerGroupBy,
    type SchedulerOverlapMode,
    type SchedulerResource,
    type SchedulerTimelineRange,
    type SchedulerView,
} from '@wirecore/wirelayer-recipes';
import {
    computed,
    nextTick,
    normalizeClass,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useAttrs,
    useTemplateRef,
    watch,
} from 'vue';
import Avatar from '../Avatar/Avatar.vue';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import NativeSelect from '../NativeSelect/NativeSelect.vue';
import Popover from '../Popover/Popover.vue';
import PopoverContent from '../Popover/PopoverContent.vue';
import SegmentedControl from '../SegmentedControl/SegmentedControl.vue';
import SegmentedControlItem from '../SegmentedControl/SegmentedControlItem.vue';
import SchedulerSeriesDialog from './SchedulerSeriesDialog.vue';
import SchedulerYear from './SchedulerYear.vue';
import { useRecipe } from '../../recipes.js';
import { useLocale, useTranslations } from '../../locale.js';

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

export interface SchedulerProps {
    /** Events; with `dataSource` they are shown together with the loaded ones */
    events?: readonly SchedulerEvent[];
    /** Shown view – use with v-model:view */
    view?: SchedulerView;
    defaultView?: SchedulerView;
    /** Shown date ("2026-10-20") – use with v-model:date */
    date?: string;
    defaultDate?: string;
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
    /** Shown resource (id; empty: all) – use with v-model:resourceFilter */
    resourceFilter?: string;
    defaultResourceFilter?: string;
    /** Span of the timeline: a day in hours, a week or a month in days – use with v-model:timelineRange */
    timelineRange?: SchedulerTimelineRange;
    defaultTimelineRange?: SchedulerTimelineRange;
    /** Zoom of the timeline (0.5–3, width of its slots) – use with v-model:zoom */
    zoom?: number;
    defaultZoom?: number;
    /** Opening hours by weekday – times outside are hatched (resources can have their own) */
    businessHours?: readonly SchedulerBusinessHours[];
    /** Leaves out the weekend days of the locale in the week, month and timeline views */
    hideWeekends?: boolean;
    /** Overlapping events side by side (`columns`, default) or stacked with an offset */
    overlapMode?: SchedulerOverlapMode;
    /** Whether an event may be dropped there – a refused move is marked, announced and reported (dropRejected) */
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
    /** Accepts items dragged in from outside (application/x-wirecore-event or text) – see externalDrop */
    droppable?: boolean;
    /** Loads the events of the shown range (`range` of the query) – cancelled when the range changes, cached */
    dataSource?: DataSource<SchedulerEvent>;
    /** How long loaded ranges are reused, in ms (default 0) */
    cacheTime?: number;
    /** Shows the loading state (e.g. while you load on rangeChange yourself) */
    loading?: boolean;
    /** IANA time zone the times are shown in ("Europe/Berlin"); times with offset are converted, changes get it */
    timeZone?: string;
    /** Accessible name of the calendar */
    label?: string;
    /** Level of the title heading */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof schedulerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SchedulerProps>(), {
    events: () => [],
    view: undefined,
    defaultView: 'week',
    date: undefined,
    defaultDate: () => toIsoDate(new Date()),
    views: () => ['day', 'week', 'month', 'agenda'],
    startHour: 7,
    endHour: 19,
    slotMinutes: 30,
    weekStartsOn: 1,
    height: '600px',
    groupBy: 'date',
    resourceFilter: undefined,
    defaultResourceFilter: '',
    timelineRange: undefined,
    defaultTimelineRange: 'week',
    zoom: undefined,
    defaultZoom: 1,
    overlapMode: 'columns',
    recurrenceEditScope: 'ask',
    monthEventLimit: 3,
    cacheTime: 0,
    headingLevel: 2,
});
const emit = defineEmits<{
    'update:view': [view: SchedulerView];
    'update:date': [date: string];
    'update:resourceFilter': [resourceId: string];
    'update:timelineRange': [range: SchedulerTimelineRange];
    'update:zoom': [zoom: number];
    /** An event was clicked (or chosen with Enter/Space) */
    eventClick: [event: SchedulerEvent];
    /** An empty time or day was chosen – e.g. to create an event there */
    slotSelect: [slot: SchedulerSlot];
    /** An event was moved or resized – apply start and end to your data (series: applyEventChange) */
    eventChange: [change: SchedulerChange];
    /** A move or resize was refused by canDrop, canResize or preventOverlap */
    dropRejected: [rejection: SchedulerDropRejection];
    /** The shown range changed (also at the start) – load its events */
    rangeChange: [range: SchedulerRange];
    /** Something from outside was dropped on a time (droppable) */
    externalDrop: [drop: SchedulerExternalDrop];
    /** An event was dragged out of the calendar */
    eventDropOutside: [drop: SchedulerDropOutside];
}>();
const scheduler = useRecipe('scheduler', schedulerRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => scheduler());
const localeContext = useLocale();
const translations = useTranslations();
const t = translations.scheduler;
const locale = computed(() => props.locale ?? localeContext.value.locale);
const rtl = computed(() => localeContext.value.dir === 'rtl');
const HOUR = 48;
const LANE = 30;
const VIRTUAL_ROWS = 40;
const ZOOMS = [0.5, 0.75, 1, 1.5, 2, 3];

const internalView = ref(props.defaultView);
const view = computed(() => props.view ?? internalView.value);
const internalDate = ref(props.defaultDate);
const current = computed(() => parseLocal(props.date ?? internalDate.value));
const internalFilter = ref(props.defaultResourceFilter);
const resourceFilter = computed(() => props.resourceFilter ?? internalFilter.value);
const internalRange = ref(props.defaultTimelineRange);
const timelineRange = computed(() => props.timelineRange ?? internalRange.value);
const internalZoom = ref(props.defaultZoom);
const zoom = computed(() => props.zoom ?? internalZoom.value);
function setView(next: SchedulerView) {
    internalView.value = next;
    emit('update:view', next);
}
function setDate(next: Date) {
    internalDate.value = toIsoDate(next);
    emit('update:date', internalDate.value);
}
function openDay(day: Date) {
    setDate(day);
    setView('day');
}
function setFilter(next: string) {
    internalFilter.value = next;
    emit('update:resourceFilter', next);
}
function setRange(next: SchedulerTimelineRange) {
    internalRange.value = next;
    emit('update:timelineRange', next);
}
function setZoom(step: 1 | -1) {
    const index = ZOOMS.findIndex((value) => value >= zoom.value);
    const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (index < 0 ? ZOOMS.length - 1 : index) + step))]!;
    internalZoom.value = next;
    emit('update:zoom', next);
}

const days = computed(() =>
    schedulerDays(view.value, current.value, {
        weekStartsOn: props.weekStartsOn,
        hideWeekends: props.hideWeekends,
        locale: locale.value,
        timelineRange: timelineRange.value,
    })
);
const perWeek = computed(() =>
    props.hideWeekends && view.value === 'month' ? 7 - weekendDays(locale.value).length : 7
);
const weeks = computed(() =>
    Array.from({ length: Math.ceil(days.value.length / perWeek.value) }, (_, index) =>
        days.value.slice(index * perWeek.value, index * perWeek.value + perWeek.value)
    )
);
const hours = computed(() =>
    Array.from({ length: props.endHour - props.startHour }, (_, index) => props.startHour + index)
);
const totalMinutes = computed(() => (props.endHour - props.startHour) * 60);
const range = computed(() => daysRange(days.value));

const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale.value, options);
const longDate = (date: Date) =>
    format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
const time = (date: Date) => format({ hour: '2-digit', minute: '2-digit' }).format(date);
const timeRange = (event: SchedulerEvent) =>
    event.allDay ? t.allDay : `${time(parseLocal(event.start))}–${time(parseLocal(event.end))}`;
const title = computed(() => {
    const first = days.value[0]!;
    const last = days.value.at(-1)!;
    const span = view.value === 'timeline' ? timelineRange.value : view.value;
    if (span === 'year') return format({ year: 'numeric' }).format(current.value);
    if (span === 'day') return longDate(first);
    if (span === 'month') return format({ month: 'long', year: 'numeric' }).format(current.value);
    return format({ day: 'numeric', month: 'long', year: 'numeric' }).formatRange(first, last);
});
const hourLabel = (hour: number) => time(new Date(2000, 0, 1, hour));
const weekdays = computed(() =>
    days.value.slice(0, perWeek.value).map((day) => format({ weekday: 'short' }).format(day))
);

// Today and the current time (in the time zone): only in the browser, so server and client render alike
const now = ref<Date | null>(null);
let clock: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
    now.value = new Date();
    clock = setInterval(() => (now.value = new Date()), 60_000);
});
onBeforeUnmount(() => clearInterval(clock));
const wallNow = computed(() => (now.value ? nowIn(props.timeZone, now.value) : null));
const isToday = (day: Date) => !!wallNow.value && sameDay(day, wallNow.value);
const nowTop = computed(() =>
    wallNow.value
        ? ((wallNow.value.getHours() * 60 + wallNow.value.getMinutes() - props.startHour * 60) / totalMinutes.value) *
          100
        : -1
);

// The shown range: reported (also at the start) and loaded from the data source
onMounted(() => emit('rangeChange', { ...range.value, view: view.value }));
watch(
    () => `${range.value.start}|${range.value.end}|${view.value}`,
    () => emit('rangeChange', { ...range.value, view: view.value })
);
const loaded = shallowRef<DataState<SchedulerEvent>>({ status: 'idle', items: [] });
let controller: DataController<SchedulerEvent> | undefined;
const status = ref('');
function load() {
    const source = props.dataSource;
    if (!source) return;
    controller ??= createDataController<SchedulerEvent>({
        source,
        onChange: (state) => {
            loaded.value = state;
            if (state.status === 'loading') status.value = t.loading;
            else if (state.status === 'error') status.value = t.error;
            else if (state.status === 'success') status.value = pluralText(t.loaded, state.items.length, locale.value);
        },
    });
    controller.configure({ source, ttl: props.cacheTime });
    void controller.load({ range: range.value });
}
onMounted(load);
watch([() => props.dataSource, () => range.value.start, () => range.value.end], load);
onBeforeUnmount(() => controller?.dispose());
const busy = computed(() => props.loading || loaded.value.status === 'loading');
const failed = computed(() => loaded.value.status === 'error');

// Events: given and loaded, in the time zone, series expanded for the shown range, filtered by resource
const sourceEvents = computed(() => (props.dataSource ? [...props.events, ...loaded.value.items] : props.events));
const sourceById = computed(() => new Map(sourceEvents.value.map((event) => [event.id, event])));
const expanded = computed(() => {
    const zoned = props.timeZone
        ? sourceEvents.value.map((event) => zonedEvent(event, props.timeZone))
        : sourceEvents.value;
    return zoned.some((event) => event.rrule)
        ? zoned.flatMap((event) => (event.rrule ? expandRecurrence(event, range.value, props.timeZone) : [event]))
        : zoned;
});
const resourceList = computed(() => props.resources ?? []);
const visibleResources = computed(() =>
    resourceFilter.value
        ? resourceList.value.filter((resource) => resource.id === resourceFilter.value)
        : resourceList.value
);
const filtered = computed(() =>
    resourceFilter.value ? expanded.value.filter((event) => event.resourceId === resourceFilter.value) : expanded.value
);
const baseById = computed(() => new Map(expanded.value.map((event) => [event.id, event])));
/** The event in wall-clock time (for calculations) */
const base = (id: string) => baseById.value.get(id)!;
/** The event as reported: the given object, or the occurrence of a series */
const reported = (id: string) => sourceById.value.get(id) ?? base(id);
const seriesTexts = computed(
    () =>
        new Map(
            sourceEvents.value
                .filter((event) => event.rrule)
                .map((event) => [
                    event.id,
                    `${t.series}: ${describeRecurrence(event.rrule!, translations, locale.value, event.start)}`,
                ])
        )
);
const seriesText = (event: SchedulerEvent) =>
    event.seriesId ? (seriesTexts.value.get(event.seriesId) ?? t.series) : '';
const resourceOf = (id?: string) => resourceList.value.find((resource) => resource.id === id);
const toneOf = (event: SchedulerEvent) => event.tone ?? resourceOf(event.resourceId)?.tone;

// Dragging: a preview while the pointer moves (marked when it may not be dropped), the change on release
interface Drag {
    id: string;
    resize: boolean;
    preview: { start: string; end: string; resourceId?: string } | null;
    invalid: boolean;
}
const drag = ref<Drag | null>(null);
let dragStart = {
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
};
let suppressClick = false;
const foreground = computed(() =>
    filtered.value
        .filter((event) => !event.background)
        .map((event) =>
            drag.value?.id === event.id && drag.value.preview ? { ...event, ...drag.value.preview } : event
        )
);
const backgrounds = computed(() => filtered.value.filter((event) => event.background));
const snap = (resize: boolean) => (resize ? props.resizeSnapMinutes : props.dragSnapMinutes) ?? props.slotMinutes;
const editing = computed(() => props.editable && !props.readOnly);
function checkPreview(id: string, next: { start: string; end: string; resourceId?: string }, resize: boolean) {
    const event = base(id);
    return checkEventDrop({
        events: expanded.value,
        event,
        start: next.start,
        end: next.end,
        resourceId: next.resourceId ?? event.resourceId,
        resize,
        preventOverlap: props.preventOverlap,
        canDrop: props.canDrop && ((_, start, end, resourceId) => props.canDrop!(reported(id), start, end, resourceId)),
        canResize: props.canResize && ((_, start, end) => props.canResize!(reported(id), start, end)),
    });
}
function setPreview(next: Drag['preview']) {
    if (!drag.value) return;
    drag.value = {
        ...drag.value,
        preview: next,
        invalid: !!next && !!checkPreview(drag.value.id, next, drag.value.resize),
    };
}

const root = useTemplateRef<HTMLElement>('root');
function onPointerDown(id: string, resize: boolean, pointer: PointerEvent, column = 0) {
    const event = base(id);
    const month = view.value === 'month';
    if (!editing.value || pointer.button !== 0 || (event.allDay && view.value !== 'timeline' && !month)) return;
    const timeline = view.value === 'timeline';
    const box = (pointer.currentTarget as HTMLElement).closest<HTMLElement>(
        timeline ? '[data-timeline-track]' : month ? '[data-month-day]' : '[data-day-column]'
    )!;
    const item = timeline ? timelineItem(id) : undefined;
    dragStart = {
        x: pointer.clientX,
        y: pointer.clientY,
        width: box.offsetWidth,
        perMinute: timeline ? pxPerMinute.value : box.offsetHeight / totalMinutes.value,
        moved: false,
        column,
        timeline,
        offset: item?.offset ?? 0,
        length: item?.length ?? 0,
        row: item?.row ?? 0,
        month,
        anchor: box.dataset.monthDay ?? '',
    };
    drag.value = { id, resize, preview: null, invalid: false };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
}
function onPointerMove(pointer: PointerEvent) {
    if (!drag.value) return;
    const dx = pointer.clientX - dragStart.x;
    const dy = pointer.clientY - dragStart.y;
    dragStart.moved ||= Math.abs(dx) > 3 || Math.abs(dy) > 3;
    if (!dragStart.moved) return;
    const { id, resize } = drag.value;
    const event = base(id);
    const direction = rtl.value ? -1 : 1;
    if (dragStart.month) {
        const cell = document
            .elementFromPoint(pointer.clientX, pointer.clientY)
            ?.closest<HTMLElement>('[data-month-day]');
        const days = cell && root.value?.contains(cell) ? daysBetween(dragStart.anchor, cell.dataset.monthDay!) : 0;
        return setPreview(days ? shiftEvent(event, 0, days, false) : null);
    }
    if (dragStart.timeline)
        return setPreview(timelinePreview(event, (direction * dx) / dragStart.perMinute, dy, resize));
    const minutes = Math.round(dy / dragStart.perMinute / snap(resize)) * snap(resize);
    const shift = resize ? 0 : Math.round((direction * dx) / dragStart.width);
    if (!resourceList.value.length) {
        const dayShift = view.value === 'day' ? 0 : shift;
        if (!minutes && !dayShift) return setPreview(null);
        return setPreview(shiftEvent(event, minutes, dayShift, resize));
    }
    const from = columns.value[dragStart.column]!;
    const target = columns.value[Math.min(columns.value.length - 1, Math.max(0, dragStart.column + shift))]!;
    const dayShift = Math.round((startOfDay(target.day).getTime() - startOfDay(from.day).getTime()) / 86_400_000);
    if (!minutes && !dayShift && target.resource?.id === event.resourceId) return setPreview(null);
    setPreview({ ...shiftEvent(event, minutes, dayShift, resize), resourceId: target.resource?.id });
}
function onPointerUp(pointer: PointerEvent) {
    window.removeEventListener('pointermove', onPointerMove);
    const done = drag.value;
    drag.value = null;
    suppressClick = dragStart.moved;
    if (!done) return;
    const box = root.value?.getBoundingClientRect();
    const outside =
        dragStart.moved &&
        !!box &&
        (pointer.clientX < box.left ||
            pointer.clientX > box.right ||
            pointer.clientY < box.top ||
            pointer.clientY > box.bottom);
    if (outside) {
        emit('eventDropOutside', {
            event: reported(done.id),
            clientX: pointer.clientX,
            clientY: pointer.clientY,
            target: document.elementFromPoint(pointer.clientX, pointer.clientY),
        });
        return;
    }
    if (done.preview) requestChange(done.id, done.preview, done.resize);
}
onBeforeUnmount(() => window.removeEventListener('pointermove', onPointerMove));

// Changes: checked against the rules, asked for series, reported, announced; the focus follows the event
let focusAfter: string | null = null;
/** The event whose series question is open – it gets the focus back */
let seriesFocus = '';
const pending = ref<{ id: string; next: { start: string; end: string; resourceId?: string } } | null>(null);
const output = (value: string, allDay?: boolean) =>
    props.timeZone && !allDay && value.length > 10 ? withZoneOffset(value, props.timeZone) : value;
const whenText = (event: SchedulerEvent, next: { start: string; end: string; resourceId?: string }) => {
    const start = parseLocal(next.start);
    const when = event.allDay ? longDate(start) : `${longDate(start)}, ${time(start)}–${time(parseLocal(next.end))}`;
    const resource = next.resourceId ? resourceOf(next.resourceId) : undefined;
    return resource && next.resourceId !== event.resourceId ? `${when}, ${resource.label}` : when;
};
function requestChange(id: string, next: { start: string; end: string; resourceId?: string }, resize: boolean) {
    if (!editing.value) return;
    const event = base(id);
    const target = { ...next, resourceId: next.resourceId ?? event.resourceId };
    const rejection = checkPreview(id, target, resize);
    if (rejection) {
        const reason = rejection.conflict ? t.overlaps(rejection.conflict.title) : t.notAllowed;
        status.value = t.rejected(event.title, reason);
        emit('dropRejected', {
            event: reported(id),
            start: output(target.start, event.allDay),
            end: output(target.end, event.allDay),
            ...(target.resourceId ? { resourceId: target.resourceId } : {}),
            reason: rejection.reason,
        });
        return;
    }
    if (event.seriesId && props.recurrenceEditScope === 'ask') {
        seriesFocus = id;
        pending.value = { id, next: target };
        return;
    }
    commit(id, target, event.seriesId ? (props.recurrenceEditScope as RecurrenceScope) : undefined);
}
function commit(id: string, next: { start: string; end: string; resourceId?: string }, scope?: RecurrenceScope) {
    const event = base(id);
    status.value = t.changed(event.title, whenText(event, next));
    focusAfter = id;
    emit('eventChange', {
        event: reported(id),
        start: output(next.start, event.allDay),
        end: output(next.end, event.allDay),
        ...(resourceList.value.length && next.resourceId ? { resourceId: next.resourceId } : {}),
        ...(scope ? { scope } : {}),
    });
}
function onSeriesChoice(scope: RecurrenceScope | null) {
    const request = pending.value;
    pending.value = null;
    if (request && scope) commit(request.id, request.next, scope);
}
const eventElement = (id: string) =>
    root.value?.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(id)}"]`) ?? null;
watch(
    () => props.events,
    async () => {
        if (!focusAfter) return;
        const id = focusAfter;
        focusAfter = null;
        await nextTick();
        eventElement(id)?.focus();
    }
);
function onEventKey(id: string, key: KeyboardEvent) {
    if (!editing.value || !key.altKey) return;
    const event = base(id);
    const direction = rtl.value ? -1 : 1;
    const horizontal: Record<string, number> = { ArrowLeft: -direction, ArrowRight: direction };
    if (view.value === 'timeline') {
        const resources = visibleResources.value;
        const index = resources.findIndex((resource) => resource.id === event.resourceId);
        if (key.key === 'ArrowUp' || key.key === 'ArrowDown') {
            if (key.shiftKey) return;
            const target = resources[index + (key.key === 'ArrowUp' ? -1 : 1)];
            key.preventDefault();
            if (target) requestChange(id, { start: event.start, end: event.end, resourceId: target.id }, false);
            return;
        }
        const step = horizontal[key.key];
        if (!step) return;
        key.preventDefault();
        const byDays = event.allDay || timelineRange.value !== 'day';
        const next = byDays
            ? shiftEvent(event, 0, step, key.shiftKey)
            : shiftEvent(event, step * snap(key.shiftKey), 0, key.shiftKey);
        requestChange(id, next, key.shiftKey);
        return;
    }
    const month = view.value === 'month' || event.allDay;
    if (key.shiftKey && !month && resourceList.value.length && horizontal[key.key]) {
        const resources = visibleResources.value;
        const index = resources.findIndex((resource) => resource.id === event.resourceId);
        const next = index + horizontal[key.key]!;
        const target = resources[next];
        key.preventDefault();
        if (!target) return;
        // A resource on another page: the page follows the event
        if (props.resourcesPerPage) resourcePageIndex.value = Math.floor(next / props.resourcesPerPage);
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
}
const keyShortcuts = computed(() => {
    if (!editing.value) return undefined;
    if (view.value === 'timeline')
        return 'Alt+ArrowLeft Alt+ArrowRight Alt+Shift+ArrowLeft Alt+Shift+ArrowRight Alt+ArrowUp Alt+ArrowDown';
    const keys = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Alt+Shift+ArrowUp Alt+Shift+ArrowDown';
    return resourceList.value.length ? `${keys} Alt+Shift+ArrowLeft Alt+Shift+ArrowRight` : keys;
});
function onEventClick(id: string) {
    if (suppressClick) {
        suppressClick = false;
        return;
    }
    emit('eventClick', reported(id));
}

// Choosing empty time: a click into the column, or the "new event" button at the top of each day (keyboard)
function selectTime(day: Date, minutes: number, resourceId?: string) {
    if (props.readOnly) return;
    const start = addMinutes(startOfDay(day), props.startHour * 60 + minutes);
    emit('slotSelect', {
        start: output(toIsoDateTime(start)),
        end: output(toIsoDateTime(addMinutes(start, props.slotMinutes))),
        allDay: false,
        ...(resourceId ? { resourceId } : {}),
    });
}
const minutesAt = (pointer: MouseEvent) => {
    const box = (pointer.currentTarget as HTMLElement).getBoundingClientRect();
    if (!box.height) return 0;
    const minutes = ((pointer.clientY - box.top) / box.height) * totalMinutes.value;
    return Math.max(0, Math.floor(minutes / props.slotMinutes) * props.slotMinutes);
};
function onColumnClick(day: Date, pointer: MouseEvent, resourceId?: string) {
    if (pointer.target !== pointer.currentTarget) return;
    selectTime(day, minutesAt(pointer), resourceId);
}
function selectDay(day: Date, pointer?: MouseEvent, resourceId?: string) {
    if (props.readOnly || (pointer && pointer.target !== pointer.currentTarget)) return;
    const id = resourceId ?? (resourceFilter.value || undefined);
    emit('slotSelect', { start: toIsoDate(day), end: toIsoDate(day), allDay: true, ...(id ? { resourceId: id } : {}) });
}

// Dropping from outside: application/x-wirecore-event (JSON with title, duration in minutes …) or text
const accepts = (dragEvent: DragEvent) =>
    props.droppable &&
    !props.readOnly &&
    !!dragEvent.dataTransfer &&
    [...dragEvent.dataTransfer.types].some((type) => type === SCHEDULER_DRAG_TYPE || type === 'text/plain');
function onDragOver(dragEvent: DragEvent) {
    if (!accepts(dragEvent)) return;
    dragEvent.preventDefault();
    dragEvent.dataTransfer!.dropEffect = 'copy';
}
/** The JSON of dragged data, null when there is none or it is no JSON */
const readJson = (text: string | undefined): unknown => {
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
};
function dropData(dragEvent: DragEvent) {
    const text = dragEvent.dataTransfer?.getData('text/plain') ?? '';
    const data = readJson(dragEvent.dataTransfer?.getData(SCHEDULER_DRAG_TYPE));
    const duration = Number((data as { duration?: number } | null)?.duration) || props.slotMinutes;
    return { data, text, duration };
}
function onDrop(
    dragEvent: DragEvent,
    day: Date,
    options: { allDay?: boolean; resourceId?: string; start?: Date } = {}
) {
    if (!accepts(dragEvent)) return;
    dragEvent.preventDefault();
    const { data, text, duration } = dropData(dragEvent);
    const resourceId = options.resourceId ?? (resourceFilter.value || undefined);
    const drop = (start: string, end: string, allDay: boolean) =>
        emit('externalDrop', { data, text, start, end, allDay, ...(resourceId ? { resourceId } : {}) });
    if (options.allDay) return drop(toIsoDate(day), toIsoDate(day), true);
    const start = options.start ?? addMinutes(startOfDay(day), props.startHour * 60 + minutesAt(dragEvent));
    drop(output(toIsoDateTime(start)), output(toIsoDateTime(addMinutes(start, duration))), false);
}

// Day and week: columns per day, with resources per day and resource (a page of them with resourcesPerPage)
const timeGrid = computed(() => view.value === 'day' || view.value === 'week');
const resourcePageIndex = ref(0);
const pageOfResources = computed(() =>
    resourcePage(visibleResources.value, resourcePageIndex.value, timeGrid.value ? props.resourcesPerPage : undefined)
);
const gridResources = computed(() => pageOfResources.value.items);
const columns = computed(() => schedulerColumns(days.value, timeGrid.value ? gridResources.value : [], props.groupBy));
const headGroups = computed(() =>
    props.groupBy === 'resource'
        ? gridResources.value.map((resource) => ({
              key: resource.id,
              resource,
              day: undefined,
              span: days.value.length,
          }))
        : days.value.map((day) => ({
              key: String(day.getTime()),
              day,
              resource: undefined,
              span: gridResources.value.length,
          }))
);
const columnLabel = (column: (typeof columns.value)[number]) =>
    column.resource ? `${longDate(column.day)}, ${column.resource.label}` : longDate(column.day);
const hoursOf = (resource?: SchedulerResource) => resource?.businessHours ?? props.businessHours;
const allDayEvents = (column: (typeof columns.value)[number]) =>
    eventsOn(foreground.value, column.day).filter((event) => event.allDay && inColumn(event, column));
const backgroundsIn = (column: (typeof columns.value)[number]) =>
    eventsOn(backgrounds.value, column.day).filter((event) => !event.resourceId || inColumn(event, column));
const timed = (column: (typeof columns.value)[number]) =>
    layoutDay(
        foreground.value.filter((event) => inColumn(event, column)),
        column.day,
        props.startHour,
        props.endHour
    );
const timedBackgrounds = (column: (typeof columns.value)[number]) =>
    layoutDay(backgroundsIn(column), column.day, props.startHour, props.endHour);
const eventPlace = (item: { top: number; height: number; column: number; columns: number }) =>
    props.overlapMode === 'stack'
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
const body = useTemplateRef<HTMLElement>('body');
const timelineScroll = useTemplateRef<HTMLElement>('timelineScroll');
const minutesOf = (value: string) => {
    const [hour = 0, minute = 0] = value.split(':').map(Number);
    return hour * 60 + minute;
};
async function scrollToStart() {
    if (!props.startScrollTime) return;
    await nextTick();
    const minutes = minutesOf(props.startScrollTime) - props.startHour * 60;
    if (body.value) body.value.scrollTop = Math.max(0, (minutes / 60) * HOUR);
    if (timelineScroll.value && timelineRange.value === 'day')
        timelineScroll.value.scrollLeft = Math.max(0, minutes * pxPerMinute.value);
}
onMounted(scrollToStart);
watch(view, scrollToStart);

// Timeline: resources as rows (stacked lanes for overlapping events), time along the row
const segments = computed(() => timelineSegments(days.value, timelineRange.value, props.startHour, props.endHour));
const slotMinutesOfAxis = computed(() => (timelineRange.value === 'day' ? 60 : 1440));
const slotWidth = computed(() =>
    Math.round((timelineRange.value === 'day' ? 64 : timelineRange.value === 'week' ? 160 : 48) * zoom.value)
);
const pxPerMinute = computed(() => slotWidth.value / slotMinutesOfAxis.value);
const axisMinutes = computed(() => segments.value.reduce((sum, segment) => sum + segment.minutes, 0));
const timelineSlots = computed(() =>
    timelineRange.value === 'day'
        ? hours.value.map((hour) => ({ key: hour, label: hourLabel(hour), sub: '' }))
        : days.value.map((day) => ({
              key: day.getTime(),
              label: format(
                  timelineRange.value === 'week'
                      ? { weekday: 'short', day: 'numeric', month: 'numeric' }
                      : { day: 'numeric' }
              ).format(day),
              sub: timelineRange.value === 'month' ? format({ weekday: 'narrow' }).format(day) : '',
          }))
);
interface TimelineRow {
    key: string;
    group?: string;
    resource?: SchedulerResource;
    items: ReturnType<typeof layoutTimeline>;
    top: number;
    height: number;
    index: number;
}
const timelineRows = computed(() => {
    const rows: TimelineRow[] = [];
    let top = 0;
    let lastGroup: string | undefined;
    visibleResources.value.forEach((resource, index) => {
        if (resource.group && resource.group !== lastGroup) {
            rows.push({
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
            foreground.value.filter((event) => event.resourceId === resource.id),
            segments.value
        );
        const height = Math.max(1, items[0]?.lanes ?? 1) * LANE + 12;
        rows.push({ key: resource.id, resource, items, top, height, index });
        top += height;
    });
    return rows;
});
const timelineHeight = computed(() => timelineRows.value.reduce((sum, row) => sum + row.height, 0));
const timelineItem = (id: string) => {
    for (const row of timelineRows.value) {
        const item = row.items.find((entry) => entry.event.id === id);
        if (item) return { ...item, row: row.index };
    }
    return undefined;
};
// Window of rows for many resources: only the rows in view (and some around) are rendered
const scrollTop = ref(0);
const viewport = ref(600);
const virtual = computed(() => visibleResources.value.length > VIRTUAL_ROWS);
const windowRows = computed(() => {
    if (!virtual.value) return { rows: timelineRows.value, before: 0, after: 0 };
    const from = scrollTop.value - 400;
    const to = scrollTop.value + viewport.value + 400;
    const rows = timelineRows.value.filter((row) => row.top + row.height > from && row.top < to);
    const before = rows[0]?.top ?? 0;
    const last = rows.at(-1);
    return { rows, before, after: timelineHeight.value - (last ? last.top + last.height : 0) };
});
onMounted(() => (viewport.value = timelineScroll.value?.clientHeight || 600));
let scrollFrame = 0;
function onTimelineScroll() {
    if (!virtual.value) return;
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
        scrollTop.value = timelineScroll.value?.scrollTop ?? 0;
        viewport.value = timelineScroll.value?.clientHeight || 600;
    });
}
const timelineClosed = (resource?: SchedulerResource) => {
    const hours = hoursOf(resource);
    if (!hours) return [];
    let offset = 0;
    return segments.value.flatMap((segment) => {
        const from = segment.start.getHours() * 60 + segment.start.getMinutes();
        const blocks = closedRanges(hours, segment.start)
            .map(([start, end]) => [Math.max(start, from), Math.min(end, from + segment.minutes)] as const)
            .filter(([start, end]) => end > start)
            .map(([start, end]) => ({
                left: (offset + start - from) * pxPerMinute.value,
                width: (end - start) * pxPerMinute.value,
            }));
        offset += segment.minutes;
        return blocks;
    });
};
const timelineBackgrounds = (resource?: SchedulerResource) =>
    layoutTimeline(
        backgrounds.value.filter((event) => !event.resourceId || event.resourceId === resource?.id),
        segments.value
    );
const nowLeft = computed(() => {
    if (!wallNow.value) return -1;
    const offset = timelineOffset(segments.value, wallNow.value);
    return offset > 0 && offset < axisMinutes.value ? offset * pxPerMinute.value : -1;
});
const roundTo = (date: Date, minutes: number) => {
    const ofDay = date.getHours() * 60 + date.getMinutes();
    return addMinutes(startOfDay(date), Math.round(ofDay / minutes) * minutes);
};
function timelinePreview(event: SchedulerEvent, minutes: number, dy: number, resize: boolean) {
    const rows = timelineRows.value.filter((row) => row.resource);
    const startRow = timelineRows.value.find((row) => row.index === dragStart.row);
    const y = (startRow ? startRow.top + startRow.height / 2 : 0) + dy;
    const target = resize ? undefined : rows.find((row) => y >= row.top && y < row.top + row.height)?.resource;
    const resourceId = target?.id ?? event.resourceId;
    let next: { start: string; end: string };
    if (event.allDay) {
        const shift = Math.round(minutes / 1440);
        next = shiftEvent(event, 0, shift, resize);
    } else if (resize) {
        const end = roundTo(timelineTimeAt(segments.value, dragStart.offset + dragStart.length + minutes), snap(true));
        const start = parseLocal(event.start);
        next = { start: event.start, end: toIsoDateTime(end > start ? end : addMinutes(start, snap(true))) };
    } else {
        const start = roundTo(timelineTimeAt(segments.value, dragStart.offset + minutes), snap(false));
        const duration = parseLocal(event.end).getTime() - parseLocal(event.start).getTime();
        next = { start: toIsoDateTime(start), end: toIsoDateTime(new Date(start.getTime() + duration)) };
    }
    if (next.start === event.start && next.end === event.end && resourceId === event.resourceId) return null;
    return { ...next, resourceId };
}
const trackTime = (pointer: MouseEvent) => {
    const box = (pointer.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rtl.value ? box.right - pointer.clientX : pointer.clientX - box.left;
    return timelineTimeAt(segments.value, x / pxPerMinute.value);
};
function onTrackClick(pointer: MouseEvent, resource: SchedulerResource) {
    if (pointer.target !== pointer.currentTarget || props.readOnly) return;
    const at = trackTime(pointer);
    if (timelineRange.value !== 'day') return selectDay(startOfDay(at), undefined, resource.id);
    const start = roundTo(at, props.slotMinutes);
    emit('slotSelect', {
        start: output(toIsoDateTime(start)),
        end: output(toIsoDateTime(addMinutes(start, props.slotMinutes))),
        allDay: false,
        resourceId: resource.id,
    });
}
function onTrackDrop(dragEvent: DragEvent, resource: SchedulerResource) {
    const at = trackTime(dragEvent);
    if (timelineRange.value !== 'day')
        return onDrop(dragEvent, startOfDay(at), { allDay: true, resourceId: resource.id });
    onDrop(dragEvent, at, { resourceId: resource.id, start: roundTo(at, props.slotMinutes) });
}
function newInRow(resource: SchedulerResource) {
    if (timelineRange.value === 'day') return selectTime(days.value[0]!, 0, resource.id);
    selectDay(days.value[0]!, undefined, resource.id);
}

// Month: "+N more" (day view or popover), compact month with the list of the chosen day on small screens
const visibleInMonth = (day: Date) => eventsOn(foreground.value, day);
const backgroundsOn = (day: Date) => eventsOn(backgrounds.value, day);
const morePanel = useTemplateRef<{ open: (anchor: HTMLElement) => void; close: () => void }>('morePanel');
const moreDay = ref<Date | null>(null);
function onMore(day: Date, pointer: MouseEvent) {
    if (!props.morePopover) return openDay(day);
    moreDay.value = day;
    morePanel.value?.open(pointer.currentTarget as HTMLElement);
}
function onMoreEvent(id: string) {
    morePanel.value?.close();
    onEventClick(id);
}
const width = ref<number | null>(null);
let observer: ResizeObserver | undefined;
onMounted(() => {
    if (props.compactBreakpoint === undefined || typeof ResizeObserver === 'undefined' || !root.value) return;
    observer = new ResizeObserver(([entry]) => (width.value = entry?.contentRect.width ?? null));
    observer.observe(root.value);
});
onBeforeUnmount(() => observer?.disconnect());
const compact = computed(
    () => props.compactBreakpoint !== undefined && width.value !== null && width.value < props.compactBreakpoint
);
const chosenDay = ref<string | null>(null);
const compactDay = computed(() => parseLocal(chosenDay.value ?? toIsoDate(current.value)));

// Year: twelve months, days with events marked
const counts = computed(() => (view.value === 'year' ? eventCounts(foreground.value, days.value) : new Map()));
function openMonth(day: Date) {
    setDate(day);
    setView('month');
}

const agendaDays = computed(() =>
    days.value.map((day) => ({ day, events: eventsOn(foreground.value, day) })).filter((entry) => entry.events.length)
);
const subHeading = computed(() => `h${Math.min(6, props.headingLevel + 1)}`);
</script>

<template>
    <!-- Calendar: toolbar (today, back/forward, title, views); events are buttons named by title and time -->
    <div
        ref="root"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="region"
        :aria-label="label ?? t.label"
        :aria-busy="busy || undefined"
    >
        <div :class="styles.toolbar()">
            <Button variant="outline" size="sm" @click="setDate(new Date())">{{ t.today }}</Button>
            <div :class="styles.nav()">
                <IconButton
                    :icon="ChevronLeft"
                    :label="t.previous"
                    variant="text"
                    size="sm"
                    @click="setDate(shiftView(view, current, -1, timelineRange))"
                />
                <IconButton
                    :icon="ChevronRight"
                    :label="t.next"
                    variant="text"
                    size="sm"
                    @click="setDate(shiftView(view, current, 1, timelineRange))"
                />
            </div>
            <component :is="`h${headingLevel}`" :class="styles.title()" aria-live="polite">{{ title }}</component>
            <NativeSelect
                v-if="resourceList.length"
                :class="styles.filter()"
                size="sm"
                :aria-label="t.resourceFilter"
                :placeholder="t.allResources"
                :items="resourceList.map((resource) => ({ value: resource.id, label: resource.label }))"
                :model-value="resourceFilter"
                @update:model-value="setFilter"
            />
            <div v-if="pageOfResources.pageCount > 1" :class="styles.toolGroup()">
                <IconButton
                    :icon="ChevronLeft"
                    :label="t.previousResources"
                    variant="text"
                    size="sm"
                    :disabled="pageOfResources.page === 0"
                    @click="resourcePageIndex = pageOfResources.page - 1"
                />
                <span :class="styles.resourcePage()" aria-live="polite">{{
                    t.resourceRange(pageOfResources.from, pageOfResources.to, visibleResources.length)
                }}</span>
                <IconButton
                    :icon="ChevronRight"
                    :label="t.nextResources"
                    variant="text"
                    size="sm"
                    :disabled="pageOfResources.page === pageOfResources.pageCount - 1"
                    @click="resourcePageIndex = pageOfResources.page + 1"
                />
            </div>
            <template v-if="view === 'timeline'">
                <SegmentedControl
                    :label="t.range"
                    size="sm"
                    :model-value="timelineRange"
                    @update:model-value="$event && setRange($event as SchedulerTimelineRange)"
                >
                    <SegmentedControlItem v-for="option in ['day', 'week', 'month']" :key="option" :value="option">{{
                        t.ranges[option]
                    }}</SegmentedControlItem>
                </SegmentedControl>
                <div :class="styles.toolGroup()">
                    <IconButton
                        :icon="ZoomOut"
                        :label="t.zoomOut"
                        variant="text"
                        size="sm"
                        :disabled="zoom <= ZOOMS[0]!"
                        @click="setZoom(-1)"
                    />
                    <IconButton
                        :icon="ZoomIn"
                        :label="t.zoomIn"
                        variant="text"
                        size="sm"
                        :disabled="zoom >= ZOOMS.at(-1)!"
                        @click="setZoom(1)"
                    />
                </div>
            </template>
            <SegmentedControl
                v-if="views.length > 1"
                :label="t.view"
                size="sm"
                :model-value="view"
                @update:model-value="$event && setView($event as SchedulerView)"
            >
                <SegmentedControlItem v-for="option in views" :key="option" :value="option">{{
                    t.views[option]
                }}</SegmentedControlItem>
            </SegmentedControl>
        </div>
        <div v-if="busy" :class="styles.loadingBar()" aria-hidden="true" />
        <div v-if="failed" :class="styles.alert()" role="alert">
            {{ t.error }}
            <Button variant="outline" size="sm" @click="controller?.refresh()">{{ t.retry }}</Button>
        </div>

        <!-- Day and week: header, all-day row, time grid -->
        <div v-if="timeGrid" :class="styles.grid()" :style="{ '--wc-days': columns.length, '--wc-hour': `${HOUR}px` }">
            <template v-if="visibleResources.length">
                <!-- With resources: the groups (days or resources) above, the columns below -->
                <span :class="styles.corner()" />
                <template v-for="group in headGroups" :key="group.key">
                    <button
                        v-if="group.day && view === 'week'"
                        type="button"
                        :class="styles.dayHead()"
                        :style="{ gridColumn: `span ${group.span}` }"
                        :aria-current="isToday(group.day) ? 'date' : undefined"
                        @click="openDay(group.day)"
                    >
                        <span :class="styles.weekday()">{{ format({ weekday: 'short' }).format(group.day) }}</span>
                        <span :class="styles.dayNumber()">{{ group.day.getDate() }}</span>
                        <span :class="styles.srOnly()">{{ longDate(group.day) }}</span>
                    </button>
                    <div
                        v-else-if="group.day"
                        :class="styles.dayHead()"
                        :style="{ gridColumn: `span ${group.span}` }"
                        :aria-current="isToday(group.day) ? 'date' : undefined"
                    >
                        <span :class="styles.weekday()">{{ format({ weekday: 'short' }).format(group.day) }}</span>
                        <span :class="styles.dayNumber()">{{ group.day.getDate() }}</span>
                    </div>
                    <div v-else :class="styles.groupHead()" :style="{ gridColumn: `span ${group.span}` }">
                        <Avatar
                            :class="styles.avatar()"
                            :name="group.resource!.label"
                            :src="group.resource!.avatar"
                            size="sm"
                            aria-hidden="true"
                        />
                        <span :class="styles.resourceName()">{{ group.resource!.label }}</span>
                    </div>
                </template>
                <span :class="styles.corner()" />
                <template v-for="column in columns" :key="`head-${column.day.getTime()}-${column.resource!.id}`">
                    <div v-if="groupBy === 'date'" :class="styles.resourceHead()">
                        <Avatar
                            :class="styles.avatar()"
                            :name="column.resource!.label"
                            :src="column.resource!.avatar"
                            size="sm"
                            aria-hidden="true"
                        />
                        <span :class="styles.resourceName()">{{ column.resource!.label }}</span>
                    </div>
                    <button
                        v-else-if="view === 'week'"
                        type="button"
                        :class="styles.dayHead()"
                        :aria-current="isToday(column.day) ? 'date' : undefined"
                        @click="openDay(column.day)"
                    >
                        <span :class="styles.weekday()">{{ format({ weekday: 'short' }).format(column.day) }}</span>
                        <span :class="styles.dayNumber()">{{ column.day.getDate() }}</span>
                        <span :class="styles.srOnly()">{{ longDate(column.day) }}</span>
                    </button>
                    <div v-else :class="styles.dayHead()" :aria-current="isToday(column.day) ? 'date' : undefined">
                        <span :class="styles.weekday()">{{ format({ weekday: 'short' }).format(column.day) }}</span>
                        <span :class="styles.dayNumber()">{{ column.day.getDate() }}</span>
                    </div>
                </template>
            </template>
            <template v-else>
                <span :class="styles.corner()" />
                <template v-for="day in days" :key="day.getTime()">
                    <button
                        v-if="view === 'week'"
                        type="button"
                        :class="styles.dayHead()"
                        :aria-current="isToday(day) ? 'date' : undefined"
                        @click="openDay(day)"
                    >
                        <span :class="styles.weekday()">{{ format({ weekday: 'short' }).format(day) }}</span>
                        <span :class="styles.dayNumber()">{{ day.getDate() }}</span>
                        <span :class="styles.srOnly()">{{ longDate(day) }}</span>
                    </button>
                    <div v-else :class="styles.dayHead()" :aria-current="isToday(day) ? 'date' : undefined">
                        <span :class="styles.weekday()">{{ format({ weekday: 'short' }).format(day) }}</span>
                        <span :class="styles.dayNumber()">{{ day.getDate() }}</span>
                    </div>
                </template>
            </template>
            <span :class="styles.allDayLabel()">{{ t.allDay }}</span>
            <div
                v-for="column in columns"
                :key="`all-${column.day.getTime()}-${column.resource?.id}`"
                :class="styles.allDayCell()"
                @click="selectDay(column.day, $event, column.resource?.id)"
                @dragover="onDragOver"
                @drop="onDrop($event, column.day, { allDay: true, resourceId: column.resource?.id })"
            >
                <span
                    v-for="event in backgroundsIn(column).filter((item) => item.allDay)"
                    :key="event.id"
                    :class="scheduler({ tone: toneOf(event) }).allDayBackground()"
                    >{{ event.title }}</span
                >
                <button
                    v-for="event in allDayEvents(column)"
                    :key="event.id"
                    type="button"
                    :data-event-id="event.id"
                    :class="scheduler({ tone: toneOf(event) }).allDayEvent()"
                    @click="onEventClick(event.id)"
                    @keydown="onEventKey(event.id, $event)"
                >
                    <Repeat v-if="event.seriesId" :class="styles.seriesIcon()" aria-hidden="true" />{{ event.title
                    }}<span v-if="event.seriesId" :class="styles.srOnly()">{{ seriesText(event) }}</span>
                </button>
            </div>
            <div ref="body" :class="styles.body()" :style="{ maxHeight: height }">
                <div :class="styles.hours()" :style="{ height: `${hours.length * HOUR}px` }" aria-hidden="true">
                    <span
                        v-for="(hour, index) in hours"
                        :key="hour"
                        :class="styles.hour()"
                        :style="{ top: `${index * HOUR}px` }"
                        >{{ hourLabel(hour) }}</span
                    >
                </div>
                <div
                    v-for="(column, columnIndex) in columns"
                    :key="`time-${column.day.getTime()}-${column.resource?.id}`"
                    role="group"
                    data-day-column=""
                    :aria-label="columnLabel(column)"
                    :class="styles.dayColumn()"
                    :style="{ height: `${hours.length * HOUR}px` }"
                    @click="onColumnClick(column.day, $event, column.resource?.id)"
                    @dragover="onDragOver"
                    @drop="onDrop($event, column.day, { resourceId: column.resource?.id })"
                >
                    <button
                        v-if="!readOnly"
                        type="button"
                        :class="styles.newEvent()"
                        @click="selectTime(column.day, 0, column.resource?.id)"
                    >
                        {{
                            column.resource
                                ? t.newEventFor(column.resource.label, longDate(column.day))
                                : t.newEvent(longDate(column.day))
                        }}
                    </button>
                    <span
                        v-for="(block, index) in closedTimes(hoursOf(column.resource), column.day, startHour, endHour)"
                        :key="`closed-${index}`"
                        :class="styles.closed()"
                        :style="{ top: `${block.top}%`, height: `${block.height}%` }"
                        aria-hidden="true"
                    />
                    <span
                        v-for="event in backgroundsIn(column).filter((item) => item.allDay)"
                        :key="`bg-${event.id}`"
                        :class="scheduler({ tone: toneOf(event) }).backgroundEvent()"
                        :style="{ top: 0, height: '100%' }"
                        aria-hidden="true"
                    />
                    <span
                        v-for="item in timedBackgrounds(column)"
                        :key="`bg-${item.event.id}`"
                        :class="scheduler({ tone: toneOf(item.event) }).backgroundEvent()"
                        :style="{ top: `${item.top}%`, height: `${item.height}%` }"
                        >{{ item.event.title }}</span
                    >
                    <button
                        v-for="item in timed(column)"
                        :key="item.event.id"
                        type="button"
                        :data-event-id="item.event.id"
                        :data-dragging="drag?.id === item.event.id || undefined"
                        :data-invalid="(drag?.id === item.event.id && drag.invalid) || undefined"
                        :aria-keyshortcuts="keyShortcuts"
                        :class="scheduler({ tone: toneOf(item.event) }).event()"
                        :style="eventPlace(item)"
                        @click="onEventClick(item.event.id)"
                        @keydown="onEventKey(item.event.id, $event)"
                        @pointerdown="onPointerDown(item.event.id, false, $event, columnIndex)"
                    >
                        <span :class="styles.eventTitle()"
                            ><Repeat v-if="item.event.seriesId" :class="styles.seriesIcon()" aria-hidden="true" />{{
                                item.event.title
                            }}</span
                        >
                        <span :class="styles.eventTime()">{{ timeRange(item.event) }}</span>
                        <span v-if="item.event.seriesId" :class="styles.srOnly()">{{ seriesText(item.event) }}</span>
                        <span
                            v-if="editing"
                            :class="styles.resizeHandle()"
                            aria-hidden="true"
                            @pointerdown.stop="onPointerDown(item.event.id, true, $event, columnIndex)"
                        />
                    </button>
                    <span
                        v-if="isToday(column.day) && nowTop >= 0 && nowTop <= 100"
                        :class="styles.now()"
                        :style="{ top: `${nowTop}%` }"
                        aria-hidden="true"
                    />
                </div>
            </div>
        </div>

        <!-- Timeline: resources as rows, time along the row -->
        <div
            v-else-if="view === 'timeline'"
            ref="timelineScroll"
            :class="styles.timeline()"
            :style="{ maxHeight: height }"
            @scroll="onTimelineScroll"
        >
            <div :class="styles.timelineGrid()">
                <div :class="styles.timelineCorner()">{{ t.resource }}</div>
                <div :class="styles.timelineHead()" aria-hidden="true">
                    <span
                        v-for="slot in timelineSlots"
                        :key="slot.key"
                        :class="styles.timelineSlot()"
                        :style="{ width: `${slotWidth}px` }"
                    >
                        <span v-if="slot.sub">{{ slot.sub }}</span>
                        {{ slot.label }}
                    </span>
                </div>
                <div
                    v-if="windowRows.before"
                    :class="styles.timelineSpacer()"
                    :style="{ height: `${windowRows.before}px` }"
                />
                <template v-for="row in windowRows.rows" :key="row.key">
                    <div v-if="row.group" :class="styles.timelineGroup()" :style="{ height: `${row.height}px` }">
                        {{ row.group }}
                    </div>
                    <div
                        v-else
                        role="group"
                        :aria-label="row.resource!.label"
                        :class="styles.timelineRow()"
                        :style="{ height: `${row.height}px` }"
                    >
                        <div :class="styles.timelineLabel()">
                            <Avatar
                                :class="styles.avatar()"
                                :name="row.resource!.label"
                                :src="row.resource!.avatar"
                                size="sm"
                                aria-hidden="true"
                            />
                            <span :class="styles.resourceName()">{{ row.resource!.label }}</span>
                        </div>
                        <div
                            data-timeline-track=""
                            :class="styles.timelineTrack()"
                            :style="{ width: `${axisMinutes * pxPerMinute}px`, '--wc-slot': `${slotWidth}px` }"
                            @click="onTrackClick($event, row.resource!)"
                            @dragover="onDragOver"
                            @drop="onTrackDrop($event, row.resource!)"
                        >
                            <button
                                v-if="!readOnly"
                                type="button"
                                :class="styles.newEvent()"
                                @click="newInRow(row.resource!)"
                            >
                                {{ t.newEventFor(row.resource!.label, longDate(days[0]!)) }}
                            </button>
                            <span
                                v-for="(block, index) in timelineClosed(row.resource)"
                                :key="`closed-${index}`"
                                :class="styles.closed()"
                                :style="{
                                    insetInlineStart: `${block.left}px`,
                                    width: `${block.width}px`,
                                    top: 0,
                                    bottom: 0,
                                }"
                                aria-hidden="true"
                            />
                            <span
                                v-for="item in timelineBackgrounds(row.resource)"
                                :key="`bg-${item.event.id}`"
                                :class="scheduler({ tone: toneOf(item.event) }).backgroundEvent()"
                                :style="{
                                    insetInlineStart: `${item.offset * pxPerMinute}px`,
                                    width: `${item.length * pxPerMinute}px`,
                                    top: 0,
                                    bottom: 0,
                                }"
                                >{{ item.event.title }}</span
                            >
                            <button
                                v-for="item in row.items"
                                :key="item.event.id"
                                type="button"
                                :data-event-id="item.event.id"
                                :data-dragging="drag?.id === item.event.id || undefined"
                                :data-invalid="(drag?.id === item.event.id && drag.invalid) || undefined"
                                :aria-keyshortcuts="keyShortcuts"
                                :class="scheduler({ tone: toneOf(item.event) }).timelineEvent()"
                                :style="{
                                    insetInlineStart: `${item.offset * pxPerMinute}px`,
                                    width: `${Math.max(8, item.length * pxPerMinute)}px`,
                                    top: `${6 + item.lane * LANE}px`,
                                    height: `${LANE - 4}px`,
                                }"
                                @click="onEventClick(item.event.id)"
                                @keydown="onEventKey(item.event.id, $event)"
                                @pointerdown="onPointerDown(item.event.id, false, $event)"
                            >
                                <span :class="styles.eventTitle()"
                                    ><Repeat
                                        v-if="item.event.seriesId"
                                        :class="styles.seriesIcon()"
                                        aria-hidden="true"
                                    />{{ item.event.title }}</span
                                >
                                <span :class="styles.srOnly()">{{ timeRange(item.event) }}</span>
                                <span v-if="item.event.seriesId" :class="styles.srOnly()">{{
                                    seriesText(item.event)
                                }}</span>
                                <span
                                    v-if="editing"
                                    :class="styles.timelineResize()"
                                    aria-hidden="true"
                                    @pointerdown.stop="onPointerDown(item.event.id, true, $event)"
                                />
                            </button>
                            <span
                                v-if="nowLeft >= 0"
                                :class="styles.timelineNow()"
                                :style="{ insetInlineStart: `${nowLeft}px` }"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </template>
                <div
                    v-if="windowRows.after"
                    :class="styles.timelineSpacer()"
                    :style="{ height: `${windowRows.after}px` }"
                />
            </div>
        </div>

        <!-- Month: weeks as table rows -->
        <div v-else-if="view === 'month'" :class="styles.monthScroll()">
            <table :class="styles.month()">
                <caption :class="styles.caption()">
                    {{
                        title
                    }}
                </caption>
                <thead>
                    <tr>
                        <th v-for="weekday in weekdays" :key="weekday" scope="col" :class="styles.monthHead()">
                            {{ weekday }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="week in weeks" :key="week[0]!.getTime()">
                        <td
                            v-for="day in week"
                            :key="day.getTime()"
                            :class="styles.monthCell()"
                            :data-month-day="toIsoDate(day)"
                            :data-outside="day.getMonth() !== current.getMonth() || undefined"
                            @click="selectDay(day, $event)"
                            @dragover="onDragOver"
                            @drop="onDrop($event, day, { allDay: true })"
                        >
                            <button
                                v-if="compact"
                                type="button"
                                :class="styles.monthDay()"
                                :aria-label="
                                    visibleInMonth(day).length
                                        ? `${longDate(day)}, ${pluralText(t.eventCount, visibleInMonth(day).length, locale)}`
                                        : longDate(day)
                                "
                                :aria-pressed="sameDay(day, compactDay)"
                                :aria-current="isToday(day) ? 'date' : undefined"
                                @click="chosenDay = toIsoDate(day)"
                            >
                                {{ day.getDate() }}
                            </button>
                            <button
                                v-else
                                type="button"
                                :class="styles.monthDay()"
                                :aria-label="longDate(day)"
                                :aria-current="isToday(day) ? 'date' : undefined"
                                @click="openDay(day)"
                            >
                                {{ day.getDate() }}
                            </button>
                            <span
                                v-if="compact && visibleInMonth(day).length"
                                :class="styles.monthDot()"
                                aria-hidden="true"
                            />
                            <div v-else-if="!compact" :class="styles.monthEvents()">
                                <span
                                    v-for="event in backgroundsOn(day)"
                                    :key="`bg-${event.id}`"
                                    :class="scheduler({ tone: toneOf(event) }).allDayBackground()"
                                    >{{ event.title }}</span
                                >
                                <button
                                    v-for="event in visibleInMonth(day).slice(0, monthEventLimit)"
                                    :key="event.id"
                                    type="button"
                                    :data-event-id="event.id"
                                    :class="scheduler({ tone: toneOf(event) }).allDayEvent()"
                                    @click="onEventClick(event.id)"
                                    @keydown="onEventKey(event.id, $event)"
                                    @pointerdown="onPointerDown(event.id, false, $event)"
                                >
                                    <Repeat v-if="event.seriesId" :class="styles.seriesIcon()" aria-hidden="true" />{{
                                        event.allDay ? event.title : `${time(parseLocal(event.start))} ${event.title}`
                                    }}<span v-if="event.seriesId" :class="styles.srOnly()">{{
                                        seriesText(event)
                                    }}</span>
                                </button>
                                <button
                                    v-if="visibleInMonth(day).length > monthEventLimit"
                                    type="button"
                                    :class="styles.more()"
                                    @click="onMore(day, $event)"
                                >
                                    {{ t.more(visibleInMonth(day).length - monthEventLimit) }}
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <section v-if="compact" :class="styles.compactList()">
                <component :is="subHeading" :class="styles.agendaDay()">{{ longDate(compactDay) }}</component>
                <ul v-if="visibleInMonth(compactDay).length" :class="styles.agendaList()">
                    <li v-for="event in visibleInMonth(compactDay)" :key="event.id">
                        <button
                            type="button"
                            :data-event-id="event.id"
                            :class="scheduler({ tone: toneOf(event) }).agendaEvent()"
                            @click="onEventClick(event.id)"
                        >
                            <span :class="styles.agendaTime()">{{ timeRange(event) }}</span>
                            <span>{{ event.title }}</span>
                        </button>
                    </li>
                </ul>
                <p v-else :class="styles.empty()">{{ t.empty }}</p>
            </section>
            <Popover v-if="morePopover" ref="morePanel" placement="bottom-start">
                <PopoverContent :title="moreDay ? longDate(moreDay) : ''">
                    <div :class="styles.moreList()">
                        <button
                            v-for="event in moreDay ? visibleInMonth(moreDay) : []"
                            :key="event.id"
                            type="button"
                            :class="scheduler({ tone: toneOf(event) }).allDayEvent()"
                            @click="onMoreEvent(event.id)"
                        >
                            {{ event.allDay ? event.title : `${time(parseLocal(event.start))} ${event.title}` }}
                        </button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        <!-- Year: twelve small months -->
        <SchedulerYear
            v-else-if="view === 'year'"
            :year="current.getFullYear()"
            :date="toIsoDate(current)"
            :counts="counts"
            :today="wallNow ? toIsoDate(wallNow) : null"
            :week-starts-on="weekStartsOn"
            :locale="locale"
            :rtl="rtl"
            :heading-level="Math.min(6, headingLevel + 1)"
            :event-count="t.eventCount"
            :styles="styles"
            @open="openDay"
            @month="openMonth"
        />

        <!-- Agenda: the next 30 days with events -->
        <div v-else :class="styles.agenda()">
            <section v-for="entry in agendaDays" :key="entry.day.getTime()">
                <component :is="subHeading" :class="styles.agendaDay()">{{ longDate(entry.day) }}</component>
                <ul :class="styles.agendaList()">
                    <li v-for="event in entry.events" :key="event.id">
                        <button
                            type="button"
                            :data-event-id="event.id"
                            :class="scheduler({ tone: toneOf(event) }).agendaEvent()"
                            @click="onEventClick(event.id)"
                        >
                            <span :class="styles.agendaTime()">{{ timeRange(event) }}</span>
                            <span
                                ><Repeat v-if="event.seriesId" :class="styles.seriesIcon()" aria-hidden="true" />{{
                                    event.title
                                }}</span
                            >
                            <span v-if="event.seriesId" :class="styles.srOnly()">{{ seriesText(event) }}</span>
                        </button>
                    </li>
                </ul>
            </section>
            <p v-if="agendaDays.length === 0" :class="styles.empty()">{{ t.empty }}</p>
        </div>
        <p role="status" :class="styles.status()">{{ status }}</p>
        <SchedulerSeriesDialog
            :open="!!pending"
            :title="t.seriesTitle"
            :description="pending ? t.seriesQuestion(base(pending.id).title) : ''"
            :cancel-label="translations.common.cancel"
            :only-label="t.onlyThis"
            :all-label="t.allInSeries"
            :return-focus="() => eventElement(seriesFocus)"
            @choose="onSeriesChoice"
        />
    </div>
</template>
