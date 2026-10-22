<script setup lang="ts">
import { inputGroup as inputGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useRecipe } from '../../recipes.js';

export interface InputGroupProps {
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof inputGroupRecipe>;
}

const props = defineProps<InputGroupProps>();
const inputGroup = useRecipe('inputGroup', inputGroupRecipe, () => props.classes);

const styles = inputGroup();
</script>

<template>
    <!-- Input with buttons or text (InputGroupAddon) attached; only the outer corners stay round -->
    <div :class="styles.base()"><slot /></div>
</template>
