import { statusDot, type StatusDotStatus } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useState, type ReactNode } from 'react';
import { CircleCheck, CircleDot, Info, OctagonX, TriangleAlert } from 'lucide-react-native';
import { Animated, Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { nativeDriver } from '../../utils/motion.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';

export interface StatusDotProps extends ViewProps {
    status?: StatusDotStatus;
    /** Pulsing dot, e.g. for "live" – still with reduced motion */
    pulse?: boolean;
    /** Status icon instead of the dot – shape as a second cue next to colour and text. `true` uses the icon of the status */
    icon?: boolean | IconComponent;
    children?: ReactNode;
}

const statusIcons = { neutral: CircleDot, success: CircleCheck, info: Info, warn: TriangleAlert, danger: OctagonX };

/** Coloured dot (or status icon) with a text – pulses for live states, not with reduced motion */
export function StatusDot({ status, pulse = false, icon, className, children, ...props }: StatusDotProps) {
    const styles = statusDot({ status });
    const reducedMotion = useReducedMotion();
    const [opacity] = useState(() => new Animated.Value(1));

    useEffect(() => {
        if (!pulse || reducedMotion) return;
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.35, duration: 800, useNativeDriver: nativeDriver }),
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: nativeDriver }),
            ])
        );
        animation.start();
        return () => {
            animation.stop();
            opacity.setValue(1);
        };
    }, [pulse, reducedMotion, opacity]);

    return (
        <View {...props} className={styles.base({ class: className })}>
            {icon ? (
                <Icon icon={icon === true ? statusIcons[status ?? 'neutral'] : icon} className={styles.icon()} />
            ) : (
                <Animated.View className={styles.dot()} style={{ opacity }} />
            )}
            {typeof children === 'string' ? <Text className={styles.label()}>{children}</Text> : children}
        </View>
    );
}
