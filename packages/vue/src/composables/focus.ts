import { createLongPress, trapFocus } from '@wirecore/wirelayer-recipes';
import { onMounted, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue';

/** Keeps Tab inside an element while `active` (bind `ref` to it) and focuses its first control */
export function useFocusTrap(active: MaybeRefOrGetter<boolean> = true) {
    const element = shallowRef<HTMLElement | null>(null);
    let release = () => {};
    onMounted(() =>
        watch(
            [element, () => toValue(active)],
            ([target, on]) => {
                release();
                release = () => {};
                if (target && on) release = trapFocus(target);
            },
            { immediate: true }
        )
    );
    onScopeDispose(() => release());
    return {
        ref: (value: unknown) =>
            (element.value = ((value as { $el?: HTMLElement } | null)?.$el ?? value ?? null) as HTMLElement | null),
    };
}

/**
 * Brings the focus back after a panel closes: remembers the focused element when `opened` turns true, focuses it
 * again when it turns false. Returns the function that does it by hand.
 */
export function useFocusReturn(opened: MaybeRefOrGetter<boolean>, options: { shouldReturnFocus?: boolean } = {}) {
    let previous: HTMLElement | null = null;
    const returnFocus = () => {
        if (previous?.isConnected) previous.focus();
    };
    onMounted(() => {
        if (toValue(opened)) previous = document.activeElement as HTMLElement | null;
        watch(
            () => toValue(opened),
            (open) => {
                if (open) previous = document.activeElement as HTMLElement | null;
                else if (options.shouldReturnFocus !== false) setTimeout(returnFocus);
            },
            // Right when `opened` changes – before a focus trap or the panel moves the focus
            { flush: 'sync' }
        );
    });
    return returnFocus;
}

/**
 * Pressing and holding (`delay` ms, default 500) calls `onLongPress` – with mouse, touch and pen. Bind the returned
 * handlers to the element: `v-bind="longPress"`; the click that ends a long press is swallowed.
 */
export function useLongPress(
    onLongPress: (point: { x: number; y: number }) => void,
    options: { delay?: number; tolerance?: number } = {}
) {
    const press = createLongPress(onLongPress, { ...options, mouse: true });
    onScopeDispose(() => press.cancel());
    return {
        onPointerdown: (event: PointerEvent) => press.down(event),
        onPointermove: (event: PointerEvent) => press.move(event),
        onPointerup: () => press.cancel(),
        onPointerleave: () => press.cancel(),
        onPointercancel: () => press.cancel(),
        onClickCapture: (event: MouseEvent) => {
            if (!press.consumeClick()) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        },
    };
}
