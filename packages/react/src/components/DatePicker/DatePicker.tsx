import type { DateLike, DateValueType, datePicker, RecipeClasses } from '@wirecore/wirelayer-recipes';
import { type DateValue } from '@ark-ui/react/date-picker';
import { useState, type CSSProperties } from 'react';
import { DatePickerBase, type RenderDay } from './DatePickerBase.js';
import { fromDateLike, toOutput, unavailableDates, wallKey } from './dates.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useLabelForWarning } from '../../utils/label-for.js';

/** One date (ISO string or Date), several dates (selectionMode multiple) or nothing */
export type DatePickerValue = DateLike | DateLike[] | null;

export interface DatePickerProps<T extends DatePickerValue = string | null> {
    /**
     * ISO date, e.g. "2026-10-20", with time "2026-10-20T14:30". Date objects and ISO strings with offset are
     * accepted too; with selectionMode "multiple" a list of dates
     */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    /** One date or several dates (the field lists them, the calendar toggles days) */
    selectionMode?: 'single' | 'multiple';
    /** What onValueChange gets: ISO strings (default) or Date objects */
    valueType?: DateValueType;
    /** Adds hour and minute to the field */
    withTime?: boolean;
    /** Earliest selectable date (ISO or Date) */
    min?: DateLike;
    /** Latest selectable date (ISO or Date) */
    max?: DateLike;
    /** Dates that cannot be chosen, e.g. weekends – receives the ISO date */
    isDateUnavailable?: (date: string) => boolean;
    /** Single dates that cannot be chosen (holidays, booked days) */
    excludeDates?: readonly DateLike[];
    /** Order of the parts and the separators follow the locale (de-DE: TT.MM.JJJJ) */
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Text of the empty field, shown until it gets the focus – no replacement for a label */
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** "Today" and "Clear" below the calendar */
    showButtonBar?: boolean;
    /** Column with the ISO calendar weeks ("Wk") */
    showWeekNumbers?: boolean;
    /** Months side by side in the calendar */
    numberOfMonths?: number;
    /** Today is bold and underlined */
    highlightToday?: boolean;
    /** Leaves the days of the previous and next month empty */
    hideOutsideDays?: boolean;
    /** First day of the week: 0 = Sunday … 6 = Saturday; default from the locale */
    firstDayOfWeek?: number;
    /** Weekend days (0 = Sunday … 6) marked with data-weekend; default from the locale */
    weekendDays?: readonly number[];
    /** Choosing the selected day again clears the field */
    allowDeselect?: boolean;
    /** IANA zone ("Europe/Berlin") of a date with time: shown and typed in the zone, the value gets its offset */
    timeZone?: string;
    /** Short zone name after the time ("CEST") */
    showTimeZone?: boolean;
    /** On narrow screens the calendar opens as a sheet at the bottom */
    responsive?: boolean;
    /** Content of a day in the calendar instead of its number, e.g. a dot for appointments */
    renderDay?: RenderDay;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    /** Id of the field – the (first) date gets it; a `<label for>` cannot name it, use a Field or aria-label */
    id?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the date field, e.g. { control: "…" } (the calendar: RecipesProvider) */
    classes?: RecipeClasses<typeof datePicker>;
}

/** Date field: type the digits one after another (the separators come from the locale) or pick from the calendar; optionally with time */
export function DatePicker<T extends DatePickerValue = string | null>({
    value,
    defaultValue,
    onValueChange,
    selectionMode = 'single',
    valueType = 'string',
    withTime = false,
    min,
    max,
    isDateUnavailable,
    excludeDates,
    locale: localeProp,
    'aria-label': ariaLabel,
    id,
    clearable = true,
    highlightToday = true,
    ...rest
}: DatePickerProps<T>) {
    useLabelForWarning('DatePicker', id);
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    // Field and calendar are two Ark parts with one value
    const [internal, setInternal] = useState<DatePickerValue>(defaultValue ?? null);
    const current = value === undefined ? internal : value;
    const list = Array.isArray(current) ? current : current ? [current] : [];
    const timeZone = rest.timeZone;
    const keyOf = (values: DateLike[]) => values.map((date) => wallKey(date, withTime, timeZone)).join();
    const set = (next: DateValue[]) => {
        const values = next.map((date) => toOutput(date, withTime, valueType, timeZone)!);
        if (keyOf(values) === keyOf(list)) return;
        const result = selectionMode === 'multiple' ? values : (values[0] ?? null);
        setInternal(result);
        onValueChange?.(result as T);
    };
    return (
        <DatePickerBase
            {...rest}
            mode={selectionMode}
            dates={list
                .map((date) => fromDateLike(date, withTime, timeZone))
                .filter((date): date is DateValue => !!date)}
            onChange={set}
            withTime={withTime}
            min={fromDateLike(min, withTime, timeZone, 'min')}
            max={fromDateLike(max, withTime, timeZone, 'max')}
            isDateUnavailable={unavailableDates(isDateUnavailable, excludeDates)}
            locale={locale}
            label={ariaLabel}
            ownId={id}
            hideClear={!clearable}
            plainToday={!highlightToday}
        />
    );
}
