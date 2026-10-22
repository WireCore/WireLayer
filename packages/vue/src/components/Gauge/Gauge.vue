<script setup lang="ts">
import { GAUGE_ARC, gauge as gaugeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';
import { useLocale } from '../../locale.js';

export type GaugeStatus = 'neutral' | 'success' | 'warn' | 'danger';

export interface GaugeProps {
    value: number;
    min?: number;
    max?: number;
    /** Visible label below the gauge, also its accessible name */
    label: string;
    /** Colour of the arc (default: from `thresholds`, else neutral) */
    status?: GaugeStatus;
    /** From this value on the arc takes the status, e.g. [{ from: 70, status: 'warn' }, { from: 90, status: 'danger' }] */
    thresholds?: { from: number; status: GaugeStatus }[];
    size?: 'sm' | 'md' | 'lg';
    /** Number format of the value, min and max, e.g. { style: 'unit', unit: 'percent' } */
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof gaugeRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<GaugeProps>(), { min: 0, max: 100 });
const gauge = useRecipe('gauge', gaugeRecipe, () => props.classes);
const attrs = useAttrs();
const localeContext = useLocale();

const current = computed(
    () =>
        props.status ??
        [...(props.thresholds ?? [])].sort((a, b) => b.from - a.from).find((threshold) => props.value >= threshold.from)
            ?.status ??
        'neutral'
);
const styles = computed(() => gauge({ status: current.value, size: props.size }));
const format = (value: number) =>
    new Intl.NumberFormat(props.locale ?? localeContext.value.locale, props.formatOptions).format(value);
const share = computed(() =>
    props.max > props.min ? Math.min(1, Math.max(0, (props.value - props.min) / (props.max - props.min))) : 0
);
const arc = 'M10 62 A50 50 0 0 1 110 62';
</script>

<template>
    <!-- role="meter": a value in a known range; the arc is decoration, the value is named as text -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="meter"
        :aria-label="label"
        :aria-valuenow="value"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuetext="format(value)"
    >
        <svg :class="styles.svg()" viewBox="0 0 120 74" aria-hidden="true">
            <path :class="styles.track()" :d="arc" stroke-width="10" />
            <path
                :class="styles.range()"
                :d="arc"
                stroke-width="10"
                :stroke-dasharray="`${share * GAUGE_ARC} ${GAUGE_ARC}`"
            />
            <text :class="styles.value()" x="60" y="58" text-anchor="middle">{{ format(value) }}</text>
            <text :class="styles.bounds()" x="10" y="73" text-anchor="middle">{{ format(min) }}</text>
            <text :class="styles.bounds()" x="110" y="73" text-anchor="middle">{{ format(max) }}</text>
        </svg>
        <span :class="styles.label()" aria-hidden="true">{{ label }}</span>
    </div>
</template>
