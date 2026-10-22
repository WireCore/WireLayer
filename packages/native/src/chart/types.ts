import type { ChartReference, ChartRow, ChartSeries } from '@wirecore/wirelayer-recipes/native';
import type { ViewProps } from 'react-native';

/** Props of the ready-made chart types BarChart and LineChart */
export interface SeriesChartBaseProps extends Omit<ViewProps, 'children'> {
    /** The rows: one object per category with a value per series */
    data: ChartRow[];
    /** Property of each row with the category (x axis) */
    categoryKey: string;
    /**
     * The series: key of the value, label, colour, stack, dashed … (one value axis – `axis: 'end'` and `type` of the
     * web's CompositeChart are not drawn)
     */
    series: ChartSeries[];
    /** Title of the chart, also the start of its accessible name */
    title: string;
    /** Keep the title for screen readers only */
    hideTitle?: boolean;
    /** Height of the plot in pt (default 220) */
    height?: number;
    /** The data as a list below the chart (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats values in the axis, legend and data list (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    /**
     * Reference lines (`value`) and areas (`from`–`to`) on the value axis, or with `axis: 'x'` on the categories
     * (index of the row); also listed as text below the chart
     */
    references?: ChartReference[];
    /** Legend (default: with more than one series) */
    legend?: boolean;
    className?: string;
}
