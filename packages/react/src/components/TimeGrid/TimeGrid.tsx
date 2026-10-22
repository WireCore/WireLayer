import {
    formatTime,
    inTimeRange,
    pluralText,
    timeGrid as timeGridRecipe,
    timeGridSlots,
    timeToSeconds,
    type RecipeClasses,
    type TimeGridSlot,
} from '@wirecore/wirelayer-recipes';
import { LoaderCircle } from 'lucide-react';
import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { TimeRange } from '../TimeRangePicker/TimeRangePicker.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface TimeGridProps<T extends string | TimeRange | null = string | null> {
    /** Chosen start time ("HH:mm"); with range { start, end } (start times of the first and last slot) */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    /** The bookable times; default every `interval` minutes from `start` up to `end` */
    times?: (string | TimeGridSlot)[];
    /** First slot ("HH:mm") when `times` is not given */
    start?: string;
    /** End of the last slot ("HH:mm") when `times` is not given */
    end?: string;
    /** Minutes between the slots when `times` is not given */
    interval?: number;
    /** Times that are taken */
    disabledTimes?: string[];
    /** A start and an end slot instead of one (toggle buttons instead of radio buttons) */
    range?: boolean;
    /** 12 or 24 hours; default from the locale */
    hourCycle?: 'h12' | 'h23';
    locale?: string;
    /** Name of the group (default "Available times") */
    label?: string;
    /** Shows that the slots are being loaded */
    loading?: boolean;
    disabled?: boolean;
    /** Sent as "HH:mm"; with range as name[0] and name[1] */
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Accessible name instead of `label` */
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { slot: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof timeGridRecipe>;
}

/**
 * Free time slots for a booking: radio buttons for one time (arrow keys move and choose), toggle buttons for a
 * range (start, then end). Taken slots stay visible but cannot be chosen.
 */
export function TimeGrid<T extends string | TimeRange | null = string | null>({
    value,
    defaultValue,
    onValueChange,
    times,
    start = '08:00',
    end = '18:00',
    interval = 30,
    disabledTimes,
    range = false,
    hourCycle,
    locale: localeProp,
    label,
    loading = false,
    disabled = false,
    name,
    size,
    'aria-label': ariaLabel,
    className,
    style,
    classes,
}: TimeGridProps<T>) {
    const timeGrid = useRecipe('timeGrid', timeGridRecipe, classes);
    const styles = timeGrid({ size });
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const translations = useTranslations();
    const id = useId();
    const items = (times ?? timeGridSlots(start, end, interval)).map((slot) => {
        const item = typeof slot === 'string' ? { value: slot } : slot;
        return {
            value: item.value,
            label: item.label ?? formatTime(item.value, locale, { hourCycle }),
            disabled: disabled || !!item.disabled || !!disabledTimes?.includes(item.value),
        };
    });
    const [internal, setInternal] = useState<string | TimeRange | null>(defaultValue ?? null);
    const current = value === undefined ? internal : value;
    const selectedRange: TimeRange | null =
        typeof current === 'string' ? { start: current, end: null } : (current ?? null);
    const set = (next: string | TimeRange | null) => {
        if (JSON.stringify(next) === JSON.stringify(current ?? null)) return;
        setInternal(next);
        onValueChange?.(next as T);
    };
    const isSelected = (slot: string) =>
        range ? slot === selectedRange?.start || slot === selectedRange?.end : slot === current;
    const choose = (slot: string) => {
        if (items.find((item) => item.value === slot)?.disabled) return;
        if (!range) return set(slot);
        if (!selectedRange?.start || selectedRange.end) return set({ start: slot, end: null });
        const [first, last] = [selectedRange.start, slot].sort(
            (a, b) => (timeToSeconds(a) ?? 0) - (timeToSeconds(b) ?? 0)
        );
        set({ start: first!, end: last! });
    };

    // Roving focus: one slot in the tab order; arrows move (and choose a single time, like radio buttons)
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const [focusValue, setFocusValue] = useState<string | null>(null);
    const enabled = items.filter((item) => !item.disabled);
    const preferred = focusValue ?? selectedRange?.start;
    const tabValue = enabled.find((item) => item.value === preferred)?.value ?? enabled[0]?.value;
    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const forward = ['ArrowDown', rtl ? 'ArrowLeft' : 'ArrowRight'];
        const backward = ['ArrowUp', rtl ? 'ArrowRight' : 'ArrowLeft'];
        const positions = items.map((item, position) => ({ ...item, position })).filter((item) => !item.disabled);
        const at = positions.findIndex((item) => item.position === index);
        let target: (typeof positions)[number] | undefined;
        if (forward.includes(event.key)) target = positions[(at + 1) % positions.length];
        else if (backward.includes(event.key)) target = positions[(at - 1 + positions.length) % positions.length];
        else if (event.key === 'Home') target = positions[0];
        else if (event.key === 'End') target = positions[positions.length - 1];
        if (!target) return;
        event.preventDefault();
        setFocusValue(target.value);
        buttons.current[target.position]?.focus();
        if (!range) choose(target.value);
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            {loading ? (
                <div className={styles.status()} role="status">
                    <LoaderCircle className={styles.spinner()} aria-hidden="true" />
                    {translations.timeGrid.loading}
                </div>
            ) : !items.length ? (
                <p className={styles.status()} role="status">
                    {translations.timeGrid.empty}
                </p>
            ) : (
                <div
                    role={range ? 'group' : 'radiogroup'}
                    className={styles.grid()}
                    aria-label={label ?? ariaLabel ?? translations.timeGrid.label}
                    aria-describedby={`${id}n`}
                    aria-disabled={disabled || undefined}
                >
                    {items.map((item, index) => (
                        <button
                            key={item.value}
                            ref={(element) => {
                                buttons.current[index] = element;
                            }}
                            type="button"
                            role={range ? undefined : 'radio'}
                            className={styles.slot()}
                            tabIndex={item.value === tabValue ? 0 : -1}
                            aria-checked={range ? undefined : isSelected(item.value)}
                            aria-pressed={range ? isSelected(item.value) : undefined}
                            aria-disabled={item.disabled || undefined}
                            data-in-range={(range && inTimeRange(item.value, selectedRange)) || undefined}
                            onClick={() => choose(item.value)}
                            onKeyDown={(event) => onKeyDown(event, index)}
                            onFocus={() => setFocusValue(item.value)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
            {!loading && items.length > 0 && (
                <span id={`${id}n`} hidden>
                    {pluralText(translations.timeGrid.available, enabled.length, locale)}
                </span>
            )}
            {name &&
                (range ? (
                    <>
                        <input type="hidden" name={`${name}[0]`} value={selectedRange?.start ?? ''} />
                        <input type="hidden" name={`${name}[1]`} value={selectedRange?.end ?? ''} />
                    </>
                ) : (
                    <input type="hidden" name={name} value={(current as string | null) ?? ''} />
                ))}
        </div>
    );
}
