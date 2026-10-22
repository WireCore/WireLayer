import { pressable, tv } from './tv.js';

// Filter bar above lists and tables, the active filters as chips, and the condition builder (and/or rules)

/** Filter bar: toggle with the number of active filters, chips, a collapsible compact form */
export const filterPanel = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-3',
        bar: 'flex flex-wrap items-center gap-2',
        toggle: [
            'inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-2 px-3 text-[13px] font-medium text-fg',
            ...pressable,
            'hover:border-fg aria-expanded:border-fg',
        ],
        toggleIcon: 'size-4 shrink-0',
        count: 'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[11px] leading-none text-on-primary forced-colors:border',
        actions: 'ms-auto flex items-center gap-2',
        content: 'rounded-xl border border-line bg-card p-4',
        /** Grid of the filter fields */
        fields: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
    },
});

/** The active filters as removable chips and "Reset all" */
export const filterChips = tv({
    slots: {
        base: 'm-0 flex list-none flex-wrap items-center gap-1.5 p-0',
        item: 'flex',
        name: 'text-muted',
        reset: [
            'inline-flex h-8 cursor-pointer items-center rounded-full px-2.5 text-[13px] font-medium text-fg underline underline-offset-2 hover:no-underline',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
    },
});

/** Nested and/or groups of rules (field, operator, value) */
export const conditionBuilder = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-3',
        group: 'm-0 flex min-w-0 flex-col gap-2.5 rounded-xl border border-line bg-card p-3',
        legend: 'sr-only',
        groupHeader: 'flex flex-wrap items-center gap-2',
        /** The and/or select of a group */
        combinatorSelect: 'w-auto',
        groupActions: 'ms-auto flex flex-wrap items-center gap-1',
        list: 'm-0 flex list-none flex-col gap-2 p-0',
        rule: 'flex flex-wrap items-start gap-2',
        field: 'w-44 max-w-full',
        operator: 'w-44 max-w-full',
        value: 'min-w-40 flex-1',
        range: 'flex flex-1 flex-wrap items-center gap-2',
        combinator: 'w-max px-1 font-mono text-[11px] tracking-label text-muted uppercase',
        empty: 'text-sm text-muted',
    },
    variants: {
        /** Groups inside groups: tinted, so the nesting is visible */
        nested: {
            true: { group: 'bg-bg-2' },
        },
    },
});

/** Repeated entries of a form (FormList): numbered items with move/remove buttons and an add button */
export const formList = tv({
    slots: {
        base: 'm-0 flex min-w-0 flex-col gap-3 border-0 p-0',
        legend: 'mb-1 p-0 text-[13px] font-medium text-fg',
        list: 'm-0 flex list-none flex-col gap-2 p-0',
        item: 'flex items-start gap-2 rounded-xl border border-line bg-card p-3 focus-within:border-line-2',
        index: 'mt-2 w-6 shrink-0 text-center font-mono text-xs text-muted tabular-nums',
        body: 'flex min-w-0 flex-1 flex-wrap items-start gap-3',
        actions: 'flex shrink-0 items-center gap-0.5',
        footer: 'flex flex-wrap items-center gap-3',
        hint: 'text-xs text-muted',
        error: 'text-xs text-danger',
    },
});

/** Key-value pairs (FormList preset): two inputs per row */
export const keyValueEditor = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-3',
        cell: 'min-w-40 flex-1',
        /** Message below a row (duplicate key) */
        error: 'basis-full text-xs text-danger',
    },
});

/** Multi-step form: steps, the current step's content, and a summary at the end */
export const wizard = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-4',
        summary: 'flex flex-col gap-3',
        error: 'text-sm text-danger',
    },
});
