<script setup lang="ts">
import { Circle, CircleCheck, Info, OctagonX, TriangleAlert } from '@lucide/vue';
import { type RecipeClasses, statusDot as statusDotRecipe, type StatusDotStatus } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface StatusDotProps {
    /** Colour of the dot – always pair it with a text label, colour alone is not enough */
    status?: StatusDotStatus;
    /** Pulsing dot for live states (off with reduced motion) */
    pulse?: boolean;
    /**
     * Status icon instead of the dot – shape as a second cue next to colour and text. `true` uses the icon of the
     * status (check, info, warning, error), or pass an icon component
     */
    icon?: boolean | Component;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof statusDotRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<StatusDotProps>(), { icon: undefined });
const statusDot = useRecipe('statusDot', statusDotRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => statusDot({ status: props.status, pulse: props.pulse }));
const statusIcons = { neutral: Circle, success: CircleCheck, info: Info, warn: TriangleAlert, danger: OctagonX };
const iconComponent = computed(() =>
    props.icon === true ? statusIcons[props.status ?? 'neutral'] : props.icon || undefined
);
</script>

<template>
    <span v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <component :is="iconComponent" v-if="iconComponent" :class="styles.icon()" aria-hidden="true" />
        <span v-else :class="styles.dot()" aria-hidden="true" />
        <slot />
    </span>
</template>
