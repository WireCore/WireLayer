// Composables of @wirecore/wirelayer-vue – the same names as the hooks of @wirecore/wirelayer-react; logic shared in @wirecore/wirelayer-recipes
export {
    useClipboard,
    useDocumentTitle,
    useDocumentVisibility,
    useEyeDropper,
    useFileDialog,
    useFullscreen,
    useNetwork,
} from './browser.js';
export { useFocusReturn, useFocusTrap, useLongPress } from './focus.js';
export {
    useHotkey,
    useHotkeys,
    useIsApple,
    useLandmarks,
    useRegisteredHotkeys,
    type HotkeyItem,
    type UseHotkeysOptions,
} from './hotkeys.js';
export { useColorScheme, useMediaQuery, useReducedMotion, type UseMediaQueryOptions } from './media.js';
export {
    useElementSize,
    useHeadroom,
    useInViewport,
    useIntersection,
    useResizeObserver,
    useScrollSpy,
    useWindowScroll,
} from './observers.js';
export {
    useDisclosure,
    useSelection,
    useStateHistory,
    type UseDisclosureOptions,
    type UseSelectionOptions,
    type UseStateHistoryOptions,
} from './state.js';
export { useLocalStorage, useSessionStorage } from './storage.js';
export {
    useDebouncedCallback,
    useDebouncedValue,
    useIdle,
    useInterval,
    useThrottledCallback,
    useTimeout,
    type UseIdleOptions,
} from './timing.js';
