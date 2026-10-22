<script setup lang="ts">
import { inputGroup as inputGroupRecipe } from '@wirecore/wirelayer-recipes';
import { useRecipe } from '../../recipes.js';
const inputGroup = useRecipe('inputGroup', inputGroupRecipe);

const styles = inputGroup();
</script>

<template>
    <!-- Static text or icon next to the input, e.g. "€" or "https://" -->
    <span :class="styles.addon()"><slot /></span>
</template>
