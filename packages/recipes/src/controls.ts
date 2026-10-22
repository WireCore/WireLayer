import { listboxOption, listboxParts } from './navigation.js';
import { tv } from './tv.js';

// Smaller controls: listbox, split button, toggle button, toolbar, input group, overlay badge

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

/** Always visible list of options (single or multiple choice) */
export const listbox = tv({
    slots: {
        base: 'flex w-full flex-col gap-1.5',
        label: 'text-[13px] font-medium text-fg',
        content: [
            'flex max-h-72 flex-col overflow-y-auto rounded-lg border border-line-strong bg-bg p-1 text-fg outline-none',
            'focus-visible:border-primary data-disabled:opacity-60',
        ],
        item: listboxOption,
        icon: 'size-4 shrink-0 text-muted',
        itemText: 'flex-1 truncate',
        itemIndicator: 'size-[15px] shrink-0',
        /** Search field above the list (filter) */
        search: [
            'h-8 w-full min-w-0 rounded-md border border-line-strong bg-bg px-2.5 text-sm text-fg outline-none',
            'placeholder:text-muted focus:border-primary disabled:cursor-not-allowed disabled:opacity-60',
        ],
        /** Check box before the label (`checkboxes`) */
        check: [
            'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-line-strong text-on-primary',
            'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
            'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
            'forced-colors:data-[state=checked]:forced-color-adjust-none forced-colors:data-[state=checked]:bg-[Highlight] forced-colors:data-[state=checked]:text-[HighlightText]',
            'forced-colors:data-[state=indeterminate]:forced-color-adjust-none forced-colors:data-[state=indeterminate]:bg-[Highlight] forced-colors:data-[state=indeterminate]:text-[HighlightText]',
        ],
        checkIcon: 'size-3 stroke-3',
        /** "Select all" above the list (`selectAll`) */
        selectAll: [
            'flex h-9 w-full shrink-0 cursor-pointer items-center gap-2 rounded-md px-2.5 text-start text-sm text-fg hover:bg-line',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:opacity-60',
        ],
        /** Announces loading (data source) */
        status: 'sr-only',
        ...listboxParts,
    },
});

/** Main action and a menu with more actions, joined into one control */
export const splitButton = tv({
    slots: {
        base: 'inline-flex items-stretch',
        main: 'rounded-e-none pe-3',
        // The divider takes the text colour, so it works on every variant
        toggle: 'rounded-s-none border-s border-l-current/25 px-2.5',
        toggleIcon: 'size-4',
    },
});

/** On/off button (aria-pressed); the button recipe gives size and look, this the pressed state */
export const toggleButton = tv({
    base: [
        'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-on-primary',
        'forced-colors:data-[state=on]:forced-color-adjust-none forced-colors:data-[state=on]:bg-[Highlight] forced-colors:data-[state=on]:text-[HighlightText]',
    ],
});

/** Group of controls with one tab stop (arrow keys move inside) */
export const toolbar = tv({
    base: [
        'flex flex-wrap items-center gap-1 rounded-lg border border-line bg-card p-1',
        'aria-[orientation=vertical]:flex-col aria-[orientation=vertical]:items-stretch',
    ],
    variants: {
        /** Start, centre and end areas (the centre stays in the middle) */
        regions: {
            true: 'grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center',
        },
    },
});

/** Input with buttons or text attached: the borders join, only the outer corners stay round */
export const inputGroup = tv({
    slots: {
        base: [
            'flex w-full items-stretch',
            // !important: the corners win over the children's own size variants (in @wirecore/wirelayer-css those carry
            // more specificity than a child selector)
            '[&>*]:relative [&>*]:rounded-none! [&>*:focus-within]:z-[1] [&>*:focus-visible]:z-[1]',
            '[&>*:first-child]:rounded-s-lg! [&>*:last-child]:rounded-e-lg! [&>*:not(:first-child)]:-ms-px',
        ],
        addon: 'flex shrink-0 items-center border border-line-strong bg-bg-2 px-3 text-sm whitespace-nowrap text-muted',
    },
});

/** A count or dot on the corner of any element (avatar, icon) */
export const overlayBadge = tv({
    slots: {
        base: 'relative inline-flex',
        badge: [
            'pointer-events-none absolute -top-1.5 -inset-e-1.5 flex h-[18px] min-w-[18px] items-center justify-center',
            'rounded-full border-2 border-card bg-danger px-1 font-mono text-[10px] leading-none text-on-danger',
        ],
        dot: 'pointer-events-none absolute top-0 inset-e-0 size-2.5 rounded-full border-2 border-card bg-danger',
        label: 'sr-only',
    },
});

/** Short question next to the control that triggered it */
export const confirmPopup = tv({
    slots: {
        content: [
            'z-50 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-xl border border-line-2 bg-card p-4 text-fg outline-none',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            'motion-safe:data-[state=open]:animate-pop-in motion-safe:data-[state=closed]:animate-pop-out',
        ],
        message: 'text-sm leading-normal',
        actions: 'flex justify-end gap-2',
    },
});

/** Card with a header; optionally collapsible */
export const panel = tv({
    slots: {
        base: 'flex flex-col overflow-hidden rounded-card border border-line bg-card text-fg',
        header: 'flex min-h-14 items-center justify-between gap-3 px-5 py-3',
        title: 'text-base font-semibold',
        trigger: ['-m-1 flex flex-1 cursor-pointer items-center gap-2 rounded-md p-1 text-start', focusRing],
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-90 rtl:not-data-[state=open]:-scale-x-100',
        actions: 'flex items-center gap-1',
        content: [
            'overflow-hidden border-t border-line',
            'motion-safe:data-[state=open]:animate-collapse-in motion-safe:data-[state=closed]:animate-collapse-out',
        ],
        body: 'px-5 py-4 text-sm leading-relaxed',
        footer: 'border-t border-line px-5 py-3',
    },
});

/** Group of fields under a legend */
export const fieldset = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-4 rounded-card border border-line p-5 data-disabled:opacity-60',
        legend: '-ms-1.5 px-1.5 text-sm font-semibold text-fg',
        helperText: '-mt-2 text-[13px] text-muted',
        errorText: '-mt-2 text-[13px] text-danger',
        /** Collapsible: the legend is a button that shows/hides the fields */
        trigger: ['-m-1 flex cursor-pointer items-center gap-1.5 rounded-md p-1 text-start', focusRing],
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-90 rtl:not-data-[state=open]:-scale-x-100',
        content: 'flex flex-col gap-4',
    },
});
