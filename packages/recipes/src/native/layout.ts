import { pressable, tv } from './tv.js';

// Layout building blocks for React Native (RN part 2): the variant names of the web primitives

const gap = {
    none: 'gap-0',
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
};

export const stack = tv({
    base: 'flex-col',
    variants: {
        gap,
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

export const group = tv({
    base: 'flex-row flex-wrap',
    variants: {
        gap,
        justify: {
            start: 'justify-start',
            center: 'justify-center',
            end: 'justify-end',
            between: 'justify-between',
        },
        align: {
            middle: 'items-center',
            top: 'items-start',
            bottom: 'items-end',
            baseline: 'items-baseline',
            stretch: 'items-stretch',
        },
        nowrap: {
            true: 'flex-nowrap',
        },
    },
    defaultVariants: {
        gap: 'sm',
        justify: 'start',
        align: 'middle',
    },
});

/** A child of a Group with `grow`: the children share the width */
export const groupItem = tv({
    base: 'min-w-0 flex-1',
});

export const simpleGrid = tv({
    slots: {
        base: 'flex-row flex-wrap',
        cell: 'min-w-0',
    },
});

/** Spacing of SimpleGrid in px (React Native lays out the columns itself) */
export const layoutGapSize = { none: 0, xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const container = tv({
    base: 'w-full self-center px-4',
    variants: {
        size: {
            sm: 'max-w-[672px]',
            md: 'max-w-[768px]',
            lg: 'max-w-[1024px]',
            xl: 'max-w-[1280px]',
            full: 'max-w-none',
        },
        flush: {
            true: 'px-0',
        },
    },
    defaultVariants: {
        size: 'lg',
    },
});

export const center = tv({
    base: 'items-center justify-center',
    variants: {
        inline: {
            true: 'flex-row self-start',
            false: 'w-full',
        },
    },
    defaultVariants: {
        inline: false,
    },
});

export const aspectRatio = tv({
    base: 'w-full overflow-hidden',
});

export const collapse = tv({
    base: 'overflow-hidden',
});

export const panel = tv({
    slots: {
        base: 'w-full overflow-hidden rounded-card border border-line bg-card',
        header: 'min-h-12 flex-row items-center gap-2 border-b border-line px-4 py-2',
        title: 'min-w-0 flex-1 font-sans-semibold text-[15px] text-fg',
        toggle: ['min-h-11 min-w-0 flex-1 flex-row items-center gap-2', pressable],
        chevron: 'size-4 shrink-0 text-muted',
        actions: 'flex-row items-center gap-1',
        body: 'gap-3 p-4',
        footer: 'flex-row flex-wrap items-center justify-end gap-2 border-t border-line px-4 py-3',
    },
    variants: {
        open: {
            false: { header: 'border-b-0', chevron: '-rotate-90' },
        },
    },
});

export const fieldset = tv({
    slots: {
        base: 'w-full gap-3 rounded-card border border-line p-4',
        legend: 'font-sans-semibold text-[15px] text-fg',
        toggle: ['-my-2 min-h-11 flex-row items-center gap-2', pressable],
        chevron: 'size-4 shrink-0 text-muted',
        content: 'gap-4',
        helper: 'font-sans text-[13px] leading-5 text-muted',
        error: 'font-sans text-[13px] leading-5 text-danger',
    },
    variants: {
        invalid: {
            true: { base: 'border-danger' },
        },
        disabled: {
            true: { base: 'opacity-60' },
        },
        open: {
            false: { chevron: '-rotate-90' },
        },
    },
});

/** Bar that stays in view at an edge (place it outside the ScrollView), e.g. the actions of a form */
export const sticky = tv({
    base: 'w-full',
    variants: {
        edge: {
            top: 'border-b border-line',
            bottom: 'border-t border-line ios:pb-6',
        },
        bar: {
            true: 'flex-row flex-wrap items-center justify-end gap-2 bg-card px-4 py-3',
        },
    },
    defaultVariants: {
        edge: 'top',
    },
});
