<script setup lang="ts">
import { aspectRatio as aspectRatioRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, normalizeStyle, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface AspectRatioProps {
    /** Width divided by height, e.g. 16 / 9 (default), 4 / 3 or 1 */
    ratio?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof aspectRatioRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AspectRatioProps>(), { ratio: 16 / 9 });
const aspectRatio = useRecipe('aspectRatio', aspectRatioRecipe, () => props.classes);
const attrs = useAttrs();
const style = computed(() => [{ '--wc-ratio': String(props.ratio) }, normalizeStyle(attrs.style)]);
</script>

<template>
    <!-- Keeps the ratio of width to height; an image, video or iframe inside fills it -->
    <div v-bind="{ ...attrs, class: aspectRatio({ class: normalizeClass(attrs.class) }), style }"><slot /></div>
</template>
