import { pressable, tv } from './tv.js';

// Lists and data views for React Native (RN part 3): VirtualList, DataView and the DataTable of
// @wirecore/wirelayer-native/data-table (a table that scrolls sideways, or one card per row)

/** Rows at the end of a list: loading, empty, error with "Try again", "Load more" */
const listStatus = {
    status: 'flex-row items-center justify-center gap-2 px-3 py-4',
    statusText: 'font-sans text-[15px] text-muted',
    spinner: 'shrink-0 text-muted',
    error: 'items-center gap-3 rounded-card border border-danger/40 bg-danger/10 px-4 py-5',
    errorText: 'text-center font-sans text-[15px] text-fg',
    more: 'items-center gap-2 px-3 py-3',
};

export const virtualList = tv({
    slots: {
        base: 'w-full',
        item: 'w-full',
        /** Heading of a group – sticks to the top while its items scroll */
        groupHeader: 'border-b border-line bg-bg-2 px-3 py-1.5',
        groupHeaderText: 'font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        ...listStatus,
    },
});

export const dataView = tv({
    slots: {
        base: 'w-full',
        content: 'gap-3 pb-2',
        header: 'flex-row flex-wrap items-center justify-between gap-2',
        toolbar: 'flex-row flex-wrap items-center gap-2',
        /** A line of the grid: the items share the width */
        row: 'flex-row gap-3',
        item: 'w-full',
        cell: 'min-w-0 flex-1',
        skeleton: 'gap-2.5 rounded-card border border-line bg-card p-4',
        empty: 'py-8 text-center font-sans text-[15px] text-muted',
        footer: 'items-center gap-2 pt-1',
        summary: 'font-sans text-[13px] text-muted',
        ...listStatus,
    },
    variants: {
        layout: {
            list: {},
            grid: {},
        },
    },
});

export const dataTable = tv({
    slots: {
        base: 'w-full gap-3',
        toolbar: 'flex-row flex-wrap items-center gap-2',
        search: 'min-w-[180px] flex-1',
        tools: 'flex-row flex-wrap items-center gap-2',
        /** "Select all" above the cards */
        selectAll: 'min-h-11 flex-row items-center px-1',
        /** Table: scrolls sideways inside the border */
        frame: 'overflow-hidden rounded-card border border-line bg-card',
        headerRow: 'flex-row border-b border-line-2 bg-bg-2',
        headerCell: 'min-h-11 justify-center',
        /** Header without sorting */
        headerLabel: 'px-3 py-2',
        headerButton: ['min-h-11 flex-row items-center gap-1 px-3 py-2', pressable],
        headerText: 'shrink font-sans-semibold text-[13px] text-fg',
        sortIcon: 'size-3.5 shrink-0 text-muted',
        row: 'flex-row border-b border-line',
        cell: 'min-h-11 justify-center px-3 py-2',
        cellText: 'font-sans text-sm text-fg',
        /** Selection and action column */
        utilityCell: 'min-h-11 w-12 items-center justify-center',
        groupRow: 'border-b border-line bg-bg-2 px-3 py-2',
        groupText: 'font-sans-semibold text-[13px] text-fg',
        footerRow: 'flex-row bg-bg-2',
        footerText: 'font-sans-semibold text-[13px] text-fg',
        /** Cards: one per row with "header: value" lines */
        cards: 'gap-3',
        card: 'gap-1 rounded-card border border-line bg-card px-4 py-3',
        cardHeader: 'min-h-11 flex-row items-center gap-2',
        cardHeading: 'min-w-0 flex-1',
        cardTitle: 'font-sans-semibold text-[15px] text-fg',
        pair: 'flex-row items-baseline gap-3 py-1',
        pairLabel: 'w-2/5 shrink-0 font-sans text-[13px] text-muted',
        pairContent: 'min-w-0 flex-1',
        pairValue: 'font-sans text-sm text-fg',
        groupHeading: 'px-1 pt-2 font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        /** The first value as a button when the row opens something (onRowClick) */
        rowLink: ['min-h-11 justify-center self-start', pressable],
        rowLinkText: 'font-sans-medium text-sm text-fg underline',
        radio: ['size-11 items-center justify-center', pressable],
        radioControl: 'size-[18px] items-center justify-center rounded-full border border-line-strong',
        radioDot: 'size-2 rounded-full bg-primary',
        /** Content of the sort and filter sheets */
        sheetBody: 'gap-4 px-3 pt-2 pb-4',
        sheetSection: 'gap-1',
        sheetLabel: 'px-1 pb-1 font-sans-medium text-[13px] text-fg',
        option: [
            'min-h-11 flex-row items-center gap-3 rounded-lg px-2',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        optionText: 'flex-1 font-sans text-[15px] text-fg',
        range: 'flex-row gap-2',
        rangePart: 'min-w-0 flex-1',
        ...listStatus,
    },
    variants: {
        align: {
            start: {},
            end: { cell: 'items-end', cellText: 'text-right', headerCell: 'items-end', headerLabel: 'items-end' },
        },
        selected: {
            true: { row: 'bg-primary/5', card: 'border-primary' },
        },
        sorted: {
            true: { sortIcon: 'text-fg' },
        },
        checked: {
            true: { radioControl: 'border-primary' },
        },
    },
});
