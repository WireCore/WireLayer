import {
    listValueKey,
    pickList as pickListRecipe,
    toListOptions,
    type ItemAccessor,
    type ItemValueOf,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useMemo, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { Listbox, type ListboxItem } from '../Listbox/Listbox.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { letDrag, type ListItemState } from '../Select/list.js';

export interface PickListProps<T = ListboxItem, V = ItemValueOf<T>> {
    /** All items: ListboxItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled */
    items: readonly T[];
    /** Values of the chosen items, in their order; any type (see `valueKey`) */
    value?: V[];
    defaultValue?: V[];
    onValueChange?: (values: V[]) => void;
    sourceLabel?: string;
    targetLabel?: string;
    /** Value of an item: property name or function (default: `value`, otherwise the item itself) */
    itemValue?: ItemAccessor<T, V>;
    /** Label of an item: property name or function (default: `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of an item: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** A search field above each list */
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
    /** More items can be loaded into the source list: scrolling to its end calls onLoadMore */
    hasMore?: boolean;
    /** The end of the source list was scrolled into view (hasMore) */
    onLoadMore?: () => void;
    /** Check boxes and "Select all" in each list */
    selectAll?: boolean;
    /** Items can be dragged from one list to the other (the buttons stay the keyboard way) */
    draggable?: boolean;
    /** Content of an item in both lists (instead of icon and label) */
    renderItem?: (item: T, state: ListItemState) => ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof pickListRecipe>;
}

type Side = 'source' | 'target';

/** Two lists with several choices each; the buttons move the chosen items across, the move is announced */
export function PickList<T = ListboxItem, V = ItemValueOf<T>>({
    classes,
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
    manualFilter,
    onFilterChange,
    loading,
    hasMore,
    onLoadMore,
    selectAll = false,
    draggable = false,
    renderItem,
    className,
    style,
}: PickListProps<T, V>) {
    const pickList = useRecipe('pickList', pickListRecipe, classes);
    const styles = pickList();
    const translations = useTranslations();
    const t = translations.pickList;
    const sourceLabel = sourceProp ?? t.source;
    const targetLabel = targetProp ?? t.target;
    const keyOf = (entry: unknown) => listValueKey(entry, valueKey);
    const options = useMemo(
        () => toListOptions(items, { itemValue, itemLabel, itemDisabled, valueKey }),
        [items, itemValue, itemLabel, itemDisabled, valueKey]
    );
    const [internal, setInternal] = useState(defaultValue);
    const chosen = value ?? internal;
    const chosenKeys = new Set(chosen.map(keyOf));
    const byKey = new Map(options.map((option) => [option.key, option]));
    // Options of chosen values – they stay when the items change (search on a server)
    const [remembered, setRemembered] = useState(
        () =>
            new Map(
                chosen.flatMap((entry) => (byKey.has(keyOf(entry)) ? [[keyOf(entry), byKey.get(keyOf(entry))!]] : []))
            )
    );
    const source = options.filter((option) => !chosenKeys.has(option.key));
    const target = chosen
        .map((entry) => byKey.get(keyOf(entry)) ?? remembered.get(keyOf(entry)))
        .filter((option) => option !== undefined);
    const [sourceSelection, setSourceSelection] = useState<V[]>([]);
    const [targetSelection, setTargetSelection] = useState<V[]>([]);
    const [status, setStatus] = useState('');

    const set = (next: V[], moved: number, to: string) => {
        setInternal(next);
        onValueChange?.(next);
        setStatus(t.moved(moved, to));
    };
    const add = (values: V[]) => {
        if (!values.length) return;
        if (manualFilter)
            setRemembered((old) => {
                const next = new Map(old);
                for (const entry of values) {
                    const option = byKey.get(keyOf(entry));
                    if (option) next.set(option.key, option);
                }
                return next;
            });
        set([...chosen, ...values.filter((entry) => !chosenKeys.has(keyOf(entry)))], values.length, targetLabel);
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

    // Dragging: the dragged item – with the other chosen ones of its list, if it is one of them
    const [drag, setDrag] = useState<{ from: Side; values: V[] } | null>(null);
    const [dropOn, setDropOn] = useState<Side | null>(null);
    const dropZone = (side: Side) => ({
        className: styles.dropZone(),
        'data-drop': dropOn === side || undefined,
        onDragStart: (event: DragEvent<HTMLDivElement>) => {
            const key = (event.target as HTMLElement).closest<HTMLElement>('[data-part="item"]')?.dataset.value;
            const option = key === undefined ? undefined : byKey.get(key);
            if (!option) return;
            const selection = side === 'source' ? sourceSelection : targetSelection;
            const keys = new Set(selection.map(keyOf));
            setDrag({ from: side, values: keys.has(option.key) ? selection : [option.value as V] });
            event.dataTransfer.setData('text/plain', option.label);
            event.dataTransfer.effectAllowed = 'move';
        },
        onDragOver: (event: DragEvent<HTMLDivElement>) => {
            if (!drag || drag.from === side) return;
            event.preventDefault();
            setDropOn(side);
        },
        onMouseDownCapture: letDrag,
        onDragLeave: () => setDropOn(null),
        onDrop: (event: DragEvent<HTMLDivElement>) => {
            if (!drag || drag.from === side) return;
            event.preventDefault();
            if (side === 'target') add(drag.values);
            else remove(drag.values);
            setDrag(null);
            setDropOn(null);
        },
        onDragEnd: () => {
            setDrag(null);
            setDropOn(null);
        },
    });
    const listProps = {
        itemValue,
        itemLabel,
        itemDisabled,
        valueKey,
        multiple: true,
        filter,
        checkboxes: selectAll,
        selectAll,
        draggableItems: draggable,
        renderItem,
    };
    const sourceList = (
        <Listbox
            {...listProps}
            manualFilter={manualFilter}
            onFilterChange={onFilterChange}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            items={source.map((option) => option.item)}
            label={sourceLabel}
            value={sourceSelection}
            onValueChange={setSourceSelection}
        />
    );
    const targetList = (
        <Listbox
            {...listProps}
            items={target.map((option) => option.item)}
            label={targetLabel}
            value={targetSelection}
            onValueChange={setTargetSelection}
        />
    );

    return (
        <div className={styles.base({ class: className })} style={style}>
            {draggable ? <div {...dropZone('source')}>{sourceList}</div> : sourceList}
            <div className={styles.controls()}>
                <IconButton
                    icon={ChevronRight}
                    label={t.add}
                    size="sm"
                    disabled={!sourceSelection.length}
                    onClick={() => add(sourceSelection)}
                />
                <IconButton
                    icon={ChevronsRight}
                    label={t.addAll}
                    size="sm"
                    disabled={!source.length}
                    onClick={() => add(source.map((option) => option.value as V))}
                />
                <IconButton
                    icon={ChevronLeft}
                    label={t.remove}
                    size="sm"
                    disabled={!targetSelection.length}
                    onClick={() => remove(targetSelection)}
                />
                <IconButton
                    icon={ChevronsLeft}
                    label={t.removeAll}
                    size="sm"
                    disabled={!target.length}
                    onClick={() => remove(chosen)}
                />
            </div>
            {draggable ? <div {...dropZone('target')}>{targetList}</div> : targetList}
            <p role="status" className={styles.status()}>
                {status}
            </p>
        </div>
    );
}
