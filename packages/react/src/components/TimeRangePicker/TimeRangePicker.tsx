import { DateInput as ArkDateInput } from '@ark-ui/react/date-input';
import { useFieldContext } from '@ark-ui/react/field';
import { DateFormatter, type DateValue } from '@internationalized/date';
import { datePicker as datePickerRecipe, parseTimeText, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import { Fragment, useId, useMemo, useState, type CSSProperties } from 'react';
import { DateSegments } from '../DatePicker/DatePickerBase.js';
import { fromTime, toTime } from '../DatePicker/dates.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

/** Start and end time ("HH:mm"), null while not entered */
export interface TimeRange {
    start: string | null;
    end: string | null;
}

export interface TimeRangePickerProps {
    /** Start and end ("09:00" – "17:30") */
    value?: TimeRange | null;
    defaultValue?: TimeRange | null;
    onValueChange?: (value: TimeRange | null) => void;
    /** Earliest time ("HH:mm") */
    min?: string;
    /** Latest time ("HH:mm") */
    max?: string;
    /** Adds seconds ("HH:mm:ss") */
    withSeconds?: boolean;
    /** 12 or 24 hours; default from the locale */
    hourCycle?: 'h12' | 'h23';
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** Sent as name[0] and name[1] */
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component (see the datePicker recipe) */
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

/** Start and end time in one field ("09:00 – 17:30"): typing runs on from start to end */
export function TimeRangePicker({
    value,
    defaultValue = null,
    onValueChange,
    min,
    max,
    withSeconds = false,
    hourCycle,
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
}: TimeRangePickerProps) {
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
    const rangeNames = [translations.dateRange.start, translations.dateRange.end];
    // The field label names the times, followed by "Start"/"End"
    const ids = field ? { label: (index: number) => `${field.ids.label} ${id}r${index}` } : undefined;
    const groupLabel = (index: number) =>
        field ? undefined : [ariaLabel, rangeNames[index]].filter(Boolean).join(', ');
    const [internal, setInternal] = useState(defaultValue);
    const current = value === undefined ? internal : value;
    const times = [current?.start, current?.end].filter((time): time is string => !!time).map(fromTime);
    const set = (next: DateValue[]) => {
        const range = next.length ? { start: toTime(next[0], withSeconds), end: toTime(next[1], withSeconds) } : null;
        if (range?.start === current?.start && range?.end === current?.end) return;
        setInternal(range);
        onValueChange?.(range);
    };
    const formatter = useMemo(
        () =>
            new DateFormatter(locale, {
                hour: '2-digit',
                minute: '2-digit',
                ...(withSeconds ? { second: '2-digit' } : {}),
                ...(hourCycle ? { hourCycle } : {}),
            }),
        [locale, withSeconds, hourCycle]
    );
    // Pasting "09:00 – 17:30" fills both, a single time the part it lands in
    const pasteText = (text: string, index: number) => {
        const parts = text
            .split(/\s*[–—]\s*|\s+-\s+|\s+(?:bis|to)\s+/i)
            .map((part) => parseTimeText(part, withSeconds));
        if (parts.length === 2 && parts[0] && parts[1]) {
            set([fromTime(parts[0]), fromTime(parts[1])]);
            return true;
        }
        if (parts.length !== 1 || !parts[0]) return false;
        const next = [...times];
        next[index] = fromTime(parts[0]);
        set(next.filter(Boolean));
        return true;
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            <div
                className={styles.control()}
                data-invalid={state.invalid || undefined}
                data-disabled={state.disabled || undefined}
            >
                <ArkDateInput.Root
                    className={styles.dateInput()}
                    ids={ids}
                    value={times}
                    onValueChange={(details) => set(details.value)}
                    selectionMode="range"
                    granularity={withSeconds ? 'second' : 'minute'}
                    formatter={formatter}
                    placeholderValue={fromTime('00:00')}
                    min={min ? fromTime(min) : undefined}
                    max={max ? fromTime(max) : undefined}
                    {...state}
                    locale={locale}
                    shouldForceLeadingZeros
                    translations={translations.dateInput}
                >
                    <ArkDateInput.Control className={styles.dateControl()}>
                        {[0, 1].map((index) => (
                            <Fragment key={index}>
                                {index === 1 && (
                                    <span className={styles.rangeSeparator()} aria-hidden="true">
                                        –
                                    </span>
                                )}
                                {field && (
                                    <span id={`${id}r${index}`} className={styles.rangeLabel()}>
                                        {rangeNames[index]}
                                    </span>
                                )}
                                <DateSegments
                                    index={index}
                                    label={groupLabel(index)}
                                    describedby={field?.ariaDescribedby}
                                    paste={pasteText}
                                    size={size}
                                />
                            </Fragment>
                        ))}
                    </ArkDateInput.Control>
                </ArkDateInput.Root>
                {name && (
                    <>
                        <input type="hidden" name={`${name}[0]`} value={current?.start ?? ''} />
                        <input type="hidden" name={`${name}[1]`} value={current?.end ?? ''} />
                    </>
                )}
                {clearable && current?.start && !state.disabled && !state.readOnly && (
                    <button
                        type="button"
                        className={styles.clear()}
                        aria-label={translations.timePicker.clearRange}
                        onClick={() => set([])}
                    >
                        <X className={styles.clearIcon()} aria-hidden="true" />
                    </button>
                )}
            </div>
        </div>
    );
}
