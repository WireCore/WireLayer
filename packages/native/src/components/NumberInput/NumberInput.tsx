import { input, numberInput, numberSeparators, parseLocaleNumber, type Size } from '@wirecore/wirelayer-recipes/native';
import { Check, Minus, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useLocale } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { Loader } from '../../utils/Loader.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldControl } from '../Field/Field.js';

export interface NumberInputProps {
    /** Number or null (empty) */
    value?: number | null;
    defaultValue?: number | null;
    onValueChange?: (value: number | null) => void;
    min?: number;
    max?: number;
    step?: number;
    size?: Size;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    invalid?: boolean;
    disabled?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    /** Shows the − / + buttons (default) */
    stepper?: boolean;
    /** Free text before the number, e.g. "≈" */
    prefix?: string;
    /** Free text after the number, e.g. "pcs" */
    suffix?: string;
    /** Display format while the field is not focused, e.g. { style: 'currency', currency: 'EUR' } */
    formatOptions?: Intl.NumberFormatOptions;
    /** Allows numbers below zero (default); false sets the minimum to 0 */
    allowNegative?: boolean;
    /** Allows decimals (default); false rounds to whole numbers */
    allowDecimal?: boolean;
    /** Exactly this many decimals, e.g. 2 → "12.50" */
    decimals?: number;
    /** Out of min/max: `blur` corrects the value when the field is left (default), `strict` while typing, `none` never */
    clampBehavior?: 'blur' | 'strict' | 'none';
    /** Selects the whole number when the field gets the focus */
    selectOnFocus?: boolean;
    /** Shows a spinner in the field and marks it busy (aria-busy) */
    loading?: boolean;
    /** Shows a button that empties the field while it has a value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    className?: string;
}

/**
 * Number field with − / + buttons and the decimal keyboard. Typed text is read with comma or point ("1.234,5" and
 * "1234.5" both work); leaving the field clamps it to min/max.
 */
export function NumberInput({
    value,
    defaultValue = null,
    onValueChange,
    min: minProp = -Infinity,
    max = Infinity,
    step = 1,
    size,
    'aria-label': ariaLabel,
    invalid,
    disabled,
    success,
    stepper = true,
    prefix,
    suffix,
    formatOptions,
    allowNegative = true,
    allowDecimal = true,
    decimals,
    clampBehavior = 'blur',
    selectOnFocus = false,
    loading = false,
    clearable = false,
    clearLabel,
    className,
}: NumberInputProps) {
    const control = useFieldControl({ invalid, disabled, success });
    const { locale, translations } = useLocale();
    const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
    const [focused, setFocused] = useState(false);
    const min = allowNegative ? minProp : Math.max(0, minProp);
    const { decimal } = numberSeparators(locale);
    const round = (number: number) =>
        !allowDecimal ? Math.round(number) : decimals !== undefined ? Number(number.toFixed(decimals)) : number;
    const show = (number: number | null) =>
        number === null
            ? ''
            : decimals !== undefined
              ? number.toFixed(decimals).replace('.', decimal)
              : String(number).replace('.', decimal);
    const [text, setText] = useState(show(current));
    // Changes from outside (or the buttons) replace the text; typing keeps it ("12." while entering 12.5)
    const [shown, setShown] = useState(`${current}${decimal}`);
    if (shown !== `${current}${decimal}`) {
        setShown(`${current}${decimal}`);
        setText(show(current));
    }
    const styles = input({
        size,
        focused,
        invalid: control.invalid,
        success: control.success,
        disabled: control.disabled,
    });
    const buttons = numberInput();
    const placeholder = useResolveClassNames('text-muted');

    const clamp = (number: number) => Math.min(max, Math.max(min, number));
    const parse = (raw: string): number | null => {
        const trimmed = raw.trim();
        if (trimmed === '') return null;
        // A lone sign or separator while typing keeps the value
        if (/^[-−]?[.,]?$/.test(trimmed)) return current;
        const number = parseLocaleNumber(allowNegative ? trimmed : trimmed.replace(/[-−]/g, ''), locale);
        return number === null ? current : number;
    };
    const stepBy = (direction: 1 | -1) => {
        const base = current ?? (Number.isFinite(min) ? min : 0);
        // Round away float noise (0.1 + 0.2)
        setCurrent(clamp(round(Number((base + direction * step).toFixed(10)))));
    };
    const editable = !control.disabled;
    const display =
        !focused && formatOptions && current !== null
            ? new Intl.NumberFormat(locale, formatOptions).format(current)
            : text;

    return (
        <View className={styles.base({ class: className })}>
            {!!prefix && <Text className={buttons.prefix()}>{prefix}</Text>}
            <TextInput
                {...control.props}
                aria-label={control.label ?? ariaLabel}
                placeholderTextColor={typeof placeholder.color === 'string' ? placeholder.color : undefined}
                className={styles.control()}
                value={display}
                keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
                inputMode={allowDecimal ? 'decimal' : 'numeric'}
                editable={editable}
                selectTextOnFocus={selectOnFocus}
                aria-disabled={control.disabled || undefined}
                aria-busy={loading || undefined}
                onChangeText={(next) => {
                    let number = parse(next);
                    if (number !== null && clampBehavior === 'strict' && clamp(number) !== number) {
                        number = clamp(number);
                        next = show(number);
                    }
                    setText(next);
                    setShown(`${number}${decimal}`);
                    if (number !== current) setCurrent(number);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                    setFocused(false);
                    const fixed = current === null ? null : round(clampBehavior === 'none' ? current : clamp(current));
                    if (fixed !== current) setCurrent(fixed);
                    else setText(show(current));
                }}
            />
            {!!suffix && <Text className={buttons.suffix()}>{suffix}</Text>}
            {loading && <Loader className={styles.spinner()} />}
            {!loading && control.success && <Icon icon={Check} className={styles.status()} />}
            {clearable && editable && current !== null && (
                <Pressable
                    role="button"
                    aria-label={clearLabel ?? translations.field.clear}
                    className={styles.clear()}
                    onPress={() => setCurrent(null)}
                >
                    <Icon icon={X} className={styles.clearIcon()} />
                </Pressable>
            )}
            {stepper && (
                <>
                    <Pressable
                        role="button"
                        aria-label={translations.numberInput.decrementLabel}
                        disabled={control.disabled || (current ?? Infinity) <= min}
                        className={buttons.button()}
                        onPress={() => stepBy(-1)}
                    >
                        <Icon icon={Minus} className={buttons.icon()} />
                    </Pressable>
                    <Pressable
                        role="button"
                        aria-label={translations.numberInput.incrementLabel}
                        disabled={control.disabled || (current ?? -Infinity) >= max}
                        className={buttons.button()}
                        onPress={() => stepBy(1)}
                    >
                        <Icon icon={Plus} className={buttons.icon()} />
                    </Pressable>
                </>
            )}
        </View>
    );
}
