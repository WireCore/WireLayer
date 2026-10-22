import { chip, type ChipSize } from '@wirecore/wirelayer-recipes/native';
import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Image, Pressable, Text, View, type PressableProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';

export interface ChipProps {
    /** Text of the chip (or the children); also names its remove button */
    label?: string;
    /** Icon component before the label */
    icon?: IconComponent;
    /** Small round image before the label (decorative) */
    avatar?: string;
    /** Shows a remove button that calls `onRemove` */
    removable?: boolean;
    /** Accessible name of the remove button (default: "Remove <label>") */
    removeLabel?: string;
    onRemove?: () => void;
    /** Makes the chip itself a button */
    onPress?: PressableProps['onPress'];
    size?: ChipSize;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
}

/** A compact label with optional icon or image and a remove button (44 pt touch area) – e.g. a chosen filter */
export function Chip({
    label,
    icon,
    avatar,
    removable = false,
    removeLabel,
    onRemove,
    onPress,
    size,
    disabled = false,
    className,
    children,
}: ChipProps) {
    const translations = useTranslations();
    const text = label ?? (typeof children === 'string' ? children : undefined);
    const styles = chip({ size, removable, withAvatar: !!avatar, pressable: !!onPress, disabled });
    const content = (
        <>
            {avatar ? (
                <Image source={{ uri: avatar }} className={styles.avatar()} alt="" aria-hidden />
            ) : (
                icon && <Icon icon={icon} className={styles.icon()} />
            )}
            {text !== undefined ? (
                <Text className={styles.label()} numberOfLines={1}>
                    {text}
                </Text>
            ) : (
                children
            )}
        </>
    );
    const remove = removable && (
        <Pressable
            role="button"
            aria-label={removeLabel ?? translations.chip.remove(text)}
            disabled={disabled}
            className={styles.remove()}
            onPress={onRemove}
        >
            <Icon icon={X} className={styles.removeIcon()} />
        </Pressable>
    );
    // A pressable chip and its remove button are siblings – a button may not contain another one
    if (onPress && !removable)
        return (
            <Pressable
                role="button"
                disabled={disabled}
                onPress={onPress}
                className={styles.base({ class: className })}
            >
                {content}
            </Pressable>
        );
    if (onPress)
        return (
            <View className={styles.base({ class: className })}>
                <Pressable role="button" disabled={disabled} onPress={onPress} className={styles.action()}>
                    {content}
                </Pressable>
                {remove}
            </View>
        );
    return (
        <View className={styles.base({ class: className })} aria-disabled={disabled || undefined}>
            {content}
            {remove}
        </View>
    );
}
