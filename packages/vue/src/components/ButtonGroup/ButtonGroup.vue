<script setup lang="ts">
import { buttonGroup as buttonGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface ButtonGroupProps {
    /** Accessible name of the group (role="group"), e.g. "View"; or pass aria-labelledby */
    label?: string;
    /** Buttons side by side (default) or stacked */
    orientation?: 'horizontal' | 'vertical';
    /** Full width of the container; the buttons share it */
    block?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof buttonGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ButtonGroupProps>(), { orientation: 'horizontal', block: undefined });
const buttonGroup = useRecipe('buttonGroup', buttonGroupRecipe, () => props.classes);
const attrs = useAttrs();
const className = computed(() =>
    buttonGroup({ orientation: props.orientation, block: props.block, class: normalizeClass(attrs.class) })
);
</script>

<template>
    <!-- Joined buttons: only the outer corners stay round; each button keeps its own tab stop -->
    <div v-bind="{ ...attrs, class: className }" role="group" :aria-label="label" :data-orientation="orientation">
        <slot />
    </div>
</template>
