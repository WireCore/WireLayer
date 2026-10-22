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
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** Copies text; `copied` is true for `timeout` ms afterwards (for a "Copied" state), `error` holds a failure */
export function useClipboard(options: { timeout?: number } = {}) {
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);
    const reset = useCallback(() => {
        clearTimeout(timer.current);
        setCopied(false);
        setError(null);
    }, []);
    const { timeout = 2000 } = options;
    const copy = useCallback(
        async (text: string) => {
            reset();
            try {
                await copyText(text);
                setCopied(true);
                timer.current = setTimeout(() => setCopied(false), timeout);
            } catch (reason) {
                setError(reason instanceof Error ? reason : new Error(String(reason)));
            }
        },
        [reset, timeout]
    );
    return { copy, copied, error, reset };
}

const serverNetwork: NetworkState = { online: true };
let lastNetwork: NetworkState = serverNetwork;
/** The same object as long as nothing changed (useSyncExternalStore compares snapshots) */
const networkSnapshot = () => {
    const next = readNetwork();
    const same = (Object.keys(next) as (keyof NetworkState)[]).every((key) => next[key] === lastNetwork[key]);
    if (!same || Object.keys(next).length !== Object.keys(lastNetwork).length) lastNetwork = next;
    return lastNetwork;
};

/** Online state and connection quality (where the browser tells) – online on the server */
export function useNetwork(): NetworkState {
    return useSyncExternalStore(watchNetwork, networkSnapshot, () => serverNetwork);
}

const subscribeVisibility = (notify: () => void) => {
    document.addEventListener('visibilitychange', notify);
    return () => document.removeEventListener('visibilitychange', notify);
};

/** 'visible' or 'hidden' (another tab, minimised) – 'visible' on the server */
export function useDocumentVisibility(): DocumentVisibilityState {
    return useSyncExternalStore(
        subscribeVisibility,
        () => document.visibilityState,
        () => 'visible'
    );
}

const subscribeFullscreen = (notify: () => void) => {
    document.addEventListener('fullscreenchange', notify);
    return () => document.removeEventListener('fullscreenchange', notify);
};

/**
 * Fullscreen for an element (pass `ref` to it; without one the whole page): `fullscreen` says whether it is shown in
 * fullscreen, `toggle` switches
 */
export function useFullscreen() {
    const [target, setTarget] = useState<Element | null>(null);
    const current = useSyncExternalStore(subscribeFullscreen, fullscreenElement, () => null);
    const fullscreen = !!current && (!target || current === target);
    const enter = useCallback(() => enterFullscreen(target), [target]);
    const exit = useCallback(() => exitFullscreen(), []);
    return { ref: setTarget, fullscreen, enter, exit, toggle: () => (fullscreen ? exit() : enter()) };
}

const noSubscribe = () => () => {};

/** The EyeDropper API (Chromium): pick a colour anywhere on the screen; `open` resolves with the hex colour or null */
export function useEyeDropper() {
    const supported = useSyncExternalStore(noSubscribe, isEyeDropperSupported, () => false);
    return { supported, open: useCallback((signal?: AbortSignal) => pickScreenColor(signal), []) };
}

/** Opens the system's file dialog; `files` holds the last choice */
export function useFileDialog(options: FileDialogOptions = {}) {
    const [files, setFiles] = useState<File[]>([]);
    const { accept, multiple, capture, directory } = options;
    const open = useCallback(
        async (overrides: FileDialogOptions = {}) => {
            const chosen = await openFileDialog({ accept, multiple, capture, directory, ...overrides });
            if (chosen.length) setFiles(chosen);
            return chosen;
        },
        [accept, multiple, capture, directory]
    );
    return { files, open, reset: useCallback(() => setFiles([]), []) };
}

/** Sets the document title while mounted and whenever it changes */
export function useDocumentTitle(title: string, options: { restoreOnUnmount?: boolean } = {}) {
    const { restoreOnUnmount } = options;
    useEffect(() => {
        const previous = document.title;
        return () => {
            if (restoreOnUnmount) document.title = previous;
        };
    }, [restoreOnUnmount]);
    useEffect(() => {
        if (title) document.title = title;
    }, [title]);
}
