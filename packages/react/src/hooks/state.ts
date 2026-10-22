import {
    historyInit,
    historyPush,
    historyRedo,
    historyUndo,
    inSelection,
    toggleSelection,
    type HistoryState,
} from '@wirecore/wirelayer-recipes';
import { useCallback, useEffect, useRef, useState } from 'react';

/** The latest value of a callback for effects and listeners, without re-subscribing on every render */
export function useLatest<T>(value: T) {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    });
    return ref;
}

export interface UseDisclosureOptions {
    onOpen?: () => void;
    onClose?: () => void;
}

/** Open/closed state of a dialog, drawer, menu …: `const { opened, open, close, toggle } = useDisclosure()` */
export function useDisclosure(initial = false, options: UseDisclosureOptions = {}) {
    const [opened, setOpened] = useState(initial);
    const set = (next: boolean) => {
        if (next === opened) return;
        setOpened(next);
        (next ? options.onOpen : options.onClose)?.();
    };
    return { opened, open: () => set(true), close: () => set(false), toggle: () => set(!opened) };
}

export interface UseStateHistoryOptions {
    /** Most undo steps kept (default 100) */
    limit?: number;
}

/** A value with undo and redo: `set` adds a step, `undo`/`redo` move through them */
export function useStateHistory<T>(initial: T, options: UseStateHistoryOptions = {}) {
    const [history, setHistory] = useState<HistoryState<T>>(() => historyInit(initial));
    const { limit } = options;
    return {
        /** The current value */
        value: history.present,
        /** Past, present and future values */
        history,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        set: useCallback((value: T) => setHistory((current) => historyPush(current, value, limit)), [limit]),
        undo: useCallback((steps = 1) => setHistory((current) => historyUndo(current, steps)), []),
        redo: useCallback((steps = 1) => setHistory((current) => historyRedo(current, steps)), []),
        /** Starts over with a value (default: the initial one) */
        reset: useCallback((value?: T) => setHistory(historyInit(value === undefined ? initial : value)), [initial]),
    };
}

export interface UseSelectionOptions<T> {
    /** Several items (default) or one */
    multiple?: boolean;
    /** Identity of an item (default: the item itself), e.g. `(row) => row.id` */
    key?: (item: T) => unknown;
    /** Selected at the start */
    initial?: T[];
}

/** Selected items of a list: toggle, select all, clear – with "all"/"some" for a header checkbox */
export function useSelection<T>(items: readonly T[], options: UseSelectionOptions<T> = {}) {
    const [selected, setSelected] = useState<T[]>(() => [...(options.initial ?? [])]);
    const key = options.key ?? ((item: T) => item);
    const { multiple } = options;
    const isSelected = (item: T) => inSelection(selected, item, key);
    const allSelected = items.length > 0 && items.every(isSelected);
    return {
        selected,
        isSelected,
        allSelected,
        someSelected: selected.length > 0 && !allSelected,
        toggle: (item: T) => setSelected((current) => toggleSelection(current, item, { multiple, key })),
        select: (item: T) =>
            setSelected((current) =>
                inSelection(current, item, key) ? current : multiple === false ? [item] : [...current, item]
            ),
        deselect: (item: T) => setSelected((current) => current.filter((entry) => !Object.is(key(entry), key(item)))),
        selectAll: () => {
            if (multiple !== false) setSelected([...items]);
        },
        clear: () => setSelected([]),
        setSelected: (next: T[]) => setSelected([...next]),
    };
}
