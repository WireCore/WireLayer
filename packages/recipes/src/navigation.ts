import { popupMotion, pressable, tv } from './tv.js';

// Select, tabs, steps, pagination and progress. Highlighted/selected states use the system
// Highlight colour in Windows high-contrast mode, where backgrounds are removed.

/**
 * Distance of a submenu from the item that opens it, in px. Ark places a submenu beside the item, which ends 5px
 * inside its menu (padding and border) – 9 leaves a gap of about 4px between the two menus instead of an overlap.
 * Pass it as `positioning.offset.mainAxis`: Zag sets `gutter: 0` for every submenu and ignores our gutter.
 */
export const SUBMENU_GUTTER = 9;

/** Floating list of options – Select, MultiSelect, Combobox */
export const listboxContent = [
    'flex max-h-72 flex-col overflow-y-auto rounded-popup border border-line-2 bg-card p-1 text-fg outline-none',
    'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
    ...popupMotion,
];

export const listboxItem = [
    'flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm',
    'data-highlighted:bg-line data-[state=checked]:bg-line data-disabled:cursor-not-allowed data-disabled:opacity-40',
    'forced-colors:data-highlighted:forced-color-adjust-none forced-colors:data-highlighted:bg-[Highlight] forced-colors:data-highlighted:text-[HighlightText]',
];

/** Option of Select, MultiSelect, Combobox, Listbox – grows to two lines with a description */
export const listboxOption = [
    ...listboxItem,
    'data-description:h-auto data-description:min-h-9 data-description:py-1.5',
];

/** Parts shared by the option lists: groups, two-line options, empty and loading rows, lazy-loading sentinel */
export const listboxParts = {
    group: 'flex flex-col',
    groupLabel: 'px-2.5 pt-2 pb-1 font-mono text-[11px] tracking-label text-muted uppercase',
    itemBody: 'flex min-w-0 flex-1 flex-col',
    itemDescription: 'truncate text-xs text-muted',
    empty: 'px-2.5 py-2 text-sm text-muted',
    loading: 'flex h-9 shrink-0 items-center gap-2 px-2.5 text-sm text-muted',
    loadingIcon: 'size-4 shrink-0 motion-safe:animate-spin',
    // Scrolled into view at the end of the list: loads the next page (hasMore)
    sentinel: 'h-px shrink-0',
};

/** Parts of a select popup with a search field or "select all" on top (the list scrolls below them) */
export const listboxPanel = {
    header: 'sticky top-0 z-[1] -mx-1 -mt-1 mb-1 flex flex-col gap-1 border-b border-line bg-card p-1',
    search: [
        'h-8 w-full min-w-0 shrink-0 rounded-md border border-line-strong bg-bg px-2.5 text-sm text-fg outline-none',
        'placeholder:text-muted focus:border-primary',
    ],
    list: 'flex flex-col outline-none',
};

/** Clear button and loading spinner inside a select field */
export const selectFieldParts = {
    // Over the trigger, before the arrow; tabindex=-1 – Backspace/Delete on the field clears as well
    clear: [
        'absolute top-1/2 inset-e-8 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted',
        'hover:bg-line hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
    ],
    clearIcon: 'size-3.5',
    spinner: 'size-full motion-safe:animate-spin',
};

export const select = tv({
    slots: {
        base: 'flex w-full flex-col',
        trigger: [
            'flex h-[var(--wc-control-h-md,2.5rem)] w-full cursor-pointer items-center justify-between gap-2.5 rounded-[var(--wc-control-radius-md,0.5rem)] border border-line-strong bg-bg pe-2.5 ps-3 text-start text-[length:var(--wc-control-text-md,15px)] text-fg',
            'outline-none transition-colors motion-reduce:transition-none focus-visible:border-primary data-[state=open]:border-primary',
            'data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2 data-disabled:text-muted',
        ],
        value: 'flex min-w-0 items-center gap-2 truncate',
        icon: 'size-4 shrink-0 text-muted',
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-180',
        indicatorIcon: 'size-full',
        content: listboxContent,
        item: listboxOption,
        itemText: 'flex-1 truncate',
        itemIndicator: 'size-[15px] shrink-0',
        /** Wraps trigger and clear button (clearable) */
        control: 'relative flex',
        /** Announces loaded options (data source) */
        status: 'sr-only',
        ...selectFieldParts,
        ...listboxParts,
        ...listboxPanel,
    },
    variants: {
        size: {
            sm: {
                trigger:
                    'h-[var(--wc-control-h-sm,2rem)] rounded-[var(--wc-control-radius-sm,0.375rem)] ps-2.5 pe-2 text-[length:var(--wc-control-text-sm,13px)]',
            },
            md: {},
            lg: {
                trigger:
                    'h-[var(--wc-control-h-lg,3rem)] rounded-[var(--wc-control-radius-lg,10px)] ps-4 pe-3 text-[length:var(--wc-control-text-lg,1rem)] leading-normal',
            },
        },
        // Room for the clear button between value and arrow
        clearable: {
            true: { indicator: 'ms-7' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const tabs = tv({
    slots: {
        base: 'flex flex-col gap-3.5 data-[orientation=vertical]:flex-row data-[orientation=vertical]:gap-6',
        list: [
            'flex gap-5 border-b border-line',
            'data-[orientation=vertical]:shrink-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:gap-1 data-[orientation=vertical]:border-b-0 data-[orientation=vertical]:border-e',
        ],
        trigger: [
            'relative -mb-px flex shrink-0 cursor-pointer items-center gap-1.5 rounded-sm pb-2.5 text-sm font-medium whitespace-nowrap text-muted',
            'transition-colors motion-reduce:transition-none hover:text-fg disabled:cursor-not-allowed disabled:opacity-40',
            'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-selected:text-fg data-selected:after:bg-primary',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'forced-colors:data-selected:after:forced-color-adjust-none forced-colors:data-selected:after:bg-[Highlight]',
            // Vertical: the bar at the end side
            'data-[orientation=vertical]:mb-0 data-[orientation=vertical]:-me-px data-[orientation=vertical]:py-1.5 data-[orientation=vertical]:pe-4',
            'data-[orientation=vertical]:after:inset-x-auto data-[orientation=vertical]:after:inset-y-0 data-[orientation=vertical]:after:inset-e-0 data-[orientation=vertical]:after:h-auto data-[orientation=vertical]:after:w-0.5',
        ],
        icon: 'size-[15px] shrink-0',
        content: 'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        /** Scrollable list (TabsList `scrollable`): arrows at the sides while there is more */
        scroller: 'relative flex min-w-0 items-stretch border-b border-line',
        // The line moves to the scroller (the list clips at its border); the bar sits on it
        scrollList:
            'min-w-0 flex-1 overflow-x-auto overflow-y-hidden border-b-0 [scrollbar-width:none] [&_[role=tab]]:mb-0 [&::-webkit-scrollbar]:hidden',
        scrollButton: [
            'absolute top-0 bottom-px z-[1] flex w-7 cursor-pointer items-center justify-center bg-bg text-muted hover:text-fg',
            'data-[side=start]:inset-s-0 data-[side=end]:inset-e-0 rtl:[&>svg]:-scale-x-100',
        ],
        scrollIcon: 'size-4',
        /** Closable trigger: the trigger and its close button side by side */
        tab: 'relative flex shrink-0',
        close: [
            'absolute top-0 inset-e-0 flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted hover:bg-line hover:text-fg',
            'in-data-[orientation=vertical]:top-1.5 in-data-[orientation=vertical]:inset-e-1',
        ],
        closeIcon: 'size-3',
    },
    variants: {
        /** Room for the close button inside the trigger */
        closable: {
            true: { trigger: 'pe-6 data-[orientation=vertical]:pe-8' },
        },
    },
});

export type StepStatus = 'done' | 'active' | 'todo';

export const steps = tv({
    slots: {
        base: 'flex items-center gap-2',
        item: 'flex flex-1 items-center gap-2',
        indicator: 'flex size-7 shrink-0 items-center justify-center rounded-full border',
        icon: 'size-3.5',
        number: 'font-mono text-xs',
        label: 'text-[13px] font-medium whitespace-nowrap text-fg',
        status: 'sr-only',
    },
    variants: {
        status: {
            done: {
                indicator: [
                    'border-primary bg-primary text-on-primary',
                    'forced-colors:forced-color-adjust-none forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]',
                ],
            },
            active: { indicator: 'border-primary text-fg' },
            todo: { indicator: 'border-line-strong text-muted' },
        },
    },
});

export const pagination = tv({
    slots: {
        base: 'flex flex-wrap items-center justify-between gap-3',
        summary: 'text-xs text-muted',
        list: 'flex items-center gap-1',
        trigger: [
            'flex size-8 items-center justify-center rounded-full text-fg hover:bg-line',
            ...pressable,
            // Links (getPageHref) cannot be disabled – Ark marks them with data-disabled
            'data-disabled:cursor-not-allowed data-disabled:opacity-40',
        ],
        triggerIcon: 'size-4 rtl:-scale-x-100',
        item: [
            'flex size-8 items-center justify-center rounded-full font-mono text-xs text-fg hover:bg-line',
            ...pressable,
            'data-selected:bg-primary data-selected:text-on-primary',
            'forced-colors:data-selected:forced-color-adjust-none forced-colors:data-selected:bg-[Highlight] forced-colors:data-selected:text-[HighlightText]',
        ],
        ellipsis: 'flex size-8 items-center justify-center font-mono text-xs text-muted',
        /** "Page 2 of 5" between the arrows (compact) */
        compact: 'px-2 text-xs whitespace-nowrap text-muted tabular-nums',
        /** Rows per page and "go to page" */
        pageSize: 'flex items-center gap-2 text-xs text-muted',
        pageSizeSelect: 'w-20',
        jumper: 'flex items-center gap-2 text-xs text-muted',
        jumperInput: 'w-16',
    },
    variants: {
        /** Compact on narrow containers: the page buttons give way to "Page 2 of 5" (variant="auto") */
        responsive: {
            true: { base: '@container', item: '@max-md:hidden', ellipsis: '@max-md:hidden', compact: '@md:hidden' },
        },
    },
});

export const progress = tv({
    slots: {
        base: 'flex w-full flex-col gap-1.5',
        header: 'flex justify-between gap-3 font-mono text-[11px] text-muted',
        label: 'min-w-0 truncate',
        value: 'shrink-0',
        track: 'h-1.5 overflow-hidden rounded-[3px] bg-line-2 forced-colors:border forced-colors:border-[CanvasText]',
        range: [
            'h-full rounded-[3px] bg-primary transition-[width] motion-reduce:transition-none',
            'forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight]',
        ],
        /** Parts of the bar (`segments`), next to each other in the track */
        segments: 'flex size-full',
        segment: [
            'h-full transition-[width] motion-reduce:transition-none first:rounded-s-[3px] last:rounded-e-[3px]',
            'forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight] forced-colors:border-e forced-colors:border-[Canvas]',
        ],
        /** Step display (`steps`): one block per step */
        steps: 'flex size-full gap-1',
        step: 'h-full flex-1 rounded-[3px] bg-line-2 data-[state=complete]:bg-primary forced-colors:data-[state=complete]:bg-[Highlight]',
        legend: 'm-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-fg',
        legendItem: 'flex items-center gap-1.5',
        swatch: 'size-2 shrink-0 rounded-full',
        legendValue: 'text-muted tabular-nums',
        /** Text in the bar (`barText`) over the empty part */
        barText: [
            'pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-1.5',
            'font-mono text-[10.5px] leading-none whitespace-nowrap text-fg tabular-nums',
        ],
        /** The same text in the range, as wide as the track (100cqw) and cut by the range – in the colour for the fill */
        barTextFill: [
            'pointer-events-none absolute inset-y-0 start-0 flex w-[100cqw] items-center justify-center px-1.5',
            'font-mono text-[10.5px] leading-none whitespace-nowrap text-on-primary tabular-nums',
            'forced-colors:text-[HighlightText]',
        ],
    },
    variants: {
        /** `xs`: a thin bar with small text, e.g. in a list or a status bar */
        size: {
            xs: { base: 'gap-1', header: 'text-[10px]', track: 'h-1' },
            md: {},
        },
        /** The label only names the bar for screen readers; the value stays at the end */
        hideLabel: {
            true: { header: 'justify-end' },
        },
        /** Text in the bar: a taller track, the range covers the text below and cuts the text in it */
        hasText: {
            true: { track: 'relative @container h-4', range: 'relative overflow-hidden' },
        },
        /** Vertical bar: grows from the bottom (fill the height of the parent) */
        orientation: {
            horizontal: {},
            vertical: {
                base: 'h-full w-auto items-center',
                track: 'flex h-full min-h-24 w-1.5 flex-1 flex-col justify-end',
                range: 'w-full transition-[height]',
                segments: 'flex-col-reverse',
                segment:
                    'h-auto w-full first:rounded-none first:rounded-b-[3px] last:rounded-none last:rounded-t-[3px]',
                steps: 'flex-col-reverse',
            },
        },
        /** Diagonal stripes on the filled part */
        striped: {
            true: {
                range: 'bg-[linear-gradient(45deg,rgba(255,255,255,.22)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.22)_50%,rgba(255,255,255,.22)_75%,transparent_75%,transparent)] bg-size-[1rem_1rem]',
                segment:
                    'bg-[linear-gradient(45deg,rgba(255,255,255,.22)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.22)_50%,rgba(255,255,255,.22)_75%,transparent_75%,transparent)] bg-size-[1rem_1rem]',
            },
        },
        /** Step display: the blocks replace the track's background */
        stepped: {
            true: { track: 'bg-transparent forced-colors:border-0' },
        },
        /** Moving stripes – only with motion-safe */
        animated: {
            true: { range: 'motion-safe:animate-progress-stripes', segment: 'motion-safe:animate-progress-stripes' },
        },
        /** Colour of a segment – and of the filled part (`status`) */
        color: {
            primary: { segment: 'bg-primary', swatch: 'bg-primary' },
            info: {
                segment: 'bg-info',
                swatch: 'bg-info',
                range: 'bg-info',
                step: 'data-[state=complete]:bg-info',
                barTextFill: 'text-on-info',
            },
            success: {
                segment: 'bg-success',
                swatch: 'bg-success',
                range: 'bg-success',
                step: 'data-[state=complete]:bg-success',
                barTextFill: 'text-on-success',
            },
            warn: {
                segment: 'bg-warn',
                swatch: 'bg-warn',
                range: 'bg-warn',
                step: 'data-[state=complete]:bg-warn',
                barTextFill: 'text-on-warn',
            },
            danger: {
                segment: 'bg-danger',
                swatch: 'bg-danger',
                range: 'bg-danger',
                step: 'data-[state=complete]:bg-danger',
                barTextFill: 'text-on-danger',
            },
            muted: { segment: 'bg-muted', swatch: 'bg-muted' },
        },
    },
    compoundVariants: [
        { size: 'xs', hasText: true, class: { track: 'h-3.5', barText: 'text-[10px]', barTextFill: 'text-[10px]' } },
    ],
    defaultVariants: {
        orientation: 'horizontal',
        color: 'primary',
        size: 'md',
    },
});

/** Side navigation with expandable groups (PanelMenu) */
export const sidebarNav = tv({
    slots: {
        base: 'flex w-full flex-col',
        list: 'flex flex-col gap-0.5',
        // padding-left grows with --depth (0 at the top)
        link: [
            'flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md pe-2.5 ps-[calc(var(--depth)*16px+10px)] text-start text-sm text-fg no-underline hover:bg-line',
            'aria-[current=page]:bg-line aria-[current=page]:font-semibold',
            'outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
            'forced-colors:aria-[current=page]:border forced-colors:aria-[current=page]:border-[Highlight]',
        ],
        icon: 'size-4 shrink-0 text-muted',
        label: 'flex-1 truncate',
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-90 rtl:not-data-[state=open]:-scale-x-100',
        content: [
            'overflow-hidden',
            'motion-safe:data-[state=open]:animate-collapse-in motion-safe:data-[state=closed]:animate-collapse-out',
        ],
        sublist: 'mt-0.5 flex flex-col gap-0.5',
        /** Count or short text after the label */
        badge: [
            'ms-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-line px-1.5',
            'font-mono text-[10.5px] leading-none text-fg',
        ],
        /** Above and below the links (e.g. logo, account) */
        header: 'mb-3 flex items-center gap-2',
        footer: 'mt-auto flex flex-col gap-1 border-t border-line pt-3',
        /** First letter for entries without an icon in the rail */
        monogram:
            'flex size-4 shrink-0 items-center justify-center font-mono text-[11px] leading-none text-muted uppercase',
    },
    variants: {
        /** Icons only (the labels stay readable for screen readers and show as tooltips) */
        rail: {
            true: {
                base: 'h-full',
                link: 'relative justify-center ps-2.5',
                label: 'sr-only',
                indicator: 'hidden',
                badge: 'absolute top-0.5 inset-e-0.5 ms-0 h-4 min-w-4 px-1 text-[9.5px]',
            },
        },
        /** With `rail`: the labels appear while the rail is hovered or focused (it expands, e.g. in an AppShell) */
        expandOnHover: {
            // The root carries data-rail in rail mode
            true: {
                link: 'in-[[data-rail]:focus-within]:justify-start in-[[data-rail]:hover]:justify-start',
                label: 'in-[[data-rail]:focus-within]:not-sr-only in-[[data-rail]:hover]:not-sr-only',
                indicator: 'in-[[data-rail]:focus-within]:block in-[[data-rail]:hover]:block',
                badge: 'in-[[data-rail]:focus-within]:static in-[[data-rail]:hover]:static',
            },
        },
    },
});

/** Steps with a panel each and back/next buttons (wizard) */
export const stepper = tv({
    slots: {
        base: 'flex w-full flex-col gap-5',
        list: 'flex items-start gap-2',
        item: 'flex flex-1 items-center gap-2 last:flex-none',
        trigger: [
            'flex cursor-pointer items-center gap-2.5 rounded-md p-1 text-start',
            'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed',
        ],
        indicator: [
            'flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong font-mono text-xs text-muted',
            'data-current:border-primary data-current:text-fg',
            'data-complete:border-primary data-complete:bg-primary data-complete:text-on-primary',
            'forced-colors:data-complete:forced-color-adjust-none forced-colors:data-complete:border-[Highlight] forced-colors:data-complete:bg-[Highlight] forced-colors:data-complete:text-[HighlightText]',
        ],
        indicatorIcon: 'size-3.5',
        text: 'flex flex-col',
        label: 'text-[13px] font-medium whitespace-nowrap text-fg',
        description: 'text-xs whitespace-nowrap text-muted',
        separator: 'h-px min-w-6 flex-1 bg-line-strong data-complete:bg-primary',
        content: 'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        actions: 'flex items-center justify-between gap-2',
        /** A step that is still loading (StepperItem `loading`) */
        spinner: 'size-3.5 motion-safe:animate-spin',
    },
    variants: {
        /** Label below the number, centred */
        labelBottom: {
            true: {
                item: 'items-start',
                trigger: 'flex-col gap-1.5 text-center',
                text: 'items-center',
                separator: 'mt-[18px]',
            },
        },
        /** Steps listed top to bottom beside the content */
        vertical: {
            true: {
                base: 'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-8',
                list: 'row-span-2 flex-col gap-0',
                item: 'w-full flex-col items-start gap-0',
                separator: 'ms-[17px] h-6 min-h-6 w-px min-w-0 flex-none',
            },
        },
    },
    compoundVariants: [{ labelBottom: true, vertical: true, class: { separator: 'mt-0' } }],
});
