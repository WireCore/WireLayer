<script setup lang="ts">
import { numberFormatter as numberFormatterRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const localeContext = useLocale();

export interface NumberFormatterProps {
    value: number | bigint | null | undefined;
    /** Format, e.g. { style: 'currency', currency: 'EUR' } or { notation: 'compact' } */
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof numberFormatterRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<NumberFormatterProps>();
const numberFormatter = useRecipe('numberFormatter', numberFormatterRecipe, () => props.classes);
const attrs = useAttrs();
const text = computed(() =>
    props.value === null || props.value === undefined
        ? ''
        : new Intl.NumberFormat(props.locale ?? localeContext.value.locale, props.formatOptions).format(props.value)
);
</script>

<template>
    <!-- A number in the format of the locale ("€1,234.50") -->
    <span v-bind="{ ...attrs, class: numberFormatter({ class: normalizeClass(attrs.class) }) }">{{ text }}</span>
</template>
