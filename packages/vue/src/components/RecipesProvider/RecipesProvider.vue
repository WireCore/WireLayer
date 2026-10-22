<script setup lang="ts">
import type { RecipeConfig } from '@wirecore/wirelayer-recipes';
import { provideRecipes } from '../../recipes.js';

export interface RecipesProviderProps {
    /**
     * Defaults and classes per recipe for every component below, e.g.
     * `{ button: { defaultVariants: { size: 'sm' }, classes: { base: 'rounded-md' } } }`
     */
    recipes: RecipeConfig;
}

const props = defineProps<RecipesProviderProps>();
provideRecipes(() => props.recipes);
</script>

<template>
    <!-- Renders nothing itself -->
    <slot />
</template>
