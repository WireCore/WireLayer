import { createListCollection, Listbox as ArkListbox } from '@ark-ui/react/listbox';
import {
    controlIds,
    allListOptionsState,
    listbox as listboxRecipe,
    toggleAllListOptions,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Check, Minus } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { useOptionSource } from '../../utils/data-source.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { ListOptions, useListOptions, useListSelection, type ListItemState } from '../Select/list.js';
import { useLabelForWarning } from '../../utils/label-for.js';

export interface ListboxItem<V = string> {
    value: V;
    label: string;
    icon?: IconComponent;
    disabled?: boolean;
    /** Second line below the label */
    description?: string;
    /** Items with the same group are listed under this heading */
    group?: string;
}

export interface ListboxProps<T = ListboxItem, V = ItemValueOf<T>> {
    /** Options: ListboxItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled/itemGroup */
    items: readonly T[];
    /** Visible label, also the list's accessible name */
    label?: string;
    /** Accessible name without a visible label */
    'aria-label'?: string;
    /** Id of the root element; a `<label for>` cannot name the list box, use a Field or aria-label */
    id?: string;
    /** Several options can be chosen (Space toggles) */
    multiple?: boolean;
    /** Chosen values; any type (string, number, boolean, object) */
    value?: V[];
    defaultValue?: V[];
    onValueChange?: (value: V[]) => void;
    disabled?: boolean;
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
    /** Search field above the list; filters by label, ignoring case and accents */
    filter?: boolean;
    /** The items are filtered elsewhere (server): no local filtering, listen to onFilterChange */
    manualFilter?: boolean;
    /** Text of the search field (filter) – e.g. to load matching items from a server (manualFilter) */
    onFilterChange?: (text: string) => void;
    /** Shown when no item is left (default "No results" / "No entries") */
    emptyText?: string;
    /** Shows "Loading" at the end of the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row */
    loadingText?: string;
    /** More items can be loaded: scrolling to the end of the list calls onLoadMore */
    hasMore?: boolean;
    /** The end of the list was scrolled into view (hasMore) */
    onLoadMore?: () => void;
    /** Check boxes before the options (`multiple`) */
    checkboxes?: boolean;
    /** "Select all" above the options (`multiple`) – takes the options in view (filtered, enabled) */
    selectAll?: boolean;
    /**
     * Loads the options (pages while scrolling, the search field asks it); `getItemsByKeys` gives the labels of
     * chosen values that are not loaded
     */
    dataSource?: DataSource<T>;
    /** Fewest characters the search needs before the data source is asked */
    minSearchLength?: number;
    /** Options per request of the data source (default 50) */
    pageSize?: number;
    /** The options can be dragged (`draggable`, `data-value` is the key) – lists that exchange items (PickList) */
    draggableItems?: boolean;
    /** Content of an option (instead of icon and label) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof listboxRecipe>;
}

/** Always visible list (role="listbox"): arrow keys move, Enter/Space choose, typing jumps to an option */
export function Listbox<T = ListboxItem, V = ItemValueOf<T>>({
    classes,
    items,
    label,
    'aria-label': ariaLabel,
    id,
    multiple = false,
    value,
    defaultValue,
    onValueChange,
    disabled = false,
    itemValue,
    itemLabel,
    itemDisabled,
    itemGroup,
    valueKey,
    filter,
    manualFilter,
    onFilterChange,
    emptyText,
    loading,
    loadingText,
    hasMore,
    onLoadMore,
    checkboxes = false,
    selectAll = false,
    dataSource,
    minSearchLength,
    pageSize,
    draggableItems = false,
    renderItem,
    className,
    style,
}: ListboxProps<T, V>) {
    useLabelForWarning('Listbox', id);
    const listbox = useRecipe('listbox', listboxRecipe, classes);
    const styles = listbox();
    const translations = useTranslations();
    const accessors = { itemValue, itemLabel, itemDisabled, itemGroup, valueKey };
    const [query, setQuery] = useState('');
    const source = useOptionSource<T>({ items, source: dataSource, accessors, pageSize, minSearchLength });
    const { options, visible, groups, ordered } = useListOptions(
        source.items,
        accessors,
        filter && !manualFilter && !dataSource ? query : ''
    );
    const known = useMemo(() => [...options, ...source.resolvedOptions], [options, source.resolvedOptions]);
    const { selected, keys, commit, commitKeys } = useListSelection<T>({
        multiple: true,
        value,
        defaultValue,
        accessors,
        items: known,
        onChange: onValueChange,
        // Without a data source and loaded: a value outside the items warns in development
        check: { component: 'Listbox', ready: !dataSource && !loading && items.length > 0 },
    });
    // Always visible: the first page loads at once; chosen values that are not loaded get their labels
    const keyText = keys.join('\u0000');
    useEffect(() => {
        source.open();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- once, and again for another source
    }, [dataSource]);
    useEffect(() => {
        source.resolve(keys, known);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the chosen keys change
    }, [keyText, dataSource]);
    const isLoading = loading || source.loading;
    const selectable = visible.filter((option) => !option.disabled);
    const allState = allListOptionsState(selected, selectable);
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
    return (
        <ArkListbox.Root
            {...controlIds(id, 'root')}
            className={styles.base({ class: className })}
            style={style}
            collection={collection}
            selectionMode={multiple ? 'multiple' : 'single'}
            value={keys}
            onValueChange={(details) => commitKeys(details.value, details.items as ListOption<T>[])}
            disabled={disabled}
        >
            {label && <ArkListbox.Label className={styles.label()}>{label}</ArkListbox.Label>}
            {/* Search field: arrow keys move in the list, Enter chooses */}
            {filter && (
                <ArkListbox.Input
                    className={styles.search()}
                    aria-label={translations.select.filter}
                    placeholder={translations.combobox.search}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        onFilterChange?.(event.target.value);
                        if (dataSource) source.search(event.target.value);
                    }}
                />
            )}
            {/* "Select all": a check box for the options in view */}
            {multiple && selectAll && selectable.length > 0 && (
                <button
                    type="button"
                    role="checkbox"
                    aria-checked={allState}
                    disabled={disabled}
                    className={styles.selectAll()}
                    onClick={() => commit(toggleAllListOptions(selected, visible))}
                >
                    <span
                        className={styles.check()}
                        data-state={allState === 'mixed' ? 'indeterminate' : allState ? 'checked' : 'unchecked'}
                        aria-hidden="true"
                    >
                        {allState === 'mixed' ? (
                            <Minus className={styles.checkIcon()} />
                        ) : allState ? (
                            <Check className={styles.checkIcon()} />
                        ) : null}
                    </span>
                    {translations.select.selectAll}
                </button>
            )}
            <ArkListbox.Content
                className={styles.content()}
                aria-label={label ? undefined : ariaLabel}
                aria-busy={isLoading || undefined}
            >
                <ListOptions
                    parts={ArkListbox}
                    groups={groups}
                    classes={{
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
                        check: styles.check(),
                        checkIcon: styles.checkIcon(),
                    }}
                    checkbox={checkboxes}
                    draggable={draggableItems}
                    loading={isLoading}
                    loadingText={loadingText ?? translations.common.loading}
                    hasMore={hasMore || source.hasMore}
                    onLoadMore={() => (dataSource ? source.loadMore() : onLoadMore?.())}
                    emptyText={
                        emptyText ??
                        source.emptyText ??
                        (query ? translations.common.noResults : translations.common.empty)
                    }
                    renderItem={renderItem}
                />
            </ArkListbox.Content>
            {dataSource && (
                <p role="status" className={styles.status()}>
                    {source.announcement}
                </p>
            )}
        </ArkListbox.Root>
    );
}
