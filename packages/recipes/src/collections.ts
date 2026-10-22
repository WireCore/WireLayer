import { tv } from './tv.js';

// Collections: data view, order list, pick list, timeline, organisation chart, meter group, virtual list

/** Items as a list or a grid, switchable */
export const dataView = tv({
    slots: {
        base: 'flex flex-col gap-4',
        header: 'flex flex-wrap items-center justify-between gap-3',
        items: 'grid gap-3',
        item: 'min-w-0',
        empty: 'py-10 text-center text-sm text-muted',
        /** Below the items: "Load more" and how many are shown (`loadMode: 'infinite'`) */
        footer: 'flex flex-col items-center gap-2 pt-1',
        summary: 'text-xs text-muted tabular-nums',
        /** Error of a data source, with "Try again" */
        error: 'flex flex-col items-center gap-3 py-10 text-center text-sm text-danger',
        /** Scrolled into view, it loads the next page (`autoLoad`) */
        sentinel: 'h-px',
        /** Announces loading and loaded items */
        status: 'sr-only',
        /** Placeholder card while loading */
        skeleton: 'flex flex-col gap-2 rounded-lg border border-line p-4',
    },
    variants: {
        layout: {
            list: { items: 'grid-cols-1' },
            grid: { items: 'grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]' },
        },
    },
    defaultVariants: {
        layout: 'list',
    },
});

/** List whose order is changed with buttons (keyboard and pointer alike) */
export const orderList = tv({
    slots: {
        base: 'flex items-start gap-2',
        list: 'min-w-0 flex-1',
        controls: 'flex flex-col gap-1 pt-6',
        status: 'sr-only',
        /** The list while an item is dragged over it */
        dropZone:
            'rounded-[10px] data-drop:outline-2 data-drop:outline-offset-2 data-drop:outline-dashed data-drop:outline-primary',
    },
});

/** Two lists: available and chosen, with buttons to move between them */
export const pickList = tv({
    slots: {
        base: 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3',
        controls: 'flex flex-col gap-1 self-center rtl:[&_svg]:-scale-x-100',
        status: 'sr-only',
        /** A list while items are dragged over it */
        dropZone:
            'min-w-0 rounded-[10px] data-drop:outline-2 data-drop:outline-offset-2 data-drop:outline-dashed data-drop:outline-primary',
    },
});

/** Events in time order, as an ordered list */
export const timeline = tv({
    slots: {
        base: 'flex flex-col',
        item: 'group/event relative flex gap-4 pb-6 last:pb-0',
        // The line down to the next event
        rail: 'absolute top-8 bottom-0 inset-s-[15px] w-px bg-line-2 group-last/event:hidden',
        marker: [
            'relative flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong bg-card text-muted',
            'forced-colors:border-[CanvasText]',
        ],
        markerIcon: 'size-4',
        content: 'flex min-w-0 flex-col gap-0.5 pt-1',
        time: 'font-mono text-[11px] tracking-label text-muted uppercase',
        title: 'text-sm font-semibold text-fg',
        description: 'text-sm text-muted',
        /** Content on the other side of the marker (e.g. the time); in `alternate` it swaps sides with the content */
        opposite: 'flex w-32 shrink-0 flex-col gap-0.5 pt-1.5 text-end text-[13px] text-muted',
        /** Feed (`feed`): each event is an article that takes the focus (Page Up/Down move between them) */
        article: 'rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg',
        /** "Load older entries" below the events */
        more: 'flex justify-center pt-4',
        status: 'sr-only',
        sentinel: 'h-px',
    },
    variants: {
        status: {
            neutral: {},
            success: { marker: 'border-success text-success' },
            info: { marker: 'border-info text-info' },
            warn: { marker: 'border-warn text-warn' },
            danger: { marker: 'border-danger text-danger' },
        },
        /** Current event: filled marker (aria-current="step" on the item) */
        active: {
            true: {
                marker: [
                    'border-primary bg-primary text-on-primary',
                    'forced-colors:forced-color-adjust-none forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
                ],
                title: 'text-primary',
            },
        },
        /** Marker at the start (default), at the end, or in the middle with the content alternating sides */
        align: {
            start: {},
            end: {
                item: 'flex-row-reverse',
                content: 'items-end text-end',
                opposite: 'text-start',
                rail: 'inset-s-auto inset-e-[15px]',
            },
            alternate: {
                content: 'flex-1 basis-0 group-even/event:items-end group-even/event:text-end',
                opposite: 'w-auto flex-1 basis-0 group-even/event:text-start',
                item: 'even:flex-row-reverse',
                rail: 'inset-s-[calc(50%-0.5px)]',
            },
        },
        /** Events side by side, the line runs horizontally */
        horizontal: {
            true: {
                base: 'flex-row items-start',
                item: 'min-w-0 flex-1 flex-col gap-3 pe-6 pb-0 last:pe-0',
                rail: 'top-[15px] bottom-auto inset-s-10 inset-e-2 h-px w-auto',
                content: 'pt-0',
                opposite: 'h-5 w-auto justify-end truncate pt-0 text-start',
            },
        },
        /** Set when the events have content on the other side: the line moves past it */
        withOpposite: {
            true: {},
        },
    },
    compoundVariants: [
        // 8rem opposite + 1rem gap + half the marker
        { align: 'start', withOpposite: true, horizontal: false, class: { rail: 'inset-s-[159px]' } },
        { align: 'end', withOpposite: true, horizontal: false, class: { rail: 'inset-e-[159px]' } },
        // Horizontal with opposite: the line runs through the markers below the 20px opposite row
        { horizontal: true, withOpposite: true, class: { rail: 'top-[47px]' } },
    ],
    defaultVariants: {
        status: 'neutral',
        align: 'start',
    },
});

/** Hierarchy drawn from the top down; nested lists underneath */
export const orgChart = tv({
    slots: {
        base: 'overflow-x-auto pb-2',
        // The lines: each child draws its half of the bar above and a stem up to it
        list: [
            'relative flex justify-center pt-5',
            'before:absolute before:top-0 before:left-1/2 before:h-5 before:w-px before:bg-line-strong',
        ],
        rootList: 'flex justify-center',
        item: [
            'relative flex flex-col items-center px-2 pt-5',
            'before:absolute before:top-0 before:inset-e-1/2 before:h-5 before:w-1/2 before:border-t before:border-line-strong',
            'after:absolute after:top-0 after:inset-s-1/2 after:h-5 after:w-1/2 after:border-t after:border-s after:border-line-strong',
            'first:before:border-0 last:after:border-0 last:before:rounded-se-md last:before:border-e first:after:rounded-ss-md',
            'only:pt-0 only:before:hidden only:after:hidden',
        ],
        rootItem: 'flex flex-col items-center',
        node: 'flex min-w-36 flex-col items-center gap-0.5 rounded-lg border border-line-2 bg-card px-4 py-2.5 text-center',
        label: 'text-sm font-semibold whitespace-nowrap text-fg',
        title: 'text-xs whitespace-nowrap text-muted',
        /** A node that can be selected: a toggle button (aria-pressed) */
        selectable: [
            'cursor-pointer hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'aria-pressed:border-primary aria-pressed:bg-primary/10',
            'forced-colors:aria-pressed:forced-color-adjust-none forced-colors:aria-pressed:border-[Highlight] forced-colors:aria-pressed:outline-2 forced-colors:aria-pressed:outline-[Highlight]',
        ],
        /** Button below a node that shows or hides its team (aria-expanded) */
        toggle: [
            'relative z-[1] -mb-3 mt-1 flex size-6 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-card text-muted',
            'hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'aria-busy:cursor-progress data-error:border-danger data-error:text-danger',
        ],
        toggleIcon: 'size-3.5 transition-transform motion-reduce:transition-none in-aria-expanded:rotate-180',
        /** Instead of the arrow while the team loads */
        toggleSpinner: 'size-3.5 motion-safe:animate-spin',
        status: 'sr-only',
    },
});

/** Parts of a whole as one bar, with a legend of the values */
export const meterGroup = tv({
    slots: {
        base: 'flex flex-col gap-3',
        label: 'text-sm font-medium text-fg',
        bar: 'flex h-2.5 w-full overflow-hidden rounded-full bg-line forced-colors:border forced-colors:border-[CanvasText]',
        segment: 'h-full first:rounded-s-full last:rounded-e-full',
        legend: 'flex flex-wrap gap-x-5 gap-y-1.5',
        legendItem: 'flex items-center gap-2 text-sm text-fg',
        swatch: 'size-2.5 shrink-0 rounded-full',
        value: 'text-muted tabular-nums',
    },
    variants: {
        color: {
            primary: { segment: 'bg-primary', swatch: 'bg-primary' },
            info: { segment: 'bg-info', swatch: 'bg-info' },
            success: { segment: 'bg-success', swatch: 'bg-success' },
            warn: { segment: 'bg-warn', swatch: 'bg-warn' },
            danger: { segment: 'bg-danger', swatch: 'bg-danger' },
            muted: { segment: 'bg-muted', swatch: 'bg-muted' },
        },
        /** Vertical bar (grows from the bottom), legend next to it */
        orientation: {
            horizontal: {},
            vertical: {
                base: 'grid grid-cols-[auto_1fr] items-end gap-x-4',
                label: 'col-span-2',
                bar: 'h-40 w-2.5 flex-col-reverse',
                segment: 'h-auto w-full first:rounded-none first:rounded-b-full last:rounded-none last:rounded-t-full',
                legend: 'flex-col',
            },
        },
        /** Where the legend is: below (default), above, before or after the bar */
        legendPosition: {
            bottom: {},
            top: { legend: 'order-first', label: 'order-first' },
            start: {
                base: 'grid grid-cols-[auto_1fr] items-center gap-x-4',
                label: 'col-span-2',
                legend: 'col-start-1 row-start-2',
                bar: 'col-start-2 row-start-2 min-w-32',
            },
            end: {
                base: 'grid grid-cols-[1fr_auto] items-center gap-x-4',
                label: 'col-span-2',
                legend: 'col-start-2 row-start-2',
                bar: 'col-start-1 row-start-2 min-w-32',
            },
        },
        /** Legend entries in a row (default) or one below the other */
        legendLayout: {
            inline: {},
            stacked: { legend: 'flex-col' },
        },
    },
    defaultVariants: {
        color: 'primary',
        orientation: 'horizontal',
        legendPosition: 'bottom',
        legendLayout: 'inline',
    },
});

export type MeterColor = 'primary' | 'info' | 'success' | 'warn' | 'danger' | 'muted';

/** Long list that renders only the visible rows (TanStack Virtual) */
export const virtualListBox = tv({
    slots: {
        base: 'overflow-y-auto rounded-lg border border-line outline-none focus-visible:border-primary',
        spacer: 'relative w-full',
        item: 'absolute top-0 inset-s-0 w-full',
        /** Group heading; the heading of the group in view sticks to the top */
        groupHeader:
            'w-full border-b border-line bg-card px-3 py-1.5 font-mono text-[11px] tracking-label text-muted uppercase',
        sticky: 'sticky top-0 z-[1]',
        /** Row at the end while more items load */
        loading: 'flex h-10 items-center gap-2 px-3 text-sm text-muted',
        loadingIcon: 'size-4 shrink-0 motion-safe:animate-spin',
        status: 'sr-only',
    },
});
