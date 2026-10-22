import {
    countryFlag,
    countryName,
    findPhoneCountry,
    formatPhoneNumber,
    input,
    isValidPhoneNumber,
    parsePhoneNumber,
    phoneCountries,
    phoneInput,
    phonePlaceholder,
    searchPhoneCountries,
    select,
    toE164,
    type PhoneCountry,
    type Size,
} from '@wirecore/wirelayer-recipes/native';
import { Check, ChevronDown, Search } from 'lucide-react-native';
import { useRef, useState, type ComponentRef } from 'react';
import { FlatList, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useLocale } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { Sheet } from '../../utils/Sheet.js';
import { TextField } from '../../utils/TextField.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldControl } from '../Field/Field.js';

export interface PhoneInputProps {
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
    /** Accessible name of the country button and title of its sheet (default "Country") */
    countryLabel?: string;
    size?: Size;
    /** Marks the number invalid (it also is after leaving a number of the wrong length) */
    invalid?: boolean;
    disabled?: boolean;
    /** Accessible name of the number without a surrounding Field (default "Phone number") */
    'aria-label'?: string;
    closeLabel?: string;
    className?: string;
}

/**
 * Country (flag and calling code, searchable sheet) and the number, formatted for the country while typing; the
 * value is E.164. "+44 …" or "0044 …" typed or pasted switches the country.
 */
export function PhoneInput({
    value,
    defaultValue = '',
    onValueChange,
    country: countryProp,
    onCountryChange,
    defaultCountry = 'DE',
    onValidChange,
    countries = phoneCountries,
    countryLabel,
    size,
    invalid,
    disabled,
    'aria-label': ariaLabel,
    closeLabel,
    className,
}: PhoneInputProps) {
    const { locale, translations } = useLocale();
    const t = translations.phoneInput;
    const control = useFieldControl({ invalid, disabled });
    const fallback = findPhoneCountry(defaultCountry, countries) ?? countries[0]!;
    const initial = parsePhoneNumber(value ?? defaultValue, fallback, countries);
    const [code, setCode] = useControllable(countryProp, initial.country.code, onCountryChange);
    const country = findPhoneCountry(code, countries) ?? fallback;
    const [digits, setDigits] = useState(initial.digits);
    const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
    // A value from outside (not typed here) replaces the digits and the country
    const [seen, setSeen] = useState(current);
    if (current !== seen) {
        setSeen(current);
        if (current !== toE164(digits, country)) {
            const parsed = parsePhoneNumber(current, country, countries);
            setDigits(parsed.digits);
            if (parsed.country.code !== country.code) setCode(parsed.country.code);
        }
    }
    const [touched, setTouched] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const number = useRef<ComponentRef<typeof TextInput>>(null);
    const muted = useResolveClassNames('text-muted');
    const valid = isValidPhoneNumber(digits, country);
    const styles = phoneInput();
    const list = select();
    const search = input({ hasIcon: true, class: list.search() });
    const name = countryName(country.code, locale);
    const label = countryLabel ?? t.country;

    const emit = (nextDigits: string, nextCountry: PhoneCountry) => {
        setDigits(nextDigits);
        const e164 = toE164(nextDigits, nextCountry);
        setSeen(e164);
        setCurrent(e164);
        onValidChange?.(isValidPhoneNumber(nextDigits, nextCountry));
    };
    const choose = (next: PhoneCountry) => {
        setCode(next.code);
        emit(digits, next);
        setOpen(false);
        setQuery('');
        // After the sheet's closing animation – the modal keeps the focus until it is gone
        setTimeout(() => number.current?.focus(), 400);
    };
    const found = searchPhoneCountries(query, countries, locale);

    return (
        <>
            <TextField
                ref={number}
                size={size}
                className={className}
                invalid={control.invalid || (touched && !!digits && !valid)}
                disabled={disabled}
                aria-label={control.label ?? ariaLabel ?? t.number}
                value={formatPhoneNumber(digits, country)}
                placeholder={phonePlaceholder(country)}
                keyboardType="phone-pad"
                inputMode="tel"
                autoComplete="tel"
                textContentType="telephoneNumber"
                onChangeText={(text) => {
                    const parsed = parsePhoneNumber(text, country, countries);
                    if (parsed.pending) return;
                    if (parsed.country.code !== country.code) setCode(parsed.country.code);
                    emit(parsed.digits, parsed.country);
                }}
                onBlur={() => setTouched(true)}
                start={
                    <Pressable
                        role="button"
                        aria-label={`${label}: ${name} +${country.dial}`}
                        disabled={control.disabled}
                        className={styles.country()}
                        onPress={() => setOpen(true)}
                    >
                        <Text className={styles.flag()} aria-hidden>
                            {countryFlag(country.code)}
                        </Text>
                        <Text className={styles.dial()} aria-hidden>{`+${country.dial}`}</Text>
                        <Icon icon={ChevronDown} className={styles.indicator()} />
                    </Pressable>
                }
            />
            <Sheet
                open={open}
                onClose={() => {
                    setOpen(false);
                    setQuery('');
                }}
                title={label}
                closeLabel={closeLabel ?? translations.common.close}
                scroll={false}
                before={
                    <View className={search.base()}>
                        <Icon icon={Search} className={search.icon()} />
                        <TextInput
                            autoFocus={Platform.OS === 'web'}
                            value={query}
                            onChangeText={setQuery}
                            aria-label={t.search}
                            placeholder={t.search}
                            placeholderTextColor={typeof muted.color === 'string' ? muted.color : undefined}
                            autoCorrect={false}
                            className={search.control()}
                        />
                    </View>
                }
            >
                <FlatList
                    data={found}
                    keyExtractor={(entry) => entry.code}
                    role={found.length ? 'radiogroup' : undefined}
                    aria-label={label}
                    keyboardShouldPersistTaps="handled"
                    contentContainerClassName={list.list()}
                    ListEmptyComponent={
                        <Text role="status" className={list.statusText({ class: list.status() })}>
                            {translations.common.noResults}
                        </Text>
                    }
                    renderItem={({ item: entry }) => {
                        const checked = entry.code === country.code;
                        return (
                            <Pressable
                                role="radio"
                                aria-checked={checked}
                                aria-label={`${countryName(entry.code, locale)} +${entry.dial}`}
                                className={select({ selected: checked }).option()}
                                onPress={() => choose(entry)}
                            >
                                <Text className={styles.optionFlag()} aria-hidden>
                                    {countryFlag(entry.code)}
                                </Text>
                                <Text className={list.optionText()}>{countryName(entry.code, locale)}</Text>
                                <Text className={styles.optionDial()}>{`+${entry.dial}`}</Text>
                                {checked && <Icon icon={Check} className={list.optionCheck()} />}
                            </Pressable>
                        );
                    }}
                />
            </Sheet>
        </>
    );
}
