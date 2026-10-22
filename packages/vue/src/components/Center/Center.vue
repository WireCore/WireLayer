<script setup lang="ts">
import { center as centerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface CenterProps {
    /** inline-flex instead of flex (e.g. an icon next to text) */
    inline?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof centerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<CenterProps>();
const center = useRecipe('center', centerRecipe, () => props.classes);
const attrs = useAttrs();
</script>

<template>
    <!-- Centres its content horizontally and vertically -->
    <div v-bind="{ ...attrs, class: center({ inline, class: normalizeClass(attrs.class) }) }"><slot /></div>
</template>
