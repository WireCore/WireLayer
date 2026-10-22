import {
    hotkeyRegistry,
    isApplePlatform,
    setupLandmarkNavigation,
    type HotkeyEntry,
    type HotkeyOptions,
    type HotkeyRegistry,
    type LandmarkNavigationOptions,
} from '@wirecore/wirelayer-recipes';
import { onMounted, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

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
 * `options` apply to all entries (an entry's own options win).
 */
export function useHotkeys(items: MaybeRefOrGetter<HotkeyItem[]>, options: MaybeRefOrGetter<UseHotkeysOptions> = {}) {
    let release: (() => void)[] = [];
    const unregister = () => {
        for (const stop of release) stop();
        release = [];
    };
    const register = () => {
        unregister();
        const { registry = hotkeyRegistry, ...shared } = toValue(options);
        release = toValue(items).map(([hotkey, handler, own]) =>
            registry.register(hotkey, handler, { ...shared, ...own })
        );
    };
    onMounted(() => watch([() => toValue(items), () => toValue(options)], register, { immediate: true, deep: true }));
    onScopeDispose(unregister);
}

/** One shortcut while mounted: `useHotkey('?', openHelp, { description: 'Help' })` */
export function useHotkey(
    hotkey: MaybeRefOrGetter<string>,
    handler: (event: KeyboardEvent) => void,
    options: MaybeRefOrGetter<UseHotkeysOptions> = {}
) {
    useHotkeys(() => [[toValue(hotkey), (event) => handler(event)]], options);
}

/** The registered shortcuts (enabled, with a description), updated as components register them */
export function useRegisteredHotkeys(registry: HotkeyRegistry = hotkeyRegistry): Ref<HotkeyEntry[]> {
    const entries = shallowRef<HotkeyEntry[]>([]);
    let stop = () => {};
    onMounted(() => {
        entries.value = registry.list();
        stop = registry.subscribe(() => (entries.value = registry.list()));
    });
    onScopeDispose(() => stop());
    return entries;
}

/** Whether the device is an Apple one (⌘ instead of Strg) – false on the server and until mounted */
export function useIsApple(): Ref<boolean> {
    const apple = ref(false);
    onMounted(() => (apple.value = isApplePlatform()));
    return apple;
}

/** F6 / Shift+F6 jump between the landmarks of the page while mounted (header, navigation, main, aside, toasts …) */
export function useLandmarks(options: MaybeRefOrGetter<LandmarkNavigationOptions & { enabled?: boolean }> = {}) {
    let stop = () => {};
    onMounted(() =>
        watch(
            () => toValue(options),
            (current) => {
                stop();
                stop = current.enabled === false ? () => {} : setupLandmarkNavigation(current);
            },
            { immediate: true, deep: true }
        )
    );
    onScopeDispose(() => stop());
}
