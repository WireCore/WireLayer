import { popover } from '@wirecore/wirelayer-recipes/native';
import { X } from 'lucide-react-native';
import { cloneElement, useId, useRef, useState, type ComponentRef, type ReactElement, type ReactNode } from 'react';
import { Dimensions, Modal, Platform, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { useEscape } from '../../utils/useEscape.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';

export type PopoverPlacement = 'top' | 'bottom' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

export interface PopoverProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Side of the trigger (default bottom) – flips when there is no room; left/right do not fit on a phone */
    placement?: PopoverPlacement;
    /** `trigger`: as wide as the trigger */
    width?: 'trigger';
    /** Dims the screen behind the panel */
    overlay?: boolean;
    /** Accessible name of the panel (role dialog), shown as its heading */
    title: string;
    description?: string;
    /** Accessible name of the close button */
    closeLabel?: string;
    /** The trigger, e.g. a Button (gets onPress) */
    children: ReactElement<{ onPress?: () => void }>;
    /** Content of the panel */
    content: ReactNode;
}

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

const margin = 16;
const gutter = 8;

/**
 * Panel next to its trigger: measured on screen and shown in a transparent modal, flips above the trigger when
 * there is no room below. A press outside, the back button and Escape (web) close it. For longer content use a
 * Drawer (bottom sheet).
 */
export function Popover({
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom',
    width,
    overlay = false,
    title,
    description,
    closeLabel,
    children,
    content,
}: PopoverProps) {
    const translations = useTranslations();
    const styles = popover({ overlay });
    const reducedMotion = useReducedMotion();
    const id = useId();
    const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
    const [anchor, setAnchor] = useState<ComponentRef<typeof View> | null>(null);
    const closeButton = useRef<ComponentRef<typeof Pressable>>(null);
    const [trigger, setTrigger] = useState<Box | null>(null);
    const [panel, setPanel] = useState<{ width: number; height: number } | null>(null);
    const close = () => setOpen(false);
    useEscape(open, close);

    const show = () =>
        anchor?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
            setTrigger({ x, y, width: measuredWidth, height: measuredHeight });
            setOpen(true);
        });

    const screen = Dimensions.get('window');
    const maxWidth = Math.min(320, screen.width - margin * 2);
    const panelWidth = width === 'trigger' && trigger ? Math.min(trigger.width, screen.width - margin * 2) : undefined;
    const position = (() => {
        if (!trigger) return { top: 0, left: margin };
        const height = panel?.height ?? 0;
        const measured = panelWidth ?? panel?.width ?? maxWidth;
        const below = trigger.y + trigger.height + gutter;
        const above = trigger.y - gutter - height;
        const wantsTop = placement.startsWith('top');
        const fitsBelow = below + height <= screen.height - margin;
        const fitsAbove = above >= margin;
        const top = (wantsTop ? fitsAbove || !fitsBelow : !fitsBelow && fitsAbove) ? above : below;
        const align = placement.endsWith('-start') ? 'start' : placement.endsWith('-end') ? 'end' : 'center';
        const left =
            align === 'start'
                ? trigger.x
                : align === 'end'
                  ? trigger.x + trigger.width - measured
                  : trigger.x + trigger.width / 2 - measured / 2;
        return { top, left: Math.min(Math.max(left, margin), screen.width - margin - measured) };
    })();

    return (
        <>
            <View ref={setAnchor} collapsable={false} className={styles.anchor()}>
                {cloneElement(children, { onPress: show })}
            </View>
            <Modal
                visible={open}
                transparent
                animationType={reducedMotion ? 'none' : 'fade'}
                onRequestClose={close}
                onShow={() => {
                    // Opened from outside (controlled `open`): measure the trigger now
                    if (!trigger)
                        anchor?.measureInWindow((x, y, measuredWidth, measuredHeight) =>
                            setTrigger({ x, y, width: measuredWidth, height: measuredHeight })
                        );
                    if (Platform.OS === 'web') closeButton.current?.focus();
                }}
            >
                <View className={styles.backdrop()}>
                    <Pressable className={styles.dismissArea()} onPress={close} aria-hidden tabIndex={-1} />
                    <View
                        role="dialog"
                        aria-labelledby={`${id}title`}
                        {...({ 'aria-describedby': description ? `${id}description` : undefined } as object)}
                        accessibilityViewIsModal
                        className={styles.panel()}
                        style={{
                            ...position,
                            maxWidth,
                            width: panelWidth,
                            // Invisible until measured, so it does not jump
                            opacity: panel ? 1 : 0,
                        }}
                        onLayout={(event: LayoutChangeEvent) => {
                            const { width: measuredWidth, height } = event.nativeEvent.layout;
                            if (panel?.width !== measuredWidth || panel.height !== height)
                                setPanel({ width: measuredWidth, height });
                        }}
                    >
                        <View className={styles.header()}>
                            <Text nativeID={`${id}title`} role="heading" className={styles.title()}>
                                {title}
                            </Text>
                            <Pressable
                                ref={closeButton}
                                role="button"
                                aria-label={closeLabel ?? translations.common.close}
                                className={styles.close()}
                                onPress={close}
                            >
                                <Icon icon={X} className={styles.closeIcon()} />
                            </Pressable>
                        </View>
                        {description && (
                            <Text nativeID={`${id}description`} className={styles.description()}>
                                {description}
                            </Text>
                        )}
                        <View className={styles.body()}>{content}</View>
                    </View>
                </View>
            </Modal>
        </>
    );
}
