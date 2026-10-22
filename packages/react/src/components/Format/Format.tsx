import {
    formatBytes,
    formatDate,
    formatDateTime,
    formatList,
    formatRelativeTime,
    formatValue as formatValueRecipe,
    relativeTimeRefresh,
    toDateTimeAttribute,
    type DateInput,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useEffect, useState, type ComponentProps } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

interface FormatBase {
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formatValueRecipe>;
}

export interface FormatRelativeTimeProps extends FormatBase, Omit<ComponentProps<'time'>, 'children'> {
    /** The point in time: Date, ISO text or milliseconds */
    value: DateInput;
    /** Reference time (default: now) – pass it for the same text on the server and in the browser */
    now?: DateInput;
    /** Updates the text as time passes (every 10 s, minute or hour, depending on the distance) */
    live?: boolean;
    /** `auto` (default): "yesterday", "tomorrow"; `always`: "1 day ago" */
    numeric?: 'auto' | 'always';
    /** `long` (default) "3 minutes ago", `short` "3 min. ago", `narrow` */
    formatStyle?: 'long' | 'short' | 'narrow';
    /** The exact date and time as the title (tooltip) – default true */
    showTitle?: boolean;
}

/** "3 minutes ago" in a <time> with the exact point as datetime (and title) */
export function FormatRelativeTime({
    classes,
    value,
    now,
    live,
    numeric,
    formatStyle,
    showTitle = true,
    locale: localeProp,
    className,
    ...props
}: FormatRelativeTimeProps) {
    const formatValue = useRecipe('formatValue', formatValueRecipe, classes);
    const context = useLocale();
    const locale = localeProp ?? context.locale;
    // The reference time: `now` (or the time of the first render), later the time of each update
    const [initial] = useState(() => now ?? Date.now());
    const [ticked, setTicked] = useState<number | null>(null);
    const current = ticked ?? now ?? initial;
    useEffect(() => {
        if (!live) return;
        const timer = setTimeout(() => setTicked(Date.now()), relativeTimeRefresh(value, current));
        return () => clearTimeout(timer);
    }, [live, value, current]);
    return (
        <time
            {...props}
            className={formatValue({ class: className })}
            dateTime={toDateTimeAttribute(value)}
            title={showTitle ? formatDateTime(value, locale) || undefined : undefined}
        >
            {formatRelativeTime(value, locale, { now: current, numeric, style: formatStyle })}
        </time>
    );
}

export interface FormatDateProps extends FormatBase, Omit<ComponentProps<'time'>, 'children'> {
    /** The date: Date, ISO text ("2026-10-21") or milliseconds */
    value: DateInput;
    /** Intl format, e.g. { dateStyle: 'long' } or { weekday: 'long', day: 'numeric', month: 'long' } (default medium) */
    formatOptions?: Intl.DateTimeFormatOptions;
    /** Time zone to show the date in, e.g. "Europe/Berlin" (default: the browser's – pass one for server rendering) */
    timeZone?: string;
}

/** A date in the format of the locale, in a <time> with the machine-readable value */
export function FormatDate({ classes, value, formatOptions, timeZone, locale, className, ...props }: FormatDateProps) {
    const formatValue = useRecipe('formatValue', formatValueRecipe, classes);
    const context = useLocale();
    return (
        <time {...props} className={formatValue({ class: className })} dateTime={toDateTimeAttribute(value)}>
            {formatDate(value, locale ?? context.locale, { ...formatOptions, ...(timeZone ? { timeZone } : {}) })}
        </time>
    );
}

export interface FormatDateTimeProps extends FormatDateProps {
    /** Intl format, e.g. { dateStyle: 'full', timeStyle: 'short' } (default: medium date, short time) */
    formatOptions?: Intl.DateTimeFormatOptions;
}

/** Date and time in the format of the locale, in a <time> with the machine-readable value */
export function FormatDateTime({
    classes,
    value,
    formatOptions,
    timeZone,
    locale,
    className,
    ...props
}: FormatDateTimeProps) {
    const formatValue = useRecipe('formatValue', formatValueRecipe, classes);
    const context = useLocale();
    return (
        <time {...props} className={formatValue({ class: className })} dateTime={toDateTimeAttribute(value)}>
            {formatDateTime(value, locale ?? context.locale, { ...formatOptions, ...(timeZone ? { timeZone } : {}) })}
        </time>
    );
}

export interface FormatBytesProps extends FormatBase, Omit<ComponentProps<'span'>, 'children'> {
    /** Size in bytes */
    value: number | null | undefined;
    /** `decimal` (default): 1000 per step, "1.2 MB"; `binary`: 1024 per step, "1.2 MiB" */
    base?: 'decimal' | 'binary';
    /** Decimals (default 1) */
    maximumFractionDigits?: number;
    /** `short` (default) "MB", `long` "Megabyte" (decimal only) */
    unitDisplay?: 'short' | 'long';
}

/** A file or memory size: "1.2 MB" */
export function FormatBytes({
    classes,
    value,
    base,
    maximumFractionDigits,
    unitDisplay,
    locale,
    className,
    ...props
}: FormatBytesProps) {
    const formatValue = useRecipe('formatValue', formatValueRecipe, classes);
    const context = useLocale();
    return (
        <span {...props} className={formatValue({ class: className })}>
            {value === null || value === undefined
                ? ''
                : formatBytes(value, locale ?? context.locale, { base, maximumFractionDigits, unitDisplay })}
        </span>
    );
}

export interface FormatListProps extends FormatBase, Omit<ComponentProps<'span'>, 'children'> {
    items: readonly string[];
    /** `conjunction` (default) "A, B, and C", `disjunction` "A, B, or C", `unit` "A, B, C" */
    type?: 'conjunction' | 'disjunction' | 'unit';
    /** `long` (default), `short`, `narrow` */
    formatStyle?: 'long' | 'short' | 'narrow';
}

/** A list as a sentence: "Anna, Ben, and Clara" */
export function FormatList({ classes, items, type, formatStyle, locale, className, ...props }: FormatListProps) {
    const formatValue = useRecipe('formatValue', formatValueRecipe, classes);
    const context = useLocale();
    return (
        <span {...props} className={formatValue({ class: className })}>
            {formatList(items, locale ?? context.locale, { type, style: formatStyle })}
        </span>
    );
}
