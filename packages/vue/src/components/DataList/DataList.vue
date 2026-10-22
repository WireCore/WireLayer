<script setup lang="ts">
import { dataList as dataListRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, useAttrs } from 'vue';
import { dataListKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface DataListProps {
    /** Label above its value, or next to it (labels line up in a column) */
    orientation?: 'vertical' | 'horizontal';
    /** Lines between the items */
    divided?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dataListRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<DataListProps>();
const dataList = useRecipe('dataList', dataListRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => dataList({ orientation: props.orientation, divided: props.divided }));
provide(dataListKey, styles);
</script>

<template>
    <!-- Terms and values as a description list (<dl>), e.g. the details of a record -->
    <dl v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <slot />
    </dl>
</template>
