import { fieldset } from '@wirecore/wirelayer-recipes/native';
import { ChevronDown } from 'lucide-react-native';
import { useId, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { Icon } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';

export interface FieldsetProps extends ViewProps {
    /** Name of the group – read before each of its fields */
    legend: string;
    helperText?: string;
    /** Error of the whole group (e.g. "Choose at least one option") */
    errorText?: string;
    invalid?: boolean;
    disabled?: boolean;
    /** The legend opens and closes the fields */
    collapsible?: boolean;
    open?: boolean;
    /** Open at the start (default true) */
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
    children?: ReactNode;
}

/**
 * Group of related fields with a legend (role group, named by the legend), help and error text; optionally
 * collapsible
 */
export function Fieldset({
    legend,
    helperText,
    errorText,
    invalid = false,
    disabled = false,
    collapsible = false,
    open: openProp,
    defaultOpen = true,
    onOpenChange,
    className,
    children,
    ...props
}: FieldsetProps) {
    const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
    const shown = !collapsible || open;
    const hasError = invalid && !!errorText;
    const styles = fieldset({ invalid: hasError || invalid, disabled, open: shown });
    const id = useId();
    return (
        <View
            role="group"
            aria-labelledby={`${id}legend`}
            {...({ 'aria-describedby': hasError ? `${id}error` : helperText ? `${id}helper` : undefined } as object)}
            aria-disabled={disabled || undefined}
            {...props}
            className={styles.base({ class: className })}
        >
            {collapsible ? (
                <Pressable
                    role="button"
                    aria-expanded={open}
                    {...({ 'aria-controls': open ? `${id}content` : undefined } as object)}
                    className={styles.toggle()}
                    onPress={() => setOpen(!open)}
                >
                    <Icon icon={ChevronDown} className={styles.chevron()} />
                    <Text nativeID={`${id}legend`} className={styles.legend()}>
                        {legend}
                    </Text>
                </Pressable>
            ) : (
                <Text nativeID={`${id}legend`} className={styles.legend()}>
                    {legend}
                </Text>
            )}
            {shown && (
                <View nativeID={`${id}content`} className={styles.content()}>
                    {!!helperText && (
                        <Text nativeID={`${id}helper`} className={styles.helper()}>
                            {helperText}
                        </Text>
                    )}
                    {children}
                    {hasError && (
                        <Text nativeID={`${id}error`} role="alert" className={styles.error()}>
                            {errorText}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}
