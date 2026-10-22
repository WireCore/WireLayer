import {
    periodPreset,
    type datePicker,
    type PeriodPreset,
    type PeriodRange,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { parseDate, type DateValue } from '@internationalized/date';
import { useState, type CSSProperties } from 'react';
import { DatePickerBase, type CalendarPreset } from '../DatePicker/DatePickerBase.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';

export interface YearPickerProps<T extends string | PeriodRange | null = string | null> {
    /** Year as "2026"; with range { start, end } */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    /** Start and end year instead of one */
    range?: boolean;
    /** Earliest year ("2020") */
    min?: string;
    /** Latest year ("2030") */
    max?: string;
    /** Buttons below the grid: "thisYear", "lastYear", "last3Years", "last5Years" or own { label, value } */
    presets?: (PeriodPreset | { label: string; value: PeriodRange })[];
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** With range sent as name[0] and name[1] */
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the date field, e.g. { control: "…" } (the calendar: RecipesProvider) */
    classes?: RecipeClasses<typeof datePicker>;
}

// The value is the first day of the year; the field and calendar show the year only
const toYear = (value: DateValue | undefined) => (value ? String(value.year) : null);
const fromYear = (year: string) => parseDate(`${year.padStart(4, '0')}-01-01`);

/** Year field ("2026"): type the digits, or pick from the year grid; range: start – end */
export function YearPicker<T extends string | PeriodRange | null = string | null>({
    value,
    defaultValue,
    onValueChange,
    range = false,
    min,
    max,
    presets,
    locale: localeProp,
    clearable = true,
    'aria-label': ariaLabel,
    ...rest
}: YearPickerProps<T>) {
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const translations = useTranslations();
    const [internal, setInternal] = useState<string | PeriodRange | null>(defaultValue ?? null);
    const current = value === undefined ? internal : value;
    const toDates = (period: string | PeriodRange | null | undefined) =>
        (typeof period === 'string' ? [period] : [period?.start, period?.end])
            .filter((part): part is string => !!part)
            .map(fromYear);
    const calendarPresets = presets
        ?.map((preset) =>
            typeof preset === 'string'
                ? { label: translations.rangePresets[preset] ?? preset, range: periodPreset(preset, 'year') }
                : { label: preset.label, range: preset.value }
        )
        .filter((preset) => preset.range?.start)
        .map((preset): CalendarPreset => ({
            label: preset.label,
            value: toDates(range ? preset.range : preset.range!.start),
        }));
    return (
        <DatePickerBase
            {...rest}
            mode={range ? 'range' : 'single'}
            period="year"
            dates={toDates(current)}
            onChange={(next) => {
                const result = range
                    ? next.length
                        ? { start: toYear(next[0]), end: toYear(next[1]) }
                        : null
                    : toYear(next[0]);
                if (JSON.stringify(result) === JSON.stringify(current ?? null)) return;
                setInternal(result);
                onValueChange?.(result as T);
            }}
            withTime={false}
            min={min ? fromYear(min) : undefined}
            max={max ? fromYear(max).set({ month: 12, day: 31 }) : undefined}
            locale={locale}
            presets={calendarPresets}
            label={ariaLabel}
            hideClear={!clearable}
        />
    );
}
