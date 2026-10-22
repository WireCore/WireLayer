import { spoiler } from '@wirecore/wirelayer-recipes/native';
import { useId, useState, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useControllable } from '../../utils/useControllable.js';

export interface SpoilerProps extends ViewProps {
    /** Height (pt) of the cut content (default 120) */
    maxHeight?: number;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Text of the button while cut (default "Show more") */
    showLabel?: string;
    /** Text of the button while open (default "Show less") */
    hideLabel?: string;
    className?: string;
    children: ReactNode;
}

/**
 * Cuts long content at a height with "Show more" – the button only appears when the content is higher. The cut
 * part stays readable for screen readers.
 */
export function Spoiler({
    maxHeight = 120,
    open: openProp,
    onOpenChange,
    showLabel,
    hideLabel,
    className,
    children,
    ...props
}: SpoilerProps) {
    const translations = useTranslations();
    const styles = spoiler();
    const id = `${useId()}content`;
    const [open, setOpen] = useControllable(openProp, false, onOpenChange);
    const [height, setHeight] = useState(0);
    const cut = height > maxHeight;
    return (
        <View {...props} className={styles.base({ class: className })}>
            <View nativeID={id} className={styles.content()} style={open || !cut ? undefined : { maxHeight }}>
                <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>{children}</View>
            </View>
            {cut && (
                <Pressable
                    role="button"
                    aria-expanded={open}
                    {...({ 'aria-controls': id } as object)}
                    className={styles.toggle()}
                    onPress={() => setOpen(!open)}
                >
                    <Text className={styles.toggleLabel()}>
                        {open ? (hideLabel ?? translations.spoiler.hide) : (showLabel ?? translations.spoiler.show)}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}
