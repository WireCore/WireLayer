import {
    formatBytes,
    formatDate,
    formatDateTime,
    formatList,
    formatRelativeTime,
    formatValue,
    relativeTimeRefresh,
    type DateInput,
} from '@wirecore/wirelayer-recipes/native';
import { useEffect, useState } from 'react';
import { Text, type TextProps } from 'react-native';
import { useLocale } from '../../locale.js';

interface FormatBase extends Omit<TextProps, 'children'> {
    /** Default: the LocaleProvider's */
    locale?: string;
    className?: string;
}

export interface FormatDateProps extends FormatBase {
    value: DateInput;
    /** Intl options (default `dateStyle: 'medium'`) */
    formatOptions?: Intl.DateTimeFormatOptions;
    /** Time zone, e.g. "Europe/Berlin" */
    timeZone?: string;
}

/** A date in the format of the locale ("21.10.2026") */
export function FormatDate({ value, formatOptions, timeZone, locale, className, ...props }: FormatDateProps) {
    const context = useLocale();
    return (
        <Text {...props} className={formatValue({ class: className })}>
            {formatDate(value, locale ?? context.locale, { ...formatOptions, ...(timeZone ? { timeZone } : {}) })}
        </Text>
    );
}

export type FormatDateTimeProps = FormatDateProps;

/** Date and time in the format of the locale ("10/21/2026, 2:30 PM") */
export function FormatDateTime({ value, formatOptions, timeZone, locale, className, ...props }: FormatDateTimeProps) {
    const context = useLocale();
    return (
        <Text {...props} className={formatValue({ class: className })}>
            {formatDateTime(value, locale ?? context.locale, {
                ...formatOptions,
                ...(timeZone ? { timeZone } : {}),
            })}
        </Text>
    );
}

export interface FormatRelativeTimeProps extends FormatBase {
    value: DateInput;
    /** Reference time (default now) */
    now?: DateInput;
    /** Updates itself as time passes ("1 minute ago" → "2 minutes ago") */
    live?: boolean;
    /** `auto`: "yesterday", `always`: "1 day ago" */
    numeric?: 'auto' | 'always';
    formatStyle?: 'long' | 'short' | 'narrow';
    /** Reads the exact date and time as the hint (default true) */
    showTitle?: boolean;
}

/** A point in time relative to now ("5 minutes ago", "tomorrow") */
export function FormatRelativeTime({
    value,
    now,
    live = false,
    numeric = 'auto',
    formatStyle,
    showTitle = true,
    locale,
    className,
    ...props
}: FormatRelativeTimeProps) {
    const context = useLocale();
    const [tick, setTick] = useState(() => Date.now());
    const current = now ?? tick;
    useEffect(() => {
        if (!live || now !== undefined) return;
        const timer = setTimeout(() => setTick(Date.now()), relativeTimeRefresh(value, tick));
        return () => clearTimeout(timer);
    }, [live, now, value, tick]);
    const code = locale ?? context.locale;
    return (
        <Text
            {...props}
            accessibilityHint={showTitle ? formatDateTime(value, code) : undefined}
            className={formatValue({ class: className })}
        >
            {formatRelativeTime(value, code, { now: current, numeric, style: formatStyle })}
        </Text>
    );
}

export interface FormatBytesProps extends FormatBase {
    /** Size in bytes */
    value: number | null | undefined;
    /** `decimal` (default, 1000 – kB, MB) or `binary` (1024 – KiB, MiB) */
    base?: 'decimal' | 'binary';
    /** Decimals (default 1) */
    maximumFractionDigits?: number;
    /** "MB" (default) or "Megabyte" */
    unitDisplay?: 'short' | 'long';
}

/** A file size in the format of the locale ("1.5 MB") */
export function FormatBytes({
    value,
    base,
    maximumFractionDigits,
    unitDisplay,
    locale,
    className,
    ...props
}: FormatBytesProps) {
    const context = useLocale();
    return (
        <Text {...props} className={formatValue({ class: className })}>
            {value === null || value === undefined
                ? ''
                : formatBytes(value, locale ?? context.locale, { base, maximumFractionDigits, unitDisplay })}
        </Text>
    );
}

export interface FormatListProps extends FormatBase {
    items: readonly string[];
    /** `conjunction` ("a, b, and c", default), `disjunction` ("a, b, or c") or `unit` */
    type?: 'conjunction' | 'disjunction' | 'unit';
    formatStyle?: 'long' | 'short' | 'narrow';
}

/** A list in the format of the locale ("Berlin, Hamburg, and Munich") */
export function FormatList({ items, type, formatStyle, locale, className, ...props }: FormatListProps) {
    const context = useLocale();
    return (
        <Text {...props} className={formatValue({ class: className })}>
            {formatList(items, locale ?? context.locale, { type, style: formatStyle })}
        </Text>
    );
}
