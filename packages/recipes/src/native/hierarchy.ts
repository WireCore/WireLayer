import { pressable, tv } from './tv.js';

// Hierarchical data for React Native (RN part 3): tree, tree select, cascade select and org chart.
// A tree is a flat list of rows; the component indents each row by its level (style), touch targets are 44 pt.

export const tree = tv({
    slots: {
        base: 'w-full gap-1.5',
        label: 'font-sans-medium text-[13px] text-fg',
        /** Search field and expand/collapse buttons above the tree */
        toolbar: 'flex-row flex-wrap items-center gap-1.5',
        /** Extra classes of the search field (input recipe): a line of its own, the buttons wrap below it */
        search: 'w-full',
        list: 'py-1',
        /** One row: the component indents it per level (a spacer) */
        row: 'relative min-h-11 flex-row items-center',
        /** A row that is one button (a branch that cannot be chosen): opens and closes it */
        rowButton: ['rounded-md', pressable, 'active:bg-line active:opacity-100'],
        /** Chevron button of a branch: 36 pt wide plus hitSlop, as high as the row */
        toggle: ['h-11 w-9 shrink-0 items-center justify-center rounded-md', pressable],
        /** Room of the chevron in leaf rows, so the labels line up */
        toggleSpacer: 'h-11 w-9 shrink-0 items-center justify-center',
        indicator: 'size-4 text-muted',
        /** The node itself: selects, checks or (a branch that cannot be chosen) opens */
        node: [
            'min-h-11 min-w-0 flex-1 flex-row items-center gap-2 rounded-md px-2 py-2',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        icon: 'size-4 shrink-0 text-muted',
        text: 'min-w-0 flex-1 font-sans text-[15px] text-fg',
        /** Check box of a node (checkable): centred in the row */
        checkbox: 'mt-0',
        /** Row below a branch while its children load */
        loadingRow: 'min-h-11 flex-row items-center',
        loadingContent: 'flex-row items-center gap-2 px-2',
        loadingText: 'font-sans text-sm text-muted',
        spinner: 'text-muted',
        /** "Try again" row of a branch whose children failed to load */
        retryIcon: 'size-4 shrink-0 text-danger',
        retryText: 'min-w-0 flex-1 font-sans-medium text-sm text-danger',
        /** Nothing to show (no items, or no hits) */
        empty: 'px-2 py-3 font-sans text-sm text-muted',
        /** Guide line along the children of an open branch (`showLines`), placed per level by the component */
        line: 'absolute top-0 bottom-0 w-px bg-line-2',
    },
    variants: {
        selected: {
            true: { node: 'bg-line' },
        },
        disabled: {
            true: { node: 'opacity-40', toggle: 'opacity-40' },
        },
    },
});

export const treeSelect = tv({
    slots: {
        /** The tree in the sheet: shrinks so its list scrolls */
        tree: 'min-h-0 shrink px-3 pt-3',
    },
});

export const cascadeSelect = tv({
    slots: {
        /** Search field at the top of the sheet (filter) */
        search: 'mx-4 mt-3 w-auto',
        /** "Back" above a level */
        back: [
            'mx-2 mt-2 h-12 flex-row items-center gap-2 rounded-lg px-3',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        backIcon: 'size-4 shrink-0 text-muted',
        backLabel: 'font-sans-medium text-[15px] text-muted',
        /** An option: a radio button, or a button that opens the next level */
        item: [
            'min-h-12 flex-row items-center gap-3 rounded-lg px-3 py-2',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        icon: 'size-4 shrink-0 text-muted',
        text: 'min-w-0 flex-1 font-sans text-[15px] text-fg',
        /** Check of the chosen option */
        check: 'size-[18px] shrink-0 text-fg',
        /** Chevron of an option with a next level */
        chevron: 'size-4 shrink-0 text-muted',
        /** Loading row and empty text of a level */
        status: 'flex-row items-center gap-2 px-3 py-3',
        statusText: 'font-sans text-[15px] text-muted',
        spinner: 'shrink-0 text-muted',
        retryIcon: 'size-4 shrink-0 text-danger',
        retryText: 'min-w-0 flex-1 font-sans-medium text-[15px] text-danger',
    },
    variants: {
        selected: {
            true: { item: 'bg-line' },
        },
        disabled: {
            true: { item: 'opacity-40' },
        },
    },
});

export const orgChart = tv({
    slots: {
        base: 'w-full',
        list: 'gap-2',
        /** The team of a node: indented, with a line along it */
        team: 'mt-2 ml-5 gap-2 border-l border-line-2 pl-3',
        row: 'flex-row items-center gap-1',
        /** The person card */
        node: 'min-h-11 min-w-0 flex-1 flex-row items-center gap-3 rounded-lg border border-line-2 bg-card px-3 py-2.5',
        /** A card that can be chosen (toggle button) */
        selectable: [pressable, 'active:opacity-100 active:bg-bg-2'],
        avatar: 'shrink-0',
        text: 'min-w-0 flex-1 gap-0.5',
        label: 'font-sans-semibold text-sm text-fg',
        title: 'font-sans text-xs text-muted',
        /** Button beside a node that shows or hides its team: 44 pt, a small circle inside */
        toggle: ['size-11 shrink-0 items-center justify-center rounded-full', pressable],
        toggleCircle: 'size-8 items-center justify-center rounded-full border border-line-strong bg-card',
        toggleIcon: 'size-4 text-muted',
        spinner: 'text-muted',
    },
    variants: {
        selected: {
            true: { node: 'border-primary bg-primary/5' },
        },
        expanded: {
            true: { toggleIcon: 'rotate-180' },
        },
        error: {
            true: { toggleCircle: 'border-danger', toggleIcon: 'text-danger' },
        },
    },
});
