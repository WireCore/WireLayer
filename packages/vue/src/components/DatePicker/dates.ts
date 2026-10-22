import {
    CalendarDateTime,
    parseDate,
    parseDateTime,
    toCalendarDateTime,
    Time,
    type DateValue,
} from '@internationalized/date';
import {
    fromWallIso,
    timeSlots as recipeTimeSlots,
    toWallIso,
    type DateLike,
    type DateValueType,
} from '@wirecore/wirelayer-recipes';

// ISO strings ↔ @internationalized/date values for DatePicker, DateRangePicker and TimePicker
// (the same in @wirecore/wirelayer-vue and @wirecore/wirelayer-react)

/** "2026-10-20" or, with time, "2026-10-20T14:30" */
export const toIso = (value: DateValue | undefined, withTime: boolean) =>
    value ? value.toString().slice(0, withTime ? 16 : 10) : null;

/** Parses an ISO date or date-time; a date-only bound with time becomes 00:00 (min) or 23:59 (max) */
export function fromIso(iso: string, withTime: boolean, bound?: 'min' | 'max'): DateValue {
    if (!withTime) return parseDate(iso.slice(0, 10));
    if (iso.includes('T')) return parseDateTime(iso.slice(0, 16));
    return parseDateTime(`${iso}T${bound === 'max' ? '23:59' : '00:00'}`);
}

/**
 * A prop value (ISO string, ISO with offset, or Date) as date value; with `timeZone` shown in that zone.
 * Undefined for empty or invalid values.
 */
export function fromDateLike(
    value: DateLike | null | undefined,
    withTime: boolean,
    timeZone?: string,
    bound?: 'min' | 'max'
): DateValue | undefined {
    const plainDate = typeof value === 'string' && !value.includes('T');
    const iso = toWallIso(value, withTime && !plainDate, timeZone);
    return iso ? fromIso(iso, withTime, bound) : undefined;
}

/** A date value as the value a component hands out: ISO string, ISO with the zone's offset, or Date */
export const toOutput = (
    value: DateValue | undefined,
    withTime: boolean,
    valueType?: DateValueType,
    timeZone?: string
): string | Date | null => fromWallIso(toIso(value, withTime), { valueType, timeZone, withTime });

/** Wall-clock ISO of a prop value – compares values of any type */
export const wallKey = (value: DateLike | null | undefined, withTime: boolean, timeZone?: string) =>
    toWallIso(value, withTime, timeZone);

/** isDateUnavailable (gets the ISO date) together with excludeDates */
export function unavailableDates(
    isDateUnavailable?: (date: string) => boolean,
    excludeDates?: DateLike[]
): ((date: DateValue) => boolean) | undefined {
    if (!isDateUnavailable && !excludeDates?.length) return undefined;
    const excluded = new Set(excludeDates?.map((date) => toWallIso(date, false)));
    return (date) => {
        const iso = toIso(date, false)!;
        return excluded.has(iso) || !!isDateUnavailable?.(iso);
    };
}

/** A day picked in the calendar keeps the time already entered (or 00:00) */
export function withTimeOf(day: DateValue, previous: DateValue | undefined): DateValue {
    if ('hour' in day) return day;
    const time = previous && 'hour' in previous ? new Time(previous.hour, previous.minute) : new Time();
    return toCalendarDateTime(day, time);
}

// TimePicker: a time is a date-time on a fixed day, so the segmented date input can edit it
const DAY = { year: 2000, month: 1, day: 1 };

/** "14:30" (or "14:30:15") → date-time on the fixed day */
export function fromTime(time: string): CalendarDateTime {
    const [hour = 0, minute = 0, second = 0] = time.split(':').map(Number);
    return new CalendarDateTime(DAY.year, DAY.month, DAY.day, hour, minute, second);
}

const two = (value: number) => String(value).padStart(2, '0');
/** Date-time → "14:30" (with seconds "14:30:15") */
export const toTime = (value: DateValue | undefined, withSeconds = false) =>
    value && 'hour' in value
        ? `${two(value.hour)}:${two(value.minute)}${withSeconds ? `:${two(value.second)}` : ''}`
        : null;

/** The times for the list: every `step` minutes from min to max (both "HH:mm") */
export const timeSlots = (step: number, min?: string, max?: string, withSeconds = false): string[] =>
    recipeTimeSlots(step, min, max, withSeconds);
