import type {
    chart as chartRecipe,
    ChartReference,
    ChartRow,
    ChartSeries,
    ChartTone,
    PieSlice,
    RecipeClasses,
    WaterfallStep,
} from '@wirecore/wirelayer-recipes';

/** Props of the ready-made chart types BarChart, LineChart and CompositeChart */
export interface SeriesChartBaseProps {
    /** The rows: one object per category with a value per series */
    data: ChartRow[];
    /** Property of each row with the category (x axis) */
    categoryKey: string;
    /** The series: key of the value, label, colour, axis, stack … */
    series: ChartSeries[];
    /** Title of the chart, also its accessible name */
    title: string;
    /** Keep the title for screen readers only */
    hideTitle?: boolean;
    /** Height of the chart area (CSS length, default 18rem) */
    height?: string;
    /** The data as a table below the chart (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats values in the axis, tooltips, legend and table (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    /** Reference lines (`value`) and areas (`from`–`to`), on the value axis or with `axis: 'x'` on the categories */
    references?: ChartReference[];
    /** Logarithmic value axis */
    scale?: 'linear' | 'logarithmic';
    /** Legend (default: with more than one series) */
    legend?: boolean;
    /** A small overview below with a range to zoom into (keyboard: the slider's arrow keys) */
    brush?: boolean;
    /** Shown rows with `brush` (inclusive indexes) – use with v-model:range */
    range?: [number, number];
    defaultRange?: [number, number];
    /** Chart.js options – merged over the WireLayer defaults */
    options?: Record<string, unknown>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe chart) */
    classes?: RecipeClasses<typeof chartRecipe>;
}

export interface BarChartProps extends SeriesChartBaseProps {
    /** Bars from the start edge instead of from the bottom */
    horizontal?: boolean;
    /** Stack all series */
    stacked?: boolean;
}

export interface LineChartProps extends SeriesChartBaseProps {
    /** Curved lines */
    curved?: boolean;
    /** Fill the area below every line (an area chart) */
    area?: boolean;
    /** Stack all series (with `area`: stacked areas) */
    stacked?: boolean;
}

export interface CompositeChartProps extends SeriesChartBaseProps {
    /** Curved lines */
    curved?: boolean;
    /** Stack the bars */
    stacked?: boolean;
}

export interface WaterfallChartProps {
    /** Changes and totals in order (`total: true` shows the running sum) */
    steps: WaterfallStep[];
    /** Title of the chart, also its accessible name */
    title: string;
    hideTitle?: boolean;
    /** Height of the chart area (CSS length, default 18rem) */
    height?: string;
    /** The steps as a table below (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats values in the axis, tooltips and table */
    formatValue?: (value: number) => string;
    /** Colours of rising, falling and total bars (default success, danger, primary) */
    tones?: { up?: ChartTone; down?: ChartTone; total?: ChartTone };
    /** Chart.js options – merged over the WireLayer defaults */
    options?: Record<string, unknown>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe chart) */
    classes?: RecipeClasses<typeof chartRecipe>;
}

export interface PieChartProps {
    /** The slices: label, value, colour */
    slices: PieSlice[];
    /** Title of the chart, also its accessible name */
    title: string;
    hideTitle?: boolean;
    /** A ring instead of a full pie */
    donut?: boolean;
    /** Height of the chart area (CSS length, default 14rem) */
    height?: string;
    /** Legend beside the chart with value and share of each slice (default true) */
    legend?: boolean;
    /** The slices as a table below (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats values in the legend, tooltips and table */
    formatValue?: (value: number) => string;
    /** Chart.js options – merged over the WireLayer defaults */
    options?: Record<string, unknown>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe chart) */
    classes?: RecipeClasses<typeof chartRecipe>;
}
