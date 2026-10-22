import { bulletChart, bulletScale, formatNumber, type VisualTone } from '@wirecore/wirelayer-recipes/native';
import { Text, View, type ViewProps } from 'react-native';
import { nativeAccessible } from '../../chart/parts.js';
import { useLocale } from '../../locale.js';

export interface BulletChartProps extends Omit<ViewProps, 'children'> {
    /** Name of the measure, e.g. "Revenue" – the accessible name */
    label: string;
    /** Smaller text below the name, e.g. the unit */
    description?: string;
    value: number;
    /** End of the scale */
    max: number;
    /** Start of the scale (default 0) */
    min?: number;
    /** Target value: a marker across the bar */
    target?: number;
    /** Upper limits of the qualitative bands (e.g. poor, fair, good), shown as shades behind the bar */
    ranges?: number[];
    /** Colour of the bar (default primary) */
    tone?: VisualTone;
    /** Formats the values (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    className?: string;
}

/** A meter (role meter) with the value, the end of the scale and the target as its text */
export function BulletChart({
    label,
    description,
    value,
    max,
    min = 0,
    target,
    ranges,
    tone = 'primary',
    formatValue,
    className,
    ...props
}: BulletChartProps) {
    const { locale, translations } = useLocale();
    const t = translations.chart;
    const styles = bulletChart({ tone });
    const format = formatValue ?? ((number: number) => formatNumber(number, locale));
    const scale = bulletScale({ value, target, min, max, ranges });
    const valueText = t.bulletValue(format(value), format(max), target === undefined ? undefined : format(target));
    return (
        <View {...props} className={styles.base({ class: className })}>
            <View className={styles.header()} aria-hidden>
                <Text className={styles.label()}>{label}</Text>
                {!!description && <Text className={styles.description()}>{description}</Text>}
            </View>
            <View
                role="meter"
                aria-label={description ? `${label}, ${description}` : label}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={valueText}
                {...nativeAccessible}
                className={styles.meter()}
            >
                {scale.bands.map((band) => (
                    <View
                        key={band.band}
                        className={bulletChart({ band: String(Math.min(2, band.band)) as '0' | '1' | '2' }).band()}
                        style={{ width: `${band.width}%` }}
                    />
                ))}
                <View className={styles.bar()} style={{ width: `${scale.value}%` }} />
                {scale.target !== undefined && (
                    <View className={styles.target()} style={{ left: `${scale.target}%` }} />
                )}
            </View>
            <View className={styles.values()} aria-hidden>
                <Text className={styles.current()}>{format(value)}</Text>
                {target !== undefined && <Text className={styles.scale()}>{`${t.target}: ${format(target)}`}</Text>}
                <Text className={styles.scale()}>{format(max)}</Text>
            </View>
        </View>
    );
}
