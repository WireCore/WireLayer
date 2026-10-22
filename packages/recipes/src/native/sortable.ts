import { pressable, tv } from './tv.js';

// Ordering and boards for React Native (RN part 3): OrderList, PickList, Sortable and Kanban. Rows are at least
// 44 pt high; dragging only moves rows with a transform, so the classes stay static.

/** Rows of an OrderList: a radio group, the chosen row is moved with the buttons below */
export const orderList = tv({
    slots: {
        base: 'w-full gap-1.5',
        label: 'font-sans-medium text-[13px] text-fg',
        list: 'max-h-72 overflow-hidden rounded-lg border border-line-strong bg-bg p-1',
        option: [
            'min-h-11 flex-row items-center gap-3 rounded-lg px-3 py-2',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        optionText: 'flex-1 font-sans text-[15px] text-fg',
        check: 'size-[18px] text-fg',
        empty: 'px-3 py-3 font-sans text-[15px] text-muted',
        controls: 'flex-row justify-end gap-1',
    },
    variants: {
        selected: {
            true: { option: 'bg-line' },
        },
    },
});

/** Search field above the lists of OrderList and PickList */
export const listSearch = tv({
    slots: {
        base: 'h-10 w-full flex-row items-stretch overflow-hidden rounded-lg border border-line-strong bg-bg',
        icon: 'ml-3 size-4 shrink-0 self-center text-muted',
        control: 'min-w-0 flex-1 px-3 font-sans text-[15px] text-fg web:outline-none',
    },
});

/** Source and target list of a PickList, one below the other, the move buttons between them */
export const pickList = tv({
    slots: {
        base: 'w-full gap-3',
        section: 'w-full gap-1.5',
        controls: 'flex-row justify-center gap-2',
    },
});

/** Sortable list: every row has a handle (drag after a long press, tap, or the screen reader actions) */
export const sortable = tv({
    slots: {
        base: 'w-full gap-1.5',
        label: 'font-sans-medium text-[13px] text-fg',
        list: 'gap-2',
        item: 'min-h-11 flex-row items-center gap-1 rounded-lg border border-line-2 bg-card pr-3',
        handle: [
            'size-11 shrink-0 items-center justify-center rounded-lg web:cursor-grab web:touch-none',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        handleIcon: 'size-4 text-muted',
        content: 'min-w-0 flex-1 py-2.5',
        text: 'font-sans text-[15px] text-fg',
        empty: 'min-h-11 justify-center rounded-lg border border-dashed border-line-strong px-3 py-3',
        emptyText: 'text-center font-sans text-sm text-muted',
    },
    variants: {
        orientation: {
            vertical: {},
            horizontal: { list: 'flex-row items-stretch' },
        },
        /** Picked up (tap, keyboard) or dragged */
        grabbed: {
            true: { item: 'border-primary bg-bg-2', handleIcon: 'text-fg' },
        },
        /** An item of the group is carried: the empty list takes it */
        target: {
            true: { empty: 'border-primary' },
        },
    },
    defaultVariants: {
        orientation: 'vertical',
    },
});

/** Kanban board: columns side by side in a horizontal scroll view, WIP limit hint per column */
export const kanban = tv({
    slots: {
        base: 'w-full',
        board: 'flex-row items-start gap-3 p-1',
        column: 'w-[280px] gap-2 rounded-xl border border-line-2 bg-bg-2 p-2',
        header: 'min-h-11 flex-row items-center gap-2 pl-1',
        title: 'min-w-0 flex-1 font-sans-semibold text-[15px] text-fg',
        count: 'font-mono text-xs text-muted',
        limit: 'flex-row items-center gap-1.5 rounded-md px-2 py-1.5',
        limitIcon: 'size-3.5',
        limitText: 'min-w-0 flex-1 font-sans text-xs text-fg',
        card: 'min-w-0 flex-1 gap-1',
        cardText: 'font-sans text-[15px] text-fg',
        more: 'self-start',
        /** Action sheet of a card: the columns as radio buttons, the move buttons below */
        option: [
            'min-h-12 flex-row items-center gap-3 rounded-lg px-3',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        optionText: 'flex-1 font-sans text-[15px] text-fg',
        optionCount: 'font-mono text-xs text-muted',
        optionCheck: 'size-[18px] text-fg',
    },
    variants: {
        limitState: {
            within: {},
            reached: {
                column: 'border-warn',
                limit: 'bg-warn/10',
                limitIcon: 'text-warn',
            },
            over: {
                column: 'border-danger',
                count: 'text-danger',
                limit: 'bg-danger/10',
                limitIcon: 'text-danger',
            },
        },
        collapsed: {
            true: { column: 'w-48' },
        },
        selected: {
            true: { option: 'bg-line' },
        },
    },
    defaultVariants: {
        limitState: 'within',
    },
});
