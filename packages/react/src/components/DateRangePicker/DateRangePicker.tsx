import {
    presetDateRange,
    type DateLike,
    type DateValueType,
    type datePicker,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { type DateValue } from '@ark-ui/react/date-picker';
import { useState, type CSSProperties } from 'react';
import { DatePickerBase, type CalendarPreset, type RenderDay } from '../DatePicker/DatePickerBase.js';
import { fromDateLike, fromIso, toOutput, unavailableDates, wallKey } from '../DatePicker/dates.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useLabelForWarning } from '../../utils/label-for.js';

export interface DateRange {
    /** ISO date (with time "2026-10-20T14:30"), null while not entered; a Date with valueType "date" */
    start: string | null;
    end: string | null;
}

/** A range as ISO strings or Date objects (valueType "date") */
export interface DateRangeLike {
    start: DateLike | null;
    end: DateLike | null;
}

export interface DateRangePickerProps<T extends DateRangeLike = DateRange> {
    /** Start and end; Date objects and ISO strings with offset are accepted too */
    value?: T | null;
    defaultValue?: T | null;
    onValueChange?: (value: T | null) => void;
    /** What onValueChange gets: ISO strings (default) or Date objects */
    valueType?: DateValueType;
    /** Adds hour and minute to both dates */
    withTime?: boolean;
    /** Earliest selectable date (ISO or Date) */
    min?: DateLike;
    /** Latest selectable date (ISO or Date) */
    max?: DateLike;
    /** Dates that cannot be chosen, e.g. weekends – receives the ISO date */
    isDateUnavailable?: (date: string) => boolean;
    /** Single dates that cannot be chosen (holidays, booked days) */
    excludeDates?: readonly DateLike[];
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** Sent as name[0] and name[1] */
    name?: string;
    /** Text of the empty field, shown until it gets the focus – no replacement for a label */
    placeholder?: string;
    /**
     * Buttons below the calendar: presets ("last7Days", "thisMonth", "thisQuarter", "last3Months", "last12Months",
     * "last3Years" …) or own { label, value } ranges
     */
    presets?: (string | { label: string; value: DateRangeLike })[];
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** "Today" and "Clear" below the calendar */
    showButtonBar?: boolean;
    /** Column with the ISO calendar weeks ("Wk") */
    showWeekNumbers?: boolean;
    /** Months side by side in the calendar – e.g. 2 for a range across a month end */
    numberOfMonths?: number;
    /** Today is bold and underlined */
    highlightToday?: boolean;
    /** Leaves the days of the previous and next month empty */
    hideOutsideDays?: boolean;
    /** First day of the week: 0 = Sunday … 6 = Saturday; default from the locale */
    firstDayOfWeek?: number;
    /** Weekend days (0 = Sunday … 6) marked with data-weekend; default from the locale */
    weekendDays?: readonly number[];
    /** IANA zone ("Europe/Berlin") with withTime: shown and typed in the zone, the values get its offset */
    timeZone?: string;
    /** Short zone name after the times ("CEST") */
    showTimeZone?: boolean;
    /** On narrow screens the calendar opens as a sheet at the bottom */
    responsive?: boolean;
    /** Content of a day in the calendar instead of its number */
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

/** Start and end in one field ("10/20/2026 – 10/24/2026"); the calendar picks start, then end */
export function DateRangePicker<T extends DateRangeLike = DateRange>({
    value,
    defaultValue,
    onValueChange,
    valueType = 'string',
    withTime = false,
    min,
    max,
    isDateUnavailable,
    excludeDates,
    locale: localeProp,
    presets,
    'aria-label': ariaLabel,
    id,
    clearable = true,
    highlightToday = true,
    ...rest
}: DateRangePickerProps<T>) {
    useLabelForWarning('DateRangePicker', id);
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const translations = useTranslations();
    const timeZone = rest.timeZone;
    const [internal, setInternal] = useState<DateRangeLike | null>(defaultValue ?? null);
    const current = value === undefined ? internal : value;
    const toDates = (range: DateRangeLike | null | undefined) =>
        [range?.start, range?.end]
            .map((date) => fromDateLike(date, withTime, timeZone))
            .filter((date): date is DateValue => !!date);
    const key = (date: DateLike | null | undefined) => wallKey(date, withTime, timeZone);
    const set = (next: DateValue[]) => {
        const range = next.length
            ? {
                  start: toOutput(next[0], withTime, valueType, timeZone),
                  end: toOutput(next[1], withTime, valueType, timeZone),
              }
            : null;
        if (key(range?.start) === key(current?.start) && key(range?.end) === key(current?.end)) return;
        setInternal(range);
        onValueChange?.(range as T | null);
    };
    // Ark knows the day presets; months, quarters and years beyond them become own ranges
    const calendarPresets = presets?.map((preset): CalendarPreset => {
        if (typeof preset !== 'string') return { label: preset.label, value: toDates(preset.value) };
        const range = presetDateRange(preset);
        if (!range) return preset;
        return {
            label: translations.rangePresets[preset] ?? preset,
            value: [fromIso(range.start, withTime), fromIso(range.end, withTime, 'max')],
        };
    });
    return (
        <DatePickerBase
            {...rest}
            mode="range"
            dates={toDates(current)}
            onChange={set}
            withTime={withTime}
            min={fromDateLike(min, withTime, timeZone, 'min')}
            max={fromDateLike(max, withTime, timeZone, 'max')}
            isDateUnavailable={unavailableDates(isDateUnavailable, excludeDates)}
            locale={locale}
            presets={calendarPresets}
            label={ariaLabel}
            ownId={id}
            hideClear={!clearable}
            plainToday={!highlightToday}
        />
    );
}
