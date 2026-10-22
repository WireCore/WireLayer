// Hooks of @wirecore/wirelayer-native – the names of the @wirecore/wirelayer-react hooks where they carry over to a phone; the logic
// (debounce, history, selection) is shared through @wirecore/wirelayer-recipes
import {
    debounce,
    historyInit,
    historyPush,
    historyRedo,
    historyUndo,
    inSelection,
    throttle,
    toggleSelection,
    type Debounced,
    type HistoryState,
    type Throttled,
} from '@wirecore/wirelayer-recipes/native';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AppState, useColorScheme as useSystemColorScheme, type AppStateStatus } from 'react-native';

export { useReducedMotion } from '../utils/useReducedMotion.js';

/** The latest value of a callback for effects and listeners, without re-subscribing on every render */
function useLatest<T>(value: T) {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    });
    return ref;
}

export interface UseDisclosureOptions {
    onOpen?: () => void;
    onClose?: () => void;
}

/** Open/closed state of a dialog, drawer, sheet …: `const { opened, open, close, toggle } = useDisclosure()` */
export function useDisclosure(initial = false, options: UseDisclosureOptions = {}) {
    const [opened, setOpened] = useState(initial);
    const set = (next: boolean) => {
        if (next === opened) return;
        setOpened(next);
        (next ? options.onOpen : options.onClose)?.();
    };
    return { opened, open: () => set(true), close: () => set(false), toggle: () => set(!opened) };
}

export interface UseStateHistoryOptions {
    /** Most undo steps kept (default 100) */
    limit?: number;
}

/** A value with undo and redo: `set` adds a step, `undo`/`redo` move through them */
export function useStateHistory<T>(initial: T, options: UseStateHistoryOptions = {}) {
    const [history, setHistory] = useState<HistoryState<T>>(() => historyInit(initial));
    const { limit } = options;
    return {
        /** The current value */
        value: history.present,
        /** Past, present and future values */
        history,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        set: useCallback((value: T) => setHistory((current) => historyPush(current, value, limit)), [limit]),
        undo: useCallback((steps = 1) => setHistory((current) => historyUndo(current, steps)), []),
        redo: useCallback((steps = 1) => setHistory((current) => historyRedo(current, steps)), []),
        /** Starts over with a value (default: the initial one) */
        reset: useCallback((value?: T) => setHistory(historyInit(value === undefined ? initial : value)), [initial]),
    };
}

export interface UseSelectionOptions<T> {
    /** Several items (default) or one */
    multiple?: boolean;
    /** Identity of an item (default: the item itself), e.g. `(row) => row.id` */
    key?: (item: T) => unknown;
    /** Selected at the start */
    initial?: T[];
}

/** Selected items of a list: toggle, select all, clear – with "all"/"some" for a header checkbox or an ActionBar */
export function useSelection<T>(items: readonly T[], options: UseSelectionOptions<T> = {}) {
    const [selected, setSelected] = useState<T[]>(() => [...(options.initial ?? [])]);
    const key = options.key ?? ((item: T) => item);
    const { multiple } = options;
    const isSelected = (item: T) => inSelection(selected, item, key);
    const allSelected = items.length > 0 && items.every(isSelected);
    return {
        selected,
        isSelected,
        allSelected,
        someSelected: selected.length > 0 && !allSelected,
        toggle: (item: T) => setSelected((current) => toggleSelection(current, item, { multiple, key })),
        select: (item: T) =>
            setSelected((current) =>
                inSelection(current, item, key) ? current : multiple === false ? [item] : [...current, item]
            ),
        deselect: (item: T) => setSelected((current) => current.filter((entry) => !Object.is(key(entry), key(item)))),
        selectAll: () => {
            if (multiple !== false) setSelected([...items]);
        },
        clear: () => setSelected([]),
        setSelected: (next: T[]) => setSelected([...next]),
    };
}

/** A copy of `value` that follows only after `wait` ms without changes (search fields) */
export function useDebouncedValue<T>(value: T, wait: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), wait);
        return () => clearTimeout(timer);
    }, [value, wait]);
    return debounced;
}

/**
 * A function that runs `fn` once `wait` ms passed without another call – with `cancel`, `flush` and `pending`.
 * Always calls the latest `fn`; cancelled when the component unmounts.
 */
export function useDebouncedCallback<A extends unknown[]>(
    fn: (...args: A) => void,
    wait: number,
    options: { leading?: boolean; maxWait?: number } = {}
): Debounced<A> {
    const latest = useLatest(fn);
    const { leading, maxWait } = options;
    const debounced = useMemo(
        () => debounce((...args: A) => latest.current(...args), wait, { leading, maxWait }),
        [latest, wait, leading, maxWait]
    );
    useEffect(() => debounced.cancel, [debounced]);
    return debounced;
}

/** A function that runs `fn` at most once per `wait` ms (scrolling, gestures) */
export function useThrottledCallback<A extends unknown[]>(fn: (...args: A) => void, wait: number): Throttled<A> {
    const latest = useLatest(fn);
    const throttled = useMemo(() => throttle((...args: A) => latest.current(...args), wait), [latest, wait]);
    useEffect(() => throttled.cancel, [throttled]);
    return throttled;
}

/** Runs `fn` every `interval` ms while active (starts on mount unless `autoStart: false`) */
export function useInterval(fn: () => void, interval: number, options: { autoStart?: boolean } = {}) {
    const [active, setActive] = useState(options.autoStart !== false);
    const latest = useLatest(fn);
    useEffect(() => {
        if (!active) return;
        const timer = setInterval(() => latest.current(), interval);
        return () => clearInterval(timer);
    }, [active, interval, latest]);
    return {
        active,
        start: () => setActive(true),
        stop: () => setActive(false),
        toggle: () => setActive((current) => !current),
    };
}

/** Runs `fn` once after `delay` ms when started (on mount with `autoStart`) */
export function useTimeout(fn: () => void, delay: number, options: { autoStart?: boolean } = {}) {
    // Every start is a new run (also while one is pending)
    const [run, setRun] = useState(options.autoStart ? 1 : 0);
    const [pending, setPending] = useState(!!options.autoStart);
    const latest = useLatest(fn);
    useEffect(() => {
        if (!run) return;
        const timer = setTimeout(() => {
            setPending(false);
            latest.current();
        }, delay);
        return () => clearTimeout(timer);
    }, [run, delay, latest]);
    return {
        pending,
        start: () => {
            setPending(true);
            setRun((current) => current + 1);
        },
        clear: () => {
            setPending(false);
            setRun(0);
        },
    };
}

/** The colour scheme of the device: 'light' or 'dark' (`initialValue` while the system does not say) */
export function useColorScheme(initialValue: 'light' | 'dark' = 'light'): 'light' | 'dark' {
    const scheme = useSystemColorScheme();
    return scheme === 'dark' || scheme === 'light' ? scheme : initialValue;
}

const subscribeAppState = (notify: () => void) => {
    const subscription = AppState.addEventListener('change', notify);
    return () => subscription.remove();
};
const appState = () => (AppState.currentState ?? 'active') as AppStateStatus;

/** State of the app: 'active' in the foreground, 'background' or 'inactive' (iOS: app switcher, call) */
export function useAppState(): AppStateStatus {
    return useSyncExternalStore(subscribeAppState, appState, appState);
}

/** 'visible' while the app is in the foreground, else 'hidden' – the counterpart of the web hook (pause timers) */
export function useDocumentVisibility(): 'visible' | 'hidden' {
    return useAppState() === 'active' ? 'visible' : 'hidden';
}
