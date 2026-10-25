<script setup lang="ts">
import { emptyState as emptyStateRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface EmptyStateProps {
    title: string;
    /** Text below the title (also via #description) */
    description?: string;
    /** Icon component above the title */
    icon?: Component;
    variant?: 'plain' | 'dashed';
    size?: 'sm' | 'md';
    /** Renders the title as a heading of this level – without it the title is a paragraph */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof emptyStateRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<EmptyStateProps>();
defineSlots<{
    /** Own description, e.g. with a link (instead of `description`) */
    description?(): unknown;
    /** Buttons below the text, e.g. "Create the first entry" */
    actions?(): unknown;
}>();
const emptyState = useRecipe('emptyState', emptyStateRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => emptyState({ variant: props.variant, size: props.size }));
</script>

<template>
    <!-- Placeholder for an empty list, table or search result, with the next step as actions -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <span v-if="icon" :class="styles.icon()">
            <component :is="icon" :class="styles.iconSvg()" aria-hidden="true" />
        </span>
        <component :is="headingLevel ? `h${headingLevel}` : 'p'" :class="styles.title()">{{ title }}</component>
        <p v-if="description || $slots.description" :class="styles.description()">
            <slot name="description">{{ description }}</slot>
        </p>
        <div v-if="$slots.actions" :class="styles.actions()"><slot name="actions" /></div>
    </div>
</template>
