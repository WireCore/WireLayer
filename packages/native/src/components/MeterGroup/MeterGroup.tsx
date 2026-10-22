import { meterColor, meterGroup, type MeterColor } from '@wirecore/wirelayer-recipes/native';
import { Text, View } from 'react-native';
import { segmentPalette } from '../../utils/palette.js';

export interface MeterGroupItem {
    label: string;
    value: number;
    color?: MeterColor;
}

export interface MeterGroupProps {
    items: MeterGroupItem[];
    /** Visible label, also the name of the group */
    label: string;
    /** Default: the sum of the values */
    max?: number;
    /** Text of a value (default the percentage) */
    formatValue?: (value: number, max: number) => string;
    /** `vertical`: the bar grows from the bottom */
    orientation?: 'horizontal' | 'vertical';
    /** Where the legend is (default bottom) */
    legendPosition?: 'top' | 'bottom' | 'start' | 'end';
    /** Legend items side by side (default) or below each other */
    legendOrientation?: 'horizontal' | 'vertical';
    className?: string;
}

/** Several values in one bar with a legend, e.g. storage by type – the legend gives every value as text */
export function MeterGroup({
    items,
    label,
    max,
    formatValue = (value, whole) => `${Math.round((value / whole) * 100)} %`,
    orientation,
    legendPosition = 'bottom',
    legendOrientation = 'horizontal',
    className,
}: MeterGroupProps) {
    const styles = meterGroup({
        orientation,
        legendLayout: legendOrientation === 'vertical' ? 'stacked' : 'inline',
    });
    const whole = max ?? (items.reduce((sum, item) => sum + Math.max(0, item.value), 0) || 1);
    const colorOf = (index: number) => items[index]?.color ?? segmentPalette[index % segmentPalette.length];
    const vertical = orientation === 'vertical';
    const side = legendPosition === 'start' || legendPosition === 'end';
    const bar = (
        <View className={styles.bar({ class: side && !vertical ? styles.barBeside() : undefined })} aria-hidden>
            {items.map((item, index) => (
                <View
                    key={index}
                    className={styles.segment({ class: meterColor({ color: colorOf(index) }) })}
                    style={
                        vertical
                            ? { height: `${(Math.max(0, item.value) / whole) * 100}%` }
                            : { width: `${(Math.max(0, item.value) / whole) * 100}%` }
                    }
                />
            ))}
        </View>
    );
    const legend = (
        <View role="list" className={styles.legend()}>
            {items.map((item, index) => (
                <View key={index} role="listitem" className={styles.legendItem()}>
                    <View className={styles.swatch({ class: meterColor({ color: colorOf(index) }) })} aria-hidden />
                    <Text className={styles.legendLabel()}>{item.label}</Text>
                    <Text className={styles.legendValue()}>{formatValue(Math.max(0, item.value), whole)}</Text>
                </View>
            ))}
        </View>
    );
    return (
        <View role="group" aria-label={label} className={styles.base({ class: className })}>
            <Text className={styles.label()} aria-hidden>
                {label}
            </Text>
            <View className={side ? styles.sideLayout() : styles.stackLayout()}>
                {(legendPosition === 'top' || legendPosition === 'start') && legend}
                {bar}
                {(legendPosition === 'bottom' || legendPosition === 'end') && legend}
            </View>
        </View>
    );
}
