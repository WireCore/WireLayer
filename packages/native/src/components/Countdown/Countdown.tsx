import { countdown, countdownParts, toDate } from '@wirecore/wirelayer-recipes/native';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Platform, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';

export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds';
const order: CountdownUnit[] = ['days', 'hours', 'minutes', 'seconds'];

export interface CountdownProps extends Omit<ViewProps, 'children'> {
    /** End point */
    target: string | number | Date;
    /** Accessible name of the timer, e.g. "Until launch" */
    label: string;
    /** Shown units – the largest takes everything above it (default all) */
    units?: CountdownUnit[];
    variant?: 'boxed' | 'plain';
    size?: 'sm' | 'md' | 'lg';
    /** `units` (default): each value above its unit; `clock`: "05:12:33", the units for screen readers only */
    format?: 'units' | 'clock';
    /** The end point was reached (once) */
    onComplete?: () => void;
    className?: string;
}

/** Time left until a point (role timer): counts every second, not announced on every tick */
export function Countdown({
    target,
    label,
    units = order,
    variant,
    size,
    format,
    onComplete,
    className,
    ...props
}: CountdownProps) {
    const translations = useTranslations();
    const styles = countdown({ variant, size, format });
    const end = toDate(target).getTime();
    const [now, setNow] = useState<number | null>(null);
    const completed = useRef<number | null>(null);
    useEffect(() => {
        const tick = () => setNow(Date.now());
        const first = setTimeout(tick, 0);
        const timer = setInterval(tick, 1000);
        return () => {
            clearTimeout(first);
            clearInterval(timer);
        };
    }, []);
    const remaining = now === null ? null : end - now;
    useEffect(() => {
        if (remaining === null || remaining > 0 || completed.current === end) return;
        completed.current = end;
        onComplete?.();
    }, [remaining, end, onComplete]);
    const parts = countdownParts(remaining ?? 0, units);
    const shown = order.filter((unit) => units.includes(unit));
    const text = shown.map((unit) => `${parts[unit]} ${translations.countdown[unit](parts[unit])}`).join(', ');
    return (
        <View
            role="timer"
            aria-label={label}
            {...props}
            // iOS/Android: one element that reads the label and the time left; the web reads the units
            {...(Platform.OS === 'web' ? {} : { accessible: true, accessibilityValue: { text } })}
            className={styles.base({ class: className })}
        >
            {shown.map((unit, index) => (
                <Fragment key={unit}>
                    {format === 'clock' && index > 0 && (
                        <Text className={styles.separator()} aria-hidden>
                            :
                        </Text>
                    )}
                    <View className={styles.unit()}>
                        <Text className={styles.value()}>
                            {remaining === null ? '--' : String(parts[unit]).padStart(2, '0')}
                        </Text>
                        {/* A clock: the unit for screen readers only (web), iOS/Android read the value text */}
                        <Text className={styles.label()}>
                            {format === 'clock' ? ' ' : ''}
                            {translations.countdown[unit](parts[unit])}
                        </Text>
                    </View>
                </Fragment>
            ))}
        </View>
    );
}
