import type {
    chart as chartRecipe,
    ChartReference,
    ChartRow,
    ChartSeries,
    RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import type { CSSProperties } from 'react';

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
    /** Shown rows with `brush` (inclusive indexes, controlled) */
    range?: [number, number];
    defaultRange?: [number, number];
    onRangeChange?: (range: [number, number]) => void;
    /** Chart.js options – merged over the WireLayer defaults */
    options?: Record<string, unknown>;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe chart) */
    classes?: RecipeClasses<typeof chartRecipe>;
}
