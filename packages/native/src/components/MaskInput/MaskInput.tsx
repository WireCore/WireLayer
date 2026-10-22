import {
    maskIsComplete,
    maskIsNumeric,
    maskPlaceholder,
    maskValue,
    unmaskValue,
    type MaskTokens,
} from '@wirecore/wirelayer-recipes/native';
import { useState } from 'react';
import { TextField, type TextFieldProps } from '../../utils/TextField.js';

export interface MaskInputProps extends Omit<TextFieldProps, 'value' | 'defaultValue' | 'onChangeText'> {
    /** 9 digit, a letter, * letter or digit – everything else is inserted by itself, \\ escapes a token, `?` starts an optional rest */
    mask: string;
    /** Masked value (or the raw one with `unmask`) */
    value?: string;
    defaultValue?: string;
    /** The value (masked, or raw with `unmask`) and only the typed characters */
    onValueChange?: (value: string, raw: string) => void;
    /** Every required slot is filled */
    onComplete?: (value: string) => void;
    /** Character for the open slots in the placeholder (default "_") */
    slotChar?: string;
    /** value/onValueChange hold only the typed characters ("891234" instead of "DE89 1234") */
    unmask?: boolean;
    /** Empties an incomplete value when the field is left */
    autoClear?: boolean;
    /** Own tokens, e.g. { h: /[0-9a-f]/i } – they extend 9, a and * */
    tokens?: MaskTokens;
}

/** Text input with a fixed format (IBAN, phone, postcode …): separators are added while typing */
export function MaskInput({
    mask,
    value,
    defaultValue,
    onValueChange,
    onComplete,
    slotChar = '_',
    unmask = false,
    autoClear = false,
    tokens,
    onBlur,
    ...props
}: MaskInputProps) {
    const fromValue = (text: string | undefined) => maskValue(text ?? '', mask, tokens);
    const [masked, setMasked] = useState(() => fromValue(value ?? defaultValue));
    // A value from outside replaces the text
    const [external, setExternal] = useState(value);
    if (value !== external) {
        setExternal(value);
        if (value !== undefined && value !== (unmask ? unmaskValue(masked, mask, tokens) : masked))
            setMasked(fromValue(value));
    }
    const emit = (next: string) => {
        setMasked(next);
        const raw = unmaskValue(next, mask, tokens);
        const out = unmask ? raw : next;
        setExternal(out);
        onValueChange?.(out, raw);
        if (next && maskIsComplete(next, mask, tokens)) onComplete?.(out);
    };

    return (
        <TextField
            placeholder={maskPlaceholder(mask, slotChar, tokens)}
            keyboardType={maskIsNumeric(mask, tokens) ? 'number-pad' : 'default'}
            autoCapitalize="characters"
            autoCorrect={false}
            {...props}
            value={masked}
            onChangeText={(text) => emit(maskValue(text, mask, tokens))}
            onBlur={(event) => {
                if (autoClear && masked && !maskIsComplete(masked, mask, tokens)) emit('');
                onBlur?.(event);
            }}
        />
    );
}
