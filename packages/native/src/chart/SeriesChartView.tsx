import {
    areaPath,
    barRects,
    categoryPositions,
    chart,
    chartToneAt,
    formatNumber,
    linePath,
    linePoints,
    linearScale,
    niceTicks,
    referenceSummary,
    seriesSummary,
    seriesTable,
    stackSeries,
    valueExtent,
    type ChartReference,
} from '@wirecore/wirelayer-recipes/native';
import { useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { useLocale } from '../locale.js';
import { ChartData, ChartLegend, nativeAccessible, useChartColors, useLayoutWidth } from './parts.js';
import type { SeriesChartBaseProps } from './types.js';

// Internal: BarChart and LineChart

interface Props extends SeriesChartBaseProps {
    kind: 'bar' | 'line';
    horizontal?: boolean;
    stacked?: boolean;
    curved?: boolean;
    area?: boolean;
}

/** Line height of an axis label */
const LABEL = 14;
/** Space between the labels and the plot */
const GAP = 6;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function SeriesChartView({
    kind,
    data,
    categoryKey,
    series: seriesProp,
    title,
    hideTitle = false,
    height = 220,
    table = true,
    formatValue,
    references = [],
    legend,
    horizontal = false,
    stacked = false,
    curved = false,
    area = false,
    className,
    ...props
}: Props) {
    const { locale, translations } = useLocale();
    const t = translations.chart;
    const styles = chart();
    const colors = useChartColors();
    const [width, onLayout] = useLayoutWidth();
    const [selected, setSelected] = useState<number | null>(null);
    const format = formatValue ?? ((value: number) => formatNumber(value, locale));
    const series = area ? seriesProp.map((entry) => ({ ...entry, area: entry.area ?? true })) : seriesProp;
    const colorOf = (index: number) => colors[series[index]?.tone ?? chartToneAt(index)];
    const bars = kind === 'bar';
    const sideways = bars && horizontal;
    const count = data.length;
    const values = stackSeries(data, series, stacked);
    // One value axis: references on a second axis (`axis: 'end'`) are listed below, not drawn
    const valueReferences = references.filter((reference) => reference.axis !== 'x' && reference.axis !== 'end');
    const extent = valueExtent(values, valueReferences, bars || series.some((entry) => entry.area));
    const categories = data.map((row) => String(row[categoryKey] ?? ''));
    const rows = seriesTable(data, categoryKey, series, format);

    // Lines on the categories run along the value axis and the other way round: horizontal ("across") or vertical
    const isAcross = (reference: ChartReference) => (reference.axis === 'x') === sideways;
    // Plot: value labels beside (vertical) or below (horizontal), category labels below or beside; labels of vertical
    // reference lines above the plot
    const top = references.some((reference) => reference.label && !isAcross(reference)) ? LABEL + 2 : 8;
    const plotHeight = Math.max(0, height - top - LABEL - GAP);
    const longestCategory = Math.max(0, ...categories.map((category) => category.length));
    const categoryGutter = sideways ? Math.min(width / 3, Math.max(32, longestCategory * 6.5 + GAP)) : 0;
    const roughWidth = width - categoryGutter - 16;
    const ticks = niceTicks(
        extent[0],
        extent[1],
        Math.max(2, Math.floor(sideways ? roughWidth / 72 : plotHeight / 44))
    );
    const domain: [number, number] = [ticks[0]!, ticks.at(-1)!];
    const tickLabels = ticks.map(format);
    const valueGutter = sideways
        ? 0
        : Math.min(80, Math.max(24, Math.max(...tickLabels.map((label) => label.length)) * 6 + GAP));
    const left = sideways ? categoryGutter : valueGutter;
    const plotWidth = Math.max(0, width - left - (sideways ? 16 : 8));
    const valueScale = sideways ? linearScale(domain, [0, plotWidth]) : linearScale(domain, [plotHeight, 0]);
    const categoryLength = sideways ? plotHeight : plotWidth;
    const { step, centres } = categoryPositions(count, categoryLength, bars);
    // Also for fractional indexes (references between two categories)
    const categoryAt = (index: number) => (bars ? step * (index + 0.5) : count > 1 ? step * index : categoryLength / 2);
    const shown = selected !== null && selected < count ? selected : null;

    // Tapping the plot shows the values of the nearest category (the data list has them for everyone)
    const pick = (event: GestureResponderEvent) => {
        const along = sideways ? event.nativeEvent.locationY - top : event.nativeEvent.locationX - left;
        const index = bars ? Math.floor(along / (step || 1)) : Math.round(along / (step || 1));
        const next = index >= 0 && index < count ? index : null;
        setSelected(next === shown ? null : next);
    };

    const plot = { width: plotWidth, height: plotHeight, domain };
    const rects = bars ? barRects(values, { ...plot, series, stacked, horizontal: sideways }) : [];
    const lines = bars
        ? []
        : values.map((list, index) => {
              const points = linePoints(list, plot);
              const base = series[index]?.area ? linePoints(list, { ...plot, edge: 'start' }) : undefined;
              return {
                  index,
                  points,
                  line: linePath(points, curved),
                  area: base ? areaPath(points, base, curved) : '',
              };
          });

    // Pixel range of a reference: a line (start = end) or an area, on the value axis or on the categories
    const referenceRange = (reference: ChartReference): [number, number] => {
        const onCategories = reference.axis === 'x';
        const at = (value: number) => (onCategories ? categoryAt(value) : valueScale(value));
        if (reference.value !== undefined) return [at(reference.value), at(reference.value)];
        const a = at(reference.from ?? (onCategories ? 0 : domain[0]));
        const b = at(reference.to ?? (onCategories ? count - 1 : domain[1]));
        return [Math.min(a, b), Math.max(a, b)];
    };
    // A reference as a dashed line or a tinted area through the plot
    const referenceShape = (reference: ChartReference, key: string) => {
        const color = colors[reference.tone ?? 'muted'];
        const [start, end] = referenceRange(reference);
        const across = isAcross(reference);
        const length = across ? plotWidth : plotHeight;
        if (reference.value !== undefined) {
            const line = { stroke: color, strokeWidth: 1.5, strokeDasharray: '5 3' };
            return across ? (
                <Line key={key} x1={0} x2={length} y1={start} y2={start} {...line} />
            ) : (
                <Line key={key} x1={start} x2={start} y1={0} y2={length} {...line} />
            );
        }
        return across ? (
            <Rect key={key} x={0} y={start} width={length} height={end - start} fill={color} fillOpacity={0.12} />
        ) : (
            <Rect key={key} x={start} y={0} width={end - start} height={length} fill={color} fillOpacity={0.12} />
        );
    };
    // Label of a reference beside its line or area – the colour is never the only hint
    const referenceLabel = (reference: ChartReference, key: string) => {
        if (!reference.label) return null;
        const [start] = referenceRange(reference);
        const style = isAcross(reference)
            ? // Above a horizontal line (or area), at the end
              {
                  left,
                  width: plotWidth,
                  top: clamp(top + start - LABEL, 0, height - LABEL),
                  textAlign: 'right' as const,
              }
            : // Above the plot, beside a vertical line (or area)
              { left: clamp(left + start + 3, 0, width - 80), width: 80, top: 0 };
        return (
            <Text key={key} className={styles.axisLabel()} numberOfLines={1} style={{ ...style, lineHeight: LABEL }}>
                {reference.label}
            </Text>
        );
    };
    const usable = references.filter((reference) => reference.axis !== 'end');
    const referenceAreas = usable.filter((reference) => reference.value === undefined);
    const referenceLines = usable.filter((reference) => reference.value !== undefined);

    // Value grid (the zero line stronger) and the highlight of the tapped category
    const gridLine = (tick: number) => {
        const position = valueScale(tick);
        const paint = { stroke: tick === 0 ? colors.axis : colors.grid, strokeWidth: 1 };
        return sideways ? (
            <Line key={tick} x1={position} x2={position} y1={0} y2={plotHeight} {...paint} />
        ) : (
            <Line key={tick} x1={0} x2={plotWidth} y1={position} y2={position} {...paint} />
        );
    };
    const highlight =
        shown === null ? null : !bars ? (
            <Line x1={centres[shown]} x2={centres[shown]} y1={0} y2={plotHeight} stroke={colors.axis} strokeWidth={1} />
        ) : sideways ? (
            <Rect x={0} y={shown * step} width={plotWidth} height={step} fill={colors.track} fillOpacity={0.5} />
        ) : (
            <Rect x={shown * step} y={0} width={step} height={plotHeight} fill={colors.track} fillOpacity={0.5} />
        );

    // Axis labels as text over the drawing: the value ticks, and as many categories as fit
    const everyCategory = sideways
        ? Math.ceil(count / Math.max(1, Math.floor(plotHeight / LABEL)))
        : Math.ceil(count / Math.max(1, Math.floor(plotWidth / 48)));
    const labelWidth = Math.min(96, Math.max(40, step * everyCategory));
    const tickStyle = (position: number) =>
        sideways
            ? {
                  left: clamp(left + position - 32, 0, width - 64),
                  width: 64,
                  top: top + plotHeight + GAP / 2,
                  textAlign: 'center' as const,
              }
            : { left: 0, width: left - GAP, top: top + position - LABEL / 2, textAlign: 'right' as const };
    const categoryStyle = (centre: number) =>
        sideways
            ? { left: 0, width: left - GAP, top: top + centre - LABEL / 2, textAlign: 'right' as const }
            : {
                  left: clamp(left + centre - labelWidth / 2, 0, width - labelWidth),
                  width: labelWidth,
                  top: top + plotHeight + GAP / 2,
                  textAlign: 'center' as const,
              };

    return (
        <View {...props} className={styles.base({ class: className })}>
            {!hideTitle && (
                <Text className={styles.title()} aria-hidden>
                    {title}
                </Text>
            )}
            <View role="img" aria-label={seriesSummary(title, data, series, format, t)} {...nativeAccessible}>
                <View
                    className={styles.plot()}
                    style={{ height }}
                    onLayout={onLayout}
                    onStartShouldSetResponder={() => count > 0}
                    onResponderRelease={pick}
                >
                    {width > 0 && (
                        <Svg
                            width={width}
                            height={height}
                            viewBox={`0 0 ${width} ${height}`}
                            aria-hidden
                            pointerEvents="none"
                        >
                            <G transform={`translate(${left} ${top})`}>
                                {highlight}
                                {referenceAreas.map((reference, index) => referenceShape(reference, `a${index}`))}
                                {ticks.map(gridLine)}
                                {rects.map((rect) => {
                                    const color = colorOf(rect.series);
                                    const dashed = series[rect.series]?.dashed;
                                    return (
                                        <Rect
                                            key={`${rect.series}-${rect.row}`}
                                            x={rect.x}
                                            y={rect.y}
                                            width={rect.width}
                                            height={rect.height}
                                            rx={Math.min(3, rect.width / 2, rect.height / 2)}
                                            fill={color}
                                            fillOpacity={dashed ? 0.3 : 1}
                                            {...(dashed
                                                ? { stroke: color, strokeWidth: 1.5, strokeDasharray: '4 3' }
                                                : {})}
                                        />
                                    );
                                })}
                                {lines.map((line) =>
                                    line.area ? (
                                        <Path
                                            key={`a${line.index}`}
                                            d={line.area}
                                            fill={colorOf(line.index)}
                                            fillOpacity={0.18}
                                        />
                                    ) : null
                                )}
                                {lines.map((line) =>
                                    line.line ? (
                                        <Path
                                            key={`l${line.index}`}
                                            d={line.line}
                                            stroke={colorOf(line.index)}
                                            strokeWidth={2}
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                            fill="none"
                                            {...(series[line.index]?.dashed ? { strokeDasharray: '6 4' } : {})}
                                        />
                                    ) : null
                                )}
                                {count <= 40 &&
                                    lines.map((line) =>
                                        line.points.map((point, row) =>
                                            point ? (
                                                <Circle
                                                    key={`p${line.index}-${row}`}
                                                    cx={point.x}
                                                    cy={point.y}
                                                    r={row === shown ? 4.5 : 3}
                                                    fill={colorOf(line.index)}
                                                />
                                            ) : null
                                        )
                                    )}
                                {referenceLines.map((reference, index) => referenceShape(reference, `l${index}`))}
                            </G>
                        </Svg>
                    )}
                    {width > 0 && (
                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                            {ticks.map((tick, index) => (
                                <Text
                                    key={tick}
                                    className={styles.axisLabel()}
                                    numberOfLines={1}
                                    style={{ ...tickStyle(valueScale(tick)), lineHeight: LABEL }}
                                >
                                    {tickLabels[index]}
                                </Text>
                            ))}
                            {categories.map((category, index) =>
                                index % everyCategory ? null : (
                                    <Text
                                        key={index}
                                        className={styles.axisLabel()}
                                        numberOfLines={1}
                                        style={{ ...categoryStyle(centres[index] ?? 0), lineHeight: LABEL }}
                                    >
                                        {category}
                                    </Text>
                                )
                            )}
                            {usable.map((reference, index) => referenceLabel(reference, `r${index}`))}
                        </View>
                    )}
                </View>
                {shown !== null && (
                    <View className={styles.selection()}>
                        <Text className={styles.selectionLabel()}>{categories[shown]}</Text>
                        {series.map((entry, index) => (
                            <Text key={entry.key} className={styles.selectionValue()}>
                                {`${entry.label ?? entry.key}: ${rows.rows[shown]?.values[index] ?? '–'}`}
                            </Text>
                        ))}
                    </View>
                )}
            </View>
            {references.length > 0 && (
                <Text
                    className={styles.references()}
                >{`${t.references}: ${referenceSummary(references, format)}`}</Text>
            )}
            {(legend ?? series.length > 1) && (
                <ChartLegend
                    items={series.map((entry, index) => ({
                        label: entry.label ?? entry.key,
                        tone: entry.tone ?? chartToneAt(index),
                    }))}
                />
            )}
            {table && (
                <ChartData
                    label={title}
                    rows={rows.rows.map((row) => ({
                        label: row.label,
                        values: row.values.map((value, index) =>
                            series.length > 1 ? { name: rows.columns[index], value } : { value }
                        ),
                    }))}
                />
            )}
        </View>
    );
}
