// iCalendar (RFC 5545) for the Scheduler: events as VCALENDAR text and back – VEVENT with RRULE, EXDATE and
// changed occurrences (RECURRENCE-ID); times with TZID are converted through Intl (IANA zones) or through the
// offsets of the VTIMEZONE in the file (other zone names, e.g. from Outlook).

import {
    addIsoDays,
    dateToIso,
    isValidTimeZone,
    isoToDate,
    parseIsoParts,
    timeZoneOffset,
    toWallIso,
    toZonedIso,
    zonedToInstant,
} from './date-time.js';
import { expandRecurrence, icalDateToIso, withoutRule } from './recurrence.js';
import type { SchedulerEvent } from './scheduler.js';

export interface ICalendarOptions {
    /** Name of the calendar (X-WR-CALNAME) */
    name?: string;
    /** Product id (PRODID) */
    prodId?: string;
    /** Zone of wall-clock times: written with TZID; without it they are floating times (local wherever opened) */
    timeZone?: string;
    /** Time of the export (DTSTAMP) – default now */
    now?: Date;
}

const escapeText = (text: string) =>
    text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const unescapeText = (text: string) =>
    text.replace(/\\([\\;,nN])/g, (_, char: string) => (char === 'n' || char === 'N' ? '\n' : char));

/** Folds a content line after 75 octets (UTF-8), continuation lines start with a space */
function fold(line: string): string {
    const parts: string[] = [];
    let current = '';
    let bytes = 0;
    for (const char of line) {
        const size = new TextEncoder().encode(char).length;
        if (bytes + size > (parts.length ? 74 : 75)) {
            parts.push(current);
            current = '';
            bytes = 0;
        }
        current += char;
        bytes += size;
    }
    parts.push(current);
    return parts.join('\r\n ');
}

const compact = (iso: string) => iso.replace(/[-:]/g, '');

/** A date or time as property: name with parameters and value */
function dateProperty(name: string, value: string, allDay: boolean, timeZone?: string): string {
    if (allDay) return `${name};VALUE=DATE:${compact(value.slice(0, 10))}`;
    const parts = parseIsoParts(value);
    if (parts?.offset) {
        const instant = isoToDate(value)!;
        return `${name}:${compact(instant.toISOString().slice(0, 19))}Z`;
    }
    const wall = `${compact((toWallIso(value, true, undefined, true) ?? value).slice(0, 19))}`;
    return timeZone ? `${name};TZID=${timeZone}:${wall}` : `${name}:${wall}`;
}

const HOUR = 3_600_000;
const offsetText = (minutes: number) => {
    const sign = minutes < 0 ? '-' : '+';
    const value = Math.abs(minutes);
    return `${sign}${String(Math.floor(value / 60)).padStart(2, '0')}${String(value % 60).padStart(2, '0')}`;
};
/** Local time of an instant at an offset as iCalendar date-time ("20261025T030000") */
const localStamp = (instant: number, offset: number) =>
    compact(new Date(instant + offset * 60_000).toISOString().slice(0, 19));

/**
 * The VTIMEZONE of an IANA zone for the years from `from` to `to` (inclusive), from the offsets Intl knows: one
 * STANDARD/DAYLIGHT part per change of the offset (the change to the larger offset is DAYLIGHT); a zone without
 * changes gets one STANDARD part. Empty for a zone name Intl does not know.
 */
export function vTimeZone(timeZone: string, from: number, to: number): string[] {
    if (!isValidTimeZone(timeZone)) return [];
    const start = Date.UTC(from, 0, 1);
    const end = Date.UTC(to + 1, 0, 1);
    const offsetAt = (instant: number) => timeZoneOffset(new Date(instant), timeZone);
    const parts: string[] = [];
    let previous = offsetAt(start);
    // Day by day, then to the minute where the offset changed
    for (let day = start; day < end; day += 24 * HOUR) {
        const next = offsetAt(day + 24 * HOUR);
        if (next === previous) continue;
        let low = day;
        let high = day + 24 * HOUR;
        while (high - low > 60_000) {
            const middle = low + Math.floor((high - low) / 120_000) * 60_000;
            if (offsetAt(middle) === previous) low = middle;
            else high = middle;
        }
        const kind = next > previous ? 'DAYLIGHT' : 'STANDARD';
        parts.push(
            `BEGIN:${kind}`,
            `DTSTART:${localStamp(high, previous)}`,
            `TZOFFSETFROM:${offsetText(previous)}`,
            `TZOFFSETTO:${offsetText(next)}`,
            `END:${kind}`
        );
        previous = next;
    }
    if (!parts.length)
        parts.push(
            'BEGIN:STANDARD',
            `DTSTART:${localStamp(start, previous)}`,
            `TZOFFSETFROM:${offsetText(previous)}`,
            `TZOFFSETTO:${offsetText(previous)}`,
            'END:STANDARD'
        );
    return ['BEGIN:VTIMEZONE', `TZID:${timeZone}`, ...parts, 'END:VTIMEZONE'];
}

/** First and last year of the events (series without an end: one year after their start) */
function eventYears(events: SchedulerEvent[]): [number, number] | null {
    const years: number[] = [];
    for (const event of events) {
        if (event.allDay) continue;
        for (const value of [event.start, event.end, ...Object.keys(event.overrides ?? {})])
            years.push(Number(value.slice(0, 4)));
        const until = /UNTIL=(\d{4})/.exec(event.rrule ?? '')?.[1];
        if (until) years.push(Number(until));
        else if (event.rrule) years.push(Number(event.start.slice(0, 4)) + 1);
    }
    const valid = years.filter((year) => Number.isFinite(year) && year > 0);
    return valid.length ? [Math.min(...valid), Math.max(...valid)] : null;
}

/**
 * Events as iCalendar text (CRLF lines): one VEVENT per event with UID, SUMMARY, DTSTART/DTEND (all-day: dates, the
 * end exclusive), RRULE and EXDATE; changed occurrences as their own VEVENT with RECURRENCE-ID. Tone and resource
 * travel as X-WIRECORE-TONE and X-WIRECORE-RESOURCE. With `timeZone` a VTIMEZONE (offsets from Intl for the years of
 * the events) comes before the events.
 */
export function toICalendar(events: SchedulerEvent[], options: ICalendarOptions = {}): string {
    const stamp = `${compact((options.now ?? new Date()).toISOString().slice(0, 19))}Z`;
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:${options.prodId ?? '-//WireLayer//Scheduler//DE'}`,
        'CALSCALE:GREGORIAN',
        ...(options.name ? [`X-WR-CALNAME:${escapeText(options.name)}`] : []),
    ];
    // TZID needs its VTIMEZONE (RFC 5545): the offsets of the zone for the years of the events
    const years = options.timeZone ? eventYears(events) : null;
    if (options.timeZone && years) lines.push(...vTimeZone(options.timeZone, years[0], years[1]));
    const vevent = (event: SchedulerEvent, uid: string, recurrenceId?: string) => {
        const allDay = !!event.allDay;
        lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp}`);
        if (recurrenceId) lines.push(dateProperty('RECURRENCE-ID', recurrenceId, allDay, options.timeZone));
        lines.push(
            dateProperty('DTSTART', event.start, allDay, options.timeZone),
            dateProperty('DTEND', allDay ? addIsoDays(event.end, 1) : event.end, allDay, options.timeZone),
            `SUMMARY:${escapeText(event.title)}`
        );
        if (event.rrule) lines.push(`RRULE:${event.rrule.replace(/^RRULE:/i, '')}`);
        if (event.exdate?.length) {
            const [first, ...rest] = event.exdate.map((value) =>
                dateProperty('EXDATE', value, allDay || value.length <= 10, options.timeZone)
            );
            lines.push([first!, ...rest.map((line) => line.slice(line.indexOf(':') + 1))].join(','));
        }
        if (event.tone) lines.push(`X-WIRECORE-TONE:${event.tone}`);
        if (event.resourceId) lines.push(`X-WIRECORE-RESOURCE:${escapeText(event.resourceId)}`);
        if (event.background) lines.push('X-WIRECORE-BACKGROUND:TRUE');
        lines.push('END:VEVENT');
    };
    for (const event of events) {
        vevent(event, event.id);
        for (const [recurrenceId, change] of Object.entries(event.overrides ?? {})) {
            vevent(
                { ...withoutRule(event), start: recurrenceId, end: recurrenceId, ...change },
                event.id,
                recurrenceId
            );
        }
    }
    lines.push('END:VCALENDAR');
    return `${lines.map(fold).join('\r\n')}\r\n`;
}

// ── Reading ─────────────────────────────────────────────────────────────────────────────────────────────────────

interface Property {
    name: string;
    params: Record<string, string>;
    value: string;
}

/** "DTSTART;TZID="Europe/Berlin":20261020T100000" → name, parameters, value (colons in quotes kept) */
function parseLine(line: string): Property | null {
    let quoted = false;
    let colon = -1;
    for (let index = 0; index < line.length; index++) {
        if (line[index] === '"') quoted = !quoted;
        else if (line[index] === ':' && !quoted) {
            colon = index;
            break;
        }
    }
    if (colon < 0) return null;
    const [name = '', ...params] = line.slice(0, colon).split(';');
    return {
        name: name.toUpperCase(),
        params: Object.fromEntries(
            params.map((param) => {
                const [key = '', ...value] = param.split('=');
                return [key.toUpperCase(), value.join('=').replace(/^"|"$/g, '')];
            })
        ),
        value: line.slice(colon + 1),
    };
}

/** A zone of the file (VTIMEZONE): its changes with the offset after each */
interface ZoneRule {
    offset: number;
    start: string;
    rrule?: string;
}

const offsetMinutes = (value: string) => {
    const match = /^([+-])(\d{2})(\d{2})/.exec(value.trim());
    return match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
};

/** Offset of a VTIMEZONE at a wall-clock time: the offset after its latest change before that time */
function zoneOffset(rules: ZoneRule[], wall: string): number {
    let best: { at: string; offset: number } | undefined;
    for (const rule of rules) {
        const year = Number(wall.slice(0, 4));
        const onsets = rule.rrule
            ? expandRecurrence(
                  { id: 'zone', title: '', start: rule.start, end: rule.start, rrule: rule.rrule },
                  { start: `${year - 1}-01-01`, end: addIsoDays(wall.slice(0, 10), 1) }
              ).map((occurrence) => occurrence.start)
            : [rule.start];
        for (const onset of onsets)
            if (onset <= wall && (!best || onset > best.at)) best = { at: onset, offset: rule.offset };
    }
    return best?.offset ?? rules[0]?.offset ?? 0;
}

export interface ICalendarParseOptions {
    /** Zone the times are converted into (default: local time) */
    timeZone?: string;
}

/**
 * Events of an iCalendar text: VEVENTs with SUMMARY, DTSTART, DTEND or DURATION, RRULE, EXDATE; VEVENTs with
 * RECURRENCE-ID become `overrides` of their series. Times are wall-clock times in `timeZone` (default local
 * time): UTC ("Z") and TZID times are converted, floating times stay. All-day ends become inclusive.
 */
export function parseICalendar(text: string, options: ICalendarParseOptions = {}): SchedulerEvent[] {
    const lines = text
        .replace(/\r?\n[ \t]/g, '')
        .split(/\r?\n/)
        .filter((line) => line.trim());
    const zones = new Map<string, ZoneRule[]>();
    const vevents: Property[][] = [];
    let zone: { id: string; rules: ZoneRule[]; current?: Partial<ZoneRule> } | null = null;
    let event: Property[] | null = null;
    for (const line of lines) {
        const property = parseLine(line);
        if (!property) continue;
        const { name, value } = property;
        if (name === 'BEGIN' && value === 'VTIMEZONE') zone = { id: '', rules: [] };
        else if (name === 'END' && value === 'VTIMEZONE' && zone) {
            zones.set(zone.id, zone.rules);
            zone = null;
        } else if (zone) {
            if (name === 'TZID') zone.id = value;
            else if (name === 'BEGIN') zone.current = {};
            else if (name === 'END' && zone.current) {
                zone.rules.push({ offset: 0, start: '1970-01-01T00:00', ...zone.current });
                zone.current = undefined;
            } else if (zone.current && name === 'TZOFFSETTO') zone.current.offset = offsetMinutes(value);
            else if (zone.current && name === 'DTSTART') zone.current.start = icalDateToIso(value).slice(0, 16);
            else if (zone.current && name === 'RRULE') zone.current.rrule = value;
        } else if (name === 'BEGIN' && value === 'VEVENT') event = [];
        else if (name === 'END' && value === 'VEVENT' && event) {
            vevents.push(event);
            event = null;
        } else event?.push(property);
    }

    /** A date or time value as wall-clock ISO in the target zone; all-day for dates */
    const readTime = (property: Property, raw = property.value) => {
        const iso = icalDateToIso(raw);
        if (property.params.VALUE === 'DATE' || iso.length === 10) return { value: iso.slice(0, 10), allDay: true };
        const toTarget = (instant: Date) =>
            options.timeZone ? toZonedIso(instant, options.timeZone) : dateToIso(instant, true);
        if (iso.endsWith('Z')) return { value: toTarget(new Date(`${iso.slice(0, -1)}Z`)), allDay: false };
        const wall = iso.slice(0, 16);
        const tzid = property.params.TZID;
        if (tzid && isValidTimeZone(tzid)) return { value: toTarget(zonedToInstant(wall, tzid)), allDay: false };
        if (tzid && zones.has(tzid)) {
            const offset = zoneOffset(zones.get(tzid)!, wall);
            return { value: toTarget(new Date(Date.parse(`${wall}Z`) - offset * 60_000)), allDay: false };
        }
        return { value: wall, allDay: false };
    };
    const duration = (value: string) => {
        const match = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value.trim());
        if (!match) return 0;
        const [, sign, weeks, days, hours, minutes] = match;
        const total =
            ((Number(weeks ?? 0) * 7 + Number(days ?? 0)) * 24 + Number(hours ?? 0)) * 60 + Number(minutes ?? 0);
        return (sign === '-' ? -1 : 1) * total;
    };
    const plusMinutes = (wall: string, minutes: number) =>
        new Date(Date.parse(`${wall.length === 10 ? `${wall}T00:00` : wall}Z`) + minutes * 60_000)
            .toISOString()
            .slice(0, wall.length === 10 ? 10 : 16);

    const masters = new Map<string, SchedulerEvent>();
    const changes: { uid: string; recurrenceId: string; event: SchedulerEvent }[] = [];
    for (const properties of vevents) {
        const get = (name: string) => properties.find((property) => property.name === name);
        const startProperty = get('DTSTART');
        if (!startProperty) continue;
        const start = readTime(startProperty);
        const endProperty = get('DTEND');
        let end: string;
        if (endProperty) {
            const value = readTime(endProperty).value;
            end = start.allDay ? addIsoDays(value, -1) : value;
            if (start.allDay && end < start.value) end = start.value;
        } else {
            const minutes = get('DURATION') ? duration(get('DURATION')!.value) : 0;
            end = start.allDay
                ? addIsoDays(start.value, Math.max(0, Math.round(minutes / 1440) - 1))
                : plusMinutes(start.value, minutes);
        }
        const uid = get('UID')?.value ?? `event-${masters.size + changes.length + 1}`;
        const tone = get('X-WIRECORE-TONE')?.value as SchedulerEvent['tone'];
        const resourceId = get('X-WIRECORE-RESOURCE')?.value;
        const exdate = properties
            .filter((property) => property.name === 'EXDATE')
            .flatMap((property) => property.value.split(',').map((value) => readTime(property, value).value));
        const result: SchedulerEvent = {
            id: uid,
            title: unescapeText(get('SUMMARY')?.value ?? ''),
            start: start.value,
            end,
            ...(start.allDay ? { allDay: true } : {}),
            ...(tone ? { tone } : {}),
            ...(resourceId ? { resourceId: unescapeText(resourceId) } : {}),
            ...(get('X-WIRECORE-BACKGROUND')?.value.toUpperCase() === 'TRUE' ? { background: true } : {}),
            ...(get('RRULE') ? { rrule: get('RRULE')!.value } : {}),
            ...(exdate.length ? { exdate } : {}),
        };
        const recurrence = get('RECURRENCE-ID');
        if (recurrence) changes.push({ uid, recurrenceId: readTime(recurrence).value, event: result });
        else masters.set(uid, result);
    }
    for (const { uid, recurrenceId, event: change } of changes) {
        const master = masters.get(uid);
        if (!master) {
            masters.set(`${uid}@${recurrenceId}`, { ...change, id: `${uid}@${recurrenceId}` });
            continue;
        }
        const override: NonNullable<SchedulerEvent['overrides']>[string] = { start: change.start, end: change.end };
        if (change.title !== master.title) override.title = change.title;
        if (change.tone !== master.tone && change.tone) override.tone = change.tone;
        if (change.resourceId !== master.resourceId && change.resourceId) override.resourceId = change.resourceId;
        master.overrides = { ...master.overrides, [recurrenceId]: override };
    }
    return [...masters.values()];
}
