import { tv } from './tv.js';

// Empty state, data list (terms and values), action bar for a selection, countdown, formatted numbers

/** Placeholder for an empty list, table or search: icon, title, text and actions */
export const emptyState = tv({
    slots: {
        base: 'flex flex-col items-center justify-center gap-3 px-6 py-10 text-center',
        icon: 'flex size-12 items-center justify-center rounded-full bg-bg-2 text-muted',
        iconSvg: 'size-6',
        title: 'text-base font-semibold text-fg',
        description: 'max-w-sm text-sm text-muted',
        actions: 'mt-1 flex flex-wrap items-center justify-center gap-2',
    },
    variants: {
        variant: {
            plain: {},
            dashed: { base: 'rounded-xl border border-dashed border-line-2' },
        },
        size: {
            sm: { base: 'gap-2 py-6', icon: 'size-9', iconSvg: 'size-[18px]', title: 'text-sm' },
            md: {},
        },
    },
    defaultVariants: {
        variant: 'plain',
        size: 'md',
    },
});

/** Terms and values (<dl>): label above or next to its value */
export const dataList = tv({
    slots: {
        base: 'm-0 grid gap-x-6 gap-y-3 text-sm',
        item: 'min-w-0',
        term: 'font-mono text-[11px] tracking-label text-muted uppercase',
        details: 'm-0 min-w-0 text-fg',
    },
    variants: {
        orientation: {
            vertical: { item: 'flex flex-col gap-1' },
            // Every item spans both columns and passes them on: all labels line up
            horizontal: {
                base: 'grid-cols-[minmax(0,max-content)_minmax(0,1fr)]',
                item: 'col-span-2 grid grid-cols-subgrid items-baseline',
            },
        },
        divided: {
            true: { base: 'gap-y-0', item: 'border-b border-line py-2.5 last:border-b-0' },
        },
    },
    defaultVariants: {
        orientation: 'vertical',
    },
});

/** Bar with the actions for selected items (e.g. table rows); floats at the bottom of the window */
export const actionBar = tv({
    slots: {
        base: [
            'z-40 w-max max-w-[calc(100vw-2rem)] flex-nowrap gap-1 rounded-xl border-line-2 p-1.5 ps-4',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            'motion-safe:animate-pop-in [--wc-pop-y:8px]',
        ],
        count: 'pe-2 text-sm font-medium whitespace-nowrap text-fg tabular-nums',
        separator: 'mx-1 h-6 w-px shrink-0 bg-line',
    },
    variants: {
        placement: {
            fixed: { base: 'fixed inset-x-0 bottom-4 mx-auto' },
            inline: { base: 'relative' },
        },
    },
    defaultVariants: {
        placement: 'fixed',
    },
});

/** Time left until a date, as days, hours, minutes and seconds */
export const countdown = tv({
    slots: {
        base: 'inline-flex items-start gap-1.5',
        unit: 'flex flex-col items-center gap-1',
        value: 'font-mono text-fg tabular-nums',
        label: 'font-mono text-[10px] tracking-label text-muted uppercase',
    },
    variants: {
        variant: {
            plain: {},
            boxed: { unit: 'min-w-14 rounded-lg border border-line bg-card px-2 py-2' },
        },
        size: {
            sm: { value: 'text-lg' },
            md: { value: 'text-2xl' },
            lg: { value: 'text-4xl', unit: 'min-w-18' },
        },
    },
    compoundVariants: [{ variant: 'boxed', size: 'sm', class: { unit: 'min-w-11 px-1.5 py-1.5' } }],
    defaultVariants: {
        variant: 'boxed',
        size: 'md',
    },
});

/** Save state of a form or document: idle, saving, saved or failed – with text and icon */
export const saveStatus = tv({
    slots: {
        base: 'inline-flex min-h-6 items-center gap-1.5 text-xs text-muted',
        icon: 'size-3.5 shrink-0',
        spinner: 'size-3.5 shrink-0 motion-safe:animate-spin',
    },
    variants: {
        status: {
            idle: {},
            // A class of its own, so `.wc-save-status-saving` exists in @wirecore/wirelayer-css
            saving: { spinner: 'text-current' },
            saved: { icon: 'text-success' },
            error: { base: 'text-danger' },
        },
    },
    defaultVariants: {
        status: 'idle',
    },
});

export type SaveStatusState = 'idle' | 'saving' | 'saved' | 'error';

/** A number in the format of the locale; digits of the same width so columns line up */
export const numberFormatter = tv({
    base: 'tabular-nums',
});

/** Remaining time split into the given units – the largest unit takes everything above it */
export function countdownParts<TUnit extends 'days' | 'hours' | 'minutes' | 'seconds'>(
    milliseconds: number,
    units: readonly TUnit[]
): Record<TUnit, number> {
    const seconds = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };
    const ordered = (['days', 'hours', 'minutes', 'seconds'] as const).filter((unit) => units.includes(unit as TUnit));
    let rest = Math.max(0, Math.floor(milliseconds / 1000));
    const parts = {} as Record<TUnit, number>;
    for (const unit of ordered) {
        parts[unit as TUnit] = Math.floor(rest / seconds[unit]);
        rest %= seconds[unit];
    }
    return parts;
}
