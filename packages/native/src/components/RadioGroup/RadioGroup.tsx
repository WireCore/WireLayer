import { radioGroup, type RadioGroupOrientation } from '@wirecore/wirelayer-recipes/native';
import { createContext, useContext, useId, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { useControllable } from '../../utils/useControllable.js';

interface RadioGroupContextValue {
    value: string | null;
    select: (value: string) => void;
    disabled: boolean;
    invalid: boolean;
    /** Cards per row (RadioCard) */
    columns?: number;
}

const RadioGroupContext = createContext<RadioGroupContextValue>({
    value: null,
    select: () => {},
    disabled: false,
    invalid: false,
});

/** The surrounding RadioGroup (RadioCard) */
export const useRadioGroup = () => useContext(RadioGroupContext);

export interface RadioGroupProps extends ViewProps {
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    /** Visible label, also the group's accessible name */
    label?: string;
    orientation?: RadioGroupOrientation;
    /** Cards in a grid with this many columns – for RadioCard */
    columns?: number;
    disabled?: boolean;
    invalid?: boolean;
    /** Shows the required mark after the label */
    required?: boolean;
    children?: ReactNode;
}

/** One choice out of several (role radiogroup) named by its label; RadioGroupItem or RadioCard inside, cards in `columns` */
export function RadioGroup({
    value,
    defaultValue = null,
    onValueChange,
    label,
    orientation,
    columns,
    disabled = false,
    invalid = false,
    required = false,
    className,
    children,
    ...props
}: RadioGroupProps) {
    const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
    const labelId = `${useId()}label`;
    const styles = radioGroup({ orientation });

    return (
        <RadioGroupContext.Provider value={{ value: current, select: setCurrent, disabled, invalid, columns }}>
            <View
                role="radiogroup"
                aria-labelledby={label ? labelId : undefined}
                {...({ 'aria-required': required || undefined } as object)}
                {...props}
                className={styles.base({ class: className })}
            >
                {label && (
                    <Text nativeID={labelId} className={styles.label()}>
                        {label}
                        {required && (
                            <Text className={radioGroup().requiredIndicator()} aria-hidden>
                                {' *'}
                            </Text>
                        )}
                    </Text>
                )}
                <View className={columns && columns > 1 ? styles.grid() : styles.items()}>{children}</View>
            </View>
        </RadioGroupContext.Provider>
    );
}

export interface RadioGroupItemProps {
    value: string;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
}

/** One option of a RadioGroup: a radio button with its label (Space chooses on the web) */
export function RadioGroupItem({ value, disabled, className, children }: RadioGroupItemProps) {
    const group = useContext(RadioGroupContext);
    const checked = group.value === value;
    const isDisabled = disabled ?? group.disabled;
    const styles = radioGroup({ checked, invalid: group.invalid });
    const choose = () => group.select(value);

    return (
        <Pressable
            role="radio"
            aria-checked={checked}
            disabled={isDisabled}
            aria-disabled={isDisabled || undefined}
            className={styles.item({ class: className })}
            onPress={choose}
            {...(isDisabled ? {} : toggleOnSpace(choose))}
        >
            <View className={styles.control()}>{checked && <View className={styles.dot()} />}</View>
            {typeof children === 'string' ? <Text className={styles.itemLabel()}>{children}</Text> : children}
        </Pressable>
    );
}
