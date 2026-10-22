import { debounce, throttle, watchIdle, type Debounced, type Throttled } from '@wirecore/wirelayer-recipes';
import { getCurrentScope, onMounted, onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

const onDispose = (fn: () => void) => {
    if (getCurrentScope()) onScopeDispose(fn);
};

/** A copy of `value` that follows only after `wait` ms without changes (search fields, resizing) */
export function useDebouncedValue<T>(value: MaybeRefOrGetter<T>, wait: number): Ref<T> {
    const debounced = ref(toValue(value)) as Ref<T>;
    const update = debounce((next: T) => (debounced.value = next), wait);
    watch(() => toValue(value), update);
    onDispose(update.cancel);
    return debounced;
}

/**
 * A function that runs `fn` once `wait` ms passed without another call – with `cancel`, `flush` and `pending`.
 * Cancelled when the component unmounts.
 */
export function useDebouncedCallback<A extends unknown[]>(
    fn: (...args: A) => void,
    wait: number,
    options?: { leading?: boolean; maxWait?: number }
): Debounced<A> {
    const debounced = debounce(fn, wait, options);
    onDispose(debounced.cancel);
    return debounced;
}

/** A function that runs `fn` at most once per `wait` ms (scroll, pointer move) */
export function useThrottledCallback<A extends unknown[]>(fn: (...args: A) => void, wait: number): Throttled<A> {
    const throttled = throttle(fn, wait);
    onDispose(throttled.cancel);
    return throttled;
}

/** Runs `fn` every `interval` ms while active (starts on mount unless `autoStart: false`) */
export function useInterval(fn: () => void, interval: MaybeRefOrGetter<number>, options: { autoStart?: boolean } = {}) {
    const active = ref(options.autoStart !== false);
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
        clearInterval(timer);
        timer = undefined;
        active.value = false;
    };
    const start = () => {
        stop();
        timer = setInterval(fn, toValue(interval));
        active.value = true;
    };
    onMounted(() => {
        if (options.autoStart !== false) start();
    });
    watch(
        () => toValue(interval),
        () => {
            if (active.value) start();
        }
    );
    onDispose(stop);
    return { active, start, stop, toggle: () => (active.value ? stop() : start()) };
}

/** Runs `fn` once after `delay` ms when started (on mount with `autoStart`) */
export function useTimeout(fn: () => void, delay: MaybeRefOrGetter<number>, options: { autoStart?: boolean } = {}) {
    const pending = ref(!!options.autoStart);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
        clearTimeout(timer);
        timer = undefined;
        pending.value = false;
    };
    const start = () => {
        clear();
        pending.value = true;
        timer = setTimeout(() => {
            pending.value = false;
            fn();
        }, toValue(delay));
    };
    onMounted(() => {
        if (options.autoStart) start();
    });
    onDispose(clear);
    return { pending, start, clear };
}

export interface UseIdleOptions {
    /** Events that count as activity */
    events?: string[];
    /** State before the first activity (default false) */
    initialState?: boolean;
}

/** Whether the user did nothing (mouse, keyboard, touch, scroll) for `timeout` ms */
export function useIdle(timeout = 60_000, options: UseIdleOptions = {}): Ref<boolean> {
    const idle = ref(options.initialState ?? false);
    let stop = () => {};
    onMounted(() => {
        stop = watchIdle((next) => (idle.value = next), { timeout, ...options });
    });
    onDispose(() => stop());
    return idle;
}
