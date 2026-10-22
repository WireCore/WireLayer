import {
    areaPath,
    formatNumber,
    linePath,
    linePoints,
    sparkline,
    sparklineSummary,
} from '@wirecore/wirelayer-recipes/native';
import { View, type ViewProps } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { useLocale } from '../locale.js';
import { nativeAccessible, useChartColors } from './parts.js';

export interface SparklineProps extends Omit<ViewProps, 'children'> {
    data: number[];
    /** What the line shows, e.g. "Load over the last 24 hours" – starts the text alternative */
    label: string;
    /** Area under the line (default true) */
    fill?: boolean;
    /** Width in pt (default 128) */
    width?: number;
    /** Height in pt (default 32) */
    height?: number;
    /** Formats the values in the text alternative (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    className?: string;
}

/** Room for the stroke at the edges */
const PAD = 2;

/** Small curved line without axes; an image named by the trend and the extremes */
export function Sparkline({
    data,
    label,
    fill = true,
    width = 128,
    height = 32,
    formatValue,
    className,
    ...props
}: SparklineProps) {
    const { locale, translations } = useLocale();
    const colors = useChartColors();
    const format = formatValue ?? ((value: number) => formatNumber(value, locale));
    const numbers = data.filter((value) => Number.isFinite(value));
    const low = numbers.length ? Math.min(...numbers) : 0;
    const high = numbers.length ? Math.max(...numbers) : 1;
    const domain: [number, number] = [low, high > low ? high : low + 1];
    // From the bottom of the box: the area fills down to the lowest value
    const values = data.map((value) => ({ value: Number.isFinite(value) ? value : null, start: low, end: value }));
    const plot = { width: width - PAD * 2, height: height - PAD * 2, domain };
    const points = linePoints(values, plot);
    const line = linePath(points, true);
    const area = fill ? areaPath(points, linePoints(values, { ...plot, edge: 'start' }), true) : '';
    const color = colors.primary;
    return (
        <View
            {...props}
            role="img"
            aria-label={sparklineSummary(label, numbers, format, translations.chart)}
            {...nativeAccessible}
            className={sparkline({ class: className })}
        >
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden pointerEvents="none">
                <G transform={`translate(${PAD} ${PAD})`}>
                    {!!area && <Path d={area} fill={color} fillOpacity={0.15} />}
                    {!!line && (
                        <Path
                            d={line}
                            stroke={color}
                            strokeWidth={1.5}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            fill="none"
                        />
                    )}
                </G>
            </Svg>
        </View>
    );
}
