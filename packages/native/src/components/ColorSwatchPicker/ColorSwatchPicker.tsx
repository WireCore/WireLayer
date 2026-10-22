import { colorSwatchPicker, parseHex } from '@wirecore/wirelayer-recipes/native';
import { Check } from 'lucide-react-native';
import { useId } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { useControllable } from '../../utils/useControllable.js';

export interface ColorSwatch {
    /** Colour, e.g. "#1e66f5" – also the value */
    value: string;
    /** Name of the color, e.g. "Blue" (its accessible name) */
    label: string;
    disabled?: boolean;
}

export interface ColorSwatchPickerProps {
    /** The colours to choose from */
    items: ColorSwatch[];
    /** Chosen colour (its value, controlled) */
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    /** Visible label of the group (default "Color") */
    label?: string;
    /** Shows the names below the swatches (otherwise only for screen readers) */
    showLabels?: boolean;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    invalid?: boolean;
    className?: string;
}

/** Light colours get a dark tick, dark colours a light one */
export const inkOf = (color: string): 'light' | 'dark' => {
    const rgb = parseHex(color);
    if (!rgb) return 'light';
    return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b > 150 ? 'dark' : 'light';
};

/** Colours as a radio group: every swatch is named by its colour name (44 pt touch target), the chosen one has a tick */
export function ColorSwatchPicker({
    items,
    value,
    defaultValue = null,
    onValueChange,
    label,
    showLabels = false,
    size,
    disabled = false,
    invalid = false,
    className,
}: ColorSwatchPickerProps) {
    const translations = useTranslations();
    const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
    const id = useId();
    const styles = colorSwatchPicker({ size, disabled });
    return (
        <View className={styles.base({ class: className })}>
            <Text nativeID={`${id}label`} className={styles.label()}>
                {label ?? translations.colorSwatchPicker.label}
            </Text>
            <View
                role="radiogroup"
                aria-labelledby={`${id}label`}
                {...({ 'aria-invalid': invalid || undefined } as object)}
                className={styles.items()}
            >
                {items.map((item) => {
                    const checked = item.value === current;
                    const look = colorSwatchPicker({ size, checked, ink: inkOf(item.value) });
                    const off = disabled || !!item.disabled;
                    const choose = () => setCurrent(item.value);
                    return (
                        <Pressable
                            key={item.value}
                            role="radio"
                            aria-checked={checked}
                            aria-label={item.label}
                            disabled={off}
                            aria-disabled={off || undefined}
                            className={look.item()}
                            onPress={choose}
                            {...(off ? {} : toggleOnSpace(choose))}
                        >
                            <View className={look.swatch()} style={{ backgroundColor: item.value }}>
                                {checked && <Icon icon={Check} className={look.check()} />}
                            </View>
                            {showLabels && (
                                <Text className={look.name()} aria-hidden>
                                    {item.label}
                                </Text>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
