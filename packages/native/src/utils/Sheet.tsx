import { select } from '@wirecore/wirelayer-recipes/native';
import { X } from 'lucide-react-native';
import { useId, useRef, type ComponentRef, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Icon } from './Icon.js';
import { useEscape } from './useEscape.js';
import { useReducedMotion } from './useReducedMotion.js';

const styles = select();

export interface SheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    closeLabel: string;
    /** Role of the list: radiogroup (Select), menu (Menu), group (checkboxes) – none for other content */
    listRole?: 'radiogroup' | 'menu' | 'group';
    /** Content above the scrolling list, e.g. a search field */
    before?: ReactNode;
    /** Text under the title, read as the description of the sheet */
    description?: string;
    /** Buttons below the scrolling content */
    footer?: ReactNode;
    /** Moves the focus to the close button when the sheet opens (web) – for sheets without a list */
    focusClose?: boolean;
    /** Called once the sheet is shown – the web moves the focus into it there */
    onShow?: () => void;
    /**
     * Called once the sheet has hidden (after its animation; iOS and the web) – the web hands the focus back to the
     * trigger first, so a focus elsewhere (e.g. on a moved item) belongs here
     */
    onHidden?: () => void;
    /** false: the children scroll themselves (a FlatList that loads more at its end) */
    scroll?: boolean;
    /** Shows the close button (default true) */
    closable?: boolean;
    /** Extra classes of the sheet panel, e.g. a height from `sheetSize` */
    className?: string;
    children: ReactNode;
}

/**
 * Bottom sheet for the pickers, Menu and Drawer: a modal (the system keeps focus inside, back button closes it) that slides
 * up, without animation when reduced motion is on. Pressing outside and Escape (web) close it.
 */
export function Sheet({
    open,
    onClose,
    title,
    closeLabel,
    listRole,
    before,
    description,
    footer,
    focusClose = false,
    onShow,
    onHidden,
    scroll = true,
    closable = true,
    className,
    children,
}: SheetProps) {
    const reducedMotion = useReducedMotion();
    const id = useId();
    const titleId = `${id}title`;
    const closeButton = useRef<ComponentRef<typeof Pressable>>(null);
    useEscape(open, onClose);

    return (
        <Modal
            visible={open}
            transparent
            animationType={reducedMotion ? 'none' : 'slide'}
            onRequestClose={onClose}
            onDismiss={onHidden}
            onShow={() => {
                if (focusClose && Platform.OS === 'web') closeButton.current?.focus();
                onShow?.();
            }}
            statusBarTranslucent
        >
            <View className={styles.backdrop()}>
                <Pressable className={styles.dismissArea()} onPress={onClose} aria-hidden tabIndex={-1} />
                <View
                    role="dialog"
                    aria-modal
                    aria-labelledby={titleId}
                    {...({ 'aria-describedby': description ? `${id}description` : undefined } as object)}
                    className={styles.sheet({ class: className })}
                >
                    <View className={styles.sheetHeader()}>
                        <Text nativeID={titleId} role="heading" className={styles.sheetTitle()}>
                            {title}
                        </Text>
                        {closable && (
                            <Pressable
                                ref={closeButton}
                                role="button"
                                hitSlop={6}
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
                    {before}
                    {scroll ? (
                        <ScrollView contentContainerClassName={styles.list()} keyboardShouldPersistTaps="handled">
                            {listRole ? (
                                <View role={listRole} aria-labelledby={titleId}>
                                    {children}
                                </View>
                            ) : (
                                children
                            )}
                        </ScrollView>
                    ) : (
                        children
                    )}
                    {footer && <View className={styles.footer()}>{footer}</View>}
                </View>
            </View>
        </Modal>
    );
}
