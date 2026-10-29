import { meterColor, progress, progressParts, type MeterColor } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { nativeDriver } from '../../utils/motion.js';
import { segmentPalette } from '../../utils/palette.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';

export interface ProgressSegment {
    value: number;
    /** Name in the legend */
    label?: string;
    color?: MeterColor;
}

export interface ProgressProps extends ViewProps {
    /** 0–max */
    value: number;
    max?: number;
    /** Visible label, also the accessible name */
    label?: string;
    /** Shows the percentage next to the label */
    showValue?: boolean;
    /** Formats the value text (shown and announced) */
    valueText?: (percent: number) => string;
    /** Several parts in one bar (e.g. used storage by type) – their sum is the value */
    segments?: ProgressSegment[];
    /** Progress as this many blocks (e.g. steps of a process) */
    steps?: number;
    /** Diagonal stripes */
    striped?: boolean;
    /** Moving stripes – only when motion is allowed */
    animated?: boolean;
    /** `vertical`: the bar fills from the bottom */
    orientation?: 'horizontal' | 'vertical';
    /** `xs`: a thin bar with small text, e.g. in a list or a status bar */
    size?: 'xs' | 'md';
    /**
     * Colour of the filled part by its state, e.g. `danger` for a failed transfer, `neutral` (grey) for a cancelled
     * one
     */
    status?: 'info' | 'success' | 'warn' | 'danger' | 'neutral';
    /** The label only for screen readers – it still names the progress bar */
    hideLabel?: boolean;
    /**
     * Short text in the bar, e.g. "42 %", "waiting" or "failed" (a taller bar; horizontal, without segments or steps)
     * – screen readers get it after the value
     */
    barText?: string;
}

const stripeGap = 10;

/** Progress bar (role progressbar) named by its label, with the value as text – also in segments, steps or stripes */
export function Progress({
    value,
    max = 100,
    label,
    showValue = true,
    valueText = (percent) => `${percent} %`,
    segments,
    steps,
    striped = false,
    animated = false,
    orientation = 'horizontal',
    size,
    status,
    hideLabel = false,
    barText,
    className,
    ...props
}: ProgressProps) {
    const showBarText = !!barText && !segments && !steps && orientation !== 'vertical';
    const styles = progress({ size, status, hideLabel });
    const parts = progressParts({ size, status, hasText: showBarText });
    const reducedMotion = useReducedMotion();
    const total = segments ? segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0) : value;
    const percent = Math.round((Math.min(Math.max(total, 0), max) / max) * 100);
    const text = valueText(percent);
    const [width, setWidth] = useState(0);
    const [shift] = useState(() => new Animated.Value(0));
    const moving = striped && animated && !reducedMotion;

    useEffect(() => {
        if (!moving) return shift.setValue(0);
        const loop = Animated.loop(
            Animated.timing(shift, {
                toValue: stripeGap,
                duration: 600,
                easing: Easing.linear,
                useNativeDriver: nativeDriver,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [moving, shift]);

    const stripes = striped && width > 0 && (
        <Animated.View className={parts.stripes()} style={{ transform: [{ translateX: shift }] }} aria-hidden>
            <Svg width={width + stripeGap * 2} height={12} pointerEvents="none">
                <Path
                    d={Array.from(
                        { length: Math.ceil(width / stripeGap) + 3 },
                        (_, index) => `M${index * stripeGap - stripeGap} 12 l${stripeGap} -12`
                    ).join(' ')}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={3}
                />
            </Svg>
        </Animated.View>
    );

    const bar = (() => {
        if (orientation === 'vertical')
            return (
                <View className={parts.verticalTrack()}>
                    <View className={parts.verticalRange()} style={{ height: `${percent}%` }} />
                </View>
            );
        if (steps) {
            const filled = Math.round((Math.min(Math.max(total, 0), max) / max) * steps);
            return (
                <View className={parts.steps()}>
                    {Array.from({ length: steps }, (_, index) => (
                        <View key={index} className={progressParts({ filled: index < filled, status }).step()} />
                    ))}
                </View>
            );
        }
        return (
            <View className={parts.track()} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
                {segments ? (
                    segments.map((segment, index) => (
                        <View
                            key={index}
                            className={parts.segment({
                                class: meterColor({
                                    color: segment.color ?? segmentPalette[index % segmentPalette.length],
                                }),
                            })}
                            style={{ width: `${(Math.max(0, segment.value) / max) * 100}%` }}
                        />
                    ))
                ) : (
                    <>
                        {showBarText && (
                            <View className={styles.barText()} aria-hidden>
                                <Text className={styles.barTextLabel()} numberOfLines={1}>
                                    {barText}
                                </Text>
                            </View>
                        )}
                        <View className={styles.range()} style={{ width: `${percent}%` }}>
                            {stripes}
                            {/* The text again inside the fill (cut by it), as wide as the track */}
                            {showBarText && width > 0 && (
                                <View className={styles.barTextFill()} style={{ width }} aria-hidden>
                                    <Text className={styles.barTextFillLabel()} numberOfLines={1}>
                                        {barText}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </View>
        );
    })();

    // The legend is drawn for the eyes – screen readers get the parts in the value text
    const labelled = segments?.filter((segment) => segment.label) ?? [];
    const valueTextFull = labelled.length
        ? `${text} (${labelled.map((segment) => `${segment.label} ${valueText(Math.round((Math.max(0, segment.value) / max) * 100))}`).join(', ')})`
        : showBarText && barText !== text
          ? `${text}, ${barText}`
          : text;

    return (
        <View
            {...props}
            className={styles.base({ class: className })}
            role="progressbar"
            aria-label={props['aria-label'] ?? label}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={total}
            aria-valuetext={valueTextFull}
        >
            {((label && !hideLabel) || showValue) && (
                <View className={styles.header()} aria-hidden>
                    {!hideLabel && (
                        <Text className={styles.label()} numberOfLines={1}>
                            {label}
                        </Text>
                    )}
                    {showValue && <Text className={styles.value()}>{text}</Text>}
                </View>
            )}
            {bar}
            {labelled.length > 0 && (
                <View className={parts.legend()} aria-hidden>
                    {segments!.map((segment, index) =>
                        segment.label ? (
                            <View key={index} className={parts.legendItem()}>
                                <View
                                    className={parts.swatch({
                                        class: meterColor({
                                            color: segment.color ?? segmentPalette[index % segmentPalette.length],
                                        }),
                                    })}
                                />
                                <Text className={parts.legendLabel()}>{segment.label}</Text>
                            </View>
                        ) : null
                    )}
                </View>
            )}
        </View>
    );
}
