<script setup lang="ts">
import {
    formatDateTime,
    formatRelativeTime,
    formatValue as formatValueRecipe,
    relativeTimeRefresh,
    toDateTimeAttribute,
    type DateInput,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface FormatRelativeTimeProps {
    /** The point in time: Date, ISO text or milliseconds */
    value: DateInput;
    /** Reference time (default: now) – pass it for the same text on the server and in the browser */
    now?: DateInput;
    /** Updates the text as time passes (every 10 s, minute or hour, depending on the distance) */
    live?: boolean;
    /** `auto` (default): "yesterday", "tomorrow"; `always`: "1 day ago" */
    numeric?: 'auto' | 'always';
    /** `long` (default) "3 minutes ago", `short` "3 min. ago", `narrow` */
    formatStyle?: 'long' | 'short' | 'narrow';
    /** The exact date and time as the title (tooltip) – default true */
    showTitle?: boolean;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formatValueRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<FormatRelativeTimeProps>(), { showTitle: true });
const formatValue = useRecipe('formatValue', formatValueRecipe, () => props.classes);
const attrs = useAttrs();
const localeContext = useLocale();
const locale = computed(() => props.locale ?? localeContext.value.locale);
// The reference time: `now` (or the time of the first render), later the time of each update
const current = ref<DateInput>(props.now ?? Date.now());
watch(
    () => props.now,
    (now) => {
        if (now !== undefined) current.value = now;
    }
);
const text = computed(() =>
    formatRelativeTime(props.value, locale.value, {
        now: current.value,
        numeric: props.numeric,
        style: props.formatStyle,
    })
);
let timer: ReturnType<typeof setTimeout> | undefined;
const schedule = () => {
    clearTimeout(timer);
    if (!props.live) return;
    timer = setTimeout(
        () => {
            current.value = Date.now();
            schedule();
        },
        relativeTimeRefresh(props.value, current.value)
    );
};
onMounted(schedule);
watch(() => [props.live, props.value], schedule);
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
    <!-- "3 minutes ago" in a <time> with the exact point as datetime (and title) -->
    <time
        v-bind="{ ...attrs, class: formatValue({ class: normalizeClass(attrs.class) }) }"
        :datetime="toDateTimeAttribute(value)"
        :title="showTitle ? formatDateTime(value, locale) || undefined : undefined"
        >{{ text }}</time
    >
</template>
