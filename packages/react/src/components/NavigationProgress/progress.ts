/** 0–100 while loading, null when idle */
let value: number | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
const set = (next: number | null) => {
    value = next;
    listeners.forEach((listener) => listener());
};

export const navigationProgressStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    get: () => value,
};

/** Controls the app-wide <NavigationProgress />, e.g. from router events */
export const navigationProgress = {
    /** Starts and creeps towards 90 % until done() */
    start() {
        clearInterval(timer);
        set(10);
        timer = setInterval(() => {
            const current = value ?? 10;
            set(current + (90 - current) * 0.1);
        }, 300);
    },
    set(next: number) {
        set(Math.max(0, Math.min(100, next)));
    },
    /** Fills the bar, then hides it */
    done() {
        clearInterval(timer);
        set(100);
        setTimeout(() => set(null), 300);
    },
};
