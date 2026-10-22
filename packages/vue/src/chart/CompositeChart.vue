<script setup lang="ts">
import SeriesChartView from './SeriesChartView.vue';
import type { CompositeChartProps } from './types.js';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CompositeChartProps>(), {
    hideTitle: false,
    height: '18rem',
    table: true,
    legend: undefined,
    brush: false,
    range: undefined,
    defaultRange: undefined,
    curved: false,
    stacked: false,
});
const emit = defineEmits<{ 'update:range': [range: [number, number]] }>();
</script>

<template>
    <!-- Bars and lines in one chart (series[].type), e.g. revenue as bars and margin as a line on a second axis; canvas named by the title, the data table is its text alternative -->
    <SeriesChartView v-bind="{ ...$attrs, ...props }" kind="composite" @update:range="emit('update:range', $event)" />
</template>
