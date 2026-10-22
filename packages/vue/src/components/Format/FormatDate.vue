<script setup lang="ts">
import {
    formatDate,
    formatValue as formatValueRecipe,
    toDateTimeAttribute,
    type DateInput,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface FormatDateProps {
    /** The date: Date, ISO text ("2026-10-21") or milliseconds */
    value: DateInput;
    /** Intl format, e.g. { dateStyle: 'long' } or { weekday: 'long', day: 'numeric', month: 'long' } (default medium) */
    formatOptions?: Intl.DateTimeFormatOptions;
    /** Time zone to show the date in, e.g. "Europe/Berlin" (default: the browser's – pass one for server rendering) */
    timeZone?: string;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formatValueRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<FormatDateProps>();
const formatValue = useRecipe('formatValue', formatValueRecipe, () => props.classes);
const attrs = useAttrs();
const localeContext = useLocale();
const text = computed(() =>
    formatDate(props.value, props.locale ?? localeContext.value.locale, {
        ...props.formatOptions,
        ...(props.timeZone ? { timeZone: props.timeZone } : {}),
    })
);
</script>

<template>
    <!-- A date in the format of the locale, in a <time> with the machine-readable value -->
    <time
        v-bind="{ ...attrs, class: formatValue({ class: normalizeClass(attrs.class) }) }"
        :datetime="toDateTimeAttribute(value)"
        >{{ text }}</time
    >
</template>
