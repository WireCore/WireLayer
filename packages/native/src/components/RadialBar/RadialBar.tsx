import { chartSwatch, radialBar, radialBarRings, toneAt, type VisualTone } from '@wirecore/wirelayer-recipes/native';
import { Fragment } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useChartColors } from '../../chart/parts.js';
import { useLocale } from '../../locale.js';

export interface RadialBarItem {
    label: string;
    value: number;
    /** End of this ring's scale (default: the chart's `max`) */
    max?: number;
    /** Colour of the ring (default: in turn) */
    tone?: VisualTone;
}

export interface RadialBarProps extends Omit<ViewProps, 'children'> {
    /** One ring per item, the first outermost */
    items: RadialBarItem[];
    /** Accessible name (visible with `showTitle`) */
    label: string;
    showTitle?: boolean;
    /** End of the scale (default 100) */
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    /** Formats the value in the legend (default: the share in percent) */
    formatValue?: (value: number, max: number) => string;
    className?: string;
}

const sizes = { sm: 96, md: 160, lg: 224 };

/** Rings drawn with react-native-svg (decorative) and a legend with the values as the text (a named group) */
export function RadialBar({
    items,
    label,
    showTitle = false,
    max = 100,
    size = 'md',
    formatValue,
    className,
    ...props
}: RadialBarProps) {
    const { locale } = useLocale();
    const styles = radialBar();
    const colors = useChartColors();
    const parts = radialBarRings(items, { max });
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
    const rings = items.map((item, index) => {
        const part = parts[index]!;
        return {
            ...item,
            ...part,
            tone: item.tone ?? toneAt(index),
            text: formatValue ? formatValue(item.value, item.max ?? max) : percent.format(part.share),
        };
    });
    const width = sizes[size];
    return (
        <View {...props} role="group" aria-label={label} className={styles.base({ class: className })}>
            {showTitle && (
                <Text className={styles.title()} aria-hidden>
                    {label}
                </Text>
            )}
            <Svg width={width} height={width} viewBox="0 0 100 100" aria-hidden pointerEvents="none">
                {rings.map((ring, index) => (
                    <Fragment key={index}>
                        <Circle
                            cx={50}
                            cy={50}
                            r={ring.radius}
                            stroke={colors.track}
                            strokeWidth={ring.thickness}
                            fill="none"
                        />
                        {ring.dash > 0 && (
                            <Circle
                                cx={50}
                                cy={50}
                                r={ring.radius}
                                stroke={colors[ring.tone]}
                                strokeWidth={ring.thickness}
                                strokeLinecap="round"
                                strokeDasharray={`${ring.dash} ${ring.circumference}`}
                                fill="none"
                                transform="rotate(-90 50 50)"
                            />
                        )}
                    </Fragment>
                ))}
            </Svg>
            <View role="list" className={styles.legend()}>
                {rings.map((ring, index) => (
                    <View key={index} role="listitem" className={styles.legendItem()}>
                        <View className={chartSwatch({ tone: ring.tone })} aria-hidden />
                        <Text className={styles.legendLabel()}>{ring.label}</Text>
                        <Text className={styles.legendValue()}>{ring.text}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
