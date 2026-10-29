import { popupMotion, pressable, tv } from './tv.js';

// Menu, tooltip, dialog and toast – rendered in a portal on top of the page.

const floatingSurface = [
    'flex flex-col rounded-popup border border-line-2 bg-card p-1 text-fg outline-none',
    'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
];

/** Arrow from a floating panel to its trigger (Popover, Menu with `arrow`) */
const popupArrow = {
    arrow: '[--arrow-background:var(--color-card)] [--arrow-size:10px]',
    arrowTip: 'border-t border-l border-line-2',
};

export const menu = tv({
    slots: {
        content: [...floatingSurface, 'min-w-56', ...popupMotion],
        ...popupArrow,
        item: [
            'flex h-9 shrink-0 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm',
            'data-highlighted:bg-line data-disabled:cursor-not-allowed data-disabled:opacity-40',
            'forced-colors:data-highlighted:forced-color-adjust-none forced-colors:data-highlighted:bg-[Highlight] forced-colors:data-highlighted:text-[HighlightText]',
        ],
        icon: 'size-4 shrink-0',
        label: 'flex-1 truncate',
        shortcut: 'font-mono text-[11px] text-muted',
        separator: 'my-1 h-px border-0 bg-line',
        groupLabel: 'px-2.5 pt-2 pb-1 font-mono text-[11px] tracking-label text-muted uppercase',
        submenuIcon: 'ms-auto size-4 shrink-0 text-muted rtl:-scale-x-100',
        /** Box before the label of checkbox and radio items: the check mark or dot of a checked item */
        indicator: 'flex size-4 shrink-0 items-center justify-center',
        indicatorIcon: 'size-4',
        indicatorDot: 'size-2 fill-current',
        /** Filter field at the top of long menus (searchable) */
        search: 'mb-1 flex shrink-0 border-b border-line p-1 pb-2',
        searchInput: [
            'h-8 w-full min-w-0 rounded-md border border-line-strong bg-bg px-2.5 text-sm text-fg outline-none placeholder:text-muted',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-fg',
        ],
        empty: 'px-2.5 py-2 text-sm text-muted',
    },
    variants: {
        danger: {
            true: { item: 'text-danger' },
        },
    },
});

export const tooltip = tv({
    slots: {
        content: [
            'max-w-xs rounded-md bg-fg px-2.5 py-1.5 text-xs font-medium text-bg forced-colors:border',
            ...popupMotion,
        ],
        arrow: '[--arrow-background:var(--color-fg)] [--arrow-size:7px]',
    },
});

export const popover = tv({
    slots: {
        content: [
            'relative flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-1 rounded-popup border border-line-2 bg-card p-4 text-fg outline-none',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            ...popupMotion,
        ],
        ...popupArrow,
        /** Optional dimming behind the panel (`overlay`) */
        backdrop: [
            'fixed inset-0 z-50 bg-black/40',
            'motion-safe:data-[state=open]:animate-fade-in motion-safe:data-[state=closed]:animate-fade-out',
        ],
        title: 'pe-8 text-sm font-semibold',
        description: 'text-[13px] leading-normal text-muted',
        body: 'mt-2 flex flex-col gap-3 text-sm',
        close: [
            'absolute top-2.5 inset-e-2.5 flex size-7 items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg',
            ...pressable,
        ],
        closeIcon: 'size-3.5',
    },
    variants: {
        /** `trigger`: as wide as the trigger or anchor (Ark sets --reference-width) */
        width: {
            trigger: { content: 'w-[var(--reference-width)] max-w-none' },
        },
        /** The title only for screen readers – it still names the panel */
        hideTitle: {
            true: { title: 'sr-only', body: 'mt-0' },
        },
    },
});

export type DialogStatus = 'neutral' | 'success' | 'info' | 'warn' | 'danger';

export const dialog = tv({
    slots: {
        backdrop: [
            'fixed inset-0 z-50 bg-[var(--wc-backdrop,rgb(0_0_0/0.6))]',
            'motion-safe:data-[state=open]:animate-fade-in motion-safe:data-[state=closed]:animate-fade-out',
        ],
        positioner: 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4',
        content: [
            // Width from --wc-dialog-w: set by `size`, or your own, e.g. style="--wc-dialog-w: 36rem"
            'flex w-full max-w-[var(--wc-dialog-w,400px)] flex-col rounded-[14px] border border-line-2 bg-card text-fg outline-none',
            'shadow-[0_24px_48px_-20px_rgba(0,0,0,.55)]',
            'motion-safe:data-[state=open]:animate-dialog-in motion-safe:data-[state=closed]:animate-dialog-out',
        ],
        header: 'flex items-center justify-between gap-3 pt-4 pe-4 ps-[18px]',
        iconBox: 'flex size-9 items-center justify-center rounded-[10px]',
        icon: 'size-[18px]',
        close: [
            'ms-auto flex size-8 items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg',
            ...pressable,
        ],
        closeIcon: 'size-4',
        body: 'flex flex-col gap-1.5 px-[18px] pt-3 pb-[18px]',
        title: 'text-lg font-semibold tracking-[-0.02em]',
        description: 'text-sm leading-[1.55] text-muted',
        footer: 'flex flex-wrap justify-end gap-2 border-t border-line px-4 py-3',
        /** Switches between the normal size and the whole screen (`maximizable`) */
        maximize: [
            'ms-auto flex size-8 items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg',
            ...pressable,
        ],
        maximizeIcon: 'size-4',
    },
    variants: {
        /** The title only for screen readers – it still names the dialog */
        hideTitle: {
            true: { title: 'sr-only' },
        },
        /** `titlePosition: 'header'`: the title in the row of the close button (a smaller icon before it), as on the Drawer */
        titleInHeader: {
            true: {
                header: 'border-b border-line pb-3',
                iconBox: 'size-7 shrink-0 rounded-lg',
                icon: 'size-4',
                title: 'min-w-0 flex-1 text-base break-words',
                body: 'pt-4',
            },
        },
        status: {
            neutral: { iconBox: 'bg-line text-fg' },
            success: { iconBox: 'bg-success/14 text-success' },
            info: { iconBox: 'bg-info/14 text-info' },
            warn: { iconBox: 'bg-warn/14 text-warn' },
            danger: { iconBox: 'bg-danger/14 text-danger' },
        },
        /** Maximum width: sm 320px (20rem), md 400px (25rem, default), lg 560px (35rem), xl 800px (50rem) */
        size: {
            sm: { content: '[--wc-dialog-w:320px]' },
            md: { content: '[--wc-dialog-w:400px]' },
            lg: { content: '[--wc-dialog-w:560px]' },
            xl: { content: '[--wc-dialog-w:800px]' },
            full: { content: 'max-w-none' },
        },
        /** Where the dialog sits on the screen; without it centred */
        position: {
            center: { positioner: 'items-center justify-center' },
            top: { positioner: 'items-start' },
            bottom: { positioner: 'items-end' },
            start: { positioner: 'justify-start' },
            end: { positioner: 'justify-end' },
        },
        /** `inside`: only the body scrolls, header and footer stay; `outside` (default): the page behind scrolls */
        scrollBehavior: {
            // The whole dialog scrolls with the page; a class of its own for @wirecore/wirelayer-css
            outside: { body: 'overflow-visible' },
            inside: { content: 'max-h-full min-h-0', body: 'min-h-0 flex-1 overflow-y-auto' },
        },
        /** Covers the whole screen */
        fullscreen: {
            true: {
                positioner: 'p-0',
                content: 'h-full max-h-none w-full max-w-none rounded-none border-0',
            },
        },
        /** Full width on small screens */
        responsive: {
            true: { content: 'max-sm:max-w-none' },
        },
        /** Moved by dragging the header */
        draggable: {
            true: { header: 'cursor-move touch-none select-none' },
        },
        /** With the maximize button the close button sits right next to it */
        maximizable: {
            true: { close: 'ms-0' },
        },
    },
    defaultVariants: {
        status: 'neutral',
    },
});

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
export type OverlaySize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type DialogPosition = 'center' | 'top' | 'bottom' | 'start' | 'end';

const drawerSizes: OverlaySize[] = ['sm', 'md', 'lg', 'xl', 'full'];

export const drawer = tv({
    slots: {
        backdrop: [
            'fixed inset-0 z-50 bg-[var(--wc-backdrop,rgb(0_0_0/0.6))]',
            'motion-safe:data-[state=open]:animate-fade-in motion-safe:data-[state=closed]:animate-fade-out',
        ],
        positioner: 'fixed inset-0 z-50 flex',
        content: [
            'flex flex-col border-line-2 bg-card text-fg outline-none shadow-[0_24px_48px_-20px_rgba(0,0,0,.55)]',
            'motion-safe:data-[state=open]:animate-slide-in motion-safe:data-[state=closed]:animate-slide-out',
        ],
        header: 'flex items-start justify-between gap-3 border-b border-line py-4 pe-4 ps-5',
        text: 'flex min-w-0 flex-col gap-1',
        title: 'text-lg font-semibold tracking-[-0.02em]',
        description: 'text-sm leading-normal text-muted',
        close: [
            'flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg',
            ...pressable,
        ],
        closeIcon: 'size-4',
        body: 'flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4',
        footer: 'flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3',
    },
    variants: {
        /** The title only for screen readers – it still names the drawer */
        hideTitle: {
            true: { title: 'sr-only' },
        },
        placement: {
            right: {
                positioner: 'justify-end',
                content:
                    'h-full w-[420px] max-w-[calc(100vw-2rem)] border-s [--wc-slide-x:100%] rtl:[--wc-slide-x:-100%]',
            },
            left: {
                positioner: 'justify-start',
                content:
                    'h-full w-[420px] max-w-[calc(100vw-2rem)] border-e [--wc-slide-x:-100%] rtl:[--wc-slide-x:100%]',
            },
            bottom: {
                positioner: 'items-end',
                content: 'max-h-[85vh] w-full rounded-t-2xl border-t [--wc-slide-y:100%]',
            },
            top: {
                positioner: 'items-start',
                content: 'max-h-[85vh] w-full rounded-b-2xl border-b [--wc-slide-y:-100%]',
            },
        },
        /** Width (left/right) or height (top/bottom); without it 420px wide or as high as the content. `full`: the whole screen */
        size: {
            sm: { content: '[--wc-drawer-h:30vh] [--wc-drawer-w:320px]' },
            md: { content: '[--wc-drawer-h:50vh] [--wc-drawer-w:420px]' },
            lg: { content: '[--wc-drawer-h:70vh] [--wc-drawer-w:560px]' },
            xl: { content: '[--wc-drawer-h:85vh] [--wc-drawer-w:720px]' },
            full: { content: 'max-h-none max-w-none rounded-none [--wc-drawer-h:100dvh] [--wc-drawer-w:100vw]' },
        },
        /** Floats with a gap to the screen edge and rounded corners */
        offset: {
            true: { positioner: 'p-3', content: 'rounded-2xl border' },
        },
    },
    compoundVariants: [
        { placement: ['left', 'right'], size: drawerSizes, class: { content: 'w-[var(--wc-drawer-w)]' } },
        { placement: ['top', 'bottom'], size: drawerSizes, class: { content: 'h-[var(--wc-drawer-h)]' } },
        { offset: true, size: 'full', class: { content: 'rounded-2xl' } },
    ],
    defaultVariants: {
        placement: 'right',
    },
});

export const toast = tv({
    slots: {
        root: [
            'flex w-[360px] max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl bg-fg py-2.5 pe-2.5 ps-3.5 text-bg',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.5)] forced-colors:border',
            // Ark stacks the toasts through these CSS variables
            '[translate:var(--x)_var(--y)] [scale:var(--scale)] [z-index:var(--z-index)] [height:var(--height)] [opacity:var(--opacity)]',
            'transition-[translate,scale,opacity,height] duration-300 motion-reduce:transition-none',
        ],
        icon: 'size-[18px] shrink-0',
        spinner:
            'size-[18px] shrink-0 animate-[spin_0.8s_linear_infinite] motion-reduce:animate-[spin_2s_linear_infinite]',
        text: 'flex min-w-0 flex-1 flex-col gap-px',
        title: 'text-sm font-semibold',
        description: 'text-xs text-bg/65',
        action: [
            'h-[30px] shrink-0 cursor-pointer rounded-full bg-bg px-3 text-xs font-semibold text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg',
        ],
        close: [
            'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-bg/65 hover:bg-bg/10 hover:text-bg',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg',
        ],
        closeIcon: 'size-3.5',
        /** Remaining time until the toast closes (decorative); stops while the toasts are paused */
        progress: [
            'pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-bg/45 rtl:origin-right',
            // The pause needs the higher specificity: the animation shorthand would reset the play state
            'motion-safe:animate-toast-progress motion-reduce:hidden [[data-paused]_&]:[animation-play-state:paused]',
        ],
    },
    variants: {
        /** Room for the progress bar at the bottom edge */
        showProgress: {
            true: { root: 'relative overflow-hidden' },
        },
        /** Can be swiped away sideways (touch keeps scrolling vertically) */
        swipeable: {
            true: { root: 'touch-pan-y' },
        },
    },
});

/** Menu bar of an application (File, Edit, …): the menus open below their item */
export const menubar = tv({
    slots: {
        base: 'flex flex-wrap items-center gap-0.5 rounded-lg border border-line bg-card p-1',
        item: [
            'flex h-8 cursor-pointer items-center rounded-md px-3 text-sm font-medium text-fg hover:bg-line',
            'data-[state=open]:bg-line outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        /** Around the bar when there is content before/after it or a menu button for small screens */
        root: 'flex items-center gap-2',
        start: 'flex shrink-0 items-center gap-2',
        end: 'ms-auto flex shrink-0 items-center gap-2',
        /** Opens all menus in one on small screens */
        burger: 'md:hidden',
    },
    variants: {
        /** Below the md breakpoint the bar gives way to the menu button */
        responsive: {
            true: { base: 'max-md:hidden' },
        },
    },
});
