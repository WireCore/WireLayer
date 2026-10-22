<script setup lang="ts">
import { type RecipeClasses, sticky as stickyRecipe } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, normalizeStyle, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface StickyProps {
    /** Edge it sticks to while its container scrolls (default top) */
    edge?: 'top' | 'bottom';
    /** Distance from the edge, e.g. "3.5rem" below a fixed header (default 0) */
    offset?: string;
    /** Action bar look (background, line, buttons at the end) – e.g. Save/Cancel below a long form */
    bar?: boolean;
    /** Element to render (default div) */
    as?: string | Component;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof stickyRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<StickyProps>(), { as: 'div' });
const sticky = useRecipe('sticky', stickyRecipe, () => props.classes);
const attrs = useAttrs();
const style = computed(() => [props.offset ? { '--wc-sticky-offset': props.offset } : {}, normalizeStyle(attrs.style)]);
</script>

<template>
    <!-- Sticks to the top or bottom edge while its container scrolls -->
    <component :is="as" v-bind="{ ...attrs, class: sticky({ edge, bar, class: normalizeClass(attrs.class) }), style }">
        <slot />
    </component>
</template>
