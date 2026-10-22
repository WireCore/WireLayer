<script setup lang="ts">
import { formatCount, overlayBadge as overlayBadgeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useRecipe } from '../../recipes.js';

export interface OverlayBadgeProps {
    /** Number on the badge; without it a dot is shown */
    count?: number;
    /** Highest number shown, above it "99+" */
    max?: number;
    /** Text for screen readers, e.g. "3 unread messages" – the badge itself is only visual */
    label: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof overlayBadgeRecipe>;
}

const props = withDefaults(defineProps<OverlayBadgeProps>(), { count: undefined, max: 99 });
const overlayBadge = useRecipe('overlayBadge', overlayBadgeRecipe, () => props.classes);
const styles = overlayBadge();
</script>

<template>
    <!-- Count or dot on the corner of the slotted element; screen readers get the label instead -->
    <span :class="styles.base()">
        <slot />
        <span v-if="count === undefined" :class="styles.dot()" aria-hidden="true" />
        <span v-else-if="count > 0" :class="styles.badge()" aria-hidden="true">{{ formatCount(count, max) }}</span>
        <span :class="styles.label()">{{ label }}</span>
    </span>
</template>
