<script setup lang="ts" generic="T extends string | PeriodRange | null = string | null">
import { Field, useFieldContext } from '@ark-ui/vue/field';
import { Popover } from '@ark-ui/vue/popover';
import { CalendarDays, ChevronLeft, ChevronRight, X } from '@lucide/vue';
import {
    datePicker as datePickerRecipe,
    parseQuarter,
    periodPreset,
    quarterOf,
    todayIso,
    type PeriodPreset,
    type PeriodRange,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, ref, useAttrs, useId } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface QuarterPickerProps<T extends string | PeriodRange | null = string | null> {
    /** Quarter as "2026-Q4" – use with v-model; with range { start, end } */
    modelValue?: T;
    defaultValue?: T;
    /** Start and end quarter instead of one */
    range?: boolean;
    /** Earliest quarter ("2024-Q1") */
    min?: string;
    /** Latest quarter ("2027-Q4") */
    max?: string;
    /** Buttons below the quarters: "thisQuarter", "lastQuarter", "last4Quarters", "thisYear", "lastYear" or own */
    presets?: (PeriodPreset | { label: string; value: PeriodRange })[];
    /** Month names in the quarter buttons follow the locale */
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** Sent as "2026-Q4"; with range as name[0] and name[1] */
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** Extra classes per part of the field, e.g. { control: "…" } (see the datePicker recipe) */
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

defineOptions({ inheritAttrs: false });
const localeContext = useLocale();
const translations = useTranslations();
const props = withDefaults(defineProps<QuarterPickerProps<T>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
    clearable: true,
});
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
const datePicker = useRecipe('datePicker', datePickerRecipe, () => props.classes);
const styles = computed(() => datePicker({ size: props.size }));
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const id = useId();
const field = useFieldContext();
const state = computed(() => ({
    disabled: props.disabled ?? field?.value.disabled,
    readOnly: props.readOnly ?? field?.value.readOnly,
    invalid: props.invalid ?? field?.value.invalid,
    required: props.required ?? field?.value.required,
}));

const internal = ref<string | PeriodRange | null>(props.defaultValue ?? null);
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
const start = computed(() => (typeof current.value === 'string' ? current.value : (current.value?.start ?? null)));
const end = computed(() => (typeof current.value === 'string' ? null : (current.value?.end ?? null)));
function set(value: string | PeriodRange | null) {
    if (JSON.stringify(value) === JSON.stringify(current.value ?? null)) return;
    internal.value = value;
    emit('update:modelValue', value as T);
}

// Text of the field: "Q4 2026" or "Q1 2026 – Q3 2026"; typed text is read on Enter and when leaving the field
const label = (quarter: string | null) => {
    const parsed = quarter ? parseQuarter(quarter) : null;
    return parsed ? translations.quarterPicker.quarter(parsed.quarter, parsed.year) : '';
};
const text = computed(() =>
    (props.range && start.value ? `${label(start.value)} – ${label(end.value)}` : label(start.value)).trim()
);
const draft = ref<string | null>(null);
const normalize = (quarter: { year: number; quarter: number } | null) =>
    quarter ? `${quarter.year}-Q${quarter.quarter}` : null;
function commit() {
    if (draft.value === null) return;
    const typed = draft.value.trim();
    draft.value = null;
    if (!typed) return set(null);
    if (!props.range) {
        const quarter = normalize(parseQuarter(typed));
        if (quarter && allowed(quarter)) set(quarter);
        return;
    }
    const [first, second] = typed
        .split(/\s*[–—]\s*|\s+-\s+|\s+(?:bis|to)\s+/i)
        .map((part) => normalize(parseQuarter(part)));
    if (first && allowed(first) && (!second || allowed(second))) set(order(first, second ?? null));
}
const order = (first: string, second: string | null): PeriodRange =>
    second && second < first ? { start: second, end: first } : { start: first, end: second };
const allowed = (quarter: string) => (!props.min || quarter >= props.min) && (!props.max || quarter <= props.max);

// The quarters of one year as buttons; arrow keys move (also into the next or previous year)
const open = ref(false);
const year = ref(Number((start.value ?? quarterOf(todayIso())).slice(0, 4)));
const focusIndex = ref(0);
const buttons = ref<HTMLButtonElement[]>([]);
const quarterKey = (quarter: number) => `${year.value}-Q${quarter}`;
const monthRange = (quarter: number) => {
    const format = new Intl.DateTimeFormat(currentLocale.value, { month: 'long', timeZone: 'UTC' });
    const month = (index: number) => format.format(new Date(Date.UTC(2026, index, 1)));
    return `${month((quarter - 1) * 3)} – ${month(quarter * 3 - 1)}`;
};
const pending = ref(false);
function cellState(quarter: number) {
    const key = quarterKey(quarter);
    const selected = key === start.value || key === end.value;
    const inRange = !!(props.range && start.value && end.value && key > start.value && key < end.value);
    return { key, selected, inRange, disabled: !allowed(key) };
}
function onOpenChange(next: boolean) {
    open.value = next;
    if (!next) return;
    year.value = Number((start.value ?? quarterOf(todayIso())).slice(0, 4));
    const selected = start.value && start.value.startsWith(`${year.value}-`) ? Number(start.value.slice(-1)) - 1 : 0;
    focusIndex.value = selected;
    pending.value = false;
}
function choose(quarter: number) {
    const { key, disabled } = cellState(quarter);
    if (disabled) return;
    if (!props.range) {
        set(key);
        open.value = false;
        return;
    }
    if (!pending.value || !start.value) {
        set({ start: key, end: null });
        pending.value = true;
        return;
    }
    set(order(start.value, key));
    pending.value = false;
    open.value = false;
}
async function move(index: number) {
    let next = index;
    if (next < 0) {
        year.value -= 1;
        next += 4;
    } else if (next > 3) {
        year.value += 1;
        next -= 4;
    }
    focusIndex.value = next;
    await nextTick();
    buttons.value[next]?.focus();
}
function onKeydown(event: KeyboardEvent, index: number) {
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const steps: Record<string, number> = {
        ArrowLeft: rtl ? 1 : -1,
        ArrowRight: rtl ? -1 : 1,
        ArrowUp: -2,
        ArrowDown: 2,
        PageUp: -4,
        PageDown: 4,
    };
    if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        return move(event.key === 'Home' ? 0 : 3);
    }
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    move(index + step);
}
const presetItems = computed(() =>
    (props.presets ?? [])
        .map((preset) =>
            typeof preset === 'string'
                ? { label: translations.rangePresets[preset] ?? preset, range: periodPreset(preset, 'quarter') }
                : { label: preset.label, range: preset.value }
        )
        .filter((preset): preset is { label: string; range: PeriodRange } => !!preset.range?.start)
);
function applyPreset(range: PeriodRange) {
    set(props.range ? range : range.start);
    open.value = false;
}
const initialFocus = () => buttons.value[focusIndex.value] ?? null;
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const bottomStartPositioning = { placement: 'bottom-start', gutter: 4 } as const;
</script>

<template>
    <!--
        Quarter field: type "Q4 2026" (also "2026-Q4", "4/2026") or pick from the four quarters of a year; with range
        a start and an end quarter. Arrow keys move between the quarters and on into the next or previous year.
    -->
    <div :class="styles.base({ class: split.className })" :style="split.style">
        <Popover.Root
            :open="open"
            :positioning="bottomStartPositioning"
            :initial-focus-el="initialFocus"
            lazy-mount
            unmount-on-exit
            @open-change="onOpenChange($event.open)"
        >
            <Popover.Anchor
                :class="styles.control()"
                :data-invalid="state.invalid || undefined"
                :data-disabled="state.disabled || undefined"
            >
                <Field.Input
                    :class="styles.textInput()"
                    :value="draft ?? text"
                    :placeholder="translations.quarterPicker.placeholder"
                    autocomplete="off"
                    v-bind="split.rest"
                    :disabled="state.disabled || undefined"
                    :readonly="state.readOnly || undefined"
                    :required="state.required || undefined"
                    :aria-invalid="state.invalid || undefined"
                    @input="draft = ($event.target as HTMLInputElement).value"
                    @change="commit"
                    @keydown.enter="commit"
                />
                <template v-if="name">
                    <template v-if="range">
                        <input type="hidden" :name="`${name}[0]`" :value="start ?? ''" />
                        <input type="hidden" :name="`${name}[1]`" :value="end ?? ''" />
                    </template>
                    <input v-else type="hidden" :name="name" :value="start ?? ''" />
                </template>
                <button
                    v-if="clearable && start && !state.disabled && !state.readOnly"
                    type="button"
                    :class="styles.clear()"
                    :aria-label="translations.quarterPicker.clearTrigger"
                    @click="set(null)"
                >
                    <X :class="styles.clearIcon()" aria-hidden="true" />
                </button>
                <Popover.Trigger
                    :class="styles.trigger()"
                    :aria-label="translations.quarterPicker.trigger"
                    :disabled="state.disabled || state.readOnly"
                >
                    <CalendarDays :class="styles.triggerIcon()" aria-hidden="true" />
                </Popover.Trigger>
            </Popover.Anchor>
            <Teleport to="body">
                <Popover.Positioner>
                    <Popover.Content :class="styles.content()" :aria-label="translations.quarterPicker.content">
                        <div :class="styles.header()">
                            <button
                                type="button"
                                :class="styles.nav()"
                                :aria-label="translations.quarterPicker.prevYear"
                                :disabled="!!min && `${year - 1}-Q4` < min"
                                @click="year -= 1"
                            >
                                <ChevronLeft :class="styles.navIcon()" aria-hidden="true" />
                            </button>
                            <span :id="`${id}y`" :class="styles.yearLabel()" aria-live="polite">{{ year }}</span>
                            <button
                                type="button"
                                :class="styles.nav()"
                                :aria-label="translations.quarterPicker.nextYear"
                                :disabled="!!max && `${year + 1}-Q1` > max"
                                @click="year += 1"
                            >
                                <ChevronRight :class="styles.navIcon()" aria-hidden="true" />
                            </button>
                        </div>
                        <div role="group" :aria-labelledby="`${id}y`" :class="styles.quarterGrid()">
                            <button
                                v-for="(quarter, index) in [1, 2, 3, 4]"
                                :key="quarter"
                                ref="buttons"
                                type="button"
                                :class="styles.period()"
                                :tabindex="index === focusIndex ? 0 : -1"
                                :aria-label="
                                    translations.quarterPicker.quarterButton(quarter, year, monthRange(quarter))
                                "
                                :aria-pressed="cellState(quarter).selected"
                                :aria-disabled="cellState(quarter).disabled || undefined"
                                :data-selected="cellState(quarter).selected || undefined"
                                :data-in-range="cellState(quarter).inRange || undefined"
                                :data-disabled="cellState(quarter).disabled || undefined"
                                @click="choose(quarter)"
                                @keydown="onKeydown($event, index)"
                                @focus="focusIndex = index"
                            >
                                Q{{ quarter }}
                            </button>
                        </div>
                        <div v-if="presetItems.length" :class="styles.presets()">
                            <button
                                v-for="preset in presetItems"
                                :key="preset.label"
                                type="button"
                                :class="styles.preset()"
                                @click="applyPreset(preset.range)"
                            >
                                {{ preset.label }}
                            </button>
                        </div>
                    </Popover.Content>
                </Popover.Positioner>
            </Teleport>
        </Popover.Root>
    </div>
</template>
