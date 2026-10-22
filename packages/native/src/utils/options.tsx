import {
    checkbox,
    filterListOptions,
    groupListOptions,
    indexListOptions,
    input,
    listOptionsForValues,
    select,
    toListOptions,
    type DataSource,
    type ItemAccessor,
    type ListItemAccessors,
    type ListOption,
} from '@wirecore/wirelayer-recipes/native';
import { Check, Search } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { FlatList, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useLocale } from '../locale.js';
import { useOptionSource } from './data-source.js';
import { Icon, type IconComponent } from './Icon.js';
import { toggleOnSpace } from './keyboard.js';
import { Loader } from './Loader.js';
import { Sheet } from './Sheet.js';

/** What `renderItem` gets besides the item */
export interface ListItemState {
    selected: boolean;
    disabled: boolean;
}

/** Items, server data and rendering shared by Select, MultiSelect, Combobox, Listbox and Autocomplete */
export interface OptionListProps<T, V> {
    /** Options: SelectItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled/itemGroup */
    items: readonly T[];
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
    /** The items are filtered elsewhere (server): no local filtering, listen to onFilterChange */
    manualFilter?: boolean;
    /** Text of the search field – e.g. to load matching items from a server (manualFilter) */
    onFilterChange?: (text: string) => void;
    /** Shown when no item is left (default "No results" / "No entries") */
    emptyText?: string;
    /** Shows a spinner in the field and "Loading" in the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row in the list */
    loadingText?: string;
    /** More items can be loaded: the end of the list (or "Load more") calls onLoadMore */
    hasMore?: boolean;
    /** The end of the list was reached (FlatList onEndReached) or "Load more" pressed */
    onLoadMore?: () => void;
    /** Loads the options when the list opens (pages at the end of the list, the search asks it after a typing pause); `getItemsByKeys` gives the labels of chosen values that are not loaded */
    dataSource?: DataSource<T>;
    /** Fewest characters the search needs before the data source is asked */
    minSearchLength?: number;
    /** Options per request of the data source (default 50) */
    pageSize?: number;
    /** Content of an option (instead of icon and label) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
}

/** Accent- and case-blind: "nu" finds "Nürnberg" */
export const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
export const contains = (text: string, query: string) => fold(text).includes(fold(query));

/**
 * Options of a list: from `items` or the data source, filtered by the search, grouped; chosen values keep their
 * labels when they leave the items (server search, paging).
 */
export function useOptionList<T, V>(props: OptionListProps<T, V>, values: readonly unknown[]) {
    const { items, itemValue, itemLabel, itemDisabled, itemGroup, valueKey, manualFilter, onFilterChange } = props;
    const accessors = useMemo(
        () => ({ itemValue, itemLabel, itemDisabled, itemGroup, valueKey }) as ListItemAccessors<T>,
        [itemValue, itemLabel, itemDisabled, itemGroup, valueKey]
    );
    const [query, setQueryText] = useState('');
    const source = useOptionSource<T>({
        items,
        source: props.dataSource,
        accessors,
        pageSize: props.pageSize,
        minSearchLength: props.minSearchLength,
    });
    const options = useMemo(() => toListOptions(source.items, accessors), [source.items, accessors]);
    const [remembered, setRemembered] = useState<ListOption<T>[]>([]);
    const index = useMemo(
        () => indexListOptions(options, source.resolvedOptions, remembered),
        [options, source.resolvedOptions, remembered]
    );
    const selected = listOptionsForValues(values, index, accessors);
    const visible = manualFilter || source.active ? options : filterListOptions(options, query, contains);
    const selectedKeys = selected.map((option) => option.key).join('\u0000');
    const { active, resolve } = source;
    useEffect(() => {
        if (active && selectedKeys) resolve(selectedKeys.split('\u0000'), [...options, ...remembered]);
        // Only when the chosen keys change – resolve asks once per key anyway
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, selectedKeys]);

    return {
        query,
        setQuery(text: string) {
            setQueryText(text);
            onFilterChange?.(text);
            if (active) source.search(text);
        },
        options,
        visible,
        groups: groupListOptions(visible),
        selected,
        /** Keeps the labels of options that get chosen */
        remember(chosen: readonly ListOption<T>[]) {
            setRemembered((previous) => {
                const keys = new Set(chosen.map((option) => option.key));
                return [...chosen, ...previous.filter((option) => !keys.has(option.key))].slice(0, 500);
            });
        },
        open: source.open,
        loading: !!props.loading || source.loading || source.loadingMore,
        hasMore: !!props.hasMore || source.hasMore,
        loadMore() {
            if (active) source.loadMore();
            else props.onLoadMore?.();
        },
        emptyText: source.emptyText,
        announcement: source.announcement,
    };
}

export type OptionList<T> = ReturnType<typeof useOptionList<T, unknown>>;

type Row<T> = { type: 'group'; key: string; label: string } | { type: 'option'; key: string; option: ListOption<T> };

export interface OptionSheetProps<T> {
    open: boolean;
    onClose: () => void;
    title: string;
    closeLabel?: string;
    list: OptionList<T>;
    /** Checkboxes (several values) instead of radio buttons */
    multiple?: boolean;
    /** With multiple: check boxes before the options (default) – false shows a check mark after the label */
    checkboxes?: boolean;
    /** Search field at the top */
    filter?: boolean;
    isSelected: (option: ListOption<T>) => boolean;
    /** Options that cannot be chosen right now (max reached) */
    isBlocked?: (option: ListOption<T>) => boolean;
    onSelect: (option: ListOption<T>) => void;
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    loadingText?: string;
    emptyText?: string;
    /** Rows above the options, e.g. "Select all" */
    header?: ReactNode;
    /** Line below the title, e.g. the limit */
    hint?: string;
}

/**
 * The options in a bottom sheet: an optional search field, group headings, radio buttons or checkboxes. The list is
 * a FlatList – its end loads more (hasMore), "Load more" does the same for screen reader and keyboard users.
 */
export function OptionSheet<T>({
    open,
    onClose,
    title,
    closeLabel,
    list,
    multiple = false,
    checkboxes = true,
    filter = false,
    isSelected,
    isBlocked,
    onSelect,
    renderItem,
    loadingText,
    emptyText,
    header,
    hint,
}: OptionSheetProps<T>) {
    const { translations } = useLocale();
    const styles = select();
    const field = input({ hasIcon: true, class: styles.search() });
    const muted = useResolveClassNames('text-muted');
    const rows: Row<T>[] = list.groups.flatMap((group, groupIndex) => [
        ...(group.label
            ? [{ type: 'group' as const, key: `group-${groupIndex}-${group.label}`, label: group.label }]
            : []),
        ...group.options.map((option) => ({ type: 'option' as const, key: option.key, option })),
    ]);
    // The chosen option (or the first) gets the focus when the sheet opens on the web
    const focusTarget = useRef<ComponentRef<typeof Pressable>>(null);
    // Several values: the first option (like before), one value: the chosen one
    const chosenIndex = multiple ? -1 : rows.findIndex((row) => row.type === 'option' && isSelected(row.option));
    const focusIndex =
        chosenIndex >= 0
            ? chosenIndex
            : Math.max(
                  0,
                  rows.findIndex((row) => row.type === 'option')
              );
    const loadMore = () => {
        if (list.hasMore && !list.loading) list.loadMore();
    };

    const footer = (
        <>
            {list.loading ? (
                <View className={styles.status()} role="status" aria-live="polite">
                    <Loader className={styles.spinner()} />
                    <Text className={styles.statusText()}>{loadingText ?? translations.common.loading}</Text>
                </View>
            ) : (
                list.hasMore && (
                    <Pressable role="button" className={styles.option()} onPress={loadMore}>
                        <Text className={styles.optionText()}>{translations.dataSource.loadMore}</Text>
                    </Pressable>
                )
            )}
            {!list.loading && !list.visible.length && (
                <Text role="status" className={styles.statusText({ class: styles.status() })}>
                    {list.emptyText ??
                        emptyText ??
                        (list.query ? translations.common.noResults : translations.common.empty)}
                </Text>
            )}
        </>
    );

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={title}
            closeLabel={closeLabel ?? translations.common.close}
            scroll={false}
            description={hint}
            onShow={() => {
                list.open();
                if (Platform.OS === 'web' && !filter) focusTarget.current?.focus();
            }}
            before={
                <>
                    {filter && (
                        <View className={field.base()}>
                            <Icon icon={Search} className={field.icon()} />
                            <TextInput
                                autoFocus
                                value={list.query}
                                onChangeText={list.setQuery}
                                aria-label={translations.combobox.search}
                                placeholder={translations.combobox.search}
                                placeholderTextColor={typeof muted.color === 'string' ? muted.color : undefined}
                                autoCorrect={false}
                                autoCapitalize="none"
                                className={field.control()}
                            />
                        </View>
                    )}
                    {header}
                </>
            }
        >
            <FlatList
                data={rows}
                keyExtractor={(row) => row.key}
                role={list.visible.length ? (multiple ? 'group' : 'radiogroup') : undefined}
                aria-label={title}
                aria-busy={list.loading || undefined}
                contentContainerClassName={styles.list()}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={Math.max(20, focusIndex + 5)}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={footer}
                renderItem={({ item: row, index }) => {
                    if (row.type === 'group')
                        return (
                            <Text role="heading" className={styles.groupLabel()}>
                                {row.label}
                            </Text>
                        );
                    const { option } = row;
                    const checked = isSelected(option);
                    const disabled = option.disabled || (!checked && !!isBlocked?.(option));
                    const choose = () => onSelect(option);
                    const box = checkbox({ checked });
                    const showBox = multiple && checkboxes;
                    return (
                        <Pressable
                            ref={index === focusIndex ? focusTarget : undefined}
                            role={multiple ? 'checkbox' : 'radio'}
                            aria-checked={checked}
                            disabled={disabled}
                            aria-disabled={disabled || undefined}
                            className={select({ selected: checked }).option()}
                            onPress={choose}
                            {...(disabled ? {} : toggleOnSpace(choose))}
                        >
                            {showBox && (
                                <View className={box.control({ class: styles.optionBox() })}>
                                    {checked && <Icon icon={Check} className={box.icon()} />}
                                </View>
                            )}
                            {renderItem ? (
                                renderItem(option.item, { selected: checked, disabled })
                            ) : (
                                <>
                                    {!!option.icon && (
                                        <Icon icon={option.icon as IconComponent} className={styles.icon()} />
                                    )}
                                    <Text className={styles.optionText()}>{option.label}</Text>
                                </>
                            )}
                            {!showBox && checked && <Icon icon={Check} className={styles.optionCheck()} />}
                        </Pressable>
                    );
                }}
            />
        </Sheet>
    );
}
