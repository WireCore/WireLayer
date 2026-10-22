<script setup lang="ts">
import { Progress } from '@ark-ui/vue/progress';
import { progressCircle as progressCircleRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface ProgressCircleProps {
    value: number;
    max?: number;
    /** Visible label below the ring, also its accessible name */
    label: string;
    size?: 'sm' | 'md' | 'lg';
    status?: 'neutral' | 'success' | 'warn' | 'danger';
    /** Text in the ring (default: percent) */
    formatValue?: (value: number, max: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof progressCircleRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ProgressCircleProps>(), {
    max: 100,
    size: 'md',
    status: 'neutral',
    formatValue: (value: number, max: number) => `${Math.round((value / max) * 100)} %`,
});
const progressCircle = useRecipe('progressCircle', progressCircleRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => progressCircle({ size: props.size, status: props.status }));
const text = computed(() => props.formatValue(props.value, props.max));
</script>

<template>
    <!-- Ring with the value in the middle; a progressbar named by its label, the value as aria-valuetext -->
    <Progress.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :model-value="value"
        :max="max"
        :translations="{ value: () => text }"
    >
        <div :class="styles.circle()">
            <!-- zag names the ring by its value only – the label is the name, the value the value text -->
            <Progress.Circle :aria-label="label" :aria-valuetext="text">
                <Progress.CircleTrack :class="styles.track()" />
                <Progress.CircleRange :class="styles.range()" />
            </Progress.Circle>
            <span :class="styles.value()" aria-hidden="true">{{ text }}</span>
        </div>
        <Progress.Label :class="styles.label()">{{ label }}</Progress.Label>
    </Progress.Root>
</template>
