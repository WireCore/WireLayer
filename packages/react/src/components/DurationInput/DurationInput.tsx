import { useFieldContext } from '@ark-ui/react/field';
import {
    datePicker as datePickerRecipe,
    durationToParts,
    durationUnit,
    formatDuration,
    partsToDuration,
    type DurationValueType,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import { Fragment, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useLabelForWarning } from '../../utils/label-for.js';

export interface DurationInputProps {
    /** Total minutes (default), total seconds or ISO 8601 ("PT2H30M") – see valueType */
    value?: number | string | null;
    defaultValue?: number | string | null;
    onValueChange?: (value: number | string | null) => void;
    /** What onValueChange gets: total minutes, total seconds or an ISO 8601 duration */
    valueType?: DurationValueType;
    /** Adds days before the hours (the hours then stop at 23) */
    withDays?: boolean;
    /** Adds seconds after the minutes */
    withSeconds?: boolean;
    /** Highest number of hours (default 999, with days 23) */
    maxHours?: number;
    /** Unit names and the spoken duration follow the locale */
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    /** Id of the field (the group of parts); a `<label for>` cannot name it, use a Field or aria-label */
    id?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the field (see the datePicker recipe) */
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

type Unit = 'days' | 'hours' | 'minutes' | 'seconds';
type Parts = Record<Unit, number | null>;
const empty: Parts = { days: null, hours: null, minutes: null, seconds: null };
const intlUnit = { days: 'day', hours: 'hour', minutes: 'minute', seconds: 'second' } as const;

/**
 * Duration field: hours and minutes (optional days and seconds) as spin buttons – type the digits ("2:30" → 2 h
 * 30 min; a full part moves on by itself), arrow keys change a part. Hours go past 24 unless days are shown.
 * Screen readers hear the whole duration ("2 hours 30 minutes").
 */
export function DurationInput({
    value,
    defaultValue = null,
    onValueChange,
    valueType = 'minutes',
    withDays = false,
    withSeconds = false,
    maxHours,
    locale: localeProp,
    disabled,
    readOnly,
    invalid,
    required,
    name,
    size,
    clearable = true,
    'aria-label': ariaLabel,
    id,
    className,
    style,
    classes,
}: DurationInputProps) {
    useLabelForWarning('DurationInput', id);
    const datePicker = useRecipe('datePicker', datePickerRecipe, classes);
    const styles = datePicker({ size });
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const translations = useTranslations();
    const uid = useId();
    const field = useFieldContext();
    const state = {
        disabled: disabled ?? field?.disabled,
        readOnly: readOnly ?? field?.readOnly,
        invalid: invalid ?? field?.invalid,
        required: required ?? field?.required,
    };
    const units: Unit[] = [
        ...(withDays ? (['days'] as const) : []),
        'hours',
        'minutes',
        ...(withSeconds ? (['seconds'] as const) : []),
    ];
    const max = (unit: Unit) => (unit === 'days' ? 999 : unit === 'hours' ? (maxHours ?? (withDays ? 23 : 999)) : 59);

    // The parts as typed – null is an empty part (placeholder); the value follows from them
    const [internal, setInternal] = useState(defaultValue);
    const current = value === undefined ? internal : value;
    const toParts = (next: number | string | null | undefined): Parts => {
        const parts = durationToParts(next, valueType, withDays);
        return parts ? { ...parts } : empty;
    };
    const [parts, setParts] = useState<Parts>(() => toParts(current));
    const filled = (next: Parts) => units.some((unit) => next[unit] !== null);
    const complete = (next: Parts) => ({
        days: next.days ?? 0,
        hours: next.hours ?? 0,
        minutes: next.minutes ?? 0,
        seconds: next.seconds ?? 0,
    });
    const valueOf = (next: Parts) => (filled(next) ? partsToDuration(complete(next), valueType) : null);
    // A new value from outside replaces the parts (not while they already give that value)
    const [seen, setSeen] = useState(current);
    if (current !== seen) {
        setSeen(current);
        if (current !== valueOf(parts)) setParts(toParts(current));
    }
    const update = (unit: Unit, next: number | null) => {
        const nextParts = { ...parts, [unit]: next === null ? null : Math.min(max(unit), Math.max(0, next)) };
        setParts(nextParts);
        const nextValue = valueOf(nextParts);
        if (nextValue === current) return;
        setSeen(nextValue);
        setInternal(nextValue);
        onValueChange?.(nextValue);
    };
    const segments = useRef<(HTMLSpanElement | null)[]>([]);
    const clear = () => {
        setParts(empty);
        setInternal(null);
        setSeen(null);
        if (current !== null) onValueChange?.(null);
        segments.current[0]?.focus();
    };

    const isFilled = filled(parts);
    const spoken = isFilled ? formatDuration(complete(parts), locale) : '';
    const text = (unit: Unit) => {
        const part = parts[unit];
        if (part === null) return translations.dateInput.placeholder()[intlUnit[unit]];
        return unit === 'minutes' || unit === 'seconds' ? String(part).padStart(2, '0') : String(part);
    };
    const unitText = (unit: Unit) => durationUnit(parts[unit] ?? 2, intlUnit[unit], locale, 'short');
    const valueText = (unit: Unit) =>
        parts[unit] === null
            ? undefined
            : `${parts[unit]} ${durationUnit(parts[unit]!, intlUnit[unit], locale, 'long')}`;

    // Keyboard like the date field: digits fill a part and move on, arrows change it, Backspace empties it
    const typed = useRef('');
    const interactive = !state.disabled && !state.readOnly;
    const focusAt = (index: number) => {
        typed.current = '';
        segments.current[Math.max(0, Math.min(units.length - 1, index))]?.focus();
    };
    const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>, unit: Unit, index: number) => {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const part = parts[unit];
        const step = ({ ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 } as Record<string, number>)[event.key];
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            return focusAt(index + ((event.key === 'ArrowRight') !== rtl ? 1 : -1));
        }
        if (!interactive) return;
        if (step !== undefined) {
            event.preventDefault();
            typed.current = '';
            const limit = max(unit) + 1;
            // Minutes and seconds wrap around, hours and days stop at their ends
            const next = (part ?? (step > 0 ? -1 : 0)) + step;
            return update(unit, unit === 'minutes' || unit === 'seconds' ? ((next % limit) + limit) % limit : next);
        }
        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            typed.current = '';
            return update(unit, event.key === 'Home' ? 0 : max(unit));
        }
        if (event.key === 'Backspace' || event.key === 'Delete') {
            event.preventDefault();
            typed.current = typed.current.slice(0, -1);
            return update(unit, typed.current ? Number(typed.current) : null);
        }
        // ":" or a space moves on, like the separators in the date field
        if ([':', '.', ',', ' '].includes(event.key)) {
            event.preventDefault();
            return focusAt(index + 1);
        }
        if (/^\d$/.test(event.key)) {
            event.preventDefault();
            typed.current =
                Number(`${typed.current}${event.key}`) > max(unit) ? event.key : `${typed.current}${event.key}`;
            update(unit, Number(typed.current));
            // Full when no further digit fits
            if (Number(typed.current) * 10 > max(unit)) focusAt(index + 1);
        }
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            <div
                className={styles.control()}
                data-invalid={state.invalid || undefined}
                data-disabled={state.disabled || undefined}
            >
                <div className={styles.dateInput()}>
                    <div
                        id={id}
                        role="group"
                        className={styles.segments()}
                        aria-labelledby={field ? field.ids.label : undefined}
                        aria-label={field ? undefined : ariaLabel}
                        aria-describedby={
                            [field?.ariaDescribedby, isFilled ? `${uid}t` : undefined].filter(Boolean).join(' ') ||
                            undefined
                        }
                        aria-invalid={state.invalid || undefined}
                        aria-required={state.required || undefined}
                    >
                        {units.map((unit, index) => (
                            <Fragment key={unit}>
                                <span
                                    ref={(element) => {
                                        segments.current[index] = element;
                                    }}
                                    role="spinbutton"
                                    tabIndex={state.disabled ? -1 : 0}
                                    className={styles.segment()}
                                    aria-label={translations.durationInput[unit]}
                                    aria-valuemin={0}
                                    aria-valuemax={max(unit)}
                                    aria-valuenow={parts[unit] ?? undefined}
                                    aria-valuetext={valueText(unit)}
                                    aria-disabled={state.disabled || undefined}
                                    aria-readonly={state.readOnly || undefined}
                                    data-placeholder-shown={parts[unit] === null ? '' : undefined}
                                    onKeyDown={(event) => onKeyDown(event, unit, index)}
                                    onFocus={() => (typed.current = '')}
                                >
                                    {text(unit)}
                                </span>
                                <span className={styles.unit()} aria-hidden="true">
                                    {unitText(unit)}
                                </span>
                            </Fragment>
                        ))}
                    </div>
                    {isFilled && (
                        <span id={`${uid}t`} hidden>
                            {spoken}
                        </span>
                    )}
                </div>
                {name && <input type="hidden" name={name} value={current ?? ''} />}
                {clearable && isFilled && interactive && (
                    <button
                        type="button"
                        className={styles.clear()}
                        aria-label={translations.durationInput.clearTrigger}
                        onClick={clear}
                    >
                        <X className={styles.clearIcon()} aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
}
