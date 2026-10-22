import { rating } from '@wirecore/wirelayer-recipes/native';
import { Star } from 'lucide-react-native';
import { useId, useState } from 'react';
import { Platform, Pressable, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';

export interface RatingProps {
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    /** Number of stars */
    count?: number;
    allowHalf?: boolean;
    /** Choosing the chosen star again clears the rating (value 0) */
    allowClear?: boolean;
    /** Own symbol instead of the star, e.g. a heart (filled when chosen) */
    icon?: IconComponent;
    readOnly?: boolean;
    disabled?: boolean;
    /** Visible label, also the accessible name */
    label?: string;
    'aria-label'?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Star rating as one adjustable control (role slider): swipe up/down (VoiceOver) or the adjust actions (TalkBack)
 * change it, it reads "3 stars"; on the web the arrow keys, Home/End. A tap on a star chooses it (on its left half
 * with allowHalf).
 */
export function Rating({
    value,
    defaultValue = 0,
    onValueChange,
    count = 5,
    allowHalf = false,
    allowClear = false,
    icon = Star,
    readOnly = false,
    disabled = false,
    label,
    'aria-label': ariaLabel,
    size,
    className,
}: RatingProps) {
    const translations = useTranslations();
    const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
    const [width, setWidth] = useState(0);
    const id = useId();
    const styles = rating({ size, disabled });
    const step = allowHalf ? 0.5 : 1;
    const locked = readOnly || disabled;
    const set = (next: number) => {
        if (locked) return;
        setCurrent(Math.min(count, Math.max(0, next)));
    };
    const text = translations.rating.ratingValueText(current);
    const keys: Record<string, () => number> = {
        ArrowRight: () => current + step,
        ArrowUp: () => current + step,
        ArrowLeft: () => current - step,
        ArrowDown: () => current - step,
        Home: () => 0,
        End: () => count,
    };
    const choose = (index: number, event: GestureResponderEvent) => {
        const half = allowHalf && width > 0 && event.nativeEvent.locationX < width / 2;
        const next = half ? index + 0.5 : index + 1;
        set(allowClear && next === current ? 0 : next);
    };

    return (
        <View className={styles.base({ class: className })}>
            {!!label && (
                <Text nativeID={`${id}label`} className={styles.label()}>
                    {label}
                </Text>
            )}
            <View
                role="slider"
                tabIndex={locked ? -1 : 0}
                aria-labelledby={label ? `${id}label` : undefined}
                aria-label={label ? undefined : ariaLabel}
                aria-valuemin={0}
                aria-valuemax={count}
                aria-valuenow={current}
                aria-valuetext={text}
                aria-disabled={disabled || undefined}
                {...({ 'aria-readonly': readOnly || undefined } as object)}
                accessibilityActions={locked ? undefined : [{ name: 'increment' }, { name: 'decrement' }]}
                onAccessibilityAction={(event) =>
                    set(current + (event.nativeEvent.actionName === 'increment' ? step : -step))
                }
                {...((Platform.OS === 'web' && !locked
                    ? {
                          onKeyDown: (event: { key: string; preventDefault(): void }) => {
                              const next = keys[event.key];
                              if (!next) return;
                              event.preventDefault();
                              set(next());
                          },
                      }
                    : {}) as object)}
                className={styles.items()}
            >
                {Array.from({ length: count }, (_, index) => {
                    const filled = current >= index + 1;
                    const half = !filled && current >= index + 0.5;
                    const look = rating({ size, filled });
                    return (
                        <Pressable
                            key={index}
                            aria-hidden
                            tabIndex={-1}
                            disabled={disabled}
                            className={look.item()}
                            onLayout={
                                index === 0
                                    ? (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)
                                    : undefined
                            }
                            onPress={(event) => choose(index, event)}
                        >
                            <Icon icon={icon} className={look.icon()} filled={filled} />
                            {half && (
                                <View className={styles.half()} pointerEvents="none">
                                    <View className={styles.halfInner()} style={{ width }}>
                                        <Icon icon={icon} className={rating({ size, filled: true }).icon()} filled />
                                    </View>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
