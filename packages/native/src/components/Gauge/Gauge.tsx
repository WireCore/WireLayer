import { formatNumber, GAUGE_ARC, gauge, gaugeSize } from '@wirecore/wirelayer-recipes/native';
import { Text, View, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLocale } from '../../locale.js';
import { usePalette } from '../../utils/palette.js';

export type GaugeStatus = 'neutral' | 'success' | 'warn' | 'danger';

export interface GaugeProps extends Omit<ViewProps, 'children'> {
    value: number;
    min?: number;
    max?: number;
    /** Visible below, also the accessible name */
    label: string;
    /** Colour of the arc – wins over thresholds */
    status?: GaugeStatus;
    /** Colour by value: the highest `from` not above the value wins */
    thresholds?: { from: number; status: GaugeStatus }[];
    size?: 'sm' | 'md' | 'lg';
    /** Format of value, min and max */
    formatOptions?: Intl.NumberFormatOptions;
    /** Default: the LocaleProvider's */
    locale?: string;
    className?: string;
}

const arc = 'M10 62 A50 50 0 0 1 110 62';

/** A value on a half circle between min and max (role meter), coloured by status or thresholds */
export function Gauge({
    value,
    min = 0,
    max = 100,
    label,
    status,
    thresholds,
    size = 'md',
    formatOptions,
    locale,
    className,
    ...props
}: GaugeProps) {
    const context = useLocale();
    const code = locale ?? context.locale;
    const styles = gauge({ size });
    const palette = usePalette();
    const share = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
    const tone =
        status ??
        [...(thresholds ?? [])].sort((a, b) => b.from - a.from).find((threshold) => value >= threshold.from)?.status ??
        'neutral';
    const width = gaugeSize[size];
    const text = formatNumber(value, code, formatOptions);
    return (
        <View
            role="meter"
            aria-label={label}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            aria-valuetext={text}
            {...props}
            className={styles.base({ class: className })}
        >
            <View className={styles.arc()} style={{ width }} aria-hidden>
                <Svg width={width} height={(width * 74) / 120} viewBox="0 0 120 74" pointerEvents="none">
                    <Path d={arc} stroke={palette.track} strokeWidth={10} fill="none" strokeLinecap="round" />
                    {share > 0 && (
                        <Path
                            d={arc}
                            stroke={tone === 'neutral' ? palette.primary : palette[tone]}
                            strokeWidth={10}
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${share * GAUGE_ARC} ${GAUGE_ARC}`}
                        />
                    )}
                </Svg>
                <Text className={styles.value()}>{text}</Text>
            </View>
            <View className={styles.scale()} style={{ width }} aria-hidden>
                <Text className={styles.scaleLabel()}>{formatNumber(min, code, formatOptions)}</Text>
                <Text className={styles.scaleLabel()}>{formatNumber(max, code, formatOptions)}</Text>
            </View>
            <Text className={styles.label()} aria-hidden>
                {label}
            </Text>
        </View>
    );
}
