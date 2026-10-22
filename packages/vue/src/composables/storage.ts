import { readStorage, watchStorage, writeStorage, type StorageKind } from '@wirecore/wirelayer-recipes';
import { customRef, onMounted, onScopeDispose, type Ref } from 'vue';

function useStorage<T>(kind: StorageKind, key: string, defaultValue: T): Ref<T> {
    // The default on the server and during hydration (the first render matches the server), the stored value after
    let stored: T | undefined;
    let mounted = false;
    let trigger = () => {};
    const value = customRef<T>((track, notify) => {
        trigger = notify;
        return {
            get: () => {
                track();
                return mounted && stored !== undefined ? stored : defaultValue;
            },
            set: (next: T) => {
                stored = next;
                writeStorage(kind, key, next);
                notify();
            },
        };
    });
    let stop = () => {};
    onMounted(() => {
        mounted = true;
        stored = readStorage<T>(kind, key);
        trigger();
        stop = watchStorage(kind, key, () => {
            stored = readStorage<T>(kind, key);
            trigger();
        });
    });
    onScopeDispose(() => stop());
    return value;
}

/**
 * A JSON value in localStorage under `key`, as a ref: assigning stores it (undefined removes it), changes from other
 * tabs and other components arrive. The default on the server and until mounted.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
    return useStorage('local', key, defaultValue);
}

/** Like useLocalStorage, in sessionStorage (this tab only, gone when it closes) */
export function useSessionStorage<T>(key: string, defaultValue: T): Ref<T> {
    return useStorage('session', key, defaultValue);
}
