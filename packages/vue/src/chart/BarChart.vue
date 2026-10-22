<script setup lang="ts">
import SeriesChartView from './SeriesChartView.vue';
import type { BarChartProps } from './types.js';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<BarChartProps>(), {
    hideTitle: false,
    height: '18rem',
    table: true,
    legend: undefined,
    brush: false,
    range: undefined,
    defaultRange: undefined,
    horizontal: false,
    stacked: false,
});
const emit = defineEmits<{ 'update:range': [range: [number, number]] }>();
</script>

<template>
    <!-- Bars per category for one or more series – vertical or horizontal, grouped or stacked; canvas named by the title, the data table is its text alternative -->
    <SeriesChartView v-bind="{ ...$attrs, ...props }" kind="bar" @update:range="emit('update:range', $event)" />
</template>
