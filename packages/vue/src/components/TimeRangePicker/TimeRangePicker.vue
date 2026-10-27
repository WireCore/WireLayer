<script setup lang="ts">
import { DateInput } from '@ark-ui/vue/date-input';
import { useFieldContext } from '@ark-ui/vue/field';
import { DateFormatter, type DateValue } from '@internationalized/date';
import { X } from '@lucide/vue';
import { datePicker as datePickerRecipe, parseTimeText, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, ref, useAttrs, useId } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useLabelForWarning } from '../../utils/label-for.js';
import DateSegments from '../DatePicker/DateSegments.vue';
import { fromTime, toTime } from '../DatePicker/dates.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const localeContext = useLocale();
const translations = useTranslations();

/** Start and end time ("HH:mm"), null while not entered */
export interface TimeRange {
    start: string | null;
    end: string | null;
}

export interface TimeRangePickerProps {
    /** Start and end ("09:00" – "17:30") – use with v-model */
    modelValue?: TimeRange | null;
    defaultValue?: TimeRange | null;
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
    /** Extra classes per part of the component (see the datePicker recipe) */
    /** Id of the field – the (first) time gets it; a `<label for>` cannot name it, use a Field or aria-label */
    id?: string;
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<TimeRangePickerProps>(), {
    modelValue: undefined,
    defaultValue: null,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
    clearable: true,
});
const datePicker = useRecipe('datePicker', datePickerRecipe, () => props.classes);
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const emit = defineEmits<{ 'update:modelValue': [value: TimeRange | null] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
useLabelForWarning('TimeRangePicker', () => props.id);
const styles = computed(() => datePicker({ size: props.size }));
const uid = useId();
const field = useFieldContext();
const state = computed(() => ({
    disabled: props.disabled ?? field?.value.disabled,
    readOnly: props.readOnly ?? field?.value.readOnly,
    invalid: props.invalid ?? field?.value.invalid,
    required: props.required ?? field?.value.required,
}));
const rangeNames = [translations.dateRange.start, translations.dateRange.end];
// The field label names the times, followed by "Start"/"End"; an own id goes to the first time through Ark
const ids = computed(() =>
    field?.value || props.id
        ? {
              ...(field?.value ? { label: (index: number) => `${field.value.ids.label} ${uid}r${index}` } : {}),
              ...(props.id ? { segmentGroup: (index: number) => (index === 0 ? props.id : undefined) as string } : {}),
          }
        : undefined
);
const ariaLabel = computed(() => split.value.rest['aria-label'] as string | undefined);
const groupLabel = (index: number) =>
    field?.value ? undefined : [ariaLabel.value, rangeNames[index]].filter(Boolean).join(', ');

const internal = ref(props.defaultValue);
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
const times = computed(() =>
    [current.value?.start, current.value?.end].filter((time): time is string => !!time).map(fromTime)
);
function set(next: DateValue[]) {
    const value = next.length
        ? { start: toTime(next[0], props.withSeconds), end: toTime(next[1], props.withSeconds) }
        : null;
    if (value?.start === current.value?.start && value?.end === current.value?.end) return;
    internal.value = value;
    emit('update:modelValue', value);
}
const formatter = computed(
    () =>
        new DateFormatter(currentLocale.value, {
            hour: '2-digit',
            minute: '2-digit',
            ...(props.withSeconds ? { second: '2-digit' } : {}),
            ...(props.hourCycle ? { hourCycle: props.hourCycle } : {}),
        })
);
const placeholder = fromTime('00:00');
const bounds = computed(() => ({
    min: props.min ? fromTime(props.min) : undefined,
    max: props.max ? fromTime(props.max) : undefined,
}));
// Pasting "09:00 – 17:30" fills both, a single time the part it lands in
function pasteText(text: string, index: number) {
    const parts = text
        .split(/\s*[–—]\s*|\s+-\s+|\s+(?:bis|to)\s+/i)
        .map((part) => parseTimeText(part, props.withSeconds));
    if (parts.length === 2 && parts[0] && parts[1]) {
        set([fromTime(parts[0]), fromTime(parts[1])]);
        return true;
    }
    if (parts.length !== 1 || !parts[0]) return false;
    const next = [...times.value];
    next[index] = fromTime(parts[0]);
    set(next.filter(Boolean));
    return true;
}
</script>

<template>
    <!-- Start and end time in one field ("09:00 – 17:30"): typing runs on from start to end -->
    <div :class="styles.base({ class: split.className })" :style="split.style">
        <div
            :class="styles.control()"
            :data-invalid="state.invalid || undefined"
            :data-disabled="state.disabled || undefined"
        >
            <DateInput.Root
                :class="styles.dateInput()"
                :ids="ids"
                :model-value="times"
                selection-mode="range"
                :granularity="withSeconds ? 'second' : 'minute'"
                :formatter="formatter"
                :placeholder-value="placeholder"
                v-bind="{ ...bounds, ...state }"
                :locale="currentLocale"
                should-force-leading-zeros
                :translations="translations.dateInput"
                @value-change="set($event.value)"
            >
                <DateInput.Control :class="styles.dateControl()">
                    <template v-for="index in [0, 1]" :key="index">
                        <span v-if="index === 1" :class="styles.rangeSeparator()" aria-hidden="true">–</span>
                        <span v-if="field" :id="`${uid}r${index}`" :class="styles.rangeLabel()">
                            {{ rangeNames[index] }}
                        </span>
                        <DateSegments
                            :index="index"
                            :label="groupLabel(index)"
                            :describedby="field?.ariaDescribedby"
                            :paste="pasteText"
                            :size="size"
                        />
                    </template>
                </DateInput.Control>
            </DateInput.Root>
            <template v-if="name">
                <input type="hidden" :name="`${name}[0]`" :value="current?.start ?? ''" />
                <input type="hidden" :name="`${name}[1]`" :value="current?.end ?? ''" />
            </template>
            <button
                v-if="clearable && current?.start && !state.disabled && !state.readOnly"
                type="button"
                :class="styles.clear()"
                :aria-label="translations.timePicker.clearRange"
                @click="set([])"
            >
                <X :class="styles.clearIcon()" aria-hidden="true" />
            </button>
        </div>
    </div>
</template>
