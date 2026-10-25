import { DatePicker as ArkDatePicker, type DateValue } from '@ark-ui/react/date-picker';
import {
    datePicker as datePickerRecipe,
    localeWeekInfo,
    type DateLike,
    type DateValueType,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useId, useState, type CSSProperties } from 'react';
import { CalendarViews, type RenderDay } from '../DatePicker/DatePickerBase.js';
import { fromDateLike, toOutput, unavailableDates, wallKey } from '../DatePicker/dates.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface CalendarProps<T extends DateLike[] = string[]> {
    /** One day, several days, or a range (start and end) */
    selectionMode?: 'single' | 'multiple' | 'range';
    /** Chosen days as ISO dates; Date objects are accepted too */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    /** What onValueChange gets: ISO strings (default) or Date objects */
    valueType?: DateValueType;
    min?: DateLike;
    max?: DateLike;
    /** Days that cannot be chosen – receives the ISO date */
    isDateUnavailable?: (date: string) => boolean;
    /** Single days that cannot be chosen (holidays, booked days) */
    excludeDates?: readonly DateLike[];
    /** With selectionMode range: Ark presets ("last7Days" …) below the calendar */
    presets?: readonly string[];
    locale?: string;
    disabled?: boolean;
    /** "Today" and "Clear" below the calendar */
    showButtonBar?: boolean;
    /** Column with the ISO calendar weeks ("Wk") */
    showWeekNumbers?: boolean;
    /** Months side by side */
    numberOfMonths?: number;
    /** Today is bold and underlined */
    highlightToday?: boolean;
    /** Leaves the days of the previous and next month empty */
    hideOutsideDays?: boolean;
    /** First day of the week: 0 = Sunday … 6 = Saturday; default from the locale */
    firstDayOfWeek?: number;
    /** Weekend days (0 = Sunday … 6) marked with data-weekend; default from the locale */
    weekendDays?: readonly number[];
    /** With selectionMode single: choosing the selected day again clears it */
    allowDeselect?: boolean;
    /** IANA zone that decides which day is today */
    timeZone?: string;
    /** Content of a day instead of its number, e.g. a dot for appointments */
    renderDay?: RenderDay;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

/** Calendar on the page (no field, no popup): a grid with arrow keys, Page Up/Down, Home/End */
export function Calendar<T extends DateLike[] = string[]>({
    classes,
    selectionMode = 'single',
    value,
    defaultValue,
    onValueChange,
    valueType = 'string',
    min,
    max,
    isDateUnavailable,
    excludeDates,
    presets,
    locale: localeProp,
    disabled = false,
    showButtonBar,
    showWeekNumbers,
    numberOfMonths,
    highlightToday = true,
    hideOutsideDays,
    firstDayOfWeek,
    weekendDays,
    allowDeselect,
    timeZone,
    renderDay,
    className,
    style,
}: CalendarProps<T>) {
    const datePicker = useRecipe('datePicker', datePickerRecipe, classes);
    const styles = datePicker((numberOfMonths ?? 1) > 1 ? { multiMonth: true } : {});
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const translations = useTranslations();
    const [internal, setInternal] = useState<DateLike[]>(defaultValue ?? []);
    const current: DateLike[] = value ?? internal;
    const key = (dates: DateLike[]) => dates.map((date) => wallKey(date, false)).join();
    // Ark moves the keyboard focus to the day inside its popup content – the inline calendar has none, so the
    // root stands in for it (without this, arrow keys changed the focused day but not the focus)
    const rootId = `${useId()}calendar`;
    return (
        <ArkDatePicker.Root
            className={styles.inline({ class: className })}
            style={style}
            ids={{ root: rootId, content: rootId }}
            inline
            value={current.map((date) => fromDateLike(date, false)).filter((date): date is DateValue => !!date)}
            onValueChange={(details) => {
                const next = details.value.map((date) => toOutput(date, false, valueType)!);
                if (key(next) === key(current)) return;
                setInternal(next);
                onValueChange?.(next as T);
            }}
            selectionMode={selectionMode}
            min={fromDateLike(min, false)}
            max={fromDateLike(max, false)}
            isDateUnavailable={unavailableDates(isDateUnavailable, excludeDates)}
            locale={locale}
            startOfWeek={firstDayOfWeek ?? localeWeekInfo(locale).firstDay}
            numOfMonths={numberOfMonths}
            timeZone={timeZone}
            disabled={disabled}
            translations={translations.datePicker}
        >
            <CalendarViews
                presets={selectionMode === 'range' ? presets : undefined}
                showWeekNumbers={showWeekNumbers}
                numberOfMonths={numberOfMonths}
                showButtonBar={showButtonBar}
                plainToday={!highlightToday}
                hideOutsideDays={hideOutsideDays}
                weekendDays={weekendDays}
                allowDeselect={allowDeselect}
                timeZone={timeZone}
                renderDay={renderDay}
            />
        </ArkDatePicker.Root>
    );
}
