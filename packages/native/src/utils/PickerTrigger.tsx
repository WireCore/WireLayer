import { select, visuallyHidden } from '@wirecore/wirelayer-recipes/native';
import { ChevronDown, X } from 'lucide-react-native';
import { useRef, type ComponentRef, type ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Icon, type IconComponent } from './Icon.js';
import { useFocusTarget } from './focus-registry.js';
import { Loader } from './Loader.js';

export interface PickerTriggerProps {
    /** Accessible name of the field (Field label or aria-label) */
    label?: string;
    /** Chosen value as text, or undefined for the placeholder */
    text?: string;
    placeholder: string;
    icon?: IconComponent;
    indicator?: IconComponent;
    open: boolean;
    invalid: boolean;
    disabled: boolean;
    /** Field props (labelledby, description, invalid) */
    controlProps: object;
    /** Field `id` – the trigger's nativeID, the target of FormErrorSummary */
    controlId?: string;
    onPress: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Spinner before the chevron, the trigger is busy */
    loading?: boolean;
    /** Chosen labels as chips (decoration – the name carries them) */
    chips?: string[];
    /** Own content of the value (renderValue) – the name still uses `text` */
    content?: ReactNode;
    /** Shows a clear button next to the trigger while there is a value */
    onClear?: () => void;
    clearLabel?: string;
}

/**
 * The button of Select-like pickers: named "Label: value", so the current choice is read along. The clear button
 * sits beside it (a button may not contain another one).
 */
export function PickerTrigger({
    label,
    text,
    placeholder,
    icon,
    indicator = ChevronDown,
    open,
    invalid,
    disabled,
    controlProps,
    controlId,
    onPress,
    className,
    size,
    loading = false,
    chips,
    content,
    onClear,
    clearLabel,
}: PickerTriggerProps) {
    const clearable = !!onClear && text !== undefined && !disabled;
    const styles = select({ open, invalid, disabled, size, hasChips: !!chips?.length, withClear: clearable });
    const ref = useRef<ComponentRef<typeof Pressable>>(null);
    const webChips = Platform.OS === 'web' && !!chips?.length && !content;
    useFocusTarget(controlId, ref);
    const trigger = (
        <Pressable
            ref={ref}
            nativeID={controlId}
            role="button"
            {...controlProps}
            // A button cannot be required (ARIA) – the Field shows the mark
            {...({ 'aria-required': undefined } as object)}
            // Chips on the web: the name comes from the content (a hidden label, then the chips as they show)
            aria-label={webChips ? undefined : [label, text ?? placeholder].filter(Boolean).join(': ')}
            aria-labelledby={undefined}
            className={onClear ? styles.trigger() : styles.trigger({ class: className })}
            disabled={disabled}
            aria-disabled={disabled || undefined}
            aria-busy={loading || undefined}
            onPress={onPress}
        >
            <View className={styles.value()}>
                {content ??
                    (chips?.length ? (
                        <View className={styles.chips()} aria-hidden={!webChips}>
                            {webChips && label && <Text className={visuallyHidden()}>{`${label}: `}</Text>}
                            {chips.map((chip, index) => (
                                <View key={`${index}-${chip}`} className={styles.chip()}>
                                    <Text className={styles.chipText()} numberOfLines={1}>
                                        {chip}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <>
                            {icon && <Icon icon={icon} className={styles.icon()} />}
                            <Text className={text ? styles.valueText() : styles.placeholder()} numberOfLines={1}>
                                {text ?? placeholder}
                            </Text>
                        </>
                    ))}
            </View>
            {loading && <Loader className={styles.spinner()} />}
            <Icon icon={indicator} className={styles.indicator()} />
        </Pressable>
    );
    if (!onClear) return trigger;
    return (
        <View className={styles.field({ class: className })}>
            {trigger}
            {clearable && (
                <Pressable role="button" aria-label={clearLabel} className={styles.clear()} onPress={onClear}>
                    <Icon icon={X} className={styles.clearIcon()} />
                </Pressable>
            )}
        </View>
    );
}
