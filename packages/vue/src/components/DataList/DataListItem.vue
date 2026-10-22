<script setup lang="ts">
import { dataList as dataListRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, inject, normalizeClass, useAttrs } from 'vue';
import { dataListKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface DataListItemProps {
    /** The term (<dt>); the slot is its value (<dd>) */
    label: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dataListRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<DataListItemProps>();
const dataList = useRecipe('dataList', dataListRecipe, () => props.classes);
const attrs = useAttrs();
const parent = inject(dataListKey, null);
const styles = computed(() => parent?.value ?? dataList());
</script>

<template>
    <div v-bind="{ ...attrs, class: styles.item({ class: normalizeClass(attrs.class) }) }">
        <dt :class="styles.term()">{{ label }}</dt>
        <dd :class="styles.details()"><slot /></dd>
    </div>
</template>
