<script setup lang="ts">
import { formatList, formatValue as formatValueRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface FormatListProps {
    items: readonly string[];
    /** `conjunction` (default) "A, B, and C", `disjunction` "A, B, or C", `unit` "A, B, C" */
    type?: 'conjunction' | 'disjunction' | 'unit';
    /** `long` (default), `short`, `narrow` */
    formatStyle?: 'long' | 'short' | 'narrow';
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formatValueRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<FormatListProps>();
const formatValue = useRecipe('formatValue', formatValueRecipe, () => props.classes);
const attrs = useAttrs();
const localeContext = useLocale();
const text = computed(() =>
    formatList(props.items, props.locale ?? localeContext.value.locale, { type: props.type, style: props.formatStyle })
);
</script>

<template>
    <!-- A list as a sentence: "Anna, Ben, and Clara" -->
    <span v-bind="{ ...attrs, class: formatValue({ class: normalizeClass(attrs.class) }) }">{{ text }}</span>
</template>
