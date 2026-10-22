import { SeriesChartView } from './SeriesChartView.js';
import type { SeriesChartBaseProps } from './types.js';

export interface LineChartProps extends SeriesChartBaseProps {
    /** Curved lines */
    curved?: boolean;
    /** Fill the area below every line (an area chart) */
    area?: boolean;
    /** Stack all series (with `area`: stacked areas) */
    stacked?: boolean;
}

/** Lines (or areas) over the categories – curved, stacked, with reference lines; the data table is the text */
export function LineChart(props: LineChartProps) {
    return <SeriesChartView {...props} kind="line" />;
}
