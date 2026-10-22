// Ordering on touch screens (React Native OrderList, Sortable and Kanban): the move steps of the buttons and screen
// reader actions, and where a dragged row lands – computed from the measured rows, without the DOM.

/** Move steps of the buttons and screen reader actions: to the start, one up, one down, to the end */
export type OrderStep = 'top' | 'up' | 'down' | 'bottom';

/** Index the item at `index` of `count` items goes to with a step (clamped to the list) */
export function orderStepTarget(step: OrderStep, index: number, count: number): number {
    const last = Math.max(0, count - 1);
    if (step === 'top') return 0;
    if (step === 'bottom') return last;
    return Math.max(0, Math.min(last, index + (step === 'up' ? -1 : 1)));
}

/** The steps that move the item at `index` – none towards an end it is at already */
export function orderSteps(index: number, count: number): OrderStep[] {
    if (index < 0 || index >= count) return [];
    const steps: OrderStep[] = [];
    if (index > 0) steps.push('top', 'up');
    if (index < count - 1) steps.push('down', 'bottom');
    return steps;
}

/** Place of a row along its list, as measured (React Native onLayout: y and height, x and width horizontally) */
export interface OrderSlot {
    start: number;
    size: number;
}

/**
 * Index a dragged row lands on: it passes every row whose middle its own middle has crossed. `delta` is how far it
 * was dragged along the list (negative: up or to the start).
 */
export function sortableDropIndex(slots: readonly OrderSlot[], from: number, delta: number): number {
    const dragged = slots[from];
    if (!dragged) return from;
    const middle = dragged.start + dragged.size / 2 + delta;
    let target = from;
    slots.forEach((slot, index) => {
        const slotMiddle = slot.start + slot.size / 2;
        if (index > from && slotMiddle < middle) target++;
        if (index < from && slotMiddle > middle) target--;
    });
    return target;
}

/**
 * How far the row at `index` moves aside while the row at `from` is dragged to `target`: by the size of the dragged
 * row and the gap next to it – up for the rows it passed downwards, down for the rows it passed upwards.
 */
export function sortableShift(slots: readonly OrderSlot[], from: number, target: number, index: number): number {
    const dragged = slots[from];
    if (!dragged || index === from) return 0;
    if (from < target && index > from && index <= target) {
        const next = slots[from + 1];
        return -(next ? next.start - dragged.start : dragged.size);
    }
    if (target < from && index >= target && index < from) {
        const previous = slots[from - 1];
        const gap = previous ? Math.max(0, dragged.start - (previous.start + previous.size)) : 0;
        return dragged.size + gap;
    }
    return 0;
}
