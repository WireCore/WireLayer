<script setup lang="ts">
import { visuallyHidden as visuallyHiddenRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface VisuallyHiddenProps {
    /** Element (default span) */
    as?: string;
    /** Becomes visible while it (or something inside) has the focus – e.g. a skip link */
    focusable?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof visuallyHiddenRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VisuallyHiddenProps>(), { as: 'span' });
const visuallyHidden = useRecipe('visuallyHidden', visuallyHiddenRecipe, () => props.classes);
const attrs = useAttrs();
</script>

<template>
    <!-- Text only for screen readers, e.g. a label next to an icon -->
    <component :is="as" v-bind="{ ...attrs, class: visuallyHidden({ focusable, class: normalizeClass(attrs.class) }) }"
        ><slot
    /></component>
</template>
