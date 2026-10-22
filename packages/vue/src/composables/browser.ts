import {
    copyText,
    enterFullscreen,
    exitFullscreen,
    fullscreenElement,
    isEyeDropperSupported,
    openFileDialog,
    pickScreenColor,
    readNetwork,
    watchNetwork,
    type FileDialogOptions,
    type NetworkState,
} from '@wirecore/wirelayer-recipes';
import { onMounted, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

/** Copies text; `copied` is true for `timeout` ms afterwards (for a "Copied" state), `error` holds a failure */
export function useClipboard(options: { timeout?: number } = {}) {
    const copied = ref(false);
    const error = shallowRef<Error | null>(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = () => {
        clearTimeout(timer);
        copied.value = false;
        error.value = null;
    };
    const copy = async (text: string) => {
        reset();
        try {
            await copyText(text);
            copied.value = true;
            timer = setTimeout(() => (copied.value = false), options.timeout ?? 2000);
        } catch (reason) {
            error.value = reason instanceof Error ? reason : new Error(String(reason));
        }
    };
    onScopeDispose(() => clearTimeout(timer));
    return { copy, copied, error, reset };
}

/** Online state and connection quality (where the browser tells) – online on the server */
export function useNetwork(): Ref<NetworkState> {
    const state = ref<NetworkState>({ online: true });
    let stop = () => {};
    onMounted(() => {
        state.value = readNetwork();
        stop = watchNetwork((next) => (state.value = next));
    });
    onScopeDispose(() => stop());
    return state;
}

/** 'visible' or 'hidden' (another tab, minimised) – 'visible' on the server */
export function useDocumentVisibility(): Ref<DocumentVisibilityState> {
    const visibility = ref<DocumentVisibilityState>('visible');
    const update = () => (visibility.value = document.visibilityState);
    onMounted(() => {
        update();
        document.addEventListener('visibilitychange', update);
    });
    onScopeDispose(() => {
        if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', update);
    });
    return visibility;
}

/**
 * Fullscreen for an element (bind `ref` to it; without one the whole page): `fullscreen` says whether it is shown in
 * fullscreen, `toggle` switches
 */
export function useFullscreen() {
    const target = shallowRef<Element | null>(null);
    const fullscreen = ref(false);
    const update = () => {
        const current = fullscreenElement();
        fullscreen.value = !!current && (!target.value || current === target.value);
    };
    onMounted(() => document.addEventListener('fullscreenchange', update));
    onScopeDispose(() => {
        if (typeof document !== 'undefined') document.removeEventListener('fullscreenchange', update);
    });
    const enter = () => enterFullscreen(target.value);
    const exit = () => exitFullscreen();
    return {
        ref: (element: unknown) => (target.value = (element as Element | null) ?? null),
        fullscreen,
        enter,
        exit,
        toggle: () => (fullscreen.value ? exit() : enter()),
    };
}

/** The EyeDropper API (Chromium): pick a colour anywhere on the screen; `open` resolves with the hex colour or null */
export function useEyeDropper() {
    const supported = ref(false);
    onMounted(() => (supported.value = isEyeDropperSupported()));
    return { supported, open: (signal?: AbortSignal) => pickScreenColor(signal) };
}

/** Opens the system's file dialog; `files` holds the last choice */
export function useFileDialog(options: FileDialogOptions = {}) {
    const files = shallowRef<File[]>([]);
    return {
        files,
        open: async (overrides: FileDialogOptions = {}) => {
            const chosen = await openFileDialog({ ...options, ...overrides });
            if (chosen.length) files.value = chosen;
            return chosen;
        },
        reset: () => (files.value = []),
    };
}

/** Sets the document title while mounted and whenever it changes (restores the previous one with `restore`) */
export function useDocumentTitle(title: MaybeRefOrGetter<string>, options: { restoreOnUnmount?: boolean } = {}) {
    let previous: string | undefined;
    onMounted(() => {
        previous = document.title;
        watch(
            () => toValue(title),
            (next) => {
                if (next) document.title = next;
            },
            { immediate: true }
        );
    });
    onScopeDispose(() => {
        if (options.restoreOnUnmount && previous !== undefined) document.title = previous;
    });
}
