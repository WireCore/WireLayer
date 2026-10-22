import {
    maskIsComplete,
    maskIsNumeric,
    maskPlaceholder,
    maskValue,
    unmaskValue,
    type MaskTokens,
} from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { Input, type InputProps } from '../Input/Input.js';

export interface MaskInputProps extends Omit<InputProps, 'value' | 'defaultValue' | 'onChange'> {
    /**
     * 9 digit, a letter, * letter or digit – everything else is inserted by itself, \\ escapes a token, `?` starts an
     * optional rest, e.g. "+4\\9 999 9999999" or "99999?-9999"
     */
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
    defaultValue = '',
    onValueChange,
    onComplete,
    slotChar = '_',
    unmask = false,
    autoClear = false,
    tokens,
    placeholder,
    onBlur,
    ...props
}: MaskInputProps) {
    const [internal, setInternal] = useState(() => maskValue(defaultValue, mask, tokens));
    const current = value === undefined ? internal : maskValue(value, mask, tokens);
    const update = (next: string) => {
        const wasComplete = maskIsComplete(current, mask, tokens);
        setInternal(next);
        const raw = unmaskValue(next, mask, tokens);
        onValueChange?.(unmask ? raw : next, raw);
        if (!wasComplete && maskIsComplete(next, mask, tokens)) onComplete?.(next);
    };

    return (
        <Input
            inputMode={maskIsNumeric(mask, tokens) ? 'numeric' : undefined}
            {...props}
            placeholder={placeholder ?? maskPlaceholder(mask, slotChar, tokens)}
            value={current}
            onChange={(event) => {
                const input = event.currentTarget;
                const caret = input.selectionStart ?? input.value.length;
                const atEnd = caret === input.value.length;
                const next = maskValue(input.value, mask, tokens);
                update(next);
                // Typing in the middle: keep the caret where it was (shifted by inserted separators)
                if (!atEnd) {
                    const shifted = caret + (next.length - input.value.length);
                    requestAnimationFrame(() => input.setSelectionRange(shifted, shifted));
                }
            }}
            onBlur={(event) => {
                if (autoClear && current && !maskIsComplete(current, mask, tokens)) update('');
                onBlur?.(event);
            }}
        />
    );
}
