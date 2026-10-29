import { matchesMedia, watchMedia } from '@wirecore/wirelayer-recipes';
import { colors, resolveTokens, watchTokens, type ColorSet } from '@wirecore/wirelayer-tokens';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

export interface UseMediaQueryOptions {
    /** Value on the server and during hydration (default false) */
    initialValue?: boolean;
}

/** Whether a media query matches, e.g. `useMediaQuery('(min-width: 768px)')` – updates when it changes */
export function useMediaQuery(query: string, options: UseMediaQueryOptions = {}): boolean {
    const subscribe = useCallback((notify: () => void) => watchMedia(query, notify), [query]);
    const initial = options.initialValue ?? false;
    return useSyncExternalStore(
        subscribe,
        () => matchesMedia(query),
        () => initial
    );
}

/** Whether the user asked for less motion (prefers-reduced-motion: reduce) */
export function useReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** The colour scheme of the system: 'light' or 'dark' ('light' on the server) */
export function useColorScheme(initialValue: 'light' | 'dark' = 'light'): 'light' | 'dark' {
    return useMediaQuery('(prefers-color-scheme: dark)', { initialValue: initialValue === 'dark' }) ? 'dark' : 'light';
}

/**
 * The token colours as fixed values (hex, see resolveTokens) – for canvas libraries like xterm.js that cannot read CSS
 * variables; new values when the mode, the theme or the system colour scheme changes. On the server: the light base
 * colours as written
 */
export function useResolvedTokens(): ColorSet {
    const [tokens, setTokens] = useState(() => (typeof document === 'undefined' ? colors.light : resolveTokens()));
    useEffect(() => {
        setTokens(resolveTokens());
        return watchTokens(() => setTokens(resolveTokens()));
    }, []);
    return tokens;
}
