import { Combobox as ArkCombobox } from '@ark-ui/react/combobox';
import { createListCollection } from '@ark-ui/react/collection';
import { Portal } from '@ark-ui/react/portal';
import {
    combobox as comboboxRecipe,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronDown, LoaderCircle, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { useOptionSource } from '../../utils/data-source.js';
import type { SelectItem } from '../Select/Select.js';
import { ListOptions, useListOptions, useListSelection, type ListItemState, type SelectSize } from '../Select/list.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ComboboxProps<T = SelectItem, V = ItemValueOf<T>> extends Omit<
    ComponentProps<'input'>,
    'value' | 'defaultValue' | 'size'
> {
    /** Options: SelectItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled/itemGroup */
    items: readonly T[];
    /** Chosen value; any type (string, number, boolean, object) */
    value?: V | null;
    defaultValue?: V | null;
    onValueChange?: (value: V | null) => void;
    /** Every change of the text (typing, choosing, clearing) */
    onInputValueChange?: (inputValue: string) => void;
    /** Typed text – e.g. to load matching items from a server (manualFilter) */
    onFilterChange?: (text: string) => void;
    /** Filters the items by the typed text (ignores case and accents) */
    filter?: boolean;
    /** The items are filtered elsewhere (server): no local filtering, listen to onFilterChange */
    manualFilter?: boolean;
    /**
     * Typed text that matches no item becomes the value (a string) on Enter or when leaving the field – an editable
     * select
     */
    allowCustomValue?: boolean;
    /** Shown when nothing matches */
    emptyText?: string;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Value of an item: property name or function (default: `value`, otherwise the item itself) */
    itemValue?: ItemAccessor<T, V>;
    /** Label of an item: property name or function (default: `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of an item: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Group heading of an item: property name or function (default: `group`); items are listed per group */
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** Button that clears value and text (default true; not a tab stop – the text can be deleted, too) */
    clearable?: boolean;
    /** Shows a spinner in the field and "Loading" in the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row in the list */
    loadingText?: string;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: SelectSize;
    /** More items can be loaded: scrolling to the end of the list calls onLoadMore */
    hasMore?: boolean;
    /** The end of the list was scrolled into view (hasMore) */
    onLoadMore?: () => void;
    /**
     * Loads the options for the typed text (after a typing pause, outdated answers dropped; pages while
     * scrolling); `getItemsByKeys` gives the label of a chosen value that is not loaded
     */
    dataSource?: DataSource<T>;
    /** Fewest characters typed before the data source is asked */
    minSearchLength?: number;
    /** Options per request of the data source (default 50) */
    pageSize?: number;
    /** Content of an option (instead of icon and label) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof comboboxRecipe>;
}

/** Text field with suggestions (autocomplete): type to filter, arrow keys to choose, Enter to take */
export function Combobox<T = SelectItem, V = ItemValueOf<T>>({
    classes,
    items,
    value,
    defaultValue,
    onValueChange,
    onInputValueChange,
    onFilterChange,
    filter = true,
    manualFilter,
    allowCustomValue,
    emptyText,
    placeholder,
    disabled,
    readOnly,
    invalid,
    required,
    name,
    itemValue,
    itemLabel,
    itemDisabled,
    itemGroup,
    valueKey,
    clearable = true,
    loading,
    loadingText,
    size,
    hasMore,
    onLoadMore,
    dataSource,
    minSearchLength,
    pageSize,
    renderItem,
    className,
    style,
    onBlur,
    onKeyDown,
    ...props
}: ComboboxProps<T, V>) {
    const combobox = useRecipe('combobox', comboboxRecipe, classes);
    const styles = combobox({ size });
    const translations = useTranslations();
    const accessors = { itemValue, itemLabel, itemDisabled, itemGroup, valueKey };
    const [query, setQuery] = useState('');
    const source = useOptionSource<T>({ items, source: dataSource, accessors, pageSize, minSearchLength });
    const { options, groups, ordered } = useListOptions(
        source.items,
        accessors,
        filter && !manualFilter && !dataSource ? query : ''
    );
    const known = useMemo(() => [...options, ...source.resolvedOptions], [options, source.resolvedOptions]);
    const { selected, keys, commit, commitKeys } = useListSelection<T>({
        multiple: false,
        value,
        defaultValue,
        accessors,
        items: known,
        onChange: onValueChange,
    });
    // A chosen value that is not loaded gets its label from the data source
    const keyText = keys.join('\u0000');
    useEffect(() => {
        source.resolve(keys, known);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the chosen keys change
    }, [keyText, dataSource]);
    const listLoading = loading || source.loading;
    const collection = useMemo(
        () =>
            createListCollection({
                items: ordered,
                itemToString: (item) => item.label,
                itemToValue: (item) => item.key,
                isItemDisabled: (item) => item.disabled,
            }),
        [ordered]
    );
    // The text shows the label of the value – also when it is not among the items (server search, own entries) –
    // except while typing
    const [draft, setDraft] = useState<string | null>(null);
    const text = draft ?? selected[0]?.label ?? '';
    const [highlighted, setHighlighted] = useState<string | null>(null);

    /** allowCustomValue: the typed text becomes the value – the matching item, the text itself or nothing */
    function commitText() {
        if (!allowCustomValue || draft === null) return;
        setDraft(null);
        const typed = draft.trim();
        const lower = typed.toLocaleLowerCase();
        const match = options.find((option) => option.label.toLocaleLowerCase() === lower);
        if (match && match.key === selected[0]?.key) return;
        commit(
            !typed
                ? []
                : [match ?? ({ key: typed, value: typed, label: typed, disabled: false, item: typed } as ListOption<T>)]
        );
    }

    return (
        <ArkCombobox.Root
            className={styles.base({ class: className })}
            style={style}
            collection={collection}
            value={keys}
            onValueChange={(details) => commitKeys(details.value, details.items as ListOption<T>[])}
            inputValue={text}
            onInputValueChange={(details) => {
                // Only typing filters; choosing an item or clearing shows all items again
                const typing = details.reason === 'input-change';
                setQuery(typing ? details.inputValue : '');
                setDraft(typing ? details.inputValue : null);
                onInputValueChange?.(details.inputValue);
                if (typing) onFilterChange?.(details.inputValue);
                if (typing && dataSource) source.search(details.inputValue);
            }}
            onHighlightChange={(details) => setHighlighted(details.highlightedValue)}
            onOpenChange={(details) => {
                if (details.open && draft === null) source.open();
            }}
            allowCustomValue={allowCustomValue}
            disabled={disabled}
            readOnly={readOnly}
            invalid={invalid}
            required={required}
            name={name}
            placeholder={placeholder}
            positioning={{ sameWidth: true, gutter: 4 }}
            translations={translations.combobox}
            lazyMount
            unmountOnExit
        >
            <ArkCombobox.Control className={styles.control()}>
                <ArkCombobox.Input
                    {...props}
                    className={styles.input()}
                    aria-busy={loading || undefined}
                    onBlur={(event) => {
                        onBlur?.(event);
                        commitText();
                    }}
                    onKeyDown={(event) => {
                        onKeyDown?.(event);
                        if (event.key === 'Enter' && !highlighted) commitText();
                    }}
                />
                {clearable && (
                    <ArkCombobox.ClearTrigger className={styles.clear()}>
                        <X className={styles.clearIcon()} aria-hidden="true" />
                    </ArkCombobox.ClearTrigger>
                )}
                <ArkCombobox.Trigger className={styles.trigger()}>
                    {loading ? (
                        <LoaderCircle className={styles.spinner()} aria-hidden="true" />
                    ) : (
                        <ChevronDown className={styles.triggerIcon()} aria-hidden="true" />
                    )}
                </ArkCombobox.Trigger>
            </ArkCombobox.Control>
            <Portal>
                <ArkCombobox.Positioner>
                    <ArkCombobox.Content className={styles.content()} aria-busy={listLoading || undefined}>
                        {!listLoading && (
                            <ArkCombobox.Empty className={styles.empty()}>
                                {emptyText ?? source.emptyText ?? translations.common.noResults}
                            </ArkCombobox.Empty>
                        )}
                        <ListOptions
                            parts={ArkCombobox}
                            groups={groups}
                            classes={{
                                item: styles.item(),
                                itemText: styles.itemText(),
                                icon: styles.itemIndicator(),
                                itemIndicator: styles.itemIndicator(),
                                itemBody: styles.itemBody(),
                                itemDescription: styles.itemDescription(),
                                group: styles.group(),
                                groupLabel: styles.groupLabel(),
                                loading: styles.loading(),
                                loadingIcon: styles.loadingIcon(),
                                sentinel: styles.sentinel(),
                            }}
                            loading={listLoading}
                            loadingText={loadingText ?? translations.common.loading}
                            hasMore={hasMore || source.hasMore}
                            onLoadMore={() => (dataSource ? source.loadMore() : onLoadMore?.())}
                            renderItem={renderItem}
                        />
                    </ArkCombobox.Content>
                </ArkCombobox.Positioner>
            </Portal>
            {dataSource && (
                <span role="status" className={styles.announcer()}>
                    {source.announcement}
                </span>
            )}
        </ArkCombobox.Root>
    );
}
