<script setup lang="ts">
import { group as groupRecipe, type LayoutGap, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface GroupProps {
    /** Space between the children: none, xs (4px), sm (8px), md (16px, default), lg (24px), xl (32px) */
    gap?: LayoutGap;
    /** Distribution along the row */
    justify?: 'start' | 'center' | 'end' | 'between';
    /** Vertical alignment of the children (default middle) */
    align?: 'middle' | 'top' | 'bottom' | 'baseline' | 'stretch';
    /** Keep everything on one line instead of wrapping */
    nowrap?: boolean;
    /** Children share the width evenly */
    grow?: boolean;
    /** Element to render, e.g. "ul" (default div) */
    as?: string | Component;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof groupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<GroupProps>(), { as: 'div' });
const group = useRecipe('group', groupRecipe, () => props.classes);
const attrs = useAttrs();
</script>

<template>
    <!-- Children side by side, wrapping onto new lines -->
    <component
        :is="as"
        v-bind="{ ...attrs, class: group({ gap, justify, align, nowrap, grow, class: normalizeClass(attrs.class) }) }"
    >
        <slot />
    </component>
</template>
