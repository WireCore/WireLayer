import { popupMotion, tv } from './tv.js';

// Navigation menu (mega menu), circular progress, tour, table of contents, native select, spoiler, highlight,
// navigation progress, sparkline

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

/** Website navigation with large panels (mega menu); disclosure buttons, links inside */
export const navigationMenu = tv({
    slots: {
        base: 'relative',
        list: 'flex items-center gap-1',
        item: 'relative',
        trigger: [
            'flex h-9 cursor-pointer items-center gap-1 rounded-md px-3 text-sm font-medium text-fg hover:bg-line',
            'data-[state=open]:bg-line',
            focusRing,
        ],
        triggerIcon: 'size-3.5 transition-transform motion-reduce:transition-none in-data-[state=open]:rotate-180',
        link: [
            'flex h-9 items-center rounded-md px-3 text-sm font-medium text-fg no-underline hover:bg-line',
            focusRing,
        ],
        content: [
            'absolute top-[calc(100%+6px)] inset-s-0 z-40 grid w-[34rem] max-w-[calc(100vw-2rem)] grid-cols-2 gap-1 rounded-popup border border-line-2 bg-card p-2',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            ...popupMotion,
        ],
        panelLink: ['flex gap-3 rounded-lg p-3 no-underline hover:bg-line', focusRing],
        panelIcon: 'mt-0.5 size-5 shrink-0 text-muted',
        panelText: 'flex flex-col gap-0.5',
        panelLabel: 'text-sm font-semibold text-fg',
        panelDescription: 'text-[13px] leading-snug text-muted',
    },
});

/** Progress as a ring, e.g. for key figures */
export const progressCircle = tv({
    slots: {
        base: 'inline-flex flex-col items-center gap-1.5',
        circle: 'relative [--thickness:6px]',
        track: 'stroke-line',
        range: 'stroke-primary motion-safe:transition-[stroke-dashoffset] forced-colors:stroke-[Highlight]',
        value: 'absolute inset-0 flex items-center justify-center font-mono text-sm text-fg tabular-nums',
        label: 'text-xs text-muted',
    },
    variants: {
        size: {
            sm: { circle: '[--size:48px] [--thickness:4px]', value: 'text-[11px]' },
            md: { circle: '[--size:72px]' },
            lg: { circle: '[--size:104px] [--thickness:8px]', value: 'text-lg' },
        },
        status: {
            neutral: {},
            success: { range: 'stroke-success' },
            warn: { range: 'stroke-warn' },
            danger: { range: 'stroke-danger' },
        },
    },
    defaultVariants: {
        size: 'md',
        status: 'neutral',
    },
});

/** Guided tour: a step card next to the highlighted element */
export const tour = tv({
    slots: {
        // One layer above the page; inside it the DOM order stacks backdrop, spotlight and the step card
        layer: 'pointer-events-none fixed inset-0 z-50',
        backdrop: 'pointer-events-auto bg-black/50',
        spotlight: 'rounded-lg [box-shadow:0_0_0_2px_var(--wc-primary)]',
        // Steps without a target (type dialog) are not positioned by Ark – centred here
        positioner: [
            'relative data-[type=dialog]:fixed data-[type=dialog]:inset-0 data-[type=dialog]:flex',
            'data-[type=dialog]:items-center data-[type=dialog]:justify-center data-[type=dialog]:p-4',
        ],
        content: [
            'pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-popup border border-line-2 bg-card p-4 text-fg outline-none',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            ...popupMotion,
        ],
        header: 'flex items-start justify-between gap-3',
        title: 'text-sm font-semibold',
        description: 'text-[13px] leading-normal text-muted',
        footer: 'mt-2 flex items-center justify-between gap-2',
        progress: 'font-mono text-xs text-muted',
        actions: 'flex gap-2',
        arrow: '[--arrow-background:var(--color-card)] [--arrow-size:10px]',
        arrowTip: 'border-t border-s border-line-2',
    },
});

/** "On this page": links to the headings, the visible section is marked */
export const tableOfContents = tv({
    slots: {
        base: 'flex flex-col gap-2',
        title: 'font-mono text-[11px] tracking-label text-muted uppercase',
        list: 'relative flex flex-col border-s border-line',
        link: [
            '-ms-px block border-s-2 border-transparent py-1 pe-2 ps-[calc(var(--depth,1)*12px)] text-sm text-muted no-underline hover:text-fg',
            'aria-[current=location]:border-primary aria-[current=location]:text-fg',
            focusRing,
        ],
    },
});

/** The browser's own select in the design (mobile, server templates) */
export const nativeSelect = tv({
    slots: {
        base: 'relative flex w-full',
        select: [
            'h-[var(--wc-control-h-md,2.5rem)] w-full cursor-pointer appearance-none rounded-[var(--wc-control-radius-md,0.5rem)] border border-line-strong bg-bg pe-9 ps-3 text-[length:var(--wc-control-text-md,15px)] text-fg outline-none',
            'transition-colors focus:border-primary motion-reduce:transition-none',
            'aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:border-line disabled:bg-bg-2 disabled:text-muted',
        ],
        icon: 'pointer-events-none absolute top-1/2 inset-e-3 size-4 -translate-y-1/2 text-muted',
    },
    variants: {
        size: {
            sm: {
                select: 'h-[var(--wc-control-h-sm,2rem)] rounded-[var(--wc-control-radius-sm,0.375rem)] ps-2.5 text-[length:var(--wc-control-text-sm,13px)]',
            },
            md: {},
            lg: {
                select: 'h-[var(--wc-control-h-lg,3rem)] rounded-[var(--wc-control-radius-lg,10px)] ps-4 text-[length:var(--wc-control-text-lg,1rem)] leading-normal',
            },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** Long content cut to a height, with "Show more" */
export const spoiler = tv({
    slots: {
        base: 'flex flex-col items-start gap-1.5',
        content: [
            'relative w-full overflow-hidden motion-safe:transition-[max-height]',
            // Fades the cut edge while closed
            'data-[state=closed]:after:absolute data-[state=closed]:after:inset-x-0 data-[state=closed]:after:bottom-0',
            'data-[state=closed]:after:h-8 data-[state=closed]:after:bg-gradient-to-t data-[state=closed]:after:from-bg data-[state=closed]:after:content-[""]',
        ],
        toggle: [
            'cursor-pointer rounded-sm text-sm font-semibold text-fg underline underline-offset-2 hover:text-muted',
            focusRing,
        ],
    },
});

/** Marked search hits in a text */
export type HighlightColor = 'warn' | 'info' | 'success' | 'danger' | 'primary';

export const highlight = tv({
    base: 'rounded-[3px] px-0.5 text-fg forced-colors:bg-[Mark] forced-colors:text-[MarkText]',
    variants: {
        /** Tint of the hit – one per search term, so several terms can be told apart (text stays ≥ 4.5:1) */
        color: {
            warn: 'bg-warn/25',
            info: 'bg-info/25',
            success: 'bg-success/25',
            danger: 'bg-danger/25',
            primary: 'bg-primary/25',
        },
    },
    defaultVariants: {
        color: 'warn',
    },
});

/** Thin bar at the top while a page loads */
export const navigationProgress = tv({
    slots: {
        base: 'pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 data-[state=idle]:opacity-0 motion-safe:transition-opacity',
        bar: 'h-full bg-primary motion-safe:transition-[width] forced-colors:bg-[Highlight]',
    },
});

/** Small line chart without axes, e.g. in a table cell or a key figure */
export const sparkline = tv({
    base: 'relative inline-block',
});
