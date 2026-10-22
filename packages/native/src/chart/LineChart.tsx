import { SeriesChartView } from './SeriesChartView.js';
import type { SeriesChartBaseProps } from './types.js';

export interface LineChartProps extends SeriesChartBaseProps {
    /** Curved lines (monotone – never past the values) */
    curved?: boolean;
    /** Fill the area below every line (an area chart) */
    area?: boolean;
    /** Stack all series (with `area`: stacked areas) */
    stacked?: boolean;
}

/**
 * Lines (or areas) over the categories – curved, stacked, with reference lines – drawn with react-native-svg. An
 * image named by the title and the trend of each series; the data list below is the text alternative.
 */
export function LineChart(props: LineChartProps) {
    return <SeriesChartView {...props} kind="line" />;
}
