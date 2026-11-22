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
    /** A copy out of a source list was dropped nowhere (or Escape) */
    copyCancelled: (item: string) => string;
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
    /**
     * Makes the container a source (e.g. a palette): its items are copied out – this function makes the copy – and
     * it keeps them, takes none in and is not sorted
     */
    clone?: () => ((item: T) => unknown) | undefined;
    texts: () => SortableTexts;
    /** Focuses the handle at `index` once the new order is rendered (default: in the next task) */
    focus?: (index: number) => void;
    /** Classes of the copy of the item that follows the pointer while it is dragged (recipe slot `preview`) */
    previewClass?: () => string;
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
    /** The item of a source the carried copy was made of (undefined: the item itself is carried) */
    copyOf: unknown;
    origin: { container: SortableContainer; index: number };
    current: { container: SortableContainer; index: number; count: number };
    mode: Mode;
}

const idleState: SortableState = { grabbed: null, dragging: false, active: false };
const DRAG_THRESHOLD = 5;
/** Distance from the edge of a scrolling area (px) at which a drag scrolls it, and the fastest step per frame */
const SCROLL_EDGE = 48;
const SCROLL_SPEED = 18;
/** Attribute of the drag handles: the id of their container (several Sortables can be nested) */
export const SORTABLE_HANDLE = 'data-sortable-handle';
const CONTAINER = '[data-sortable-container]';
const INDEX = 'data-sortable-index';

/** Pick-up, keyboard and pointer moves of all Sortables on the page (one item at a time) */
export class SortableController {
    #containers = new Map<string, SortableContainer>();
    #snapshots = new Map<string, SortableState>();
    #listeners = new Set<() => void>();
    #active: Active | null = null;
    #pointer: { container: SortableContainer; index: number; x: number; y: number; id: number } | null = null;
    /** Removes the listeners on the document while a pointer is pressed on a handle */
    #unlisten: (() => void) | null = null;
    /** While dragging: the last pointer position, the copy that follows it and the auto-scroll frame */
    #drag: { x: number; y: number; preview: HTMLElement | null; dx: number; dy: number; frame: number } | null = null;

    register(container: SortableContainer): () => void {
        this.#containers.set(container.id, container);
        return () => {
            this.#containers.delete(container.id);
            this.#snapshots.delete(container.id);
            if (this.#active?.current.container.id === container.id) {
                this.#active = null;
                this.#pointer = null;
                this.#stopListening();
                this.#endDrag();
            }
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
        return {
            grabbed: active.current.container.id === id ? active.current.index : null,
            dragging: active.mode === 'pointer' && active.current.container.id === id,
            // Takes the item (a source only takes its copy back – not shown as a target)
            active: !!container && !container.clone?.() && this.#accepts(container),
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
        // The rest of the press on the document: the handle's item moves in the DOM (and into other lists) while it
        // is dragged, which ends the pointer capture – the release would land elsewhere and the item stay picked up
        this.#listen();
    }

    pointermove(event: PointerEvent) {
        const pointer = this.#pointer;
        if (!pointer || pointer.id !== event.pointerId) return;
        if (this.#active?.mode !== 'pointer') {
            if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < DRAG_THRESHOLD) return;
            if (this.#active) this.#active = null;
            this.pickUp(pointer.container, pointer.index, 'pointer');
            this.#startDrag(pointer.container, pointer.index, pointer.x, pointer.y);
        }
        event.preventDefault();
        if (this.#drag) {
            this.#drag.x = event.clientX;
            this.#drag.y = event.clientY;
            this.#placePreview();
        }
        this.#dragTo(event.clientX, event.clientY);
    }

    pointerup(event: PointerEvent) {
        const pointer = this.#pointer;
        if (!pointer || pointer.id !== event.pointerId) return;
        this.#pointer = null;
        this.#stopListening();
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
        this.#stopListening();
        this.#endDrag();
        if (this.#active?.mode === 'pointer') this.cancel();
    }

    /** A click on the empty area of a container with an item picked up by clicking: puts it at the end */
    containerClick(id: string, event: MouseEvent) {
        const container = this.#containers.get(id);
        const active = this.#active;
        if (!container || !active || active.mode !== 'click') return;
        const target = event.target as Element | null;
        if (target?.closest(`[${SORTABLE_HANDLE}]`)) return;
        // A click in a nested container belongs to that one (it bubbles up here)
        if (target?.closest(CONTAINER) !== container.element()) return;
        if (!this.#accepts(container)) return;
        if (container !== active.current.container) this.#moveTo(container, container.items().length);
        this.drop();
    }

    pickUp(container: SortableContainer, index: number, mode: Mode) {
        const original = container.items()[index];
        if (original === undefined) return;
        // A source carries a copy – made now, so the targets decide on it (`accepts`)
        const clone = container.clone?.();
        const item = clone ? clone(original) : original;
        const count = container.items().length;
        this.#active = {
            item,
            copyOf: clone ? original : undefined,
            origin: { container, index },
            current: { container, index, count },
            mode,
        };
        announce(container.texts().picked(container.itemLabel(original), index + 1, count));
        this.#notify();
    }

    drop() {
        const active = this.#active;
        if (!active) return;
        this.#active = null;
        this.#endDrag();
        const { container, index, count } = active.current;
        const { origin } = active;
        // A copy still at its source was not put anywhere
        if (active.copyOf !== undefined && container === origin.container) {
            announce(container.texts().copyCancelled(container.itemLabel(active.copyOf)));
            this.#notify();
            return;
        }
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
        this.#endDrag();
        const { origin } = active;
        if (active.current.container !== origin.container || active.current.index !== origin.index)
            this.#moveTo(origin.container, origin.index, false);
        const count = active.current.count;
        this.#active = null;
        const texts = origin.container.texts();
        if (active.copyOf !== undefined) announce(texts.copyCancelled(origin.container.itemLabel(active.copyOf)));
        else announce(texts.cancelled(origin.container.itemLabel(active.item), origin.index + 1, count));
        this.#focus(origin.container, origin.index);
        this.#notify();
    }

    /** Puts down a picked-up item without announcing (e.g. when its container unmounts) */
    reset() {
        this.#active = null;
        this.#pointer = null;
        this.#stopListening();
        this.#endDrag();
        this.#notify();
    }

    #listen() {
        this.#stopListening();
        const move = (event: PointerEvent) => this.pointermove(event);
        const up = (event: PointerEvent) => this.pointerup(event);
        const cancel = (event: PointerEvent) => {
            if (event.pointerId === this.#pointer?.id) this.pointercancel();
        };
        // Capture phase: a listener of the app that stops the event cannot hide the release
        document.addEventListener('pointermove', move, true);
        document.addEventListener('pointerup', up, true);
        document.addEventListener('pointercancel', cancel, true);
        this.#unlisten = () => {
            document.removeEventListener('pointermove', move, true);
            document.removeEventListener('pointerup', up, true);
            document.removeEventListener('pointercancel', cancel, true);
        };
    }

    #stopListening() {
        this.#unlisten?.();
        this.#unlisten = null;
    }

    /** The item under the pointer takes the carried one */
    #dragTo(x: number, y: number) {
        const target = this.#targetAt(x, y);
        const current = this.#active?.current;
        if (!target || !current) return;
        if (target.container !== current.container || target.index !== current.index)
            this.#moveTo(target.container, target.index);
    }

    /**
     * A copy of the item follows the pointer (also on the way from a source to its target, where the item itself only
     * shows up once it is over a list); near the edge of a scrolling area that area scrolls
     */
    #startDrag(container: SortableContainer, index: number, x: number, y: number) {
        this.#endDrag();
        const item = container.element()?.querySelector<HTMLElement>(`:scope > [${INDEX}="${index}"]`);
        let preview: HTMLElement | null = null;
        let dx = 0;
        let dy = 0;
        if (item) {
            const rect = item.getBoundingClientRect();
            dx = x - rect.left;
            dy = y - rect.top;
            preview = item.cloneNode(true) as HTMLElement;
            for (const element of [preview, ...preview.querySelectorAll('[id]')]) element.removeAttribute('id');
            for (const name of [INDEX, 'data-grabbed', 'data-dragging']) preview.removeAttribute(name);
            preview.setAttribute('data-sortable-preview', '');
            preview.setAttribute('aria-hidden', 'true');
            preview.inert = true;
            const extra = container.previewClass?.();
            if (extra) preview.className = `${preview.className} ${extra}`;
            Object.assign(preview.style, {
                position: 'fixed',
                left: '0',
                top: '0',
                margin: '0',
                width: `${rect.width}px`,
                pointerEvents: 'none',
                zIndex: '2147483646',
            });
            document.body.append(preview);
        }
        this.#drag = { x, y, preview, dx, dy, frame: 0 };
        this.#placePreview();
        if (typeof requestAnimationFrame === 'function') this.#drag.frame = requestAnimationFrame(this.#scrollStep);
    }

    #placePreview() {
        const drag = this.#drag;
        if (drag?.preview) drag.preview.style.transform = `translate(${drag.x - drag.dx}px, ${drag.y - drag.dy}px)`;
    }

    #scrollStep = () => {
        const drag = this.#drag;
        if (!drag || this.#active?.mode !== 'pointer') return;
        // What is under the pointer changes while the area scrolls
        if (autoScrollAt(drag.x, drag.y)) this.#dragTo(drag.x, drag.y);
        drag.frame = requestAnimationFrame(this.#scrollStep);
    };

    #endDrag() {
        const drag = this.#drag;
        if (!drag) return;
        this.#drag = null;
        if (drag.frame) cancelAnimationFrame(drag.frame);
        drag.preview?.remove();
    }

    #moveTo(target: SortableContainer, index: number, speak = true) {
        const active = this.#active;
        if (!active) return;
        const { container, index: from } = active.current;
        const origin = active.origin;
        if (active.copyOf !== undefined && target === origin.container) {
            // A source is not sorted; a copy that comes back leaves the container it was put in
            if (container === target) return;
            const rest = [...container.items()];
            rest.splice(from, 1);
            container.setItems(rest);
            const count = target.items().length;
            active.current = { container: target, index: origin.index, count };
            if (speak) announce(target.texts().picked(target.itemLabel(active.copyOf), origin.index + 1, count));
            if (active.mode !== 'pointer') this.#focus(target, origin.index);
            this.#notify();
            return;
        }
        let next: unknown[];
        if (target === container) {
            next = moveItem(target.items(), from, index);
            target.setItems(next);
        } else {
            if (!this.#accepts(target)) return;
            if (active.copyOf !== undefined && container === origin.container) {
                // The copy leaves its source: put into the target, the source keeps its item
                next = [...target.items()];
                next.splice(Math.max(0, Math.min(index, next.length)), 0, active.item);
            } else {
                const moved = moveBetween(container.items(), target.items(), from, index);
                container.setItems(moved.from);
                next = moved.to;
            }
            target.setItems(next);
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
        // A source takes nothing – only its own copy back
        if (container.clone?.()) return active.copyOf !== undefined && container === active.origin.container;
        if (!this.#sameGroup(container) || this.#inside(container)) return false;
        return container.accepts?.(active.item, active.current.container.id) ?? true;
    }

    /** The container is nested in the carried item – it cannot take the item it is part of */
    #inside(container: SortableContainer): boolean {
        const { current } = this.#active!;
        const item = current.container.element()?.querySelector(`:scope > [${INDEX}="${current.index}"]`);
        const element = container.element();
        return !!item && !!element && item.contains(element);
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
        // The innermost container: over a nested one (also its empty area) the item goes there, not to its parent
        const owner = element?.closest<HTMLElement>(CONTAINER);
        const container = owner ? this.#containers.get(owner.dataset.sortableContainer ?? '') : undefined;
        if (!container || !this.#accepts(container)) return undefined;
        const active = this.#active!;
        const item = element?.closest<HTMLElement>(`[${INDEX}]`);
        if (item && item.parentElement === owner) return { container, index: Number(item.dataset.sortableIndex) };
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

/** Step towards an edge: negative near the start, positive near the end, faster the closer (and beyond) it is */
function edgeStep(position: number, start: number, end: number): number {
    const zone = Math.min(SCROLL_EDGE, (end - start) / 3);
    if (zone <= 0) return 0;
    if (position < start + zone) return -Math.ceil(((start + zone - Math.max(position, start)) / zone) * SCROLL_SPEED);
    if (position > end - zone) return Math.ceil(((Math.min(position, end) - (end - zone)) / zone) * SCROLL_SPEED);
    return 0;
}

/**
 * Scrolls the innermost scrolling area under the point that can still move towards the edge the point is near – an
 * area at its end passes on to the one around it, last the page (also with the pointer outside the window). True when
 * something scrolled.
 */
function autoScrollAt(x: number, y: number): boolean {
    let element = document.elementFromPoint?.(x, y) ?? null;
    for (; element && element !== document.body && element !== document.documentElement;) {
        const rect = element.getBoundingClientRect();
        const stepX = edgeStep(x, rect.left, rect.right);
        const stepY = edgeStep(y, rect.top, rect.bottom);
        if (stepX || stepY) {
            const style = getComputedStyle(element);
            const scrolls = (overflow: string) => /auto|scroll|overlay/.test(overflow);
            const left = element.scrollLeft;
            const top = element.scrollTop;
            element.scrollBy({
                left: scrolls(style.overflowX) ? stepX : 0,
                top: scrolls(style.overflowY) ? stepY : 0,
                behavior: 'instant',
            });
            if (element.scrollLeft !== left || element.scrollTop !== top) return true;
        }
        element = element.parentElement;
    }
    const page = document.scrollingElement ?? document.documentElement;
    const left = page.scrollLeft;
    const top = page.scrollTop;
    const stepX = edgeStep(x, 0, window.innerWidth);
    const stepY = edgeStep(y, 0, window.innerHeight);
    if (stepX || stepY) window.scrollBy({ left: stepX, top: stepY, behavior: 'instant' });
    return page.scrollLeft !== left || page.scrollTop !== top;
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
