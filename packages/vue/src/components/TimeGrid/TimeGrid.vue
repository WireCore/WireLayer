<script setup lang="ts" generic="T extends string | TimeRange | null = string | null">
import { LoaderCircle } from '@lucide/vue';
import {
    formatTime,
    inTimeRange,
    pluralText,
    timeGrid as timeGridRecipe,
    timeGridSlots,
    timeToSeconds,
    type RecipeClasses,
    type TimeGridSlot,
} from '@wirecore/wirelayer-recipes';
import { computed, ref, useAttrs, useId } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import type { TimeRange } from '../TimeRangePicker/TimeRangePicker.vue';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface TimeGridProps<T extends string | TimeRange | null = string | null> {
    /** Chosen start time ("HH:mm") – use with v-model; with range { start, end } (start times of the first and last slot) */
    modelValue?: T;
    defaultValue?: T;
    /** The bookable times; default every `interval` minutes from `start` up to `end` */
    times?: (string | TimeGridSlot)[];
    /** First slot ("HH:mm") when `times` is not given */
    start?: string;
    /** End of the last slot ("HH:mm") when `times` is not given */
    end?: string;
    /** Minutes between the slots when `times` is not given */
    interval?: number;
    /** Times that are taken */
    disabledTimes?: string[];
    /** A start and an end slot instead of one (toggle buttons instead of radio buttons) */
    range?: boolean;
    /** 12 or 24 hours; default from the locale */
    hourCycle?: 'h12' | 'h23';
    locale?: string;
    /** Name of the group (default "Available times") */
    label?: string;
    /** Shows that the slots are being loaded */
    loading?: boolean;
    disabled?: boolean;
    /** Sent as "HH:mm"; with range as name[0] and name[1] */
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Extra classes per part of the component, e.g. { slot: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof timeGridRecipe>;
}

defineOptions({ inheritAttrs: false });
const localeContext = useLocale();
const translations = useTranslations();
const props = withDefaults(defineProps<TimeGridProps<T>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    start: '08:00',
    end: '18:00',
    interval: 30,
});
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
const timeGrid = useRecipe('timeGrid', timeGridRecipe, () => props.classes);
const styles = computed(() => timeGrid({ size: props.size }));
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const id = useId();

const items = computed(() =>
    (props.times ?? timeGridSlots(props.start, props.end, props.interval)).map((slot) => {
        const item = typeof slot === 'string' ? { value: slot } : slot;
        return {
            value: item.value,
            label: item.label ?? formatTime(item.value, currentLocale.value, { hourCycle: props.hourCycle }),
            disabled: !!props.disabled || !!item.disabled || !!props.disabledTimes?.includes(item.value),
        };
    })
);
const internal = ref<string | TimeRange | null>(props.defaultValue ?? null);
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
const selectedRange = computed<TimeRange | null>(() =>
    typeof current.value === 'string' ? { start: current.value, end: null } : (current.value ?? null)
);
function set(value: string | TimeRange | null) {
    if (JSON.stringify(value) === JSON.stringify(current.value ?? null)) return;
    internal.value = value;
    emit('update:modelValue', value as T);
}
const isSelected = (value: string) =>
    props.range ? value === selectedRange.value?.start || value === selectedRange.value?.end : value === current.value;

function choose(value: string) {
    if (items.value.find((item) => item.value === value)?.disabled) return;
    if (!props.range) return set(value);
    const range = selectedRange.value;
    if (!range?.start || range.end) return set({ start: value, end: null });
    const [start, end] = [range.start, value].sort((a, b) => (timeToSeconds(a) ?? 0) - (timeToSeconds(b) ?? 0));
    set({ start: start!, end: end! });
}

// Roving focus: one slot in the tab order; arrows move (and choose a single time, like radio buttons)
const buttons = ref<HTMLButtonElement[]>([]);
const focusValue = ref<string | null>(null);
const tabValue = computed(() => {
    const enabled = items.value.filter((item) => !item.disabled);
    const preferred = focusValue.value ?? selectedRange.value?.start;
    return enabled.find((item) => item.value === preferred)?.value ?? enabled[0]?.value;
});
function onKeydown(event: KeyboardEvent, index: number) {
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const forward = ['ArrowDown', rtl ? 'ArrowLeft' : 'ArrowRight'];
    const backward = ['ArrowUp', rtl ? 'ArrowRight' : 'ArrowLeft'];
    const enabled = items.value.map((item, position) => ({ ...item, position })).filter((item) => !item.disabled);
    const at = enabled.findIndex((item) => item.position === index);
    let target: (typeof enabled)[number] | undefined;
    if (forward.includes(event.key)) target = enabled[(at + 1) % enabled.length];
    else if (backward.includes(event.key)) target = enabled[(at - 1 + enabled.length) % enabled.length];
    else if (event.key === 'Home') target = enabled[0];
    else if (event.key === 'End') target = enabled[enabled.length - 1];
    if (!target) return;
    event.preventDefault();
    focusValue.value = target.value;
    buttons.value[target.position]?.focus();
    if (!props.range) choose(target.value);
}
const available = computed(() => items.value.filter((item) => !item.disabled).length);
</script>

<template>
    <!--
        Free time slots for a booking: radio buttons for one time (arrow keys move and choose), toggle buttons for a
        range (start, then end). Taken slots stay visible but cannot be chosen.
    -->
    <div :class="styles.base({ class: split.className })" :style="split.style">
        <div v-if="loading" :class="styles.status()" role="status">
            <LoaderCircle :class="styles.spinner()" aria-hidden="true" />
            {{ translations.timeGrid.loading }}
        </div>
        <p v-else-if="!items.length" :class="styles.status()" role="status">{{ translations.timeGrid.empty }}</p>
        <div
            v-else
            :role="range ? 'group' : 'radiogroup'"
            :class="styles.grid()"
            :aria-label="label ?? (split.rest['aria-label'] as string | undefined) ?? translations.timeGrid.label"
            :aria-describedby="`${id}n`"
            :aria-disabled="disabled || undefined"
        >
            <button
                v-for="(item, index) in items"
                :key="item.value"
                ref="buttons"
                type="button"
                :role="range ? undefined : 'radio'"
                :class="styles.slot()"
                :tabindex="item.value === tabValue ? 0 : -1"
                :aria-checked="range ? undefined : isSelected(item.value)"
                :aria-pressed="range ? isSelected(item.value) : undefined"
                :aria-disabled="item.disabled || undefined"
                :data-in-range="(range && inTimeRange(item.value, selectedRange)) || undefined"
                @click="choose(item.value)"
                @keydown="onKeydown($event, index)"
                @focus="focusValue = item.value"
            >
                {{ item.label }}
            </button>
        </div>
        <span v-if="!loading && items.length" :id="`${id}n`" hidden>{{
            pluralText(translations.timeGrid.available, available, currentLocale)
        }}</span>
        <template v-if="name">
            <template v-if="range">
                <input type="hidden" :name="`${name}[0]`" :value="selectedRange?.start ?? ''" />
                <input type="hidden" :name="`${name}[1]`" :value="selectedRange?.end ?? ''" />
            </template>
            <input v-else type="hidden" :name="name" :value="(current as string | null) ?? ''" />
        </template>
    </div>
</template>
