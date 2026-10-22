import {
    orderSteps,
    orderStepTarget,
    sortableDropIndex,
    sortableShift,
    type OrderSlot,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// Ordering in React Native (OrderList, Sortable, Kanban): move steps and dragging from measured rows

describe('order steps', () => {
    it('moves to the start, one up, one down or to the end – clamped to the list', () => {
        expect(orderStepTarget('top', 3, 5)).toBe(0);
        expect(orderStepTarget('up', 3, 5)).toBe(2);
        expect(orderStepTarget('down', 3, 5)).toBe(4);
        expect(orderStepTarget('bottom', 1, 5)).toBe(4);
        expect(orderStepTarget('up', 0, 5)).toBe(0);
        expect(orderStepTarget('down', 4, 5)).toBe(4);
    });

    it('offers only the steps that move the item', () => {
        expect(orderSteps(0, 3)).toEqual(['down', 'bottom']);
        expect(orderSteps(1, 3)).toEqual(['top', 'up', 'down', 'bottom']);
        expect(orderSteps(2, 3)).toEqual(['top', 'up']);
        expect(orderSteps(0, 1)).toEqual([]);
        expect(orderSteps(-1, 3)).toEqual([]);
    });
});

// Four rows of 40 with a gap of 8: they start at 0, 48, 96 and 144
const rows: OrderSlot[] = [0, 48, 96, 144].map((start) => ({ start, size: 40 }));

describe('dragging a row', () => {
    it('lands behind every row whose middle it has passed', () => {
        expect(sortableDropIndex(rows, 0, 0)).toBe(0);
        expect(sortableDropIndex(rows, 0, 40)).toBe(0);
        expect(sortableDropIndex(rows, 0, 49)).toBe(1);
        expect(sortableDropIndex(rows, 0, 200)).toBe(3);
        expect(sortableDropIndex(rows, 3, -49)).toBe(2);
        expect(sortableDropIndex(rows, 3, -500)).toBe(0);
        expect(sortableDropIndex(rows, 7, 20)).toBe(7);
    });

    it('works with rows of different heights', () => {
        const mixed: OrderSlot[] = [
            { start: 0, size: 20 },
            { start: 28, size: 100 },
            { start: 136, size: 20 },
        ];
        // The middle of the first row (10) has to pass the middle of the tall one (78)
        expect(sortableDropIndex(mixed, 0, 60)).toBe(0);
        expect(sortableDropIndex(mixed, 0, 70)).toBe(1);
    });

    it('moves the passed rows aside by the dragged row and its gap', () => {
        // Row 0 dragged to 2: rows 1 and 2 move up, row 3 stays
        expect([1, 2, 3].map((index) => sortableShift(rows, 0, 2, index))).toEqual([-48, -48, 0]);
        // Row 3 dragged to 1: rows 1 and 2 move down, row 0 stays
        expect([0, 1, 2].map((index) => sortableShift(rows, 3, 1, index))).toEqual([0, 48, 48]);
        expect(sortableShift(rows, 2, 2, 1)).toBe(0);
        expect(sortableShift(rows, 0, 2, 0)).toBe(0);
    });
});
