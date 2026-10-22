import { defaultLocale } from './i18n.js';

// Formatting with Intl – the same text on the server and in the browser for the same input (pass `now` for relative
// times). Used by the Format* components, Statistic and on their own.

/** A date as Date, ISO text or milliseconds */
export type DateInput = Date | string | number;

/** The value as a Date (invalid inputs give an invalid Date) */
export function toDate(value: DateInput): Date {
    return value instanceof Date ? value : new Date(value);
}

/** A number in the format of the locale: 1234.5 → "1,234.5"; null/undefined → "" */
export function formatNumber(
    value: number | bigint | null | undefined,
    locale = defaultLocale,
    options?: Intl.NumberFormatOptions
): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat(locale, options).format(value);
}

/** A date: { dateStyle: 'medium' } by default, in the given time zone ("21.10.2026") */
export function formatDate(value: DateInput, locale = defaultLocale, options: Intl.DateTimeFormatOptions = {}): string {
    const date = toDate(value);
    if (Number.isNaN(date.getTime())) return '';
    const hasFields = Object.keys(options).some((key) => key !== 'timeZone' && key !== 'hour12' && key !== 'calendar');
    return new Intl.DateTimeFormat(locale, hasFields ? options : { ...options, dateStyle: 'medium' }).format(date);
}

/** Date and time: { dateStyle: 'medium', timeStyle: 'short' } by default ("Oct 21, 2026, 2:30 PM") */
export function formatDateTime(
    value: DateInput,
    locale = defaultLocale,
    options: Intl.DateTimeFormatOptions = {}
): string {
    const date = toDate(value);
    if (Number.isNaN(date.getTime())) return '';
    const hasFields = Object.keys(options).some((key) => key !== 'timeZone' && key !== 'hour12' && key !== 'calendar');
    return new Intl.DateTimeFormat(
        locale,
        hasFields ? options : { ...options, dateStyle: 'medium', timeStyle: 'short' }
    ).format(date);
}

const relativeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 3600],
    ['month', 30 * 24 * 3600],
    ['week', 7 * 24 * 3600],
    ['day', 24 * 3600],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
];

/** Largest unit that fits the difference, and the rounded amount: -190 s → { value: -3, unit: 'minute' } */
export function relativeTimeParts(
    value: DateInput,
    now: DateInput = Date.now()
): { value: number; unit: Intl.RelativeTimeFormatUnit } {
    const seconds = (toDate(value).getTime() - toDate(now).getTime()) / 1000;
    for (const [unit, size] of relativeUnits) {
        if (Math.abs(seconds) >= size || unit === 'second') {
            // Rounded toward zero so "59 seconds ago" does not become "1 minute ago" too early
            return { value: Math.trunc(seconds / size) || 0, unit };
        }
    }
    return { value: 0, unit: 'second' };
}

/** "3 minutes ago", "in 2 days", "yesterday" (numeric 'auto') */
export function formatRelativeTime(
    value: DateInput,
    locale = defaultLocale,
    options: Intl.RelativeTimeFormatOptions & { now?: DateInput } = {}
): string {
    const { now, ...format } = options;
    const date = toDate(value);
    if (Number.isNaN(date.getTime())) return '';
    const parts = relativeTimeParts(date, now);
    // Under ten seconds: "now" with numeric auto
    const amount = parts.unit === 'second' && Math.abs(parts.value) < 10 ? 0 : parts.value;
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto', ...format }).format(amount, parts.unit);
}

/** How long until the relative text can change: every 10 s under a minute, then every minute, then hourly */
export function relativeTimeRefresh(value: DateInput, now: DateInput = Date.now()): number {
    const seconds = Math.abs(toDate(value).getTime() - toDate(now).getTime()) / 1000;
    if (seconds < 60) return 10_000;
    if (seconds < 3600) return 60_000;
    return 3_600_000;
}

const decimalUnits = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte'] as const;
const binaryUnits = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

/**
 * Bytes as text: decimal (1000, "1.2 MB" – Intl units) or binary (1024, "1.2 MiB"). `maximumFractionDigits`
 * defaults to 1 (none for bytes).
 */
export function formatBytes(
    bytes: number,
    locale = defaultLocale,
    options: { base?: 'decimal' | 'binary'; maximumFractionDigits?: number; unitDisplay?: 'short' | 'long' } = {}
): string {
    const { base = 'decimal', maximumFractionDigits = 1, unitDisplay = 'short' } = options;
    const step = base === 'binary' ? 1024 : 1000;
    let value = Math.abs(bytes);
    let unit = 0;
    while (value >= step && unit < decimalUnits.length - 1) {
        value /= step;
        unit++;
    }
    const signed = bytes < 0 ? -value : value;
    const digits = unit ? maximumFractionDigits : 0;
    if (base === 'binary') {
        return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(signed)} ${binaryUnits[unit]}`;
    }
    return new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: decimalUnits[unit],
        unitDisplay,
        maximumFractionDigits: digits,
    }).format(signed);
}

/** "A, B, and C" (conjunction), "A, B, or C" (disjunction) or "A, B, C" (unit) */
export function formatList(
    items: readonly string[],
    locale = defaultLocale,
    options: { type?: 'conjunction' | 'disjunction' | 'unit'; style?: 'long' | 'short' | 'narrow' } = {}
): string {
    return new Intl.ListFormat(locale, { type: options.type ?? 'conjunction', style: options.style ?? 'long' }).format(
        items
    );
}

/** The ISO text for `<time datetime>`: a date without time stays a date */
export function toDateTimeAttribute(value: DateInput): string | undefined {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = toDate(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export type TrendDirection = 'up' | 'down' | 'flat';
export type TrendTone = 'positive' | 'negative' | 'neutral';

/** Direction and meaning of a change: up is good unless `invert` (e.g. error rate) */
export function statisticTrend(
    change: number | null | undefined,
    invert = false
): { direction: TrendDirection; tone: TrendTone } {
    if (!change) return { direction: 'flat', tone: 'neutral' };
    const direction: TrendDirection = change > 0 ? 'up' : 'down';
    return { direction, tone: (direction === 'up') !== invert ? 'positive' : 'negative' };
}

/** A change in percent as text with sign: 12 → "+12%", -3.5 → "−3.5%", 0 → "0%" */
export function formatTrend(change: number, locale = defaultLocale, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        signDisplay: 'exceptZero',
        maximumFractionDigits: 1,
        ...options,
    }).format(options?.style && options.style !== 'percent' ? change : change / 100);
}

/** Ease-out (cubic) progress for animated numbers */
export const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

/**
 * Counts from `from` to `to` in `duration` ms, calling `onFrame` with the intermediate value on every animation frame
 * (ease-out). Returns a function that stops it. Without requestAnimationFrame (server) it jumps to the end.
 */
export function animateNumber(from: number, to: number, onFrame: (value: number) => void, duration = 800): () => void {
    if (typeof requestAnimationFrame === 'undefined' || duration <= 0 || from === to) {
        onFrame(to);
        return () => {};
    }
    let frame = 0;
    let start: number | undefined;
    const step = (time: number) => {
        start ??= time;
        const progress = Math.min(1, (time - start) / duration);
        onFrame(progress === 1 ? to : from + (to - from) * easeOutCubic(progress));
        if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
}

/** Whether the user allows motion (no `prefers-reduced-motion: reduce`); false on the server */
export function prefersMotion(): boolean {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: no-preference)').matches;
}
