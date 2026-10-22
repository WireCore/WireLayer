<script setup lang="ts">
import {
    columnVariables,
    type LayoutGap,
    type RecipeClasses,
    type ResponsiveColumns,
    simpleGrid as simpleGridRecipe,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, normalizeStyle, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface SimpleGridProps {
    /** Columns: a number or per breakpoint, e.g. { base: 1, sm: 2, lg: 4 } (default 1) */
    columns?: ResponsiveColumns;
    /** As many columns as fit, each at least this wide (e.g. "14rem") – instead of `columns` */
    minColumnWidth?: string;
    /** Space between the cells (default md, 16px) */
    gap?: LayoutGap;
    /** Element to render, e.g. "ul" (default div) */
    as?: string | Component;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof simpleGridRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SimpleGridProps>(), { as: 'div', columns: 1 });
const simpleGrid = useRecipe('simpleGrid', simpleGridRecipe, () => props.classes);
const attrs = useAttrs();
const style = computed(() => [
    props.minColumnWidth ? { '--wc-min-col': props.minColumnWidth } : columnVariables(props.columns),
    normalizeStyle(attrs.style),
]);
</script>

<template>
    <!-- Columns of equal width, fixed per breakpoint or as many as fit -->
    <component
        :is="as"
        v-bind="{
            ...attrs,
            class: simpleGrid({ gap, autoFit: !!minColumnWidth, class: normalizeClass(attrs.class) }),
            style,
        }"
    >
        <slot />
    </component>
</template>
