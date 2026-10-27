<script setup lang="ts">
import { useFieldContext } from '@ark-ui/vue/field';
import { X } from '@lucide/vue';
import {
    datePicker as datePickerRecipe,
    durationToParts,
    durationUnit,
    formatDuration,
    partsToDuration,
    type DurationValueType,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, ref, useAttrs, useId, watch } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useLabelForWarning } from '../../utils/label-for.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const localeContext = useLocale();
const translations = useTranslations();

export interface DurationInputProps {
    /** Total minutes (default), total seconds or ISO 8601 ("PT2H30M") – see valueType; use with v-model */
    modelValue?: number | string | null;
    defaultValue?: number | string | null;
    /** What v-model gets: total minutes, total seconds or an ISO 8601 duration */
    valueType?: DurationValueType;
    /** Adds days before the hours (the hours then stop at 23) */
    withDays?: boolean;
    /** Adds seconds after the minutes */
    withSeconds?: boolean;
    /** Highest number of hours (default 999, with days 23) */
    maxHours?: number;
    /** Unit names and the spoken duration follow the locale */
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** Extra classes per part of the field (see the datePicker recipe) */
    /** Id of the field (the group of parts); a `<label for>` cannot name it, use a Field or aria-label */
    id?: string;
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<DurationInputProps>(), {
    modelValue: undefined,
    defaultValue: null,
    valueType: 'minutes',
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
    clearable: true,
});
const emit = defineEmits<{ 'update:modelValue': [value: number | string | null] }>();
const datePicker = useRecipe('datePicker', datePickerRecipe, () => props.classes);
const styles = computed(() => datePicker({ size: props.size }));
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
useLabelForWarning('DurationInput', () => props.id);
const uid = useId();
const field = useFieldContext();
const state = computed(() => ({
    disabled: props.disabled ?? field?.value.disabled,
    readOnly: props.readOnly ?? field?.value.readOnly,
    invalid: props.invalid ?? field?.value.invalid,
    required: props.required ?? field?.value.required,
}));

type Unit = 'days' | 'hours' | 'minutes' | 'seconds';
const units = computed<Unit[]>(() => [
    ...(props.withDays ? (['days'] as const) : []),
    'hours',
    'minutes',
    ...(props.withSeconds ? (['seconds'] as const) : []),
]);
const max = (unit: Unit) =>
    unit === 'days' ? 999 : unit === 'hours' ? (props.maxHours ?? (props.withDays ? 23 : 999)) : 59;
const intlUnit = { days: 'day', hours: 'hour', minutes: 'minute', seconds: 'second' } as const;
const placeholderKey = intlUnit;

// The parts as typed – null is an empty part (placeholder); the value follows from them
const internal = ref(props.defaultValue);
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
const parts = ref<Record<Unit, number | null>>({ days: null, hours: null, minutes: null, seconds: null });
function fromValue(value: number | string | null | undefined) {
    const next = durationToParts(value, props.valueType, props.withDays);
    parts.value = next
        ? { days: next.days, hours: next.hours, minutes: next.minutes, seconds: next.seconds }
        : { days: null, hours: null, minutes: null, seconds: null };
}
fromValue(current.value);
const filled = computed(() => units.value.some((unit) => parts.value[unit] !== null));
const complete = computed(() => ({
    days: parts.value.days ?? 0,
    hours: parts.value.hours ?? 0,
    minutes: parts.value.minutes ?? 0,
    seconds: parts.value.seconds ?? 0,
}));
const valueOfParts = () => (filled.value ? partsToDuration(complete.value, props.valueType) : null);
watch(current, (value) => {
    if (value !== valueOfParts()) fromValue(value);
});
function update(unit: Unit, value: number | null) {
    parts.value = { ...parts.value, [unit]: value === null ? null : Math.min(max(unit), Math.max(0, value)) };
    const next = valueOfParts();
    if (next === current.value) return;
    internal.value = next;
    emit('update:modelValue', next);
}
function clear() {
    const had = current.value !== null;
    parts.value = { days: null, hours: null, minutes: null, seconds: null };
    internal.value = null;
    if (had) emit('update:modelValue', null);
    segments.value[0]?.focus();
}

const spoken = computed(() => (filled.value ? formatDuration(complete.value, currentLocale.value) : ''));
const text = (unit: Unit) => {
    const value = parts.value[unit];
    if (value === null) return translations.dateInput.placeholder()[placeholderKey[unit]];
    return unit === 'minutes' || unit === 'seconds' ? String(value).padStart(2, '0') : String(value);
};
const unitText = (unit: Unit) => durationUnit(parts.value[unit] ?? 2, intlUnit[unit], currentLocale.value, 'short');
const valueText = (unit: Unit) =>
    parts.value[unit] === null
        ? undefined
        : durationUnit(parts.value[unit]!, intlUnit[unit], currentLocale.value, 'long').replace(
              /^/,
              `${parts.value[unit]} `
          );

// Keyboard like the date field: digits fill a part and move on, arrows change it, Backspace empties it
const segments = ref<HTMLElement[]>([]);
let typed = '';
const interactive = computed(() => !state.value.disabled && !state.value.readOnly);
function focusAt(index: number) {
    typed = '';
    segments.value[Math.max(0, Math.min(units.value.length - 1, index))]?.focus();
}
function onKeydown(event: KeyboardEvent, unit: Unit, index: number) {
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const value = parts.value[unit];
    const step = { ArrowUp: 1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[event.key];
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        return focusAt(index + ((event.key === 'ArrowRight') !== rtl ? 1 : -1));
    }
    if (!interactive.value) return;
    if (step !== undefined) {
        event.preventDefault();
        typed = '';
        const limit = max(unit) + 1;
        // Minutes and seconds wrap around, hours and days stop at their ends
        const next = (value ?? (step > 0 ? -1 : 0)) + step;
        return update(unit, unit === 'minutes' || unit === 'seconds' ? ((next % limit) + limit) % limit : next);
    }
    if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        typed = '';
        return update(unit, event.key === 'Home' ? 0 : max(unit));
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        typed = typed.slice(0, -1);
        return update(unit, typed ? Number(typed) : null);
    }
    // ":" or a space moves on, like the separators in the date field
    if ([':', '.', ',', ' '].includes(event.key)) {
        event.preventDefault();
        return focusAt(index + 1);
    }
    if (/^\d$/.test(event.key)) {
        event.preventDefault();
        typed = Number(`${typed}${event.key}`) > max(unit) ? event.key : `${typed}${event.key}`;
        update(unit, Number(typed));
        // Full when no further digit fits
        if (Number(typed) * 10 > max(unit)) focusAt(index + 1);
    }
}
</script>

<template>
    <!--
        Duration field: hours and minutes (optional days and seconds) as spin buttons – type the digits ("2:30" → 2 h
        30 min; a full part moves on by itself), arrow keys change a part. Hours go past 24 unless days are shown.
        Screen readers hear the whole duration ("2 hours 30 minutes").
    -->
    <div :class="styles.base({ class: split.className })" :style="split.style">
        <div
            :class="styles.control()"
            :data-invalid="state.invalid || undefined"
            :data-disabled="state.disabled || undefined"
        >
            <div :class="styles.dateInput()">
                <div
                    :id="id"
                    role="group"
                    :class="styles.segments()"
                    :aria-labelledby="field ? field.ids.label : undefined"
                    :aria-label="field ? undefined : (split.rest['aria-label'] as string | undefined)"
                    :aria-describedby="
                        [field?.ariaDescribedby, filled ? `${uid}t` : undefined].filter(Boolean).join(' ') || undefined
                    "
                    :aria-invalid="state.invalid || undefined"
                    :aria-required="state.required || undefined"
                >
                    <template v-for="(unit, index) in units" :key="unit">
                        <span
                            ref="segments"
                            role="spinbutton"
                            :tabindex="state.disabled ? -1 : 0"
                            :class="styles.segment()"
                            :aria-label="translations.durationInput[unit]"
                            :aria-valuemin="0"
                            :aria-valuemax="max(unit)"
                            :aria-valuenow="parts[unit] ?? undefined"
                            :aria-valuetext="valueText(unit)"
                            :aria-disabled="state.disabled || undefined"
                            :aria-readonly="state.readOnly || undefined"
                            :data-placeholder-shown="parts[unit] === null ? '' : undefined"
                            @keydown="onKeydown($event, unit, index)"
                            @focus="typed = ''"
                            >{{ text(unit) }}</span
                        ><span :class="styles.unit()" aria-hidden="true">{{ unitText(unit) }}</span>
                    </template>
                </div>
                <span v-if="filled" :id="`${uid}t`" hidden>{{ spoken }}</span>
            </div>
            <input v-if="name" type="hidden" :name="name" :value="current ?? ''" />
            <button
                v-if="clearable && filled && interactive"
                type="button"
                :class="styles.clear()"
                :aria-label="translations.durationInput.clearTrigger"
                @click="clear"
            >
                <X :class="styles.clearIcon()" aria-hidden="true" />
            </button>
        </div>
    </div>
</template>
