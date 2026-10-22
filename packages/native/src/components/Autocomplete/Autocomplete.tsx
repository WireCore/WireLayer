import type { DataSource, ItemAccessor, Size } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { InlineOptions, inlineOptionId } from '../../utils/InlineOptions.js';
import { useOptionList, type ListItemState } from '../../utils/options.js';
import { TextField } from '../../utils/TextField.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFocusWithin } from '../../utils/useFocusWithin.js';
import { TagsInput } from '../TagsInput/TagsInput.js';

export interface AutocompleteProps<T = string> {
    /** Suggestions while typing – any other text is allowed, too; strings or objects (read with itemLabel) */
    items: readonly T[];
    /** The text */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** Several entries as chips (a TagsInput with these suggestions) – use values/onValuesChange */
    multiple?: boolean;
    /** The entries with `multiple` */
    values?: string[];
    defaultValues?: string[];
    onValuesChange?: (values: string[]) => void;
    /** Most entries with `multiple` */
    max?: number;
    /** Filters the suggestions by the typed text (ignores case and accents, default true) */
    filter?: boolean;
    /** The suggestions are filtered elsewhere (server): no local filtering, listen to onFilterChange */
    manualFilter?: boolean;
    /** Typed text – e.g. to load matching suggestions from a server (manualFilter) */
    onFilterChange?: (text: string) => void;
    /** Text of a suggestion: property name or function (default: `label`, or the item itself) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of a suggestion: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Button that clears the text */
    clearable?: boolean;
    /** Shows a spinner in the field and "Loading" in the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row in the list */
    loadingText?: string;
    size?: Size;
    /** More suggestions can be loaded: "Load more" calls onLoadMore */
    hasMore?: boolean;
    onLoadMore?: () => void;
    /** Loads the suggestions for the typed text (after a typing pause, outdated answers dropped) */
    dataSource?: DataSource<T>;
    /** Fewest characters typed before the data source is asked */
    minSearchLength?: number;
    /** Suggestions per request of the data source (default 50) */
    pageSize?: number;
    /** Content of a suggestion (instead of its text) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    placeholder?: string;
    invalid?: boolean;
    disabled?: boolean;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    className?: string;
}

/**
 * Free text with suggestions below the field (in the page flow, no overlay): typing filters them, a tap takes one; on
 * the web the arrow keys move and Enter takes the highlighted one. Any other text is allowed, too.
 */
export function Autocomplete<T = string>(props: AutocompleteProps<T>) {
    if (props.multiple) {
        const labelOf = (item: T) =>
            typeof props.itemLabel === 'function'
                ? props.itemLabel(item)
                : typeof item === 'object' && item !== null
                  ? String((item as Record<string, unknown>)[props.itemLabel ?? 'label'] ?? '')
                  : String(item);
        return (
            <TagsInput
                value={props.values}
                defaultValue={props.defaultValues}
                onValueChange={props.onValuesChange}
                max={props.max}
                suggestions={props.items.map(labelOf)}
                filter={props.filter}
                manualFilter={props.manualFilter}
                onFilterChange={props.onFilterChange}
                loading={props.loading}
                loadingText={props.loadingText}
                hasMore={props.hasMore}
                onLoadMore={props.onLoadMore}
                placeholder={props.placeholder}
                invalid={props.invalid}
                disabled={props.disabled}
                aria-label={props['aria-label']}
                className={props.className}
            />
        );
    }
    return <SingleAutocomplete {...props} />;
}

function SingleAutocomplete<T>({
    items,
    value,
    defaultValue = '',
    onValueChange,
    filter = true,
    manualFilter,
    onFilterChange,
    itemLabel,
    itemDisabled,
    clearable,
    loading,
    loadingText,
    size,
    hasMore,
    onLoadMore,
    dataSource,
    minSearchLength,
    pageSize,
    renderItem,
    placeholder,
    invalid,
    disabled,
    'aria-label': ariaLabel,
    className,
}: AutocompleteProps<T>) {
    const translations = useTranslations();
    const [text, setText] = useControllable(value, defaultValue, onValueChange);
    const { focused, onFocus, onBlur } = useFocusWithin();
    const [highlighted, setHighlighted] = useState(-1);
    const [dismissed, setDismissed] = useState(false);
    const listId = `${useId()}suggestions`;
    const { announce, region } = useAnnouncer();
    const list = useOptionList<T, unknown>(
        {
            items,
            itemValue: (item: T) => item,
            itemLabel:
                itemLabel ??
                ((item: T) =>
                    typeof item === 'object' && item !== null
                        ? String((item as Record<string, unknown>).label ?? '')
                        : String(item)),
            itemDisabled,
            manualFilter: manualFilter || !filter,
            onFilterChange,
            loading,
            hasMore,
            onLoadMore,
            dataSource,
            minSearchLength,
            pageSize,
        },
        []
    );
    const options = list.visible.slice(0, 50);
    const open = focused && !dismissed && (!!text || list.loading) && (options.length > 0 || list.loading);
    useEffect(() => {
        if (open && list.announcement) announce(list.announcement);
    }, [open, list.announcement, announce]);
    const type = (next: string) => {
        setText(next);
        list.setQuery(next);
        setHighlighted(-1);
        setDismissed(false);
    };

    return (
        <View className={className}>
            <TextField
                role="combobox"
                aria-expanded={open}
                {...({
                    'aria-controls': open ? listId : undefined,
                    'aria-autocomplete': 'list',
                    'aria-activedescendant': open && highlighted >= 0 ? inlineOptionId(listId, highlighted) : undefined,
                } as object)}
                // Only when given – an undefined one would replace the Field's label
                {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
                value={text}
                placeholder={placeholder}
                size={size}
                invalid={invalid}
                disabled={disabled}
                loading={!!loading}
                clearable={clearable}
                autoCorrect={false}
                onChangeText={type}
                onClear={() => list.setQuery('')}
                onFocus={onFocus}
                onBlur={onBlur}
                onSubmitEditing={() => {
                    const option = highlighted >= 0 ? options[highlighted] : undefined;
                    if (option) type(option.label);
                    setDismissed(true);
                }}
                onKeyPress={(event) => {
                    if (Platform.OS !== 'web' || !open) return;
                    const key = event.nativeEvent.key;
                    if (key === 'ArrowDown') setHighlighted((highlighted + 1) % options.length);
                    if (key === 'ArrowUp') setHighlighted(highlighted <= 0 ? options.length - 1 : highlighted - 1);
                    if (key === 'Escape') setDismissed(true);
                }}
            />
            {open && (
                <InlineOptions
                    id={listId}
                    label={translations.select.suggestions}
                    options={options}
                    highlighted={highlighted}
                    onSelect={(option) => {
                        type(option.label);
                        setDismissed(true);
                    }}
                    renderItem={renderItem}
                    loading={list.loading}
                    loadingText={loadingText}
                    hasMore={list.hasMore}
                    onLoadMore={list.loadMore}
                />
            )}
            {region}
        </View>
    );
}
