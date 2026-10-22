import { announce } from './a11y.js';
import { moveItem } from './data-table.js';

// Sortable lists and grids (Sortable): drag with a pointer, pick up and move with the keyboard (Space, arrows,
// Space, Escape) or with single clicks (WCAG 2.5.7), also between containers of the same group. The controller is
// framework-neutral; Vue and React render the items and pass the events on.

export type SortableOrientation = 'vertical' | 'horizontal' | 'grid';

/**
 * Where a key moves the item: another index in the container, or the previous/next container of the group – at the
 * same index, or at its start/end (`at`, grids)
 */
export type SortableKeyTarget = { index: number } | { container: -1 | 1; at?: 'start' | 'end' };

/**
 * Target of an arrow key (or Home/End) for the item at `index` of `count`: within the container along its
 * orientation, across containers on the other axis (Kanban columns side by side). In a grid, the arrows that would
 * leave it (past the first or last item, above the first or below the last row) go to the previous/next container.
 * Undefined: not a move key.
 */
export function sortableTargetForKey(
    key: string,
    index: number,
    count: number,
    options: { orientation?: SortableOrientation; columns?: number; rtl?: boolean } = {}
): SortableKeyTarget | undefined {
    const orientation = options.orientation ?? 'vertical';
    const last = Math.max(0, count - 1);
    const forward = options.rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = options.rtl ? 'ArrowRight' : 'ArrowLeft';
    if (key === 'Home') return { index: 0 };
    if (key === 'End') return { index: last };
    if (orientation === 'grid') {
        const columns = Math.max(1, options.columns ?? 1);
        const next = { container: 1, at: 'start' } as const;
        const previous = { container: -1, at: 'end' } as const;
        if (key === forward) return index < last ? { index: index + 1 } : next;
        if (key === backward) return index > 0 ? { index: index - 1 } : previous;
        if (key === 'ArrowDown') {
            if (index + columns <= last) return { index: index + columns };
            // Below the last row: the next container; a gap below (short last row): stay
            return index >= last - (last % columns) ? next : { index };
        }
        if (key === 'ArrowUp') return index - columns >= 0 ? { index: index - columns } : previous;
        return undefined;
    }
    const [previous, next, previousContainer, nextContainer] =
        orientation === 'vertical'
            ? ['ArrowUp', 'ArrowDown', backward, forward]
            : [backward, forward, 'ArrowUp', 'ArrowDown'];
    if (key === previous) return { index: Math.max(0, index - 1) };
    if (key === next) return { index: Math.min(last, index + 1) };
    if (key === previousContainer) return { container: -1 };
    if (key === nextContainer) return { container: 1 };
    return undefined;
}

/** Moves the item at `fromIndex` of `from` to `toIndex` of `to` (new arrays) */
export function moveBetween<T>(
    from: readonly T[],
    to: readonly T[],
    fromIndex: number,
    toIndex: number
): { from: T[]; to: T[] } {
    const source = [...from];
    const [item] = source.splice(fromIndex, 1);
    const target = [...to];
    target.splice(Math.max(0, Math.min(toIndex, target.length)), 0, item!);
    return { from: source, to: target };
}

/** Texts the controller announces (from the translations) */
export interface SortableTexts {
    picked: (item: string, position: number, count: number) => string;
    moved: (item: string, position: number, count: number) => string;
    movedTo: (item: string, container: string, position: number, count: number) => string;
    dropped: (item: string, position: number, count: number) => string;
    cancelled: (item: string, position: number, count: number) => string;
}

/** A move that changed the order: from and to which container (its `id`) and index */
export interface SortableMove<T = unknown> {
    item: T;
    from: { container: string; index: number };
    to: { container: string; index: number };
}

/** What a rendered Sortable tells the controller */
export interface SortableContainer<T = unknown> {
    id: string;
    /** Containers of the same group exchange items */
    group: () => string | undefined;
    element: () => HTMLElement | null;
    items: () => readonly T[];
    /** New order (the component stores it and emits it) */
    setItems: (items: T[]) => void;
    /** Called once when an item is dropped somewhere else than where it was picked up */
    onMove?: (move: SortableMove<T>) => void;
    itemLabel: (item: T) => string;
    /** Name of the container (announced when an item moves into it) */
    label: () => string;
    orientation: () => SortableOrientation;
    columns: () => number;
    disabled: () => boolean;
    /** Whether an item from another container may come in (default: yes) */
    accepts?: (item: T, from: string) => boolean;
    texts: () => SortableTexts;
    /** Focuses the handle at `index` once the new order is rendered (default: in the next task) */
    focus?: (index: number) => void;
}

/** Grab state of one container, for rendering */
export interface SortableState {
    /** Index of the picked-up item in this container, or null */
    grabbed: number | null;
    /** The item is dragged with a pointer */
    dragging: boolean;
    /** An item is picked up in this group (another container can take it) */
    active: boolean;
}

type Mode = 'keyboard' | 'pointer' | 'click';
interface Active {
    item: unknown;
    origin: { container: SortableContainer; index: number };
    current: { container: SortableContainer; index: number; count: number };
    mode: Mode;
}

const idleState: SortableState = { grabbed: null, dragging: false, active: false };
const DRAG_THRESHOLD = 5;
/** Attribute of the drag handles: the id of their container (several Sortables can be nested) */
export const SORTABLE_HANDLE = 'data-sortable-handle';

/** Pick-up, keyboard and pointer moves of all Sortables on the page (one item at a time) */
export class SortableController {
    #containers = new Map<string, SortableContainer>();
    #snapshots = new Map<string, SortableState>();
    #listeners = new Set<() => void>();
    #active: Active | null = null;
    #pointer: { container: SortableContainer; index: number; x: number; y: number; id: number } | null = null;

    register(container: SortableContainer): () => void {
        this.#containers.set(container.id, container);
        return () => {
            this.#containers.delete(container.id);
            this.#snapshots.delete(container.id);
            if (this.#active?.current.container.id === container.id) this.#active = null;
        };
    }

    /** Called after every change of the grab state */
    subscribe(listener: () => void): () => void {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    /** Grab state of a container – the same object while nothing changed (for useSyncExternalStore) */
    state(id: string): SortableState {
        const next = this.#compute(id);
        const last = this.#snapshots.get(id);
        if (last && last.grabbed === next.grabbed && last.dragging === next.dragging && last.active === next.active)
            return last;
        this.#snapshots.set(id, next);
        return next;
    }

    #compute(id: string): SortableState {
        const active = this.#active;
        if (!active) return idleState;
        const container = this.#containers.get(id);
        const sameGroup = !!container && (container === active.current.container || this.#sameGroup(container));
        return {
            grabbed: active.current.container.id === id ? active.current.index : null,
            dragging: active.mode === 'pointer' && active.current.container.id === id,
            active: sameGroup,
        };
    }

    /** Space/Enter picks up and drops, arrows move, Escape cancels, Tab drops */
    keydown(id: string, index: number, event: KeyboardEvent) {
        const container = this.#containers.get(id);
        if (!container || container.disabled()) return;
        const active = this.#active;
        const grabbedHere = active?.current.container === container && active.current.index === index;
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (grabbedHere) this.drop();
            else this.pickUp(container, index, 'keyboard');
            return;
        }
        if (!grabbedHere || !active) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.cancel();
            return;
        }
        if (event.key === 'Tab') {
            this.drop();
            return;
        }
        const target = sortableTargetForKey(event.key, index, container.items().length, {
            orientation: container.orientation(),
            columns: container.columns(),
            rtl: isRtl(container.element()),
        });
        if (!target) return;
        event.preventDefault();
        if ('index' in target) {
            if (target.index !== index) this.#moveTo(container, target.index);
            return;
        }
        const neighbour = this.#neighbour(container, target.container);
        if (!neighbour) return;
        const length = neighbour.items().length;
        this.#moveTo(neighbour, target.at === 'start' ? 0 : target.at === 'end' ? length : Math.min(index, length));
    }

    /** Pointer pressed on a handle: a drag starts once it moves, a click picks up or drops */
    pointerdown(id: string, index: number, event: PointerEvent) {
        const container = this.#containers.get(id);
        if (!container || container.disabled() || event.button !== 0) return;
        this.#pointer = { container, index, x: event.clientX, y: event.clientY, id: event.pointerId };
        (event.currentTarget as Element | null)?.setPointerCapture?.(event.pointerId);
    }

    pointermove(event: PointerEvent) {
        const pointer = this.#pointer;
        if (!pointer || pointer.id !== event.pointerId) return;
        if (this.#active?.mode !== 'pointer') {
            if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < DRAG_THRESHOLD) return;
            if (this.#active) this.#active = null;
            this.pickUp(pointer.container, pointer.index, 'pointer');
        }
        event.preventDefault();
        const target = this.#targetAt(event.clientX, event.clientY);
        if (!target) return;
        const current = this.#active!.current;
        if (target.container !== current.container || target.index !== current.index)
            this.#moveTo(target.container, target.index);
    }

    pointerup(event: PointerEvent) {
        const pointer = this.#pointer;
        if (!pointer || pointer.id !== event.pointerId) return;
        this.#pointer = null;
        const active = this.#active;
        if (active?.mode === 'pointer') {
            this.drop();
            return;
        }
        // A click: pick up – or, with an item picked up, put it here
        if (!active) {
            this.pickUp(pointer.container, pointer.index, 'click');
            return;
        }
        const here = active.current.container === pointer.container && active.current.index === pointer.index;
        if (!here && this.#accepts(pointer.container)) this.#moveTo(pointer.container, pointer.index);
        this.drop();
    }

    pointercancel() {
        this.#pointer = null;
        if (this.#active?.mode === 'pointer') this.cancel();
    }

    /** A click on the empty area of a container with an item picked up by clicking: puts it at the end */
    containerClick(id: string, event: MouseEvent) {
        const container = this.#containers.get(id);
        const active = this.#active;
        if (!container || !active || active.mode !== 'click') return;
        if ((event.target as Element | null)?.closest(`[${SORTABLE_HANDLE}]`)) return;
        if (!this.#accepts(container)) return;
        if (container !== active.current.container) this.#moveTo(container, container.items().length);
        this.drop();
    }

    pickUp(container: SortableContainer, index: number, mode: Mode) {
        const item = container.items()[index];
        if (item === undefined) return;
        const count = container.items().length;
        this.#active = { item, origin: { container, index }, current: { container, index, count }, mode };
        announce(container.texts().picked(container.itemLabel(item), index + 1, count));
        this.#notify();
    }

    drop() {
        const active = this.#active;
        if (!active) return;
        this.#active = null;
        const { container, index, count } = active.current;
        const { origin } = active;
        announce(container.texts().dropped(container.itemLabel(active.item), index + 1, count));
        if (origin.container !== container || origin.index !== index) {
            container.onMove?.({
                item: active.item,
                from: { container: origin.container.id, index: origin.index },
                to: { container: container.id, index },
            });
        }
        this.#notify();
    }

    cancel() {
        const active = this.#active;
        if (!active) return;
        const { origin } = active;
        if (active.current.container !== origin.container || active.current.index !== origin.index)
            this.#moveTo(origin.container, origin.index, false);
        const count = active.current.count;
        this.#active = null;
        const label = origin.container.itemLabel(active.item);
        announce(origin.container.texts().cancelled(label, origin.index + 1, count));
        this.#focus(origin.container, origin.index);
        this.#notify();
    }

    /** Puts down a picked-up item without announcing (e.g. when its container unmounts) */
    reset() {
        this.#active = null;
        this.#pointer = null;
        this.#notify();
    }

    #moveTo(target: SortableContainer, index: number, speak = true) {
        const active = this.#active;
        if (!active) return;
        const { container, index: from } = active.current;
        let next: unknown[];
        if (target === container) {
            next = moveItem(target.items(), from, index);
            target.setItems(next);
        } else {
            if (!this.#accepts(target)) return;
            const moved = moveBetween(container.items(), target.items(), from, index);
            container.setItems(moved.from);
            target.setItems(moved.to);
            next = moved.to;
        }
        const position = Math.max(0, Math.min(index, next.length - 1));
        active.current = { container: target, index: position, count: next.length };
        if (speak) {
            const label = target.itemLabel(active.item);
            announce(
                target === container
                    ? target.texts().moved(label, position + 1, next.length)
                    : target.texts().movedTo(label, target.label(), position + 1, next.length)
            );
        }
        if (active.mode !== 'pointer') this.#focus(target, position);
        this.#notify();
    }

    #accepts(container: SortableContainer): boolean {
        const active = this.#active;
        if (!active || container.disabled()) return false;
        if (container === active.current.container) return true;
        if (!this.#sameGroup(container)) return false;
        return container.accepts?.(active.item, active.current.container.id) ?? true;
    }

    #sameGroup(container: SortableContainer) {
        const group = this.#active?.current.container.group();
        return group !== undefined && container.group() === group;
    }

    /** The previous/next container of the group in document order that takes the item */
    #neighbour(container: SortableContainer, step: -1 | 1): SortableContainer | undefined {
        const group = container.group();
        if (group === undefined) return undefined;
        const members = [...this.#containers.values()]
            .filter((entry) => entry.group() === group && entry.element())
            .sort((a, b) =>
                a.element()!.compareDocumentPosition(b.element()!) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
            );
        let position = members.indexOf(container) + step;
        while (members[position]) {
            if (this.#accepts(members[position]!)) return members[position];
            position += step;
        }
        return undefined;
    }

    /** Container and index under the pointer: an item (its place) or the empty area of a container (the end) */
    #targetAt(x: number, y: number): { container: SortableContainer; index: number } | undefined {
        const element = document.elementFromPoint(x, y);
        const item = element?.closest<HTMLElement>('[data-sortable-index]');
        const owner = (item ?? element)?.closest<HTMLElement>('[data-sortable-container]');
        const container = owner ? this.#containers.get(owner.dataset.sortableContainer ?? '') : undefined;
        if (!container || !this.#accepts(container)) return undefined;
        const active = this.#active!;
        if (item && owner?.contains(item)) return { container, index: Number(item.dataset.sortableIndex) };
        const end = container.items().length - (container === active.current.container ? 1 : 0);
        return { container, index: end };
    }

    /** Focuses the handle at `index` once the framework has rendered the new order */
    #focus(container: SortableContainer, index: number) {
        if (container.focus) {
            container.focus(index);
            return;
        }
        setTimeout(() => focusHandle(container, index));
    }

    #notify() {
        for (const listener of this.#listeners) listener();
    }
}

/** Focuses the drag handle at `index` of a rendered container */
export function focusHandle(container: Pick<SortableContainer, 'id' | 'element'>, index: number) {
    const id = container.id.replace(/["\\]/g, '\\$&');
    container.element()?.querySelectorAll<HTMLElement>(`[${SORTABLE_HANDLE}="${id}"]`)[index]?.focus();
}

function isRtl(element: HTMLElement | null): boolean {
    if (!element) return false;
    try {
        return getComputedStyle(element).direction === 'rtl';
    } catch {
        return false;
    }
}

/** The controller shared by all Sortables (items move between containers of a group) */
export const sortableController = new SortableController();
