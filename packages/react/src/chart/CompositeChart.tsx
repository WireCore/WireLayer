import { SeriesChartView } from './SeriesChartView.js';
import type { SeriesChartBaseProps } from './types.js';

export interface CompositeChartProps extends SeriesChartBaseProps {
    /** Curved lines */
    curved?: boolean;
    /** Stack the bars */
    stacked?: boolean;
}

/** Bars and lines in one chart (series[].type), e.g. revenue as bars and margin as a line on a second axis */
export function CompositeChart(props: CompositeChartProps) {
    return <SeriesChartView {...props} kind="composite" />;
}
