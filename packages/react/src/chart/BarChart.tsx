import { SeriesChartView } from './SeriesChartView.js';
import type { SeriesChartBaseProps } from './types.js';

export interface BarChartProps extends SeriesChartBaseProps {
    /** Bars from the start edge instead of from the bottom */
    horizontal?: boolean;
    /** Stack all series */
    stacked?: boolean;
}

/**
 * Bars per category for one or more series – vertical or horizontal, grouped or stacked; canvas named by the title,
 * the data table is its text alternative
 */
export function BarChart(props: BarChartProps) {
    return <SeriesChartView {...props} kind="bar" />;
}
