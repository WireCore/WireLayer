import { matchesMedia, watchMedia } from '@wirecore/wirelayer-recipes';
import { colors, resolveTokens, watchTokens, type ColorSet } from '@wirecore/wirelayer-tokens';
import {
    computed,
    onMounted,
    onScopeDispose,
    ref,
    shallowRef,
    toValue,
    watch,
    type MaybeRefOrGetter,
    type Ref,
    type ShallowRef,
} from 'vue';

export interface UseMediaQueryOptions {
    /** Value on the server and before mounting (default false) */
    initialValue?: boolean;
}

/** Whether a media query matches, e.g. `useMediaQuery('(min-width: 768px)')` – updates when it changes */
export function useMediaQuery(query: MaybeRefOrGetter<string>, options: UseMediaQueryOptions = {}): Ref<boolean> {
    const matches = ref(options.initialValue ?? false);
    let stop = () => {};
    const start = () => {
        stop();
        const current = toValue(query);
        matches.value = matchesMedia(current);
        stop = watchMedia(current, (next) => (matches.value = next));
    };
    onMounted(() => {
        start();
        watch(() => toValue(query), start);
    });
    onScopeDispose(() => stop());
    return matches;
}

/** Whether the user asked for less motion (prefers-reduced-motion: reduce) */
export function useReducedMotion(): Ref<boolean> {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** The colour scheme of the system: 'light' or 'dark' ('light' on the server) */
export function useColorScheme(initialValue: 'light' | 'dark' = 'light') {
    const dark = useMediaQuery('(prefers-color-scheme: dark)', { initialValue: initialValue === 'dark' });
    return computed<'light' | 'dark'>(() => (dark.value ? 'dark' : 'light'));
}

/**
 * The token colours as fixed values (hex, see resolveTokens) – for canvas libraries like xterm.js that cannot read CSS
 * variables; new values when the mode, the theme or the system colour scheme changes. On the server: the light base
 * colours as written
 */
export function useResolvedTokens(): Readonly<ShallowRef<ColorSet>> {
    const tokens = shallowRef(typeof document === 'undefined' ? colors.light : resolveTokens());
    let stop = () => {};
    onMounted(() => {
        tokens.value = resolveTokens();
        stop = watchTokens(() => (tokens.value = resolveTokens()));
    });
    onScopeDispose(() => stop());
    return tokens;
}
