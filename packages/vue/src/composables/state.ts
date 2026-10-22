import {
    historyInit,
    historyPush,
    historyRedo,
    historyUndo,
    inSelection,
    toggleSelection,
    type HistoryState,
} from '@wirecore/wirelayer-recipes';
import { computed, ref, shallowRef, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue';

export interface UseDisclosureOptions {
    onOpen?: () => void;
    onClose?: () => void;
}

/** Open/closed state of a dialog, drawer, menu …: `const { opened, open, close, toggle } = useDisclosure()` */
export function useDisclosure(initial = false, options: UseDisclosureOptions = {}) {
    const opened = ref(initial);
    const set = (next: boolean) => {
        if (opened.value === next) return;
        opened.value = next;
        (next ? options.onOpen : options.onClose)?.();
    };
    return { opened, open: () => set(true), close: () => set(false), toggle: () => set(!opened.value) };
}

export interface UseStateHistoryOptions {
    /** Most undo steps kept (default 100) */
    limit?: number;
}

/** A value with undo and redo: `set` adds a step, `undo`/`redo` move through them */
export function useStateHistory<T>(initial: T, options: UseStateHistoryOptions = {}) {
    const history = shallowRef<HistoryState<T>>(historyInit(initial));
    return {
        /** The current value */
        value: computed(() => history.value.present) as ComputedRef<T>,
        /** Past, present and future values */
        history: computed(() => history.value),
        canUndo: computed(() => history.value.past.length > 0),
        canRedo: computed(() => history.value.future.length > 0),
        set: (value: T) => (history.value = historyPush(history.value, value, options.limit)),
        undo: (steps = 1) => (history.value = historyUndo(history.value, steps)),
        redo: (steps = 1) => (history.value = historyRedo(history.value, steps)),
        /** Starts over with a value (default: the initial one) */
        reset: (value: T = initial) => (history.value = historyInit(value)),
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
export function useSelection<T>(items: MaybeRefOrGetter<readonly T[]>, options: UseSelectionOptions<T> = {}) {
    const selected = ref([...(options.initial ?? [])]) as Ref<T[]>;
    const key = options.key ?? ((item: T) => item);
    const isSelected = (item: T) => inSelection(selected.value, item, key);
    const allSelected = computed(() => {
        const list = toValue(items);
        return list.length > 0 && list.every(isSelected);
    });
    return {
        selected,
        isSelected,
        allSelected,
        someSelected: computed(() => selected.value.length > 0 && !allSelected.value),
        toggle: (item: T) =>
            (selected.value = toggleSelection(selected.value, item, { multiple: options.multiple, key })),
        select: (item: T) => {
            if (isSelected(item)) return;
            selected.value = options.multiple === false ? [item] : [...selected.value, item];
        },
        deselect: (item: T) => (selected.value = selected.value.filter((entry) => !Object.is(key(entry), key(item)))),
        selectAll: () => {
            if (options.multiple !== false) selected.value = [...toValue(items)];
        },
        clear: () => (selected.value = []),
        setSelected: (next: T[]) => (selected.value = [...next]),
    };
}
