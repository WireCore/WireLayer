import { arcPath, chart, formatNumber, pieArcs, pieLegend, type PieSlice } from '@wirecore/wirelayer-recipes/native';
import { Text, View, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLocale } from '../locale.js';
import { ChartData, ChartLegend, nativeAccessible, useChartColors } from './parts.js';

export interface PieChartProps extends Omit<ViewProps, 'children'> {
    /** The slices: label, value, colour */
    slices: PieSlice[];
    /** Title of the chart, also the start of its accessible name */
    title: string;
    /** Keep the title for screen readers only */
    hideTitle?: boolean;
    /** A ring instead of a full pie */
    donut?: boolean;
    /** Height (and width) of the pie in pt (default 180) */
    height?: number;
    /** Legend beside the pie with value and share of each slice (default true) */
    legend?: boolean;
    /** The slices as a list below (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats values in the legend and the list (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    className?: string;
}

/**
 * Pie or doughnut drawn with react-native-svg – an image named by the title and the share of each slice; the legend
 * lists value and share, the data list below is the text alternative
 */
export function PieChart({
    slices,
    title,
    hideTitle = false,
    donut = false,
    height = 180,
    legend = true,
    table = true,
    formatValue,
    className,
    ...props
}: PieChartProps) {
    const { locale, translations } = useLocale();
    const t = translations.chart;
    const styles = chart();
    const colors = useChartColors();
    const format = formatValue ?? ((value: number) => formatNumber(value, locale));
    const rows = pieLegend(slices, format, locale);
    // A small gap between the slices, so neighbours in similar colours stay apart
    const arcs = pieArcs(
        slices.map((slice) => slice.value),
        donut ? 0.03 : 0.015
    );
    const radius = height / 2;
    const summary = `${title}: ${rows.map((row) => `${row.label} ${row.share}`).join(', ')}`;
    return (
        <View {...props} className={styles.base({ class: className })}>
            {!hideTitle && (
                <Text className={styles.title()} aria-hidden>
                    {title}
                </Text>
            )}
            <View className={styles.pieLayout()}>
                <View role="img" aria-label={summary} {...nativeAccessible}>
                    <Svg
                        width={height}
                        height={height}
                        viewBox={`0 0 ${height} ${height}`}
                        aria-hidden
                        pointerEvents="none"
                    >
                        {arcs.map((arc, index) =>
                            arc.end > arc.start ? (
                                <Path
                                    key={index}
                                    d={arcPath(radius, radius, radius, donut ? radius * 0.6 : 0, arc.start, arc.end)}
                                    fill={colors[rows[index]?.tone ?? 'primary']}
                                />
                            ) : null
                        )}
                    </Svg>
                </View>
                {legend && (
                    <ChartLegend
                        stacked
                        items={rows.map((row) => ({
                            label: row.label,
                            tone: row.tone,
                            value: `${row.value} · ${row.share}`,
                        }))}
                    />
                )}
            </View>
            {table && (
                <ChartData
                    label={title}
                    rows={rows.map((row) => ({
                        label: row.label,
                        values: [
                            { name: t.value, value: row.value },
                            { name: t.share, value: row.share },
                        ],
                    }))}
                />
            )}
        </View>
    );
}
