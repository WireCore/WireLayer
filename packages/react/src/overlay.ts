import { anchorBox, toOverlayAnchor, type OverlayAnchor, type OverlayHandle } from '@wirecore/wirelayer-recipes';
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref, type RefObject } from 'react';

/** An anchor element, a ref to one, or a point */
export type AnchorProp = OverlayAnchor | RefObject<Element | null> | null;

const resolve = (anchor: AnchorProp | undefined): OverlayAnchor | null =>
    anchor && 'current' in anchor ? anchor.current : (anchor ?? null);

// Layout effects only run in the browser; on the server a plain effect (that never runs) avoids React's warning
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

interface PositioningBase {
    placement?: string;
    gutter?: number;
    sameWidth?: boolean;
}

/**
 * Open state and anchor of a popup that opens from its trigger, from the `anchor` prop or imperatively with
 * `ref.current.open(anchor)` (OverlayHandle). Ark gets the anchor as `getAnchorElement`/`getAnchorRect`; after an
 * anchored open the focus returns to what had it before.
 */
export function useAnchoredOverlay(options: {
    open: boolean | undefined;
    defaultOpen?: boolean;
    anchor: AnchorProp | undefined;
    onOpenChange?: (open: boolean) => void;
    ref: Ref<OverlayHandle> | undefined;
    /**
     * Menus have no finalFocusEl: when the focus is lost after closing (anchored menus, controlled state), it goes back
     * to where it was before opening
     */
    restoreFocus?: boolean;
}) {
    const [internal, setInternal] = useState(options.defaultOpen ?? false);
    const [imperative, setImperative] = useState<OverlayAnchor | null>(null);
    const isOpen = options.open ?? internal;
    const anchor = imperative ?? resolve(options.anchor);
    const returnFocus = useRef<HTMLElement | null>(null);
    const anchored = useRef(false);
    anchored.current = !!anchor;

    // Before the popup takes the focus: remember where it was; after closing an anchored menu bring it back
    const wasOpen = useRef(isOpen);
    useBrowserLayoutEffect(() => {
        if (wasOpen.current === isOpen) return;
        wasOpen.current = isOpen;
        if (isOpen) returnFocus.current = document.activeElement as HTMLElement | null;
        else if (options.restoreFocus) {
            const target = returnFocus.current;
            // Lost focus: on the page, gone with the menu, or still in the closing menu (removed a moment later)
            const restore = () => {
                // Opened again in the meantime: the focus belongs to the new popup
                if (wasOpen.current) return;
                const active = document.activeElement;
                if (!active || active === document.body || !active.isConnected || active.closest('[data-scope=menu]'))
                    target?.focus();
            };
            requestAnimationFrame(() => {
                restore();
                setTimeout(restore, 50);
            });
        }
    }, [isOpen]);

    const setOpen = (next: boolean) => {
        setInternal(next);
        options.onOpenChange?.(next);
    };
    /** Open changes from Ark (trigger, Escape, outside click): a trigger click opens at the trigger again */
    const onOpenChange = (next: boolean) => {
        if (next) setImperative(null);
        setOpen(next);
    };
    const handle: OverlayHandle = {
        open(target) {
            setImperative(toOverlayAnchor(target));
            setOpen(true);
        },
        close: () => setOpen(false),
        toggle(target) {
            if (isOpen) handle.close();
            else handle.open(target);
        },
    };
    useImperativeHandle(options.ref, () => handle);

    /** Ark's positioning with the anchor: an element is tracked as it moves, a point is an empty box */
    const positioning = <T extends PositioningBase>(base: T) => {
        if (!anchor) return base;
        if ('getBoundingClientRect' in anchor) return { ...base, getAnchorElement: () => anchor as HTMLElement };
        return { ...base, getAnchorRect: () => anchorBox(anchor) };
    };
    /** Menus take a point as `anchorPoint` (their own positioning ignores getAnchorRect) */
    const anchorPoint = anchor && !('getBoundingClientRect' in anchor) ? anchor : undefined;
    /** Where the focus goes when closing an anchored popup: what had it before (else Ark's default: the trigger) */
    const finalFocusEl = () => (anchored.current ? returnFocus.current : null);
    return { isOpen, anchor, anchorPoint, onOpenChange, handle, positioning, finalFocusEl };
}
