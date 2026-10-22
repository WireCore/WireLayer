import {
    FLIP_KEY_ATTRIBUTE,
    flipRelease,
    flipSync,
    focusHandle,
    SORTABLE_HANDLE,
    sortable as sortableRecipe,
    sortableController,
    type ItemAccessor,
    type RecipeClasses,
    type SortableMove,
    type SortableOrientation,
} from '@wirecore/wirelayer-recipes';
import { GripVertical } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type CSSProperties,
    type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SortableProps<T = unknown> {
    /** The items in their order (controlled) */
    value?: T[];
    defaultValue?: T[];
    onValueChange?: (items: T[]) => void;
    /** An item was dropped at another place (also in another list of the group) */
    onMove?: (move: SortableMove<T>) => void;
    /** Key of an item: property name or function (default `id`, else `value`, else the item) */
    itemKey?: ItemAccessor<T, string | number>;
    /** Text of an item for its handle and the announcements (default `label`, `name` or `title`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Name of the list (visible label, also announced when an item moves in) */
    label?: string;
    /** Lists of the same group exchange items (e.g. Kanban columns) */
    group?: string;
    /** Id of this list in `onMove` (default: generated) */
    name?: string;
    /** vertical (default), horizontal or grid (with `columns`) */
    orientation?: SortableOrientation;
    /** Columns of the grid */
    columns?: number;
    /** Whether an item from another list of the group may come in */
    accepts?: (item: T, from: string) => boolean;
    /** Items glide to their new place when they move (default: yes; not with reduced motion) */
    animate?: boolean;
    disabled?: boolean;
    /** Text of an empty list (it stays a drop target) */
    emptyText?: string;
    /** Content of an item (default: its text) */
    renderItem?: (item: T, state: { index: number; grabbed: boolean }) => ReactNode;
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sortableRecipe>;
}

const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

function read<T, R>(item: T, accessor: ItemAccessor<T, R> | undefined, names: string[]): R | undefined {
    if (typeof accessor === 'function') return accessor(item);
    if (typeof item !== 'object' || item === null) return undefined;
    const record = item as Record<string, unknown>;
    for (const key of accessor ? [accessor] : names) if (record[key] !== undefined) return record[key] as R;
    return undefined;
}

/**
 * Sortable list: every item has a handle – drag it, or press Space/Enter, move with the arrow keys and drop with
 * Space (Escape cancels), or click it and click the target (WCAG 2.5.7). Every step is announced.
 */
export function Sortable<T = unknown>({
    classes,
    value,
    defaultValue = [],
    onValueChange,
    onMove,
    itemKey,
    itemLabel,
    label,
    group,
    name,
    orientation = 'vertical',
    columns = 3,
    accepts,
    animate = true,
    disabled,
    emptyText,
    renderItem,
    'aria-label': ariaLabel,
    className,
    style,
}: SortableProps<T>) {
    const sortableStyles = useRecipe('sortable', sortableRecipe, classes);
    const styles = sortableStyles({ orientation });
    const t = useTranslations().sortable;
    const baseId = useId();
    const id = name ?? baseId;
    const labelId = `${baseId}label`;
    const instructionsId = `${baseId}instructions`;
    const list = useRef<HTMLUListElement>(null);
    const [internal, setInternal] = useState<T[]>(defaultValue);
    const items = value ?? internal;
    const labelOf = (item: T) => String(read(item, itemLabel, ['label', 'name', 'title']) ?? item);
    const keyOf = (item: T, index: number) =>
        read(item, itemKey, ['id', 'value']) ?? (typeof item === 'object' ? index : String(item));

    // The latest props for the controller (it calls back later); the order set last until it comes back
    const latest = useRef({ items, group, label, orientation, columns, disabled, accepts, onValueChange, onMove, t });
    const pending = useRef<T[] | null>(null);
    useEffect(() => {
        latest.current = { items, group, label, orientation, columns, disabled, accepts, onValueChange, onMove, t };
        pending.current = null;
    });
    // After every render: items that changed place (also from another list of the group) glide there
    useBrowserLayoutEffect(() => {
        if (animate) flipSync(list.current, group ?? id);
    });
    useEffect(() => {
        const element = list.current;
        return () => flipRelease(element);
    }, []);
    const labelRef = useRef(labelOf);
    useEffect(() => {
        labelRef.current = labelOf;
    });
    useEffect(
        () =>
            sortableController.register({
                id,
                group: () => latest.current.group,
                element: () => list.current,
                items: () => pending.current ?? latest.current.items,
                // Rendered at once, so the moved item can take the focus before the next key arrives
                setItems: (next) => {
                    pending.current = next as T[];
                    flushSync(() => {
                        setInternal(next as T[]);
                        latest.current.onValueChange?.(next as T[]);
                    });
                },
                onMove: (move) => latest.current.onMove?.(move as SortableMove<T>),
                itemLabel: (item) => labelRef.current(item as T),
                label: () => latest.current.label ?? '',
                orientation: () => latest.current.orientation,
                columns: () => latest.current.columns,
                disabled: () => !!latest.current.disabled,
                accepts: (item, from) => latest.current.accepts?.(item as T, from) ?? true,
                texts: () => latest.current.t,
                focus: (index) => focusHandle({ id, element: () => list.current }, index),
            }),
        [id]
    );
    // The handle passes React's events on: their currentTarget is the handle (pointer capture), stopPropagation
    // reaches React parents
    const subscribe = useCallback((notify: () => void) => sortableController.subscribe(notify), []);
    const state = useSyncExternalStore(
        subscribe,
        () => sortableController.state(id),
        () => sortableController.state(id)
    );

    return (
        <div className={styles.base({ class: className })} style={style}>
            {label && (
                <span id={labelId} className={styles.label()}>
                    {label}
                </span>
            )}
            <ul
                ref={list}
                className={styles.list()}
                role="list"
                aria-labelledby={label ? labelId : undefined}
                aria-label={label ? undefined : ariaLabel}
                data-sortable-container={id}
                data-active={(state.active && state.grabbed === null) || undefined}
                style={orientation === 'grid' ? ({ '--wc-columns': String(columns) } as CSSProperties) : undefined}
                onClick={(event) => sortableController.containerClick(id, event as unknown as MouseEvent)}
            >
                {items.map((item, index) => (
                    <li
                        key={keyOf(item, index)}
                        className={styles.item()}
                        data-sortable-index={index}
                        {...(animate ? { [FLIP_KEY_ATTRIBUTE]: String(keyOf(item, index)) } : {})}
                        data-grabbed={state.grabbed === index || undefined}
                        data-dragging={(state.dragging && state.grabbed === index) || undefined}
                    >
                        <button
                            type="button"
                            className={styles.handle()}
                            {...{ [SORTABLE_HANDLE]: id }}
                            aria-label={t.handle(labelOf(item))}
                            aria-pressed={state.grabbed === index}
                            aria-describedby={instructionsId}
                            disabled={disabled}
                            onKeyDown={(event) =>
                                sortableController.keydown(id, index, event as unknown as KeyboardEvent)
                            }
                            onPointerDown={(event) =>
                                sortableController.pointerdown(id, index, event as unknown as PointerEvent)
                            }
                            onPointerMove={(event) => sortableController.pointermove(event as unknown as PointerEvent)}
                            onPointerUp={(event) => sortableController.pointerup(event as unknown as PointerEvent)}
                            onPointerCancel={() => sortableController.pointercancel()}
                        >
                            <GripVertical className={styles.handleIcon()} aria-hidden="true" />
                        </button>
                        <div className={styles.content()}>
                            {renderItem ? renderItem(item, { index, grabbed: state.grabbed === index }) : labelOf(item)}
                        </div>
                    </li>
                ))}
                {!items.length && <li className={styles.empty()}>{emptyText ?? t.empty}</li>}
            </ul>
            <span id={instructionsId} className={styles.instructions()}>
                {t.instructions}
            </span>
        </div>
    );
}
