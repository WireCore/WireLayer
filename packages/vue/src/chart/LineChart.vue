<script setup lang="ts">
import SeriesChartView from './SeriesChartView.vue';
import type { LineChartProps } from './types.js';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<LineChartProps>(), {
    hideTitle: false,
    height: '18rem',
    table: true,
    legend: undefined,
    brush: false,
    range: undefined,
    defaultRange: undefined,
    curved: false,
    area: false,
    stacked: false,
});
const emit = defineEmits<{ 'update:range': [range: [number, number]] }>();
</script>

<template>
    <!-- Lines (or areas) over the categories – curved, stacked, with reference lines; canvas named by the title, the data table is its text alternative -->
    <SeriesChartView v-bind="{ ...$attrs, ...props }" kind="line" @update:range="emit('update:range', $event)" />
</template>
