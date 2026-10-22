// Framework-neutral logic behind the hooks of @wirecore/wirelayer-vue and @wirecore/wirelayer-react (useDebouncedCallback,
// useStateHistory, useIdle, useNetwork, useScrollSpy, useClipboard, useFileDialog …) and behind OverflowList.
// Everything touching the browser checks for it first, so the hooks render on the server.

export interface Debounced<A extends unknown[]> {
    (...args: A): void;
    /** Drops a pending call */
    cancel(): void;
    /** Runs a pending call now */
    flush(): void;
    /** Whether a call is waiting */
    pending(): boolean;
}

/** Calls `fn` once `wait` ms passed without another call (the last arguments win); `maxWait` caps the delay */
export function debounce<A extends unknown[]>(
    fn: (...args: A) => void,
    wait: number,
    options: { leading?: boolean; maxWait?: number } = {}
): Debounced<A> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let maxTimer: ReturnType<typeof setTimeout> | undefined;
    let last: A | undefined;
    const run = () => {
        clearTimeout(timer);
        clearTimeout(maxTimer);
        timer = maxTimer = undefined;
        if (!last) return;
        const args = last;
        last = undefined;
        fn(...args);
    };
    const debounced = ((...args: A) => {
        const idle = timer === undefined;
        last = args;
        clearTimeout(timer);
        if (idle && options.leading) {
            fn(...args);
            last = undefined;
        }
        timer = setTimeout(run, wait);
        if (options.maxWait !== undefined && maxTimer === undefined) maxTimer = setTimeout(run, options.maxWait);
    }) as Debounced<A>;
    debounced.cancel = () => {
        clearTimeout(timer);
        clearTimeout(maxTimer);
        timer = maxTimer = undefined;
        last = undefined;
    };
    debounced.flush = run;
    debounced.pending = () => last !== undefined;
    return debounced;
}

export interface Throttled<A extends unknown[]> {
    (...args: A): void;
    cancel(): void;
}

/** Calls `fn` at most once per `wait` ms: the first call right away, the last one of a burst at the end */
export function throttle<A extends unknown[]>(fn: (...args: A) => void, wait: number): Throttled<A> {
    let lastRun = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: A | undefined;
    const throttled = ((...args: A) => {
        const now = Date.now();
        const remaining = wait - (now - lastRun);
        if (remaining <= 0 && timer === undefined) {
            lastRun = now;
            fn(...args);
            return;
        }
        pending = args;
        timer ??= setTimeout(
            () => {
                timer = undefined;
                lastRun = Date.now();
                const next = pending;
                pending = undefined;
                if (next) fn(...next);
            },
            Math.max(0, remaining)
        );
    }) as Throttled<A>;
    throttled.cancel = () => {
        clearTimeout(timer);
        timer = undefined;
        pending = undefined;
    };
    return throttled;
}

/** Past, present and future values for undo/redo (useStateHistory) */
export interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export const historyInit = <T>(value: T): HistoryState<T> => ({ past: [], present: value, future: [] });

/** A new present value; the redo steps are dropped; `limit` keeps the newest past values */
export function historyPush<T>(state: HistoryState<T>, value: T, limit = 100): HistoryState<T> {
    if (Object.is(value, state.present)) return state;
    return { past: [...state.past, state.present].slice(-limit), present: value, future: [] };
}

export function historyUndo<T>(state: HistoryState<T>, steps = 1): HistoryState<T> {
    if (!state.past.length || steps < 1) return state;
    const count = Math.min(steps, state.past.length);
    const index = state.past.length - count;
    return {
        past: state.past.slice(0, index),
        present: state.past[index]!,
        future: [...state.past.slice(index + 1), state.present, ...state.future],
    };
}

export function historyRedo<T>(state: HistoryState<T>, steps = 1): HistoryState<T> {
    if (!state.future.length || steps < 1) return state;
    const count = Math.min(steps, state.future.length);
    return {
        past: [...state.past, state.present, ...state.future.slice(0, count - 1)],
        present: state.future[count - 1]!,
        future: state.future.slice(count),
    };
}

/** The selected items after toggling one (by `key`, default identity); `multiple: false` keeps at most one */
export function toggleSelection<T>(
    selected: readonly T[],
    item: T,
    options: { multiple?: boolean; key?: (item: T) => unknown } = {}
): T[] {
    const key = options.key ?? ((value: T) => value);
    const id = key(item);
    const isSelected = selected.some((entry) => Object.is(key(entry), id));
    if (isSelected) return selected.filter((entry) => !Object.is(key(entry), id));
    return options.multiple === false ? [item] : [...selected, item];
}

/** Whether `item` is in `selected` (by `key`) */
export function inSelection<T>(selected: readonly T[], item: T, key: (item: T) => unknown = (value) => value): boolean {
    const id = key(item);
    return selected.some((entry) => Object.is(key(entry), id));
}

/** Default events that count as activity for useIdle */
export const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll', 'pointerdown'];

/**
 * Calls `onChange(true)` after `timeout` ms without activity and `onChange(false)` on the next activity (and when the
 * page becomes visible again). Returns the function that stops watching.
 */
export function watchIdle(
    onChange: (idle: boolean) => void,
    options: { timeout?: number; events?: string[]; initialState?: boolean } = {}
): () => void {
    if (typeof window === 'undefined') return () => {};
    const timeout = options.timeout ?? 60_000;
    const events = options.events ?? IDLE_EVENTS;
    let idle = options.initialState ?? false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const set = (next: boolean) => {
        if (next === idle) return;
        idle = next;
        onChange(next);
    };
    const activity = () => {
        set(false);
        clearTimeout(timer);
        timer = setTimeout(() => set(true), timeout);
    };
    const visibility = () => {
        if (document.visibilityState === 'visible') activity();
    };
    for (const event of events) window.addEventListener(event, activity, { passive: true });
    document.addEventListener('visibilitychange', visibility);
    timer = setTimeout(() => set(true), timeout);
    return () => {
        clearTimeout(timer);
        for (const event of events) window.removeEventListener(event, activity);
        document.removeEventListener('visibilitychange', visibility);
    };
}

export interface NetworkState {
    online: boolean;
    /** From the Network Information API where available (Chromium): slow-2g, 2g, 3g, 4g */
    effectiveType?: string;
    /** Estimated bandwidth in Mbit/s */
    downlink?: number;
    /** Estimated round trip in ms */
    rtt?: number;
    /** The user asked to save data */
    saveData?: boolean;
}

interface NetworkInformationLike extends EventTarget {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
}

const connection = () =>
    typeof navigator === 'undefined'
        ? undefined
        : (navigator as Navigator & { connection?: NetworkInformationLike }).connection;

/** The network state now – online on the server */
export function readNetwork(): NetworkState {
    if (typeof navigator === 'undefined') return { online: true };
    const info = connection();
    return {
        online: navigator.onLine,
        ...(info
            ? { effectiveType: info.effectiveType, downlink: info.downlink, rtt: info.rtt, saveData: info.saveData }
            : {}),
    };
}

/** Calls `onChange` when the connection goes on- or offline or its quality changes */
export function watchNetwork(onChange: (state: NetworkState) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const update = () => onChange(readNetwork());
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    connection()?.addEventListener('change', update);
    return () => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
        connection()?.removeEventListener('change', update);
    };
}

/** Whether a media query matches now – false on the server */
export function matchesMedia(query: string): boolean {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** Calls `onChange` with the new result whenever the media query starts or stops matching */
export function watchMedia(query: string, onChange: (matches: boolean) => void): () => void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
    const list = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => onChange(event.matches);
    list.addEventListener?.('change', listener);
    return () => list.removeEventListener?.('change', listener);
}

/**
 * The section the reader is in: the last one whose top passed `offset` px from the top of the viewport (the first
 * one before that). Ids of the sections, null without any.
 */
export function activeSection(sections: readonly { id: string; top: number }[], offset = 0): string | null {
    if (!sections.length) return null;
    let active = sections[0]!.id;
    for (const section of sections) if (section.top - offset <= 1) active = section.id;
    return active;
}

/** Copies text to the clipboard (Clipboard API, otherwise a hidden text field) */
export async function copyText(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }
    if (typeof document === 'undefined') throw new Error('No clipboard');
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    Object.assign(field.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' });
    document.body.append(field);
    field.select();
    const copied = document.execCommand?.('copy');
    field.remove();
    if (!copied) throw new Error('Copying failed');
}

export interface FileDialogOptions {
    /** File types, e.g. "image/*,.pdf" */
    accept?: string;
    multiple?: boolean;
    /** Camera on mobile devices: "user" or "environment" */
    capture?: 'user' | 'environment';
    /** Folders instead of files (webkitdirectory) */
    directory?: boolean;
}

/** Opens the system's file dialog; resolves with the chosen files (empty when cancelled) */
export function openFileDialog(options: FileDialogOptions = {}): Promise<File[]> {
    return new Promise((resolve) => {
        if (typeof document === 'undefined') return resolve([]);
        const input = document.createElement('input');
        input.type = 'file';
        if (options.accept) input.accept = options.accept;
        input.multiple = !!options.multiple;
        if (options.capture) input.setAttribute('capture', options.capture);
        if (options.directory) input.setAttribute('webkitdirectory', '');
        input.addEventListener('change', () => resolve([...(input.files ?? [])]), { once: true });
        input.addEventListener('cancel', () => resolve([]), { once: true });
        input.click();
    });
}

/** Whether the browser has the EyeDropper API (Chromium) */
export const isEyeDropperSupported = () => typeof window !== 'undefined' && 'EyeDropper' in window;

/** Lets the user pick a colour anywhere on the screen; the hex colour or null (cancelled, not supported) */
export async function pickScreenColor(signal?: AbortSignal): Promise<string | null> {
    if (!isEyeDropperSupported()) return null;
    const EyeDropper = (
        window as unknown as {
            EyeDropper: new () => { open(options?: { signal?: AbortSignal }): Promise<{ sRGBHex: string }> };
        }
    ).EyeDropper;
    try {
        return (await new EyeDropper().open({ signal })).sRGBHex;
    } catch {
        return null;
    }
}

/** The element shown in fullscreen, or null */
export const fullscreenElement = () => (typeof document === 'undefined' ? null : document.fullscreenElement);

/** Shows an element (default: the whole page) in fullscreen */
export async function enterFullscreen(element?: Element | null): Promise<void> {
    if (typeof document === 'undefined') return;
    await (element ?? document.documentElement).requestFullscreen?.();
}

export async function exitFullscreen(): Promise<void> {
    if (typeof document !== 'undefined' && document.fullscreenElement) await document.exitFullscreen?.();
}

export type StorageKind = 'local' | 'session';

const storageOf = (kind: StorageKind): Storage | undefined => {
    try {
        return kind === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    } catch {
        return undefined;
    }
};

/** Same-tab changes through writeStorage (the storage event only reaches other tabs) */
const STORAGE_EVENT = 'wirecore-storage';

/** The JSON value stored under `key` (undefined without one, on the server or for invalid JSON) */
export function readStorage<T>(kind: StorageKind, key: string): T | undefined {
    const storage = storageOf(kind);
    if (!storage) return undefined;
    try {
        const raw = storage.getItem(key);
        return raw === null ? undefined : (JSON.parse(raw) as T);
    } catch {
        return undefined;
    }
}

/** Stores a JSON value (undefined removes it) and tells the other hooks with the same key in this tab */
export function writeStorage(kind: StorageKind, key: string, value: unknown) {
    const storage = storageOf(kind);
    if (!storage) return;
    try {
        if (value === undefined) storage.removeItem(key);
        else storage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage disabled or full – the value is simply not kept
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { kind, key } }));
}

/** Calls `onChange` when `key` changes – in another tab or through writeStorage in this one */
export function watchStorage(kind: StorageKind, key: string, onChange: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const storage = storageOf(kind);
    const other = (event: StorageEvent) => {
        if (event.key === key && event.storageArea === storage) onChange();
    };
    const same = (event: Event) => {
        const detail = (event as CustomEvent<{ kind: StorageKind; key: string }>).detail;
        if (detail.kind === kind && detail.key === key) onChange();
    };
    window.addEventListener('storage', other);
    window.addEventListener(STORAGE_EVENT, same);
    return () => {
        window.removeEventListener('storage', other);
        window.removeEventListener(STORAGE_EVENT, same);
    };
}

/**
 * How many items of a row fit (OverflowList). `widths` in display order, `available` the container width, `moreWidth`
 * the "+N" button; `maxRows` > 1 lets the items wrap. With `collapseFrom: 'start'` the items are hidden from the
 * start: the result is still a count of visible items, counted from the end.
 */
export function overflowVisibleCount(options: {
    widths: readonly number[];
    available: number;
    moreWidth: number;
    gap?: number;
    maxVisible?: number;
    maxRows?: number;
    collapseFrom?: 'start' | 'end';
}): number {
    const { available, moreWidth, gap = 0, maxRows = 1 } = options;
    const widths = options.collapseFrom === 'start' ? [...options.widths].reverse() : [...options.widths];
    const cap = Math.min(widths.length, options.maxVisible ?? Infinity);
    // No layout (server, jsdom): everything up to maxVisible is shown
    if (available <= 0) return cap;
    /** Rows needed for the first `count` items, plus the button if `withMore` */
    const fits = (count: number, withMore: boolean) => {
        const items = [...widths.slice(0, count), ...(withMore ? [moreWidth] : [])];
        let rows = 1;
        let used = 0;
        for (const width of items) {
            const next = used === 0 ? width : used + gap + width;
            if (next <= available + 0.5) used = next;
            else {
                rows++;
                used = width;
                if (width > available + 0.5 && rows > maxRows) return false;
            }
            if (rows > maxRows) return false;
        }
        return true;
    };
    if (cap === widths.length && fits(cap, false)) return cap;
    for (let count = cap; count > 0; count--) if (fits(count, true)) return count;
    return 0;
}

/** Whether an element's text is cut (ellipsis or line clamp) */
export function isTruncated(element: HTMLElement | null | undefined): boolean {
    if (!element) return false;
    return element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
}
