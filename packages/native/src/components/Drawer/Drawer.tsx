import { drawer, sheetSize, type OverlaySize } from '@wirecore/wirelayer-recipes/native';
import { X } from 'lucide-react-native';
import { useId, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Animated, Dimensions, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { nativeDriver } from '../../utils/motion.js';
import { Sheet } from '../../utils/Sheet.js';
import { useEscape } from '../../utils/useEscape.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';

export interface DrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    /** Edge it slides in from: `bottom` (default, a sheet), `left`, `right` or `top` */
    placement?: 'left' | 'right' | 'top' | 'bottom';
    /** Width (left/right: 280–480 px) or height (top/bottom: 30–85 %); `full` covers the screen */
    size?: OverlaySize;
    /** Shows the close button (default true) */
    closable?: boolean;
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Action buttons at the bottom */
    footer?: ReactNode;
    children?: ReactNode;
}

/**
 * Panel that slides in from an edge of the screen: from the bottom a sheet (default), from the side e.g. for the
 * navigation. A modal with a title, any content and optional buttons; the back button, Escape (web) and a press
 * outside close it. Without animation when reduced motion is on.
 */
export function Drawer({
    open,
    onOpenChange,
    title,
    description,
    placement = 'bottom',
    size,
    closable = true,
    closeLabel,
    footer,
    children,
}: DrawerProps) {
    const translations = useTranslations();
    if (placement === 'bottom')
        return (
            <Sheet
                open={open}
                onClose={() => onOpenChange(false)}
                title={title}
                description={description}
                closeLabel={closeLabel ?? translations.common.close}
                footer={footer}
                closable={closable}
                className={size ? sheetSize({ size }) : undefined}
                focusClose
            >
                {children}
            </Sheet>
        );
    return (
        <SidePanel
            open={open}
            onClose={() => onOpenChange(false)}
            title={title}
            description={description}
            placement={placement}
            size={size}
            closable={closable}
            closeLabel={closeLabel ?? translations.common.close}
            footer={footer}
        >
            {children}
        </SidePanel>
    );
}

function SidePanel({
    open,
    onClose,
    title,
    description,
    placement,
    size,
    closable,
    closeLabel,
    footer,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    placement: 'left' | 'right' | 'top';
    size?: OverlaySize;
    closable: boolean;
    closeLabel: string;
    footer?: ReactNode;
    children?: ReactNode;
}) {
    const styles = drawer({ placement, size });
    const reducedMotion = useReducedMotion();
    const id = useId();
    const closeButton = useRef<ComponentRef<typeof Pressable>>(null);
    const [offset] = useState(() => new Animated.Value(0));
    useEscape(open, onClose);

    // Slides in when shown; closing fades out with the modal
    const slideIn = () => {
        const { width, height } = Dimensions.get('window');
        const distance = placement === 'top' ? -height : placement === 'left' ? -width : width;
        offset.setValue(reducedMotion ? 0 : distance);
        Animated.timing(offset, {
            toValue: 0,
            duration: reducedMotion ? 0 : 220,
            useNativeDriver: nativeDriver,
        }).start();
    };
    const transform = placement === 'top' ? [{ translateY: offset }] : [{ translateX: offset }];

    return (
        <Modal
            visible={open}
            transparent
            animationType={reducedMotion ? 'none' : 'fade'}
            onRequestClose={onClose}
            onShow={() => {
                slideIn();
                if (Platform.OS === 'web') closeButton.current?.focus();
            }}
            statusBarTranslucent
        >
            <View className={styles.backdrop()}>
                <Pressable className={styles.dismissArea()} onPress={onClose} aria-hidden tabIndex={-1} />
                <Animated.View
                    role="dialog"
                    aria-modal
                    aria-labelledby={`${id}title`}
                    {...({ 'aria-describedby': description ? `${id}description` : undefined } as object)}
                    accessibilityViewIsModal
                    className={styles.panel()}
                    style={{ transform }}
                >
                    <View className={styles.header()}>
                        <Text nativeID={`${id}title`} role="heading" className={styles.title()}>
                            {title}
                        </Text>
                        {closable && (
                            <Pressable
                                ref={closeButton}
                                role="button"
                                className={styles.close()}
                                aria-label={closeLabel}
                                onPress={onClose}
                            >
                                <Icon icon={X} className={styles.closeIcon()} />
                            </Pressable>
                        )}
                    </View>
                    {description && (
                        <Text nativeID={`${id}description`} className={styles.description()}>
                            {description}
                        </Text>
                    )}
                    <ScrollView contentContainerClassName={styles.body()} keyboardShouldPersistTaps="handled">
                        {children}
                    </ScrollView>
                    {footer && <View className={styles.footer()}>{footer}</View>}
                </Animated.View>
            </View>
        </Modal>
    );
}
