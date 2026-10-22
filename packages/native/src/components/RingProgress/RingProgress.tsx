import { meterColor, ringChart, ringParts, visuallyHidden, type MeterColor } from '@wirecore/wirelayer-recipes/native';
import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { segmentPalette, usePalette } from '../../utils/palette.js';
import { Ring } from '../../utils/Ring.js';

const sizes = { sm: 64, md: 96, lg: 128 };

export interface RingProgressSegment {
    value: number;
    label?: string;
    color?: MeterColor;
}

export interface RingProgressProps extends Omit<ViewProps, 'children'> {
    /** One value (a progress ring) */
    value?: number;
    /** Several parts with a legend */
    segments?: RingProgressSegment[];
    /** Default: 100 or the sum of the parts if larger */
    max?: number;
    /** Visible below, also the accessible name */
    label: string;
    size?: 'sm' | 'md' | 'lg';
    /** Width of the ring in % of the size (default 10) */
    thickness?: number;
    /** Round ends (single value) */
    roundCaps?: boolean;
    /** Shows the legend of the parts (default true; else only for screen readers) */
    legend?: boolean;
    /** Text of a value (default the percentage) */
    formatValue?: (value: number, max: number) => string;
    /** Content in the middle */
    center?: ReactNode;
    className?: string;
}

/** A ring with one value or several parts and a legend, e.g. storage by type */
export function RingProgress({
    value,
    segments,
    max,
    label,
    size = 'md',
    thickness = 10,
    roundCaps = false,
    legend = true,
    formatValue = (current, whole) => `${Math.round((current / whole) * 100)} %`,
    center,
    className,
    ...props
}: RingProgressProps) {
    const styles = ringChart({ size });
    const palette = usePalette();
    const parts = segments ?? [{ value: value ?? 0 }];
    const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
    const whole = max ?? Math.max(100, total);
    const shares = ringParts(
        parts.map((part) => part.value),
        whole,
        parts.length > 1 ? 0.006 : 0
    );
    const colorOf = (index: number): MeterColor =>
        parts[index]?.color ?? segmentPalette[index % segmentPalette.length] ?? 'primary';
    const ring = (
        <View className={styles.ring()}>
            <Ring
                size={sizes[size]}
                thickness={thickness}
                track={palette.track}
                roundCaps={roundCaps && !segments && total > 0}
                segments={shares.map((share, index) => ({ ...share, color: palette[colorOf(index)] }))}
            />
            <View className={styles.center()} aria-hidden>
                {center ?? (!segments && <Text className={styles.value()}>{formatValue(total, whole)}</Text>)}
            </View>
        </View>
    );

    if (!segments)
        return (
            <View {...props} className={styles.base({ class: className })}>
                <View
                    role="progressbar"
                    aria-label={label}
                    aria-valuemin={0}
                    aria-valuemax={whole}
                    aria-valuenow={total}
                    aria-valuetext={formatValue(total, whole)}
                >
                    {ring}
                </View>
                <Text className={styles.label()} aria-hidden>
                    {label}
                </Text>
            </View>
        );
    return (
        <View role="group" aria-label={label} {...props} className={styles.base({ class: className })}>
            {ring}
            <Text className={styles.label()} aria-hidden>
                {label}
            </Text>
            <View role="list" className={legend ? styles.legend() : visuallyHidden()}>
                {segments.map((segment, index) => (
                    <View key={index} role="listitem" className={styles.legendItem()}>
                        <View className={styles.swatch({ class: meterColor({ color: colorOf(index) }) })} aria-hidden />
                        <Text className={styles.legendLabel()}>{segment.label}</Text>
                        <Text className={styles.legendValue()}>{formatValue(Math.max(0, segment.value), whole)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
