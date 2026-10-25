import { listboxContent, listboxOption, listboxParts } from './navigation.js';
import { popupMotion, tv } from './tv.js';

// Application building blocks: app shell, command palette, tags input, copy button, hover card, keyboard keys

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

/** Frame of an app: header, side navigation (a drawer on small screens), main area, optional aside */
export const appShell = tv({
    slots: {
        base: 'min-h-dvh bg-bg text-fg',
        // First focusable element: jumps over header and navigation (WCAG 2.4.1)
        skipLink: [
            'sr-only focus:not-sr-only focus:fixed focus:top-3 focus:inset-s-3 focus:z-[60] focus:rounded-lg focus:bg-primary',
            'focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary',
        ],
        header: 'sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-card px-4',
        burger: 'lg:hidden',
        body: 'flex',
        navbar: [
            'sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-e border-line bg-card p-3',
            'lg:flex',
        ],
        main: 'min-w-0 flex-1 p-6 outline-none',
        aside: 'sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 overflow-y-auto border-s border-line p-4 xl:block',
        /** Page footer (contentinfo) below the main area */
        footer: 'border-t border-line bg-card px-6 py-4 text-sm text-muted',
        /** Button in the header that folds the navbar into a rail (desktop only) */
        collapseToggle: 'max-lg:hidden',
        /**
         * Handle between navbar or aside and the main area (role="separator"): drag, arrow keys, Home/End, double
         * click resets. A thin line with a wider hit area (WCAG 2.5.8).
         */
        resizer: [
            'sticky top-14 z-10 -mx-1 hidden h-[calc(100dvh-3.5rem)] w-2 shrink-0 cursor-col-resize touch-none outline-none',
            'lg:data-[side=navbar]:block xl:data-[side=aside]:block',
            'before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:content-[""]',
            'hover:before:w-0.5 hover:before:bg-line-strong focus-visible:before:w-0.5 focus-visible:before:bg-fg data-dragging:before:bg-primary',
            'forced-colors:before:bg-[CanvasText]',
        ],
    },
    variants: {
        /** Navbar and aside take their width from --wc-navbar-width / --wc-aside-width (resizable or set) */
        sized: {
            true: { navbar: 'w-[var(--wc-navbar-width,16rem)]', aside: 'w-[var(--wc-aside-width,18rem)]' },
        },
        /** The navbar folds into a rail of icons on the desktop */
        collapsed: {
            true: { navbar: 'w-16 overflow-x-hidden px-2' },
        },
        /** With `collapsed`: the rail opens over the main area while hovered or focused */
        expandOnHover: {
            true: {
                navbar: [
                    'z-20 motion-safe:transition-[width,margin] motion-safe:duration-150',
                    'hover:-me-48 hover:w-64 hover:shadow-[8px_0_24px_-12px_rgba(0,0,0,.35)]',
                    'focus-within:-me-48 focus-within:w-64 focus-within:shadow-[8px_0_24px_-12px_rgba(0,0,0,.35)]',
                ],
            },
        },
        /** The header slides away while scrolling down and comes back when scrolling up (not while it has focus) */
        headroom: {
            true: {
                header: [
                    'motion-safe:transition-transform motion-safe:duration-200',
                    'data-hidden:-translate-y-full data-hidden:focus-within:translate-y-0',
                ],
            },
        },
        /** `header-first`: the header spans everything; `navbar-first`: the navbar runs the full height beside it */
        layout: {
            'header-first': {},
            'navbar-first': {
                base: 'grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] grid-rows-[auto_minmax(0,1fr)_auto]',
                header: 'col-start-3 col-end-6 row-start-1',
                body: 'contents',
                navbar: 'top-0 col-start-1 row-start-1 row-end-4 h-dvh self-start',
                main: 'col-start-3 row-start-2',
                aside: 'col-start-5 row-start-2 self-start',
                footer: 'col-start-3 col-end-6 row-start-3',
                resizer: [
                    'self-start data-[side=navbar]:top-0 data-[side=navbar]:col-start-2 data-[side=navbar]:row-start-1 data-[side=navbar]:row-end-4 data-[side=navbar]:h-dvh',
                    'data-[side=aside]:col-start-4 data-[side=aside]:row-start-2',
                ],
            },
        },
    },
    compoundVariants: [
        // The rail keeps its width – collapsing wins over a stored width
        { sized: true, collapsed: true, class: { navbar: 'w-16' } },
    ],
    defaultVariants: {
        layout: 'header-first',
    },
});

/** Search over pages and actions (Strg+K): a dialog with a search field and a list */
export const commandPalette = tv({
    slots: {
        positioner: 'fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]',
        content: [
            'flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line-2 bg-card text-fg outline-none',
            'shadow-[0_24px_48px_-20px_rgba(0,0,0,.55)]',
            'motion-safe:data-[state=open]:animate-dialog-in motion-safe:data-[state=closed]:animate-dialog-out',
        ],
        search: 'flex items-center gap-2.5 border-b border-line px-4',
        searchIcon: 'size-4 shrink-0 text-muted',
        input: 'h-12 min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-muted',
        list: 'flex min-h-0 flex-col overflow-y-auto p-1.5 outline-none',
        groupLabel: 'px-2.5 pt-2.5 pb-1 font-mono text-[11px] tracking-label text-muted uppercase',
        item: listboxOption,
        icon: 'size-4 shrink-0 text-muted',
        label: 'flex-1 truncate',
        /** Label and description of an item */
        itemBody: listboxParts.itemBody,
        description: listboxParts.itemDescription,
        /** Matched characters of the search */
        mark: 'bg-transparent font-semibold text-fg underline decoration-2 underline-offset-2',
        loading: 'flex items-center gap-2 px-2.5 py-2 text-sm text-muted',
        loadingIcon: 'size-4 shrink-0 motion-safe:animate-spin',
        empty: 'px-4 py-8 text-center text-sm text-muted',
        footer: 'flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2 text-xs text-muted',
        hint: 'flex items-center gap-1',
    },
});

/** Key or shortcut, e.g. Strg + K */
export const kbd = tv({
    base: [
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-b-2 border-line-2 bg-bg-2 px-1',
        'font-mono text-[11px] leading-none text-fg',
    ],
});

/** Free entries as removable tags (labels, e-mail addresses) */
export const tagsInput = tv({
    slots: {
        // relative: the suggestions open below the field
        base: 'relative flex w-full flex-col',
        control: [
            'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-line-strong bg-bg px-2 py-1.5 text-fg',
            'transition-colors focus-within:border-primary motion-reduce:transition-none',
            'data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2',
        ],
        item: 'inline-flex',
        preview: [
            'inline-flex h-7 items-center gap-1 rounded-md bg-line pe-1 ps-2 text-sm text-fg outline-none',
            'data-highlighted:bg-primary data-highlighted:text-on-primary',
        ],
        delete: [
            'flex size-5 cursor-pointer items-center justify-center rounded text-current opacity-70 hover:opacity-100',
            focusRing,
        ],
        deleteIcon: 'size-3.5',
        itemInput: 'h-7 rounded-md border border-primary bg-bg px-2 text-sm outline-none',
        input: 'h-7 min-w-24 flex-1 bg-transparent px-1 text-[15px] outline-none placeholder:text-muted',
        clear: [
            'ms-auto flex size-7 cursor-pointer items-center justify-center rounded-full text-muted hover:text-fg',
            focusRing,
        ],
        clearIcon: 'size-3.5',
        /** Suggestions (suggestions prop): a list below the field */
        content: [...listboxContent, 'absolute inset-x-0 top-full mt-1'],
        option: listboxOption,
        optionText: 'flex-1 truncate',
        spinner: 'size-4 shrink-0 text-muted motion-safe:animate-spin',
        ...listboxParts,
    },
});

/** Copies a value; the icon turns into a check and the result is announced */
export const copyButton = tv({
    slots: {
        base: 'inline-flex items-center gap-2',
        value: 'font-mono text-sm text-fg',
        status: 'sr-only',
    },
});

/** Preview that appears on hover or focus (e.g. a person card) */
export const hoverCard = tv({
    slots: {
        content: [
            'w-72 max-w-[calc(100vw-2rem)] rounded-popup border border-line-2 bg-card p-4 text-sm text-fg outline-none',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            ...popupMotion,
        ],
        arrow: '[--arrow-background:var(--color-card)] [--arrow-size:10px]',
        arrowTip: 'border-t border-s border-line-2',
    },
});
