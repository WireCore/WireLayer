<script setup lang="ts">
import { Minus, TrendingDown, TrendingUp } from '@lucide/vue';
import {
    animateNumber,
    formatNumber,
    formatTrend,
    prefersMotion,
    statistic as statisticRecipe,
    statisticTrend,
    visuallyHidden,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, ref, useAttrs, watch, type Component } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface StatisticProps {
    /** What the number is, e.g. "Revenue" */
    label: string;
    /** The number; null or undefined shows nothing (or the placeholder while loading) */
    value?: number | null;
    /** Format of the value, e.g. { style: 'currency', currency: 'EUR' } or { notation: 'compact' } */
    formatOptions?: Intl.NumberFormatOptions;
    /** Unit (Intl unit identifier), e.g. "percent", "kilobyte", "hour" – formatted with the locale */
    unit?: string;
    /** Text before the value, e.g. "≈" */
    prefix?: string;
    /** Text after the value, e.g. "users" */
    suffix?: string;
    /** Change in percent, e.g. 12 → "+12%" with an arrow; color comes on top of arrow and text */
    trend?: number | null;
    /** Text after the trend, e.g. "vs. last month" */
    trendLabel?: string;
    /** Format of the trend (default: percent with sign, one decimal) */
    trendFormatOptions?: Intl.NumberFormatOptions;
    /** Falling is good (e.g. error rate, costs): down is green, up red */
    invertTrend?: boolean;
    /** Text below the value */
    description?: string;
    /** Icon next to the label */
    icon?: Component;
    /** The value is being loaded: placeholder and aria-busy */
    loading?: boolean;
    /**
     * Counts up to a new value (only when the user allows motion). Screen readers get the final value right away,
     * not the counting
     */
    animate?: boolean;
    /** Announces changes of the value (polite live region) – for values that update by themselves */
    live?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /** In a card with border and padding */
    bordered?: boolean;
    /** Locale of the number formats (default: the LocaleProvider's) */
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof statisticRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<StatisticProps>();
const statistic = useRecipe('statistic', statisticRecipe, () => props.classes);
const slots = defineSlots<{ chart?(): unknown }>();
const attrs = useAttrs();
const localeContext = useLocale();
const locale = computed(() => props.locale ?? localeContext.value.locale);
const trendState = computed(() => statisticTrend(props.trend, props.invertTrend));
const styles = computed(() => statistic({ size: props.size, tone: trendState.value.tone, bordered: props.bordered }));
const options = computed<Intl.NumberFormatOptions | undefined>(() =>
    props.unit ? { style: 'unit', unit: props.unit, ...props.formatOptions } : props.formatOptions
);
const format = (value: number | null | undefined) => formatNumber(value, locale.value, options.value);
const text = computed(() => format(props.value));
const trendText = computed(() =>
    props.trend === null || props.trend === undefined
        ? ''
        : formatTrend(props.trend, locale.value, props.trendFormatOptions)
);
const trendIcons = { up: TrendingUp, down: TrendingDown, flat: Minus };

// Counting: while a new value is counted up, `frame` is the number shown (null otherwise)
const frame = ref<number | null>(null);
let stop = () => {};
watch(
    () => props.value,
    (next, previous) => {
        stop();
        frame.value = null;
        if (!props.animate || typeof next !== 'number' || typeof previous !== 'number' || !prefersMotion()) return;
        const whole = Number.isInteger(next) && Number.isInteger(previous);
        stop = animateNumber(previous, next, (value) => {
            frame.value = value === next ? null : whole ? Math.round(value) : value;
        });
    }
);
onBeforeUnmount(() => stop());
const counting = computed(() => props.animate && frame.value !== null);
const hidden = visuallyHidden();
</script>

<template>
    <!-- Label, value (with prefix/suffix and unit), trend as arrow + text, optional chart -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :aria-busy="loading || undefined"
    >
        <div :class="styles.header()">
            <span :class="styles.label()">{{ label }}</span>
            <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
        </div>
        <div :class="styles.value()" :aria-live="live ? 'polite' : undefined" :aria-atomic="live ? 'true' : undefined">
            <span v-if="prefix" :class="styles.affix()">{{ prefix }}</span>
            <template v-if="loading">
                <span :class="styles.placeholder()" aria-hidden="true" />
                <span :class="hidden">{{ localeContext.translations.statistic.loading }}</span>
            </template>
            <template v-else-if="animate">
                <span aria-hidden="true">{{ counting ? format(frame) : text }}</span>
                <span :class="hidden">{{ text }}</span>
            </template>
            <span v-else>{{ text }}</span>
            <span v-if="suffix" :class="styles.affix()">{{ suffix }}</span>
        </div>
        <p v-if="trendText || trendLabel || description" :class="styles.footer()">
            <span v-if="trendText" :class="styles.trend()">
                <component :is="trendIcons[trendState.direction]" :class="styles.trendIcon()" aria-hidden="true" />{{
                    trendText
                }}
            </span>
            <span v-if="trendLabel">{{ trendLabel }}</span>
            <span v-if="description" :class="styles.description()">{{ description }}</span>
        </p>
        <div v-if="slots.chart" :class="styles.chart()"><slot name="chart" /></div>
    </div>
</template>
