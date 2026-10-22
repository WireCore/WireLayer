<script setup lang="ts">
import { AngleSlider } from '@ark-ui/vue/angle-slider';
import { useFieldContext } from '@ark-ui/vue/field';
import { angleSlider as angleSliderRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface AngleSliderProps {
    /** Angle 0–360 – use with v-model */
    modelValue?: number;
    defaultValue?: number;
    /** Step of the arrow keys and of dragging (default 1) */
    step?: number;
    /** Visible label, also the accessible name (or a surrounding Field, or aria-label) */
    label?: string;
    /** Tick marks at these angles, e.g. [0, 90, 180, 270] */
    marks?: number[];
    /** Shows the value below the dial (default true) */
    showValue?: boolean;
    /** Shown and announced text of the value (default "45°" shown, "45 degrees" announced) */
    formatValue?: (degrees: number) => string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof angleSliderRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AngleSliderProps>(), {
    modelValue: undefined,
    defaultValue: 0,
    step: 1,
    showValue: true,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
});
const emit = defineEmits<{
    'update:modelValue': [value: number];
    /** The user let go (pointer released) */
    valueChangeEnd: [value: number];
}>();
const angleSlider = useRecipe('angleSlider', angleSliderRecipe, () => props.classes);
const attrs = useAttrs();
const field = useFieldContext();
const t = useTranslations().angleSlider;
const styles = angleSlider();
const internal = ref(props.defaultValue);
const current = computed(() => props.modelValue ?? internal.value);
const shown = computed(() => (props.formatValue ? props.formatValue(current.value) : `${current.value}°`));
const spoken = computed(() => (props.formatValue ? props.formatValue(current.value) : t.value(current.value)));

function onChange(value: number) {
    internal.value = value;
    emit('update:modelValue', value);
}
</script>

<template>
    <!-- Dial for an angle: the needle is the slider (arrow keys, Home/End), drag anywhere on the dial -->
    <AngleSlider.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :model-value="modelValue"
        :default-value="defaultValue"
        :step="step"
        :disabled="disabled ?? field?.disabled"
        :read-only="readOnly ?? field?.readOnly"
        :invalid="invalid ?? field?.invalid"
        :name="name"
        :aria-label="label || field ? undefined : ((attrs['aria-label'] as string | undefined) ?? t.label)"
        :aria-labelledby="!label && field ? field.ids.label : undefined"
        @value-change="onChange($event.value)"
        @value-change-end="emit('valueChangeEnd', $event.value)"
    >
        <AngleSlider.Label v-if="label" :class="styles.label()">{{ label }}</AngleSlider.Label>
        <AngleSlider.Control :class="styles.control()">
            <AngleSlider.MarkerGroup v-if="marks?.length" :class="styles.markers()">
                <AngleSlider.Marker v-for="mark in marks" :key="mark" :value="mark" :class="styles.marker()" />
            </AngleSlider.MarkerGroup>
            <AngleSlider.Thumb
                :class="styles.thumb()"
                :aria-valuetext="spoken"
                :aria-describedby="field?.ariaDescribedby"
            />
        </AngleSlider.Control>
        <span v-if="showValue" :class="styles.value()" aria-hidden="true">{{ shown }}</span>
        <AngleSlider.HiddenInput />
    </AngleSlider.Root>
</template>
