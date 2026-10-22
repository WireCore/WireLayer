import { moveBetween, moveItem, type SortableMove, type SortableTexts } from '@wirecore/wirelayer-recipes/native';
import { useSyncExternalStore } from 'react';

// All mounted Sortables of the app: lists of one group exchange items (screen reader actions "Move to
// “…”", tap a handle and then the target, arrow keys on the web), one item is carried at a time.

/** What a mounted Sortable tells the others */
export interface SortableEntry {
    id: string;
    group: string | undefined;
    /** Name of the list (actions and announcements) */
    label: string;
    items: () => readonly unknown[];
    /** New order – the list stores it and reports it */
    setItems: (items: unknown[]) => void;
    /** Whether an item from the list `from` may come in */
    accepts: (item: unknown, from: string) => boolean;
    disabled: () => boolean;
    onMove: (move: SortableMove) => void;
    itemLabel: (item: unknown) => string;
    texts: () => SortableTexts;
    announce: (text: string) => void;
    /** Focuses the handle at `index` once the new order is rendered */
    focus: (index: number) => void;
}

/** An item picked up with a tap or the keyboard: where it came from and where it is now */
export interface SortableCarry {
    item: unknown;
    origin: { id: string; index: number };
    current: { id: string; index: number };
}

interface Snapshot {
    entries: readonly SortableEntry[];
    carry: SortableCarry | null;
}

let snapshot: Snapshot = { entries: [], carry: null };
const listeners = new Set<() => void>();

function update(next: Partial<Snapshot>) {
    snapshot = { ...snapshot, ...next };
    for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
const getSnapshot = () => snapshot;

/** The lists and the carried item, re-rendered on every change */
export const useSortableStore = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

const entry = (id: string) => snapshot.entries.find((candidate) => candidate.id === id);

/** Adds the list (or replaces it at its place, keeping the order of the group); returns the removal */
export function registerSortable(next: SortableEntry): () => void {
    const index = snapshot.entries.findIndex((candidate) => candidate.id === next.id);
    const entries = [...snapshot.entries];
    if (index >= 0) entries[index] = next;
    else entries.push(next);
    update({ entries });
    return () => {
        const carry = snapshot.carry?.current.id === next.id ? null : snapshot.carry;
        update({ entries: snapshot.entries.filter((candidate) => candidate !== next), carry });
    };
}

/** The item carried right now (event handlers) */
export const carriedItem = () => snapshot.carry;

/** Other lists of the group that take `item` from the list `id` (render, actions) */
export function sortableTargets(
    entries: readonly SortableEntry[],
    id: string,
    group: string | undefined,
    item: unknown
): SortableEntry[] {
    if (group === undefined) return [];
    return entries.filter(
        (candidate) =>
            candidate.id !== id && candidate.group === group && !candidate.disabled() && candidate.accepts(item, id)
    );
}

/** The previous/next list of the group (in the order they were mounted) that takes the carried item */
export function sortableNeighbour(id: string, step: -1 | 1): SortableEntry | undefined {
    const from = entry(id);
    const carry = snapshot.carry;
    if (!from || from.group === undefined || !carry) return undefined;
    const members = snapshot.entries.filter((candidate) => candidate.group === from.group);
    let position = members.indexOf(from) + step;
    while (members[position]) {
        const candidate = members[position]!;
        if (!candidate.disabled() && candidate.accepts(carry.item, id)) return candidate;
        position += step;
    }
    return undefined;
}

/** Moves an item to another place and announces it; `carried` keeps track of a picked-up item */
function place(fromId: string, fromIndex: number, toId: string, toIndex: number, speak = true) {
    const from = entry(fromId);
    const to = entry(toId);
    if (!from || !to) return undefined;
    const item = from.items()[fromIndex];
    if (item === undefined) return undefined;
    let target: unknown[];
    if (from === to) {
        target = moveItem(from.items(), fromIndex, toIndex);
        from.setItems(target);
    } else {
        const moved = moveBetween(from.items(), to.items(), fromIndex, toIndex);
        from.setItems(moved.from);
        to.setItems(moved.to);
        target = moved.to;
    }
    const position = Math.max(0, Math.min(toIndex, target.length - 1));
    if (speak) {
        const label = to.itemLabel(item);
        to.announce(
            from === to
                ? to.texts().moved(label, position + 1, target.length)
                : to.texts().movedTo(label, to.label, position + 1, target.length)
        );
    }
    to.focus(position);
    return { item, position };
}

/** Moves an item right away (actions, buttons): announced and reported as a move */
export function moveSortableItem(fromId: string, fromIndex: number, toId: string, toIndex: number) {
    if (fromId === toId && fromIndex === toIndex) return;
    const placed = place(fromId, fromIndex, toId, toIndex);
    if (!placed) return;
    entry(toId)?.onMove({
        item: placed.item,
        from: { container: fromId, index: fromIndex },
        to: { container: toId, index: placed.position },
    });
}

/** Picks up the item (tap on its handle, Space on the web) */
export function pickUpSortableItem(id: string, index: number) {
    const list = entry(id);
    const item = list?.items()[index];
    if (!list || item === undefined || list.disabled()) return;
    const count = list.items().length;
    update({ carry: { item, origin: { id, index }, current: { id, index } } });
    list.announce(list.texts().picked(list.itemLabel(item), index + 1, count));
}

/** Moves the carried item to `index` of the list `id` (arrow keys, a tap on another handle) */
export function moveCarriedItem(id: string, index: number) {
    const carry = snapshot.carry;
    if (!carry) return;
    if (carry.current.id !== id) {
        const to = entry(id);
        if (!to || to.disabled() || !to.accepts(carry.item, carry.current.id)) return;
    }
    const placed = place(carry.current.id, carry.current.index, id, index);
    if (placed) update({ carry: { ...carry, current: { id, index: placed.position } } });
}

/** Puts the carried item down where it is; a move is reported once */
export function dropCarriedItem() {
    const carry = snapshot.carry;
    if (!carry) return;
    update({ carry: null });
    const list = entry(carry.current.id);
    if (!list) return;
    const count = list.items().length;
    list.announce(list.texts().dropped(list.itemLabel(carry.item), carry.current.index + 1, count));
    if (carry.origin.id !== carry.current.id || carry.origin.index !== carry.current.index) {
        list.onMove({
            item: carry.item,
            from: { container: carry.origin.id, index: carry.origin.index },
            to: { container: carry.current.id, index: carry.current.index },
        });
    }
}

/** Puts the carried item back where it was picked up (Escape) */
export function cancelCarriedItem() {
    const carry = snapshot.carry;
    if (!carry) return;
    update({ carry: null });
    const { origin, current } = carry;
    if (origin.id !== current.id || origin.index !== current.index)
        place(current.id, current.index, origin.id, origin.index, false);
    const list = entry(origin.id);
    if (!list) return;
    list.announce(list.texts().cancelled(list.itemLabel(carry.item), origin.index + 1, list.items().length));
    list.focus(origin.index);
}

/** Focuses the handle at `index` of the list `id` once the new order is rendered (Kanban after a move) */
export function focusSortableItem(id: string, index: number) {
    entry(id)?.focus(index);
}
