import { squarify, toneAt, treemap, visuallyHidden, type VisualTone } from '@wirecore/wirelayer-recipes/native';
import { Text, View, type ViewProps } from 'react-native';
import { nativeLabel, useLayoutWidth } from '../../chart/parts.js';
import { useLocale } from '../../locale.js';

export interface TreemapItem {
    label: string;
    value: number;
    /** Colour of the tile (default: in turn) */
    tone?: VisualTone;
}

export interface TreemapProps extends Omit<ViewProps, 'children'> {
    items: TreemapItem[];
    /** Accessible name of the list (and visible title with `showTitle`) */
    label: string;
    showTitle?: boolean;
    /** Height of the area in pt (default 240) – the tiles fill the width */
    height?: number;
    formatOptions?: Intl.NumberFormatOptions;
    /** Default: the LocaleProvider's */
    locale?: string;
    className?: string;
}

/** A list of the items with value and share; the tiles show the shares as areas */
export function Treemap({
    items,
    label,
    showTitle = false,
    height = 240,
    formatOptions,
    locale,
    className,
    ...props
}: TreemapProps) {
    const context = useLocale();
    const t = context.translations.treemap;
    const styles = treemap();
    const [width, onLayout] = useLayoutWidth();
    const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0);
    const rects = squarify(
        items.map((item) => item.value),
        width,
        height
    );
    const number = new Intl.NumberFormat(locale ?? context.locale, formatOptions);
    const percent = new Intl.NumberFormat(locale ?? context.locale, { style: 'percent', maximumFractionDigits: 1 });
    return (
        <View {...props} className={styles.base({ class: className })}>
            {showTitle && (
                <Text className={styles.title()} aria-hidden>
                    {label}
                </Text>
            )}
            <View role="list" aria-label={label} className={styles.list()} style={{ height }} onLayout={onLayout}>
                {width > 0 &&
                    items.map((item, index) => {
                        const rect = rects[index]!;
                        const text = t.share(number.format(item.value), percent.format(total ? item.value / total : 0));
                        // Without an area (0 or less) the item stays in the list for screen readers
                        if (rect.width <= 0 || rect.height <= 0) {
                            return (
                                <View key={`${item.label}-${index}`} role="listitem" className={visuallyHidden()}>
                                    <Text>{`${item.label}: ${text}`}</Text>
                                </View>
                            );
                        }
                        return (
                            <View
                                key={`${item.label}-${index}`}
                                role="listitem"
                                className={treemap({ tone: item.tone ?? toneAt(index) }).tile()}
                                style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
                                {...nativeLabel(`${item.label}: ${text}`)}
                            >
                                <Text className={styles.tileLabel()} numberOfLines={1}>
                                    {item.label}
                                </Text>
                                <Text className={styles.tileValue()} numberOfLines={1}>
                                    {text}
                                </Text>
                            </View>
                        );
                    })}
            </View>
        </View>
    );
}
