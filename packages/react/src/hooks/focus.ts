import { createLongPress, trapFocus } from '@wirecore/wirelayer-recipes';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { useLatest } from './state.js';

// Layout effects only run in the browser; on the server a plain effect (that never runs) avoids React's warning
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** Keeps Tab inside an element while `active` (pass `ref` to it) and focuses its first control */
export function useFocusTrap(active = true) {
    const [element, setElement] = useState<HTMLElement | null>(null);
    useEffect(() => {
        if (!element || !active) return;
        return trapFocus(element);
    }, [element, active]);
    return { ref: setElement };
}

/**
 * Brings the focus back after a panel closes: remembers the focused element when `opened` turns true, focuses it
 * again when it turns false. Returns the function that does it by hand.
 */
export function useFocusReturn(opened: boolean, options: { shouldReturnFocus?: boolean } = {}) {
    const previous = useRef<HTMLElement | null>(null);
    const wasOpen = useRef(opened);
    const { shouldReturnFocus = true } = options;
    const returnFocus = useMemo(
        () => () => {
            if (previous.current?.isConnected) previous.current.focus();
        },
        []
    );
    // A layout effect: runs before a focus trap or the panel moves the focus
    useBrowserLayoutEffect(() => {
        if (opened) previous.current = document.activeElement as HTMLElement | null;
        else if (wasOpen.current && shouldReturnFocus) setTimeout(returnFocus);
        wasOpen.current = opened;
    }, [opened, shouldReturnFocus, returnFocus]);
    return returnFocus;
}

/**
 * Pressing and holding (`delay` ms, default 500) calls `onLongPress` – with mouse, touch and pen. Spread the returned
 * handlers on the element: `<button {...longPress}>`; the click that ends a long press is swallowed.
 */
export function useLongPress(
    onLongPress: (point: { x: number; y: number }) => void,
    options: { delay?: number; tolerance?: number } = {}
) {
    const latest = useLatest(onLongPress);
    const { delay, tolerance } = options;
    const press = useMemo(
        () => createLongPress((point) => latest.current(point), { delay, tolerance, mouse: true }),
        [latest, delay, tolerance]
    );
    useEffect(() => () => press.cancel(), [press]);
    return {
        onPointerDown: (event: PointerEvent) => press.down(event),
        onPointerMove: (event: PointerEvent) => press.move(event),
        onPointerUp: () => press.cancel(),
        onPointerLeave: () => press.cancel(),
        onPointerCancel: () => press.cancel(),
        onClickCapture: (event: MouseEvent) => {
            if (!press.consumeClick()) return;
            event.preventDefault();
            event.stopPropagation();
        },
    };
}
