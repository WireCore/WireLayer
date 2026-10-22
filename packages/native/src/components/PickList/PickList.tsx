import {
    filterListOptions,
    listValueKey,
    pickList as pickListRecipe,
    toListOptions,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronDown, ChevronsDown, ChevronsUp, ChevronUp } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { contains, type ListItemState } from '../../utils/options.js';
import { useControllable } from '../../utils/useControllable.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Listbox } from '../Listbox/Listbox.js';
import { ListSearch } from '../OrderList/ListSearch.js';
import type { SelectItem } from '../Select/Select.js';

export interface PickListProps<T = SelectItem, V = ItemValueOf<T>> {
    /** All items: SelectItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled */
    items: readonly T[];
    /** Values of the chosen items, in their order; any type (see `valueKey`) */
    value?: V[];
    defaultValue?: V[];
    onValueChange?: (values: V[]) => void;
    /** Name of the source list (default "Available") */
    sourceLabel?: string;
    /** Name of the target list (default "Selected") */
    targetLabel?: string;
    /** Value of an item: property name or function (default: `value`, otherwise the item itself) */
    itemValue?: ItemAccessor<T, V>;
    /** Label of an item: property name or function (default: `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of an item: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** A search field above each list ("Search Available") */
    filter?: boolean;
    /**
     * The source list is searched elsewhere (server): no local filtering there, listen to onFilterChange and pass the
     * found items; chosen items keep their labels
     */
    manualFilter?: boolean;
    /** Text of the search field of the source list – e.g. to load matching items from a server (manualFilter) */
    onFilterChange?: (text: string) => void;
    /** The source list is loading (aria-busy, "Loading") */
    loading?: boolean;
    /** More items can be loaded into the source list: scrolling to its end (or "Load more") calls onLoadMore */
    hasMore?: boolean;
    /** The end of the source list was reached (hasMore) */
    onLoadMore?: () => void;
    /** "Select all" above each list */
    selectAll?: boolean;
    /** Content of an item in both lists (instead of icon and label) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    className?: string;
}

/**
 * Two lists of checkboxes, one below the other: choose items and move them across with the buttons between the
 * lists ("Add selected", "Add all" …); the move is announced.
 */
export function PickList<T = SelectItem, V = ItemValueOf<T>>({
    items,
    value,
    defaultValue = [],
    onValueChange,
    sourceLabel: sourceProp,
    targetLabel: targetProp,
    itemValue,
    itemLabel,
    itemDisabled,
    valueKey,
    filter = false,
    manualFilter = false,
    onFilterChange,
    loading,
    hasMore,
    onLoadMore,
    selectAll = false,
    renderItem,
    className,
}: PickListProps<T, V>) {
    const translations = useTranslations();
    const t = translations.pickList;
    const styles = pickListRecipe();
    const sourceLabel = sourceProp ?? t.source;
    const targetLabel = targetProp ?? t.target;
    const keyOf = (entry: unknown) => listValueKey(entry, valueKey);
    const options = useMemo(
        () => toListOptions(items, { itemValue, itemLabel, itemDisabled, valueKey }),
        [items, itemValue, itemLabel, itemDisabled, valueKey]
    );
    const [chosen, setChosen] = useControllable<V[]>(value, defaultValue, onValueChange);
    const chosenKeys = new Set(chosen.map(keyOf));
    const byKey = new Map(options.map((option) => [option.key, option]));
    // Options of chosen values – they stay when the items change (search on a server)
    const [remembered, setRemembered] = useState(
        () => new Map(options.filter((option) => chosenKeys.has(option.key)).map((option) => [option.key, option]))
    );
    const source = options.filter((option) => !chosenKeys.has(option.key));
    const target = chosen
        .map((entry) => byKey.get(keyOf(entry)) ?? remembered.get(keyOf(entry)))
        .filter((option) => option !== undefined);
    const [sourceQuery, setSourceQuery] = useState('');
    const [targetQuery, setTargetQuery] = useState('');
    const sourceShown = manualFilter ? source : filterListOptions(source, sourceQuery, contains);
    const targetShown = filterListOptions(target, targetQuery, contains);
    const [sourceSelection, setSourceSelection] = useState<V[]>([]);
    const [targetSelection, setTargetSelection] = useState<V[]>([]);
    const { announce, region } = useAnnouncer();

    const set = (next: V[], moved: number, to: string) => {
        setChosen(next);
        announce(t.moved(moved, to));
    };
    const add = (values: V[]) => {
        const added = values.filter((entry) => !chosenKeys.has(keyOf(entry)));
        if (!added.length) return;
        if (manualFilter)
            setRemembered((old) => {
                const next = new Map(old);
                for (const entry of added) {
                    const option = byKey.get(keyOf(entry));
                    if (option) next.set(option.key, option);
                }
                return next;
            });
        set([...chosen, ...added], added.length, targetLabel);
        setSourceSelection([]);
    };
    const remove = (values: V[]) => {
        if (!values.length) return;
        const removed = new Set(values.map(keyOf));
        set(
            chosen.filter((entry) => !removed.has(keyOf(entry))),
            values.length,
            sourceLabel
        );
        setTargetSelection([]);
    };
    // Disabled items cannot be chosen – "Add all" leaves them where they are
    const enabled = (list: ListOption<T>[]) =>
        list.filter((option) => !option.disabled).map((option) => option.value as V);
    const shared = { itemValue, itemLabel, itemDisabled, valueKey, multiple: true, selectAll, renderItem };

    return (
        <View className={styles.base({ class: className })}>
            <View className={styles.section()}>
                {filter && (
                    <ListSearch
                        value={sourceQuery}
                        onChangeText={(text) => {
                            setSourceQuery(text);
                            onFilterChange?.(text);
                        }}
                        label={t.filter(sourceLabel)}
                    />
                )}
                <Listbox<T, V>
                    {...shared}
                    label={sourceLabel}
                    items={sourceShown.map((option) => option.item)}
                    value={sourceSelection}
                    onValueChange={setSourceSelection}
                    loading={loading}
                    hasMore={hasMore}
                    onLoadMore={onLoadMore}
                    emptyText={sourceQuery ? translations.common.noResults : undefined}
                />
            </View>
            <View className={styles.controls()}>
                <IconButton
                    icon={ChevronDown}
                    label={t.add}
                    variant="outline"
                    hitSlop={2}
                    disabled={!sourceSelection.length}
                    onPress={() => add(sourceSelection)}
                />
                <IconButton
                    icon={ChevronsDown}
                    label={t.addAll}
                    variant="outline"
                    hitSlop={2}
                    disabled={!enabled(source).length}
                    onPress={() => add(enabled(source))}
                />
                <IconButton
                    icon={ChevronUp}
                    label={t.remove}
                    variant="outline"
                    hitSlop={2}
                    disabled={!targetSelection.length}
                    onPress={() => remove(targetSelection)}
                />
                <IconButton
                    icon={ChevronsUp}
                    label={t.removeAll}
                    variant="outline"
                    hitSlop={2}
                    disabled={!target.length}
                    onPress={() => remove(chosen)}
                />
            </View>
            <View className={styles.section()}>
                {filter && (
                    <ListSearch value={targetQuery} onChangeText={setTargetQuery} label={t.filter(targetLabel)} />
                )}
                <Listbox<T, V>
                    {...shared}
                    label={targetLabel}
                    items={targetShown.map((option) => option.item)}
                    value={targetSelection}
                    onValueChange={setTargetSelection}
                    emptyText={targetQuery ? translations.common.noResults : undefined}
                />
            </View>
            {region}
        </View>
    );
}
