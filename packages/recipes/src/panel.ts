// Keyboard for FloatingPanel: Alt+arrows move the window, Alt+Shift+arrows change its size.

export interface PanelRect {
    position: { x: number; y: number };
    size: { width: number; height: number };
}

const directions: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
};

/**
 * The new position or size for a key: Alt+arrow moves by `step` px, Alt+Shift+arrow resizes (right/down grow,
 * left/up shrink) within `minSize`/`maxSize`. Undefined for other keys.
 */
export function panelRectForKey(
    event: { key: string; altKey: boolean; shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean },
    rect: PanelRect,
    options: {
        step?: number;
        minSize?: { width: number; height: number };
        maxSize?: { width: number; height: number };
        rtl?: boolean;
    } = {}
): Partial<PanelRect> | undefined {
    const direction = directions[event.key];
    if (!direction || !event.altKey || event.ctrlKey || event.metaKey) return undefined;
    const step = options.step ?? 10;
    const [dx, dy] = direction;
    const x = options.rtl ? -dx : dx;
    if (!event.shiftKey) return { position: { x: rect.position.x + x * step, y: rect.position.y + dy * step } };
    const min = options.minSize ?? { width: 0, height: 0 };
    const max = options.maxSize ?? { width: Infinity, height: Infinity };
    const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
    return {
        size: {
            width: clamp(rect.size.width + x * step, min.width, max.width),
            height: clamp(rect.size.height + dy * step, min.height, max.height),
        },
    };
}
