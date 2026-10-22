import { tv } from './tv.js';

// Page level: mega menu, page header, bottom navigation, banner, notification center, result page, descriptions,
// toolbar regions

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';
const panelShadow = 'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]';

/** Where a MegaMenu turns into the menu button with a drawer (`never`: always the full navigation) */
export type MegaMenuCollapse = 'md' | 'lg' | 'xl' | 'container' | 'never';

/**
 * Website navigation with large panels (disclosure pattern): links, buttons that open a panel, or a link with its
 * own chevron button. Panels hold columns of headed groups and a featured area. Below a breakpoint a menu button
 * opens the navigation in a drawer with one accordion section per entry.
 */
export const megaMenu = tv({
    slots: {
        // The panels are placed on the root, so they can span the whole navigation
        base: 'relative flex items-center',
        list: 'm-0 flex list-none items-center gap-1 p-0',
        item: 'flex items-center',
        trigger: [
            'flex h-9 cursor-pointer items-center gap-1 rounded-md px-3 text-sm font-medium whitespace-nowrap text-fg hover:bg-line',
            'data-[state=open]:bg-line data-current:underline data-current:decoration-2 data-current:underline-offset-[6px]',
            focusRing,
        ],
        triggerIcon:
            'size-3.5 shrink-0 transition-transform motion-reduce:transition-none in-data-[state=open]:rotate-180',
        link: [
            'flex h-9 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-fg no-underline hover:bg-line',
            'aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[6px]',
            focusRing,
        ],
        /** The chevron button next to an entry that is a link itself */
        toggle: [
            '-ms-1 flex size-9 cursor-pointer items-center justify-center rounded-md text-fg hover:bg-line data-[state=open]:bg-line',
            focusRing,
        ],
        content: [
            // At least as wide as one column plus the teaser, even when the navigation itself is narrow
            'absolute inset-x-0 top-[calc(100%+6px)] z-40 flex min-w-[min(48rem,calc(100vw-2rem))] flex-col gap-4 rounded-xl border border-line-2 bg-card p-5 text-fg',
            panelShadow,
            'motion-safe:data-[state=open]:animate-pop-in',
        ],
        // The teaser moves below the columns when there is not enough room beside them
        body: 'flex flex-wrap gap-6',
        columns: 'grid min-w-0 flex-[1_1_24rem] grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-6',
        column: 'flex min-w-0 flex-col gap-5',
        group: 'flex min-w-0 flex-col gap-1',
        groupTitle: 'm-0 px-2 pb-1 font-mono text-[11px] leading-4 font-normal tracking-label text-muted uppercase',
        groupList: 'm-0 flex list-none flex-col gap-0.5 p-0',
        panelLink: [
            'flex gap-3 rounded-lg p-2 no-underline hover:bg-line aria-[current=page]:bg-line',
            'forced-colors:aria-[current=page]:border forced-colors:aria-[current=page]:border-[Highlight]',
            focusRing,
        ],
        panelIcon: 'mt-0.5 size-5 shrink-0 text-muted',
        panelText: 'flex min-w-0 flex-col gap-0.5',
        panelLabel: 'flex flex-wrap items-center gap-2 text-sm font-semibold text-fg',
        panelDescription: 'text-[13px] leading-snug text-muted',
        /** "Show all" below a group or the whole panel */
        more: [
            'inline-flex items-center gap-1 self-start rounded-md px-2 py-1 text-[13px] font-medium text-fg no-underline hover:underline',
            focusRing,
        ],
        moreIcon: 'size-3.5 shrink-0 rtl:-scale-x-100',
        footer: 'flex items-center justify-between gap-3 border-t border-line pt-3',
        /** Promotion or teaser beside the columns */
        featured: 'flex w-64 shrink-0 flex-col gap-2 rounded-lg bg-bg-2 p-4',
        featuredImage: 'aspect-video w-full rounded-md object-cover',
        featuredEyebrow: 'font-mono text-[11px] leading-4 tracking-label text-muted uppercase',
        featuredTitle: ['rounded-sm text-[15px] font-semibold text-fg no-underline hover:underline', focusRing],
        featuredDescription: 'text-[13px] leading-snug text-muted',
        /** Menu button that opens the drawer on small screens */
        burger: 'shrink-0',
        // Drawer: one accordion section per entry, targets of at least 44 px (WCAG 2.5.5)
        mobileNav: 'flex flex-col',
        mobileLink: [
            'flex min-h-11 items-center rounded-md px-2 text-[15px] font-semibold text-fg no-underline hover:bg-line',
            'aria-[current=page]:bg-line',
            focusRing,
        ],
        mobileGroup: 'flex flex-col gap-0.5 pb-3',
        mobileGroupTitle:
            'm-0 px-2 pt-2 pb-1 font-mono text-[11px] leading-4 font-normal tracking-label text-muted uppercase',
        mobilePanelLink: [
            'flex min-h-11 items-center gap-3 rounded-md px-2 text-sm text-fg no-underline hover:bg-line',
            'aria-[current=page]:bg-line aria-[current=page]:font-semibold',
            focusRing,
        ],
    },
    variants: {
        orientation: {
            horizontal: {},
            // A column of entries; the panels open beside it
            vertical: {
                base: 'items-stretch',
                list: 'flex-col items-stretch',
                item: 'relative',
                trigger: 'w-full justify-between',
                link: 'w-full',
                triggerIcon:
                    '-rotate-90 in-data-[state=open]:-rotate-90 rtl:rotate-90 rtl:in-data-[state=open]:rotate-90',
                content: 'inset-x-auto top-0 inset-s-[calc(100%+6px)] w-[44rem] max-w-[calc(100vw-2rem)]',
            },
        },
        /** Where the menu button replaces the entries (container: by the width of the navigation itself) */
        collapse: {
            md: { list: 'max-md:hidden', burger: 'md:hidden' },
            lg: { list: 'max-lg:hidden', burger: 'lg:hidden' },
            xl: { list: 'max-xl:hidden', burger: 'xl:hidden' },
            container: { base: '@container w-full', list: '@max-[64rem]:hidden', burger: '@min-[64rem]:hidden' },
            never: { burger: 'hidden' },
        },
    },
    defaultVariants: {
        orientation: 'horizontal',
        collapse: 'lg',
    },
});

/** Top of a page: breadcrumb, back link, title with status and meta, actions, tabs below */
export const pageHeader = tv({
    slots: {
        base: 'flex flex-col gap-3',
        back: [
            'inline-flex items-center gap-1.5 self-start rounded-sm text-sm text-muted no-underline hover:text-fg',
            focusRing,
        ],
        backIcon: 'size-4 shrink-0 rtl:-scale-x-100',
        // Actions wrap below the title on narrow containers
        row: 'flex flex-wrap items-start justify-between gap-x-6 gap-y-3',
        heading: 'flex min-w-0 flex-1 basis-80 flex-col gap-1',
        titleRow: 'flex flex-wrap items-center gap-x-3 gap-y-1',
        title: 'm-0 text-2xl leading-tight font-semibold tracking-tight text-fg',
        subtitle: 'm-0 text-sm text-muted',
        meta: 'flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted',
        actions: 'flex flex-wrap items-center gap-2',
        tabs: '-mb-px',
    },
    variants: {
        size: {
            sm: { title: 'text-lg' },
            md: {},
        },
        /** A line below the header (e.g. without tabs) */
        divided: {
            true: { base: 'border-b border-line pb-4' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** Bar of 3–5 destinations at the bottom of the screen (mobile web), above the home indicator */
export const bottomNavigation = tv({
    slots: {
        base: [
            'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]',
            'forced-colors:border-t-[CanvasText]',
        ],
        list: 'm-0 flex list-none items-stretch justify-around p-0',
        item: 'flex min-w-0 flex-1',
        link: [
            'relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-[11px] font-medium text-muted no-underline',
            'hover:text-fg aria-[current=page]:text-fg',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
            'forced-colors:aria-[current=page]:text-[Highlight]',
        ],
        // The pill behind the icon marks the current destination (with aria-current, not by colour alone)
        iconBox: [
            'relative flex h-7 w-12 items-center justify-center rounded-full',
            'in-aria-[current=page]:bg-primary/14 in-aria-[current=page]:text-primary',
            'forced-colors:in-aria-[current=page]:border forced-colors:in-aria-[current=page]:border-[Highlight]',
        ],
        icon: 'size-5 shrink-0',
        label: 'max-w-full truncate',
        badge: [
            'absolute -top-1 inset-e-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-card bg-danger px-1',
            'font-mono text-[10px] leading-none text-on-danger',
        ],
    },
    variants: {
        /** In the flow of the page instead of fixed at the bottom (e.g. inside a mobile frame) */
        inline: {
            true: { base: 'static' },
        },
    },
});

export type BannerVariant = 'info' | 'success' | 'warn' | 'danger' | 'neutral';
export type BannerPosition = 'inline' | 'top' | 'bottom';

/** Page-wide notice above or below everything (maintenance, cookies, trial ending) */
export const banner = tv({
    slots: {
        base: 'flex w-full items-center gap-3 border-y px-4 py-2.5 text-sm',
        icon: 'size-4 shrink-0',
        content: 'flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5',
        title: 'font-semibold',
        message: 'min-w-0',
        actions: 'flex shrink-0 flex-wrap items-center gap-2',
        dismiss: [
            'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-80 hover:bg-fg/10 hover:opacity-100',
            focusRing,
        ],
        dismissIcon: 'size-3.5',
    },
    variants: {
        variant: {
            info: { base: 'border-info/30 bg-info/10 text-fg', icon: 'text-info' },
            success: { base: 'border-success/30 bg-success/10 text-fg', icon: 'text-success' },
            warn: { base: 'border-warn/30 bg-warn/10 text-fg', icon: 'text-warn' },
            danger: { base: 'border-danger/30 bg-danger/10 text-fg', icon: 'text-danger' },
            neutral: { base: 'border-line bg-bg-2 text-fg', icon: 'text-muted' },
        },
        position: {
            inline: {},
            top: { base: 'fixed inset-x-0 top-0 z-50 border-t-0' },
            bottom: {
                base: 'fixed inset-x-0 bottom-0 z-50 border-b-0 pb-[calc(0.625rem+env(safe-area-inset-bottom))]',
            },
        },
    },
    defaultVariants: {
        variant: 'info',
        position: 'inline',
    },
});

/** Bell with a counter that opens the list of notifications (popover or drawer) */
export const notificationCenter = tv({
    slots: {
        base: 'relative inline-flex',
        /** Classes for the popover panel around the list */
        panel: 'w-96 gap-0 p-0',
        panelTitle: 'px-4 pt-3.5 pb-2',
        panelBody: 'mt-0 gap-0',
        /** Unread count and "mark all as read" */
        header: 'flex items-center justify-between gap-3 border-b border-line px-4 pb-2.5 text-xs text-muted',
        markAll: [
            'cursor-pointer rounded-sm text-xs font-medium text-fg underline-offset-4 hover:underline',
            'disabled:cursor-not-allowed disabled:opacity-40',
            focusRing,
        ],
        scroll: 'max-h-[min(28rem,70vh)] overflow-y-auto',
        group: 'flex flex-col',
        groupTitle:
            'm-0 bg-bg-2 px-4 py-1 font-mono text-[11px] leading-4 font-normal tracking-label text-muted uppercase',
        list: 'm-0 flex list-none flex-col p-0',
        item: 'relative flex gap-3 border-b border-line px-4 py-3 last:border-b-0',
        // Unread: a dot plus "Unread" for screen readers (not color alone)
        dot: 'mt-1.5 size-2 shrink-0 rounded-full bg-primary forced-colors:bg-[Highlight]',
        dotPlaceholder: 'mt-1.5 size-2 shrink-0',
        icon: 'mt-0.5 size-4 shrink-0 text-muted',
        body: 'flex min-w-0 flex-1 flex-col gap-0.5',
        title: 'text-sm text-fg',
        titleLink: ['rounded-sm text-fg no-underline hover:underline', focusRing],
        description: 'text-[13px] leading-snug text-muted',
        time: 'font-mono text-[11px] text-muted',
        actions: 'flex shrink-0 items-start gap-1',
        empty: 'px-4 py-10 text-center text-sm text-muted',
        more: 'flex justify-center border-t border-line p-2',
        status: 'sr-only',
        srOnly: 'sr-only',
    },
    variants: {
        unread: {
            true: { title: 'font-semibold', item: 'bg-primary/5' },
        },
    },
});

export type ResultStatus = 'success' | 'info' | 'warn' | 'error' | '403' | '404' | '500';

/** Result or error page: illustration (icon), title, text and actions */
export const result = tv({
    slots: {
        base: 'flex flex-col items-center gap-4 px-6 py-12 text-center',
        illustration: 'flex size-20 items-center justify-center rounded-full',
        icon: 'size-10',
        code: 'font-mono text-5xl leading-none font-semibold tracking-tight text-fg',
        title: 'm-0 text-xl font-semibold text-fg',
        description: 'm-0 max-w-md text-sm leading-relaxed text-muted',
        extra: 'w-full max-w-md',
        actions: 'mt-2 flex flex-wrap items-center justify-center gap-2',
    },
    variants: {
        status: {
            success: { illustration: 'bg-success/14 text-success' },
            info: { illustration: 'bg-info/14 text-info' },
            warn: { illustration: 'bg-warn/14 text-warn' },
            error: { illustration: 'bg-danger/14 text-danger' },
            '403': { illustration: 'bg-warn/14 text-warn' },
            '404': { illustration: 'bg-bg-2 text-muted' },
            '500': { illustration: 'bg-danger/14 text-danger' },
        },
    },
    defaultVariants: {
        status: 'info',
    },
});

/**
 * Responsive column count: set `--wc-cols` and optionally `--wc-cols-sm` … `--wc-cols-xl` on the element; the
 * current count is `--wc-cols-now` (items can span up to it)
 */
export const responsiveColumns = [
    '[--wc-cols-now:var(--wc-cols,1)]',
    'sm:[--wc-cols-now:var(--wc-cols-sm,var(--wc-cols,1))]',
    'md:[--wc-cols-now:var(--wc-cols-md,var(--wc-cols-sm,var(--wc-cols,1)))]',
    'lg:[--wc-cols-now:var(--wc-cols-lg,var(--wc-cols-md,var(--wc-cols-sm,var(--wc-cols,1))))]',
    'xl:[--wc-cols-now:var(--wc-cols-xl,var(--wc-cols-lg,var(--wc-cols-md,var(--wc-cols-sm,var(--wc-cols,1)))))]',
];

/** Terms and values in a grid (<dl>): columns per breakpoint, items spanning columns, optional borders */
export const descriptions = tv({
    slots: {
        base: 'flex flex-col gap-3',
        header: 'flex flex-wrap items-center justify-between gap-3',
        title: 'm-0 text-base font-semibold text-fg',
        actions: 'flex flex-wrap items-center gap-2',
        list: [
            'm-0 grid grid-cols-[repeat(var(--wc-cols-now),minmax(0,1fr))] gap-x-6 gap-y-4 text-sm',
            ...responsiveColumns,
        ],
        // An item spans --wc-span columns, never more than there are
        item: [
            'flex min-w-0 flex-col gap-1',
            'data-span:[grid-column:span_min(var(--wc-span),var(--wc-cols-now))/span_min(var(--wc-span),var(--wc-cols-now))]',
        ],
        term: 'font-mono text-[11px] tracking-label text-muted uppercase',
        details: 'm-0 min-w-0 text-fg',
    },
    variants: {
        /** Label next to its value instead of above */
        orientation: {
            vertical: {},
            horizontal: {
                item: 'grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-baseline gap-x-4',
            },
        },
        /** Table look: cells with lines between them, labels on a tinted background */
        bordered: {
            true: {
                list: 'gap-px overflow-hidden rounded-lg border border-line bg-line',
                item: 'gap-0 bg-card',
                term: 'bg-bg-2 px-3 py-2 font-sans text-[13px] tracking-normal normal-case',
                details: 'px-3 py-2',
            },
        },
    },
    compoundVariants: [
        {
            bordered: true,
            orientation: 'horizontal',
            class: {
                item: 'grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-stretch gap-x-0',
                term: 'border-e border-line',
            },
        },
    ],
    defaultVariants: {
        orientation: 'vertical',
    },
});

/** Toolbar with start, centre and end areas (Toolbar `start`/`center`/`end`) */
export const toolbarRegion = tv({
    base: 'flex min-w-0 flex-wrap items-center gap-1',
    variants: {
        region: {
            start: 'justify-self-start',
            center: 'justify-self-center',
            end: 'justify-self-end',
        },
    },
    defaultVariants: {
        region: 'start',
    },
});
