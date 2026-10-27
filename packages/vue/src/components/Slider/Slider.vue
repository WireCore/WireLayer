<script setup lang="ts">
import { Slider } from '@ark-ui/vue/slider';
import { type RecipeClasses, slider as sliderRecipe, snapToMarks } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { useLabelForWarning } from '../../utils/label-for.js';

const translations = useTranslations();

export interface SliderProps {
    /** One value per thumb – two values make a range slider (v-model) */
    modelValue?: number[];
    defaultValue?: number[];
    min?: number;
    max?: number;
    step?: number;
    /** Visible label, also the accessible name of the thumbs */
    label: string;
    /** Names of the thumbs of a range slider, read after the label */
    thumbLabels?: readonly string[];
    /** Shows the formatted value next to the label */
    showValue?: boolean;
    /** The label for screen readers only – it stays the accessible name of the thumbs */
    hideLabel?: boolean;
    /** Formats the shown and announced value, e.g. (v) => `${v} %` */
    formatValue?: (value: number) => string;
    disabled?: boolean;
    name?: string;
    /** Vertical slider: give it a height (at least 160px) */
    orientation?: 'horizontal' | 'vertical';
    /** Marks along the track, optionally with a label: [0, 50, 100] or [{ value: 0, label: 'Off' }] */
    marks?: (number | SliderMark)[];
    /** Only the values of `marks` can be chosen (arrow keys go from mark to mark) */
    restrictToMarks?: boolean;
    /** Smallest distance between the thumbs of a range slider, in values */
    minRange?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sliderRecipe>;
}

/** A mark on the slider track */
export interface SliderMark {
    value: number;
    /** Text below the mark (beside it when vertical) */
    label?: string;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SliderProps>(), {
    modelValue: undefined,
    defaultValue: () => [0],
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    formatValue: String,
    disabled: undefined,
    orientation: undefined,
    marks: undefined,
    minRange: undefined,
});
const slider = useRecipe('slider', sliderRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: number[]]; valueChangeEnd: [value: number[]] }>();
const attrs = useAttrs();
useLabelForWarning('Slider', () => attrs.id);
const styles = computed(() =>
    slider({
        withMarks: !!props.marks?.length,
        hideLabel: props.hideLabel,
        hideHeader: props.hideLabel && !props.showValue,
    })
);
const markList = computed(() => (props.marks ?? []).map((mark) => (typeof mark === 'number' ? { value: mark } : mark)));
// restrictToMarks: the slider is controlled here and every change snaps to a mark
const snapped = ref(props.defaultValue);
const restricted = computed(() => props.restrictToMarks && markList.value.length > 0);
const current = computed(() => (restricted.value ? (props.modelValue ?? snapped.value) : props.modelValue));
function onValueChange(value: number[]) {
    if (!restricted.value) return emit('update:modelValue', value);
    const next = snapToMarks(
        value,
        current.value ?? props.defaultValue,
        markList.value.map((mark) => mark.value)
    );
    snapped.value = next;
    emit('update:modelValue', next);
}
const id = useId();
const labelId = `${id}label`;
const count = computed(() => (props.modelValue ?? props.defaultValue).length);
</script>

<template>
    <Slider.Root
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :ids="{ label: labelId }"
        :model-value="current"
        :default-value="defaultValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :name="name"
        :orientation="orientation"
        :min-steps-between-thumbs="minRange ? Math.ceil(minRange / step) : undefined"
        :get-aria-value-text="(details) => formatValue(details.value)"
        @value-change="onValueChange($event.value)"
        @value-change-end="emit('valueChangeEnd', $event.value)"
    >
        <div :class="styles.header()">
            <Slider.Label :id="labelId" :class="styles.label()">{{ label }}</Slider.Label>
            <Slider.Context v-if="showValue" v-slot="api">
                <span :class="styles.value()" aria-hidden="true">{{ api.value.map(formatValue).join(' – ') }}</span>
            </Slider.Context>
        </div>
        <Slider.Control :class="styles.control()">
            <Slider.Track :class="styles.track()">
                <Slider.Range :class="styles.range()" />
            </Slider.Track>
            <!-- Range: "Price, Minimum" / "Price, Maximum" -->
            <Slider.Thumb
                v-for="index in count"
                :key="index"
                :index="index - 1"
                :class="styles.thumb()"
                :aria-labelledby="count > 1 ? `${labelId} ${id}thumb${index - 1}` : labelId"
            >
                <span v-if="count > 1" :id="`${id}thumb${index - 1}`" :class="styles.thumbLabel()">
                    {{ (thumbLabels ?? translations.slider.thumbs)[index - 1] }}
                </span>
                <Slider.HiddenInput />
            </Slider.Thumb>
            <Slider.MarkerGroup v-if="markList.length" :class="styles.markerGroup()">
                <Slider.Marker v-for="mark in markList" :key="mark.value" :value="mark.value" :class="styles.marker()">
                    <span :class="styles.markerTick()" :data-orientation="orientation ?? 'horizontal'" />{{
                        mark.label
                    }}
                </Slider.Marker>
            </Slider.MarkerGroup>
        </Slider.Control>
    </Slider.Root>
</template>
