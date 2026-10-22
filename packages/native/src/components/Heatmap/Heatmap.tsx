import { heatLevel, heatmap, visuallyHidden } from '@wirecore/wirelayer-recipes/native';
import { Platform, ScrollView, Text, View, type ViewProps } from 'react-native';
import { nativeLabel } from '../../chart/parts.js';
import { useLocale } from '../../locale.js';

export interface HeatmapProps extends Omit<ViewProps, 'children'> {
    /** Title of the table, also its accessible name */
    caption: string;
    /** Row names */
    rows: string[];
    /** Column names */
    columns: string[];
    /** Values per row and column; null for no value */
    values: (number | null)[][];
    /** Range of the colours (default: smallest and largest value) */
    min?: number;
    max?: number;
    /** The values as text in the cells – without, they stay readable for screen readers */
    showValues?: boolean;
    /** Colour scale below the table */
    legend?: boolean;
    formatOptions?: Intl.NumberFormatOptions;
    /** Default: the LocaleProvider's */
    locale?: string;
    className?: string;
}

type Level = 'none' | '0' | '1' | '2' | '3' | '4';

/**
 * A grid of values with row and column headers (a table on the web; on iOS and Android every cell is named
 * "row, column: value"); the colour only adds to the number. Scrolls sideways when it is wider than the screen.
 */
export function Heatmap({
    caption,
    rows,
    columns,
    values,
    min,
    max,
    showValues = true,
    legend = true,
    formatOptions,
    locale,
    className,
    ...props
}: HeatmapProps) {
    const context = useLocale();
    const t = context.translations.heatmap;
    const styles = heatmap();
    const numbers = values.flat().filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
    const low = min ?? Math.min(...numbers, 0);
    const high = max ?? Math.max(...numbers, 0);
    const number = new Intl.NumberFormat(locale ?? context.locale, formatOptions);
    return (
        <View {...props} className={styles.base({ class: className })}>
            <Text className={styles.caption()} aria-hidden>
                {caption}
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                // The web reaches a wide map with the keyboard to scroll it
                {...(Platform.OS === 'web' ? { tabIndex: 0 as const } : {})}
            >
                <View role="table" aria-label={caption} className={styles.table()}>
                    <View role="row" className={styles.row()}>
                        <View role="cell" className={styles.corner()} />
                        {columns.map((column, index) => (
                            <View key={index} role="columnheader" className={styles.columnHeader()}>
                                <Text className={styles.columnHeaderText()} numberOfLines={1}>
                                    {column}
                                </Text>
                            </View>
                        ))}
                    </View>
                    {rows.map((row, rowIndex) => (
                        <View key={rowIndex} role="row" className={styles.row()}>
                            <View role="rowheader" className={styles.rowHeader()}>
                                <Text className={styles.rowHeaderText()} numberOfLines={1}>
                                    {row}
                                </Text>
                            </View>
                            {columns.map((column, columnIndex) => {
                                const value = values[rowIndex]?.[columnIndex] ?? null;
                                const text = value === null ? null : number.format(value);
                                const level = heatLevel(value, low, high);
                                const parts = heatmap({ level: (level === null ? 'none' : String(level)) as Level });
                                return (
                                    <View
                                        key={columnIndex}
                                        role="cell"
                                        className={parts.cell()}
                                        {...nativeLabel(`${row}, ${column}: ${text ?? t.empty}`)}
                                    >
                                        {text === null ? (
                                            <>
                                                <Text className={styles.empty()} aria-hidden>
                                                    –
                                                </Text>
                                                <Text className={visuallyHidden()}>{t.empty}</Text>
                                            </>
                                        ) : (
                                            <Text className={showValues ? parts.cellText() : visuallyHidden()}>
                                                {text}
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>
            </ScrollView>
            {legend && (
                <View className={styles.legend()} aria-hidden>
                    <Text className={styles.legendText()}>{t.less}</Text>
                    {(['0', '1', '2', '3', '4'] as const).map((level) => (
                        <View key={level} className={heatmap({ level }).legendCell()} />
                    ))}
                    <Text className={styles.legendText()}>{t.more}</Text>
                </View>
            )}
        </View>
    );
}
