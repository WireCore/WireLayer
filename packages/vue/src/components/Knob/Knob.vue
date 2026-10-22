<script setup lang="ts">
import { useFieldContext } from '@ark-ui/vue/field';
import {
    knob as knobRecipe,
    knobArc,
    knobValueAt,
    knobValueForKey,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface KnobProps {
    /** Value – use with v-model */
    modelValue?: number;
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    /** Visible label, also the accessible name */
    label?: string;
    /** Formats the shown and announced value, e.g. (v) => `${v} %` */
    formatValue?: (value: number) => string;
    /** Text with the value in it, e.g. "{value} %" (when there is no formatValue) */
    valueTemplate?: string;
    /** Width of the arc (default 8, of a 100 wide dial) */
    strokeWidth?: number;
    /** Colour of the filled arc (default primary) */
    color?: 'primary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof knobRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<KnobProps>(), {
    modelValue: undefined,
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    formatValue: undefined,
    strokeWidth: 8,
    color: 'primary',
    disabled: false,
});
const knob = useRecipe('knob', knobRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: number] }>();
const attrs = useAttrs();
const field = useFieldContext();
const styles = computed(() => knob({ size: props.size, color: props.color }));
const labelId = `${useId()}label`;
const internal = ref(props.defaultValue);
const dragging = ref(false);
const current = computed(() => props.modelValue ?? internal.value);
const text = computed(() =>
    props.formatValue
        ? props.formatValue(current.value)
        : (props.valueTemplate?.replaceAll('{value}', String(current.value)) ?? String(current.value))
);

function set(next: number) {
    if (next === current.value) return;
    internal.value = next;
    emit('update:modelValue', next);
}
function fromPointer(event: PointerEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    set(
        knobValueAt(
            event.clientX - rect.left - rect.width / 2,
            event.clientY - rect.top - rect.height / 2,
            props.min,
            props.max,
            props.step
        )
    );
}
function onKeyDown(event: KeyboardEvent) {
    if (props.disabled) return;
    const next = knobValueForKey(event.key, current.value, props.min, props.max, props.step);
    if (next === undefined) return;
    event.preventDefault();
    set(next);
}
function onPointerDown(event: PointerEvent) {
    if (props.disabled) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragging.value = true;
    fromPointer(event);
}
</script>

<template>
    <!--
        Dial (270°): a slider – arrow keys, Page Up/Down, Home/End, or drag around the ring.
        The ring is drawing only; the dial is the focusable slider.
    -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <span v-if="label" :id="labelId" :class="styles.label()">{{ label }}</span>
        <div
            role="slider"
            :tabindex="disabled ? undefined : 0"
            :aria-labelledby="label ? labelId : field?.ids.label"
            :aria-label="label || field ? undefined : (attrs['aria-label'] as string | undefined)"
            :aria-describedby="field?.ariaDescribedby"
            :aria-valuemin="min"
            :aria-valuemax="max"
            :aria-valuenow="current"
            :aria-valuetext="text"
            :aria-disabled="disabled || undefined"
            :data-disabled="disabled || undefined"
            :data-dragging="dragging || undefined"
            :class="styles.control()"
            @keydown="onKeyDown"
            @pointerdown="onPointerDown"
            @pointermove="dragging && fromPointer($event)"
            @pointerup="dragging = false"
            @pointercancel="dragging = false"
        >
            <svg viewBox="0 0 100 100" :class="styles.svg()" aria-hidden="true">
                <path :d="knobArc(1)" :class="styles.track()" :stroke-width="strokeWidth" stroke-linecap="round" />
                <path
                    :d="knobArc((current - min) / (max - min))"
                    :class="styles.range()"
                    :stroke-width="strokeWidth"
                    stroke-linecap="round"
                />
            </svg>
            <span :class="styles.value()" aria-hidden="true">{{ text }}</span>
        </div>
        <input v-if="name" type="hidden" :name="name" :value="current" />
    </div>
</template>
