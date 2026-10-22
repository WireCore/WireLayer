import { responsiveColumns } from './shell.js';
import { tv } from './tv.js';

// Layout primitives: stack, group, simple grid, container, center, aspect ratio, affix, sticky, collapse,
// horizontal scroller, masonry. Plain CSS (except the scroller arrows and the measured masonry), usable in HTML too.

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

/** Spacing between the children: none (0), xs (4px), sm (8px), md (16px), lg (24px), xl (32px) */
export type LayoutGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Children below each other with an even gap */
export const stack = tv({
    base: 'flex flex-col',
    variants: {
        gap: {
            none: 'gap-0',
            xs: 'gap-1',
            sm: 'gap-2',
            md: 'gap-4',
            lg: 'gap-6',
            xl: 'gap-8',
        },
        /** Horizontal alignment of the children */
        align: {
            stretch: 'items-stretch',
            start: 'items-start',
            center: 'items-center',
            end: 'items-end',
        },
    },
    defaultVariants: {
        gap: 'md',
        align: 'stretch',
    },
});

/** Children side by side, wrapping onto new lines */
export const group = tv({
    base: 'flex flex-wrap',
    variants: {
        gap: {
            none: 'gap-0',
            xs: 'gap-1',
            sm: 'gap-2',
            md: 'gap-4',
            lg: 'gap-6',
            xl: 'gap-8',
        },
        /** Distribution along the row */
        justify: {
            start: 'justify-start',
            center: 'justify-center',
            end: 'justify-end',
            between: 'justify-between',
        },
        /** Vertical alignment of the children */
        align: {
            middle: 'items-center',
            top: 'items-start',
            bottom: 'items-end',
            baseline: 'items-baseline',
            stretch: 'items-stretch',
        },
        /** Keep everything on one line */
        nowrap: {
            true: 'flex-nowrap',
        },
        /** Children share the width evenly */
        grow: {
            true: '[&>*]:min-w-0 [&>*]:flex-1',
        },
    },
    defaultVariants: {
        gap: 'md',
        justify: 'start',
        align: 'middle',
    },
});

/**
 * Columns of equal width: a fixed count per breakpoint (`--wc-cols`, `--wc-cols-sm` … `--wc-cols-xl`), or as many
 * as fit (`autoFit` with `--wc-min-col`)
 */
export const simpleGrid = tv({
    base: ['grid grid-cols-[repeat(var(--wc-cols-now),minmax(0,1fr))]', ...responsiveColumns],
    variants: {
        gap: {
            none: 'gap-0',
            xs: 'gap-1',
            sm: 'gap-2',
            md: 'gap-4',
            lg: 'gap-6',
            xl: 'gap-8',
        },
        autoFit: {
            true: 'grid-cols-[repeat(auto-fit,minmax(min(var(--wc-min-col,12rem),100%),1fr))]',
        },
    },
    defaultVariants: {
        gap: 'md',
    },
});

/** Centred content with a maximum width and side padding */
export const container = tv({
    base: 'mx-auto w-full px-4 sm:px-6',
    variants: {
        size: {
            sm: 'max-w-2xl',
            md: 'max-w-3xl',
            lg: 'max-w-5xl',
            xl: 'max-w-7xl',
            full: 'max-w-none',
        },
        /** Without the side padding */
        flush: {
            true: 'px-0 sm:px-0',
        },
    },
    defaultVariants: {
        size: 'lg',
    },
});

/** Centres its content horizontally and vertically */
export const center = tv({
    base: 'flex items-center justify-center',
    variants: {
        inline: {
            true: 'inline-flex',
        },
    },
});

/** Keeps a width-to-height ratio (`--wc-ratio`, default 16/9); images and videos inside fill it */
export const aspectRatio = tv({
    base: [
        'relative w-full overflow-hidden [aspect-ratio:var(--wc-ratio,16/9)]',
        '[&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:size-full',
        '[&>img]:absolute [&>img]:inset-0 [&>img]:size-full [&>img]:object-cover',
        '[&>video]:absolute [&>video]:inset-0 [&>video]:size-full [&>video]:object-cover',
    ],
});

/** Fixed in a corner of the window (`--wc-affix-offset`, default 24px) */
export const affix = tv({
    base: 'fixed z-40',
    variants: {
        position: {
            'bottom-end': 'inset-e-[var(--wc-affix-offset,1.5rem)] bottom-[var(--wc-affix-offset,1.5rem)]',
            'bottom-start': 'inset-s-[var(--wc-affix-offset,1.5rem)] bottom-[var(--wc-affix-offset,1.5rem)]',
            'top-end': 'inset-e-[var(--wc-affix-offset,1.5rem)] top-[var(--wc-affix-offset,1.5rem)]',
            'top-start': 'inset-s-[var(--wc-affix-offset,1.5rem)] top-[var(--wc-affix-offset,1.5rem)]',
        },
    },
    defaultVariants: {
        position: 'bottom-end',
    },
});

/** Sticks to the top or bottom edge while its container scrolls (`--wc-sticky-offset`); `bar` for form actions */
export const sticky = tv({
    base: 'sticky z-20',
    variants: {
        edge: {
            top: 'top-[var(--wc-sticky-offset,0px)]',
            bottom: 'bottom-[var(--wc-sticky-offset,0px)]',
        },
        /** Action bar look: background, line and buttons at the end */
        bar: {
            true: 'flex flex-wrap items-center justify-end gap-2 border-line bg-card/95 px-4 py-3 backdrop-blur-sm',
        },
    },
    compoundVariants: [
        { edge: 'top', bar: true, class: 'border-b' },
        { edge: 'bottom', bar: true, class: 'border-t' },
    ],
    defaultVariants: {
        edge: 'top',
    },
});

/**
 * Shows and hides its content with an animated height (or width). Closed content is invisible, so it is out of the
 * tab order and the accessibility tree as well.
 */
export const collapse = tv({
    slots: {
        base: [
            'grid transition-[grid-template-rows,grid-template-columns,visibility] duration-200 ease-out motion-reduce:transition-none',
            'data-[state=closed]:invisible',
        ],
        inner: 'min-h-0 min-w-0 overflow-hidden',
    },
    variants: {
        orientation: {
            vertical: { base: 'grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]' },
            horizontal: { base: 'grid-cols-[0fr] data-[state=open]:grid-cols-[1fr]' },
        },
    },
    defaultVariants: {
        orientation: 'vertical',
    },
});

/** A row that scrolls sideways, with arrow buttons and faded edges while there is more */
export const scroller = tv({
    slots: {
        base: 'relative flex min-w-0 items-center',
        viewport: [
            'flex min-w-0 flex-1 gap-3 overflow-x-auto overscroll-x-contain rounded-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0',
            '[--wc-fade-end:0px] [--wc-fade-start:0px] data-more-end:[--wc-fade-end:2.5rem] data-more-start:[--wc-fade-start:2.5rem]',
            '[mask-image:linear-gradient(to_right,transparent,black_var(--wc-fade-start),black_calc(100%-var(--wc-fade-end)),transparent)]',
            'rtl:[mask-image:linear-gradient(to_left,transparent,black_var(--wc-fade-start),black_calc(100%-var(--wc-fade-end)),transparent)]',
            focusRing,
        ],
        // Pointer only (aria-hidden, not focusable): the focused row scrolls with the arrow keys
        button: [
            'absolute top-1/2 z-[1] flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-line-2 bg-card text-fg',
            'shadow-[0_4px_12px_-6px_rgba(0,0,0,.4)] hover:bg-bg-2',
            'data-[side=start]:inset-s-0 data-[side=end]:inset-e-0 rtl:[&>svg]:-scale-x-100',
        ],
        buttonIcon: 'size-4',
    },
});

/** Cards of different heights in columns; the reading order stays the order of the children */
export const masonry = tv({
    base: ['block', ...responsiveColumns, 'columns-[var(--wc-cols-now)] [&>*]:break-inside-avoid'],
    variants: {
        gap: {
            sm: 'gap-x-2 [&>*]:mb-2',
            md: 'gap-x-4 [&>*]:mb-4',
            lg: 'gap-x-6 [&>*]:mb-6',
        },
        /** Measured rows in a grid (left to right, then down) instead of CSS columns (top to bottom) */
        measured: {
            true: 'grid grid-cols-[repeat(var(--wc-cols-now),minmax(0,1fr))] auto-rows-[4px] items-start [&>*]:mb-0',
        },
    },
    compoundVariants: [
        { measured: true, gap: 'sm', class: 'gap-x-2' },
        { measured: true, gap: 'md', class: 'gap-x-4' },
        { measured: true, gap: 'lg', class: 'gap-x-6' },
    ],
    defaultVariants: {
        gap: 'md',
    },
});
