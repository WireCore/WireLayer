<script setup lang="ts" generic="T extends DateRangeLike = DateRange">
import {
    presetDateRange,
    type CalendarDayState,
    type DateLike,
    type DateValueType,
    type datePicker,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { type DateValue } from '@ark-ui/vue/date-picker';
import { computed, ref, useAttrs } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useLabelForWarning } from '../../utils/label-for.js';
import DatePickerBase from '../DatePicker/DatePickerBase.vue';
import type { CalendarPreset } from '../DatePicker/DatePickerViews.vue';
import { fromDateLike, fromIso, toOutput, unavailableDates, wallKey } from '../DatePicker/dates.js';
import { useLocale, useTranslations } from '../../locale.js';
import type { DateRange, DateRangeLike } from './types.js';

export interface DateRangePickerProps<T extends DateRangeLike = DateRange> {
    /** Start and end – use with v-model; Date objects and ISO strings with offset are accepted too */
    modelValue?: T | null;
    defaultValue?: T | null;
    /** What v-model gets: ISO strings (default) or Date objects */
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
    /** Extra classes per part of the date field, e.g. { control: "…" } (the calendar: RecipesProvider) */
    /** Id of the field – the (first) date gets it; a `<label for>` cannot name it, use a Field or aria-label */
    id?: string;
    classes?: RecipeClasses<typeof datePicker>;
}

defineOptions({ inheritAttrs: false });
const localeContext = useLocale();
const translations = useTranslations();
const props = withDefaults(defineProps<DateRangePickerProps<T>>(), {
    modelValue: undefined,
    defaultValue: undefined,
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
    /** Content of a day in the calendar instead of its number */
    day?(props: { date: string } & CalendarDayState): unknown;
}>();
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const emit = defineEmits<{ 'update:modelValue': [value: T | null] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const ariaLabel = computed(() => split.value.rest['aria-label'] as string | undefined);
useLabelForWarning('DateRangePicker', () => props.id);

const internal = ref<DateRangeLike | null>(props.defaultValue ?? null);
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
const toDates = (range: DateRangeLike | null | undefined) =>
    [range?.start, range?.end]
        .map((value) => fromDateLike(value, props.withTime, props.timeZone))
        .filter((date): date is DateValue => !!date);
const dates = computed(() => toDates(current.value));
const key = (value: DateLike | null | undefined) => wallKey(value, props.withTime, props.timeZone);
function set(next: DateValue[]) {
    const value = next.length
        ? {
              start: toOutput(next[0], props.withTime, props.valueType, props.timeZone),
              end: toOutput(next[1], props.withTime, props.valueType, props.timeZone),
          }
        : null;
    if (key(value?.start) === key(current.value?.start) && key(value?.end) === key(current.value?.end)) return;
    internal.value = value;
    emit('update:modelValue', value as T | null);
}
const bounds = computed(() => ({
    min: fromDateLike(props.min, props.withTime, props.timeZone, 'min'),
    max: fromDateLike(props.max, props.withTime, props.timeZone, 'max'),
}));
// Ark knows the day presets; months, quarters and years beyond them become own ranges
const calendarPresets = computed<CalendarPreset[] | undefined>(() =>
    props.presets?.map((preset) => {
        if (typeof preset !== 'string') return { label: preset.label, value: toDates(preset.value) };
        const range = presetDateRange(preset);
        if (!range) return preset;
        return {
            label: translations.rangePresets[preset] ?? preset,
            value: [fromIso(range.start, props.withTime), fromIso(range.end, props.withTime, 'max')],
        };
    })
);
const unavailable = computed(() => unavailableDates(props.isDateUnavailable, props.excludeDates));
</script>

<template>
    <!-- Start and end in one field ("10/20/2026 – 10/24/2026"); the calendar picks start, then end -->
    <DatePickerBase
        mode="range"
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
        :presets="calendarPresets"
        :label="ariaLabel"
        :own-id="id"
        :placeholder="placeholder"
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
        :time-zone="timeZone"
        :show-time-zone="showTimeZone"
        :responsive="responsive"
        @change="set"
    >
        <template v-if="$slots.day" #day="state"><slot name="day" v-bind="state" /></template>
    </DatePickerBase>
</template>
