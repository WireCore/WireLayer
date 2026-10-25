<script setup lang="ts">
import { type RecipeClasses, topBar as topBarRecipe } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface TopBarProps {
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof topBarRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<TopBarProps>();
const topBar = useRecipe('topBar', topBarRecipe, () => props.classes);
defineSlots<{
    /** Start, e.g. the logo or the app name */
    start?(): unknown;
    /** Middle, takes the free space, e.g. a search field */
    default?(): unknown;
    /** End, e.g. an app switcher and the user menu */
    end?(): unknown;
}>();
const styles = topBar();
const attrs = useAttrs();
</script>

<template>
    <!-- A header landmark (banner at the top level of the page) – the content keeps its own keyboard handling -->
    <header v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <div v-if="$slots.start" :class="styles.start()"><slot name="start" /></div>
        <div v-if="$slots.default" :class="styles.center()"><slot /></div>
        <div v-if="$slots.end" :class="styles.end()"><slot name="end" /></div>
    </header>
</template>
