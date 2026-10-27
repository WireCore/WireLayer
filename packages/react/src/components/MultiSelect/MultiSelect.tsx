import { createListCollection } from '@ark-ui/react/collection';
import { useFieldContext } from '@ark-ui/react/field';
import { Portal } from '@ark-ui/react/portal';
import { Select as ArkSelect } from '@ark-ui/react/select';
import {
    controlIds,
    allListOptionsState,
    indexListOptions,
    multiSelect as multiSelectRecipe,
    toggleAllListOptions,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Check, ChevronDown, LoaderCircle, Minus, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import { useOptionSource } from '../../utils/data-source.js';
import type { SelectItem } from '../Select/Select.js';
import { ListOptions, useListOptions, useListSelection, type ListItemState, type SelectSize } from '../Select/list.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface MultiSelectProps<T = SelectItem, V = ItemValueOf<T>> extends Omit<
    ComponentProps<'button'>,
    'value' | 'defaultValue'
> {
    /** Options: SelectItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled/itemGroup */
    items: readonly T[];
    /** Selected values; any type (string, number, boolean, object) */
    value?: V[];
    defaultValue?: V[];
    onValueChange?: (value: V[]) => void;
    placeholder?: string;
    /** Trigger text once more than this many items are selected, e.g. "4 selected" */
    summary?: (count: number) => string;
    /** Selected labels shown in the trigger before the summary is used */
    maxShown?: number;
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
    /** Selected items as text (default) or as chips with a remove button each (Backspace removes the last) */
    display?: 'text' | 'chips';
    /** Check boxes before the options (default); false shows a check mark after the label */
    checkboxes?: boolean;
    /** "Select all" above the options – takes the options in view (filtered, enabled) */
    selectAll?: boolean;
    /** Most options that can be chosen; the others are disabled then and the limit is announced */
    max?: number;
    /** Button that clears all values (also Delete on the closed field) */
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
     * typing pause, outdated answers dropped); `getItemsByKeys` gives the labels of chosen values that are not loaded
     */
    dataSource?: DataSource<T>;
    /** Fewest characters the search needs before the data source is asked */
    minSearchLength?: number;
    /** Options per request of the data source (default 50) */
    pageSize?: number;
    /** Content of an option (instead of icon and label) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    /** Content of the field for the selected items (display "text") */
    renderValue?: (items: T[]) => ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof multiSelectRecipe>;
}

interface Api {
    focus(): void;
    setHighlightValue(value: string): void;
}

/** Select with several values: the list stays open while choosing, Space/Enter toggle an option */
export function MultiSelect<T = SelectItem, V = ItemValueOf<T>>({
    classes,
    items,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    summary,
    maxShown = 2,
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
    display = 'text',
    checkboxes = true,
    selectAll,
    max,
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
    renderItem,
    renderValue,
    id,
    className,
    style,
    onKeyDown,
    ...props
}: MultiSelectProps<T, V>) {
    const multiSelect = useRecipe('multiSelect', multiSelectRecipe, classes);
    const chips = display === 'chips';
    const styles = multiSelect({ size, clearable: clearable && !chips });
    // An own id goes to the trigger through Ark (it finds the trigger by its id)
    const field = useFieldContext();
    const translations = useTranslations();
    const t = translations.select;
    const accessors = { itemValue, itemLabel, itemDisabled, itemGroup, itemKeywords, valueKey };
    const [query, setQuery] = useState('');
    const source = useOptionSource<T>({ items, source: dataSource, accessors, pageSize, minSearchLength });
    const { options, visible, groups, ordered, firstFor } = useListOptions(
        source.items,
        accessors,
        filter && !manualFilter && !dataSource ? query : ''
    );
    const known = useMemo(() => [...options, ...source.resolvedOptions], [options, source.resolvedOptions]);
    const { selected, keys, commit } = useListSelection<T>({
        multiple: true,
        value,
        defaultValue,
        accessors,
        items: known,
        onChange: onValueChange,
        // Without a data source and loaded: a value outside the items warns in development
        check: { component: 'MultiSelect', ready: !dataSource && !loading && items.length > 0 },
    });
    // Chosen values that are not loaded get their labels from the data source
    const keyText = keys.join('\u0000');
    useEffect(() => {
        source.resolve(keys, known);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the chosen keys change
    }, [keyText, dataSource]);
    const listLoading = loading || source.loading;
    const atMax = max !== undefined && selected.length >= max;
    const keyList = keys.join('\n');
    const collection = useMemo(() => {
        const chosen = new Set(keyList.split('\n'));
        return createListCollection({
            items: ordered,
            itemToString: (item) => item.label,
            itemToValue: (item) => item.key,
            // At the maximum only the chosen options can still be changed
            isItemDisabled: (item) => item.disabled || (atMax && !chosen.has(item.key)),
        });
    }, [ordered, atMax, keyList]);
    const panel = filter || selectAll;
    const listId = useId();
    // "Select all" counts the selectable options in view
    const selectable = visible.filter((option) => !option.disabled);
    const allState = allListOptionsState(selected, selectable);
    // Removed chips and the reached maximum are announced
    const [announcement, setAnnouncement] = useState('');

    function update(next: ListOption<T>[]) {
        const reached = max !== undefined && next.length >= max && selected.length < max;
        commit(next);
        if (reached) setAnnouncement(t.maxReached(max));
    }
    function remove(option: ListOption<T>) {
        commit(selected.filter((other) => other.key !== option.key));
        setAnnouncement(t.removed(option.label));
    }
    function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        onKeyDown?.(event);
        const last = selected.at(-1);
        if (!last) return;
        if (chips && event.key === 'Backspace') {
            event.preventDefault();
            remove(last);
        } else if (clearable && (event.key === 'Delete' || event.key === 'Backspace')) {
            event.preventDefault();
            commit([]);
        }
    }
    function onFilterInput(api: Api, text: string) {
        setQuery(text);
        onFilterChange?.(text);
        if (dataSource) source.search(text);
        // Highlight the first match, so Space/Enter takes it (once the list shows it)
        const first = manualFilter || dataSource ? undefined : firstFor(text);
        if (first) requestAnimationFrame(() => api.setHighlightValue(first.key));
    }

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
        check: styles.check(),
        checkIcon: styles.checkIcon(),
    };
    const list = (
        <ListOptions
            parts={ArkSelect}
            groups={groups}
            classes={listClasses}
            checkbox={checkboxes}
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
    const triggerText = !selected.length
        ? (placeholder ?? translations.common.placeholder)
        : selected.length > maxShown
          ? (summary ?? translations.common.selectedCount)(selected.length)
          : selected.map((option) => option.label).join(', ');

    return (
        <ArkSelect.Root
            className={styles.base({ class: className })}
            style={style}
            collection={collection}
            multiple
            closeOnSelect={false}
            value={keys}
            onValueChange={(details) => {
                const index = indexListOptions(known, details.items as ListOption<T>[], selected);
                update(details.value.map((key) => index.get(key)).filter((option) => option !== undefined));
            }}
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
            composite={!panel}
            {...controlIds(id, 'trigger', { label: field?.ids.label, hiddenSelect: field?.ids.control })}
            lazyMount
            unmountOnExit
        >
            <ArkSelect.Context>
                {(api) => (
                    // No class attribute without chips or clear button (unchanged DOM)
                    <ArkSelect.Control
                        {...(chips || clearable ? { className: chips ? styles.chipsControl() : styles.control() } : {})}
                    >
                        {chips &&
                            selected.map((option) => (
                                <span key={option.key} className={styles.chip()}>
                                    <span className={styles.chipText()}>{option.label}</span>
                                    {/* Not a tab stop: Backspace on the field removes the last chip */}
                                    {!api.disabled && (
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            className={styles.chipRemove()}
                                            aria-label={t.removeItem(option.label)}
                                            onClick={() => remove(option)}
                                        >
                                            <X className={styles.chipRemoveIcon()} aria-hidden="true" />
                                        </button>
                                    )}
                                </span>
                            ))}
                        <ArkSelect.Trigger
                            {...props}
                            className={chips ? styles.chipsTrigger() : styles.trigger()}
                            aria-busy={loading || undefined}
                            onKeyDown={onTriggerKeyDown}
                        >
                            <span className={styles.value()} data-placeholder-shown={!selected.length || undefined}>
                                {chips ? (
                                    selected.length ? (
                                        <span className={styles.hiddenValue()}>
                                            {selected.map((option) => option.label).join(', ')}
                                        </span>
                                    ) : (
                                        (placeholder ?? translations.common.placeholder)
                                    )
                                ) : renderValue && selected.length ? (
                                    renderValue(selected.map((option) => option.item))
                                ) : (
                                    triggerText
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
                        {/* Not a tab stop: Delete on the field clears, too */}
                        {clearable && selected.length > 0 && !api.disabled && (
                            <button
                                type="button"
                                tabIndex={-1}
                                className={chips ? styles.chipsClear() : styles.clear()}
                                aria-label={t.clear}
                                onClick={() => {
                                    commit([]);
                                    api.focus();
                                }}
                            >
                                <X className={styles.clearIcon()} aria-hidden="true" />
                            </button>
                        )}
                    </ArkSelect.Control>
                )}
            </ArkSelect.Context>
            {(chips || max !== undefined || dataSource) && (
                <span role="status" className={styles.status()}>
                    {announcement || source.announcement}
                </span>
            )}
            <Portal>
                <ArkSelect.Positioner>
                    <ArkSelect.Content
                        className={styles.content()}
                        aria-busy={listLoading || undefined}
                        aria-label={panel ? props['aria-label'] : undefined}
                    >
                        {/* With a search field or "select all" the popup is a dialog: those on top, then the list */}
                        {panel ? (
                            <>
                                <div className={styles.header()}>
                                    {filter && (
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
                                    )}
                                    {selectAll && selectable.length > 0 && (
                                        <button
                                            type="button"
                                            role="checkbox"
                                            aria-checked={allState}
                                            className={styles.selectAll()}
                                            onClick={() => update(toggleAllListOptions(selected, visible, max))}
                                            // The list would take Space/Enter as "choose the highlighted option"
                                            onKeyDown={(event) => {
                                                if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
                                            }}
                                        >
                                            <span
                                                className={styles.check()}
                                                data-state={
                                                    allState === 'mixed'
                                                        ? 'indeterminate'
                                                        : allState
                                                          ? 'checked'
                                                          : 'unchecked'
                                                }
                                                aria-hidden="true"
                                            >
                                                {allState === 'mixed' ? (
                                                    <Minus className={styles.checkIcon()} />
                                                ) : (
                                                    allState && <Check className={styles.checkIcon()} />
                                                )}
                                            </span>
                                            {t.selectAll}
                                        </button>
                                    )}
                                </div>
                                <ArkSelect.List
                                    id={listId}
                                    className={styles.list()}
                                    data-autofocus={filter ? undefined : ''}
                                >
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
        </ArkSelect.Root>
    );
}
