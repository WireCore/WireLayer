<script setup lang="ts">
import { type MeterColor, meterGroup as meterGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface MeterGroupItem {
    label: string;
    value: number;
    color?: MeterColor;
}

export interface MeterGroupProps {
    items: readonly MeterGroupItem[];
    /** Visible label, e.g. "Storage" */
    label: string;
    /** The whole (default: the sum of the values) */
    max?: number;
    /** Text of a value in the legend (default: percent of max) */
    formatValue?: (value: number, max: number) => string;
    /** Vertical bar growing from the bottom, the legend next to it */
    orientation?: 'horizontal' | 'vertical';
    /** Where the legend is: bottom (default), top, start or end */
    legendPosition?: 'top' | 'bottom' | 'start' | 'end';
    /** Legend entries in a row (default) or one below the other */
    legendOrientation?: 'horizontal' | 'vertical';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof meterGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MeterGroupProps>(), {
    max: undefined,
    formatValue: (value: number, max: number) => `${Math.round((value / max) * 100)} %`,
});
const meterGroup = useRecipe('meterGroup', meterGroupRecipe, () => props.classes);
const attrs = useAttrs();
const id = useId();
const total = computed(() => props.max ?? props.items.reduce((sum, item) => sum + item.value, 0));
const palette: MeterColor[] = ['primary', 'info', 'success', 'warn', 'danger', 'muted'];
const colorOf = (item: MeterGroupItem, index: number) => item.color ?? palette[index % palette.length]!;
const styles = computed(() =>
    meterGroup({
        orientation: props.orientation,
        legendPosition: props.legendPosition,
        legendLayout: props.legendOrientation === 'vertical' ? 'stacked' : undefined,
    })
);
const sizeKey = computed(() => (props.orientation === 'vertical' ? 'height' : 'width'));
</script>

<template>
    <!-- One bar for the parts (visual), the legend lists every part with its value as text -->
    <div
        role="group"
        :aria-labelledby="`${id}label`"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
    >
        <span :id="`${id}label`" :class="styles.label()">{{ label }}</span>
        <div :class="styles.bar()" aria-hidden="true">
            <span
                v-for="(item, index) in items"
                :key="item.label"
                :class="meterGroup({ color: colorOf(item, index), orientation }).segment()"
                :style="{ [sizeKey]: `${(item.value / total) * 100}%` }"
            />
        </div>
        <ul :class="styles.legend()">
            <li v-for="(item, index) in items" :key="item.label" :class="styles.legendItem()">
                <span :class="meterGroup({ color: colorOf(item, index) }).swatch()" aria-hidden="true" />
                {{ item.label }}
                <span :class="styles.value()">{{ formatValue(item.value, total) }}</span>
            </li>
        </ul>
    </div>
</template>
