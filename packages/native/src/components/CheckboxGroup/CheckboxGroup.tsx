import { checkboxGroup } from '@wirecore/wirelayer-recipes/native';
import { useId, type ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { ChoiceGroupContext } from '../../utils/choice-group.js';
import { useControllable } from '../../utils/useControllable.js';

export interface CheckboxGroupProps extends ViewProps {
    /** Values of the ticked checkboxes (controlled) */
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** Visible label of the group (names it); otherwise pass aria-label */
    label?: string;
    helperText?: string;
    /** Error message – also marks the group and its checkboxes invalid */
    error?: string;
    invalid?: boolean;
    /** Shows the required mark after the label */
    required?: boolean;
    disabled?: boolean;
    /** At most this many can be ticked – the others are disabled until one is unticked (announced) */
    max?: number;
    /** vertical (default) or horizontal */
    orientation?: 'vertical' | 'horizontal';
    /** Cards in a grid with this many columns – for CheckboxCard */
    columns?: number;
    /** Checkbox or CheckboxCard elements with a `value` */
    children?: ReactNode;
}

/** A named group (role "group") of checkboxes or checkbox cards; helper and error text describe it */
export function CheckboxGroup(props: CheckboxGroupProps) {
    return <ChoiceGroup {...props} />;
}

/** Shared by CheckboxGroup and SwitchGroup */
export function ChoiceGroup({
    value,
    defaultValue = [],
    onValueChange,
    label,
    helperText,
    error,
    invalid = false,
    required = false,
    disabled = false,
    max,
    orientation,
    columns,
    className,
    children,
    ...props
}: CheckboxGroupProps) {
    const translations = useTranslations();
    const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
    const id = useId();
    const { announce, region } = useAnnouncer();
    const styles = checkboxGroup({ orientation, grid: !!columns && columns > 1, disabled });
    const isInvalid = invalid || !!error;
    const description = error ?? helperText;
    const toggle = (entry: string, checked: boolean) => {
        const next = checked
            ? [...current.filter((item) => item !== entry), entry]
            : current.filter((item) => item !== entry);
        setCurrent(next);
        if (max !== undefined && checked && next.length >= max) announce(translations.checkboxGroup.maxReached(max));
    };

    return (
        <ChoiceGroupContext.Provider
            value={{
                value: current,
                toggle,
                isBlocked: () => max !== undefined && current.length >= max,
                disabled,
                invalid: isInvalid,
                columns,
            }}
        >
            <View
                role="group"
                aria-labelledby={label ? `${id}label` : undefined}
                accessibilityHint={description}
                {...({ 'aria-describedby': description ? `${id}description` : undefined } as object)}
                aria-disabled={disabled || undefined}
                {...props}
                className={styles.base({ class: className })}
            >
                {!!label && (
                    <Text nativeID={`${id}label`} className={styles.label()}>
                        {label}
                        {required && (
                            <Text className={styles.requiredIndicator()} aria-hidden>
                                {' *'}
                            </Text>
                        )}
                    </Text>
                )}
                <View className={styles.items()}>{children}</View>
                {!!description && (
                    <Text
                        nativeID={`${id}description`}
                        className={error ? styles.errorText() : styles.helperText()}
                        role={error ? 'alert' : undefined}
                    >
                        {description}
                    </Text>
                )}
                {region}
            </View>
        </ChoiceGroupContext.Provider>
    );
}
