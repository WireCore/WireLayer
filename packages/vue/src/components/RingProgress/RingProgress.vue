<script setup lang="ts">
import {
    type MeterColor,
    ringParts,
    ringProgress as ringProgressRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface RingProgressSegment {
    value: number;
    /** Name in the legend */
    label?: string;
    color?: MeterColor;
}

export interface RingProgressProps {
    /** One value (a progress bar) – or `segments` */
    value?: number;
    /** Several parts one after another (a group with a legend) */
    segments?: readonly RingProgressSegment[];
    /** The whole (default 100, or the sum of the segments when larger) */
    max?: number;
    /** Visible label below the ring, also its accessible name */
    label: string;
    size?: 'sm' | 'md' | 'lg';
    /** Width of the ring in % of its size (default 10) */
    thickness?: number;
    /** Round line ends (one value only) */
    roundCaps?: boolean;
    /** Show the legend of the segments (otherwise only for screen readers) */
    legend?: boolean;
    /** Text of a value, in the middle and the legend (default: percent of max) */
    formatValue?: (value: number, max: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof ringProgressRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<RingProgressProps>(), {
    value: undefined,
    segments: undefined,
    max: undefined,
    thickness: 10,
    legend: true,
    formatValue: (value: number, max: number) => `${Math.round((value / max) * 100)} %`,
});
defineSlots<{
    /** Content in the middle of the ring (default: the value) */
    center?(): unknown;
}>();
const ringProgress = useRecipe('ringProgress', ringProgressRecipe, () => props.classes);
const attrs = useAttrs();
const labelId = `${useId()}label`;
const palette: MeterColor[] = ['primary', 'info', 'success', 'warn', 'danger', 'muted'];
const parts = computed(
    () => props.segments ?? (props.value === undefined ? [] : [{ value: props.value, color: 'primary' as MeterColor }])
);
const total = computed(() => parts.value.reduce((sum, part) => sum + Math.max(0, part.value), 0));
const whole = computed(() => props.max ?? Math.max(100, total.value));
const single = computed(() => !props.segments);
const radius = computed(() => 50 - props.thickness / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const arcs = computed(() =>
    ringParts(
        parts.value.map((part) => part.value),
        whole.value,
        parts.value.length > 1 ? 0.006 : 0
    ).map((arc, index) => {
        const part = parts.value[index]!;
        return {
            key: part.label ?? String(index),
            color: part.color ?? palette[index % palette.length]!,
            dasharray: `${arc.length * circumference.value} ${circumference.value}`,
            dashoffset: -arc.start * circumference.value,
        };
    })
);
const text = computed(() => props.formatValue(total.value, whole.value));
const styles = computed(() => ringProgress({ size: props.size, hideLegend: !props.legend }));
</script>

<template>
    <!--
        One value: the ring is a progress bar named by the label. Segments: a group named by the label, the legend
        lists every part with its value as text. The drawing itself is hidden from screen readers.
    -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :role="single ? undefined : 'group'"
        :aria-labelledby="single ? undefined : labelId"
    >
        <div
            :class="styles.ring()"
            :role="single ? 'progressbar' : undefined"
            :aria-labelledby="single ? labelId : undefined"
            :aria-valuenow="single ? total : undefined"
            :aria-valuemin="single ? 0 : undefined"
            :aria-valuemax="single ? whole : undefined"
            :aria-valuetext="single ? text : undefined"
        >
            <svg :class="styles.svg()" viewBox="0 0 100 100" aria-hidden="true">
                <circle :class="styles.track()" cx="50" cy="50" :r="radius" :stroke-width="thickness" />
                <circle
                    v-for="arc in arcs"
                    :key="arc.key"
                    :class="ringProgress({ color: arc.color }).segment()"
                    cx="50"
                    cy="50"
                    :r="radius"
                    :stroke-width="thickness"
                    :stroke-dasharray="arc.dasharray"
                    :stroke-dashoffset="arc.dashoffset"
                    :stroke-linecap="single && roundCaps && total > 0 ? 'round' : undefined"
                />
            </svg>
            <div :class="styles.center()" :aria-hidden="single || undefined">
                <slot name="center">
                    <span :class="styles.value()">{{ text }}</span>
                </slot>
            </div>
        </div>
        <span :id="labelId" :class="styles.label()">{{ label }}</span>
        <ul v-if="segments?.length" :class="styles.legend()">
            <li v-for="(part, index) in segments" :key="part.label ?? index" :class="styles.legendItem()">
                <span :class="ringProgress({ color: arcs[index]!.color }).swatch()" aria-hidden="true" />
                {{ part.label }}
                <span :class="styles.legendValue()">{{ formatValue(part.value, whole) }}</span>
            </li>
        </ul>
    </div>
</template>
