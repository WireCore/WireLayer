// Accessibility helpers that work on the DOM directly: announcements through live regions, jumping between landmarks
// with F6, and keeping the focus inside a container. Browser only – call them from effects/event handlers.

export type Politeness = 'polite' | 'assertive';

export interface AnnounceOptions {
    /** `polite` (default) waits until the screen reader is idle, `assertive` interrupts */
    politeness?: Politeness;
}

/** Wait before a message is written, so quick successive calls end up as one announcement (the last one) */
export const ANNOUNCE_DELAY = 150;

const regionAttributes = (politeness: Politeness): Record<string, string> =>
    politeness === 'assertive'
        ? { role: 'alert', 'aria-live': 'assertive', 'aria-atomic': 'true' }
        : { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' };

/**
 * One live region per politeness for the whole page. A mounted LiveAnnouncer lends its regions (`attach`); without
 * one the regions are created at the end of <body> on the first announcement. Messages are debounced: within
 * ANNOUNCE_DELAY the last message per politeness wins. The same text twice is announced twice (the region is
 * emptied first).
 */
export class Announcer {
    #regions: Partial<Record<Politeness, HTMLElement>> = {};
    #own: HTMLElement | null = null;
    #timers: Partial<Record<Politeness, ReturnType<typeof setTimeout>>> = {};
    #attached: { polite: HTMLElement; assertive: HTMLElement }[] = [];

    /** Uses the regions of a LiveAnnouncer while it is mounted; returns the function that releases them */
    attach(regions: { polite: HTMLElement; assertive: HTMLElement }): () => void {
        this.#attached.push(regions);
        return () => {
            this.#attached = this.#attached.filter((entry) => entry !== regions);
        };
    }

    /** Announces a text to screen readers */
    announce(text: string, options: AnnounceOptions = {}) {
        if (typeof document === 'undefined') return;
        const politeness = options.politeness ?? 'polite';
        const region = this.#region(politeness);
        clearTimeout(this.#timers[politeness]);
        region.textContent = '';
        this.#timers[politeness] = setTimeout(() => {
            region.textContent = text;
        }, ANNOUNCE_DELAY);
    }

    /** Empties both regions (e.g. when the page changes) */
    clear() {
        for (const politeness of ['polite', 'assertive'] as const) {
            clearTimeout(this.#timers[politeness]);
            const region = this.#attached.at(-1)?.[politeness] ?? this.#regions[politeness];
            if (region) region.textContent = '';
        }
    }

    /** Removes the regions created on <body> (tests) */
    reset() {
        this.clear();
        this.#own?.remove();
        this.#own = null;
        this.#regions = {};
    }

    #region(politeness: Politeness): HTMLElement {
        const attached = this.#attached.at(-1)?.[politeness];
        if (attached?.isConnected) return attached;
        const existing = this.#regions[politeness];
        if (existing?.isConnected) return existing;
        if (!this.#own?.isConnected) {
            this.#own = document.createElement('div');
            this.#own.className = 'wc-live-announcer';
            this.#own.dataset.wcAnnouncer = '';
            // Visually hidden without depending on the stylesheet
            Object.assign(this.#own.style, {
                position: 'absolute',
                width: '1px',
                height: '1px',
                margin: '-1px',
                padding: '0',
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
                whiteSpace: 'nowrap',
                border: '0',
            });
            document.body.append(this.#own);
            this.#regions = {};
        }
        const region = document.createElement('div');
        for (const [name, value] of Object.entries(regionAttributes(politeness))) region.setAttribute(name, value);
        this.#own.append(region);
        this.#regions[politeness] = region;
        return region;
    }
}

/** The announcer of the page */
export const announcer = new Announcer();

/** Announces a text to screen readers: `announce('Saved')`, `announce('Error', { politeness: 'assertive' })` */
export function announce(text: string, options?: AnnounceOptions) {
    announcer.announce(text, options);
}

/** Attributes of the live regions of a LiveAnnouncer (rendered by the component, the same on the server) */
export const liveRegionAttributes = regionAttributes;

/**
 * Landmarks F6 jumps between, in document order: elements marked with `data-landmark`, the page's header, navigation,
 * main area, asides, footer, named regions and search forms – and the Toaster.
 */
export const LANDMARK_SELECTOR = [
    '[data-landmark]',
    'header:not(:is(article, aside, main, nav, section) header)',
    'nav',
    'main',
    'aside',
    'footer:not(:is(article, aside, main, nav, section) footer)',
    '[role=banner]',
    '[role=navigation]',
    '[role=main]',
    '[role=complementary]',
    '[role=contentinfo]',
    '[role=search]',
    'section[aria-label]',
    'section[aria-labelledby]',
    '[role=region][aria-label]',
    '[role=region][aria-labelledby]',
].join(', ');

const isHidden = (element: Element) =>
    !!element.closest('[hidden], [inert], [aria-hidden=true]') ||
    (typeof getComputedStyle !== 'undefined' &&
        (getComputedStyle(element).display === 'none' || getComputedStyle(element).visibility === 'hidden'));

/** The visible landmarks under `root` in document order; a landmark inside another one counts as well */
export function findLandmarks(root: ParentNode = document, selector = LANDMARK_SELECTOR): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>(selector)].filter(
        (element) => !isHidden(element) && element.dataset.landmark !== 'off'
    );
}

/** The landmark after (or before) the one containing `active` – wraps around at the end */
export function nextLandmark(
    landmarks: HTMLElement[],
    active: Element | null,
    direction: 1 | -1 = 1
): HTMLElement | undefined {
    if (!landmarks.length) return undefined;
    // The innermost landmark around the focus
    let current = -1;
    landmarks.forEach((landmark, index) => {
        if (active && landmark.contains(active)) current = index;
    });
    if (current < 0) {
        // Not in a landmark: the first one after (or the last one before) the focus
        const position = active
            ? landmarks.findIndex(
                  (landmark) => !!(active.compareDocumentPosition(landmark) & Node.DOCUMENT_POSITION_FOLLOWING)
              )
            : -1;
        if (direction === 1) return landmarks[position < 0 ? 0 : position];
        const before = position < 0 ? landmarks.length - 1 : position - 1;
        return landmarks[(before + landmarks.length) % landmarks.length];
    }
    return landmarks[(current + direction + landmarks.length) % landmarks.length];
}

/** Moves the focus onto a landmark: the element itself (made focusable for the moment), so its name is read */
export function focusLandmark(landmark: HTMLElement) {
    if (!landmark.hasAttribute('tabindex')) {
        landmark.setAttribute('tabindex', '-1');
        landmark.addEventListener('blur', () => landmark.removeAttribute('tabindex'), { once: true });
    }
    landmark.focus({ preventScroll: false });
}

export interface LandmarkNavigationOptions {
    /** Which elements count as landmarks (default LANDMARK_SELECTOR) */
    selector?: string;
    /** Key that jumps forward; with Shift backward (default F6) */
    key?: string;
}

/** F6 / Shift+F6 jump between the landmarks of the page. Returns the function that removes the listener */
export function setupLandmarkNavigation(options: LandmarkNavigationOptions = {}): () => void {
    if (typeof document === 'undefined') return () => {};
    const key = options.key ?? 'F6';
    const onKey = (event: KeyboardEvent) => {
        if (event.key !== key || event.ctrlKey || event.metaKey || event.altKey) return;
        const target = nextLandmark(
            findLandmarks(document, options.selector),
            document.activeElement,
            event.shiftKey ? -1 : 1
        );
        if (!target) return;
        event.preventDefault();
        focusLandmark(target);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
}

const FOCUSABLE = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type=hidden])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable=false])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Elements inside `container` reachable with Tab, in order */
export function tabbableElements(container: ParentNode): HTMLElement[] {
    return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => !element.closest('[inert], [hidden]') && element.tabIndex >= 0
    );
}

/**
 * Keeps Tab and Shift+Tab inside `container` and focuses its first element (or `initialFocus`). Returns the function
 * that releases it.
 */
export function trapFocus(container: HTMLElement, options: { initialFocus?: HTMLElement | null } = {}): () => void {
    const onKey = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;
        const elements = tabbableElements(container);
        if (!elements.length) {
            event.preventDefault();
            return;
        }
        const first = elements[0]!;
        const last = elements.at(-1)!;
        const active = document.activeElement;
        if (event.shiftKey && (active === first || !container.contains(active))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && (active === last || !container.contains(active))) {
            event.preventDefault();
            first.focus();
        }
    };
    document.addEventListener('keydown', onKey, true);
    if (!container.contains(document.activeElement)) {
        const target = options.initialFocus ?? tabbableElements(container)[0];
        if (target) target.focus();
        else {
            if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
            container.focus();
        }
    }
    return () => document.removeEventListener('keydown', onKey, true);
}
