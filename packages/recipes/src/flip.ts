// Smooth moves for lists whose items change place (Sortable, Kanban): every item glides from where it was to where
// it is now ("FLIP": first, last, invert, play) – also from one list of a group to another. Browser only; on the
// server and without the Web Animations API nothing happens. Skipped for reduced motion.

const KEY = 'data-flip-key';

interface Place {
    x: number;
    y: number;
    owner: HTMLElement;
    /** Not in its list any more – it may have come into another one; dropped after the next frame */
    gone: boolean;
}

interface FlipOptions {
    /** Milliseconds (default 200) */
    duration?: number;
}

const places = new Map<string, Map<string, Place>>();
const lists = new Map<HTMLElement, string>();
let watching = false;

const canAnimate = () =>
    typeof document !== 'undefined' &&
    typeof Element !== 'undefined' &&
    typeof Element.prototype.animate === 'function' &&
    !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

const isMoving = (element: HTMLElement) => (element.getAnimations?.().length ?? 0) > 0;

/** Position on the page (call only while no move animation runs on the element) */
function measure(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + window.scrollX, y: rect.top + window.scrollY };
}

const itemsOf = (list: HTMLElement) => [...list.querySelectorAll<HTMLElement>(`:scope > [${KEY}]`)];

/** Records the places again, e.g. after scrolling a list – the items did not move, the page did */
function remeasure() {
    for (const [list, group] of lists) {
        const known = places.get(group);
        if (!known) continue;
        for (const element of itemsOf(list)) {
            if (isMoving(element)) continue;
            const key = element.getAttribute(KEY)!;
            const place = known.get(key);
            if (place?.owner === list) Object.assign(place, measure(element));
        }
    }
}

function watch() {
    if (watching || typeof window === 'undefined') return;
    watching = true;
    let frame = 0;
    const later = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(remeasure);
    };
    // Scrolling does not bubble: capture it on the way down; resizing moves the items as well
    window.addEventListener('scroll', later, { capture: true, passive: true });
    window.addEventListener('resize', later, { passive: true });
}

/**
 * Call after every render of a list whose items carry `data-flip-key`: items that changed place glide there. Lists
 * of one `group` know each other's items, so a card that moves to another column glides over as well.
 */
export function flipSync(list: HTMLElement | null, group: string, options: FlipOptions = {}) {
    if (!list || typeof window === 'undefined') return;
    watch();
    lists.set(list, group);
    const known = places.get(group) ?? new Map<string, Place>();
    places.set(group, known);
    const animate = canAnimate();
    const present = new Set<string>();
    for (const element of itemsOf(list)) {
        const key = element.getAttribute(KEY)!;
        present.add(key);
        const before = known.get(key);
        // Rendered again while it glides (e.g. a status text changed): let it finish – its place is recorded then
        if (isMoving(element)) {
            if (before) Object.assign(before, { owner: list, gone: false });
            continue;
        }
        const now = measure(element);
        if (animate && before && !element.hasAttribute('data-dragging')) {
            const dx = before.x - now.x;
            const dy = before.y - now.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                const move = element.animate(
                    [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
                    { duration: options.duration ?? 200, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
                );
                // Record where it ended up (layout may have changed meanwhile, e.g. by a scroll)
                move.finished.then(
                    () => {
                        const place = known.get(key);
                        if (place?.owner === list && element.isConnected) Object.assign(place, measure(element));
                    },
                    () => {}
                );
            }
        }
        known.set(key, { ...now, owner: list, gone: false });
    }
    // Items that left this list may arrive in another one in the same render: keep them for one frame
    for (const [key, place] of known) if (place.owner === list && !present.has(key)) place.gone = true;
    requestAnimationFrame(() => {
        for (const [key, place] of known) if (place.gone) known.delete(key);
    });
}

/** Call when the list goes away */
export function flipRelease(list: HTMLElement | null) {
    if (list) lists.delete(list);
}

/** Attribute that marks an item for `flipSync` */
export const FLIP_KEY_ATTRIBUTE = KEY;
