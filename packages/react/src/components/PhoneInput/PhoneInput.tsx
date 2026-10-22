import {
    caretAfterDigits,
    countryFlag,
    countryName,
    findPhoneCountry,
    formatPhoneNumber,
    isValidPhoneNumber,
    parsePhoneNumber,
    phoneCountries,
    phoneInput as phoneInputRecipe,
    phonePlaceholder,
    toE164,
    type PhoneCountry,
    type RecipeClasses,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { useLayoutEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Input } from '../Input/Input.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { Select } from '../Select/Select.js';

export interface PhoneInputProps extends Omit<
    ComponentProps<'input'>,
    'value' | 'defaultValue' | 'size' | 'onChange' | 'prefix'
> {
    /** The number in E.164 ("+4930123456", "" when empty, controlled) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Chosen country (ISO code, controlled) */
    country?: string;
    onCountryChange?: (country: string) => void;
    /** Country before anything is chosen (default "DE") */
    defaultCountry?: string;
    /** Whether the number has a valid length for its country (after every change) */
    onValidChange?: (valid: boolean) => void;
    /** Countries to offer (default: about 60 common ones; extend with your own entries) */
    countries?: PhoneCountry[];
    /** Accessible name of the country select (default "Country") */
    countryLabel?: string;
    size?: Size;
    /** Marks the number invalid (it also is after leaving a number of the wrong length) */
    invalid?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof phoneInputRecipe>;
}

/** Country (flag and calling code, searchable) and the number, formatted for the country; the value is E.164 */
export function PhoneInput({
    classes,
    value,
    defaultValue = '',
    onValueChange,
    country,
    onCountryChange,
    defaultCountry = 'DE',
    onValidChange,
    countries,
    countryLabel,
    placeholder,
    size,
    disabled,
    invalid,
    required,
    name,
    className,
    style,
    onBlur,
    ...props
}: PhoneInputProps) {
    const phoneInput = useRecipe('phoneInput', phoneInputRecipe, classes);
    const styles = phoneInput();
    const { locale, translations } = useLocale();
    const list = countries ?? phoneCountries;
    const fallback = findPhoneCountry(defaultCountry, list) ?? list[0]!;
    const [initial] = useState(() => parsePhoneNumber(value ?? defaultValue, fallback, list));
    const [internalCountry, setInternalCountry] = useState(country ?? initial.country.code);
    const current = findPhoneCountry(country ?? internalCountry, list) ?? fallback;
    const [digits, setDigits] = useState(initial.digits);
    // "+4…" before a calling code is recognised stays as typed
    const [draft, setDraft] = useState<string | null>(null);
    const [emitted, setEmitted] = useState(value);
    const [touched, setTouched] = useState(false);
    const input = useRef<HTMLInputElement>(null);
    const pendingCaret = useRef<number | null>(null);
    // A new value from outside (not the one reported last) is split into country and digits
    if (value !== undefined && value !== emitted && value !== toE164(digits, current)) {
        const parsed = parsePhoneNumber(value, current, list);
        setEmitted(value);
        setDigits(parsed.digits);
        if (parsed.country.code !== current.code) setInternalCountry(parsed.country.code);
    }
    const valid = !digits || isValidPhoneNumber(digits, current);
    const items = useMemo(() => {
        const collator = new Intl.Collator(locale);
        return list
            .map((entry) => {
                const label = countryName(entry.code, locale);
                return { value: entry.code, label: `${countryFlag(entry.code)} ${label} +${entry.dial}`, name: label };
            })
            .sort((a, b) => collator.compare(a.name, b.name));
    }, [list, locale]);

    useLayoutEffect(() => {
        const caret = pendingCaret.current;
        if (caret === null || !input.current) return;
        pendingCaret.current = null;
        if (document.activeElement === input.current) input.current.setSelectionRange(caret, caret);
    });

    const report = (nextDigits: string, nextCountry: PhoneCountry) => {
        const next = toE164(nextDigits, nextCountry);
        setEmitted(next);
        onValueChange?.(next);
        onValidChange?.(!nextDigits || isValidPhoneNumber(nextDigits, nextCountry));
    };
    const setCountry = (code: string) => {
        if (code === current.code) return;
        setInternalCountry(code);
        onCountryChange?.(code);
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            <Select
                items={items}
                value={current.code}
                size={size}
                disabled={disabled}
                filter
                standalone
                aria-label={countryLabel ?? translations.phoneInput.country}
                className={styles.country()}
                classes={{ content: styles.countryList() }}
                renderValue={() => (
                    <>
                        <span className={styles.flag()} aria-hidden="true">
                            {countryFlag(current.code)}
                        </span>
                        <span className={styles.dial()}>{`+${current.dial}`}</span>
                    </>
                )}
                onValueChange={(code) => {
                    if (!code) return;
                    const next = findPhoneCountry(code, list);
                    if (!next) return;
                    setCountry(code);
                    report(digits, next);
                }}
            />
            <Input
                {...props}
                ref={input}
                value={draft ?? formatPhoneNumber(digits, current)}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder={placeholder ?? phonePlaceholder(current)}
                size={size}
                disabled={disabled}
                required={required}
                invalid={invalid || (touched && !valid)}
                className={styles.number()}
                onChange={(event) => {
                    const element = event.currentTarget;
                    const text = element.value;
                    const before = text.slice(0, element.selectionStart ?? text.length).replace(/\D/g, '').length;
                    const parsed = parsePhoneNumber(text, current, list);
                    setDraft(parsed.pending ? text : null);
                    setDigits(parsed.digits);
                    if (parsed.pending) {
                        report('', current);
                        return;
                    }
                    if (parsed.country.code !== current.code) setCountry(parsed.country.code);
                    else
                        pendingCaret.current = caretAfterDigits(
                            formatPhoneNumber(parsed.digits, parsed.country),
                            before
                        );
                    report(parsed.digits, parsed.country);
                }}
                onBlur={(event) => {
                    setTouched(true);
                    onBlur?.(event);
                }}
            />
            {name && <input type="hidden" name={name} value={toE164(digits, current)} />}
        </div>
    );
}
