import { skeleton, skeletonLines } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useState } from 'react';
import { Animated, View, type DimensionValue, type ViewProps } from 'react-native';
import { nativeDriver } from '../../utils/motion.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';

export interface SkeletonProps extends ViewProps {
    shape?: 'line' | 'rect' | 'circle';
    /** Width, e.g. 120 or "60%" */
    width?: DimensionValue;
    /** Height, e.g. 48 */
    height?: DimensionValue;
    /** Several lines for a paragraph – the last one shorter (shape line) */
    lines?: number;
    className?: string;
}

/**
 * Placeholder while content loads – hidden from assistive tech (mark the loading region with aria-busy).
 * Pulses unless reduced motion is on.
 */
export function Skeleton({ shape = 'line', width, height, lines, className, style, ...props }: SkeletonProps) {
    const reducedMotion = useReducedMotion();
    const [opacity] = useState(() => new Animated.Value(1));
    useEffect(() => {
        if (reducedMotion) return opacity.setValue(1);
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.5, duration: 900, useNativeDriver: nativeDriver }),
                Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: nativeDriver }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [reducedMotion, opacity]);
    const size = { ...(width !== undefined ? { width } : {}), ...(height !== undefined ? { height } : {}) };
    if (lines && lines > 1) {
        const styles = skeletonLines();
        return (
            <View aria-hidden {...props} className={styles.base({ class: className })} style={style}>
                {Array.from({ length: lines }, (_, index) => (
                    <Animated.View
                        key={index}
                        className={skeleton({ shape: 'line', class: index === lines - 1 ? styles.last() : undefined })}
                        style={[{ opacity }, height !== undefined ? { height } : null]}
                    />
                ))}
            </View>
        );
    }
    return (
        <Animated.View
            aria-hidden
            {...props}
            className={skeleton({ shape, class: className })}
            style={[{ opacity }, size, style]}
        />
    );
}
