import { clampDialogOffset, dialogMoveForKey } from '@wirecore/wirelayer-recipes';
import { computed, ref, type Ref } from 'vue';

/**
 * Moves a dialog by dragging its header (pointer) or with Alt + arrow keys anywhere inside it (keyboard).
 * The offset is a `translate` on the content; it stays on screen and resets with `reset()`.
 */
export function useDialogDrag(enabled: () => boolean) {
    const offset: Ref<{ x: number; y: number }> = ref({ x: 0, y: 0 });
    let drag: { id: number; x: number; y: number; origin: { x: number; y: number }; content: HTMLElement } | null =
        null;

    const moveTo = (next: { x: number; y: number }, content: HTMLElement) => {
        const rect = content.getBoundingClientRect();
        const base = {
            x: rect.x - offset.value.x,
            y: rect.y - offset.value.y,
            width: rect.width,
            height: rect.height,
        };
        offset.value = clampDialogOffset(next, base, { width: innerWidth, height: innerHeight });
    };

    function onPointerDown(event: PointerEvent) {
        const header = event.currentTarget as HTMLElement;
        // Buttons in the header (close, maximize) keep working
        if (!enabled() || event.button !== 0 || (event.target as Element).closest('button, a, input')) return;
        const content = header.closest<HTMLElement>('[data-part=content]');
        if (!content) return;
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: { ...offset.value }, content };
        header.setPointerCapture?.(event.pointerId);
        event.preventDefault();
    }
    function onPointerMove(event: PointerEvent) {
        if (!drag || event.pointerId !== drag.id) return;
        moveTo({ x: drag.origin.x + event.clientX - drag.x, y: drag.origin.y + event.clientY - drag.y }, drag.content);
    }
    function onPointerUp() {
        drag = null;
    }
    function onKeyDown(event: KeyboardEvent) {
        if (!enabled()) return;
        const move = dialogMoveForKey(event);
        if (!move) return;
        event.preventDefault();
        moveTo({ x: offset.value.x + move.x, y: offset.value.y + move.y }, event.currentTarget as HTMLElement);
    }

    /** Only set once moved, so an unmoved dialog has no style attribute */
    const style = computed(() =>
        enabled() && (offset.value.x || offset.value.y)
            ? { translate: `${offset.value.x}px ${offset.value.y}px` }
            : undefined
    );
    const reset = () => {
        offset.value = { x: 0, y: 0 };
    };
    return {
        style,
        reset,
        /** Listeners for the header (v-on) */
        header: {
            pointerdown: onPointerDown,
            pointermove: onPointerMove,
            pointerup: onPointerUp,
            pointercancel: onPointerUp,
        },
        onKeyDown,
    };
}
