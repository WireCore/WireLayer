<script setup lang="ts">
import { badge as badgeRecipe, type BadgeVariant, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface BadgeProps {
    variant?: BadgeVariant;
    /** Icon component rendered before the text */
    icon?: Component;
    /** Props passed on to the icon component, e.g. { fill: 'currentColor' } for a filled icon or { strokeWidth: 1.5 } */
    iconProps?: Record<string, unknown>;
    /** Round shape for a count or a single character (grows into a pill for longer content) */
    circle?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof badgeRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<BadgeProps>(), { circle: undefined });
const badge = useRecipe('badge', badgeRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => badge({ variant: props.variant, circle: props.circle }));
</script>

<template>
    <span v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <component :is="icon" v-if="icon" v-bind="iconProps" :class="styles.icon()" aria-hidden="true" />
        <slot />
    </span>
</template>
