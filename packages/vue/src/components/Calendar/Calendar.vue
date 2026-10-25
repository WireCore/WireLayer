<script setup lang="ts" generic="T extends (string | Date)[] = string[]">
import { DatePicker, type DateValue } from '@ark-ui/vue/date-picker';
import {
    datePicker as datePickerRecipe,
    localeWeekInfo,
    type CalendarDayState,
    type DateLike,
    type DateValueType,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId } from 'vue';
import DatePickerViews from '../DatePicker/DatePickerViews.vue';
import { fromDateLike, toOutput, unavailableDates, wallKey } from '../DatePicker/dates.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface CalendarProps<T extends DateLike[] = string[]> {
    /** One day, several days, or a range (start and end) */
    selectionMode?: 'single' | 'multiple' | 'range';
    /** Chosen days as ISO dates – use with v-model; Date objects are accepted too */
    modelValue?: T;
    defaultValue?: T;
    /** What v-model gets: ISO strings (default) or Date objects */
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
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

defineOptions({ inheritAttrs: false });
const localeContext = useLocale();
const translations = useTranslations();
const props = withDefaults(defineProps<CalendarProps<T>>(), {
    selectionMode: 'single',
    modelValue: undefined,
    defaultValue: undefined,
    valueType: 'string',
    min: undefined,
    max: undefined,
    isDateUnavailable: undefined,
    presets: undefined,
    disabled: false,
    highlightToday: true,
});
defineSlots<{
    /** Content of a day instead of its number, e.g. a dot for appointments */
    day?(props: { date: string } & CalendarDayState): unknown;
}>();
const datePicker = useRecipe('datePicker', datePickerRecipe, () => props.classes);
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
const attrs = useAttrs();
const multiMonth = computed(() => (props.numberOfMonths ?? 1) > 1);
const styles = computed(() => datePicker(multiMonth.value ? { multiMonth: true } : {}));
const internal = ref<DateLike[]>(props.defaultValue ?? []);
const current = computed<DateLike[]>(() => props.modelValue ?? internal.value);
const dates = computed(() =>
    current.value.map((value) => fromDateLike(value, false)).filter((date): date is DateValue => !!date)
);
function set(next: DateValue[]) {
    const value = next.map((date) => toOutput(date, false, props.valueType)!);
    if (value.map((date) => wallKey(date, false)).join() === current.value.map((date) => wallKey(date, false)).join()) {
        return;
    }
    internal.value = value;
    emit('update:modelValue', value as T);
}
const unavailable = computed(() => unavailableDates(props.isDateUnavailable, props.excludeDates));
// Ark moves the keyboard focus to the day inside its popup content – the inline calendar has none, so the root
// stands in for it (without this, arrow keys changed the focused day but not the focus)
const rootId = `${useId()}calendar`;
const ids = { root: rootId, content: rootId };
const startOfWeek = computed(() => props.firstDayOfWeek ?? localeWeekInfo(currentLocale.value).firstDay);
</script>

<template>
    <!-- Calendar on the page (no field, no popup): a grid with arrow keys, Page Up/Down, Home/End -->
    <DatePicker.Root
        :class="styles.inline({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :ids="ids"
        inline
        :model-value="dates"
        :selection-mode="selectionMode"
        :min="fromDateLike(min, false)"
        :max="fromDateLike(max, false)"
        :is-date-unavailable="unavailable"
        :locale="currentLocale"
        :start-of-week="startOfWeek"
        :num-of-months="numberOfMonths"
        :time-zone="timeZone"
        :disabled="disabled"
        :translations="translations.datePicker"
        @value-change="set($event.value)"
    >
        <DatePickerViews
            :presets="selectionMode === 'range' ? presets : undefined"
            :show-week-numbers="showWeekNumbers"
            :number-of-months="numberOfMonths"
            :show-button-bar="showButtonBar"
            :plain-today="!highlightToday"
            :hide-outside-days="hideOutsideDays"
            :weekend-days="weekendDays"
            :allow-deselect="allowDeselect"
            :time-zone="timeZone"
        >
            <template v-if="$slots.day" #day="state"><slot name="day" v-bind="state" /></template>
        </DatePickerViews>
    </DatePicker.Root>
</template>
