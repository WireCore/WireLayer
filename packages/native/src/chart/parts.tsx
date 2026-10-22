import { chart, chartColor, chartSwatch, type ChartTone } from '@wirecore/wirelayer-recipes/native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useTranslations } from '../locale.js';
import { Icon } from '../utils/Icon.js';

// Internal parts of the charts and visualisations: colours for react-native-svg, the measured width, the legend and
// the data list behind a toggle (the text alternative of a chart)

export type ChartColorName = ChartTone | 'grid' | 'axis' | 'track';

const colorOf = (style: { color?: unknown }) => (typeof style.color === 'string' ? style.color : undefined);

/** Colour values of the chart tones, grid and axis – follow theme and mode like the classes do */
export function useChartColors(): Record<ChartColorName, string | undefined> {
    return {
        primary: colorOf(useResolveClassNames(chartColor({ color: 'primary' }))),
        info: colorOf(useResolveClassNames(chartColor({ color: 'info' }))),
        success: colorOf(useResolveClassNames(chartColor({ color: 'success' }))),
        warn: colorOf(useResolveClassNames(chartColor({ color: 'warn' }))),
        danger: colorOf(useResolveClassNames(chartColor({ color: 'danger' }))),
        muted: colorOf(useResolveClassNames(chartColor({ color: 'muted' }))),
        grid: colorOf(useResolveClassNames(chartColor({ color: 'grid' }))),
        axis: colorOf(useResolveClassNames(chartColor({ color: 'axis' }))),
        track: colorOf(useResolveClassNames(chartColor({ color: 'track' }))),
    };
}

/** Width of a view (0 until it is laid out) – charts draw for the space they get */
export function useLayoutWidth() {
    const [width, setWidth] = useState(0);
    const onLayout = (event: LayoutChangeEvent) => setWidth(Math.floor(event.nativeEvent.layout.width));
    return [width, onLayout] as const;
}

/**
 * iOS and Android read a row as one element with this name; the web keeps the text of the children (a list there is
 * read item by item anyway)
 */
export const nativeLabel = (label: string) =>
    Platform.OS === 'web' ? {} : ({ accessible: true, 'aria-label': label } as const);

/** iOS and Android focus an image (role img) or a meter as one element and skip its drawn parts */
export const nativeAccessible = Platform.OS === 'web' ? {} : ({ accessible: true } as const);

export interface LegendItem {
    label: string;
    tone: ChartTone;
    /** Text after the label, e.g. value and share */
    value?: string;
}

/** Legend: a list of swatch and name – never the colour alone */
export function ChartLegend({ items, stacked = false }: { items: LegendItem[]; stacked?: boolean }) {
    const t = useTranslations().chart;
    const styles = chart();
    return (
        <View role="list" aria-label={t.legend} className={stacked ? styles.pieLegend() : styles.legend()}>
            {items.map((item, index) => (
                <View key={index} role="listitem" className={styles.legendItem()}>
                    <View className={chartSwatch({ tone: item.tone })} aria-hidden />
                    <Text className={stacked ? styles.pieLegendLabel() : styles.legendLabel()}>{item.label}</Text>
                    {!!item.value && <Text className={styles.legendValue()}>{item.value}</Text>}
                </View>
            ))}
        </View>
    );
}

export interface DataRow {
    /** Category, stage, flow … */
    label: string;
    /** Values; with a name ("Revenue $120") when there is more than one per row */
    values: { name?: string; value: string }[];
}

const valueText = (entry: DataRow['values'][number]) => (entry.name ? `${entry.name} ${entry.value}` : entry.value);

/** "Jan: Revenue $120, Costs $80" – one row of the data list as text */
export const dataRowText = (row: DataRow) => `${row.label}: ${row.values.map(valueText).join(', ')}`;

/**
 * The data of a chart as a list behind a toggle ("Data as table", closed at first) – the text alternative. On a
 * phone a list of rows reads better than a table: every row names its category and values.
 */
export function ChartData({ label, rows }: { label: string; rows: DataRow[] }) {
    const t = useTranslations().chart;
    const styles = chart();
    const [open, setOpen] = useState(false);
    return (
        <View>
            <Pressable role="button" aria-expanded={open} className={styles.toggle()} onPress={() => setOpen(!open)}>
                <Icon icon={open ? ChevronUp : ChevronDown} className={styles.toggleIcon()} />
                <Text className={styles.toggleLabel()}>{t.showTable}</Text>
            </Pressable>
            {open && (
                <View role="list" aria-label={label} className={styles.dataList()}>
                    {rows.map((row, index) => (
                        <View
                            key={index}
                            role="listitem"
                            className={styles.dataRow()}
                            {...nativeLabel(dataRowText(row))}
                        >
                            <Text className={styles.dataLabel()}>{row.label}</Text>
                            <View className={styles.dataValues()}>
                                {row.values.map((entry, column) => (
                                    <Text key={column} className={styles.dataValue()}>
                                        {valueText(entry)}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
