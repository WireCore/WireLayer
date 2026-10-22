import { dialog, type DialogStatus, type OverlaySize } from '@wirecore/wirelayer-recipes/native';
import { X } from 'lucide-react-native';
import { useEffect, useId, useRef, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { useEscape } from '../../utils/useEscape.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';
import { useTranslations } from '../../locale.js';

export interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** "alertdialog" for confirmations that interrupt the user */
    role?: 'dialog' | 'alertdialog';
    title: string;
    description?: string;
    /** Icon component in the coloured box at the top */
    icon?: IconComponent;
    status?: DialogStatus;
    /** Width: sm 320, md 400 (default), lg 560, xl 800, full the width of the screen */
    size?: OverlaySize;
    /** Centred (default), near the top or docked to the bottom edge */
    position?: 'center' | 'top' | 'bottom';
    /** Covers the whole screen (e.g. a form on a phone) */
    fullscreen?: boolean;
    /** Shows the close button at the top (default true) */
    closable?: boolean;
    /** A press on the dimmed background closes it (default true) – false for decisions the user has to make */
    closeOnInteractOutside?: boolean;
    /** Escape (web) and the Android back button close it (default true) */
    closeOnEscape?: boolean;
    /** `inside`: only the body scrolls, title and buttons stay in view (long content) */
    scrollBehavior?: 'inside' | 'outside';
    /** Gets the keyboard focus when it opens (web) instead of the close button, e.g. the safe choice */
    initialFocusRef?: RefObject<{ focus?: () => void } | null>;
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Action buttons at the bottom */
    footer?: ReactNode;
    className?: string;
    children?: ReactNode;
}

/**
 * Modal dialog on React Native's Modal: the system keeps focus inside, the Android back button and Escape
 * (web) close it. Fades in and out (slides when docked to the bottom), without animation when reduced motion is on.
 * On the web focus moves to the close button when it opens (like the web Dialog) – react-native-web only traps it.
 */
export function Dialog({
    open,
    onOpenChange,
    role = 'dialog',
    title,
    description,
    icon,
    status,
    size,
    position,
    fullscreen = false,
    closable = true,
    closeOnInteractOutside = true,
    closeOnEscape = true,
    scrollBehavior = 'outside',
    initialFocusRef,
    closeLabel,
    footer,
    className,
    children,
}: DialogProps) {
    const translations = useTranslations();
    const scrollInside = scrollBehavior === 'inside';
    const styles = dialog({ status, size, position, fullscreen, scrollInside, bare: !icon && !closable });
    const reducedMotion = useReducedMotion();
    const id = useId();
    const close = () => onOpenChange(false);
    const closeButton = useRef<ComponentRef<typeof Pressable>>(null);
    const content = useRef<ComponentRef<typeof View>>(null);
    const web = Platform.OS === 'web';
    useEscape(open && closeOnEscape, close);

    // Web: the focus moves into the dialog when it opens – also when it is mounted open (confirm(), openDialog()),
    // where react-native-web calls no onShow
    useEffect(() => {
        if (!open || !web) return;
        const frame = requestAnimationFrame(() => {
            // A field with autoFocus inside keeps it
            const node = content.current as unknown as HTMLElement | null;
            if (node?.contains(document.activeElement)) return;
            const target = initialFocusRef?.current ?? (closable ? closeButton.current : content.current);
            target?.focus?.();
        });
        return () => cancelAnimationFrame(frame);
    }, [open, web, closable, initialFocusRef]);

    const body = (
        <View className={styles.body()}>
            <Text nativeID={`${id}title`} role="heading" className={styles.title()}>
                {title}
            </Text>
            {description && (
                <Text nativeID={`${id}description`} className={styles.description()}>
                    {description}
                </Text>
            )}
            {children}
        </View>
    );

    return (
        <Modal
            visible={open}
            transparent
            animationType={reducedMotion ? 'none' : position === 'bottom' ? 'slide' : 'fade'}
            onRequestClose={() => {
                if (closeOnEscape) close();
            }}
            statusBarTranslucent
        >
            <View className={styles.backdrop()}>
                {/* Pressing outside closes; not reachable for assistive tech (the close button is) */}
                {closeOnInteractOutside && (
                    <Pressable className={styles.dismissArea()} onPress={close} aria-hidden tabIndex={-1} />
                )}
                <View
                    ref={content}
                    role={role}
                    aria-modal
                    aria-labelledby={`${id}title`}
                    {...({
                        'aria-describedby': description ? `${id}description` : undefined,
                        tabIndex: closable || !web ? undefined : -1,
                    } as object)}
                    accessibilityViewIsModal
                    className={styles.content({ class: className })}
                >
                    {(icon || closable) && (
                        <View className={styles.header()}>
                            {icon && (
                                <View className={styles.iconBox()}>
                                    <Icon icon={icon} className={styles.icon()} />
                                </View>
                            )}
                            {closable && (
                                <Pressable
                                    ref={closeButton}
                                    role="button"
                                    className={styles.close()}
                                    aria-label={closeLabel ?? translations.common.close}
                                    onPress={close}
                                >
                                    <Icon icon={X} className={styles.closeIcon()} />
                                </Pressable>
                            )}
                        </View>
                    )}
                    {scrollInside || fullscreen ? (
                        <ScrollView className={styles.scroller()} keyboardShouldPersistTaps="handled">
                            {body}
                        </ScrollView>
                    ) : (
                        body
                    )}
                    {footer && <View className={styles.footer()}>{footer}</View>}
                </View>
            </View>
        </Modal>
    );
}
