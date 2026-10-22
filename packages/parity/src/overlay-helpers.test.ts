import {
    anchorBox,
    clampDialogOffset,
    createLongPress,
    dialogMoveForKey,
    filterMenuEntries,
    isSwipeDismiss,
    matchesHotkey,
    pageForSize,
    rankItems,
    toastDuration,
    toOverlayAnchor,
} from '@wirecore/wirelayer-recipes';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Framework-free helpers of the overlays, menus, toasts, pagination and command palette

const key = (key: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey', boolean>> = {}) => ({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...mods,
});

describe('overlay anchors', () => {
    it('takes elements as they are and pointer events as their point', () => {
        const element = document.createElement('div');
        expect(toOverlayAnchor(element)).toBe(element);
        expect(toOverlayAnchor(null)).toBeNull();
        const click = new MouseEvent('contextmenu', { clientX: 40, clientY: 60, detail: 1 });
        expect(toOverlayAnchor(click)).toEqual({ x: 40, y: 60 });
        expect(anchorBox({ x: 4, y: 5 })).toEqual({ x: 4, y: 5, width: 0, height: 0 });
    });

    it('uses the clicked element for keyboard clicks (no pointer position)', () => {
        const button = document.createElement('button');
        let anchor: unknown;
        button.addEventListener('click', (event) => (anchor = toOverlayAnchor(event)));
        button.dispatchEvent(new MouseEvent('click', { detail: 0 }));
        expect(anchor).toBe(button);
    });
});

describe('dialog dragging', () => {
    const viewport = { width: 1000, height: 800 };
    const base = { x: 300, y: 200, width: 400, height: 300 };

    it('keeps the header on screen and a part of the dialog visible', () => {
        expect(clampDialogOffset({ x: 50, y: -20 }, base, viewport)).toEqual({ x: 50, y: -20 });
        expect(clampDialogOffset({ x: 0, y: -500 }, base, viewport).y).toBe(-200);
        expect(clampDialogOffset({ x: 2000, y: 2000 }, base, viewport)).toEqual({ x: 652, y: 552 });
        expect(clampDialogOffset({ x: -2000, y: 0 }, base, viewport).x).toBe(-652);
    });

    it('moves with Alt + arrow keys, Shift for larger steps', () => {
        expect(dialogMoveForKey(key('ArrowRight', { altKey: true }))).toEqual({ x: 10, y: 0 });
        expect(dialogMoveForKey(key('ArrowUp', { altKey: true, shiftKey: true }))).toEqual({ x: 0, y: -50 });
        expect(dialogMoveForKey(key('ArrowRight'))).toBeNull();
        expect(dialogMoveForKey(key('Enter', { altKey: true }))).toBeNull();
    });
});

describe('long press', () => {
    afterEach(() => vi.useRealTimers());
    const pointer = (pointerType: string, clientX = 10, clientY = 10) => ({ pointerType, clientX, clientY });

    it('fires after holding still with a finger, not with the mouse, and swallows the next click', () => {
        vi.useFakeTimers();
        const onLongPress = vi.fn();
        const press = createLongPress(onLongPress, { delay: 500 });
        press.down(pointer('mouse'));
        vi.advanceTimersByTime(600);
        expect(onLongPress).not.toHaveBeenCalled();
        press.down(pointer('touch'));
        press.move(pointer('touch', 14, 12));
        vi.advanceTimersByTime(499);
        expect(onLongPress).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(onLongPress).toHaveBeenCalledWith({ x: 10, y: 10 });
        expect(press.consumeClick()).toBe(true);
        expect(press.consumeClick()).toBe(false);
    });

    it('moving the finger or lifting it cancels', () => {
        vi.useFakeTimers();
        const onLongPress = vi.fn();
        const press = createLongPress(onLongPress);
        press.down(pointer('touch'));
        press.move(pointer('touch', 40, 10));
        press.down(pointer('pen'));
        press.cancel();
        vi.advanceTimersByTime(1000);
        expect(onLongPress).not.toHaveBeenCalled();
    });
});

describe('toasts', () => {
    it('closes when swiped far enough', () => {
        expect(isSwipeDismiss(90, 360)).toBe(true);
        expect(isSwipeDismiss(-90, 360)).toBe(true);
        expect(isSwipeDismiss(60, 360)).toBe(false);
        expect(isSwipeDismiss(60, 140)).toBe(true);
    });

    it('stays with an action (WCAG 2.2.1), otherwise 6 seconds', () => {
        expect(toastDuration({})).toBe(6000);
        expect(toastDuration({ action: { label: 'Undo' } })).toBe(Infinity);
        expect(toastDuration({ duration: 2000, action: {} })).toBe(2000);
    });
});

describe('hotkeys', () => {
    it('mod is Ctrl or ⌘; other modifiers must match', () => {
        expect(matchesHotkey(key('k', { ctrlKey: true }), 'mod+k')).toBe(true);
        expect(matchesHotkey(key('K', { metaKey: true }), 'mod+k')).toBe(true);
        expect(matchesHotkey(key('k'), 'mod+k')).toBe(false);
        expect(matchesHotkey(key('k', { ctrlKey: true, altKey: true }), 'mod+k')).toBe(false);
        expect(matchesHotkey(key('p', { altKey: true, shiftKey: true }), 'alt+shift+p')).toBe(true);
        expect(matchesHotkey(key('P', { ctrlKey: true, shiftKey: true }), 'mod+p')).toBe(false);
    });

    it('single keys do not fire while typing in a field', () => {
        const input = document.createElement('input');
        expect(matchesHotkey(key('/'), '/')).toBe(true);
        expect(matchesHotkey({ ...key('/'), target: input }, '/')).toBe(false);
        expect(matchesHotkey({ ...key('k', { ctrlKey: true }), target: input }, 'mod+k')).toBe(true);
        expect(matchesHotkey(key('?', { shiftKey: true }), '?')).toBe(true);
    });
});

describe('rankItems', () => {
    it('drops items without score, sorts by score (stable) and limits', () => {
        const items = ['a', 'bb', 'cc', 'ddd'];
        expect(rankItems(items, (item) => item.length > 1)).toEqual(['bb', 'cc', 'ddd']);
        expect(rankItems(items, (item) => item.length)).toEqual(['ddd', 'bb', 'cc', 'a']);
        expect(rankItems(items, (item) => item.length, 2)).toEqual(['ddd', 'bb']);
        expect(rankItems(items, () => 0)).toEqual([]);
    });
});

describe('filterMenuEntries', () => {
    const entries = [
        { value: 'copy', label: 'Copy' },
        { type: 'separator' },
        {
            type: 'group',
            label: 'Server',
            items: [
                { value: 'restart', label: 'Restart' },
                { value: 'stop', label: 'Stop' },
            ],
        },
        { type: 'radio', name: 'sort', items: [{ value: 'name', label: 'Name' }] },
        { value: 'move', label: 'Move', children: [{ value: 'fra', label: 'Frankfurt' }] },
    ];
    const has = (text: string) => (label: string) => label.toLowerCase().includes(text);

    it('keeps groups with matching items, submenus with matching entries, drops separators', () => {
        expect(filterMenuEntries(entries, has('stop'))).toEqual([
            { type: 'group', label: 'Server', items: [{ value: 'stop', label: 'Stop' }] },
        ]);
        expect(filterMenuEntries(entries, has('frank'))).toEqual([
            { value: 'move', label: 'Move', children: [{ value: 'fra', label: 'Frankfurt' }] },
        ]);
        expect(filterMenuEntries(entries, has('name'))).toHaveLength(1);
        expect(filterMenuEntries(entries, has('xyz'))).toEqual([]);
    });
});

describe('pageForSize', () => {
    it('keeps the first item of the page in view', () => {
        expect(pageForSize(3, 10, 25)).toBe(1);
        expect(pageForSize(4, 10, 25)).toBe(2);
        expect(pageForSize(2, 25, 10)).toBe(3);
        expect(pageForSize(1, 10, 50)).toBe(1);
    });
});
