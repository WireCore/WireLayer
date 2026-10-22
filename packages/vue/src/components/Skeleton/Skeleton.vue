<script setup lang="ts">
import { type RecipeClasses, skeleton as skeletonRecipe, type SkeletonShape } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, normalizeStyle, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface SkeletonProps {
    shape?: SkeletonShape;
    /** CSS width, e.g. "60%" or 120 (px) */
    width?: string | number;
    /** CSS height */
    height?: string | number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof skeletonRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<SkeletonProps>();
const skeleton = useRecipe('skeleton', skeletonRecipe, () => props.classes);
const attrs = useAttrs();
const px = (value: string | number | undefined) => (typeof value === 'number' ? `${value}px` : value);
const style = computed(() => [{ width: px(props.width), height: px(props.height) }, normalizeStyle(attrs.style)]);
</script>

<template>
    <!-- Hidden from assistive tech – mark the loading region with aria-busy="true" instead -->
    <span
        aria-hidden="true"
        v-bind="{ ...attrs, class: skeleton({ shape, class: normalizeClass(attrs.class) }), style }"
    />
</template>
