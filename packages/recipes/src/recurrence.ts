// Recurring events: a subset of the RFC 5545 rules (FREQ DAILY/WEEKLY/MONTHLY/YEARLY, INTERVAL, BYDAY with
// positions such as "2MO" or "-1FR", BYMONTHDAY, BYMONTH, COUNT, UNTIL, WKST) with EXDATE and single changed
// occurrences, expanded for a range of dates; the wording of a rule ("Every 2nd Monday of the month") and applying a
// change to one occurrence or the whole series. Wall-clock ISO strings throughout; with a time zone the times are
// wall-clock times in that zone (so a series stays at 09:00 across the change to and from summer time).

import {
    addIsoDays,
    dateToIso,
    isoToDate,
    isoWeekday,
    parseIsoParts,
    toWallIso,
    toZonedIso,
    zonedToInstant,
} from './date-time.js';
import { pluralText, type Translations } from './i18n.js';
import type { SchedulerEvent } from './scheduler.js';

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/** A day of the week in a rule: 0 = Sunday … 6 = Saturday; `nth` 2 = the second, -1 = the last in the month */
export interface RecurrenceWeekday {
    day: number;
    nth?: number;
}

/** A recurrence rule (RRULE) as data */
export interface RecurrenceRule {
    freq: RecurrenceFrequency;
    /** Every n days, weeks, months or years (default 1) */
    interval: number;
    byDay?: RecurrenceWeekday[];
    /** Days of the month, -1 = the last */
    byMonthDay?: number[];
    /** Months 1–12 (yearly rules; default: the month of the start) */
    byMonth?: number[];
    /** Number of occurrences, the start included */
    count?: number;
    /** Last possible start: ISO date or date-time, with "Z" an instant */
    until?: string;
    /** First day of the week for weekly rules with an interval (default 1, Monday) */
    weekStart: number;
}

/** A range of dates: start inclusive, end exclusive ("2026-10-01" to "2026-11-01" is October) */
export interface DateRange {
    start: string;
    end: string;
}

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const FREQUENCIES: RecurrenceFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const pad = (value: number, length = 2) => String(Math.abs(value)).padStart(length, '0');
const numbers = (value: string) =>
    value
        .split(',')
        .map(Number)
        .filter((item) => Number.isInteger(item) && item !== 0);

/** iCalendar date ("20261231", "20261231T235959Z") or ISO as ISO ("2026-12-31", "2026-12-31T23:59:59Z") */
export function icalDateToIso(value: string): string {
    const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/.exec(value.trim());
    if (!match) return value.trim();
    const [, year, month, day, hour, minute, second, zulu] = match;
    const date = `${year}-${month}-${day}`;
    if (!hour) return date;
    return `${date}T${hour}:${minute}${second && second !== '00' ? `:${second}` : ''}${zulu ?? ''}`;
}

/** Reads a rule ("FREQ=WEEKLY;BYDAY=MO,WE", also with "RRULE:"); null when it has no supported frequency */
export function parseRecurrenceRule(text: string): RecurrenceRule | null {
    const parts = Object.fromEntries(
        text
            .trim()
            .replace(/^RRULE:/i, '')
            .split(';')
            .map((part) => part.split('='))
            .filter((pair): pair is [string, string] => pair.length === 2)
            .map(([key, value]) => [key.trim().toUpperCase(), value.trim().toUpperCase()])
    );
    const freq = parts.FREQ as RecurrenceFrequency;
    if (!FREQUENCIES.includes(freq)) return null;
    const rule: RecurrenceRule = { freq, interval: Math.max(1, Number(parts.INTERVAL) || 1), weekStart: 1 };
    if (parts.BYDAY) {
        rule.byDay = parts.BYDAY.split(',')
            .map((entry) => /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/.exec(entry.trim()))
            .filter((match) => !!match)
            .map((match) => ({ day: DAY_CODES.indexOf(match[2]!), ...(match[1] ? { nth: Number(match[1]) } : {}) }));
    }
    if (parts.BYMONTHDAY) rule.byMonthDay = numbers(parts.BYMONTHDAY).filter((day) => Math.abs(day) <= 31);
    if (parts.BYMONTH) rule.byMonth = numbers(parts.BYMONTH).filter((month) => month >= 1 && month <= 12);
    if (parts.COUNT && Number(parts.COUNT) > 0) rule.count = Math.floor(Number(parts.COUNT));
    if (parts.UNTIL) rule.until = icalDateToIso(parts.UNTIL);
    if (parts.WKST && DAY_CODES.includes(parts.WKST)) rule.weekStart = DAY_CODES.indexOf(parts.WKST);
    return rule;
}

/** A rule as RRULE text (without "RRULE:"): "FREQ=MONTHLY;BYDAY=2MO;COUNT=10" */
export function formatRecurrenceRule(rule: RecurrenceRule): string {
    const parts = [`FREQ=${rule.freq}`];
    if (rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
    if (rule.byDay?.length)
        parts.push(`BYDAY=${rule.byDay.map((entry) => `${entry.nth ?? ''}${DAY_CODES[entry.day]}`).join(',')}`);
    if (rule.byMonthDay?.length) parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`);
    if (rule.byMonth?.length) parts.push(`BYMONTH=${rule.byMonth.join(',')}`);
    if (rule.count) parts.push(`COUNT=${rule.count}`);
    if (rule.until) parts.push(`UNTIL=${rule.until.replace(/[-:]/g, '')}`);
    if (rule.weekStart !== 1) parts.push(`WKST=${DAY_CODES[rule.weekStart]}`);
    return parts.join(';');
}

// ── Expanding ───────────────────────────────────────────────────────────────────────────────────────────────────

const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const isoOf = (year: number, month: number, day: number) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

/** Whether a day matches the weekdays of a rule – with positions counted in the month */
function matchesWeekday(year: number, month: number, day: number, byDay: RecurrenceWeekday[]) {
    const weekday = isoWeekday(isoOf(year, month, day));
    const last = daysIn(year, month);
    return byDay.some(
        (entry) =>
            entry.day === weekday &&
            (entry.nth === undefined ||
                (entry.nth > 0 ? Math.ceil(day / 7) === entry.nth : Math.ceil((last - day + 1) / 7) === -entry.nth))
    );
}

/** Days of a month a monthly (or yearly) rule gives, in order; months without the day (31st, 5th Monday) give none */
function monthDays(year: number, month: number, rule: RecurrenceRule, startDay: number): number[] {
    const last = daysIn(year, month);
    let days: number[];
    if (rule.byMonthDay?.length) days = rule.byMonthDay.map((day) => (day < 0 ? last + 1 + day : day));
    else if (rule.byDay?.length) days = Array.from({ length: last }, (_, index) => index + 1);
    else days = [startDay];
    if (rule.byDay?.length)
        days = days.filter((day) => day >= 1 && day <= last && matchesWeekday(year, month, day, rule.byDay!));
    return [...new Set(days.filter((day) => day >= 1 && day <= last))].sort((a, b) => a - b);
}

/** Every day a rule gives from the start on (dates only, in order) – stops after many empty periods */
function* candidateDays(rule: RecurrenceRule, start: string): Generator<string> {
    const [year = 0, month = 1, day = 1] = start.split('-').map(Number);
    const step = rule.interval;
    for (let period = 0, empty = 0; empty < 1000; period++) {
        let days: string[] = [];
        if (rule.freq === 'DAILY') {
            const date = addIsoDays(start, period * step);
            const [y = 0, m = 1, d = 1] = date.split('-').map(Number);
            const fits =
                (!rule.byMonth?.length || rule.byMonth.includes(m)) &&
                (!rule.byMonthDay?.length || monthDays(y, m, { ...rule, byDay: undefined }, d).includes(d)) &&
                (!rule.byDay?.length || rule.byDay.some((entry) => entry.day === isoWeekday(date)));
            if (fits) days = [date];
        } else if (rule.freq === 'WEEKLY') {
            const first = addIsoDays(start, -((isoWeekday(start) - rule.weekStart + 7) % 7) + period * step * 7);
            const weekdays = rule.byDay?.length ? rule.byDay.map((entry) => entry.day) : [isoWeekday(start)];
            days = [...new Set(weekdays.map((weekday) => (weekday - rule.weekStart + 7) % 7))]
                .sort((a, b) => a - b)
                .map((offset) => addIsoDays(first, offset));
        } else if (rule.freq === 'MONTHLY') {
            const index = year * 12 + month - 1 + period * step;
            const y = Math.floor(index / 12);
            const m = (index % 12) + 1;
            if (!rule.byMonth?.length || rule.byMonth.includes(m))
                days = monthDays(y, m, rule, day).map((d) => isoOf(y, m, d));
        } else {
            const y = year + period * step;
            const months = rule.byMonth?.length ? [...rule.byMonth].sort((a, b) => a - b) : [month];
            days = months.flatMap((m) => monthDays(y, m, rule, day).map((d) => isoOf(y, m, d)));
        }
        empty = days.length ? 0 : empty + 1;
        yield* days;
    }
}

/** Wall-clock time as instant: in the zone, or local time */
const wallToInstant = (wall: string, timeZone?: string) =>
    timeZone ? zonedToInstant(wall, timeZone) : (isoToDate(wall) ?? new Date(Number.NaN));
/** Instant as wall-clock time "YYYY-MM-DDTHH:mm": in the zone, or local time */
const instantToWall = (instant: Date, timeZone?: string) =>
    timeZone ? toZonedIso(instant, timeZone) : dateToIso(instant, true);

/** Wall-clock time that exists: a time in the gap of the spring change moves on by the gap (02:30 → 03:30) */
export const existingWallTime = (wall: string, timeZone?: string) =>
    instantToWall(wallToInstant(wall, timeZone), timeZone);

/** Wall-clock ISO of an event time (with an offset → in the zone or local time) */
const wallOf = (value: string, allDay: boolean, timeZone?: string) =>
    toWallIso(value, !allDay, timeZone) ?? value.slice(0, allDay ? 10 : 16);

/** An event without its rule, left-out and changed occurrences */
export function withoutRule(event: SchedulerEvent): SchedulerEvent {
    const copy = { ...event };
    delete copy.rrule;
    delete copy.exdate;
    delete copy.overrides;
    return copy;
}

/** Whether an event (end inclusive for all-day ones) touches a range of dates */
function touches(start: string, end: string, allDay: boolean, range: DateRange) {
    return start < range.end && (allDay ? addIsoDays(end.slice(0, 10), 1) : end) > range.start;
}

/**
 * The occurrences of an event in a range of dates (start inclusive, end exclusive). An event without (valid) `rrule`
 * is returned as it is when it touches the range. Occurrences get the id "<id>@<start>", `seriesId` and
 * `recurrenceId` (their original start); `exdate` removes occurrences, `overrides` change single ones. With
 * `timeZone` the rule runs in that zone's wall-clock time (09:00 stays 09:00 across the summer-time change).
 */
export function expandRecurrence(event: SchedulerEvent, range: DateRange, timeZone?: string): SchedulerEvent[] {
    const rule = event.rrule ? parseRecurrenceRule(event.rrule) : null;
    const allDay = !!event.allDay;
    const start = wallOf(event.start, allDay, timeZone);
    const end = wallOf(event.end, allDay, timeZone);
    if (!rule) return touches(start, end, allDay, range) ? [event] : [];
    const startDate = start.slice(0, 10);
    const time = allDay ? '' : start.slice(10, 16);
    const durationDays = Math.round(
        (Date.parse(`${end.slice(0, 10)}T00:00Z`) - Date.parse(`${startDate}T00:00Z`)) / 86_400_000
    );
    const durationMs = allDay ? 0 : wallToInstant(end, timeZone).getTime() - wallToInstant(start, timeZone).getTime();
    const until = rule.until
        ? parseIsoParts(rule.until)?.hasTime
            ? wallOf(rule.until, false, timeZone)
            : `${rule.until.slice(0, 10)}${allDay ? '' : 'T23:59'}`
        : undefined;
    const excluded = new Set(
        (event.exdate ?? []).map((value) => wallOf(value, allDay || value.length <= 10, timeZone))
    );
    const overrides = new Map(
        Object.entries(event.overrides ?? {}).map(([key, value]) => [wallOf(key, allDay, timeZone), value])
    );
    const base = withoutRule(event);
    const result: SchedulerEvent[] = [];
    let count = 0;
    /** Adds the occurrence of a day; false when the series has ended for this range */
    const add = (day: string) => {
        const occurrenceStart = allDay ? day : existingWallTime(`${day}${time}`, timeZone);
        if ((until && occurrenceStart > until) || (rule.count && ++count > rule.count) || day >= range.end)
            return false;
        const recurrenceId = allDay ? day : `${day}${time}`;
        if (excluded.has(recurrenceId) || excluded.has(day)) return true;
        const occurrenceEnd = allDay
            ? addIsoDays(day, durationDays)
            : instantToWall(new Date(wallToInstant(occurrenceStart, timeZone).getTime() + durationMs), timeZone);
        const occurrence: SchedulerEvent = {
            ...base,
            start: occurrenceStart,
            end: occurrenceEnd,
            ...overrides.get(recurrenceId),
            id: `${event.id}@${recurrenceId}`,
            seriesId: event.id,
            recurrenceId,
        };
        if (touches(occurrence.start, occurrence.end, allDay, range)) result.push(occurrence);
        return true;
    };
    // The start always counts as the first occurrence (RFC 5545), the days of the rule follow
    if (add(startDate))
        for (const day of candidateDays(rule, startDate)) {
            if (day <= startDate) continue;
            if (!add(day)) break;
        }
    return result;
}

/** All events with their series expanded for a range; events without rule that do not touch it are left out */
export function expandEvents(events: readonly SchedulerEvent[], range: DateRange, timeZone?: string): SchedulerEvent[] {
    return events.flatMap((event) => expandRecurrence(event, range, timeZone));
}

// ── Wording ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A rule in words: "Daily", "Every 2 weeks on Monday and Wednesday", "Every 2nd Monday of the month", "Yearly on
 * December 24, 10 times" – from the texts of `translations.recurrence`. `start` (ISO) fills what the rule leaves to
 * the start (the weekday of a weekly rule, the day of a monthly or yearly one).
 */
export function describeRecurrence(
    rule: RecurrenceRule | string,
    translations: Translations,
    locale: string,
    start?: string
): string {
    const parsed = typeof rule === 'string' ? parseRecurrenceRule(rule) : rule;
    if (!parsed) return '';
    const t = translations.recurrence;
    const startDate = start ? (toWallIso(start, false) ?? undefined) : undefined;
    const weekdayName = (day: number) =>
        new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(
            new Date(Date.UTC(2023, 0, 1 + day))
        );
    const monthName = (month: number) =>
        new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(
            new Date(Date.UTC(2023, month - 1, 1))
        );
    const list = (items: string[]) => new Intl.ListFormat(locale, { type: 'conjunction' }).format(items);
    const nthDays = parsed.byDay?.filter((entry) => entry.nth !== undefined) ?? [];
    const positions = nthDays.length
        ? list(nthDays.map((entry) => t.nthWeekday(entry.nth!, weekdayName(entry.day))))
        : '';
    const startParts = startDate ? startDate.split('-').map(Number) : undefined;
    let text = pluralText(t[parsed.freq], parsed.interval, locale);
    if (parsed.freq === 'WEEKLY' || (parsed.freq === 'DAILY' && parsed.byDay?.length)) {
        const days = parsed.byDay?.length
            ? parsed.byDay.map((entry) => entry.day)
            : startDate
              ? [isoWeekday(startDate)]
              : [];
        if (days.length) text = `${text} ${t.on(list(days.map(weekdayName)))}`;
    } else if (parsed.freq === 'MONTHLY') {
        if (positions && parsed.interval === 1 && !parsed.byMonthDay?.length) text = t.monthlyNth(positions);
        else if (positions) text = `${text} ${t.on(positions)}`;
        else {
            const days = parsed.byMonthDay?.length ? parsed.byMonthDay : startParts ? [startParts[2]!] : [];
            if (days.length) text = `${text} ${t.on(list(days.map(t.monthDay)))}`;
        }
    } else if (parsed.freq === 'YEARLY') {
        const months = parsed.byMonth?.length ? parsed.byMonth : startParts ? [startParts[1]!] : [];
        const monthList = list(months.map(monthName));
        if (positions && months.length) text = `${text} ${t.on(t.inMonth(positions, monthList))}`;
        else {
            const days = parsed.byMonthDay?.length ? parsed.byMonthDay : startParts ? [startParts[2]!] : [];
            if (days.length && months.length)
                text = `${text} ${t.on(t.dayOfMonth(list(days.map(t.monthDay)), monthList))}`;
        }
    }
    if (parsed.count) text = `${text}, ${pluralText(t.times, parsed.count, locale)}`;
    else if (parsed.until) {
        const until = toWallIso(parsed.until, false) ?? parsed.until.slice(0, 10);
        const [year = 0, month = 1, day = 1] = until.split('-').map(Number);
        const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
            new Date(Date.UTC(year, month - 1, day))
        );
        text = `${text}, ${t.until(date)}`;
    }
    return text;
}

// ── Changing series ─────────────────────────────────────────────────────────────────────────────────────────────

/** Which occurrences a change of a series applies to */
export type RecurrenceScope = 'occurrence' | 'series';

/** A moved or resized event as the Scheduler reports it */
export interface SchedulerEventChange {
    event: SchedulerEvent;
    start: string;
    end: string;
    /** New resource (moved to another person, room …) */
    resourceId?: string;
    /** Occurrence of a series: only this one or all */
    scope?: RecurrenceScope;
}

/** "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm…" as "YYYY-MM-DDTHH:mm" */
const fullWall = (value: string) => (value.length <= 10 ? `${value.slice(0, 10)}T00:00` : value.slice(0, 16));
/** Milliseconds between two wall-clock times, read as wall clocks (no summer-time change in between) */
const wallDistance = (from: string, to: string) => Date.parse(`${fullWall(to)}Z`) - Date.parse(`${fullWall(from)}Z`);
/** A wall-clock time moved by milliseconds; dates stay dates */
function shiftWall(value: string, ms: number) {
    const moved = new Date(Date.parse(`${fullWall(value)}Z`) + ms).toISOString();
    return value.length <= 10 ? moved.slice(0, 10) : moved.slice(0, 16);
}

/**
 * Applies a change of the Scheduler to the events: a single event gets the new start, end and resource. An
 * occurrence of a series changes with `scope: 'occurrence'` (default) as an entry in `overrides`; with
 * `scope: 'series'` the whole series moves by the same amount (its exceptions with it). Times with an offset are
 * read in `timeZone` (else local time).
 */
export function applyEventChange(
    events: readonly SchedulerEvent[],
    change: SchedulerEventChange,
    timeZone?: string
): SchedulerEvent[] {
    const { event } = change;
    const allDay = !!event.allDay;
    const start = wallOf(change.start, allDay, timeZone);
    const end = wallOf(change.end, allDay, timeZone);
    const resource = change.resourceId === undefined ? {} : { resourceId: change.resourceId };
    return events.map((item) => {
        if (!event.seriesId) return item.id === event.id ? { ...item, start, end, ...resource } : item;
        if (item.id !== event.seriesId) return item;
        if (change.scope !== 'series') {
            const key = event.recurrenceId!;
            return {
                ...item,
                overrides: { ...item.overrides, [key]: { ...item.overrides?.[key], start, end, ...resource } },
            };
        }
        const startShift = wallDistance(wallOf(event.start, allDay, timeZone), start);
        const endShift = wallDistance(wallOf(event.end, allDay, timeZone), end);
        const shiftKeys = (values: Record<string, unknown>) =>
            Object.fromEntries(Object.entries(values).map(([key, value]) => [shiftWall(key, startShift), value]));
        return {
            ...item,
            start: shiftWall(wallOf(item.start, allDay, timeZone), startShift),
            end: shiftWall(wallOf(item.end, allDay, timeZone), endShift),
            ...resource,
            ...(item.exdate ? { exdate: item.exdate.map((value) => shiftWall(value, startShift)) } : {}),
            ...(item.overrides ? { overrides: shiftKeys(item.overrides) as SchedulerEvent['overrides'] } : {}),
        };
    });
}
