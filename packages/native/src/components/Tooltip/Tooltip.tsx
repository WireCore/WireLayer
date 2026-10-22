import { tooltip } from '@wirecore/wirelayer-recipes/native';
import { cloneElement, useEffect, useId, useState, type ReactElement } from 'react';
import { Platform, Text, View } from 'react-native';

export interface TooltipProps {
    /** Short help text – read as the trigger's description */
    content: string;
    /** Above (default) or below the trigger */
    placement?: 'top' | 'bottom';
    /** Never opens – the trigger stays as it is */
    disabled?: boolean;
    /** The trigger, e.g. an IconButton (gets onLongPress, onFocus, onBlur) */
    children: ReactElement<Record<string, unknown>>;
}

/**
 * Touch: long press shows the text for a few seconds. Web: hover and keyboard focus, Escape hides it, the pointer
 * can move onto the bubble (WCAG 1.4.13). Screen readers get the text as description/hint either way.
 */
export function Tooltip({ content, placement, disabled = false, children }: TooltipProps) {
    const styles = tooltip({ placement });
    const id = `${useId()}tooltip`;
    const [visible, setVisible] = useState(false);
    const [touchShown, setTouchShown] = useState(0);

    // After a long press it hides by itself
    useEffect(() => {
        if (!touchShown) return;
        const timer = setTimeout(() => setVisible(false), 2500);
        return () => clearTimeout(timer);
    }, [touchShown]);

    const web = Platform.OS === 'web';
    if (disabled) return children;
    const trigger = cloneElement(children, {
        accessibilityHint: web ? undefined : content,
        ...(web ? { 'aria-describedby': id } : {}),
        onLongPress: () => {
            setVisible(true);
            setTouchShown((count) => count + 1);
        },
        onFocus: () => setVisible(true),
        onBlur: () => setVisible(false),
    });

    return (
        <View
            className={styles.base()}
            {...({
                onPointerEnter: () => setVisible(true),
                onPointerLeave: () => setVisible(false),
                onKeyDown: (event: { key: string }) => {
                    if (event.key === 'Escape') setVisible(false);
                },
            } as object)}
        >
            {trigger}
            {/* Always present (hidden while closed), so aria-describedby can point at it */}
            <View className={styles.anchor({ class: visible ? undefined : 'hidden' })} pointerEvents="box-none">
                <View nativeID={id} className={styles.bubble()} role="tooltip">
                    <Text className={styles.text()}>{content}</Text>
                </View>
            </View>
        </View>
    );
}
