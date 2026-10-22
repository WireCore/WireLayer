import { isSwipeDismiss, toast as toastRecipe } from '@wirecore/wirelayer-recipes/native';
import { CircleCheck, Info, OctagonX, TriangleAlert, X } from 'lucide-react-native';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
    AccessibilityInfo,
    ActivityIndicator,
    Animated,
    Platform,
    Pressable,
    Text,
    View,
    type GestureResponderEvent,
} from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { Icon } from '../../utils/Icon.js';
import { nativeDriver } from '../../utils/motion.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';
import { dismissToast, toastStore, type ToastItem } from './toaster.js';
import { useTranslations } from '../../locale.js';

const icons = { success: CircleCheck, info: Info, warning: TriangleAlert, error: OctagonX };

export type ToastPlacement = 'top-start' | 'top' | 'top-end' | 'bottom-start' | 'bottom' | 'bottom-end';

export interface ToasterProps {
    /** Accessible name of the notification region */
    label?: string;
    /** Accessible name of each toast's close button */
    closeLabel?: string;
    /** Top or bottom edge of the screen (default bottom) – on a phone toasts take the width, start/end align the same */
    placement?: ToastPlacement;
    /** Decorative bar with the time left (toasts with a limit); stands still while the toast is pressed */
    showProgress?: boolean;
    /** Swipe sideways to dismiss – the close button stays */
    swipeToDismiss?: boolean;
}

/**
 * Place once at the root of the app; show toasts with toast({ title, description, type, action }),
 * toast.promise(…), toast.update(id, …) and toast.dismiss(id)
 */
export function Toaster({ label, closeLabel, placement = 'bottom', showProgress, swipeToDismiss }: ToasterProps) {
    const translations = useTranslations();
    const items = useSyncExternalStore(toastStore.subscribe, toastStore.get, toastStore.get);
    const styles = toastRecipe({ placement: placement.startsWith('top') ? 'top' : 'bottom' });

    // The web reads the live region; iOS/Android announce each new toast and each change (loading → success)
    const announced = useRef(new Set<string>());
    useEffect(() => {
        for (const item of items) {
            const key = `${item.id}:${item.type}:${item.title}`;
            if (announced.current.has(key)) continue;
            announced.current.add(key);
            if (Platform.OS !== 'web') {
                AccessibilityInfo.announceForAccessibility([item.title, item.description].filter(Boolean).join('. '));
            }
        }
    }, [items]);

    return (
        <View
            className={styles.region()}
            pointerEvents="box-none"
            role="region"
            aria-label={label ?? translations.toast.label}
            aria-live="polite"
        >
            {items.map((item) => (
                <ToastView
                    key={item.id}
                    item={item}
                    closeLabel={closeLabel ?? translations.common.close}
                    showProgress={!!showProgress}
                    swipeToDismiss={!!swipeToDismiss}
                />
            ))}
        </View>
    );
}

function ToastView({
    item,
    closeLabel,
    showProgress,
    swipeToDismiss,
}: {
    item: ToastItem;
    closeLabel: string;
    showProgress: boolean;
    swipeToDismiss: boolean;
}) {
    const styles = toastRecipe();
    const reducedMotion = useReducedMotion();
    const [opacity] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));
    const [offset] = useState(() => new Animated.Value(0));
    const [left] = useState(() => new Animated.Value(1));
    const width = useRef(0);
    const spinner = useResolveClassNames(styles.icon());

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: 1,
            duration: reducedMotion ? 0 : 200,
            useNativeDriver: nativeDriver,
        }).start();
    }, [opacity, reducedMotion]);

    // The bar shrinks over the time left; it stands still while paused
    // Hidden with reduced motion (a moving bar is only decoration)
    const limited = Number.isFinite(item.total) && !reducedMotion;
    useEffect(() => {
        if (!showProgress || !limited) return;
        const remaining = toastStore.remaining(item.id);
        left.setValue(remaining / item.total);
        if (item.paused) return;
        const run = Animated.timing(left, { toValue: 0, duration: remaining, useNativeDriver: false });
        run.start();
        return () => run.stop();
    }, [showProgress, limited, item.paused, item.total, item.id, item.type, item.title, left]);

    // Swipe sideways (responder system): the toast follows the finger, far enough dismisses it
    const start = useRef({ x: 0, y: 0 });
    const moved = (event: GestureResponderEvent) => ({
        dx: event.nativeEvent.pageX - start.current.x,
        dy: event.nativeEvent.pageY - start.current.y,
    });
    const swipe = {
        onMoveShouldSetResponder: (event: GestureResponderEvent) => {
            const { dx, dy } = moved(event);
            return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy);
        },
        onResponderMove: (event: GestureResponderEvent) => offset.setValue(moved(event).dx),
        onResponderRelease: (event: GestureResponderEvent) => {
            const { dx } = moved(event);
            if (isSwipeDismiss(dx, width.current)) {
                Animated.timing(offset, {
                    toValue: Math.sign(dx) * width.current,
                    duration: 150,
                    useNativeDriver: nativeDriver,
                }).start(() => dismissToast(item.id));
            } else Animated.spring(offset, { toValue: 0, useNativeDriver: nativeDriver }).start();
        },
        onResponderTerminate: () => offset.setValue(0),
    };

    const icon = item.type && item.type !== 'loading' ? icons[item.type] : undefined;
    const urgent = item.type === 'error' || item.type === 'warning';

    return (
        <Animated.View
            className={styles.root()}
            style={{ opacity, transform: [{ translateX: offset }] }}
            role={urgent ? 'alert' : 'status'}
            onLayout={(event) => {
                width.current = event.nativeEvent.layout.width;
            }}
            {...(swipeToDismiss ? swipe : {})}
            onTouchStart={(event) => {
                start.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
                toastStore.pause(item.id);
            }}
            onTouchEnd={() => toastStore.resume(item.id)}
            onTouchCancel={() => toastStore.resume(item.id)}
        >
            {item.type === 'loading' ? (
                <ActivityIndicator
                    color={typeof spinner.color === 'string' ? spinner.color : undefined}
                    size="small"
                    aria-hidden
                />
            ) : (
                icon && <Icon icon={icon} className={styles.icon()} />
            )}
            <View className={styles.text()}>
                <Text className={styles.title()}>{item.title}</Text>
                {item.description && <Text className={styles.description()}>{item.description}</Text>}
            </View>
            {item.action && (
                <Pressable
                    role="button"
                    className={styles.action()}
                    onPress={() => {
                        item.action?.onPress();
                        dismissToast(item.id);
                    }}
                >
                    <Text className={styles.actionLabel()}>{item.action.label}</Text>
                </Pressable>
            )}
            <Pressable
                role="button"
                className={styles.close()}
                aria-label={closeLabel}
                hitSlop={8}
                onPress={() => dismissToast(item.id)}
            >
                <Icon icon={X} className={styles.closeIcon()} />
            </Pressable>
            {showProgress && limited && (
                <View className={styles.progress()} aria-hidden>
                    <Animated.View
                        className={styles.progressRange()}
                        style={{ width: left.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}
                    />
                </View>
            )}
        </Animated.View>
    );
}
