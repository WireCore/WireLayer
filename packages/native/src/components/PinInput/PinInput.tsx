import { pinInput, pinInputChange, type PinInputType } from '@wirecore/wirelayer-recipes/native';
import { useRef, useState, type ComponentRef } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useTranslations } from '../../locale.js';
import { useFieldControl } from '../Field/Field.js';

export interface PinInputProps {
    /** Number of characters */
    length?: number;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** All characters entered */
    onValueComplete?: (value: string) => void;
    type?: PinInputType;
    /** One-time code: iOS offers the code from an SMS above the keyboard, Android fills it in (autoComplete "sms-otp") */
    otp?: boolean;
    /** Show dots instead of the characters */
    mask?: boolean;
    /** Placeholder of each box, e.g. "○" */
    placeholder?: string;
    invalid?: boolean;
    disabled?: boolean;
    /** Accessible name of the group without a surrounding Field */
    'aria-label'?: string;
    className?: string;
}

type InputRef = ComponentRef<typeof TextInput>;

/**
 * Code input (OTP, PIN): one box per character ("Digit 1 of 6"), typing moves on, Backspace on an empty box goes
 * back, pasting or the SMS autofill fills all boxes.
 */
export function PinInput({
    length = 4,
    value,
    defaultValue = '',
    onValueChange,
    onValueComplete,
    type = 'numeric',
    otp = false,
    mask = false,
    placeholder,
    invalid,
    disabled,
    'aria-label': ariaLabel,
    className,
}: PinInputProps) {
    const translations = useTranslations();
    const control = useFieldControl({ invalid, disabled });
    // The boxes are the state (an empty box in the middle stays empty); `value` from outside replaces them
    const [chars, setChars] = useState(() => [...(value ?? defaultValue)].slice(0, length));
    const joined = chars.join('');
    const [external, setExternal] = useState(value);
    if (value !== undefined && value !== external) {
        setExternal(value);
        if (value !== joined) setChars([...value].slice(0, length));
    }
    const [focused, setFocused] = useState(-1);
    const boxes = useRef<(InputRef | null)[]>([]);
    const muted = useResolveClassNames('text-muted');
    const label = control.label ?? ariaLabel;

    const update = (next: string[]) => {
        setChars(next);
        const text = next.join('');
        setExternal(text);
        onValueChange?.(text);
        if (next.length === length && next.every(Boolean)) onValueComplete?.(text);
    };
    const change = (index: number, text: string) => {
        const result = pinInputChange(chars, index, text, length, type);
        update(result.chars);
        if (text !== '' && result.focus !== index) boxes.current[result.focus]?.focus();
    };

    return (
        <View
            role="group"
            aria-label={label}
            {...(control.props as object)}
            className={pinInput().base({ class: className })}
        >
            {Array.from({ length }, (_, index) => (
                <TextInput
                    key={index}
                    ref={(node) => {
                        boxes.current[index] = node;
                    }}
                    value={chars[index] ?? ''}
                    aria-label={translations.pinInput.inputLabel(index, length)}
                    {...({ 'aria-invalid': control.invalid || undefined } as object)}
                    placeholder={placeholder}
                    placeholderTextColor={typeof muted.color === 'string' ? muted.color : undefined}
                    secureTextEntry={mask}
                    keyboardType={type === 'numeric' ? 'number-pad' : 'default'}
                    inputMode={type === 'numeric' ? 'numeric' : 'text'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    // The SMS code goes into the first box and is spread from there
                    autoComplete={
                        otp && index === 0 ? (Platform.OS === 'android' ? 'sms-otp' : 'one-time-code') : 'off'
                    }
                    textContentType={otp && index === 0 ? 'oneTimeCode' : 'none'}
                    selectTextOnFocus
                    editable={!control.disabled}
                    aria-disabled={control.disabled || undefined}
                    className={pinInput({
                        focused: focused === index,
                        invalid: control.invalid,
                        disabled: control.disabled,
                    }).box()}
                    onChangeText={(text) => change(index, text)}
                    onKeyPress={(event) => {
                        if (event.nativeEvent.key !== 'Backspace' || chars[index] || index === 0) return;
                        const next = [...chars];
                        next[index - 1] = '';
                        update(next);
                        boxes.current[index - 1]?.focus();
                    }}
                    onFocus={() => setFocused(index)}
                    onBlur={() => setFocused(-1)}
                />
            ))}
        </View>
    );
}
