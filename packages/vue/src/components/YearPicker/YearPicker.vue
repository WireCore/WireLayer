<script setup lang="ts" generic="T extends string | PeriodRange | null = string | null">
import {
    periodPreset,
    type datePicker,
    type PeriodPreset,
    type PeriodRange,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { parseDate, type DateValue } from '@internationalized/date';
import { computed, ref, useAttrs } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useLabelForWarning } from '../../utils/label-for.js';
import DatePickerBase from '../DatePicker/DatePickerBase.vue';
import type { CalendarPreset } from '../DatePicker/DatePickerViews.vue';
import { useLocale, useTranslations } from '../../locale.js';

export interface YearPickerProps<T extends string | PeriodRange | null = string | null> {
    /** Year as "2026" – use with v-model; with range { start, end } */
    modelValue?: T;
    defaultValue?: T;
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
    /** Text of the empty field, shown until it gets the focus – no replacement for a label */
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** Extra classes per part of the date field, e.g. { control: "…" } (the calendar: RecipesProvider) */
    /** Id of the field – the (first) date gets it; a `<label for>` cannot name it, use a Field or aria-label */
    id?: string;
    classes?: RecipeClasses<typeof datePicker>;
}

defineOptions({ inheritAttrs: false });
const localeContext = useLocale();
const translations = useTranslations();
const props = withDefaults(defineProps<YearPickerProps<T>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
    clearable: true,
});
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const ariaLabel = computed(() => split.value.rest['aria-label'] as string | undefined);
useLabelForWarning('YearPicker', () => props.id);

// The value is the first day of the year; the field and calendar show the year only
const toYear = (value: DateValue | undefined) => (value ? String(value.year) : null);
const fromYear = (year: string) => parseDate(`${year.padStart(4, '0')}-01-01`);
const internal = ref<string | PeriodRange | null>(props.defaultValue ?? null);
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
const toDates = (value: string | PeriodRange | null | undefined) =>
    (typeof value === 'string' ? [value] : [value?.start, value?.end])
        .filter((part): part is string => !!part)
        .map(fromYear);
const dates = computed(() => toDates(current.value));
function set(next: DateValue[]) {
    const value = props.range
        ? next.length
            ? { start: toYear(next[0]), end: toYear(next[1]) }
            : null
        : toYear(next[0]);
    if (JSON.stringify(value) === JSON.stringify(current.value ?? null)) return;
    internal.value = value;
    emit('update:modelValue', value as T);
}
const bounds = computed(() => ({
    min: props.min ? fromYear(props.min) : undefined,
    max: props.max ? fromYear(props.max).set({ month: 12, day: 31 }) : undefined,
}));
const calendarPresets = computed<CalendarPreset[] | undefined>(() =>
    props.presets
        ?.map((preset) =>
            typeof preset === 'string'
                ? { label: translations.rangePresets[preset] ?? preset, range: periodPreset(preset, 'year') }
                : { label: preset.label, range: preset.value }
        )
        .filter((preset) => preset.range?.start)
        .map((preset) => ({
            label: preset.label,
            value: toDates(props.range ? preset.range : preset.range!.start),
        }))
);
</script>

<template>
    <!-- Year field ("2026"): type the digits, or pick from the year grid; range: start – end -->
    <DatePickerBase
        :mode="range ? 'range' : 'single'"
        period="year"
        :dates="dates"
        :with-time="false"
        v-bind="bounds"
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
        @change="set"
    />
</template>
