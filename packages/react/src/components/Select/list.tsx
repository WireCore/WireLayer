// Shared parts of the option lists (Select, MultiSelect, Combobox, Listbox, VirtualSelect) – internal, not exported
import { useFilter } from '@ark-ui/react/locale';
import {
    filterListOptions,
    groupListOptions,
    indexListOptions,
    listOptionsForValues,
    listValues,
    toListOptions,
    type ListGroup,
    type ListItemAccessors,
    type ListOption,
} from '@wirecore/wirelayer-recipes';
import { Check, LoaderCircle } from 'lucide-react';
import {
    Fragment,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentType,
    type MouseEvent,
    type ReactNode,
} from 'react';
import type { IconComponent } from '../../types.js';

/** State of an option, passed to renderItem */
export interface ListItemState {
    selected: boolean;
    highlighted: boolean;
    disabled: boolean;
}

/** Field sizes, like Button and Input: 32, 40 and 48 px */
export type SelectSize = 'sm' | 'md' | 'lg';

/**
 * Items of an option list, normalised (any item and value type), filtered by `query` and grouped. `ordered` is the
 * order of the DOM (groups together) – Ark's collection must follow it.
 */
export function useListOptions<T>(items: readonly T[], accessors: ListItemAccessors<T>, query = '') {
    // Accent-blind ("nu" finds "Nürnberg"): German search collation would tell u and ü apart
    const { contains } = useFilter({ sensitivity: 'base', usage: 'sort' });
    const { itemValue, itemLabel, itemDisabled, itemGroup, itemKeywords, valueKey } = accessors;
    const options = useMemo(
        () => toListOptions(items, { itemValue, itemLabel, itemDisabled, itemGroup, itemKeywords, valueKey }),
        [items, itemValue, itemLabel, itemDisabled, itemGroup, itemKeywords, valueKey]
    );
    const visible = useMemo(() => filterListOptions(options, query, contains), [options, query, contains]);
    const groups = useMemo(() => groupListOptions(visible), [visible]);
    const ordered = useMemo(() => groups.flatMap((group) => group.options), [groups]);
    /** The first selectable option for another query – to highlight it while typing (before the re-render) */
    const firstFor = (text: string) =>
        groupListOptions(filterListOptions(options, text, contains))
            .flatMap((group) => group.options)
            .find((option) => !option.disabled);
    return { options, visible, groups, ordered, firstFor };
}

/**
 * The chosen options of a list: from `value` (or the own state without it), shown with their labels even when they
 * are not among the current items (server-side search, lazy loading). `commit` takes new options and reports their
 * original values – one value or null (single), an array (multiple).
 */
export function useListSelection<T>({
    multiple,
    value,
    defaultValue,
    accessors,
    items,
    onChange,
}: {
    multiple: boolean;
    value: unknown;
    defaultValue: unknown;
    accessors: ListItemAccessors<T>;
    items: readonly ListOption<T>[];
    onChange?: (value: never) => void;
}) {
    const [internal, setInternal] = useState<unknown>(defaultValue ?? (multiple ? [] : null));
    // Options chosen in this component – their labels stay known when the items change
    const [picked, setPicked] = useState<ListOption<T>[]>([]);
    const current = value !== undefined ? value : internal;
    const selected = listOptionsForValues(
        multiple ? ((current as unknown[] | null) ?? []) : listValues(current, items),
        indexListOptions(items, picked),
        accessors
    );
    const keys = selected.map((option) => option.key);

    function commit(next: ListOption<T>[]) {
        setPicked(next);
        const values = next.map((option) => option.value);
        const result = multiple ? values : (values[0] ?? null);
        setInternal(result);
        onChange?.(result as never);
    }
    /** Ark reports keys (and the matching collection items) */
    function commitKeys(nextKeys: string[], arkItems: ListOption<T>[] = []) {
        const index = indexListOptions(items, arkItems, selected);
        commit(nextKeys.map((key) => index.get(key)).filter((option) => option !== undefined));
    }
    return { selected, keys, commit, commitKeys };
}

/** Invisible end of an option list: scrolled into view (hasMore, not loading), it asks for the next page */
export function LoadMore({
    active,
    count,
    onLoad,
    className,
}: {
    active: boolean;
    count: number;
    onLoad: () => void;
    className: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const load = useRef(onLoad);
    useEffect(() => {
        load.current = onLoad;
    });
    // Observes again after each page (count), so a short page that leaves the end visible loads the next one
    useEffect(() => {
        const element = ref.current;
        if (!active || !element || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) load.current();
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [active, count]);
    return <div ref={ref} className={className} aria-hidden="true" />;
}

// Ark's parts differ in their prop types per component; only their shared names are used here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

/** Ark parts of the list component: Select, Combobox or Listbox (same names in each) */
export interface ListParts {
    Item: AnyComponent;
    ItemText: AnyComponent;
    ItemIndicator: AnyComponent;
    ItemContext: AnyComponent;
    ItemGroup: AnyComponent;
    ItemGroupLabel: AnyComponent;
}

/** Classes of the parts of one option list */
export interface ListClasses {
    item: string;
    itemText: string;
    icon: string;
    itemIndicator: string;
    itemBody: string;
    itemDescription: string;
    group: string;
    groupLabel: string;
    loading: string;
    loadingIcon: string;
    sentinel: string;
    empty?: string;
    check?: string;
    checkIcon?: string;
}

interface ListOptionsProps<T> {
    parts: ListParts;
    groups: readonly ListGroup<T>[];
    classes: ListClasses;
    /** Check box before the label instead of the check mark after it (MultiSelect) */
    checkbox?: boolean;
    /** No check mark (Autocomplete: suggestions are not selected) */
    noIndicator?: boolean;
    /** The options can be dragged (PickList, OrderList) */
    draggable?: boolean;
    loading?: boolean;
    loadingText: string;
    hasMore?: boolean;
    onLoadMore?: () => void;
    /** Shown (as a disabled option, so the listbox is never empty) when there is no option */
    emptyText?: string;
    renderItem?: (item: T, state: ListItemState) => ReactNode;
}

function ListOptionItem<T>({
    parts,
    option,
    classes,
    checkbox,
    renderItem,
    noIndicator,
    draggable,
}: Pick<ListOptionsProps<T>, 'parts' | 'classes' | 'checkbox' | 'noIndicator' | 'renderItem' | 'draggable'> & {
    option: ListOption<T>;
}) {
    const { Item, ItemText, ItemIndicator, ItemContext } = parts;
    const Icon = option.icon as IconComponent | undefined;
    return (
        <Item
            item={option}
            className={classes.item}
            data-description={option.description ? '' : undefined}
            draggable={draggable && !option.disabled ? 'true' : undefined}
        >
            {checkbox && (
                <ItemContext>
                    {(state: ListItemState) => (
                        <span
                            className={classes.check}
                            data-state={state.selected ? 'checked' : 'unchecked'}
                            aria-hidden="true"
                        >
                            {state.selected && <Check className={classes.checkIcon} />}
                        </span>
                    )}
                </ItemContext>
            )}
            {renderItem ? (
                <ItemContext>
                    {(state: ListItemState) =>
                        renderItem(option.item, {
                            selected: state.selected,
                            highlighted: state.highlighted,
                            disabled: state.disabled,
                        })
                    }
                </ItemContext>
            ) : (
                <>
                    {Icon && <Icon className={classes.icon} aria-hidden="true" />}
                    {option.description ? (
                        <span className={classes.itemBody}>
                            <ItemText className={classes.itemText}>{option.label}</ItemText>
                            <span className={classes.itemDescription}>{option.description}</span>
                        </span>
                    ) : (
                        <ItemText className={classes.itemText}>{option.label}</ItemText>
                    )}
                </>
            )}
            {!checkbox && !noIndicator && (
                <ItemIndicator>
                    <Check className={classes.itemIndicator} aria-hidden="true" />
                </ItemIndicator>
            )}
        </Item>
    );
}

/**
 * The options under group headings (role="group", named by the heading), then the loading row and the end marker
 * that loads the next page
 */
export function ListOptions<T>({
    parts,
    groups,
    classes,
    checkbox,
    noIndicator,
    draggable,
    loading,
    loadingText,
    hasMore,
    onLoadMore,
    emptyText,
    renderItem,
}: ListOptionsProps<T>) {
    const { ItemGroup, ItemGroupLabel } = parts;
    const item = (option: ListOption<T>) => (
        <ListOptionItem
            key={option.key}
            parts={parts}
            option={option}
            classes={classes}
            checkbox={checkbox}
            noIndicator={noIndicator}
            draggable={draggable}
            renderItem={renderItem}
        />
    );
    return (
        <>
            {groups.map((group, index) =>
                group.label !== undefined ? (
                    <ItemGroup key={group.label} className={classes.group}>
                        <ItemGroupLabel className={classes.groupLabel}>{group.label}</ItemGroupLabel>
                        {group.options.map(item)}
                    </ItemGroup>
                ) : (
                    <Fragment key={`#${index}`}>{group.options.map(item)}</Fragment>
                )
            )}
            {emptyText !== undefined && !loading && !groups.length && (
                <div role="option" aria-disabled="true" className={classes.empty}>
                    {emptyText}
                </div>
            )}
            {loading && (
                <div className={classes.loading}>
                    <LoaderCircle className={classes.loadingIcon} aria-hidden="true" />
                    {loadingText}
                </div>
            )}
            {hasMore && (
                <LoadMore
                    className={classes.sentinel}
                    active={!loading}
                    count={groups.reduce((sum, group) => sum + group.options.length, 0)}
                    onLoad={() => onLoadMore?.()}
                />
            )}
        </>
    );
}

/**
 * Ark's options prevent the default of mousedown (keeps the focus in the list) – that would stop the browser from
 * starting a drag; the press goes to the list instead, which takes the focus itself
 */
export function letDrag(event: MouseEvent) {
    if ((event.target as HTMLElement).closest('[draggable="true"]')) event.stopPropagation();
}
