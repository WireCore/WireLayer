import { pressable, tv } from './tv.js';

// Tools for React Native: command palette (a search sheet), emoji picker, JSON viewer and log viewer.

/** Search sheet over pages and actions: search field at the top, items in groups */
export const commandPalette = tv({
    slots: {
        /** Height of the sheet */
        sheet: 'h-[85%] max-h-[85%]',
        search: 'mx-4 mt-3 w-auto',
        list: 'px-2 pt-2 pb-4',
        groupLabel: 'px-3 pt-3 pb-1 font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        item: [
            'min-h-12 flex-row items-center gap-3 rounded-lg px-3 py-2',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        icon: 'size-[18px] shrink-0 text-muted',
        body: 'min-w-0 flex-1',
        label: 'font-sans text-[15px] text-fg',
        description: 'font-sans text-xs text-muted',
        status: 'flex-row items-center gap-2 px-3 py-3',
        statusText: 'font-sans text-[15px] text-muted',
        spinner: 'shrink-0 text-muted',
        empty: 'px-4 py-8 text-center font-sans text-sm text-muted',
    },
});

/** Emoji picker: search, category tabs, a grid of buttons */
export const emojiPicker = tv({
    slots: {
        base: 'w-full gap-2',
        /** Height of the sheet (open/onOpenChange) */
        sheet: 'h-[70%] max-h-[70%]',
        /** Content in the sheet */
        sheetContent: 'flex-1 gap-2 px-4 pt-3',
        categories: 'flex-row flex-wrap',
        category: ['size-11 items-center justify-center rounded-lg', pressable],
        categoryIcon: 'text-[22px]',
        heading: 'px-1 font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        grid: 'grow-0',
        cell: ['h-12 items-center justify-center rounded-lg', pressable, 'active:bg-line active:opacity-100'],
        emoji: 'text-[26px]',
        empty: 'py-6 text-center font-sans text-sm text-muted',
    },
    variants: {
        selected: {
            true: { category: 'bg-line' },
        },
        /** The grid fills the sheet (scrolls) – inline it shows a fixed height */
        inSheet: {
            true: { grid: 'flex-1' },
            false: { grid: 'h-72' },
        },
    },
    defaultVariants: {
        inSheet: false,
    },
});

/** JSON as a tree: rows that open and close, values coloured by type */
export const jsonViewer = tv({
    slots: {
        base: 'w-full gap-2',
        tree: 'rounded-lg border border-line bg-bg p-1.5',
        /** Children of a branch: indented with a line */
        group: 'ml-[11px] border-l border-line pl-2',
        row: 'min-h-11 flex-row items-center gap-1 rounded-sm px-1',
        toggle: ['min-h-11 min-w-0 flex-1 flex-row items-center gap-1', pressable],
        indicator: 'size-4 shrink-0 text-muted',
        spacer: 'size-4 shrink-0',
        text: 'min-w-0 flex-1 font-mono text-[13px] leading-5 text-fg',
        key: 'text-fg',
        punctuation: 'text-muted',
        preview: 'italic text-muted',
        /** Type name, visible with `showTypes` */
        type: 'font-sans text-[11px] text-muted',
        matches: 'px-1 font-sans text-xs text-muted',
    },
    variants: {
        valueType: {
            string: { text: 'text-success' },
            number: { text: 'text-info' },
            boolean: { text: 'text-warn' },
            nothing: { text: 'text-muted' },
            nested: {},
        },
        open: {
            true: { indicator: 'rotate-90' },
        },
    },
    defaultVariants: {
        valueType: 'nested',
    },
});

/** Log: toolbar with search, levels and auto-scroll; wrapped lines in a list; line counter */
export const logViewer = tv({
    slots: {
        base: 'w-full overflow-hidden rounded-lg border border-line bg-bg',
        toolbar: 'gap-2 border-b border-line p-2',
        toolbarRow: 'flex-row flex-wrap items-center gap-2',
        body: 'relative h-80',
        list: 'flex-1',
        content: 'py-1',
        line: 'flex-row items-start gap-2 px-2 py-0.5',
        number: 'w-9 shrink-0 text-right font-mono text-xs leading-5 text-muted',
        level: 'shrink-0 flex-row items-center gap-1',
        levelIcon: 'size-3.5 shrink-0',
        levelText: 'font-mono text-xs leading-5',
        main: 'min-w-0 flex-1',
        time: 'font-mono text-xs leading-5 text-muted',
        text: 'font-mono text-xs leading-5 text-fg',
        more: 'items-center p-2',
        empty: 'p-4 text-center font-sans text-sm text-muted',
        jump: 'absolute right-3 bottom-3',
        footer: 'flex-row items-center justify-between gap-2 border-t border-line px-2 py-1.5',
        footerText: 'font-sans text-xs text-muted',
    },
    variants: {
        level: {
            none: {},
            debug: { text: 'text-muted', level: 'text-muted', levelIcon: 'text-muted', levelText: 'text-muted' },
            info: { levelIcon: 'text-info', levelText: 'text-info' },
            warn: { line: 'bg-warn/10', levelIcon: 'text-warn', levelText: 'text-warn' },
            error: { line: 'bg-danger/10', levelIcon: 'text-danger', levelText: 'text-danger' },
        },
    },
    defaultVariants: {
        level: 'none',
    },
});
