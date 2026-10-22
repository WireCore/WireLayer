<script setup lang="ts">
import { collapse as collapseRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface CollapseProps {
    /** Shown (the height – or width – animates; closed content is out of the tab order) */
    open?: boolean;
    /** vertical: animates the height (default); horizontal: the width */
    orientation?: 'vertical' | 'horizontal';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof collapseRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CollapseProps>(), { open: false });
const collapse = useRecipe('collapse', collapseRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => collapse({ orientation: props.orientation }));
</script>

<template>
    <!--
        Content that opens and closes with an animated height (or width, motion-safe). Give it an id and point the
        button's aria-controls at it; the button carries aria-expanded.
    -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :data-state="open ? 'open' : 'closed'"
        :data-orientation="orientation ?? 'vertical'"
    >
        <div :class="styles.inner()"><slot /></div>
    </div>
</template>
