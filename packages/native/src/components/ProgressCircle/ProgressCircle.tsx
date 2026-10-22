import { ringChart } from '@wirecore/wirelayer-recipes/native';
import { Text, View, type ViewProps } from 'react-native';
import { usePalette } from '../../utils/palette.js';
import { Ring } from '../../utils/Ring.js';

const sizes = { sm: 64, md: 96, lg: 128 };

export interface ProgressCircleProps extends ViewProps {
    value: number;
    max?: number;
    /** Visible below the ring, also the accessible name */
    label: string;
    size?: 'sm' | 'md' | 'lg';
    /** Colour of the ring (default neutral: the primary colour) */
    status?: 'neutral' | 'success' | 'warn' | 'danger';
    /** Text in the middle (and the read value), default the percentage */
    formatValue?: (value: number, max: number) => string;
    className?: string;
}

/** Progress as a ring with the value in the middle (role progressbar) */
export function ProgressCircle({
    value,
    max = 100,
    label,
    size = 'md',
    status = 'neutral',
    formatValue = (current, whole) => `${Math.round((current / whole) * 100)} %`,
    className,
    ...props
}: ProgressCircleProps) {
    const styles = ringChart({ size });
    const palette = usePalette();
    const clamped = Math.min(Math.max(value, 0), max);
    const text = formatValue(clamped, max);
    const color = status === 'neutral' ? palette.primary : palette[status];
    return (
        <View {...props} className={styles.base({ class: className })}>
            <View
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={clamped}
                aria-valuetext={text}
                className={styles.ring()}
            >
                <Ring
                    size={sizes[size]}
                    thickness={10}
                    track={palette.track}
                    segments={[{ start: 0, length: max ? clamped / max : 0, color }]}
                    roundCaps={clamped > 0}
                />
                <View className={styles.center()} aria-hidden>
                    <Text className={styles.value()}>{text}</Text>
                </View>
            </View>
            <Text className={styles.label()} aria-hidden>
                {label}
            </Text>
        </View>
    );
}
