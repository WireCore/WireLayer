import { useSyncExternalStore } from 'react';

const noSubscribe = () => () => {};

/**
 * Raw localStorage entry under `key` – null on the server and during hydration (the first render matches the
 * server), the stored text after that. Changes made by the component itself are kept in its own state.
 */
export function useStoredText(key: string | undefined): string | null {
    return useSyncExternalStore(
        noSubscribe,
        () => {
            if (!key) return null;
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        },
        () => null
    );
}

/** The parsed JSON of `useStoredText` (undefined without a valid entry) */
export function parseStored<T>(text: string | null): T | undefined {
    if (text === null) return undefined;
    try {
        return JSON.parse(text) as T;
    } catch {
        return undefined;
    }
}
