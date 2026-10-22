import {
    columnVariables,
    createHoverIntent,
    dayLabel,
    groupByDay,
    headroomHidden,
    inSafeTriangle,
    isCurrentLink,
    masonrySpan,
    newestTime,
    newUnread,
    notificationDay,
    notificationTime,
    pointInTriangle,
    readStored,
    resizeForKey,
    speedDialPositions,
    writeStored,
} from '@wirecore/wirelayer-recipes';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Framework-neutral logic of the page shell (@wirecore/wirelayer-recipes, shell-logic.ts)

describe('safe triangle', () => {
    it('point in triangle, edges included', () => {
        const a = { x: 0, y: 0 };
        const b = { x: 10, y: 0 };
        const c = { x: 0, y: 10 };
        expect(pointInTriangle({ x: 2, y: 2 }, a, b, c)).toBe(true);
        expect(pointInTriangle({ x: 5, y: 0 }, a, b, c)).toBe(true);
        expect(pointInTriangle({ x: 8, y: 8 }, a, b, c)).toBe(false);
    });

    it('runs from the apex to the near edge of the panel (below, or beside in LTR and RTL)', () => {
        const panel = { left: 0, top: 100, right: 800, bottom: 400 };
        const apex = { x: 100, y: 40 };
        // Moving diagonally down towards the panel
        expect(inSafeTriangle({ x: 200, y: 60 }, apex, panel, 'bottom')).toBe(true);
        // Moving sideways along the entries
        expect(inSafeTriangle({ x: 300, y: 40 }, apex, panel, 'bottom')).toBe(false);
        const side = { left: 200, top: 0, right: 600, bottom: 300 };
        expect(inSafeTriangle({ x: 150, y: 60 }, { x: 100, y: 50 }, side, 'end')).toBe(true);
        expect(inSafeTriangle({ x: 150, y: 5 }, { x: 100, y: 50 }, side, 'end')).toBe(false);
        // RTL: the panel opens to the left
        const left = { left: 0, top: 0, right: 400, bottom: 300 };
        expect(inSafeTriangle({ x: 450, y: 60 }, { x: 500, y: 50 }, left, 'end', true)).toBe(true);
        expect(inSafeTriangle({ x: 450, y: 5 }, { x: 500, y: 50 }, left, 'end', true)).toBe(false);
    });
});

describe('createHoverIntent', () => {
    afterEach(() => vi.useRealTimers());
    const setup = (panel = { left: 0, top: 100, right: 800, bottom: 400 }) => {
        let value = '';
        const open = vi.fn((next: string) => (value = next));
        const hover = createHoverIntent({
            value: () => value,
            open,
            openDelay: () => 100,
            closeDelay: () => 200,
            panel: () => panel,
            side: () => 'bottom',
            rtl: () => false,
        });
        return {
            hover,
            open,
            get value() {
                return value;
            },
        };
    };

    it('opens after the delay, closes after leaving, re-entering keeps it open', () => {
        vi.useFakeTimers();
        const state = setup();
        state.hover.enter('a', { x: 10, y: 10 });
        vi.advanceTimersByTime(99);
        expect(state.open).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(state.value).toBe('a');
        state.hover.leave('a', { x: 10, y: 50 });
        vi.advanceTimersByTime(150);
        state.hover.enter('a', { x: 10, y: 120 });
        vi.advanceTimersByTime(500);
        expect(state.value).toBe('a');
        state.hover.leave('a', { x: 10, y: 500 });
        vi.advanceTimersByTime(200);
        expect(state.value).toBe('');
    });

    it('a short pass over an entry opens nothing', () => {
        vi.useFakeTimers();
        const state = setup();
        state.hover.enter('a', { x: 10, y: 10 });
        state.hover.leave('a', { x: 10, y: 0 });
        vi.advanceTimersByTime(1000);
        expect(state.open).toHaveBeenCalledWith('');
        expect(state.open).not.toHaveBeenCalledWith('a');
    });

    it('switches between entries at once, but not on the way to the open panel', () => {
        vi.useFakeTimers();
        const state = setup();
        state.hover.enter('a', { x: 100, y: 40 });
        vi.advanceTimersByTime(100);
        // Sideways to b: at once
        state.hover.leave('a', { x: 150, y: 40 });
        state.hover.enter('b', { x: 160, y: 40 });
        expect(state.value).toBe('b');
        // From b diagonally down over c towards b's panel: c waits
        state.hover.leave('b', { x: 200, y: 40 });
        state.hover.enter('c', { x: 260, y: 70 });
        expect(state.value).toBe('b');
        // Leaving the triangle (back up and sideways) switches
        state.hover.move('c', { x: 400, y: 41 });
        expect(state.value).toBe('c');
    });

    it('resting on an entry inside the triangle switches after the delay; cancel stops everything', () => {
        vi.useFakeTimers();
        const state = setup();
        state.hover.enter('a', { x: 100, y: 40 });
        vi.advanceTimersByTime(100);
        state.hover.leave('a', { x: 100, y: 50 });
        state.hover.enter('b', { x: 150, y: 70 });
        vi.advanceTimersByTime(100);
        expect(state.value).toBe('b');
        state.hover.leave('b', { x: 150, y: 500 });
        state.hover.cancel();
        vi.advanceTimersByTime(1000);
        expect(state.value).toBe('b');
    });
});

describe('current link', () => {
    it('own flag, then isCurrent, then the exact href – never a prefix', () => {
        expect(isCurrentLink({ href: '/a', current: false }, '/a')).toBe(false);
        expect(isCurrentLink({ href: '/a' }, '/a')).toBe(true);
        expect(isCurrentLink({ href: '/a' }, '/a/b')).toBe(false);
        expect(isCurrentLink({ href: '/' }, '/a')).toBe(false);
        expect(isCurrentLink({ href: '/a' }, '/b', (link) => link.href === '/a')).toBe(true);
        expect(isCurrentLink({}, undefined)).toBe(false);
    });
});

describe('resize handles and headroom', () => {
    const limits = { min: 200, max: 480 };
    it('arrow keys, Shift, Home/End within the limits', () => {
        expect(resizeForKey('ArrowRight', false, 256, limits, 'ArrowRight')).toBe(272);
        expect(resizeForKey('ArrowLeft', true, 256, limits, 'ArrowRight')).toBe(200);
        expect(resizeForKey('ArrowLeft', false, 256, limits, 'ArrowLeft')).toBe(272);
        expect(resizeForKey('ArrowUp', false, 256, { ...limits, step: 8 }, 'ArrowDown')).toBe(248);
        expect(resizeForKey('Home', false, 256, limits, 'ArrowRight')).toBe(200);
        expect(resizeForKey('End', false, 256, limits, 'ArrowRight')).toBe(480);
        expect(resizeForKey('ArrowRight', true, 470, limits, 'ArrowRight')).toBe(480);
        expect(resizeForKey('Enter', false, 256, limits, 'ArrowRight')).toBeUndefined();
    });

    it('headroom hides on the way down, shows on the way up and at the top', () => {
        expect(headroomHidden(100, 200, false)).toBe(true);
        expect(headroomHidden(200, 150, true)).toBe(false);
        expect(headroomHidden(200, 202, true)).toBe(true);
        expect(headroomHidden(300, 40, true)).toBe(false);
    });
});

describe('stored preferences', () => {
    it('reads back JSON and survives broken entries', () => {
        writeStored('parity-pref', { width: 300 });
        expect(readStored('parity-pref')).toEqual({ width: 300 });
        localStorage.setItem('parity-pref', '{broken');
        expect(readStored('parity-pref')).toBeUndefined();
        expect(readStored(undefined)).toBeUndefined();
        localStorage.removeItem('parity-pref');
    });
});

describe('notification days', () => {
    const now = new Date(2026, 9, 21, 12, 0);
    it('today, yesterday, older in local time, also across months', () => {
        expect(notificationDay(new Date(2026, 9, 21, 0, 1), now)).toBe('today');
        expect(notificationDay(new Date(2026, 9, 20, 23, 59), now)).toBe('yesterday');
        expect(notificationDay(new Date(2026, 9, 19, 23, 59), now)).toBe('older');
        expect(notificationDay(new Date(2026, 8, 30, 10), new Date(2026, 9, 1, 8))).toBe('yesterday');
    });

    it('groups in that order and keeps the order of the items', () => {
        const items = [
            { id: 'c', date: new Date(2026, 9, 1) },
            { id: 'a', date: new Date(2026, 9, 21, 9) },
            { id: 'b', date: new Date(2026, 9, 21, 8) },
        ];
        expect(groupByDay(items, now).map((group) => [group.day, group.items.map((item) => item.id)])).toEqual([
            ['today', ['a', 'b']],
            ['older', ['c']],
        ]);
    });

    it('labels from Intl, capitalised', () => {
        expect(dayLabel('today', 'de-DE', 'Älter')).toBe('Heute');
        expect(dayLabel('yesterday', 'de-DE', 'Älter')).toBe('Gestern');
        expect(dayLabel('yesterday', 'en-US', 'Older')).toBe('Yesterday');
        expect(dayLabel('older', 'en-US', 'Older')).toBe('Older');
        expect(notificationTime(new Date(2026, 9, 21, 9, 5), 'today', 'de-DE')).toBe('09:05');
        expect(notificationTime(new Date(2026, 9, 2), 'older', 'de-DE')).toBe('02.10.2026');
    });

    it('new unread items: not known, newer than before – older pages are not new', () => {
        const known = new Set(['a']);
        const items = [
            { id: 'a', date: '2026-10-21T09:00:00' },
            { id: 'n', date: '2026-10-21T11:00:00' },
            { id: 'r', date: '2026-10-21T11:30:00', read: true },
            { id: 'o', date: '2026-10-01T11:00:00' },
        ];
        const since = newestTime(items.slice(0, 1));
        expect(newUnread(known, items, since).map((item) => item.id)).toEqual(['n']);
        expect(newestTime([])).toBe(-Infinity);
    });
});

describe('speed dial positions', () => {
    it('semicircle opens towards the direction, quarter turns to the start side', () => {
        expect(speedDialPositions(3, 'semicircle', 'up', 100)).toEqual([
            { x: -100, y: 0 },
            { x: 0, y: -100 },
            { x: 100, y: 0 },
        ]);
        expect(speedDialPositions(2, 'quarter', 'up', 100)).toEqual([
            { x: 0, y: -100 },
            { x: -100, y: 0 },
        ]);
        expect(speedDialPositions(2, 'quarter', 'up', 100, true)).toEqual([
            { x: 0, y: -100 },
            { x: 100, y: 0 },
        ]);
    });

    it('circle spreads evenly, starting in the direction', () => {
        expect(speedDialPositions(4, 'circle', 'right', 50)).toEqual([
            { x: 50, y: 0 },
            { x: 0, y: 50 },
            { x: -50, y: 0 },
            { x: 0, y: -50 },
        ]);
    });
});

describe('masonry and columns', () => {
    it('rows a card spans', () => {
        expect(masonrySpan(100, 4, 16)).toBe(29);
        expect(masonrySpan(0, 4, 0)).toBe(1);
    });

    it('column variables per breakpoint', () => {
        expect(columnVariables(3)).toEqual({ '--wc-cols': '3' });
        expect(columnVariables({ base: 1, md: 2, xl: 4 })).toEqual({
            '--wc-cols': '1',
            '--wc-cols-md': '2',
            '--wc-cols-xl': '4',
        });
    });
});
