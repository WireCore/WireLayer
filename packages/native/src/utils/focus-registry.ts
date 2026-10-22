import { useEffect, type RefObject } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

type Focusable = { focus?: () => void } | null;

// Controls by the id of their Field (Field `id`, FormField `id`) – FormErrorSummary moves the focus there
const registry = new Map<string, RefObject<Focusable>>();

/** Registers the control for `id` while it is mounted */
export function useFocusTarget(id: string | undefined, ref: RefObject<Focusable>) {
    useEffect(() => {
        if (!id) return;
        registry.set(id, ref);
        return () => {
            if (registry.get(id) === ref) registry.delete(id);
        };
    }, [id, ref]);
}

/**
 * Moves the focus to the control of `id`: text fields get the keyboard focus, every control the screen reader focus
 * (iOS/Android); on the web the element with that id. False when nothing has the id.
 */
export function focusControl(id: string): boolean {
    const node = registry.get(id)?.current;
    if (node) {
        node.focus?.();
        if (Platform.OS !== 'web') AccessibilityInfo.sendAccessibilityEvent(node as never, 'focus');
        return true;
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const element = document.getElementById(id);
        if (element) {
            element.focus();
            return true;
        }
    }
    return false;
}

/** Screen reader focus on an element (iOS/Android); keyboard focus on the web */
export function focusElement(node: Focusable) {
    if (!node) return;
    if (Platform.OS === 'web') node.focus?.();
    else AccessibilityInfo.sendAccessibilityEvent(node as never, 'focus');
}
