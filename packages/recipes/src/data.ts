import { popupMotion, tv } from './tv.js';

// DataTable (@wirecore/wirelayer-vue/data-table, @wirecore/wirelayer-react/data-table) and virtualised lists.

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

export const dataTable = tv({
    slots: {
        base: 'flex flex-col',
        scroll: 'overflow-x-auto',
        // Separate borders: with collapsed borders Chrome lets scrolled rows shine through a sticky header.
        // While loading only the data rows fade – header and loading message stay readable (contrast)
        table: [
            'w-full border-separate border-spacing-0 text-start',
            'aria-busy:[&>tbody>tr[data-row-id]]:opacity-60 motion-safe:[&>tbody>tr]:transition-opacity',
        ],
        caption: 'sr-only',
        /** Text for screen readers only (sort level, names of the utility columns) */
        srOnly: 'sr-only',
        /** Header labels at the bottom when a column spans several header rows */
        head: 'align-bottom',
        headRow: '*:border-b *:border-line',
        th: 'relative px-[18px] py-2.5 font-mono text-[11px] font-normal tracking-label whitespace-nowrap text-muted uppercase',
        /** Header of a column group (several columns below) */
        groupTh: 'border-b border-line text-center',
        /** Sort button and the column buttons in one line */
        headContent: 'flex min-w-0 items-center gap-1',
        /** Column name – shortened with an ellipsis when the column is narrow */
        headLabel: 'min-w-0 truncate',
        sortButton: [
            'inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-sm font-mono text-[11px] tracking-label uppercase hover:text-fg',
            focusRing,
        ],
        sortIcon: 'size-[13px] shrink-0',
        /** Position of the column in a multiple sorting */
        sortBadge:
            'inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-line text-[10px] tracking-normal text-fg tabular-nums',
        /** Small buttons in the header: filter menu, column menu */
        headButton: [
            'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-line hover:text-fg',
            'aria-expanded:bg-line aria-expanded:text-fg data-active:text-primary',
            focusRing,
        ],
        headButtonIcon: 'size-3.5',
        row: 'group/row transition-colors *:border-b *:border-line hover:bg-bg-2 motion-reduce:transition-none data-[state=selected]:bg-line',
        td: 'px-[18px] py-2.5 text-sm text-fg',
        selectCell: 'w-px pe-0',
        /** Row number, drag handle, expand button, row actions */
        utilityCell: 'w-px px-2 whitespace-nowrap',
        rowNumber: 'font-mono text-xs text-muted tabular-nums',
        // TreeTable: the first cell of a row is indented by its depth and holds the expand button
        treeCell: 'flex items-center gap-1.5',
        expander: [
            'flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-line hover:text-fg',
            focusRing,
        ],
        expanderIcon:
            'size-3.5 transition-transform motion-reduce:transition-none data-[state=open]:rotate-90 rtl:not-data-[state=open]:-scale-x-100',
        expanderSpacer: 'size-6 shrink-0',
        /** Detail row below an expanded row */
        expansionRow: 'bg-bg-2 *:border-b *:border-line',
        expansionCell: 'px-[18px] py-4 text-sm text-fg',
        /** Single selection: a native radio button per row */
        radio: [
            'grid size-[18px] cursor-pointer appearance-none place-content-center rounded-full border border-line-strong bg-transparent align-middle',
            'checked:border-primary checked:bg-[radial-gradient(var(--wc-primary)_0_4px,transparent_4.5px)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'forced-colors:checked:bg-[Highlight]',
        ],
        /** Drag handle of a row (arrow keys move it) */
        dragHandle: [
            'flex size-6 cursor-grab touch-none items-center justify-center rounded-md text-muted hover:bg-line hover:text-fg active:cursor-grabbing',
            focusRing,
        ],
        dragIcon: 'size-4',
        message: 'px-[18px] py-10 text-center text-sm text-muted',
        messageContent: 'inline-flex items-center gap-2',
        footer: 'flex flex-wrap items-center justify-between gap-3 px-[18px] py-2.5',
        /** Rows per page next to the pagination */
        pageSize: 'flex items-center gap-2 text-[13px] text-muted',
        pageSizeSelect: 'w-24',
        // Toolbar above the table: search, own controls, density, columns, full screen, export
        toolbar: 'flex flex-wrap items-center gap-2 border-b border-line px-[18px] py-3',
        search: 'max-w-72',
        toolbarEnd: 'ms-auto flex items-center gap-2',
        menuCheck: 'size-4 shrink-0',
        /** Announces the number of rows after filtering and moved rows/columns */
        status: 'sr-only',
        // Filter row below the column headers
        filterRow: '*:border-b *:border-line',
        filterCell: 'px-3 py-2 font-normal normal-case',
        /** Filter menu (popover): conditions with match mode and value */
        filterPanel: [
            'z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-popup border border-line-2 bg-card p-3 text-fg outline-none',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            ...popupMotion,
        ],
        filterForm: 'contents',
        filterRule: 'flex flex-col gap-2 border-b border-line pb-3',
        filterMode: 'min-w-0 flex-1',
        filterAdd: 'self-start',
        filterRuleHead: 'flex items-center gap-2',
        filterRange: 'grid grid-cols-2 gap-2',
        /** From and to of a range filter in the filter row, one below the other */
        filterRowRange: 'flex min-w-0 flex-col gap-1',
        filterActions: 'flex items-center justify-between gap-2',
        // Fixed widths (resizable, `width` or pinned columns)
        fixedLayout: 'table-fixed',
        /** Drag or arrow keys change the width (window splitter) */
        resizer: [
            'absolute inset-y-0 -inset-e-1 z-[3] w-2 cursor-col-resize touch-none select-none outline-none',
            'after:absolute after:inset-y-2 after:left-1/2 after:w-px after:bg-line-2 hover:after:bg-fg data-resizing:after:bg-primary',
            'focus-visible:after:inset-y-0 focus-visible:after:w-0.5 focus-visible:after:bg-fg',
        ],
        // Pinned columns stay in place while the rest scrolls sideways
        pinned: 'sticky z-[1] bg-card group-hover/row:bg-bg-2 group-data-[state=selected]/row:bg-line',
        pinnedHead: 'sticky z-[2] bg-card',
        pinnedStartEdge: 'shadow-[inset_-1px_0_0_var(--wc-line-2)] rtl:shadow-[inset_1px_0_0_var(--wc-line-2)]',
        pinnedEndEdge: 'shadow-[inset_1px_0_0_var(--wc-line-2)] rtl:shadow-[inset_-1px_0_0_var(--wc-line-2)]',
        /** Frozen rows: stay below the header while the body scrolls */
        frozenBody: 'sticky z-[2] bg-card shadow-[0_1px_0_var(--wc-line-2)]',
        // Grouped rows (groupBy): one header row per group, optionally with aggregates per column
        groupRow: 'bg-bg-2 *:border-b *:border-line',
        groupCell: 'px-[18px] py-2 text-sm',
        groupLabel: 'font-semibold text-fg',
        groupCount: 'text-muted',
        groupAggregate: 'px-[18px] py-2 text-sm font-medium text-fg tabular-nums',
        // Footer row with totals (`footer`, `aggregate`)
        foot: 'text-fg',
        // Line above the totals: covers the bottom line of the last row
        footCell: 'bg-card shadow-[0_-1px_0_var(--wc-line-2)] px-[18px] py-2.5 text-sm font-semibold text-fg',
        // Inline editing
        editButton: [
            '-mx-1.5 -my-1 block min-h-7 w-[calc(100%+0.75rem)] cursor-text rounded-md px-1.5 py-1 text-start hover:bg-line',
            focusRing,
        ],
        editor: 'flex min-w-0 flex-col gap-1',
        editError: 'text-xs font-normal text-danger',
        editActions: 'flex items-center gap-1',
        /** Copyable cell: value and copy button */
        copyCell: 'inline-flex items-center gap-1',
        /** Dragged row or column header, and the drop position */
        dropTarget: [
            'data-[drop=before]:shadow-[inset_0_2px_0_var(--wc-primary)] data-[drop=after]:shadow-[inset_0_-2px_0_var(--wc-primary)]',
            'data-dragging:opacity-50',
        ],
        dropTargetColumn: [
            'data-[drop=before]:shadow-[inset_2px_0_0_var(--wc-primary)] data-[drop=after]:shadow-[inset_-2px_0_0_var(--wc-primary)]',
            'rtl:data-[drop=before]:shadow-[inset_-2px_0_0_var(--wc-primary)] rtl:data-[drop=after]:shadow-[inset_2px_0_0_var(--wc-primary)]',
            'data-dragging:opacity-50',
        ],
        /** Rows as links (`rowHref`): the link in the first cell, a click anywhere on the row follows it */
        linkRow: 'cursor-pointer',
        rowLink: ['rounded-sm text-inherit no-underline hover:underline', focusRing],
        /** Optional bar below the table: rows, filtered, selected and the totals of the selection */
        statusBar:
            'flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-[18px] py-2 text-[13px] text-muted tabular-nums',
        /** Cell inside the selected range (`cellSelection`) */
        cellSelected: 'bg-primary/10 forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
        /** Changed cell not saved yet (`editMode="batch"`): tinted with a bar at the start */
        cellChanged:
            'bg-warn/10 shadow-[inset_3px_0_0_var(--wc-warn)] rtl:shadow-[inset_-3px_0_0_var(--wc-warn)] forced-colors:border-s-2 forced-colors:border-s-[Highlight]',
        /** Bar with the number of unsaved changes, undo/redo, discard and save */
        batchBar: 'flex flex-wrap items-center gap-2 border-b border-line bg-bg-2 px-[18px] py-2 text-[13px] text-fg',
        batchCount: 'me-auto font-medium tabular-nums',
        /** Advanced filter (ConditionBuilder) between toolbar and table */
        advancedFilter: 'border-b border-line px-[18px] py-3',
        /** Find in the table: field, number of matches, previous/next */
        findBar: 'flex flex-wrap items-center gap-2 border-b border-line px-[18px] py-2',
        findInput: 'max-w-72',
        findCount: 'min-w-24 text-[13px] text-muted tabular-nums',
        /** Cells with a match, the current match */
        findMatch: 'bg-warn/15 forced-colors:outline-1 forced-colors:outline-[Highlight]',
        findCurrent:
            'bg-warn/30 outline-2 -outline-offset-2 outline-warn forced-colors:outline-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
        /** Error of a data source with the retry button */
        errorContent: 'inline-flex flex-col items-center gap-3 text-danger',
        /** Drop into a group or a tree row while dragging a row */
        dropInside: 'data-[drop=inside]:bg-primary/10 data-[drop=inside]:shadow-[inset_0_0_0_1px_var(--wc-primary)]',
        /** Columns of a column group in the column menu, indented below the group */
        columnGroupItem: 'ps-8',
        /** Virtual scrolling: empty rows for the space above and below the rendered rows */
        spacer: 'border-0',
        spacerCell: 'p-0',
    },
    variants: {
        align: {
            start: { th: 'text-start', td: 'text-start', footCell: 'text-start' },

            end: {
                th: 'text-end',
                headContent: 'justify-end',
                td: 'text-end tabular-nums',
                // Editable cells: the edit button fills the cell
                editButton: 'text-end',
                footCell: 'text-end tabular-nums',
                groupAggregate: 'text-end',
            },
        },
        /** Row height (density) */
        size: {
            sm: { th: 'py-1.5', td: 'py-1', groupCell: 'py-1', groupAggregate: 'py-1', footCell: 'py-1.5' },
            md: {},
            lg: { th: 'py-3.5', td: 'py-4', groupCell: 'py-3', groupAggregate: 'py-3', footCell: 'py-3.5' },
        },
        /** Lines between the columns */
        gridlines: {
            true: {
                th: 'border-e border-line last:border-e-0',
                td: 'border-e border-line last:border-e-0',
                footCell: 'border-e border-line last:border-e-0',
            },
        },
        /** Every other row tinted */
        striped: {
            true: { row: 'even:bg-bg-2/60' },
        },
        /** Fixed height (`scrollHeight`): the table scrolls inside, header and footer stay visible */
        scrollable: {
            true: {
                scroll: 'overflow-auto overscroll-contain',
                head: 'sticky top-0 z-[3]',
                foot: 'sticky bottom-0 z-[3]',
                th: 'bg-card',
                filterCell: 'bg-card',
            },
        },
        /** Keyboard navigation as a grid (`navigation="grid"`): the focused cell gets the focus ring */
        grid: {
            true: {
                table: [
                    '[&_:is(td,th):focus-visible]:outline-2 [&_:is(td,th):focus-visible]:-outline-offset-2',
                    '[&_:is(td,th):focus-visible]:outline-fg',
                ],
            },
        },
        /** Long header texts wrap instead of being shortened */
        wrapHeaders: {
            true: { th: 'whitespace-normal', headLabel: 'whitespace-normal' },
        },
        /** Header texts read from bottom to top (narrow columns) */
        verticalHeaders: {
            true: { headLabel: 'max-h-48 rotate-180 [writing-mode:vertical-rl]' },
        },
        /** Full screen: the table covers the window */
        fullscreen: {
            true: { base: 'fixed inset-0 z-50 overflow-auto bg-bg' },
        },
        /** Hides a column on small screens */
        hideBelow: {
            'hide-sm': {
                th: 'max-sm:hidden',
                td: 'max-sm:hidden',
                footCell: 'max-sm:hidden',
                filterCell: 'max-sm:hidden',
            },
            'hide-md': {
                th: 'max-md:hidden',
                td: 'max-md:hidden',
                footCell: 'max-md:hidden',
                filterCell: 'max-md:hidden',
            },
            'hide-lg': {
                th: 'max-lg:hidden',
                td: 'max-lg:hidden',
                footCell: 'max-lg:hidden',
                filterCell: 'max-lg:hidden',
            },
        },
    },
    defaultVariants: {
        align: 'start',
        size: 'md',
    },
});

/** Virtualised option list inside a select content: a sized spacer with absolutely positioned items. */
export const virtualList = tv({
    slots: {
        // shrink-0: inside the flex column of the select content the spacer would otherwise collapse
        spacer: 'relative w-full shrink-0',
        item: 'absolute top-0 inset-s-0 w-full',
        /** With a search field: the list below it scrolls (the virtualizer measures it) */
        scroll: 'min-h-0 flex-1 overflow-y-auto',
    },
});
