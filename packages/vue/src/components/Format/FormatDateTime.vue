<script setup lang="ts">
import {
    formatDateTime,
    formatValue as formatValueRecipe,
    toDateTimeAttribute,
    type DateInput,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface FormatDateTimeProps {
    /** The point in time: Date, ISO text or milliseconds */
    value: DateInput;
    /** Intl format, e.g. { dateStyle: 'full', timeStyle: 'short' } (default: medium date, short time) */
    formatOptions?: Intl.DateTimeFormatOptions;
    /** Time zone to show the time in, e.g. "Europe/Berlin" (default: the browser's – pass one for server rendering) */
    timeZone?: string;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formatValueRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<FormatDateTimeProps>();
const formatValue = useRecipe('formatValue', formatValueRecipe, () => props.classes);
const attrs = useAttrs();
const localeContext = useLocale();
const text = computed(() =>
    formatDateTime(props.value, props.locale ?? localeContext.value.locale, {
        ...props.formatOptions,
        ...(props.timeZone ? { timeZone: props.timeZone } : {}),
    })
);
</script>

<template>
    <!-- Date and time in the format of the locale, in a <time> with the machine-readable value -->
    <time
        v-bind="{ ...attrs, class: formatValue({ class: normalizeClass(attrs.class) }) }"
        :datetime="toDateTimeAttribute(value)"
        >{{ text }}</time
    >
</template>
