<script setup lang="ts" generic="T extends string | Date | (string | Date)[] | null = string | null">
import type { CalendarDayState, DateLike, DateValueType, datePicker, RecipeClasses } from '@wirecore/wirelayer-recipes';
import { type DateValue } from '@ark-ui/vue/date-picker';
import { computed, ref, useAttrs } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import DatePickerBase from './DatePickerBase.vue';
import { fromDateLike, toOutput, unavailableDates, wallKey } from './dates.js';
import { useLocale } from '../../locale.js';

/** One date (ISO string or Date), several dates (selectionMode multiple) or nothing */
export type DatePickerValue = DateLike | DateLike[] | null;

export interface DatePickerProps<T extends DatePickerValue = string | null> {
    /**
     * ISO date, e.g. "2026-10-20", with time "2026-10-20T14:30" – use with v-model. Date objects and ISO strings with
     * offset are accepted too; with selectionMode "multiple" a list of dates
     */
    modelValue?: T;
    defaultValue?: T;
    /** One date or several dates (the field lists them, the calendar toggles days) */
    selectionMode?: 'single' | 'multiple';
    /** What v-model gets: ISO strings (default) or Date objects */
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
    /** Extra classes per part of the date field, e.g. { control: "…" } (the calendar: RecipesProvider) */
    classes?: RecipeClasses<typeof datePicker>;
}

defineOptions({ inheritAttrs: false });
const localeContext = useLocale();
const props = withDefaults(defineProps<DatePickerProps<T>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    selectionMode: 'single',
    valueType: 'string',
    withTime: false,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
    clearable: true,
    highlightToday: true,
});
defineSlots<{
    /** Content of a day in the calendar instead of its number, e.g. a dot for appointments */
    day?(props: { date: string } & CalendarDayState): unknown;
}>();
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const ariaLabel = computed(() => split.value.rest['aria-label'] as string | undefined);

// Field and calendar are two Ark parts with one value
const internal = ref<DatePickerValue>(props.defaultValue ?? null);
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
const list = computed(() => (Array.isArray(current.value) ? current.value : current.value ? [current.value] : []));
const dates = computed(() =>
    list.value
        .map((value) => fromDateLike(value, props.withTime, props.timeZone))
        .filter((date): date is DateValue => !!date)
);
const keyOf = (values: DateLike[]) => values.map((value) => wallKey(value, props.withTime, props.timeZone)).join();
function set(next: DateValue[]) {
    const values = next.map((date) => toOutput(date, props.withTime, props.valueType, props.timeZone)!);
    if (keyOf(values) === keyOf(list.value)) return;
    const value = props.selectionMode === 'multiple' ? values : (values[0] ?? null);
    internal.value = value;
    emit('update:modelValue', value as T);
}
const bounds = computed(() => ({
    min: fromDateLike(props.min, props.withTime, props.timeZone, 'min'),
    max: fromDateLike(props.max, props.withTime, props.timeZone, 'max'),
}));
const unavailable = computed(() => unavailableDates(props.isDateUnavailable, props.excludeDates));
</script>

<template>
    <DatePickerBase
        :mode="selectionMode"
        :dates="dates"
        :with-time="withTime"
        v-bind="bounds"
        :is-date-unavailable="unavailable"
        :locale="currentLocale"
        :disabled="disabled"
        :read-only="readOnly"
        :invalid="invalid"
        :required="required"
        :name="name"
        :label="ariaLabel"
        :classes="classes"
        :class-name="split.className"
        :style="split.style"
        :size="size"
        :hide-clear="!clearable"
        :show-button-bar="showButtonBar"
        :show-week-numbers="showWeekNumbers"
        :number-of-months="numberOfMonths"
        :plain-today="!highlightToday"
        :hide-outside-days="hideOutsideDays"
        :first-day-of-week="firstDayOfWeek"
        :weekend-days="weekendDays"
        :allow-deselect="allowDeselect"
        :time-zone="timeZone"
        :show-time-zone="showTimeZone"
        :responsive="responsive"
        @change="set"
    >
        <template v-if="$slots.day" #day="state"><slot name="day" v-bind="state" /></template>
    </DatePickerBase>
</template>
