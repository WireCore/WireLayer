import {
    moveItem,
    orderSteps,
    orderStepTarget,
    sortable as sortableRecipe,
    sortableDropIndex,
    sortableShift,
    sortableTargetForKey,
    visuallyHidden,
    type ItemAccessor,
    type OrderSlot,
    type OrderStep,
    type SortableMove,
} from '@wirecore/wirelayer-recipes/native';
import { GripVertical } from 'lucide-react-native';
import { useEffect, useId, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
    Animated,
    I18nManager,
    Platform,
    Pressable,
    Text,
    View,
    type AccessibilityActionEvent,
    type AccessibilityActionInfo,
    type GestureResponderEvent,
} from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { focusElement } from '../../utils/focus-registry.js';
import { Icon } from '../../utils/Icon.js';
import { pressedProps } from '../../utils/keyboard.js';
import { nativeDriver } from '../../utils/motion.js';
import { useControllable } from '../../utils/useControllable.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';
import {
    cancelCarriedItem,
    carriedItem,
    dropCarriedItem,
    moveCarriedItem,
    moveSortableItem,
    pickUpSortableItem,
    registerSortable,
    sortableNeighbour,
    sortableTargets,
    useSortableStore,
} from './store.js';

export interface SortableProps<T = unknown> {
    /** The items in their order (controlled) */
    value?: T[];
    defaultValue?: T[];
    onValueChange?: (items: T[]) => void;
    /** An item was put at another place (also in another list of the group) */
    onMove?: (move: SortableMove<T>) => void;
    /** Key of an item: property name or function (default `id`, else `value`, else the item) */
    itemKey?: ItemAccessor<T, string | number>;
    /** Text of an item for its handle and the announcements (default `label`, `name` or `title`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Name of the list (visible label, also announced when an item moves in) */
    label?: string;
    /** Lists of the same group exchange items: screen reader actions "Move to “…”", tap and tap, arrows */
    group?: string;
    /** Id of this list in `onMove` (default: generated) */
    name?: string;
    /** vertical (default) or horizontal (a row) */
    orientation?: 'vertical' | 'horizontal';
    /** Whether an item from another list of the group (its `name`) may come in */
    accepts?: (item: T, from: string) => boolean;
    disabled?: boolean;
    /** Text of an empty list (it still takes items of the group) */
    emptyText?: string;
    /** Content of an item (default: its text) */
    renderItem?: (item: T, state: { index: number; grabbed: boolean }) => ReactNode;
    /** Accessible name of the list without a visible label */
    'aria-label'?: string;
    className?: string;
}

/** Internal: what the Kanban board adds to the list of a column */
export interface SortableListProps<T> extends SortableProps<T> {
    /** A tap on the handle (screen reader: double tap, web: Enter/Space) calls this instead of picking the item up */
    onHandlePress?: (item: T, index: number) => void;
    /** More screen reader actions of an item */
    actions?: (item: T, index: number) => AccessibilityActionInfo[];
    /** One of the extra actions was chosen */
    onAction?: (name: string, item: T, index: number) => void;
}

/** A finger resting this long on the handle lifts the item; moving it lifts it at once */
const LONG_PRESS = 300;
const DRAG_THRESHOLD = 8;
const isStep = (name: string): name is OrderStep => ['top', 'up', 'down', 'bottom'].includes(name);

function read<T, R>(item: T, accessor: ItemAccessor<T, R> | undefined, names: string[]): R | undefined {
    if (typeof accessor === 'function') return accessor(item);
    if (typeof item !== 'object' || item === null) return undefined;
    const record = item as Record<string, unknown>;
    for (const key of accessor ? [accessor] : names) if (record[key] !== undefined) return record[key] as R;
    return undefined;
}

/**
 * Sortable list: every item has a handle. Drag it after a long press (or right away by moving it), tap it and then
 * the target (WCAG 2.5.7), or use the screen reader actions "Move up" … and "Move to “…”" (lists of a
 * group); on the web Space picks up, the arrow keys move, Space drops and Escape cancels. Every step is announced.
 */
export function Sortable<T = unknown>(props: SortableProps<T>) {
    return <SortableList<T> {...props} />;
}

/** The Sortable with the extras of the Kanban board (internal) */
export function SortableList<T = unknown>({
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
    accepts,
    disabled = false,
    emptyText,
    renderItem,
    'aria-label': ariaLabel,
    className,
    onHandlePress,
    actions,
    onAction,
}: SortableListProps<T>) {
    const translations = useTranslations();
    const t = translations.sortable;
    const baseId = useId();
    const id = name ?? baseId;
    const listName = label ?? ariaLabel ?? '';
    const vertical = orientation === 'vertical';
    const [items, setItems] = useControllable<T[]>(value, defaultValue, onValueChange);
    const { announce, region } = useAnnouncer();
    const reducedMotion = useReducedMotion();
    const store = useSortableStore();
    const labelOf = (item: T) => String(read(item, itemLabel, ['label', 'name', 'title']) ?? item);
    const keyOf = (item: T, index: number) =>
        read(item, itemKey, ['id', 'value']) ?? (typeof item === 'object' ? index : String(item));

    // The latest props for the other lists of the group (they call back later); the order set last until it is
    // rendered, so quick successive moves build on each other
    const latest = useRef({ items, setItems, labelOf, accepts, disabled, onMove, t, announce });
    const pending = useRef<T[] | null>(null);
    useEffect(() => {
        latest.current = { items, setItems, labelOf, accepts, disabled, onMove, t, announce };
        pending.current = null;
    });
    // The handle of a moved item gets the focus back (keyboard on the web, screen reader focus on iOS/Android)
    const handles = useRef<(ComponentRef<typeof View> | null)[]>([]);
    const [focusRequest, setFocusRequest] = useState<{ index: number } | null>(null);
    useEffect(() => {
        if (focusRequest) focusElement(handles.current[focusRequest.index] ?? null);
    }, [focusRequest]);
    useEffect(
        () =>
            registerSortable({
                id,
                group,
                label: listName,
                items: () => pending.current ?? latest.current.items,
                setItems: (next) => {
                    pending.current = next as T[];
                    latest.current.setItems(next as T[]);
                },
                accepts: (item, from) => latest.current.accepts?.(item as T, from) ?? true,
                disabled: () => latest.current.disabled,
                onMove: (move) => latest.current.onMove?.(move as SortableMove<T>),
                itemLabel: (item) => latest.current.labelOf(item as T),
                texts: () => latest.current.t,
                announce: (text) => latest.current.announce(text),
                focus: (index) => setFocusRequest({ index }),
            }),
        [id, group, listName]
    );

    const carry = store.carry;
    const carriedHere = carry?.current.id === id ? carry.current.index : null;
    // An item of another list of the group is carried: this list takes it (a tap on a handle or the empty list)
    const carriedFrom = carry ? store.entries.find((entry) => entry.id === carry.current.id) : undefined;
    const takesCarried =
        !!carry &&
        !!carriedFrom &&
        carriedFrom.id !== id &&
        group !== undefined &&
        carriedFrom.group === group &&
        !disabled &&
        (accepts?.(carry.item as T, carriedFrom.id) ?? true);

    // Tap on a handle: pick up – or, with an item picked up, put it here
    const press = (index: number) => {
        const item = items[index];
        if (disabled || item === undefined) return;
        if (onHandlePress) {
            onHandlePress(item, index);
            return;
        }
        const carried = carriedItem();
        if (!carried) {
            pickUpSortableItem(id, index);
            return;
        }
        if (carried.current.id !== id || carried.current.index !== index) moveCarriedItem(id, index);
        dropCarriedItem();
    };
    const step = (index: number, which: OrderStep) =>
        moveSortableItem(id, index, id, orderStepTarget(which, index, items.length));

    // Dragging (responder props on the handle): the row follows the finger, the others make room
    const [offset] = useState(() => new Animated.Value(0));
    const [drag, setDrag] = useState<{ from: number; target: number; slots: OrderSlot[] } | null>(null);
    const slots = useRef<OrderSlot[]>([]);
    const gesture = useRef({
        start: 0,
        index: -1,
        target: -1,
        active: false,
        slots: [] as OrderSlot[],
        timer: undefined as ReturnType<typeof setTimeout> | undefined,
    });
    useEffect(() => {
        const state = gesture.current;
        return () => clearTimeout(state.timer);
    }, []);
    const along = (event: GestureResponderEvent) => (vertical ? event.nativeEvent.pageY : event.nativeEvent.pageX);
    const startDrag = (index: number) => {
        const item = items[index];
        if (item === undefined || disabled) return;
        if (carriedItem()) cancelCarriedItem();
        const state = gesture.current;
        state.active = true;
        state.target = index;
        state.slots = items.map((_, position) => slots.current[position] ?? { start: 0, size: 0 });
        offset.setValue(0);
        setDrag({ from: index, target: index, slots: state.slots });
        announce(t.picked(labelOf(item), index + 1, items.length));
    };
    const finish = (commit: boolean) => {
        const state = gesture.current;
        clearTimeout(state.timer);
        if (!state.active) {
            if (commit) press(state.index);
            return;
        }
        state.active = false;
        const from = state.index;
        const to = state.target;
        const item = items[from];
        if (item === undefined) {
            setDrag(null);
            return;
        }
        if (commit && to !== from) {
            // The row is rendered at its new place without the offset – no jump back in between
            setDrag(null);
            const next = moveItem(items, from, to);
            setItems(next);
            onMove?.({ item, from: { container: id, index: from }, to: { container: id, index: to } });
            announce(t.dropped(labelOf(item), to + 1, next.length));
            return;
        }
        setDrag((current) => (current ? { ...current, target: current.from } : current));
        if (reducedMotion) setDrag(null);
        else
            Animated.timing(offset, { toValue: 0, duration: 150, useNativeDriver: nativeDriver }).start(() =>
                setDrag(null)
            );
        const text = commit ? t.dropped : t.cancelled;
        announce(text(labelOf(item), from + 1, items.length));
    };
    const responder = (index: number) => ({
        onStartShouldSetResponder: () => !disabled,
        // A scroll view may take the touch over until the item is lifted
        onResponderTerminationRequest: () => !gesture.current.active,
        onResponderGrant: (event: GestureResponderEvent) => {
            const state = gesture.current;
            clearTimeout(state.timer);
            state.start = along(event);
            state.index = index;
            state.active = false;
            state.timer = setTimeout(() => startDrag(index), LONG_PRESS);
        },
        onResponderMove: (event: GestureResponderEvent) => {
            const state = gesture.current;
            const delta = along(event) - state.start;
            if (!state.active) {
                if (Math.abs(delta) < DRAG_THRESHOLD) return;
                clearTimeout(state.timer);
                startDrag(state.index);
                if (!state.active) return;
            }
            offset.setValue(delta);
            const target = sortableDropIndex(state.slots, state.index, delta);
            if (target === state.target) return;
            state.target = target;
            setDrag((current) => (current ? { ...current, target } : current));
        },
        onResponderRelease: () => finish(true),
        onResponderTerminate: () => finish(false),
    });

    // Web keyboard: Space/Enter picks up and drops, the arrows move (left/right into the lists of the group),
    // Escape cancels, Tab drops
    const keyDown = (index: number) => (event: { key: string; preventDefault(): void; stopPropagation(): void }) => {
        if (disabled) return;
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            press(index);
            return;
        }
        const carried = carriedItem();
        if (!carried || carried.current.id !== id || carried.current.index !== index) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cancelCarriedItem();
            return;
        }
        if (event.key === 'Tab') {
            dropCarriedItem();
            return;
        }
        const target = sortableTargetForKey(event.key, index, items.length, {
            orientation,
            rtl: I18nManager.isRTL,
        });
        if (!target) return;
        event.preventDefault();
        if ('index' in target) {
            if (target.index !== index) moveCarriedItem(id, target.index);
            return;
        }
        const neighbour = sortableNeighbour(id, target.container);
        if (neighbour) moveCarriedItem(neighbour.id, Math.min(index, neighbour.items().length));
    };

    // Screen reader actions: the steps, the other lists of the group, the extras of the board
    const actionsOf = (item: T, index: number): AccessibilityActionInfo[] => [
        { name: 'activate' },
        ...orderSteps(index, items.length).map((which) => ({ name: which, label: translations.orderList[which] })),
        ...sortableTargets(store.entries, id, group, item).map((target) => ({
            name: `move:${target.id}`,
            label: translations.kanban.moveTo(target.label),
        })),
        ...(actions?.(item, index) ?? []),
    ];
    const onActionOf = (item: T, index: number) => (event: AccessibilityActionEvent) => {
        const action = event.nativeEvent.actionName;
        if (action === 'activate') press(index);
        else if (isStep(action)) step(index, action);
        else if (action.startsWith('move:')) {
            const target = store.entries.find((entry) => entry.id === action.slice(5));
            if (target) moveSortableItem(id, index, target.id, target.items().length);
        } else onAction?.(action, item, index);
    };

    const styles = sortableRecipe({ orientation, target: takesCarried });
    const instructionsId = `${baseId}instructions`;
    const instructions = Platform.OS === 'web' && !onHandlePress;
    const emptyLabel = emptyText ?? t.empty;
    const putHere = () => {
        moveCarriedItem(id, 0);
        dropCarriedItem();
    };

    return (
        <View className={styles.base({ class: className })}>
            {!!label && (
                <Text nativeID={`${baseId}label`} className={styles.label()}>
                    {label}
                </Text>
            )}
            <View
                role="list"
                aria-labelledby={label ? `${baseId}label` : undefined}
                aria-label={label ? undefined : ariaLabel}
                className={styles.list()}
            >
                {items.map((item, index) => {
                    const grabbed = carriedHere === index || drag?.from === index;
                    const parts = sortableRecipe({ orientation, grabbed });
                    const shift = drag ? sortableShift(drag.slots, drag.from, drag.target, index) : 0;
                    const moved = drag?.from === index ? offset : shift;
                    const itemName = labelOf(item);
                    return (
                        <Animated.View
                            key={keyOf(item, index)}
                            role="listitem"
                            className={parts.item()}
                            style={
                                drag?.from === index || shift
                                    ? {
                                          zIndex: drag?.from === index ? 1 : 0,
                                          transform: [vertical ? { translateY: moved } : { translateX: moved }],
                                      }
                                    : undefined
                            }
                            onLayout={(event) => {
                                const { x, y, width, height } = event.nativeEvent.layout;
                                slots.current[index] = vertical
                                    ? { start: y, size: height }
                                    : { start: x, size: width };
                            }}
                        >
                            <View
                                ref={(node) => {
                                    handles.current[index] = node;
                                }}
                                role="button"
                                aria-label={t.handle(itemName)}
                                aria-disabled={disabled || undefined}
                                className={parts.handle()}
                                accessibilityActions={disabled ? undefined : actionsOf(item, index)}
                                onAccessibilityAction={onActionOf(item, index)}
                                {...(onHandlePress ? {} : pressedProps(grabbed))}
                                {...(Platform.OS === 'web'
                                    ? ({
                                          onKeyDown: keyDown(index),
                                          ...(instructions ? { 'aria-describedby': instructionsId } : {}),
                                      } as object)
                                    : {})}
                                {...responder(index)}
                            >
                                <Icon icon={GripVertical} className={parts.handleIcon()} />
                            </View>
                            <View className={parts.content()}>
                                {renderItem ? (
                                    renderItem(item, { index, grabbed })
                                ) : (
                                    <Text className={parts.text()}>{itemName}</Text>
                                )}
                            </View>
                        </Animated.View>
                    );
                })}
                {!items.length && (
                    <View role="listitem" className={styles.empty()}>
                        {takesCarried ? (
                            <Pressable role="button" onPress={putHere}>
                                <Text className={styles.emptyText()}>{emptyLabel}</Text>
                            </Pressable>
                        ) : (
                            <Text className={styles.emptyText()}>{emptyLabel}</Text>
                        )}
                    </View>
                )}
            </View>
            {instructions && (
                <Text nativeID={instructionsId} className={visuallyHidden()}>
                    {t.instructions}
                </Text>
            )}
            {region}
        </View>
    );
}
