// Chart on Chart.js – requires chart.js (optional peer dependency)
export { default as Chart, type ChartProps } from './Chart.vue';
export { default as Sparkline, type SparklineProps } from './Sparkline.vue';
export { default as BarChart } from './BarChart.vue';
export { default as LineChart } from './LineChart.vue';
export { default as CompositeChart } from './CompositeChart.vue';
export { default as WaterfallChart } from './WaterfallChart.vue';
export { default as PieChart } from './PieChart.vue';
export type {
    BarChartProps,
    CompositeChartProps,
    LineChartProps,
    PieChartProps,
    SeriesChartBaseProps,
    WaterfallChartProps,
} from './types.js';
export type {
    ChartReference,
    ChartRow,
    ChartSeries,
    ChartTone,
    PieSlice,
    WaterfallStep,
} from '@wirecore/wirelayer-recipes';
