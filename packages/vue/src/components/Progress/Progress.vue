<script setup lang="ts">
import { Progress } from '@ark-ui/vue/progress';
import { type MeterColor, progress as progressRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface ProgressSegment {
    value: number;
    /** Name in the legend */
    label?: string;
    color?: MeterColor;
    /** Tooltip of the part (pointer only – the legend carries the text) */
    tooltip?: string;
}

export interface ProgressProps {
    value: number;
    max?: number;
    /** Visible label, also the accessible name of the progress bar */
    label?: string;
    /** Show the value next to the label */
    showValue?: boolean;
    /** Formats the value text (shown and announced) */
    valueText?: (percent: number) => string;
    /** Several parts in one bar (their sum is the value); a legend names them */
    segments?: ProgressSegment[];
    /** Shows the progress as this many blocks (e.g. steps of a wizard) */
    steps?: number;
    /** Diagonal stripes on the filled part */
    striped?: boolean;
    /** Moving stripes (only without reduced motion) */
    animated?: boolean;
    /** Vertical bar (fills the height of its parent) */
    orientation?: 'horizontal' | 'vertical';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof progressRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ProgressProps>(), {
    max: 100,
    showValue: true,
    valueText: (percent: number) => `${percent} %`,
    orientation: 'horizontal',
});
const progress = useRecipe('progress', progressRecipe, () => props.classes);
const attrs = useAttrs();
const palette: MeterColor[] = ['primary', 'info', 'success', 'warn', 'danger', 'muted'];
const total = computed(() =>
    props.segments ? props.segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0) : props.value
);
const styles = computed(() =>
    progress({
        orientation: props.orientation,
        striped: props.striped,
        animated: props.animated,
        stepped: !!props.steps && !props.segments,
    })
);
const percentOf = (value: number) => Math.round((value / props.max) * 100);
const text = computed(() => props.valueText(percentOf(total.value)));
const filled = computed(() => (props.steps ? Math.round((total.value / props.max) * props.steps) : 0));
const sizeKey = computed(() => (props.orientation === 'vertical' ? 'height' : 'width'));
const colorOf = (segment: ProgressSegment, index: number) => segment.color ?? palette[index % palette.length]!;
</script>

<template>
    <Progress.Root
        v-bind="{ ...attrs, 'aria-label': undefined, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :model-value="total"
        :max="max"
        :orientation="orientation === 'vertical' ? 'vertical' : undefined"
    >
        <div v-if="label || showValue" :class="styles.header()">
            <Progress.Label v-if="label" :class="styles.label()">{{ label }}</Progress.Label>
            <Progress.ValueText v-if="showValue" :class="styles.value()">{{ text }}</Progress.ValueText>
        </div>
        <!-- Ark names the progressbar after its value; the label is the name, the value its valuetext -->
        <Progress.Track
            :class="styles.track()"
            :aria-label="label ?? (attrs['aria-label'] as string | undefined)"
            :aria-valuetext="text"
        >
            <div v-if="segments?.length" :class="styles.segments()">
                <span
                    v-for="(segment, index) in segments"
                    :key="segment.label ?? index"
                    :class="progress({ color: colorOf(segment, index), striped, animated }).segment()"
                    :style="{ [sizeKey]: `${(Math.max(0, segment.value) / max) * 100}%` }"
                    v-bind="segment.tooltip || segment.label ? { title: segment.tooltip ?? segment.label } : {}"
                />
            </div>
            <div v-else-if="steps" :class="styles.steps()">
                <span
                    v-for="step in steps"
                    :key="step"
                    :class="styles.step()"
                    :data-state="step <= filled ? 'complete' : undefined"
                />
            </div>
            <Progress.Range v-else :class="styles.range()" />
        </Progress.Track>
        <ul v-if="segments?.some((segment) => segment.label)" :class="styles.legend()">
            <li v-for="(segment, index) in segments" :key="segment.label ?? index" :class="styles.legendItem()">
                <span :class="progress({ color: colorOf(segment, index) }).swatch()" aria-hidden="true" />
                {{ segment.label }}
                <span :class="styles.legendValue()">{{ valueText(percentOf(segment.value)) }}</span>
            </li>
        </ul>
    </Progress.Root>
</template>
