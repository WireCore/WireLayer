import { listValueKey, searchField, type Size } from '@wirecore/wirelayer-recipes/native';
import { Search } from 'lucide-react-native';
import { useId, useState } from 'react';
import { Platform, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { InlineOptions, inlineOptionId } from '../../utils/InlineOptions.js';
import { contains } from '../../utils/options.js';
import { TextField } from '../../utils/TextField.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFocusWithin } from '../../utils/useFocusWithin.js';
import { Select } from '../Select/Select.js';

/** An area to search in */
export interface SearchScope {
    value: string;
    label: string;
}

export interface SearchFieldProps {
    /** The search text (controlled) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** The search key of the keyboard: the text and the area */
    onSubmit?: (value: string, scope: string | undefined) => void;
    /** The clear button emptied the field */
    onClear?: () => void;
    /** Accessible name of the search (default "Search") */
    label?: string;
    placeholder?: string;
    /** Search is running: spinner in the field, aria-busy */
    loading?: boolean;
    /** Areas to search in – a select above the field */
    scopes?: SearchScope[];
    /** Chosen area (controlled) */
    scope?: string;
    onScopeChange?: (scope: string) => void;
    /** Accessible name of the area select (default "Search in") */
    scopeLabel?: string;
    /** Suggestions while typing – any other text can still be searched */
    suggestions?: string[];
    /** Accessible name of the clear button (default "Clear search") */
    clearLabel?: string;
    size?: Size;
    disabled?: boolean;
    className?: string;
}

/**
 * A search (landmark "search"): field with magnifier, clear button and spinner; the keyboard's search key submits.
 * Optional areas and suggestions below the field.
 */
export function SearchField({
    value,
    defaultValue = '',
    onValueChange,
    onSubmit,
    onClear,
    label,
    placeholder,
    loading = false,
    scopes,
    scope: scopeProp,
    onScopeChange,
    scopeLabel,
    suggestions,
    clearLabel,
    size,
    disabled,
    className,
}: SearchFieldProps) {
    const translations = useTranslations();
    const t = translations.searchField;
    const [text, setText] = useControllable(value, defaultValue, onValueChange);
    const [scope, setScope] = useControllable<string | undefined>(scopeProp, scopes?.[0]?.value, (next) => {
        if (next !== undefined) onScopeChange?.(next);
    });
    const { focused, onFocus, onBlur } = useFocusWithin();
    const [highlighted, setHighlighted] = useState(-1);
    const [dismissed, setDismissed] = useState(false);
    const listId = `${useId()}suggestions`;
    const matches = (suggestions ?? [])
        .filter((entry) => text && contains(entry, text) && entry !== text)
        .slice(0, 8)
        .map((entry) => ({ key: listValueKey(entry), value: entry, label: entry, disabled: false, item: entry }));
    const open = focused && !dismissed && matches.length > 0;
    const submit = (query: string) => {
        setDismissed(true);
        onSubmit?.(query, scope);
    };

    return (
        <View accessibilityRole="search" aria-label={label ?? t.label} className={searchField({ class: className })}>
            {scopes && scopes.length > 0 && (
                <Select
                    items={scopes}
                    value={scope ?? null}
                    onValueChange={(next) => next && setScope(next)}
                    aria-label={scopeLabel ?? t.scope}
                    disabled={disabled}
                    size={size}
                />
            )}
            <TextField
                role={suggestions ? 'combobox' : 'searchbox'}
                aria-label={label ?? t.label}
                aria-expanded={suggestions ? open : undefined}
                {...({
                    'aria-controls': open ? listId : undefined,
                    'aria-activedescendant': open && highlighted >= 0 ? inlineOptionId(listId, highlighted) : undefined,
                } as object)}
                value={text}
                placeholder={placeholder ?? t.placeholder}
                leadingIcon={Search}
                clearable
                clearLabel={clearLabel ?? t.clear}
                loading={loading}
                size={size}
                disabled={disabled}
                returnKeyType="search"
                enterKeyHint="search"
                autoCorrect={false}
                autoCapitalize="none"
                onChangeText={(next) => {
                    setText(next);
                    setHighlighted(-1);
                    setDismissed(false);
                }}
                onClear={onClear}
                onSubmitEditing={() => {
                    const option = highlighted >= 0 ? matches[highlighted] : undefined;
                    if (option) setText(option.label);
                    submit(option?.label ?? text);
                }}
                onKeyPress={(event) => {
                    if (Platform.OS !== 'web' || !open) return;
                    const key = event.nativeEvent.key;
                    if (key === 'ArrowDown') setHighlighted((highlighted + 1) % matches.length);
                    if (key === 'ArrowUp') setHighlighted(highlighted <= 0 ? matches.length - 1 : highlighted - 1);
                    if (key === 'Escape') setDismissed(true);
                }}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {open && (
                <InlineOptions
                    id={listId}
                    label={translations.select.suggestions}
                    options={matches}
                    highlighted={highlighted}
                    onSelect={(option) => {
                        setText(option.label);
                        submit(option.label);
                    }}
                />
            )}
        </View>
    );
}
