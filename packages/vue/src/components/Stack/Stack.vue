<script setup lang="ts">
import { type LayoutGap, type RecipeClasses, stack as stackRecipe } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface StackProps {
    /** Space between the children: none, xs (4px), sm (8px), md (16px, default), lg (24px), xl (32px) */
    gap?: LayoutGap;
    /** Horizontal alignment of the children */
    align?: 'stretch' | 'start' | 'center' | 'end';
    /** Element to render, e.g. "ul" or "section" (default div) */
    as?: string | Component;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof stackRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<StackProps>(), { as: 'div' });
const stack = useRecipe('stack', stackRecipe, () => props.classes);
const attrs = useAttrs();
</script>

<template>
    <!-- Children below each other with an even gap -->
    <component :is="as" v-bind="{ ...attrs, class: stack({ gap, align, class: normalizeClass(attrs.class) }) }">
        <slot />
    </component>
</template>
