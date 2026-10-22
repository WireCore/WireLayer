import {
    searchField as searchFieldRecipe,
    setTextControlValue,
    type RecipeClasses,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { Search } from 'lucide-react';
import { useState, type ComponentProps, type KeyboardEvent } from 'react';
import { Autocomplete } from '../Autocomplete/Autocomplete.js';
import { Input } from '../Input/Input.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { NativeSelect, type NativeSelectOption } from '../NativeSelect/NativeSelect.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SearchFieldProps extends Omit<ComponentProps<'form'>, 'onSubmit' | 'defaultValue'> {
    /** The search text (controlled) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Enter (or the form's submit): the text and the area */
    onSubmit?: (value: string, scope: string | undefined) => void;
    /** Escape emptied the field */
    onClear?: () => void;
    /** Accessible name of the search (form role="search" and field) – default "Search" */
    label?: string;
    placeholder?: string;
    /** Search is running: spinner in the field, aria-busy */
    loading?: boolean;
    /** Areas to search in – a select before the field */
    scopes?: NativeSelectOption[];
    /** Chosen area (controlled) */
    scope?: string;
    onScopeChange?: (scope: string) => void;
    /** Accessible name of the area select (default "Search in") */
    scopeLabel?: string;
    /** Suggestions while typing (combobox pattern) – any other text can still be searched */
    suggestions?: string[];
    /** Accessible name of the clear button (default "Clear search") */
    clearLabel?: string;
    size?: Size;
    disabled?: boolean;
    /** Name of the field for form submission (default "q") */
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof searchFieldRecipe>;
}

/** A search form (role="search"): optional area, field with magnifier, clear button and spinner; Enter searches */
export function SearchField({
    classes,
    value,
    defaultValue = '',
    onValueChange,
    onSubmit,
    onClear,
    label,
    placeholder,
    loading,
    scopes,
    scope,
    onScopeChange,
    scopeLabel,
    suggestions,
    clearLabel,
    size,
    disabled,
    name = 'q',
    className,
    ...props
}: SearchFieldProps) {
    const searchField = useRecipe('searchField', searchFieldRecipe, classes);
    const t = useTranslations().searchField;
    const styles = searchField();
    const [internal, setInternal] = useState(defaultValue);
    const text = value ?? internal;
    const setText = (next: string) => {
        setInternal(next);
        onValueChange?.(next);
    };
    const accessibleName = label ?? t.label;
    // Escape empties a filled field (and stops there, so a dialog around stays open)
    const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
        const target = event.target as HTMLInputElement;
        if (event.key !== 'Escape' || target.tagName !== 'INPUT' || !target.value) return;
        event.preventDefault();
        event.stopPropagation();
        setTextControlValue(target);
        onClear?.();
    };
    return (
        <form
            {...props}
            className={styles.base({ class: className })}
            role="search"
            aria-label={accessibleName}
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit?.(text, scope);
            }}
            onKeyDown={onKeyDown}
        >
            {!!scopes?.length && (
                <NativeSelect
                    items={scopes}
                    value={scope}
                    size={size}
                    disabled={disabled}
                    aria-label={scopeLabel ?? t.scope}
                    className={styles.scope()}
                    onValueChange={onScopeChange}
                />
            )}
            {suggestions ? (
                <Autocomplete
                    items={suggestions}
                    value={text}
                    onValueChange={setText}
                    placeholder={placeholder ?? t.placeholder}
                    loading={loading}
                    disabled={disabled}
                    name={name}
                    aria-label={accessibleName}
                    size={size}
                    clearable
                    className={styles.field()}
                />
            ) : (
                <Input
                    value={text}
                    onChange={(event) => setText(event.currentTarget.value)}
                    type="search"
                    enterKeyHint="search"
                    name={name}
                    aria-label={accessibleName}
                    placeholder={placeholder ?? t.placeholder}
                    leadingIcon={Search}
                    loading={loading}
                    disabled={disabled}
                    size={size}
                    clearable
                    clearLabel={clearLabel ?? t.clear}
                    className={styles.field()}
                    classes={{ control: styles.control() }}
                />
            )}
        </form>
    );
}
