import { textarea, textareaParts, type Size } from '@wirecore/wirelayer-recipes/native';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef, type Ref } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { Loader } from '../../utils/Loader.js';
import { useFieldControl } from '../Field/Field.js';

export interface TextareaProps extends TextInputProps {
    /** Marks the textarea as invalid (also inherited from a surrounding Field) */
    invalid?: boolean;
    /** Disables the textarea (also inherited from a surrounding Field) */
    disabled?: boolean;
    size?: Size;
    /** Confirmed value: green border (also inherited from a Field with `success`) */
    success?: boolean;
    /** Grows with its text instead of scrolling (between minRows and maxRows) */
    autoResize?: boolean;
    /** At least this many rows */
    minRows?: number;
    /** With autoResize: at most this many rows, then it scrolls */
    maxRows?: number;
    /** Counter "12 / 200" below the field (needs `maxLength`); the remaining characters are announced once typing pauses */
    showCount?: boolean;
    /** Shows a spinner in the corner and marks the field busy (aria-busy) */
    loading?: boolean;
    /** Shows a button that empties the field while it has text (calls onChangeText with "") */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    ref?: Ref<ComponentRef<typeof TextInput>>;
}

/** Line height and vertical padding per size – for minRows/maxRows */
const metrics: Record<Size, { line: number; padding: number }> = {
    sm: { line: 20, padding: 14 },
    md: { line: 24, padding: 20 },
    lg: { line: 24, padding: 26 },
};

/** Multi-line text field: sizes, auto height between minRows and maxRows, counter with announcements, clear button, spinner */
export function Textarea({
    invalid,
    disabled,
    size = 'md',
    success,
    autoResize = false,
    minRows,
    maxRows,
    showCount = false,
    loading = false,
    clearable = false,
    clearLabel,
    className,
    onFocus,
    onBlur,
    onChangeText,
    onContentSizeChange,
    style,
    ref,
    ...props
}: TextareaProps) {
    const control = useFieldControl({ invalid, disabled, success });
    const translations = useTranslations();
    const [focused, setFocused] = useState(false);
    const placeholder = useResolveClassNames('text-muted');
    const [typed, setTyped] = useState(props.defaultValue ?? '');
    const text = props.value ?? typed;
    const [contentHeight, setContentHeight] = useState(0);
    const inner = useRef<ComponentRef<typeof TextInput>>(null);
    const { announce, region } = useAnnouncer();
    const max = props.maxLength;
    const counting = showCount && max !== undefined;
    // Announce the remaining characters once typing pauses
    useEffect(() => {
        if (!counting || !focused) return;
        const timer = setTimeout(() => announce(translations.textarea.remaining(max - text.length, max)), 900);
        return () => clearTimeout(timer);
    }, [counting, focused, text, max, announce, translations]);

    const { line, padding } = metrics[size];
    const minHeight = minRows ? minRows * line + padding : undefined;
    const maxHeight = autoResize && maxRows ? maxRows * line + padding : undefined;
    const height =
        autoResize && contentHeight
            ? Math.max(minHeight ?? 0, Math.min(maxHeight ?? Infinity, contentHeight + padding))
            : undefined;
    const editable = !control.disabled && props.editable !== false;
    const corner = loading || (clearable && editable && !!text);
    const parts = textareaParts({ over: counting && text.length >= max });

    const field = (
        <TextInput
            {...control.props}
            placeholderTextColor={typeof placeholder.color === 'string' ? placeholder.color : undefined}
            multiline
            textAlignVertical="top"
            numberOfLines={minRows}
            {...props}
            ref={(node) => {
                inner.current = node;
                if (typeof ref === 'function') ref(node);
                else if (ref) ref.current = node;
            }}
            style={[minHeight || height ? { minHeight, maxHeight, height } : undefined, style]}
            className={textarea({
                focused,
                invalid: control.invalid,
                success: control.success,
                disabled: control.disabled,
                size,
                class: [corner ? parts.withCorner() : undefined, className],
            })}
            scrollEnabled={!autoResize || !!(maxHeight && height === maxHeight)}
            editable={editable}
            aria-disabled={control.disabled || undefined}
            aria-busy={loading || undefined}
            onChangeText={(next) => {
                setTyped(next);
                onChangeText?.(next);
            }}
            onContentSizeChange={(event) => {
                setContentHeight(event.nativeEvent.contentSize.height);
                onContentSizeChange?.(event);
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
    );
    if (!counting && !clearable && !loading) return field;
    return (
        <View className={parts.base()}>
            <View className={parts.box()}>
                {field}
                {corner && (
                    <View className={parts.corner()}>
                        {loading ? (
                            <Loader className={parts.spinner()} />
                        ) : (
                            <Pressable
                                role="button"
                                aria-label={clearLabel ?? translations.field.clear}
                                className={parts.clear()}
                                onPress={() => {
                                    if (props.value === undefined) inner.current?.clear();
                                    setTyped('');
                                    onChangeText?.('');
                                    inner.current?.focus();
                                }}
                            >
                                <Icon icon={X} className={parts.clearIcon()} />
                            </Pressable>
                        )}
                    </View>
                )}
            </View>
            {counting && (
                <Text className={parts.counter()} aria-hidden>
                    {translations.textarea.counter(text.length, max)}
                </Text>
            )}
            {region}
        </View>
    );
}
