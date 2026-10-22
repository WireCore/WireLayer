import { debounce, throttle, watchIdle, type Debounced, type Throttled } from '@wirecore/wirelayer-recipes';
import { useEffect, useMemo, useState } from 'react';
import { useLatest } from './state.js';

/** A copy of `value` that follows only after `wait` ms without changes (search fields, resizing) */
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

/** A function that runs `fn` at most once per `wait` ms (scroll, pointer move) */
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

export interface UseIdleOptions {
    /** Events that count as activity */
    events?: string[];
    /** State before the first activity (default false) */
    initialState?: boolean;
}

/** Whether the user did nothing (mouse, keyboard, touch, scroll) for `timeout` ms */
export function useIdle(timeout = 60_000, options: UseIdleOptions = {}): boolean {
    const [idle, setIdle] = useState(options.initialState ?? false);
    const { events, initialState } = options;
    const eventKey = events?.join(',');
    useEffect(
        () => watchIdle(setIdle, { timeout, events: eventKey?.split(','), initialState }),
        [timeout, eventKey, initialState]
    );
    return idle;
}
