import { createListCollection } from '@ark-ui/react/collection';
import { Portal } from '@ark-ui/react/portal';
import { Select as ArkSelect } from '@ark-ui/react/select';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    select as selectRecipe,
    virtualList as virtualListRecipe,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
} from '@wirecore/wirelayer-recipes';
import { Check, ChevronDown, LoaderCircle, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react';
import type { SelectItem } from '../components/Select/Select.js';
import { useListOptions, useListSelection, type SelectSize } from '../components/Select/list.js';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import type { IconComponent } from '../types.js';
import { useOptionSource } from '../utils/data-source.js';

export interface VirtualSelectProps<T = SelectItem, V = ItemValueOf<T>> extends Omit<
    ComponentProps<'button'>,
    'value' | 'defaultValue'
> {
    /** Any number of items – only the visible options are rendered */
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
    /** Search field at the top of the list; filters by label, ignoring case and accents */
    filter?: boolean;
    /** The items are filtered elsewhere (server): no local filtering, listen to onFilterChange */
    manualFilter?: boolean;
    /** Text of the search field (filter) – e.g. to load matching items from a server (manualFilter) */
    onFilterChange?: (text: string) => void;
    /** Shown when no item is left (default "No results" / "No entries") */
    emptyText?: string;
    /** More items can be loaded: reaching the end of the list calls onLoadMore (endless list) */
    hasMore?: boolean;
    /** The end of the list was reached (hasMore) */
    onLoadMore?: () => void;
    /**
     * Loads the items from a server instead of `items`: the first page when it opens, more while scrolling, the search
     * field asks the server (after a typing pause); labels of chosen values that are not loaded come from
     * `getItemsByKeys`
     */
    dataSource?: DataSource<T>;
    /** Items per request of the data source (default 50) */
    pageSize?: number;
    /** Fewest characters the search needs before the data source is asked */
    minSearchLength?: number;
}

/** Select for any number of items – only the visible options are rendered. */
export function VirtualSelect<T = SelectItem, V = ItemValueOf<T>>({
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
    valueKey,
    clearable,
    loading: loadingProp,
    loadingText,
    size,
    filter,
    manualFilter,
    onFilterChange,
    emptyText,
    hasMore: hasMoreProp,
    onLoadMore,
    dataSource,
    pageSize,
    minSearchLength,
    className,
    style,
    onKeyDown,
    ...props
}: VirtualSelectProps<T, V>) {
    const select = useRecipe('select', selectRecipe);
    const virtualList = useRecipe('virtualList', virtualListRecipe);
    const styles = select({ size, clearable });
    const list = virtualList();
    const translations = useTranslations();
    const t = translations.select;
    // No groups: the rows are positioned one below the other
    const accessors = { itemValue, itemLabel, itemDisabled, itemGroup: noGroup, valueKey };
    const [query, setQuery] = useState('');
    const source = useOptionSource<T>({ items, source: dataSource, accessors, pageSize, minSearchLength });
    const {
        options,
        visible: rows,
        firstFor,
    } = useListOptions(source.items, accessors, filter && !manualFilter && !dataSource ? query : '');
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
    const loading = !!loadingProp || source.loading;
    const hasMore = !!hasMoreProp || source.hasMore;
    const current = selected[0];
    const CurrentIcon = current?.icon as IconComponent | undefined;
    const collection = useMemo(
        () =>
            createListCollection({
                items: rows,
                itemToString: (item) => item.label,
                itemToValue: (item) => item.key,
                isItemDisabled: (item) => item.disabled,
            }),
        [rows]
    );
    const listId = useId();
    // With a search field the list below it scrolls, otherwise the whole popup
    const contentRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);
    // Rows are 36px high (h-9). TanStack Virtual returns a mutable instance, so the React Compiler skips
    // this component – expected, it re-renders through the virtualizer itself.
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => (filter ? scrollerRef.current : contentRef.current),
        estimateSize: () => 36,
        overscan: 8,
    });
    // Endless list: the last rendered row is near the end
    const lastIndex = virtualizer.getVirtualItems().at(-1)?.index ?? -1;
    const load = useRef(onLoadMore);
    useEffect(() => {
        load.current = dataSource ? source.loadMore : onLoadMore;
    });
    useEffect(() => {
        if (hasMore && !loading && rows.length && lastIndex >= rows.length - 1) load.current?.();
    }, [lastIndex, rows.length, loading, hasMore]);

    function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        onKeyDown?.(event);
        if (!clearable || !selected.length || (event.key !== 'Backspace' && event.key !== 'Delete')) return;
        event.preventDefault();
        commit([]);
    }

    const spacer = (
        <>
            <div className={list.spacer()} style={{ height: `${virtualizer.getTotalSize()}px` }}>
                {virtualizer.getVirtualItems().map((row) => {
                    const item = rows[row.index]!;
                    const Icon = item.icon as IconComponent | undefined;
                    return (
                        <ArkSelect.Item
                            key={row.key}
                            item={item}
                            className={styles.item({ class: list.item() })}
                            style={{ transform: `translateY(${row.start}px)` }}
                            aria-setsize={rows.length}
                            aria-posinset={row.index + 1}
                        >
                            {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
                            <ArkSelect.ItemText className={styles.itemText()}>{item.label}</ArkSelect.ItemText>
                            <ArkSelect.ItemIndicator>
                                <Check className={styles.itemIndicator()} aria-hidden="true" />
                            </ArkSelect.ItemIndicator>
                        </ArkSelect.Item>
                    );
                })}
            </div>
            {loading && (
                <div className={styles.loading()}>
                    <LoaderCircle className={styles.loadingIcon()} aria-hidden="true" />
                    {loadingText ?? translations.common.loading}
                </div>
            )}
            {/* A disabled option, so the listbox is never empty */}
            {!rows.length && !loading && (
                <div role="option" aria-disabled="true" className={styles.empty()}>
                    {emptyText ??
                        source.emptyText ??
                        (query ? translations.common.noResults : translations.common.empty)}
                </div>
            )}
        </>
    );

    return (
        // Ark navigates the full collection; scrollToIndexFn brings the highlighted option into the rendered window
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
            positioning={{ sameWidth: true, gutter: 4 }}
            composite={!filter}
            scrollToIndexFn={(details) => virtualizer.scrollToIndex(details.index, { align: 'auto' })}
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
                        {CurrentIcon && <CurrentIcon className={styles.icon()} aria-hidden="true" />}
                        <ArkSelect.ValueText placeholder={placeholder ?? translations.common.placeholder}>
                            {current?.label || undefined}
                        </ArkSelect.ValueText>
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
                        ref={contentRef}
                        className={styles.content()}
                        aria-busy={loading || undefined}
                        aria-label={filter ? props['aria-label'] : undefined}
                    >
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
                                                onChange={(event) => {
                                                    const text = event.target.value;
                                                    setQuery(text);
                                                    onFilterChange?.(text);
                                                    if (dataSource) source.search(text);
                                                    const first =
                                                        manualFilter || dataSource ? undefined : firstFor(text);
                                                    if (first)
                                                        requestAnimationFrame(() => api.setHighlightValue(first.key));
                                                }}
                                                // Space types a space, Home/End move the caret – the list would take them
                                                onKeyDown={(event) => {
                                                    if ([' ', 'Home', 'End'].includes(event.key))
                                                        event.stopPropagation();
                                                }}
                                            />
                                        )}
                                    </ArkSelect.Context>
                                </div>
                                <ArkSelect.List
                                    ref={scrollerRef}
                                    id={listId}
                                    className={styles.list({ class: list.scroll() })}
                                >
                                    {spacer}
                                </ArkSelect.List>
                            </>
                        ) : (
                            spacer
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

const noGroup = () => undefined;
