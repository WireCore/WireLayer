import { readStorage, watchStorage, writeStorage, type StorageKind } from '@wirecore/wirelayer-recipes';
import { useCallback, useSyncExternalStore } from 'react';

const noValue = () => null;

function useStorage<T>(
    kind: StorageKind,
    key: string,
    defaultValue: T
): [value: T, setValue: (value: T | ((current: T) => T)) => void, removeValue: () => void] {
    const subscribe = useCallback((notify: () => void) => watchStorage(kind, key, notify), [kind, key]);
    // The raw text is the snapshot (stable between reads); null on the server and during hydration
    const raw = useSyncExternalStore(
        subscribe,
        () => {
            try {
                return (kind === 'local' ? localStorage : sessionStorage).getItem(key);
            } catch {
                return null;
            }
        },
        noValue
    );
    let value = defaultValue;
    if (raw !== null) {
        try {
            value = JSON.parse(raw) as T;
        } catch {
            value = defaultValue;
        }
    }
    const setValue = useCallback(
        (next: T | ((current: T) => T)) => {
            const current = readStorage<T>(kind, key) ?? defaultValue;
            writeStorage(kind, key, typeof next === 'function' ? (next as (current: T) => T)(current) : next);
        },
        [kind, key, defaultValue]
    );
    const removeValue = useCallback(() => writeStorage(kind, key, undefined), [kind, key]);
    return [value, setValue, removeValue];
}

/**
 * A JSON value in localStorage under `key`: `[value, setValue, removeValue]`. Changes from other tabs and other
 * components arrive; the default on the server and during hydration.
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
    return useStorage('local', key, defaultValue);
}

/** Like useLocalStorage, in sessionStorage (this tab only, gone when it closes) */
export function useSessionStorage<T>(key: string, defaultValue: T) {
    return useStorage('session', key, defaultValue);
}
