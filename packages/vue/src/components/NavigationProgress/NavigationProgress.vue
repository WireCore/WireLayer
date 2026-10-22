<script setup lang="ts">
import { navigationProgress as navigationProgressRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed } from 'vue';
import { navigationProgressValue } from './progress.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface NavigationProgressProps {
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof navigationProgressRecipe>;
}

const props = defineProps<NavigationProgressProps>();
const navigationProgress = useRecipe('navigationProgress', navigationProgressRecipe, () => props.classes);
const styles = navigationProgress();
const value = computed(() => navigationProgressValue.value);
</script>

<template>
    <!-- Place once in the app; drive it with navigationProgress.start() / done() -->
    <div
        :class="styles.base()"
        :data-state="value === null ? 'idle' : 'loading'"
        :role="value === null ? undefined : 'progressbar'"
        :aria-label="value === null ? undefined : (label ?? translations.navigationProgress.label)"
        :aria-valuenow="value === null ? undefined : Math.round(value)"
        :aria-valuemin="value === null ? undefined : 0"
        :aria-valuemax="value === null ? undefined : 100"
    >
        <div :class="styles.bar()" :style="{ width: `${value ?? 0}%` }" />
    </div>
</template>
