import {
    hotkeyRegistry,
    isApplePlatform,
    setupLandmarkNavigation,
    type HotkeyEntry,
    type HotkeyOptions,
    type HotkeyRegistry,
    type LandmarkNavigationOptions,
} from '@wirecore/wirelayer-recipes';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

/** One shortcut for useHotkeys: [hotkey, handler, options] */
export type HotkeyItem = [hotkey: string, handler: (event: KeyboardEvent) => void, options?: HotkeyOptions];

export interface UseHotkeysOptions extends HotkeyOptions {
    /** Another registry than the page's (tests, isolated widgets) */
    registry?: HotkeyRegistry;
}

/**
 * Shortcuts while the component is mounted: `useHotkeys([['mod+k', openSearch, { description: 'Open search' }],
 * ['g i', goToInbox]])`. "mod" is Strg or ⌘; space separates the steps of a sequence. Plain keys do not fire while
 * typing in a field (see `enableInInputs`); every entry shows up in the HotkeysDialog when it has a description.
 * `options` apply to all entries (an entry's own options win). Handlers may change on every render.
 */
export function useHotkeys(items: HotkeyItem[], options: UseHotkeysOptions = {}) {
    const handlers = useRef(items.map(([, handler]) => handler));
    useEffect(() => {
        handlers.current = items.map(([, handler]) => handler);
    });
    // Re-registered only when a shortcut or an option changes, not for new handler functions
    const { registry = hotkeyRegistry, ...shared } = options;
    const signature = JSON.stringify([items.map(([hotkey, , own]) => [hotkey, own ?? {}]), shared]);
    useEffect(() => {
        const [entries, common] = JSON.parse(signature) as [[string, HotkeyOptions][], HotkeyOptions];
        const release = entries.map(([hotkey, own], index) =>
            registry.register(hotkey, (event) => handlers.current[index]?.(event), { ...common, ...own })
        );
        return () => {
            for (const stop of release) stop();
        };
    }, [signature, registry]);
}

/** One shortcut while mounted: `useHotkey('?', openHelp, { description: 'Help' })` */
export function useHotkey(hotkey: string, handler: (event: KeyboardEvent) => void, options: UseHotkeysOptions = {}) {
    useHotkeys([[hotkey, handler]], options);
}

const noEntries: HotkeyEntry[] = [];

/** The registered shortcuts (enabled, with a description), updated as components register them */
export function useRegisteredHotkeys(registry: HotkeyRegistry = hotkeyRegistry): HotkeyEntry[] {
    const cache = useRef<{ version: number; entries: HotkeyEntry[] }>({ version: -1, entries: noEntries });
    const subscribe = useCallback((notify: () => void) => registry.subscribe(notify), [registry]);
    return useSyncExternalStore(
        subscribe,
        () => {
            if (cache.current.version !== registry.version)
                cache.current = { version: registry.version, entries: registry.list() };
            return cache.current.entries;
        },
        () => noEntries
    );
}

const noSubscribe = () => () => {};

/** Whether the device is an Apple one (⌘ instead of Strg) – false on the server and during hydration */
export function useIsApple(): boolean {
    return useSyncExternalStore(noSubscribe, isApplePlatform, () => false);
}

/** F6 / Shift+F6 jump between the landmarks of the page while mounted (header, navigation, main, aside, toasts …) */
export function useLandmarks(options: LandmarkNavigationOptions & { enabled?: boolean } = {}) {
    const { selector, key, enabled = true } = options;
    useEffect(() => (enabled ? setupLandmarkNavigation({ selector, key }) : undefined), [selector, key, enabled]);
}
