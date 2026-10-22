import { tv } from './tv.js';

// Layout helpers: splitter, scroll panel, image preview, inplace editing, scroll to top, block UI, speed dial

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

/** Panels whose size is changed by dragging or with the arrow keys on the handle between them */
export const splitter = tv({
    slots: {
        // Ark sizes its root inline to 100 % – the size goes on this wrapper instead
        base: 'overflow-hidden rounded-lg border border-line',
        root: 'flex data-[orientation=vertical]:flex-col',
        panel: 'min-h-0 min-w-0 overflow-auto',
        // The handle: a thin line with a wider hit area (WCAG 2.5.8)
        handle: [
            'relative flex shrink-0 items-center justify-center bg-line outline-none',
            'data-[orientation=horizontal]:w-px data-[orientation=horizontal]:cursor-col-resize',
            'data-[orientation=vertical]:h-px data-[orientation=vertical]:cursor-row-resize',
            'before:absolute before:content-[""] data-[orientation=horizontal]:before:inset-y-0 data-[orientation=horizontal]:before:-inset-x-2',
            'data-[orientation=vertical]:before:inset-x-0 data-[orientation=vertical]:before:-inset-y-2',
            'hover:bg-line-strong data-dragging:bg-primary focus-visible:bg-fg',
        ],
        grip: [
            'z-[1] flex items-center justify-center rounded-full border border-line-2 bg-card text-muted',
            'data-[orientation=horizontal]:h-6 data-[orientation=horizontal]:w-3 data-[orientation=vertical]:h-3 data-[orientation=vertical]:w-6',
        ],
        gripIcon: 'size-3',
    },
});

/** Scroll area with slim scrollbars in the design (the content stays natively scrollable) */
export const scrollPanel = tv({
    slots: {
        base: 'relative overflow-hidden rounded-lg',
        viewport: ['size-full rounded-[inherit] outline-none', focusRing],
        content: 'min-w-full',
        scrollbar: [
            'flex touch-none p-0.5 select-none motion-safe:transition-opacity',
            'data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col',
        ],
        thumb: 'flex-1 rounded-full bg-line-strong hover:bg-muted',
    },
    variants: {
        /**
         * `auto`: when the content overflows (default), `hover`: only while the pointer is over the panel or it
         * scrolls, `always`: with a visible track, `hidden`: no bars (wheel, touch and keys still scroll)
         */
        scrollbars: {
            auto: {},
            hover: {
                scrollbar:
                    'opacity-0 data-dragging:opacity-100 data-hover:opacity-100 data-scrolling:opacity-100 motion-safe:transition-opacity',
            },
            always: { scrollbar: 'bg-line' },
            hidden: { scrollbar: 'hidden' },
        },
        /** Fades the top and bottom edge while there is more to scroll in that direction */
        fade: {
            true: {
                viewport: [
                    '[--wc-fade-bottom:0px] [--wc-fade-top:0px] not-data-at-bottom:[--wc-fade-bottom:1.5rem] not-data-at-top:[--wc-fade-top:1.5rem]',
                    '[mask-image:linear-gradient(to_bottom,transparent,black_var(--wc-fade-top),black_calc(100%-var(--wc-fade-bottom)),transparent)]',
                ],
            },
        },
    },
    defaultVariants: {
        scrollbars: 'auto',
    },
});

/** Picture that opens large in a dialog, with zoom and rotation */
export const imagePreview = tv({
    slots: {
        trigger: ['group/image relative inline-block cursor-zoom-in overflow-hidden rounded-lg', focusRing],
        image: 'block max-w-full',
        hint: [
            'pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0',
            'group-hover/image:opacity-100 group-focus-visible/image:opacity-100 motion-safe:transition-opacity',
        ],
        hintIcon: 'size-6',
        positioner: 'fixed inset-0 z-50 flex items-center justify-center',
        content: 'relative flex size-full flex-col outline-none',
        toolbar: 'absolute top-3 inset-e-3 z-[1] flex gap-1 rounded-full bg-card/90 p-1',
        stage: 'flex min-h-0 flex-1 items-center justify-center overflow-auto p-12',
        preview: 'max-h-full max-w-full motion-safe:transition-transform',
    },
});

/** Text that turns into an editor on click */
export const inplace = tv({
    slots: {
        display: [
            '-mx-1.5 -my-1 inline-flex min-h-7 cursor-text items-center rounded-md px-1.5 py-1 text-start hover:bg-line',
            focusRing,
        ],
        hint: 'sr-only',
        content: 'flex items-center gap-2',
    },
});

/** Button back to the top, shown after scrolling down */
export const scrollTop = tv({
    base: [
        'fixed inset-e-6 bottom-6 z-40 shadow-[0_8px_20px_-8px_rgba(0,0,0,.45)]',
        'data-[state=hidden]:pointer-events-none data-[state=hidden]:opacity-0 motion-safe:transition-opacity',
    ],
});

/** Covers a region while it is busy; the content is inert meanwhile */
export const blockUi = tv({
    slots: {
        base: 'relative',
        overlay: [
            'absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-bg/75 text-sm text-fg',
            'motion-safe:animate-fade-in',
        ],
    },
});

// Around the button: a zero-size box on its centre, the actions placed at --wc-x/--wc-y from there
const radialSpeedDial = {
    content: 'relative size-0 gap-0',
    item: 'absolute top-0 left-0 [transform:translate(calc(var(--wc-x)-50%),calc(var(--wc-y)-50%))]',
    label: [
        'pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 shadow-md',
        'group-hover/action:opacity-100 group-data-highlighted/action:opacity-100 motion-safe:transition-opacity',
    ],
};

/** Floating button that opens a column of actions */
export const speedDial = tv({
    slots: {
        trigger: [
            'flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary',
            'shadow-[0_10px_24px_-10px_rgba(0,0,0,.55)] hover:opacity-90',
            'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        triggerIcon: 'size-6 motion-safe:transition-transform data-[state=open]:rotate-45',
        content: 'z-50 flex flex-col items-end gap-2 outline-none motion-safe:data-[state=open]:animate-pop-in',
        item: 'group/action flex cursor-pointer items-center gap-3 outline-none data-disabled:cursor-not-allowed data-disabled:opacity-40',
        label: [
            'rounded-md border border-line-2 bg-card px-2.5 py-1 text-sm whitespace-nowrap text-fg shadow-sm',
            'group-data-highlighted/action:border-fg',
        ],
        action: [
            'flex size-11 items-center justify-center rounded-full border border-line-2 bg-card text-fg shadow-sm',
            'group-data-highlighted/action:bg-line group-data-highlighted/action:outline-2 group-data-highlighted/action:outline-offset-2 group-data-highlighted/action:outline-fg',
        ],
        actionIcon: 'size-5',
    },
    variants: {
        /**
         * `column`: a column with visible labels; `circle`, `semicircle`, `quarter`: around the button, the labels
         * appear as tooltips on hover and focus (they stay the accessible names)
         */
        layout: {
            column: {},
            circle: radialSpeedDial,
            semicircle: radialSpeedDial,
            quarter: radialSpeedDial,
        },
    },
    defaultVariants: {
        layout: 'column',
    },
});
