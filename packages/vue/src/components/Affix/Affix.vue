<script setup lang="ts">
import { affix as affixRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, normalizeStyle, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface AffixProps {
    /** Corner of the window (default bottom-end) */
    position?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
    /** Distance from the edges, e.g. "1rem" (default 1.5rem) */
    offset?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof affixRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<AffixProps>();
const affix = useRecipe('affix', affixRecipe, () => props.classes);
const attrs = useAttrs();
const style = computed(() => [props.offset ? { '--wc-affix-offset': props.offset } : {}, normalizeStyle(attrs.style)]);
</script>

<template>
    <!-- Fixed in a corner of the window, e.g. a help or chat button -->
    <div v-bind="{ ...attrs, class: affix({ position, class: normalizeClass(attrs.class) }), style }"><slot /></div>
</template>
