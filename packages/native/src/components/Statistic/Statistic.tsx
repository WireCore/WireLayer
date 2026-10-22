import {
    animateNumber,
    formatNumber,
    formatTrend,
    statistic,
    statisticTrend,
    visuallyHidden,
} from '@wirecore/wirelayer-recipes/native';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Text, View, type ViewProps } from 'react-native';
import { useLocale } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';
import { announce } from '../LiveAnnouncer/LiveAnnouncer.js';

const trendIcons = { up: TrendingUp, down: TrendingDown, flat: Minus };

export interface StatisticProps extends ViewProps {
    /** What the number is */
    label: string;
    /** The number – null shows nothing */
    value?: number | null;
    /** Intl options of the value, e.g. currency */
    formatOptions?: Intl.NumberFormatOptions;
    /** Intl unit, e.g. "kilobyte" or "percent" */
    unit?: string;
    /** Text before the value */
    prefix?: string;
    /** Text after the value */
    suffix?: string;
    /** Change in percent, shown with an arrow */
    trend?: number | null;
    /** Text after the trend, e.g. "vs. last month" */
    trendLabel?: string;
    trendFormatOptions?: Intl.NumberFormatOptions;
    /** Falling is good (e.g. errors, costs) */
    invertTrend?: boolean;
    /** Text below the value */
    description?: string;
    /** Icon component next to the label */
    icon?: IconComponent;
    /** Placeholder and busy state while loading */
    loading?: boolean;
    /** Counts up to a new value – only when motion is allowed */
    animate?: boolean;
    /** Announces changes of the value */
    live?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /** Card with border and padding */
    bordered?: boolean;
    /** Default: the LocaleProvider's */
    locale?: string;
    /** Small chart below, e.g. a sparkline */
    chart?: ReactNode;
    className?: string;
}

/** A key figure with label, trend and description, e.g. on a dashboard */
export function Statistic({
    label,
    value,
    formatOptions,
    unit,
    prefix,
    suffix,
    trend,
    trendLabel,
    trendFormatOptions,
    invertTrend = false,
    description,
    icon,
    loading = false,
    animate = false,
    live = false,
    size,
    bordered,
    locale,
    chart,
    className,
    ...props
}: StatisticProps) {
    const context = useLocale();
    const code = locale ?? context.locale;
    const reducedMotion = useReducedMotion();
    const { direction, tone } = statisticTrend(trend, invertTrend);
    const styles = statistic({ size, bordered, tone });
    const options = unit ? { style: 'unit' as const, unit, ...formatOptions } : formatOptions;
    const [frame, setFrame] = useState<{ target: number; value: number } | null>(null);
    const previous = useRef(value);

    useEffect(() => {
        const from = previous.current;
        previous.current = value;
        if (!animate || reducedMotion || typeof from !== 'number' || typeof value !== 'number' || from === value)
            return;
        const integer = Number.isInteger(value);
        return animateNumber(from, value, (current) =>
            setFrame({ target: value, value: integer ? Math.round(current) : current })
        );
    }, [value, animate, reducedMotion]);

    const text = formatNumber(value, code, options);
    useEffect(() => {
        if (live && text && Platform.OS !== 'web') announce(`${label}: ${text}`);
    }, [live, text, label]);

    const counting = frame && frame.target === value && frame.value !== value;
    const shown = counting ? formatNumber(frame.value, code, options) : text;

    return (
        <View {...props} aria-busy={loading} className={styles.base({ class: className })}>
            <View className={styles.header()}>
                {icon && <Icon icon={icon} className={styles.icon()} />}
                <Text className={styles.label()}>{label}</Text>
            </View>
            {loading ? (
                <>
                    <View className={styles.placeholder()} aria-hidden />
                    <Text className={visuallyHidden()}>{context.translations.statistic.loading}</Text>
                </>
            ) : (
                <View className={styles.valueRow()} {...(live ? { 'aria-live': 'polite' as const } : {})}>
                    {!!prefix && <Text className={styles.affix()}>{prefix}</Text>}
                    {counting ? (
                        <>
                            <Text className={styles.value()} aria-hidden>
                                {shown}
                            </Text>
                            <Text className={visuallyHidden()}>{text}</Text>
                        </>
                    ) : (
                        <Text className={styles.value()}>{shown}</Text>
                    )}
                    {!!suffix && <Text className={styles.affix()}>{suffix}</Text>}
                </View>
            )}
            {trend !== undefined && trend !== null && (
                <View className={styles.trendRow()}>
                    <View className={styles.trend()}>
                        <Icon icon={trendIcons[direction]} className={styles.trendIcon()} />
                        <Text className={styles.trendValue()}>{formatTrend(trend, code, trendFormatOptions)}</Text>
                    </View>
                    {!!trendLabel && <Text className={styles.trendLabel()}>{trendLabel}</Text>}
                </View>
            )}
            {!!description && <Text className={styles.description()}>{description}</Text>}
            {!!chart && <View className={styles.chart()}>{chart}</View>}
        </View>
    );
}
