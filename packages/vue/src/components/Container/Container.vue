<script setup lang="ts">
import { container as containerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface ContainerProps {
    /** Maximum width: sm (42rem), md (48rem), lg (64rem, default), xl (80rem) or full */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Without the side padding */
    flush?: boolean;
    /** Element to render, e.g. "section" (default div) */
    as?: string | Component;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof containerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ContainerProps>(), { as: 'div' });
const container = useRecipe('container', containerRecipe, () => props.classes);
const attrs = useAttrs();
</script>

<template>
    <!-- Centred content with a maximum width and side padding -->
    <component :is="as" v-bind="{ ...attrs, class: container({ size, flush, class: normalizeClass(attrs.class) }) }">
        <slot />
    </component>
</template>
