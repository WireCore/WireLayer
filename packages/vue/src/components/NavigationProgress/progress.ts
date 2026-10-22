import { ref } from 'vue';

/** 0–100 while loading, null when idle */
export const navigationProgressValue = ref<number | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

/** Controls the app-wide <NavigationProgress />, e.g. from router hooks */
export const navigationProgress = {
    /** Starts and creeps towards 90 % until done() */
    start() {
        clearInterval(timer);
        navigationProgressValue.value = 10;
        timer = setInterval(() => {
            const value = navigationProgressValue.value ?? 10;
            navigationProgressValue.value = value + (90 - value) * 0.1;
        }, 300);
    },
    set(value: number) {
        navigationProgressValue.value = Math.max(0, Math.min(100, value));
    },
    /** Fills the bar, then hides it */
    done() {
        clearInterval(timer);
        navigationProgressValue.value = 100;
        setTimeout(() => (navigationProgressValue.value = null), 300);
    },
};
