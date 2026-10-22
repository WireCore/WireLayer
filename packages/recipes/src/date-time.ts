// Framework-neutral date and time logic for DatePicker, DateRangePicker, Calendar, Month/Quarter/YearPicker,
// TimePicker, DurationInput, TimeGrid and MiniCalendar – plain ISO strings, Date and Intl (no Temporal: not in
// every supported browser yet).

import { defaultLocale } from './i18n.js';

const DAY_MS = 86_400_000;
const pad = (value: number, length = 2) => String(value).padStart(length, '0');

/** What a date prop accepts: an ISO string ("2026-10-20", "2026-10-20T14:30", with offset) or a Date */
export type DateLike = string | Date;

/** How a component hands out its value: ISO strings (default) or Date objects */
export type DateValueType = 'string' | 'date';

// ── ISO strings ↔ Date ──────────────────────────────────────────────────────────────────────────────────────────

const isoPattern = /^(\d{4,})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

/** Splits an ISO date or date-time; null when it is none */
export function parseIsoParts(iso: string) {
    const match = isoPattern.exec(iso.trim());
    if (!match) return null;
    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4] ?? 0),
        minute: Number(match[5] ?? 0),
        second: Number(match[6] ?? 0),
        hasTime: match[4] !== undefined,
        /** "Z", "+02:00" or undefined */
        offset: match[7],
    };
}

/** Local date (and time) of a Date as ISO: "2026-10-20", "2026-10-20T14:30" or with seconds "…T14:30:05" */
export function dateToIso(date: Date, withTime = false, withSeconds = false): string {
    const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    if (!withTime) return day;
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    return `${day}T${time}${withSeconds ? `:${pad(date.getSeconds())}` : ''}`;
}

/** An ISO string as Date: without offset in local time, with offset ("Z", "+02:00") as that instant */
export function isoToDate(iso: string): Date | null {
    const parts = parseIsoParts(iso);
    if (!parts) return null;
    if (parts.offset) return new Date(iso.trim().replace(' ', 'T'));
    return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

/**
 * Any date prop value as the wall-clock ISO the components work with ("2026-10-20" or "2026-10-20T14:30"). A Date
 * or an ISO string with offset is shown in `timeZone` (else in local time); a string without offset stays as it is.
 */
export function toWallIso(
    value: DateLike | null | undefined,
    withTime: boolean,
    timeZone?: string,
    withSeconds = false
): string | null {
    if (value == null || value === '') return null;
    const length = withTime ? (withSeconds ? 19 : 16) : 10;
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null;
        return (timeZone ? toZonedIso(value, timeZone, true) : dateToIso(value, true, true)).slice(0, length);
    }
    const parts = parseIsoParts(value);
    if (!parts) return null;
    if (parts.offset) {
        const instant = isoToDate(value)!;
        return (timeZone ? toZonedIso(instant, timeZone, true) : dateToIso(instant, true, true)).slice(0, length);
    }
    const iso = `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;
    if (!withTime) return iso;
    return `${iso}T${pad(parts.hour)}:${pad(parts.minute)}${withSeconds ? `:${pad(parts.second)}` : ''}`;
}

/**
 * The value a component hands out for a wall-clock ISO: the string itself, with `timeZone` the string with the
 * zone's offset ("2026-10-20T14:30+02:00"); `valueType: 'date'` gives a Date (with `timeZone` the instant).
 */
export function fromWallIso(
    iso: string | null,
    options: { valueType?: DateValueType; timeZone?: string; withTime?: boolean } = {}
): string | Date | null {
    if (!iso) return null;
    const zoned = options.timeZone && options.withTime;
    if (options.valueType === 'date') return zoned ? zonedToInstant(iso, options.timeZone!) : isoToDate(iso);
    return zoned ? withZoneOffset(iso, options.timeZone!) : iso;
}

/** Today as ISO date, in `timeZone` when given */
export function todayIso(timeZone?: string, now = new Date()): string {
    return timeZone ? toZonedIso(now, timeZone).slice(0, 10) : dateToIso(now);
}

/** ISO date plus days ("2026-10-31" + 1 → "2026-11-01") */
export function addIsoDays(iso: string, days: number): string {
    const [year = 0, month = 1, day = 1] = iso.slice(0, 10).split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);
    return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Day of the week of an ISO date: 0 = Sunday … 6 = Saturday */
export function isoWeekday(iso: string): number {
    const [year = 0, month = 1, day = 1] = iso.slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** What the day slot (Vue) and renderDay (React) get for a day of the calendar */
export interface CalendarDayState {
    /** Day of the month */
    day: number;
    today: boolean;
    selected: boolean;
    /** A day of the previous or next month */
    outside: boolean;
    /** Excluded (isDateUnavailable, excludeDates) or outside min/max */
    unavailable: boolean;
    weekend: boolean;
}

// ── Weeks ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** ISO-8601 week: weeks start on Monday, week 1 holds the first Thursday (2027-01-01 → { year: 2026, week: 53 }) */
export function isoWeek(date: DateLike): { year: number; week: number } {
    const iso = toWallIso(date, false) ?? '1970-01-01';
    const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
    const time = Date.UTC(year, month - 1, day);
    const weekday = (new Date(time).getUTCDay() + 6) % 7;
    const thursday = new Date(time + (3 - weekday) * DAY_MS);
    const weekYear = thursday.getUTCFullYear();
    return {
        year: weekYear,
        week: 1 + Math.floor((thursday.getTime() - Date.UTC(weekYear, 0, 1)) / DAY_MS / 7),
    };
}

/**
 * Week number of a calendar row – the ISO week of its Thursday, so rows starting on Sunday or Saturday get the
 * week most of their days belong to
 */
export function rowWeekNumber(days: string[]): number {
    const thursday = days.find((day) => isoWeekday(day) === 4) ?? days[0] ?? '1970-01-01';
    return isoWeek(thursday).week;
}

/** First day of the week and weekend days of a locale (0 = Sunday … 6 = Saturday, like Date.getDay) */
export interface WeekInfo {
    firstDay: number;
    weekend: number[];
}

// Fallback where Intl.Locale has no week info yet (Firefox): regions that start on Sunday or Saturday, or rest on
// Friday and Saturday
const sundayFirst = new Set(
    'AG AS BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(
        ' '
    )
);
const saturdayFirst = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));
const fridaySaturday = new Set('AE BH DZ EG IL IQ JO KW LY OM QA SA SD SY YE'.split(' '));

/** Week info of a locale from Intl (Intl uses 1 = Monday … 7 = Sunday), with a small table as fallback */
export function localeWeekInfo(locale: string): WeekInfo {
    try {
        const intl = new Intl.Locale(locale) as Intl.Locale & {
            getWeekInfo?: () => { firstDay: number; weekend: number[] };
            weekInfo?: { firstDay: number; weekend: number[] };
        };
        const info = intl.getWeekInfo?.() ?? intl.weekInfo;
        if (info) return { firstDay: info.firstDay % 7, weekend: info.weekend.map((day) => day % 7) };
        const region = intl.maximize().region ?? '';
        return {
            firstDay: sundayFirst.has(region) ? 0 : saturdayFirst.has(region) ? 6 : 1,
            weekend: fridaySaturday.has(region) ? [5, 6] : [6, 0],
        };
    } catch {
        return { firstDay: 1, weekend: [6, 0] };
    }
}

/** First day of the week of the row holding `iso` (firstDay 0 = Sunday … 6) */
export function startOfIsoWeekRow(iso: string, firstDay = 1): string {
    return addIsoDays(iso, -((isoWeekday(iso) - firstDay + 7) % 7));
}

/** `count` days from `start` – the days of a week strip */
export function dayStrip(start: string, count = 7): string[] {
    return Array.from({ length: count }, (_, index) => addIsoDays(start, index));
}

// ── Pasted and typed dates ──────────────────────────────────────────────────────────────────────────────────────

/** Order of day, month and year in the short date format of a locale (de-DE: day, month, year) */
export function localeDateOrder(locale: string): ('day' | 'month' | 'year')[] {
    try {
        return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', year: 'numeric' })
            .formatToParts(new Date(2026, 10, 20))
            .map((part) => part.type)
            .filter((type): type is 'day' | 'month' | 'year' => type === 'day' || type === 'month' || type === 'year');
    } catch {
        return ['day', 'month', 'year'];
    }
}

const monthNameCache = new Map<string, string[][]>();
/** Month names of a locale and of English (long and short, lower case) – "oktober", "okt", "october", "oct" */
function monthNames(locale: string): string[][] {
    const cached = monthNameCache.get(locale);
    if (cached) return cached;
    const names = Array.from({ length: 12 }, (_, month) =>
        [locale, 'en-US'].flatMap((tag) =>
            (['long', 'short'] as const).map((style) => {
                try {
                    return new Intl.DateTimeFormat(tag, { month: style, timeZone: 'UTC' })
                        .format(new Date(Date.UTC(2026, month, 15)))
                        .toLowerCase()
                        .replace(/\.$/, '');
                } catch {
                    return '';
                }
            })
        )
    );
    monthNameCache.set(locale, names);
    return names;
}

/** Two-digit years: the closest century to today ("26" → 2026, "99" → 1999) */
function fullYear(text: string, now: Date): number {
    const year = Number(text);
    if (text.length > 2) return year;
    const current = now.getFullYear();
    const candidate = Math.floor(current / 100) * 100 + year;
    return candidate > current + 50 ? candidate - 100 : candidate;
}

/** "14:30", "14.30 Uhr", "2:30 PM", "14:30:15" → [hour, minute, second] */
function parseClock(text: string): [number, number, number] | null {
    const match = /^(\d{1,2})(?:[:.h](\d{2}))?(?:[:.](\d{2}))?\s*(uhr|h|am|pm|a\.m\.|p\.m\.)?$/i.exec(text.trim());
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2] ?? 0);
    const second = Number(match[3] ?? 0);
    const period = match[4]?.toLowerCase().replaceAll('.', '');
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    if (!match[2] && !period) return null;
    if (hour > 23 || minute > 59 || second > 59) return null;
    return [hour, minute, second];
}

/**
 * A pasted or typed date as ISO, or null: ISO ("2026-10-20", "2026-10-20T14:30"), the order of the locale
 * ("20.10.2026", "20.10.26", "10/20/2026" in en-US), month names ("20. Oktober 2026", "Oct 20, 2026") – with
 * `withTime` an optional time after it ("20.10.2026 14:30", "… 2:30 PM"; else 00:00).
 */
export function parsePastedDate(
    text: string,
    locale = defaultLocale,
    withTime = false,
    now = new Date()
): string | null {
    const value = text.trim();
    if (!value) return null;
    const iso = parseIsoParts(value);
    if (iso) return toWallIso(value, withTime);

    // The time: after a comma, "um"/"at", or the last part with a colon
    const timeMatch =
        /(?:,|\s+um|\s+at|\s)\s*(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\s*(?:uhr|h|am|pm|a\.m\.|p\.m\.)?|\d{1,2}\s*(?:am|pm))\s*$/i.exec(
            value
        );
    let datePart = value;
    let clock: [number, number, number] = [0, 0, 0];
    if (timeMatch) {
        const parsed = parseClock(timeMatch[1]!);
        if (parsed) {
            clock = parsed;
            datePart = value.slice(0, timeMatch.index).trim();
        }
    }

    const tokens = datePart
        .toLowerCase()
        .split(/[\s./,-]+/)
        .filter(Boolean);
    let day: number | undefined;
    let month: number | undefined;
    let year: number | undefined;
    const names = monthNames(locale);
    const numbers: string[] = [];
    for (const token of tokens) {
        if (/^\d+$/.test(token)) numbers.push(token);
        else {
            const word = token.replace(/\.$/, '');
            const index = names.findIndex((forms) =>
                forms.some((name) => name && word.length >= 3 && name.startsWith(word))
            );
            if (index < 0) return null;
            month = index + 1;
        }
    }
    if (month !== undefined) {
        // "20. Oktober 2026", "Oct 20, 2026": the 4-digit (or last) number is the year
        if (numbers.length !== 2) return null;
        const yearIndex = numbers.findIndex((number) => number.length > 2);
        const at = yearIndex >= 0 ? yearIndex : 1;
        year = fullYear(numbers[at]!, now);
        day = Number(numbers[1 - at]);
    } else {
        if (numbers.length !== 3) return null;
        // A leading 4-digit number is the year (ISO order with other separators: "2026/10/20")
        const order = numbers[0]!.length === 4 ? (['year', 'month', 'day'] as const) : localeDateOrder(locale);
        order.forEach((part, index) => {
            const number = numbers[index]!;
            if (part === 'year') year = fullYear(number, now);
            else if (part === 'month') month = Number(number);
            else day = Number(number);
        });
    }
    if (!year || !month || !day || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
    const date = `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
    return withTime ? `${date}T${pad(clock[0])}:${pad(clock[1])}` : date;
}

/** A pasted range ("20.10.2026 – 24.10.2026", "… bis …", "… to …") as start and end, or null */
export function parsePastedRange(
    text: string,
    locale = defaultLocale,
    withTime = false,
    now = new Date()
): { start: string; end: string } | null {
    const parts = text.split(/\s+[-–—]\s+|\s*[–—]\s*|\s+(?:bis|to|until)\s+/i);
    if (parts.length !== 2) return null;
    const start = parsePastedDate(parts[0]!, locale, withTime, now);
    const end = parsePastedDate(parts[1]!, locale, withTime, now);
    if (!start || !end) return null;
    return start <= end ? { start, end } : { start: end, end: start };
}

// ── Quarters, months, years and their presets ───────────────────────────────────────────────────────────────────

/** A quarter as "2026-Q4" */
export function quarterOf(date: DateLike): string {
    const iso = toWallIso(date, false) ?? '1970-01-01';
    return `${iso.slice(0, 4)}-Q${Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1}`;
}

const romanQuarters = ['i', 'ii', 'iii', 'iv'];

/**
 * "2026-Q4", "Q4 2026", "Q4/2026", "4/2026", "4. Quartal 2026", "2026 Q4" → { year: 2026, quarter: 4 }; null if
 * the text is none of these. Also the short forms of the language modules – a letter before the number ("T4 2026",
 * "Ç4 2026"), Roman numerals ("IV kw. 2026") – and digits of other scripts ("Q4 ٢٠٢٦").
 */
export function parseQuarter(text: string): { year: number; quarter: number } | null {
    const value = text
        .trim()
        .toLowerCase()
        .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) & 0xf));
    const yearFirst = /^(\d{4})\s*[-/ ]?\s*\p{L}([1-4])$/u.exec(value);
    if (yearFirst) return { year: Number(yearFirst[1]), quarter: Number(yearFirst[2]) };
    const quarterFirst =
        /^(?:\p{L}\s*([1-4])|([1-4])\.?\s*(?:quartal|quarter|qu\.?)?|(iv|i{1,3})\.?\s*(?:kw\.?)?)\s*[-/ ]?\s*(\d{4})$/u.exec(
            value
        );
    if (!quarterFirst) return null;
    const quarter = quarterFirst[3]
        ? romanQuarters.indexOf(quarterFirst[3]) + 1
        : Number(quarterFirst[1] ?? quarterFirst[2]);
    return { year: Number(quarterFirst[4]), quarter };
}

/** "2026-Q4" → "2026-10-01" (first day) */
export function quarterStart(quarter: string): string {
    const parsed = parseQuarter(quarter);
    if (!parsed) return '';
    return `${pad(parsed.year, 4)}-${pad((parsed.quarter - 1) * 3 + 1)}-01`;
}

/** "2026-Q4" → "2026-12-31" (last day) */
export function quarterEnd(quarter: string): string {
    const parsed = parseQuarter(quarter);
    if (!parsed) return '';
    const month = parsed.quarter * 3;
    return `${pad(parsed.year, 4)}-${pad(month)}-${pad(daysInMonth(parsed.year, month))}`;
}

/** "2026-Q4" moved by quarters (+1 → "2027-Q1") */
export function shiftQuarter(quarter: string, by: number): string {
    const parsed = parseQuarter(quarter);
    if (!parsed) return quarter;
    const index = parsed.year * 4 + parsed.quarter - 1 + by;
    return `${pad(Math.floor(index / 4), 4)}-Q${(index % 4) + 1}`;
}

/** "2026-10" moved by months */
export function shiftMonth(month: string, by: number): string {
    const [year = 0, number = 1] = month.split('-').map(Number);
    const index = year * 12 + number - 1 + by;
    return `${pad(Math.floor(index / 12), 4)}-${pad((index % 12) + 1)}`;
}

/** Named ranges of months, quarters or years (relative to today) */
export type PeriodPreset =
    | 'thisMonth'
    | 'lastMonth'
    | 'last3Months'
    | 'last6Months'
    | 'last12Months'
    | 'thisQuarter'
    | 'lastQuarter'
    | 'last4Quarters'
    | 'thisYear'
    | 'lastYear'
    | 'last3Years'
    | 'last5Years';

/** A period: "2026-10" (month), "2026-Q4" (quarter) or "2026" (year) */
export type Period = 'month' | 'quarter' | 'year';

/** Start and end of a period range – "2026-10", "2026-Q4" or "2026" */
export interface PeriodRange {
    start: string | null;
    end: string | null;
}

/** The period holding an ISO date in a period format */
export function periodOf(iso: string, period: Period): string {
    if (period === 'month') return iso.slice(0, 7);
    if (period === 'year') return iso.slice(0, 4);
    return quarterOf(iso);
}

/** First day of a period ("2026-Q4" → "2026-10-01", "2026-10" → "2026-10-01", "2026" → "2026-01-01") */
export function periodStart(value: string, period: Period): string {
    if (period === 'quarter') return quarterStart(value);
    if (period === 'month') return `${value}-01`;
    return `${value.padStart(4, '0')}-01-01`;
}

/** Last day of a period */
export function periodEnd(value: string, period: Period): string {
    if (period === 'quarter') return quarterEnd(value);
    if (period === 'month') {
        const [year = 0, month = 1] = value.split('-').map(Number);
        return `${value}-${pad(daysInMonth(year, month))}`;
    }
    return `${value.padStart(4, '0')}-12-31`;
}

/**
 * A preset as range of the period ("thisQuarter" for months → { start: "2026-10", end: "2026-12" }); null when the
 * preset does not fit the period (e.g. "lastMonth" for years)
 */
export function periodPreset(preset: PeriodPreset, period: Period, today = todayIso()): PeriodRange | null {
    const month = today.slice(0, 7);
    const quarter = quarterOf(today);
    const year = Number(today.slice(0, 4));
    const span = (start: string, end: string): PeriodRange => ({
        start: periodOf(start, period),
        end: periodOf(end, period),
    });
    const months = (from: number, to: number) => span(`${shiftMonth(month, from)}-01`, `${shiftMonth(month, to)}-01`);
    const quarters = (from: number, to: number) =>
        span(quarterStart(shiftQuarter(quarter, from)), quarterEnd(shiftQuarter(quarter, to)));
    const years = (from: number, to: number) => span(`${year + from}-01-01`, `${year + to}-12-31`);
    const fits: Record<PeriodPreset, Period[]> = {
        thisMonth: ['month'],
        lastMonth: ['month'],
        last3Months: ['month'],
        last6Months: ['month'],
        last12Months: ['month'],
        thisQuarter: ['month', 'quarter'],
        lastQuarter: ['month', 'quarter'],
        last4Quarters: ['month', 'quarter'],
        thisYear: ['month', 'quarter', 'year'],
        lastYear: ['month', 'quarter', 'year'],
        last3Years: ['year'],
        last5Years: ['year'],
    };
    if (!fits[preset]?.includes(period)) return null;
    switch (preset) {
        case 'thisMonth':
            return months(0, 0);
        case 'lastMonth':
            return months(-1, -1);
        case 'last3Months':
            return months(-2, 0);
        case 'last6Months':
            return months(-5, 0);
        case 'last12Months':
            return months(-11, 0);
        case 'thisQuarter':
            return quarters(0, 0);
        case 'lastQuarter':
            return quarters(-1, -1);
        case 'last4Quarters':
            return quarters(-3, 0);
        case 'thisYear':
            return years(0, 0);
        case 'lastYear':
            return years(-1, -1);
        case 'last3Years':
            return years(-2, 0);
        case 'last5Years':
            return years(-4, 0);
    }
}

/**
 * Presets for date ranges beyond Ark's own ("last3Months", "last6Months", "last12Months", "last4Quarters",
 * "last3Years", "last5Years") as ISO dates: "last3Months" on 2026-10-21 → 2026-08-01 – 2026-10-31. Null for others.
 */
export function presetDateRange(preset: string, today = todayIso()): { start: string; end: string } | null {
    const period: Period | undefined = ['last3Years', 'last5Years'].includes(preset)
        ? 'year'
        : ['last3Months', 'last6Months', 'last12Months', 'last4Quarters'].includes(preset)
          ? 'month'
          : undefined;
    if (!period) return null;
    const range = periodPreset(preset as PeriodPreset, period, today);
    if (!range?.start || !range.end) return null;
    return { start: periodStart(range.start, period), end: periodEnd(range.end, period) };
}

/**
 * Any named date range relative to today as ISO dates (React Native DateRangePicker): "thisWeek", "lastWeek",
 * "thisMonth", "lastMonth", "thisQuarter", "lastQuarter", "thisYear", "lastYear", "last3Days" … "last90Days" (the
 * last N days up to today) and the presets of presetDateRange. Weeks start on `firstDay` (0 = Sunday … 6). Null
 * for unknown names.
 */
export function namedDateRange(
    preset: string,
    today = todayIso(),
    firstDay = 1
): { start: string; end: string } | null {
    const days = /^last(\d+)Days$/.exec(preset);
    if (days) return { start: addIsoDays(today, 1 - Number(days[1])), end: today };
    const week = startOfIsoWeekRow(today, firstDay);
    const month = today.slice(0, 7);
    const year = today.slice(0, 4);
    const quarter = quarterOf(today);
    switch (preset) {
        case 'thisWeek':
            return { start: week, end: addIsoDays(week, 6) };
        case 'lastWeek':
            return { start: addIsoDays(week, -7), end: addIsoDays(week, -1) };
        case 'thisMonth':
            return { start: periodStart(month, 'month'), end: periodEnd(month, 'month') };
        case 'lastMonth':
            return {
                start: periodStart(shiftMonth(month, -1), 'month'),
                end: periodEnd(shiftMonth(month, -1), 'month'),
            };
        case 'thisQuarter':
            return { start: quarterStart(quarter), end: quarterEnd(quarter) };
        case 'lastQuarter':
            return { start: quarterStart(shiftQuarter(quarter, -1)), end: quarterEnd(shiftQuarter(quarter, -1)) };
        case 'thisYear':
            return { start: `${year}-01-01`, end: `${year}-12-31` };
        case 'lastYear':
            return { start: `${Number(year) - 1}-01-01`, end: `${Number(year) - 1}-12-31` };
        default:
            return presetDateRange(preset, today);
    }
}

// ── Times ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** "14:30" or "14:30:15" → seconds since midnight; null if no time */
export function timeToSeconds(time: string): number | null {
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(time.trim());
    if (!match) return null;
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0);
}

/** Seconds since midnight → "14:30" (or "14:30:15") */
export function secondsToTime(seconds: number, withSeconds = false): string {
    const value = ((Math.round(seconds) % 86_400) + 86_400) % 86_400;
    const time = `${pad(Math.floor(value / 3600))}:${pad(Math.floor((value % 3600) / 60))}`;
    return withSeconds ? `${time}:${pad(value % 60)}` : time;
}

/** A typed or pasted time ("14:30", "1430", "2:30 PM", "14.30 Uhr") as "HH:mm" (or "HH:mm:ss"), or null */
export function parseTimeText(text: string, withSeconds = false): string | null {
    const value = text.trim();
    const compact = /^(\d{2})(\d{2})(\d{2})?$/.exec(value);
    const clock = compact
        ? ([Number(compact[1]), Number(compact[2]), Number(compact[3] ?? 0)] as [number, number, number])
        : parseClock(value);
    if (!clock || clock[0] > 23 || clock[1] > 59 || clock[2] > 59) return null;
    return secondsToTime(clock[0] * 3600 + clock[1] * 60 + clock[2], withSeconds);
}

/** The times of a list: every `step` minutes from min to max ("HH:mm", with seconds "HH:mm:ss") */
export function timeSlots(step: number, min = '00:00', max = '23:59', withSeconds = false): string[] {
    const from = timeToSeconds(min) ?? 0;
    const to = timeToSeconds(max) ?? 86_399;
    const slots: string[] = [];
    for (let seconds = from; seconds <= to && step > 0; seconds += step * 60) {
        slots.push(secondsToTime(seconds, withSeconds));
    }
    return slots;
}

/** Whether a time lies between min and max (both optional, inclusive) */
export function isTimeInRange(time: string, min?: string, max?: string): boolean {
    const value = timeToSeconds(time);
    if (value === null) return false;
    if (min && value < (timeToSeconds(min) ?? 0)) return false;
    if (max && value > (timeToSeconds(max) ?? 86_399)) return false;
    return true;
}

/** A time in the format of the locale ("14:30", en-US "2:30 PM"); `hourCycle` forces 12 or 24 hours */
export function formatTime(
    time: string,
    locale = defaultLocale,
    options: { hourCycle?: 'h12' | 'h23'; withSeconds?: boolean } = {}
): string {
    const seconds = timeToSeconds(time);
    if (seconds === null) return time;
    return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: options.withSeconds ? '2-digit' : undefined,
        hourCycle: options.hourCycle,
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(2000, 0, 1) + seconds * 1000));
}

// ── Time zones (Intl only) ──────────────────────────────────────────────────────────────────────────────────────

const zoneFormatters = new Map<string, Intl.DateTimeFormat>();
function zoneFormatter(timeZone: string) {
    let formatter = zoneFormatters.get(timeZone);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            era: 'short',
        });
        zoneFormatters.set(timeZone, formatter);
    }
    return formatter;
}

/** Whether Intl knows the IANA zone ("Europe/Berlin") */
export function isValidTimeZone(timeZone: string): boolean {
    try {
        zoneFormatter(timeZone);
        return true;
    } catch {
        return false;
    }
}

/** Wall-clock parts of an instant in a zone */
export function zonedParts(instant: Date, timeZone: string) {
    const parts = Object.fromEntries(
        zoneFormatter(timeZone)
            .formatToParts(instant)
            .map((part) => [part.type, part.value])
    );
    const year = Number(parts.year);
    return {
        year: parts.era === 'BC' || parts.era === 'B' ? 1 - year : year,
        month: Number(parts.month),
        day: Number(parts.day),
        hour: Number(parts.hour) % 24,
        minute: Number(parts.minute),
        second: Number(parts.second),
    };
}

/** Offset of a zone at an instant in minutes (Europe/Berlin in summer: 120) */
export function timeZoneOffset(instant: Date, timeZone: string): number {
    const parts = zonedParts(instant, timeZone);
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return Math.round((asUtc - (instant.getTime() - instant.getUTCMilliseconds())) / 60_000);
}

/** Wall-clock time of an instant in a zone as ISO ("2026-10-20T14:30", with seconds "…:05") */
export function toZonedIso(instant: Date, timeZone: string, withSeconds = false): string {
    const p = zonedParts(instant, timeZone);
    const iso = `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
    return withSeconds ? `${iso}:${pad(p.second)}` : iso;
}

/**
 * The instant of a wall-clock time in a zone. Like Temporal's "compatible": a time in the gap of the spring change
 * moves forward by the gap (02:30 → 03:30 in Berlin), a time in the autumn overlap is the earlier one (summer time).
 */
export function zonedToInstant(wall: string, timeZone: string): Date {
    const p = parseIsoParts(wall);
    if (!p) return new Date(Number.NaN);
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    const before = timeZoneOffset(new Date(asUtc - DAY_MS), timeZone);
    const after = timeZoneOffset(new Date(asUtc + DAY_MS), timeZone);
    const target = toWallIso(wall, true, undefined, true);
    const candidates = [...new Set([before, after])]
        .map((offset) => new Date(asUtc - offset * 60_000))
        .filter((instant) => toZonedIso(instant, timeZone, true) === target)
        .sort((a, b) => a.getTime() - b.getTime());
    // In the gap neither offset gives the time back: take the offset before the change (moves the time forward)
    return candidates[0] ?? new Date(asUtc - before * 60_000);
}

/** Minutes as ISO offset: 120 → "+02:00", -330 → "-05:30", 0 → "Z" */
export function formatOffset(minutes: number): string {
    if (minutes === 0) return 'Z';
    const sign = minutes < 0 ? '-' : '+';
    const value = Math.abs(minutes);
    return `${sign}${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
}

/** Wall-clock ISO in a zone with the zone's offset at that time: "2026-10-20T14:30" → "2026-10-20T14:30+02:00" */
export function withZoneOffset(wall: string, timeZone: string): string {
    const instant = zonedToInstant(wall, timeZone);
    if (Number.isNaN(instant.getTime())) return wall;
    // A time in the spring gap is moved forward – the value shows the time that exists
    const seconds = wall.length > 16;
    return `${toZonedIso(instant, timeZone, seconds)}${formatOffset(timeZoneOffset(instant, timeZone))}`;
}

/** Short name of a zone at an instant for the field ("MESZ", en-US "GMT+2"); the IANA name if Intl has none */
export function timeZoneLabel(timeZone: string, locale = defaultLocale, instant = new Date()): string {
    try {
        return (
            new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
                .formatToParts(instant)
                .find((part) => part.type === 'timeZoneName')?.value ?? timeZone
        );
    } catch {
        return timeZone;
    }
}

/** Long name of a zone for screen readers ("Central European Summer Time") */
export function timeZoneLongLabel(timeZone: string, locale = defaultLocale, instant = new Date()): string {
    try {
        return (
            new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'long' })
                .formatToParts(instant)
                .find((part) => part.type === 'timeZoneName')?.value ?? timeZone
        );
    } catch {
        return timeZone;
    }
}

/**
 * A time of day in a zone with its offset on `date` (default today): "14:30" → "14:30+02:00". Times given with an
 * offset or "Z" are converted into the zone first (zonedTime).
 */
export function timeWithZoneOffset(time: string, timeZone: string, date = todayIso(timeZone)): string {
    const zoned = withZoneOffset(`${date}T${time}`, timeZone);
    return zoned.slice(11);
}

/** A time value with offset ("12:30Z", "14:30+02:00") as wall-clock time in a zone on `date`; plain times stay */
export function zonedTime(value: string, timeZone: string, date = todayIso(timeZone), withSeconds = false): string {
    const match = /^(\d{2}:\d{2}(?::\d{2})?)(Z|[+-]\d{2}:?\d{2})$/.exec(value.trim());
    if (!match) return value.slice(0, withSeconds ? 8 : 5);
    const instant = isoToDate(`${date}T${match[1]}${match[2]}`);
    return instant ? toZonedIso(instant, timeZone, true).slice(11, withSeconds ? 19 : 16) : value;
}

// ── Durations ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A duration in parts – hours may exceed 23 when days are not shown */
export interface DurationParts {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

/** How DurationInput hands out its value: total minutes, total seconds or ISO 8601 ("PT2H30M") */
export type DurationValueType = 'minutes' | 'seconds' | 'iso';

/** "P1DT2H30M", "PT90M", "P2W" → parts (normalised); null for anything else (years and months are ambiguous) */
export function parseIsoDuration(text: string): DurationParts | null {
    const match =
        /^P(?:(\d+(?:[.,]\d+)?)W)?(?:(\d+(?:[.,]\d+)?)D)?(?:T(?:(\d+(?:[.,]\d+)?)H)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)S)?)?$/i.exec(
            text.trim()
        );
    if (!match || text.trim().toUpperCase() === 'P' || /T$/i.test(text.trim())) return null;
    const number = (value: string | undefined) => Number((value ?? '0').replace(',', '.'));
    const total =
        number(match[1]) * 7 * 86_400 +
        number(match[2]) * 86_400 +
        number(match[3]) * 3600 +
        number(match[4]) * 60 +
        number(match[5]);
    return splitDuration(Math.round(total), true);
}

/** Parts as ISO 8601 duration: { hours: 2, minutes: 30 } → "PT2H30M", nothing → "PT0S" */
export function toIsoDuration(parts: DurationParts): string {
    const date = parts.days ? `${parts.days}D` : '';
    const time = [
        parts.hours ? `${parts.hours}H` : '',
        parts.minutes ? `${parts.minutes}M` : '',
        parts.seconds ? `${parts.seconds}S` : '',
    ].join('');
    if (!date && !time) return 'PT0S';
    return `P${date}${time ? `T${time}` : ''}`;
}

/** Total seconds → parts; without `withDays` the hours hold the days (26 h stays 26 h) */
export function splitDuration(totalSeconds: number, withDays = false): DurationParts {
    const value = Math.max(0, Math.round(totalSeconds));
    const days = withDays ? Math.floor(value / 86_400) : 0;
    const rest = value - days * 86_400;
    return {
        days,
        hours: Math.floor(rest / 3600),
        minutes: Math.floor((rest % 3600) / 60),
        seconds: rest % 60,
    };
}

/** Parts → total seconds */
export const durationSeconds = (parts: DurationParts) =>
    parts.days * 86_400 + parts.hours * 3600 + parts.minutes * 60 + parts.seconds;

/** A DurationInput value (minutes, seconds or ISO) as parts; null if empty or invalid */
export function durationToParts(
    value: number | string | null | undefined,
    valueType: DurationValueType = 'minutes',
    withDays = false
): DurationParts | null {
    if (value == null || value === '') return null;
    if (valueType === 'iso' || typeof value === 'string') {
        const parts = typeof value === 'string' ? parseIsoDuration(value) : null;
        return parts ? splitDuration(durationSeconds(parts), withDays) : null;
    }
    if (!Number.isFinite(value)) return null;
    return splitDuration(valueType === 'minutes' ? value * 60 : value, withDays);
}

/** Parts → the value a DurationInput hands out (minutes are rounded down to whole minutes) */
export function partsToDuration(parts: DurationParts, valueType: DurationValueType = 'minutes'): number | string {
    const seconds = durationSeconds(parts);
    if (valueType === 'seconds') return seconds;
    if (valueType === 'iso') return toIsoDuration(parts);
    return Math.floor(seconds / 60);
}

/** Name of a unit for a count in the locale: (2, "hour", long) → "hours", (2, "hour", short) → "hr" */
export function durationUnit(
    count: number,
    unit: 'day' | 'hour' | 'minute' | 'second',
    locale = defaultLocale,
    style: 'long' | 'short' | 'narrow' = 'long'
): string {
    try {
        return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: style })
            .formatToParts(count)
            .filter((part) => part.type === 'unit')
            .map((part) => part.value)
            .join('')
            .trim();
    } catch {
        return unit;
    }
}

/**
 * A duration as text in the locale: "2 hours 30 minutes" (long, for screen readers) or "2 hr 30 min" (short);
 * zero parts are left out, an empty duration is "0 minutes"
 */
export function formatDuration(
    parts: DurationParts,
    locale = defaultLocale,
    style: 'long' | 'short' | 'narrow' = 'long'
): string {
    const units = [
        ['day', parts.days],
        ['hour', parts.hours],
        ['minute', parts.minutes],
        ['second', parts.seconds],
    ] as const;
    const format = (unit: (typeof units)[number][0], count: number) => {
        try {
            return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: style }).format(count);
        } catch {
            return `${count} ${unit}`;
        }
    };
    const text = units.filter(([, count]) => count > 0).map(([unit, count]) => format(unit, count));
    return text.length ? text.join(' ') : format('minute', 0);
}

// ── Time slots for bookings ─────────────────────────────────────────────────────────────────────────────────────

/** A bookable time in TimeGrid */
export interface TimeGridSlot {
    /** "HH:mm" */
    value: string;
    /** Own text instead of the formatted time */
    label?: string;
    disabled?: boolean;
}

/** Start times every `interval` minutes from `start` up to (not including) `end` – "09:00" … "17:30" */
export function timeGridSlots(start = '08:00', end = '18:00', interval = 30): string[] {
    const last = (timeToSeconds(end) ?? 0) - interval * 60;
    if (last < (timeToSeconds(start) ?? 0)) return [];
    return timeSlots(interval, start, secondsToTime(last));
}

/** Whether a slot lies in a chosen range of slots (start and end inclusive) */
export function inTimeRange(slot: string, range: { start: string | null; end: string | null } | null): boolean {
    if (!range?.start) return false;
    const value = timeToSeconds(slot) ?? 0;
    const start = timeToSeconds(range.start) ?? 0;
    const end = range.end ? (timeToSeconds(range.end) ?? start) : start;
    return value >= Math.min(start, end) && value <= Math.max(start, end);
}
