import { barsList, barsListWidths, formatNumber, type VisualTone } from '@wirecore/wirelayer-recipes/native';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useLocale } from '../../locale.js';
import { contentName } from '../../utils/label.js';

export interface BarsListItem {
    label: string;
    value: number;
    /** Makes the row a link (the web's `href`): opens the item, e.g. navigates to its details */
    onPress?: () => void;
    /** Colour of the bar (default: the list's tone) */
    tone?: VisualTone;
}

export interface BarsListProps extends Omit<ViewProps, 'children'> {
    items: BarsListItem[];
    /** Accessible name of the list (visible with `showTitle`) */
    label: string;
    showTitle?: boolean;
    /** Value of a full bar (default: the largest value) */
    max?: number;
    /** Colour of the bars (default primary) */
    tone?: VisualTone;
    /** Column headings above the list, e.g. "Page" and "Views" */
    labelHeader?: string;
    valueHeader?: string;
    /** Formats the values (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    className?: string;
}

/** A list of labels and values; the bars behind the labels show the values as lengths */
export function BarsList({
    items,
    label,
    showTitle = false,
    max,
    tone = 'primary',
    labelHeader,
    valueHeader,
    formatValue,
    className,
    ...props
}: BarsListProps) {
    const { locale } = useLocale();
    const styles = barsList({ tone });
    const widths = barsListWidths(
        items.map((item) => item.value),
        max
    );
    const format = formatValue ?? ((value: number) => formatNumber(value, locale));
    return (
        <View {...props} className={styles.base({ class: className })}>
            {showTitle && (
                <Text className={styles.title()} aria-hidden>
                    {label}
                </Text>
            )}
            {(!!labelHeader || !!valueHeader) && (
                <View className={styles.header()} aria-hidden>
                    <Text className={styles.headerLabel()}>{labelHeader}</Text>
                    <Text className={styles.headerLabel()}>{valueHeader}</Text>
                </View>
            )}
            <View role="list" aria-label={label} className={styles.list()}>
                {items.map((item, index) => {
                    const value = format(item.value);
                    const content = (
                        <>
                            <View
                                className={barsList({ tone: item.tone ?? tone }).bar()}
                                style={{ width: `${widths[index] ?? 0}%` }}
                                aria-hidden
                            />
                            <Text className={item.onPress ? styles.linkLabel() : styles.label()} numberOfLines={1}>
                                {item.label}
                            </Text>
                            <Text className={styles.value()}>{value}</Text>
                        </>
                    );
                    return (
                        <View key={`${item.label}-${index}`} role="listitem">
                            {item.onPress ? (
                                <Pressable
                                    role="link"
                                    {...contentName(`${item.label} ${value}`)}
                                    className={styles.link()}
                                    onPress={item.onPress}
                                >
                                    {content}
                                </Pressable>
                            ) : (
                                <View className={styles.item()}>{content}</View>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
