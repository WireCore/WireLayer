import { createListCollection } from '@ark-ui/react/collection';
import { useFieldContext } from '@ark-ui/react/field';
import { Portal } from '@ark-ui/react/portal';
import { Select as ArkSelect } from '@ark-ui/react/select';
import {
    controlIds,
    select as selectRecipe,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronDown, LoaderCircle, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { useOptionSource } from '../../utils/data-source.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { ListOptions, useListOptions, useListSelection, type ListItemState, type SelectSize } from './list.js';

export type { ListItemState, SelectSize } from './list.js';

/** Option of Select, MultiSelect, Combobox and VirtualSelect */
export interface SelectItem<V = string> {
    value: V;
    label: string;
    /** Icon component shown in the option and in the trigger when selected */
    icon?: IconComponent;
    disabled?: boolean;
    /** Second line below the label */
    description?: string;
    /** Items with the same group are listed under this heading */
    group?: string;
    /** More text the search finds the item by, besides its label */
    keywords?: readonly string[];
}

export interface SelectProps<T = SelectItem, V = ItemValueOf<T>> extends Omit<
    ComponentProps<'button'>,
    'value' | 'defaultValue'
> {
    /** Options: SelectItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled/itemGroup */
    items: readonly T[];
    /** Selected value; any type (string, number, boolean, object) */
    value?: V | null;
    defaultValue?: V | null;
    onValueChange?: (value: V | null) => void;
    placeholder?: string;
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
    /**
     * More text the search finds an item by, besides its label: property name or function, one text or a list
     * (default: `keywords`), e.g. the name of the item's category
     */
    itemKeywords?: ItemAccessor<T, string | readonly string[] | null | undefined>;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** Button that clears the value (also Backspace/Delete on the closed field) */
    clearable?: boolean;
    /** Shows a spinner in the field and "Loading" in the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row in the list */
    loadingText?: string;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: SelectSize;
    /** Search field at the top of the list; filters by label and itemKeywords, ignoring case and accents */
    filter?: boolean;
    /** The items are filtered elsewhere (server): no local filtering, listen to onFilterChange */
    manualFilter?: boolean;
    /** Text of the search field (filter) – e.g. to load matching items from a server (manualFilter) */
    onFilterChange?: (text: string) => void;
    /** Shown when no item is left (default "No results" / "No entries") */
    emptyText?: string;
    /** More items can be loaded: scrolling to the end of the list calls onLoadMore */
    hasMore?: boolean;
    /** The end of the list was scrolled into view (hasMore) */
    onLoadMore?: () => void;
    /**
     * Loads the options when the list opens (pages while scrolling; with `filter` the search asks it, after a
     * typing pause, outdated answers dropped); `getItemsByKeys` gives the label of a chosen value that is not loaded
     */
    dataSource?: DataSource<T>;
    /** Fewest characters the search needs before the data source is asked */
    minSearchLength?: number;
    /** Options per request of the data source (default 50) */
    pageSize?: number;
    /** Not labelled by a surrounding Field – for a second control inside it (e.g. PhoneInput's country) */
    standalone?: boolean;
    /** Content of an option (instead of icon and label) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    /** Content of the field for the selected item */
    renderValue?: (item: T) => ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof selectRecipe>;
}

interface Api {
    focus(): void;
    setHighlightValue(value: string): void;
    highlightedItem: unknown;
    getItemProps(props: { item: unknown }): { id?: string };
}

/** Dropdown list for one option: arrow keys, typeahead, Escape; native select hidden for forms */
export function Select<T = SelectItem, V = ItemValueOf<T>>({
    classes,
    items,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    disabled,
    invalid,
    required,
    name,
    itemValue,
    itemLabel,
    itemDisabled,
    itemGroup,
    itemKeywords,
    valueKey,
    clearable,
    loading,
    loadingText,
    size,
    filter,
    manualFilter,
    onFilterChange,
    emptyText,
    hasMore,
    onLoadMore,
    dataSource,
    minSearchLength,
    pageSize,
    standalone,
    renderItem,
    renderValue,
    id,
    className,
    style,
    onKeyDown,
    ...props
}: SelectProps<T, V>) {
    const select = useRecipe('select', selectRecipe, classes);
    const styles = select({ size, clearable });
    // An own id goes to the trigger through Ark (it finds the trigger by its id)
    const field = useFieldContext();
    const translations = useTranslations();
    const t = translations.select;
    const accessors = { itemValue, itemLabel, itemDisabled, itemGroup, itemKeywords, valueKey };
    const [query, setQuery] = useState('');
    const source = useOptionSource<T>({ items, source: dataSource, accessors, pageSize, minSearchLength });
    const { options, groups, ordered, firstFor } = useListOptions(
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
        // Without a data source and loaded: a value outside the items warns in development
        check: { component: 'Select', ready: !dataSource && !loading && items.length > 0 },
    });
    // A chosen value that is not loaded gets its label from the data source
    const keyText = keys.join('\u0000');
    useEffect(() => {
        source.resolve(keys, known);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the chosen keys change
    }, [keyText, dataSource]);
    const listLoading = loading || source.loading;
    const current = selected[0];
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
    const listId = useId();
    const CurrentIcon = current?.icon as IconComponent | undefined;
    const listClasses = {
        item: styles.item(),
        itemText: styles.itemText(),
        icon: styles.icon(),
        itemIndicator: styles.itemIndicator(),
        itemBody: styles.itemBody(),
        itemDescription: styles.itemDescription(),
        group: styles.group(),
        groupLabel: styles.groupLabel(),
        loading: styles.loading(),
        loadingIcon: styles.loadingIcon(),
        sentinel: styles.sentinel(),
        empty: styles.empty(),
    };
    const list = (
        <ListOptions
            parts={ArkSelect}
            groups={groups}
            classes={listClasses}
            loading={listLoading}
            loadingText={loadingText ?? translations.common.loading}
            hasMore={hasMore || source.hasMore}
            onLoadMore={() => (dataSource ? source.loadMore() : onLoadMore?.())}
            emptyText={
                emptyText ?? source.emptyText ?? (query ? translations.common.noResults : translations.common.empty)
            }
            renderItem={renderItem}
        />
    );

    function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        onKeyDown?.(event);
        if (!clearable || !selected.length || (event.key !== 'Backspace' && event.key !== 'Delete')) return;
        event.preventDefault();
        commit([]);
    }
    function onFilterInput(api: Api, text: string) {
        setQuery(text);
        onFilterChange?.(text);
        if (dataSource) source.search(text);
        // Highlight the first match, so Enter takes it (once the list shows it)
        const first = manualFilter || dataSource ? undefined : firstFor(text);
        if (first) requestAnimationFrame(() => api.setHighlightValue(first.key));
    }

    return (
        <ArkSelect.Root
            className={styles.base({ class: className })}
            style={style}
            collection={collection}
            value={keys}
            onValueChange={(details) => commitKeys(details.value, details.items as ListOption<T>[])}
            onOpenChange={(details) => {
                if (details.open) source.open();
                if (details.open || !query) return;
                setQuery('');
                onFilterChange?.('');
                if (dataSource) source.search('');
            }}
            disabled={disabled}
            invalid={invalid}
            required={required}
            name={name}
            {...controlIds(id, 'trigger', { label: field?.ids.label, hiddenSelect: field?.ids.control }, standalone)}
            positioning={{ sameWidth: true, gutter: 4 }}
            composite={!filter}
            lazyMount
            unmountOnExit
        >
            {/* No class attribute without a clear button (unchanged DOM) */}
            <ArkSelect.Control {...(clearable ? { className: styles.control() } : {})}>
                <ArkSelect.Trigger
                    {...props}
                    className={styles.trigger()}
                    aria-busy={loading || undefined}
                    onKeyDown={onTriggerKeyDown}
                >
                    <span className={styles.value()}>
                        {renderValue && current ? (
                            renderValue(current.item)
                        ) : (
                            <>
                                {CurrentIcon && <CurrentIcon className={styles.icon()} aria-hidden="true" />}
                                <ArkSelect.ValueText placeholder={placeholder ?? translations.common.placeholder}>
                                    {current?.label || undefined}
                                </ArkSelect.ValueText>
                            </>
                        )}
                    </span>
                    <ArkSelect.Indicator className={styles.indicator()}>
                        {loading ? (
                            <LoaderCircle className={styles.spinner()} aria-hidden="true" />
                        ) : (
                            <ChevronDown className={styles.indicatorIcon()} aria-hidden="true" />
                        )}
                    </ArkSelect.Indicator>
                </ArkSelect.Trigger>
                {clearable && (
                    <ArkSelect.Context>
                        {(api) =>
                            current &&
                            !api.disabled && (
                                // Not a tab stop: Backspace/Delete on the field clears, too
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    className={styles.clear()}
                                    aria-label={t.clear}
                                    onClick={() => {
                                        commit([]);
                                        api.focus();
                                    }}
                                >
                                    <X className={styles.clearIcon()} aria-hidden="true" />
                                </button>
                            )
                        }
                    </ArkSelect.Context>
                )}
            </ArkSelect.Control>
            <Portal>
                <ArkSelect.Positioner>
                    <ArkSelect.Content
                        className={styles.content()}
                        aria-busy={listLoading || undefined}
                        aria-label={filter ? props['aria-label'] : undefined}
                    >
                        {/* With a search field the popup is a dialog: search field, then the list */}
                        {filter ? (
                            <>
                                <div className={styles.header()}>
                                    <ArkSelect.Context>
                                        {(api) => (
                                            <input
                                                type="text"
                                                role="combobox"
                                                autoComplete="off"
                                                aria-autocomplete="list"
                                                aria-expanded="true"
                                                data-autofocus=""
                                                aria-controls={listId}
                                                aria-activedescendant={
                                                    api.highlightedItem
                                                        ? api.getItemProps({ item: api.highlightedItem }).id
                                                        : undefined
                                                }
                                                aria-label={t.filter}
                                                placeholder={translations.combobox.search}
                                                value={query}
                                                className={styles.search()}
                                                onChange={(event) => onFilterInput(api, event.target.value)}
                                                // Space types a space, Home/End move the caret – the list would take them
                                                onKeyDown={(event) => {
                                                    if ([' ', 'Home', 'End'].includes(event.key))
                                                        event.stopPropagation();
                                                }}
                                            />
                                        )}
                                    </ArkSelect.Context>
                                </div>
                                <ArkSelect.List id={listId} className={styles.list()}>
                                    {list}
                                </ArkSelect.List>
                            </>
                        ) : (
                            list
                        )}
                    </ArkSelect.Content>
                </ArkSelect.Positioner>
            </Portal>
            <ArkSelect.HiddenSelect />
            {dataSource && (
                <span role="status" className={styles.status()}>
                    {source.announcement}
                </span>
            )}
        </ArkSelect.Root>
    );
}
