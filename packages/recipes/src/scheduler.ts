import { addIsoDays, localeWeekInfo, toWallIso, toZonedIso } from './date-time.js';
import { defaultLocale } from './i18n.js';
import { tv } from './tv.js';
import type { VisualTone } from './visualizations.js';

// Scheduler (calendar with day, week, month and agenda views): date helpers in local time, the layout of
// overlapping events and the recipe. Dates are ISO strings without time zone: "2026-10-20" and "2026-10-20T10:00".

/** Views: day, week, month, agenda (list), timeline (resources as rows) and year (twelve small months) */
export type SchedulerView = 'day' | 'week' | 'month' | 'agenda' | 'timeline' | 'year';

export interface SchedulerEvent {
    id: string;
    title: string;
    /** "2026-10-20T10:00" (or "2026-10-20" for all-day events) */
    start: string;
    end: string;
    allDay?: boolean;
    tone?: VisualTone;
    /** Resource (person, room, machine …) the event belongs to – see `resources` of the Scheduler */
    resourceId?: string;
    /** Repeats by an RFC 5545 rule, e.g. "FREQ=WEEKLY;BYDAY=MO,WE" or "FREQ=MONTHLY;BYDAY=2MO" (see expandRecurrence) */
    rrule?: string;
    /** Left-out occurrences of the series by their start ("2026-10-26T09:00" or a date) */
    exdate?: string[];
    /** Changed single occurrences by their original start: { "2026-10-26T09:00": { start, end } } */
    overrides?: Record<string, SchedulerOccurrenceChange>;
    /** Shown behind the other events and not clickable – holidays, closures, blocked times */
    background?: boolean;
    /** Set on the occurrences of a series: the id of the series … */
    seriesId?: string;
    /** … and the original start of the occurrence */
    recurrenceId?: string;
}

/** What a single occurrence of a series changes */
export type SchedulerOccurrenceChange = Partial<
    Pick<SchedulerEvent, 'title' | 'start' | 'end' | 'tone' | 'resourceId'>
>;

/** Opening hours: on these weekdays (0 Sunday … 6 Saturday) from `start` to `end` ("08:00"–"17:00") */
export interface SchedulerBusinessHours {
    days: number[];
    start: string;
    end: string;
}

/** A person, room or machine events are planned for */
export interface SchedulerResource {
    id: string;
    label: string;
    /** Colour of its events that have no tone of their own */
    tone?: VisualTone;
    /** Group shown above the resource in the timeline (team, building …) */
    group?: string;
    /** Picture (URL); without one the initials are shown */
    avatar?: string;
    /** Own opening hours, instead of those of the Scheduler */
    businessHours?: SchedulerBusinessHours[];
}

/** Resource columns in the day and week view: per day (each day split into resources) or per resource */
export type SchedulerGroupBy = 'date' | 'resource';
/** Span of the timeline view: one day in hours, a week or a month in days */
export type SchedulerTimelineRange = 'day' | 'week' | 'month';
/** Overlapping events side by side (columns) or stacked with an offset */
export type SchedulerOverlapMode = 'columns' | 'stack';
/** Why a move or resize was not applied: `rule` (canDrop/canResize) or `overlap` (preventOverlap) */
export type SchedulerDropReason = 'rule' | 'overlap';

/** Local date and time of an ISO string (date-only strings are midnight, not UTC) */
export function parseLocal(value: string): Date {
    const [date = '', time = '00:00'] = value.split('T');
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(year!, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0);
}

const pad = (value: number) => String(value).padStart(2, '0');
/** "2026-10-20" */
export const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
/** "2026-10-20T10:00" */
export const toIsoDateTime = (date: Date) => `${toIsoDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

export const addDays = (date: Date, days: number) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, date.getHours(), date.getMinutes());
export const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);
export const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** First day of the week of this date (weekStartsOn: 0 Sunday, 1 Monday …) */
export function startOfWeek(date: Date, weekStartsOn = 1) {
    const shift = (date.getDay() - weekStartsOn + 7) % 7;
    return addDays(startOfDay(date), -shift);
}

/** Days shown by a view: one day, a week, whole weeks around the month, or the next 30 days (agenda) */
export function visibleDays(view: SchedulerView, date: Date, weekStartsOn = 1): Date[] {
    if (view === 'day') return [startOfDay(date)];
    if (view === 'week') {
        const first = startOfWeek(date, weekStartsOn);
        return Array.from({ length: 7 }, (_, index) => addDays(first, index));
    }
    if (view === 'agenda') return Array.from({ length: 30 }, (_, index) => addDays(startOfDay(date), index));
    const first = startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1), weekStartsOn);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days: Date[] = [];
    for (let day = first; day <= last || days.length % 7 !== 0; day = addDays(day, 1)) days.push(day);
    return days;
}

/** The date one view further (forward 1, back -1); the timeline moves by its range */
export function shiftView(
    view: SchedulerView,
    date: Date,
    step: 1 | -1,
    timelineRange: SchedulerTimelineRange = 'week'
): Date {
    if (view === 'timeline') return shiftView(timelineRange, date, step);
    if (view === 'year') return new Date(date.getFullYear() + step, 0, 1);
    if (view === 'day') return addDays(date, step);
    if (view === 'week') return addDays(date, 7 * step);
    if (view === 'agenda') return addDays(date, 30 * step);
    return new Date(date.getFullYear(), date.getMonth() + step, 1);
}

/** Events touching this day */
export function eventsOn(events: SchedulerEvent[], day: Date) {
    const start = startOfDay(day);
    const end = addDays(start, 1);
    return events.filter((event) => {
        const from = parseLocal(event.start);
        const to = event.allDay ? addDays(parseLocal(event.end), 1) : parseLocal(event.end);
        return from < end && to > start;
    });
}

export interface PositionedEvent {
    event: SchedulerEvent;
    /** Top and height in percent of the visible hours */
    top: number;
    height: number;
    /** Side by side: column of the event and number of columns in its group of overlapping events */
    column: number;
    columns: number;
}

/**
 * Timed events of a day in the visible hours: overlapping events share the width (greedy columns per group).
 * All-day events are left out.
 */
export function layoutDay(events: SchedulerEvent[], day: Date, startHour: number, endHour: number): PositionedEvent[] {
    const from = addMinutes(startOfDay(day), startHour * 60);
    const total = (endHour - startHour) * 60;
    const items = eventsOn(events, day)
        .filter((event) => !event.allDay)
        .map((event) => {
            const start = Math.max(0, (parseLocal(event.start).getTime() - from.getTime()) / 60_000);
            const end = Math.min(total, (parseLocal(event.end).getTime() - from.getTime()) / 60_000);
            // At least half an hour high, so title and time fit
            return { event, start, end: Math.max(end, start + 30) };
        })
        .filter((item) => item.end > 0 && item.start < total)
        .sort((a, b) => a.start - b.start || b.end - a.end);
    const result: PositionedEvent[] = [];
    let group: { item: (typeof items)[number]; column: number }[] = [];
    let groupEnd = -1;
    const flush = () => {
        const columns = Math.max(1, ...group.map((entry) => entry.column + 1));
        for (const { item, column } of group)
            result.push({
                event: item.event,
                top: (item.start / total) * 100,
                height: ((item.end - item.start) / total) * 100,
                column,
                columns,
            });
        group = [];
    };
    for (const item of items) {
        if (item.start >= groupEnd && group.length) flush();
        const taken = new Set(group.filter((entry) => entry.item.end > item.start).map((entry) => entry.column));
        let column = 0;
        while (taken.has(column)) column++;
        group.push({ item, column });
        groupEnd = Math.max(groupEnd, item.end);
    }
    if (group.length) flush();
    return result;
}

/** The event moved by minutes and days, keeping its length; with `resize` only the end moves */
export function shiftEvent(event: SchedulerEvent, minutes: number, days: number, resize = false) {
    const start = parseLocal(event.start);
    const end = parseLocal(event.end);
    const format = event.allDay ? toIsoDate : toIsoDateTime;
    if (resize) {
        const next = addMinutes(addDays(end, days), minutes);
        return { start: event.start, end: format(next > start ? next : addMinutes(start, 15)) };
    }
    return {
        start: format(addMinutes(addDays(start, days), minutes)),
        end: format(addMinutes(addDays(end, days), minutes)),
    };
}

// ── Views, ranges and resources ─────────────────────────────────────────────────────────────────────────────────

export interface SchedulerDayOptions {
    weekStartsOn?: number;
    /** Leave out the weekend days of the locale (Saturday and Sunday in Germany) */
    hideWeekends?: boolean;
    locale?: string;
    timelineRange?: SchedulerTimelineRange;
}

/** Weekend days of a locale (0 Sunday … 6 Saturday) */
export const weekendDays = (locale = defaultLocale) => localeWeekInfo(locale).weekend;

/**
 * Days of any view: like visibleDays, the timeline shows its range (a day, a week, the days of the month) and the
 * year all its days. `hideWeekends` leaves out the weekend in the week, month and timeline views.
 */
export function schedulerDays(view: SchedulerView, date: Date, options: SchedulerDayOptions = {}): Date[] {
    const { weekStartsOn = 1, hideWeekends = false, locale, timelineRange = 'week' } = options;
    let days: Date[];
    if (view === 'timeline') {
        if (timelineRange === 'month') {
            const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            days = Array.from(
                { length: count },
                (_, index) => new Date(date.getFullYear(), date.getMonth(), index + 1)
            );
        } else days = visibleDays(timelineRange, date, weekStartsOn);
    } else if (view === 'year') {
        const first = new Date(date.getFullYear(), 0, 1);
        const count = Math.round((new Date(date.getFullYear() + 1, 0, 1).getTime() - first.getTime()) / 86_400_000);
        days = Array.from({ length: count }, (_, index) => addDays(first, index));
    } else days = visibleDays(view, date, weekStartsOn);
    if (!hideWeekends || view === 'day' || view === 'agenda' || view === 'year') return days;
    const weekend = weekendDays(locale);
    const kept = days.filter((day) => !weekend.includes(day.getDay()));
    return kept.length ? kept : days;
}

/** Range of dates of a list of days: start inclusive, end exclusive ("2026-10-19" to "2026-10-26") */
export function daysRange(days: Date[]): { start: string; end: string } {
    const first = days[0] ?? new Date();
    const last = days.at(-1) ?? first;
    return { start: toIsoDate(first), end: toIsoDate(addDays(last, 1)) };
}

/** A column of the day and week view: a day, with resources a day of one resource */
export interface SchedulerColumn {
    day: Date;
    resource?: SchedulerResource;
}

/**
 * One page of resources for the time grid (`resourcesPerPage`): the shown ones, the page (kept in range), the number of
 * pages and the positions 1-based for "Resources 5–8 of 12". Without `perPage` (or few resources) all of them.
 */
export function resourcePage<T>(
    resources: readonly T[],
    page: number,
    perPage?: number
): { items: T[]; page: number; pageCount: number; from: number; to: number } {
    if (!perPage || perPage < 1 || resources.length <= perPage)
        return { items: [...resources], page: 0, pageCount: 1, from: 1, to: resources.length };
    const pageCount = Math.ceil(resources.length / perPage);
    const current = Math.max(0, Math.min(pageCount - 1, Math.floor(page)));
    const items = resources.slice(current * perPage, current * perPage + perPage);
    return { items, page: current, pageCount, from: current * perPage + 1, to: current * perPage + items.length };
}

/** Columns of the time grid: per day (`groupBy: 'date'`, each day split into the resources) or per resource */
export function schedulerColumns(
    days: Date[],
    resources: SchedulerResource[] = [],
    groupBy: SchedulerGroupBy = 'date'
): SchedulerColumn[] {
    if (!resources.length) return days.map((day) => ({ day }));
    if (groupBy === 'resource') return resources.flatMap((resource) => days.map((day) => ({ day, resource })));
    return days.flatMap((day) => resources.map((resource) => ({ day, resource })));
}

/** Whether an event belongs to a column (its day and, with resources, its resource) */
export const inColumn = (event: SchedulerEvent, column: SchedulerColumn) =>
    !column.resource || event.resourceId === column.resource.id;

/** An event's times as wall-clock times in a zone (times with an offset are converted; plain ones stay) */
export function zonedEvent(event: SchedulerEvent, timeZone?: string): SchedulerEvent {
    if (!timeZone && !/[Zz]|[+-]\d{2}:?\d{2}$/.test(event.start + event.end)) return event;
    const allDay = !!event.allDay;
    return {
        ...event,
        start: toWallIso(event.start, !allDay, timeZone) ?? event.start,
        end: toWallIso(event.end, !allDay, timeZone) ?? event.end,
    };
}

/** The current time as local Date of the wall clock in a zone (for "today" and the line of the current time) */
export const nowIn = (timeZone?: string, now = new Date()) => (timeZone ? parseLocal(toZonedIso(now, timeZone)) : now);

// ── Opening hours ───────────────────────────────────────────────────────────────────────────────────────────────

const minutesOf = (time: string) => {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Closed times of a day as minute ranges [from, to) within 0–1440 – outside the opening hours of its weekday (all
 * day when the weekday has none). No opening hours: nothing closed.
 */
export function closedRanges(hours: readonly SchedulerBusinessHours[] | undefined, day: Date): [number, number][] {
    if (!hours) return [];
    const open = hours
        .filter((entry) => entry.days.includes(day.getDay()))
        .map((entry): [number, number] => [minutesOf(entry.start), minutesOf(entry.end)])
        .filter(([from, to]) => to > from)
        .sort((a, b) => a[0] - b[0]);
    const closed: [number, number][] = [];
    let at = 0;
    for (const [from, to] of open) {
        if (from > at) closed.push([at, from]);
        at = Math.max(at, to);
    }
    if (at < 1440) closed.push([at, 1440]);
    return closed;
}

/** Closed times of a day in the visible hours as top and height in percent (for the day and week view) */
export function closedTimes(
    hours: readonly SchedulerBusinessHours[] | undefined,
    day: Date,
    startHour: number,
    endHour: number
): { top: number; height: number }[] {
    const from = startHour * 60;
    const total = (endHour - startHour) * 60;
    return closedRanges(hours, day)
        .map(([start, end]) => [Math.max(start, from) - from, Math.min(end, endHour * 60) - from] as const)
        .filter(([start, end]) => end > start)
        .map(([start, end]) => ({ top: (start / total) * 100, height: ((end - start) / total) * 100 }));
}

// ── Timeline ────────────────────────────────────────────────────────────────────────────────────────────────────

/** A stretch of the timeline axis: from `start`, `minutes` long (a day, or the visible hours of the day range) */
export interface TimelineSegment {
    start: Date;
    minutes: number;
}

/** The axis of the timeline: the visible hours of the day (range "day") or whole days */
export function timelineSegments(
    days: Date[],
    range: SchedulerTimelineRange,
    startHour: number,
    endHour: number
): TimelineSegment[] {
    if (range === 'day')
        return days.map((day) => ({
            start: addMinutes(startOfDay(day), startHour * 60),
            minutes: (endHour - startHour) * 60,
        }));
    return days.map((day) => ({ start: startOfDay(day), minutes: 1440 }));
}

/** Position of a time on the axis in minutes from its start (times between segments snap to the next one) */
export function timelineOffset(segments: TimelineSegment[], time: Date): number {
    let offset = 0;
    for (const segment of segments) {
        const into = (time.getTime() - segment.start.getTime()) / 60_000;
        if (into < 0) return offset;
        if (into <= segment.minutes) return offset + into;
        offset += segment.minutes;
    }
    return offset;
}

/** The time at a position of the axis (minutes from its start) */
export function timelineTimeAt(segments: TimelineSegment[], offset: number): Date {
    let rest = Math.max(0, offset);
    for (const [index, segment] of segments.entries()) {
        if (rest < segment.minutes || index === segments.length - 1)
            return addMinutes(segment.start, Math.min(rest, segment.minutes));
        rest -= segment.minutes;
    }
    return new Date(0);
}

export interface TimelineItem {
    event: SchedulerEvent;
    /** Start and length on the axis in minutes */
    offset: number;
    length: number;
    /** Lane of the event in its row (overlapping events are stacked) and number of lanes of the row */
    lane: number;
    lanes: number;
}

/** Events of one row on the timeline axis: overlapping ones in lanes below each other (greedy) */
export function layoutTimeline(events: SchedulerEvent[], segments: TimelineSegment[]): TimelineItem[] {
    const items = events
        .map((event) => {
            const start = parseLocal(event.start);
            const end = event.allDay ? addDays(parseLocal(event.end), 1) : parseLocal(event.end);
            const offset = timelineOffset(segments, start);
            return { event, offset, length: timelineOffset(segments, end) - offset };
        })
        .filter((item) => item.length > 0)
        .sort((a, b) => a.offset - b.offset || b.length - a.length);
    const ends: number[] = [];
    const placed = items.map((item) => {
        let lane = ends.findIndex((end) => end <= item.offset);
        if (lane < 0) lane = ends.length;
        ends[lane] = item.offset + item.length;
        return { ...item, lane };
    });
    return placed.map((item) => ({ ...item, lanes: Math.max(1, ends.length) }));
}

// ── Rules for dropping ──────────────────────────────────────────────────────────────────────────────────────────

/** End of an event as wall-clock text, exclusive (all-day events end after their last day) */
const exclusiveEnd = (event: Pick<SchedulerEvent, 'end' | 'allDay'>) =>
    event.allDay ? addIsoDays(event.end.slice(0, 10), 1) : event.end;

/** Whether two events overlap in time (touching ends do not) */
export function eventsOverlap(
    a: Pick<SchedulerEvent, 'start' | 'end' | 'allDay'>,
    b: Pick<SchedulerEvent, 'start' | 'end' | 'allDay'>
): boolean {
    return a.start < exclusiveEnd(b) && b.start < exclusiveEnd(a);
}

export interface EventDropCheck {
    /** All shown events (series expanded) */
    events: readonly SchedulerEvent[];
    event: SchedulerEvent;
    start: string;
    end: string;
    resourceId?: string;
    /** A resize (canResize) instead of a move (canDrop) */
    resize?: boolean;
    /** No overlap with other events of the same resource (of all, without resources) */
    preventOverlap?: boolean;
    canDrop?: (event: SchedulerEvent, start: string, end: string, resourceId?: string) => boolean;
    canResize?: (event: SchedulerEvent, start: string, end: string) => boolean;
}

/** Why a move or resize is not allowed (null: it is) – and the event it would overlap */
export function checkEventDrop(
    check: EventDropCheck
): { reason: SchedulerDropReason; conflict?: SchedulerEvent } | null {
    const { event, start, end, resourceId } = check;
    const allowed = check.resize
        ? (check.canResize?.(event, start, end) ?? true)
        : (check.canDrop?.(event, start, end, resourceId) ?? true);
    if (!allowed) return { reason: 'rule' };
    if (!check.preventOverlap) return null;
    const moved = { start, end, allDay: event.allDay };
    const conflict = check.events.find(
        (other) =>
            other.id !== event.id &&
            !other.background &&
            (other.resourceId ?? null) === (resourceId ?? null) &&
            eventsOverlap(moved, other)
    );
    return conflict ? { reason: 'overlap', conflict } : null;
}

/** Number of events per day ("2026-10-20" → 3), for the year view */
export function eventCounts(events: SchedulerEvent[], days: Date[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const day of days) {
        const count = eventsOn(events, day).filter((event) => !event.background).length;
        if (count) counts.set(toIsoDate(day), count);
    }
    return counts;
}

/** MIME type for dragging items from outside into the Scheduler: JSON with `title`, `duration` (minutes) … */
export const SCHEDULER_DRAG_TYPE = 'application/x-wirecore-event';

const toneClasses = {
    primary: 'border-primary bg-primary/10',
    info: 'border-info bg-info/12',
    success: 'border-success bg-success/12',
    warn: 'border-warn bg-warn/12',
    danger: 'border-danger bg-danger/12',
};

export const scheduler = tv({
    slots: {
        base: 'flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-card text-fg',
        toolbar: 'flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5',
        nav: 'flex items-center gap-0.5',
        title: 'me-auto min-w-0 truncate text-base font-semibold text-fg',
        // Week and day: header, all-day row and the time grid share the column template
        grid: 'grid grid-cols-[4.25rem_repeat(var(--wc-days),minmax(6rem,1fr))] overflow-x-auto',
        corner: 'border-b border-line',
        dayHead: [
            'flex cursor-pointer flex-col items-center gap-0.5 border-b border-s border-line py-2 hover:bg-bg-2',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        weekday: 'font-mono text-[10px] tracking-label text-muted uppercase',
        srOnly: 'sr-only',
        dayNumber: [
            'flex size-7 items-center justify-center rounded-full text-sm font-semibold',
            'in-aria-[current=date]:bg-primary in-aria-[current=date]:text-on-primary',
        ],
        allDayLabel: 'flex items-center border-b border-line pe-2 text-end font-mono text-[10px] text-muted',
        allDayCell: 'flex min-h-9 flex-col gap-0.5 border-s border-b border-line p-0.5',
        body: 'col-span-full grid grid-cols-subgrid overflow-y-auto',
        hours: 'relative',
        hour: 'absolute inset-x-0 -translate-y-1/2 pe-2 text-end font-mono text-[10px] text-muted first:translate-y-0',
        // Lines every hour (background), events positioned in percent of the visible hours
        dayColumn: [
            'relative border-s border-line',
            'bg-[linear-gradient(to_bottom,var(--wc-line)_1px,transparent_1px)] bg-[length:100%_var(--wc-hour)]',
        ],
        newEvent: [
            'sr-only cursor-pointer focus-visible:not-sr-only focus-visible:absolute focus-visible:inset-x-1 focus-visible:top-1 focus-visible:z-[3]',
            'focus-visible:rounded-md focus-visible:bg-card focus-visible:px-2 focus-visible:py-1 focus-visible:text-xs focus-visible:outline-2 focus-visible:outline-fg',
        ],
        event: [
            'absolute z-[1] flex cursor-pointer flex-col overflow-hidden rounded-md border-s-[3px] px-1.5 py-1 text-start text-xs text-fg',
            'hover:z-[2] focus-visible:z-[2] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg',
            'data-dragging:opacity-80 data-dragging:shadow-lg forced-colors:border',
            'data-invalid:outline-2 data-invalid:outline-offset-1 data-invalid:outline-danger data-invalid:outline-dashed',
        ],
        allDayEvent: [
            'flex cursor-pointer items-center truncate rounded-md border-s-[3px] px-1.5 py-0.5 text-start text-xs text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg forced-colors:border',
        ],
        eventTitle: 'truncate font-semibold',
        eventTime: 'truncate font-mono text-[10px] text-muted',
        resizeHandle: 'absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize',
        now: 'pointer-events-none absolute inset-x-0 z-[2] h-0.5 bg-danger before:absolute before:-top-1 before:-start-1 before:size-2.5 before:rounded-full before:bg-danger',
        // Month
        monthScroll: 'overflow-x-auto',
        month: 'w-full table-fixed border-collapse',
        caption: 'sr-only',
        monthHead:
            'border-b border-line py-2 text-center font-mono text-[10px] font-normal tracking-label text-muted uppercase',
        monthCell: 'h-28 border border-line p-1 align-top data-outside:bg-bg-2/60 first:border-s-0 last:border-e-0',
        monthDay: [
            'mb-0.5 flex size-7 cursor-pointer items-center justify-center rounded-full text-xs hover:bg-line',
            'aria-[current=date]:bg-primary aria-[current=date]:font-semibold aria-[current=date]:text-on-primary',
            'in-data-outside:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg',
        ],
        monthEvents: 'flex flex-col gap-0.5',
        more: [
            'cursor-pointer rounded-sm px-1 text-start text-[11px] font-medium text-muted hover:text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg',
        ],
        // Agenda
        agenda: 'flex flex-col divide-y divide-line',
        agendaDay: 'm-0 bg-bg-2 px-3 py-1.5 text-xs font-semibold text-fg',
        agendaList: 'm-0 flex list-none flex-col p-0',
        agendaEvent: [
            'flex w-full cursor-pointer items-center gap-3 border-s-[3px] px-3 py-2 text-start text-sm hover:bg-bg-2',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        agendaTime: 'w-28 shrink-0 font-mono text-xs text-muted',
        empty: 'px-3 py-10 text-center text-sm text-muted',
        status: 'sr-only',
        // Toolbar additions: resource filter, range and zoom of the timeline, loading and errors
        filter: 'w-44',
        toolGroup: 'flex items-center gap-0.5',
        /** "Resources 5–8 of 12" between the paging buttons (resourcesPerPage) */
        resourcePage: 'px-1 text-xs whitespace-nowrap text-muted tabular-nums',
        loadingBar: 'h-0.5 bg-primary motion-safe:animate-pulse',
        alert: 'flex flex-wrap items-center gap-2 border-b border-line bg-danger/8 px-3 py-2 text-sm text-danger',
        // Resources as columns: the group above (day or resource) and the resource or day below
        groupHead:
            'flex min-w-0 items-center justify-center gap-1.5 truncate border-b border-s border-line px-2 py-1.5 text-xs font-semibold text-fg',
        resourceHead:
            'flex min-w-0 items-center justify-center gap-1.5 border-b border-s border-line px-1 py-1.5 text-xs font-medium text-fg',
        resourceName: 'truncate',
        avatar: 'size-6 shrink-0 text-[10px]',
        // Closed times (hatched, not only coloured) and background events such as holidays
        closed: [
            'pointer-events-none absolute inset-x-0 bg-bg-2/60 forced-colors:border-y forced-colors:border-dashed',
            'bg-[repeating-linear-gradient(135deg,var(--wc-line)_0_1px,transparent_1px_7px)]',
        ],
        backgroundEvent: [
            'pointer-events-none absolute inset-x-0 overflow-hidden px-1.5 py-1 text-[10px] font-medium text-muted',
            'bg-[repeating-linear-gradient(45deg,var(--wc-line)_0_1px,transparent_1px_6px)] forced-colors:border',
        ],
        allDayBackground: 'truncate rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-muted forced-colors:border',
        seriesIcon: 'me-1 inline size-3 shrink-0 align-[-2px]',
        // Timeline: resources as rows, time from start to end
        timeline: 'overflow-auto',
        timelineGrid: 'grid min-w-max grid-cols-[12rem_auto]',
        timelineCorner: [
            'sticky start-0 top-0 z-[4] flex items-end border-e border-b border-line bg-card px-3 pb-1.5',
            'font-mono text-[10px] tracking-label text-muted uppercase',
        ],
        timelineHead: 'sticky top-0 z-[3] flex border-b border-line bg-card',
        timelineSlot:
            'flex shrink-0 flex-col justify-end border-s border-line px-1.5 pt-2 pb-1.5 font-mono text-[10px] whitespace-nowrap text-muted',
        timelineGroup:
            'sticky start-0 col-span-full border-b border-line bg-bg-2 px-3 py-1 text-xs font-semibold text-fg',
        timelineRow: 'col-span-full grid grid-cols-subgrid',
        timelineLabel:
            'sticky start-0 z-[2] flex min-w-0 items-center gap-2 border-e border-b border-line bg-card px-3 text-sm font-medium',
        timelineTrack: [
            'relative border-b border-line',
            'bg-[linear-gradient(to_right,var(--wc-line)_1px,transparent_1px)] bg-[length:var(--wc-slot)_100%] rtl:bg-[linear-gradient(to_left,var(--wc-line)_1px,transparent_1px)] rtl:bg-right',
        ],
        timelineEvent: [
            'absolute z-[1] flex cursor-pointer items-center overflow-hidden rounded-md border-s-[3px] px-1.5 text-start text-xs text-fg',
            'hover:z-[2] focus-visible:z-[2] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg',
            'data-dragging:opacity-80 data-dragging:shadow-lg forced-colors:border',
            'data-invalid:outline-2 data-invalid:outline-offset-1 data-invalid:outline-danger data-invalid:outline-dashed',
        ],
        timelineResize: 'absolute inset-y-0 end-0 w-1.5 cursor-ew-resize',
        timelineNow: 'pointer-events-none absolute inset-y-0 z-[2] w-0.5 bg-danger',
        timelineSpacer: 'col-span-full',
        // Year: twelve small months
        year: 'grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-x-6 gap-y-4 p-4',
        yearMonth: 'flex flex-col gap-1',
        yearMonthTitle: [
            'cursor-pointer self-start rounded-sm px-1 text-sm font-semibold text-fg hover:underline',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg',
        ],
        yearTable: 'w-full table-fixed border-collapse text-center',
        yearHead: 'pb-1 font-mono text-[10px] font-normal text-muted uppercase',
        yearCell: 'p-0',
        yearDay: [
            'relative mx-auto flex size-7 cursor-pointer items-center justify-center rounded-full text-xs hover:bg-line',
            'aria-[current=date]:bg-primary aria-[current=date]:text-on-primary data-marked:font-bold',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg',
        ],
        yearMark:
            'absolute bottom-0.5 start-1/2 size-1 -translate-x-1/2 rounded-full bg-primary in-aria-[current=date]:bg-on-primary forced-colors:bg-[CanvasText] rtl:translate-x-1/2',
        // "+N more" popover and the compact month (small screens)
        moreList: 'flex max-h-72 min-w-56 flex-col gap-1 overflow-y-auto',
        monthDot: 'mx-auto mt-0.5 block size-1.5 rounded-full bg-primary forced-colors:bg-[CanvasText]',
        compactList: 'flex flex-col border-t border-line',
    },
    variants: {
        tone: {
            primary: {
                event: toneClasses.primary,
                allDayEvent: toneClasses.primary,
                agendaEvent: 'border-primary',
                timelineEvent: toneClasses.primary,
                backgroundEvent: 'bg-primary/8',
                allDayBackground: 'bg-primary/8',
            },
            info: {
                event: toneClasses.info,
                allDayEvent: toneClasses.info,
                agendaEvent: 'border-info',
                timelineEvent: toneClasses.info,
                backgroundEvent: 'bg-info/10',
                allDayBackground: 'bg-info/10',
            },
            success: {
                event: toneClasses.success,
                allDayEvent: toneClasses.success,
                agendaEvent: 'border-success',
                timelineEvent: toneClasses.success,
                backgroundEvent: 'bg-success/10',
                allDayBackground: 'bg-success/10',
            },
            warn: {
                event: toneClasses.warn,
                allDayEvent: toneClasses.warn,
                agendaEvent: 'border-warn',
                timelineEvent: toneClasses.warn,
                backgroundEvent: 'bg-warn/10',
                allDayBackground: 'bg-warn/10',
            },
            danger: {
                event: toneClasses.danger,
                allDayEvent: toneClasses.danger,
                agendaEvent: 'border-danger',
                timelineEvent: toneClasses.danger,
                backgroundEvent: 'bg-danger/10',
                allDayBackground: 'bg-danger/10',
            },
        },
    },
    defaultVariants: {
        tone: 'primary',
    },
});

// ── Mobile views (React Native): agenda, compact month, time grid ───────────────────────────────────────────────

/** A day of the agenda with the events touching it */
export interface AgendaSection {
    day: Date;
    /** ISO date of the day ("2026-10-21") */
    key: string;
    events: SchedulerEvent[];
}

/** Order of events in a list: all-day events first, then by start, the longer one first, then by title */
export function compareEvents(a: SchedulerEvent, b: SchedulerEvent): number {
    if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
    const start = parseLocal(a.start).getTime() - parseLocal(b.start).getTime();
    if (start) return start;
    const end = parseLocal(b.end).getTime() - parseLocal(a.end).getTime();
    return end || a.title.localeCompare(b.title);
}

/**
 * The agenda: per day the events touching it, sorted (compareEvents) – background events and days without events are
 * left out. An event over several days is listed on each of them.
 */
export function agendaSections(events: SchedulerEvent[], days: Date[]): AgendaSection[] {
    const shown = events.filter((event) => !event.background);
    return days
        .map((day) => ({ day, key: toIsoDate(day), events: eventsOn(shown, day).sort(compareEvents) }))
        .filter((section) => section.events.length > 0);
}

/** Days split into the rows of the month, `perWeek` days each (fewer with hidden weekends) */
export function schedulerWeeks(days: Date[], perWeek = 7): Date[][] {
    const size = Math.max(1, perWeek);
    return Array.from({ length: Math.ceil(days.length / size) }, (_, index) =>
        days.slice(index * size, index * size + size)
    );
}

/**
 * Minutes of the day at a position of the time grid (`offset` px from its top, `hourHeight` px per hour), floored to
 * the step and kept within the visible hours – where a tap on an empty time starts the new event
 */
export function timeGridMinutes(
    offset: number,
    hourHeight: number,
    startHour: number,
    endHour: number,
    step: number
): number {
    const total = (endHour - startHour) * 60;
    const minutes = Math.floor((Math.max(0, offset) / hourHeight) * (60 / step)) * step;
    return startHour * 60 + Math.max(0, Math.min(minutes, total - step));
}

/** Position of a time ("08:30" or minutes of the day) in the time grid, px from its top (0 before the first hour) */
export function timeGridOffset(time: string | number, hourHeight: number, startHour: number): number {
    const minutes = typeof time === 'number' ? time : minutesOf(time);
    return Math.max(0, ((minutes - startHour * 60) / 60) * hourHeight);
}

/** A dragged distance in px as minutes, rounded to the step (dragging an event in the time grid) */
export function dragMinutes(distance: number, hourHeight: number, step: number): number {
    return Math.round((distance / hourHeight) * (60 / step)) * step || 0;
}

/**
 * A range of days in words ("Oct 19 – 25, 2026") with Intl's formatRange – engines without it (Hermes) get
 * "Oct 19, 2026 – Oct 25, 2026"; one day is just that day
 */
export function formatDayRange(
    first: Date,
    last: Date,
    locale: string,
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
    const format = new Intl.DateTimeFormat(locale, options);
    if (sameDay(first, last)) return format.format(first);
    const range = (format as { formatRange?: (start: Date, end: Date) => string }).formatRange;
    return typeof range === 'function'
        ? range.call(format, first, last)
        : `${format.format(first)} – ${format.format(last)}`;
}
