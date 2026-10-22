<script setup lang="ts">
import { formatBytes, formatValue as formatValueRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface FormatBytesProps {
    /** Size in bytes */
    value: number | null | undefined;
    /** `decimal` (default): 1000 per step, "1.2 MB"; `binary`: 1024 per step, "1.2 MiB" */
    base?: 'decimal' | 'binary';
    /** Decimals (default 1) */
    maximumFractionDigits?: number;
    /** `short` (default) "MB", `long` "Megabyte" (decimal only) */
    unitDisplay?: 'short' | 'long';
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formatValueRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<FormatBytesProps>();
const formatValue = useRecipe('formatValue', formatValueRecipe, () => props.classes);
const attrs = useAttrs();
const localeContext = useLocale();
const text = computed(() =>
    props.value === null || props.value === undefined
        ? ''
        : formatBytes(props.value, props.locale ?? localeContext.value.locale, {
              base: props.base,
              maximumFractionDigits: props.maximumFractionDigits,
              unitDisplay: props.unitDisplay,
          })
);
</script>

<template>
    <!-- A file or memory size: "1.2 MB" -->
    <span v-bind="{ ...attrs, class: formatValue({ class: normalizeClass(attrs.class) }) }">{{ text }}</span>
</template>
