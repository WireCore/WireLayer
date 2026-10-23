import { anchorBox, toOverlayAnchor, type OverlayAnchor, type OverlayHandle } from '@wirecore/wirelayer-recipes';
import { computed, ref, shallowRef, watch } from 'vue';

interface PositioningBase {
    placement?: string;
    gutter?: number;
    sameWidth?: boolean;
}

/**
 * Open state and anchor of a popup that opens from its trigger, from the `anchor` prop or imperatively with
 * `open(anchor)` (exposed as OverlayHandle). Ark gets the anchor as `getAnchorRect`; after an imperative open the
 * focus returns to what had it before.
 */
export function useAnchoredOverlay(options: {
    open: () => boolean | undefined;
    defaultOpen?: () => boolean | undefined;
    anchor: () => OverlayAnchor | null | undefined;
    onOpenChange: (open: boolean) => void;
    /**
     * Menus have no finalFocusEl: when the focus is lost after closing (anchored menus, controlled state), it goes back
     * to where it was before opening
     */
    restoreFocus?: boolean;
}) {
    const internal = ref(options.defaultOpen?.() ?? false);
    const imperative = shallowRef<OverlayAnchor | null>(null);
    let returnFocus: HTMLElement | null = null;
    const isOpen = computed(() => options.open() ?? internal.value);
    const anchor = computed(() => imperative.value ?? options.anchor() ?? null);
    // Before the popup takes the focus: remember where it was
    watch(isOpen, (open) => {
        if (typeof document === 'undefined') return;
        if (open) returnFocus = document.activeElement as HTMLElement | null;
        else if (options.restoreFocus) {
            const target = returnFocus;
            // Lost focus: on the page, gone with the menu, or still in the closing menu (removed a moment later)
            const restore = () => {
                // Opened again in the meantime: the focus belongs to the new popup
                if (isOpen.value) return;
                const active = document.activeElement;
                if (!active || active === document.body || !active.isConnected || active.closest('[data-scope=menu]'))
                    target?.focus();
            };
            requestAnimationFrame(() => {
                restore();
                setTimeout(restore, 50);
            });
        }
    });

    const setOpen = (next: boolean) => {
        internal.value = next;
        options.onOpenChange(next);
    };
    /** Open changes from Ark (trigger, Escape, outside click): a trigger click opens at the trigger again */
    const onOpenChange = (next: boolean) => {
        if (next) imperative.value = null;
        setOpen(next);
    };
    const handle: OverlayHandle = {
        open(target) {
            imperative.value = toOverlayAnchor(target);
            setOpen(true);
        },
        close: () => setOpen(false),
        toggle(target) {
            if (isOpen.value) handle.close();
            else handle.open(target);
        },
    };
    /** Ark's positioning with the anchor: an element is tracked as it moves, a point is an empty box */
    const positioning = <T extends PositioningBase>(base: T) => {
        const target = anchor.value;
        if (!target) return base;
        if ('getBoundingClientRect' in target) return { ...base, getAnchorElement: () => target as HTMLElement };
        return { ...base, getAnchorRect: () => anchorBox(target) };
    };
    /** Menus take a point as `anchorPoint` (their own positioning ignores getAnchorRect) */
    const anchorPoint = computed(() =>
        anchor.value && !('getBoundingClientRect' in anchor.value) ? anchor.value : undefined
    );
    /** Where the focus goes when closing an anchored popup: what had it before (else Ark's default: the trigger) */
    const finalFocusEl = () => (anchor.value ? returnFocus : null);
    return { isOpen, anchor, anchorPoint, onOpenChange, handle, positioning, finalFocusEl };
}
