import { toastDuration, type ToastType } from '@wirecore/wirelayer-recipes/native';

export interface ToastOptions {
    title: string;
    description?: string;
    type?: ToastType;
    /** A single action, e.g. "Open" – the toast then stays until dismissed */
    action?: { label: string; onPress: () => void };
    /** Milliseconds; default 6000, without limit when there is an action (WCAG 2.2.1) or while loading */
    duration?: number;
}

export interface ToastItem extends ToastOptions {
    id: number;
    /** Total time it is shown (Infinity: until dismissed) */
    total: number;
    /** The timer stands still (pressed) */
    paused: boolean;
}

/** A text (the title) or the options of the toast */
export type ToastContent = string | Omit<ToastOptions, 'type'>;

export interface ToastPromiseOptions<T> {
    /** Shown while the promise is pending – stays until it settles */
    loading: ToastContent;
    success?: ToastContent | ((value: T) => ToastContent);
    error?: ToastContent | ((error: unknown) => ToastContent);
}

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const timers = new Map<number, { timer?: ReturnType<typeof setTimeout>; start: number; remaining: number }>();

function schedule(id: number, duration: number) {
    clearTimeout(timers.get(id)?.timer);
    if (!Number.isFinite(duration)) {
        timers.delete(id);
        return;
    }
    timers.set(id, { timer: setTimeout(() => dismissToast(id), duration), start: Date.now(), remaining: duration });
}

const durationOf = (options: Partial<ToastOptions>) =>
    options.duration ?? (options.type === 'loading' ? Infinity : toastDuration(options));

export const toastStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    get: () => toasts,
    /** Milliseconds left of a toast with a limit */
    remaining(id: number): number {
        const entry = timers.get(id);
        if (!entry) return Infinity;
        const item = toasts.find((toast) => toast.id === id);
        return item?.paused ? entry.remaining : Math.max(0, entry.remaining - (Date.now() - entry.start));
    },
    /** Stops the timer (while the toast is pressed) */
    pause(id: number) {
        const entry = timers.get(id);
        const item = toasts.find((toast) => toast.id === id);
        if (!entry || !item || item.paused) return;
        clearTimeout(entry.timer);
        timers.set(id, { start: Date.now(), remaining: Math.max(0, entry.remaining - (Date.now() - entry.start)) });
        toasts = toasts.map((toast) => (toast.id === id ? { ...toast, paused: true } : toast));
        emit();
    },
    resume(id: number) {
        const entry = timers.get(id);
        const item = toasts.find((toast) => toast.id === id);
        if (!entry || !item?.paused) return;
        toasts = toasts.map((toast) => (toast.id === id ? { ...toast, paused: false } : toast));
        schedule(id, entry.remaining);
        emit();
    },
};

/** Shows a toast in the app-wide <Toaster />; returns its id */
function show(options: ToastOptions): number {
    const id = nextId++;
    const total = durationOf(options);
    // At most 3 at once – the oldest goes
    const kept = [...toasts, { ...options, id, total, paused: false }];
    for (const removed of kept.slice(0, -3)) dismissToast(removed.id);
    toasts = kept.slice(-3);
    emit();
    schedule(id, total);
    return id;
}

/** Changes a shown toast (e.g. loading → success); the time starts again */
function update(id: number, changes: Partial<ToastOptions>) {
    const item = toasts.find((toast) => toast.id === id);
    if (!item) return;
    const next = { ...item, ...changes };
    const total = changes.duration ?? (next.type === 'loading' ? Infinity : toastDuration(next));
    toasts = toasts.map((toast) => (toast.id === id ? { ...next, total, paused: false } : toast));
    emit();
    schedule(id, total);
}

export function dismissToast(id: number) {
    clearTimeout(timers.get(id)?.timer);
    timers.delete(id);
    if (!toasts.some((toast) => toast.id === id)) return;
    toasts = toasts.filter((item) => item.id !== id);
    emit();
}

const content = (value: ToastContent): Omit<ToastOptions, 'type'> =>
    typeof value === 'string' ? { title: value } : value;

/** toast() with promise, update and dismiss – the same calls as in @wirecore/wirelayer-react */
export interface ToastFunction {
    (options: ToastOptions): number;
    /** Loading toast while the promise is pending, then success or error (each optional) */
    promise<T>(promise: Promise<T> | (() => Promise<T>), options: ToastPromiseOptions<T>): number;
    update(id: number, changes: Partial<ToastOptions>): void;
    /** Closes one toast, without an id all of them */
    dismiss(id?: number): void;
}

export const toast: ToastFunction = Object.assign(show, {
    promise<T>(promise: Promise<T> | (() => Promise<T>), options: ToastPromiseOptions<T>): number {
        const id = show({ ...content(options.loading), type: 'loading' });
        const running = typeof promise === 'function' ? promise() : promise;
        running.then(
            (value) => {
                if (!options.success) return dismissToast(id);
                const result = typeof options.success === 'function' ? options.success(value) : options.success;
                update(id, { duration: undefined, description: undefined, ...content(result), type: 'success' });
            },
            (error: unknown) => {
                if (!options.error) return dismissToast(id);
                const result = typeof options.error === 'function' ? options.error(error) : options.error;
                update(id, { duration: undefined, description: undefined, ...content(result), type: 'error' });
            }
        );
        return id;
    },
    update,
    dismiss(id?: number) {
        if (id === undefined) for (const item of toasts) dismissToast(item.id);
        else dismissToast(id);
    },
});
