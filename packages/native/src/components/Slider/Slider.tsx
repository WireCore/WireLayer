import { slider } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { useLocale } from '../../locale.js';
import { useControllable } from '../../utils/useControllable.js';

/** A mark along the track, optionally with a label */
export interface SliderMark {
    value: number;
    label?: string;
}

export interface SliderProps {
    /** One value, or two for a range */
    value?: number[];
    defaultValue?: number[];
    onValueChange?: (value: number[]) => void;
    /** Called once the user lets go (end of the drag, after a key or an adjust gesture) */
    onValueChangeEnd?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    /** Visible label, also the accessible name */
    label: string;
    /** Value next to the label */
    showValue?: boolean;
    formatValue?: (value: number) => string;
    /** Names of the two thumbs of a range – default "Minimum" / "Maximum" */
    thumbLabels?: [string, string];
    /** Vertical slider: give it a height via className (at least 160 pt) */
    orientation?: 'horizontal' | 'vertical';
    /** Marks along the track, optionally with a label: [0, 50, 100] or [{ value: 0, label: 'Off' }] */
    marks?: (number | SliderMark)[];
    /** Only the values of `marks` can be chosen (the adjust gestures go from mark to mark) */
    restrictToMarks?: boolean;
    /** Smallest distance between the thumbs of a range, in values */
    minRange?: number;
    disabled?: boolean;
    className?: string;
}

const THUMB = 24;

/**
 * Drag along the track or use the screen reader's adjust gestures (role slider, increment/decrement) and, on the
 * web, the arrow keys, Page Up/Down and Home/End. Two values make a range with two thumbs.
 */
export function Slider({
    value,
    defaultValue = [0],
    onValueChange,
    onValueChangeEnd,
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue = true,
    formatValue,
    thumbLabels,
    orientation = 'horizontal',
    marks,
    restrictToMarks = false,
    minRange = 0,
    disabled = false,
    className,
}: SliderProps) {
    const { locale, translations } = useLocale();
    const [values, setValues] = useControllable(value, defaultValue, onValueChange);
    const [length, setLength] = useState(0);
    const vertical = orientation === 'vertical';
    const styles = slider({ disabled, orientation });
    const format = formatValue ?? ((number: number) => number.toLocaleString(locale));
    const names = thumbLabels ?? (translations.slider.thumbs as [string, string]);
    const markList = (marks ?? []).map((mark) => (typeof mark === 'number' ? { value: mark } : mark));
    const markValues = markList.map((mark) => mark.value).sort((a, b) => a - b);
    // The latest values for the end callback (the state may not have re-rendered yet)
    const latest = useRef(values);
    useEffect(() => {
        latest.current = values;
    }, [values]);

    const snap = (number: number) => {
        if (restrictToMarks && markValues.length)
            return markValues.reduce((best, mark) => (Math.abs(mark - number) < Math.abs(best - number) ? mark : best));
        return Math.min(max, Math.max(min, Math.round((number - min) / step) * step + min));
    };
    const setAt = (index: number, number: number) => {
        const next = [...values];
        // Range thumbs don't pass each other (and keep minRange apart)
        const lower = index > 0 ? next[index - 1]! + minRange : min;
        const upper = index < next.length - 1 ? next[index + 1]! - minRange : max;
        next[index] = Math.min(upper, Math.max(lower, snap(number)));
        if (next[index] !== values[index]) {
            latest.current = next;
            setValues(next);
        }
    };
    const end = () => onValueChangeEnd?.(latest.current);
    const toValue = (position: number) => {
        const fraction = Math.min(Math.max(position, 0), length) / (length || 1);
        return min + (vertical ? 1 - fraction : fraction) * (max - min);
    };
    const toPosition = (number: number) => {
        const fraction = (number - min) / (max - min);
        return (vertical ? 1 - fraction : fraction) * length;
    };
    /** Next value for the adjust gestures and arrow keys: a step, or the next mark */
    const nudge = (current: number, direction: 1 | -1) => {
        if (restrictToMarks && markValues.length) {
            const next =
                direction > 0
                    ? markValues.find((mark) => mark > current)
                    : [...markValues].reverse().find((mark) => mark < current);
            return next ?? current;
        }
        return current + direction * step;
    };

    // Dragging (gesture responder): the thumb nearest to the touch follows the finger
    const drag = useRef({ index: 0, position: 0, page: 0 });
    const grab = (event: GestureResponderEvent) => {
        const { locationX, locationY, pageX, pageY } = event.nativeEvent;
        const position = (vertical ? locationY : locationX) - THUMB / 2;
        const positions = values.map(toPosition);
        const index = positions.reduce(
            (best, candidate, candidateIndex) =>
                Math.abs(candidate - position) < Math.abs(positions[best]! - position) ? candidateIndex : best,
            0
        );
        drag.current = { index, position, page: vertical ? pageY : pageX };
        setAt(index, toValue(position));
    };
    const move = (event: GestureResponderEvent) => {
        const page = vertical ? event.nativeEvent.pageY : event.nativeEvent.pageX;
        setAt(drag.current.index, toValue(drag.current.position + page - drag.current.page));
    };

    const bigStep = Math.max(step, (max - min) / 10);
    const keys: Record<string, (current: number) => number> = {
        ArrowRight: (current) => nudge(current, 1),
        ArrowUp: (current) => nudge(current, 1),
        ArrowLeft: (current) => nudge(current, -1),
        ArrowDown: (current) => nudge(current, -1),
        PageUp: (current) => current + bigStep,
        PageDown: (current) => current - bigStep,
        Home: () => min,
        End: () => max,
    };
    const low = values.length > 1 ? toPosition(values[0]!) : vertical ? length : 0;
    const high = toPosition(values.length > 1 ? values[1]! : values[0]!);
    const rangeStart = Math.min(low, high);
    const rangeSize = Math.abs(high - low);

    return (
        <View className={styles.base({ class: className })}>
            <View className={styles.header()}>
                <Text className={styles.label()}>{label}</Text>
                {showValue && (
                    <Text className={styles.value()} aria-hidden>
                        {values.map(format).join(' – ')}
                    </Text>
                )}
            </View>
            <View className={styles.body()}>
                <View
                    className={styles.control()}
                    onLayout={(event: LayoutChangeEvent) =>
                        setLength((vertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width) - THUMB)
                    }
                    onStartShouldSetResponder={() => !disabled}
                    onMoveShouldSetResponder={() => !disabled}
                    onResponderGrant={grab}
                    onResponderMove={move}
                    onResponderRelease={end}
                    // Keep the gesture while the finger leaves the track sideways
                    onResponderTerminationRequest={() => false}
                >
                    <View
                        className={styles.track()}
                        pointerEvents="none"
                        style={
                            vertical
                                ? { marginVertical: THUMB / 2, height: length }
                                : { marginHorizontal: THUMB / 2, width: length }
                        }
                    />
                    <View
                        className={styles.range()}
                        pointerEvents="none"
                        style={
                            vertical
                                ? { top: THUMB / 2 + rangeStart, height: rangeSize }
                                : { left: THUMB / 2 + rangeStart, width: rangeSize }
                        }
                    />
                    {values.map((current, index) => (
                        <View
                            key={index}
                            role="slider"
                            tabIndex={disabled ? -1 : 0}
                            aria-label={values.length > 1 ? `${label}, ${names[index]}` : label}
                            aria-valuemin={min}
                            aria-valuemax={max}
                            aria-valuenow={current}
                            aria-valuetext={format(current)}
                            aria-disabled={disabled || undefined}
                            {...({ 'aria-orientation': vertical ? 'vertical' : undefined } as object)}
                            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                            onAccessibilityAction={(event) => {
                                setAt(index, nudge(current, event.nativeEvent.actionName === 'increment' ? 1 : -1));
                                end();
                            }}
                            {...((Platform.OS === 'web' && !disabled
                                ? {
                                      onKeyDown: (event: { key: string; preventDefault(): void }) => {
                                          const next = keys[event.key];
                                          if (!next) return;
                                          event.preventDefault();
                                          setAt(index, next(current));
                                      },
                                      onKeyUp: (event: { key: string }) => {
                                          if (keys[event.key]) end();
                                      },
                                  }
                                : {}) as object)}
                            className={styles.thumb()}
                            pointerEvents="none"
                            style={vertical ? { top: toPosition(current) } : { left: toPosition(current) }}
                        />
                    ))}
                </View>
                {markList.length > 0 && (
                    <View
                        className={styles.marks()}
                        aria-hidden
                        style={vertical ? undefined : { marginHorizontal: THUMB / 2 - 24 }}
                    >
                        {markList.map((mark) => (
                            <View
                                key={mark.value}
                                className={styles.mark()}
                                style={
                                    vertical
                                        ? { top: toPosition(mark.value) + THUMB / 2 - 6 }
                                        : { left: toPosition(mark.value) }
                                }
                            >
                                <View className={styles.markTick()} />
                                {mark.label && <Text className={styles.markLabel()}>{mark.label}</Text>}
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}
