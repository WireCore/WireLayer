import { input, type Size } from '@wirecore/wirelayer-recipes/native';
import { Check, X } from 'lucide-react-native';
import { useRef, useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useFieldControl } from '../components/Field/Field.js';
import { useTranslations } from '../locale.js';
import { Icon, type IconComponent } from './Icon.js';
import { useFocusTarget } from './focus-registry.js';
import { Loader } from './Loader.js';

/** Props of Input – also taken by PasswordInput, MaskInput and SearchField */
export interface TextFieldProps extends TextInputProps {
    size?: Size;
    /** Marks the input as invalid (also inherited from a surrounding Field) */
    invalid?: boolean;
    /** Disables the input (also inherited from a surrounding Field) */
    disabled?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    /** Shows a spinner in the field and marks it busy (aria-busy), e.g. while checking the value */
    loading?: boolean;
    /** Shows a button that empties the field while it has a value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    /** Icon component rendered inside the field, before the text */
    leadingIcon?: IconComponent;
    /** Static text segment before the input, e.g. `https://` */
    prefix?: string;
    /** Static text segment after the input, e.g. `.de` */
    suffix?: string;
    /** Monospace font of the theme (JetBrains Mono) – for paths, tokens, codes, URLs and keys */
    mono?: boolean;
    ref?: Ref<ComponentRef<typeof TextInput>>;
}

interface InternalProps {
    /** Content before the text (inside the border), e.g. the country of a PhoneInput */
    start?: ReactNode;
    /** Buttons after the text, e.g. show/hide password */
    end?: ReactNode;
    /** Called after the clear button emptied the field */
    onClear?: () => void;
}

/** The text field of Input and its relatives: border states, affixes, clear button, spinner, success check */
export function TextField({
    size,
    invalid,
    disabled,
    success,
    loading = false,
    clearable = false,
    clearLabel,
    leadingIcon,
    prefix,
    suffix,
    mono = false,
    className,
    onFocus,
    onBlur,
    onChangeText,
    start,
    end,
    onClear,
    ref,
    ...props
}: TextFieldProps & InternalProps) {
    const control = useFieldControl({ invalid, disabled, success });
    const translations = useTranslations();
    const [focused, setFocused] = useState(false);
    // Uncontrolled fields: the text is tracked for the clear button
    const [typed, setTyped] = useState(props.defaultValue ?? '');
    const text = props.value ?? typed;
    const inner = useRef<ComponentRef<typeof TextInput> | null>(null);
    useFocusTarget(control.controlId, inner);
    const styles = input({
        size,
        focused,
        invalid: control.invalid,
        success: control.success,
        disabled: control.disabled,
        hasIcon: !!leadingIcon,
        mono,
    });
    const placeholder = useResolveClassNames('text-muted');
    const editable = !control.disabled && props.editable !== false;
    const clear = () => {
        if (props.value === undefined) inner.current?.clear();
        setTyped('');
        onChangeText?.('');
        onClear?.();
        inner.current?.focus();
    };

    return (
        <View className={styles.base({ class: className })}>
            {prefix && (
                <View className={styles.prefix()} aria-hidden>
                    <Text className={styles.affixLabel()}>{prefix}</Text>
                </View>
            )}
            {start}
            {leadingIcon && <Icon icon={leadingIcon} className={styles.icon()} />}
            <TextInput
                nativeID={control.controlId}
                {...control.props}
                placeholderTextColor={typeof placeholder.color === 'string' ? placeholder.color : undefined}
                {...props}
                ref={(node) => {
                    inner.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) ref.current = node;
                }}
                className={styles.control()}
                editable={editable}
                aria-disabled={control.disabled || undefined}
                aria-busy={loading || undefined}
                onChangeText={(next) => {
                    setTyped(next);
                    onChangeText?.(next);
                }}
                onFocus={(event) => {
                    setFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setFocused(false);
                    onBlur?.(event);
                }}
            />
            {loading && <Loader className={styles.spinner()} />}
            {!loading && control.success && <Icon icon={Check} className={styles.status()} />}
            {clearable && editable && !!text && (
                <Pressable
                    role="button"
                    aria-label={clearLabel ?? translations.field.clear}
                    className={styles.clear()}
                    onPress={clear}
                >
                    <Icon icon={X} className={styles.clearIcon()} />
                </Pressable>
            )}
            {end}
            {suffix && (
                <View className={styles.suffix()} aria-hidden>
                    <Text className={styles.affixLabel()}>{suffix}</Text>
                </View>
            )}
        </View>
    );
}
