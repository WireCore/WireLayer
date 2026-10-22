import { Field, useFieldContext } from '@ark-ui/react/field';
import { Popover } from '@ark-ui/react/popover';
import { Portal } from '@ark-ui/react/portal';
import {
    datePicker as datePickerRecipe,
    parseQuarter,
    periodPreset,
    quarterOf,
    todayIso,
    type PeriodPreset,
    type PeriodRange,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface QuarterPickerProps<T extends string | PeriodRange | null = string | null> {
    /** Quarter as "2026-Q4"; with range { start, end } */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    /** Start and end quarter instead of one */
    range?: boolean;
    /** Earliest quarter ("2024-Q1") */
    min?: string;
    /** Latest quarter ("2027-Q4") */
    max?: string;
    /** Buttons below the quarters: "thisQuarter", "lastQuarter", "last4Quarters", "thisYear", "lastYear" or own */
    presets?: (PeriodPreset | { label: string; value: PeriodRange })[];
    /** Month names in the quarter buttons follow the locale */
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** Sent as "2026-Q4"; with range as name[0] and name[1] */
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the field, e.g. { control: "…" } (see the datePicker recipe) */
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

const normalize = (quarter: { year: number; quarter: number } | null) =>
    quarter ? `${quarter.year}-Q${quarter.quarter}` : null;
const order = (first: string, second: string | null): PeriodRange =>
    second && second < first ? { start: second, end: first } : { start: first, end: second };

/**
 * Quarter field: type "Q4 2026" (also "2026-Q4", "4/2026") or pick from the four quarters of a year; with range
 * a start and an end quarter. Arrow keys move between the quarters and on into the next or previous year.
 */
export function QuarterPicker<T extends string | PeriodRange | null = string | null>({
    value,
    defaultValue,
    onValueChange,
    range = false,
    min,
    max,
    presets,
    locale: localeProp,
    disabled,
    readOnly,
    invalid,
    required,
    name,
    size,
    clearable = true,
    'aria-label': ariaLabel,
    className,
    style,
    classes,
}: QuarterPickerProps<T>) {
    const datePicker = useRecipe('datePicker', datePickerRecipe, classes);
    const styles = datePicker({ size });
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const translations = useTranslations();
    const id = useId();
    const field = useFieldContext();
    const state = {
        disabled: disabled ?? field?.disabled,
        readOnly: readOnly ?? field?.readOnly,
        invalid: invalid ?? field?.invalid,
        required: required ?? field?.required,
    };
    const [internal, setInternal] = useState<string | PeriodRange | null>(defaultValue ?? null);
    const current = value === undefined ? internal : value;
    const start = typeof current === 'string' ? current : (current?.start ?? null);
    const end = typeof current === 'string' ? null : (current?.end ?? null);
    const set = (next: string | PeriodRange | null) => {
        if (JSON.stringify(next) === JSON.stringify(current ?? null)) return;
        setInternal(next);
        onValueChange?.(next as T);
    };
    const allowed = (quarter: string) => (!min || quarter >= min) && (!max || quarter <= max);

    // Text of the field: "Q4 2026" or "Q1 2026 – Q3 2026"; typed text is read on Enter and when leaving the field
    const label = (quarter: string | null) => {
        const parsed = quarter ? parseQuarter(quarter) : null;
        return parsed ? translations.quarterPicker.quarter(parsed.quarter, parsed.year) : '';
    };
    const text = (range && start ? `${label(start)} – ${label(end)}` : label(start)).trim();
    const [draft, setDraft] = useState<string | null>(null);
    const commit = () => {
        if (draft === null) return;
        const typed = draft.trim();
        setDraft(null);
        if (!typed) return set(null);
        if (!range) {
            const quarter = normalize(parseQuarter(typed));
            if (quarter && allowed(quarter)) set(quarter);
            return;
        }
        const [first, second] = typed
            .split(/\s*[–—]\s*|\s+-\s+|\s+(?:bis|to)\s+/i)
            .map((part) => normalize(parseQuarter(part)));
        if (first && allowed(first) && (!second || allowed(second))) set(order(first, second ?? null));
    };

    // The quarters of one year as buttons; arrow keys move (also into the next or previous year)
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState(() => Number((start ?? quarterOf(todayIso())).slice(0, 4)));
    const [focusIndex, setFocusIndex] = useState(0);
    const [pending, setPending] = useState(false);
    const buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const focusAfterRender = useRef<number | null>(null);
    useEffect(() => {
        if (focusAfterRender.current === null) return;
        buttons.current[focusAfterRender.current]?.focus();
        focusAfterRender.current = null;
    });
    const monthRange = (quarter: number) => {
        const format = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
        const month = (index: number) => format.format(new Date(Date.UTC(2026, index, 1)));
        return `${month((quarter - 1) * 3)} – ${month(quarter * 3 - 1)}`;
    };
    const cellState = (quarter: number) => {
        const key = `${year}-Q${quarter}`;
        return {
            key,
            selected: key === start || key === end,
            inRange: !!(range && start && end && key > start && key < end),
            disabled: !allowed(key),
        };
    };
    const onOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) return;
        const shown = Number((start ?? quarterOf(todayIso())).slice(0, 4));
        setYear(shown);
        setFocusIndex(start && start.startsWith(`${shown}-`) ? Number(start.slice(-1)) - 1 : 0);
        setPending(false);
    };
    const choose = (quarter: number) => {
        const { key, disabled: unavailable } = cellState(quarter);
        if (unavailable) return;
        if (!range) {
            set(key);
            setOpen(false);
            return;
        }
        if (!pending || !start) {
            set({ start: key, end: null });
            setPending(true);
            return;
        }
        set(order(start, key));
        setPending(false);
        setOpen(false);
    };
    const move = (index: number) => {
        let next = index;
        if (next < 0) {
            setYear((shown) => shown - 1);
            next += 4;
        } else if (next > 3) {
            setYear((shown) => shown + 1);
            next -= 4;
        }
        setFocusIndex(next);
        focusAfterRender.current = next;
        buttons.current[next]?.focus();
    };
    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const steps: Record<string, number> = {
            ArrowLeft: rtl ? 1 : -1,
            ArrowRight: rtl ? -1 : 1,
            ArrowUp: -2,
            ArrowDown: 2,
            PageUp: -4,
            PageDown: 4,
        };
        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            return move(event.key === 'Home' ? 0 : 3);
        }
        const step = steps[event.key];
        if (step === undefined) return;
        event.preventDefault();
        move(index + step);
    };
    const presetItems = (presets ?? [])
        .map((preset) =>
            typeof preset === 'string'
                ? { label: translations.rangePresets[preset] ?? preset, range: periodPreset(preset, 'quarter') }
                : { label: preset.label, range: preset.value }
        )
        .filter((preset): preset is { label: string; range: PeriodRange } => !!preset.range?.start);

    return (
        <div className={styles.base({ class: className })} style={style}>
            <Popover.Root
                open={open}
                onOpenChange={(details) => onOpenChange(details.open)}
                positioning={{ placement: 'bottom-start', gutter: 4 }}
                initialFocusEl={() => buttons.current[focusIndex] ?? null}
                lazyMount
                unmountOnExit
            >
                <Popover.Anchor
                    className={styles.control()}
                    data-invalid={state.invalid || undefined}
                    data-disabled={state.disabled || undefined}
                >
                    <Field.Input
                        className={styles.textInput()}
                        value={draft ?? text}
                        placeholder={translations.quarterPicker.placeholder}
                        autoComplete="off"
                        aria-label={ariaLabel}
                        disabled={state.disabled || undefined}
                        readOnly={state.readOnly || undefined}
                        required={state.required || undefined}
                        aria-invalid={state.invalid || undefined}
                        onChange={(event) => setDraft(event.target.value)}
                        onBlur={commit}
                        onKeyDown={(event) => event.key === 'Enter' && commit()}
                    />
                    {name &&
                        (range ? (
                            <>
                                <input type="hidden" name={`${name}[0]`} value={start ?? ''} />
                                <input type="hidden" name={`${name}[1]`} value={end ?? ''} />
                            </>
                        ) : (
                            <input type="hidden" name={name} value={start ?? ''} />
                        ))}
                    {clearable && start && !state.disabled && !state.readOnly && (
                        <button
                            type="button"
                            className={styles.clear()}
                            aria-label={translations.quarterPicker.clearTrigger}
                            onClick={() => set(null)}
                        >
                            <X className={styles.clearIcon()} aria-hidden="true" />
                        </button>
                    )}
                    <Popover.Trigger
                        className={styles.trigger()}
                        aria-label={translations.quarterPicker.trigger}
                        disabled={state.disabled || state.readOnly}
                    >
                        <CalendarDays className={styles.triggerIcon()} aria-hidden="true" />
                    </Popover.Trigger>
                </Popover.Anchor>
                <Portal>
                    <Popover.Positioner>
                        <Popover.Content className={styles.content()} aria-label={translations.quarterPicker.content}>
                            <div className={styles.header()}>
                                <button
                                    type="button"
                                    className={styles.nav()}
                                    aria-label={translations.quarterPicker.prevYear}
                                    disabled={!!min && `${year - 1}-Q4` < min}
                                    onClick={() => setYear(year - 1)}
                                >
                                    <ChevronLeft className={styles.navIcon()} aria-hidden="true" />
                                </button>
                                <span id={`${id}y`} className={styles.yearLabel()} aria-live="polite">
                                    {year}
                                </span>
                                <button
                                    type="button"
                                    className={styles.nav()}
                                    aria-label={translations.quarterPicker.nextYear}
                                    disabled={!!max && `${year + 1}-Q1` > max}
                                    onClick={() => setYear(year + 1)}
                                >
                                    <ChevronRight className={styles.navIcon()} aria-hidden="true" />
                                </button>
                            </div>
                            <div role="group" aria-labelledby={`${id}y`} className={styles.quarterGrid()}>
                                {[1, 2, 3, 4].map((quarter, index) => {
                                    const cell = cellState(quarter);
                                    return (
                                        <button
                                            key={quarter}
                                            ref={(element) => {
                                                buttons.current[index] = element;
                                            }}
                                            type="button"
                                            className={styles.period()}
                                            tabIndex={index === focusIndex ? 0 : -1}
                                            aria-label={translations.quarterPicker.quarterButton(
                                                quarter,
                                                year,
                                                monthRange(quarter)
                                            )}
                                            aria-pressed={cell.selected}
                                            aria-disabled={cell.disabled || undefined}
                                            data-selected={cell.selected || undefined}
                                            data-in-range={cell.inRange || undefined}
                                            data-disabled={cell.disabled || undefined}
                                            onClick={() => choose(quarter)}
                                            onKeyDown={(event) => onKeyDown(event, index)}
                                            onFocus={() => setFocusIndex(index)}
                                        >
                                            Q{quarter}
                                        </button>
                                    );
                                })}
                            </div>
                            {presetItems.length > 0 && (
                                <div className={styles.presets()}>
                                    {presetItems.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            className={styles.preset()}
                                            onClick={() => {
                                                set(range ? preset.range : preset.range.start);
                                                setOpen(false);
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Popover.Content>
                    </Popover.Positioner>
                </Portal>
            </Popover.Root>
        </div>
    );
}
