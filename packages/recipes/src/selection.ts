import { focusRing, pressable, tv } from './tv.js';

// Selection controls. Unselected boundaries use `line-strong` (3:1, WCAG 1.4.11).
// Selected states opt out of forced colours (Windows high contrast removes backgrounds there)
// and use the system highlight colours instead – class names must stay literal for Tailwind.

export const checkbox = tv({
    slots: {
        base: 'inline-flex cursor-pointer items-start gap-2.5 text-sm leading-[1.45] text-muted data-disabled:cursor-not-allowed data-disabled:opacity-40',
        control: [
            'mt-px flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-line-strong text-on-primary',
            'transition-colors motion-reduce:transition-none data-invalid:border-danger',
            'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
            'forced-colors:data-[state=checked]:forced-color-adjust-none forced-colors:data-[state=checked]:border-[Highlight] forced-colors:data-[state=checked]:bg-[Highlight] forced-colors:data-[state=checked]:text-[HighlightText]',
            focusRing,
        ],
        icon: 'size-[13px] stroke-3',
        label: 'min-w-0',
    },
});

export type RadioGroupOrientation = 'horizontal' | 'vertical';

export const radioGroup = tv({
    slots: {
        base: 'flex flex-col gap-2.5',
        label: 'text-[13px] font-medium text-fg',
        items: 'flex gap-x-[18px] gap-y-2.5',
        item: 'inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-fg data-disabled:cursor-not-allowed data-disabled:opacity-40',
        control: [
            'flex size-[18px] shrink-0 items-center justify-center rounded-full border border-line-strong',
            'transition-colors motion-reduce:transition-none data-invalid:border-danger',
            'after:size-2 after:rounded-full data-[state=checked]:border-primary data-[state=checked]:after:bg-primary',
            'forced-colors:data-[state=checked]:forced-color-adjust-none forced-colors:data-[state=checked]:border-[Highlight] forced-colors:data-[state=checked]:after:bg-[Highlight]',
            focusRing,
        ],
    },
    variants: {
        orientation: {
            horizontal: { items: 'flex-row flex-wrap' },
            vertical: { items: 'flex-col' },
        },
        /** Cards (RadioCard) in a grid of `--wc-columns` columns (one column on small screens) */
        grid: {
            true: { items: 'grid grid-cols-1 gap-3 sm:grid-cols-[repeat(var(--wc-columns),minmax(0,1fr))]' },
        },
    },
    defaultVariants: {
        orientation: 'horizontal',
    },
});

export const switchControl = tv({
    slots: {
        base: 'flex w-full cursor-pointer items-center justify-between gap-3.5 py-2 data-disabled:cursor-not-allowed data-disabled:opacity-40',
        content: 'flex min-w-0 items-center gap-2.5',
        icon: 'size-[18px] shrink-0 text-muted',
        text: 'flex min-w-0 flex-col gap-px',
        label: 'text-sm font-medium text-fg',
        description: 'text-xs text-muted',
        control: [
            'flex h-[22px] w-10 shrink-0 items-center rounded-full border border-line-strong px-[3px]',
            'transition-colors motion-reduce:transition-none data-invalid:border-danger',
            'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
            'forced-colors:data-[state=checked]:forced-color-adjust-none forced-colors:data-[state=checked]:border-[Highlight] forced-colors:data-[state=checked]:bg-[Highlight]',
            focusRing,
        ],
        thumb: [
            'size-3.5 rounded-full bg-muted transition-transform motion-reduce:transition-none',
            'data-[state=checked]:translate-x-[18px] rtl:data-[state=checked]:-translate-x-[18px] data-[state=checked]:bg-on-primary',
            'forced-colors:forced-color-adjust-none forced-colors:bg-[CanvasText] forced-colors:data-[state=checked]:bg-[HighlightText]',
        ],
        /** Icon in the thumb (checkedIcon/uncheckedIcon) */
        thumbIcon: 'size-2.5 text-bg data-[state=checked]:text-primary forced-colors:hidden',
        /** Text in the track (onLabel/offLabel) – decoration, the state is announced by the switch */
        trackLabel: [
            'px-1 font-mono text-[9px] leading-none font-semibold text-muted uppercase select-none',
            'data-[state=checked]:text-on-primary forced-colors:data-[state=checked]:text-[HighlightText]',
        ],
    },
    variants: {
        /** Thumb with an icon: centred inside */
        withThumbIcon: {
            true: { thumb: 'flex items-center justify-center' },
        },
        /** Text in the track: the track grows, the thumb changes sides instead of sliding */
        withTrackLabel: {
            true: {
                control: 'w-auto min-w-10 data-[state=checked]:flex-row-reverse',
                thumb: 'shrink-0 data-[state=checked]:translate-x-0 rtl:data-[state=checked]:translate-x-0',
            },
        },
    },
});

export const chipGroup = tv({
    slots: {
        base: 'flex flex-wrap gap-1.5',
        chip: [
            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line-2 px-3 text-[13px] font-medium whitespace-nowrap text-fg',
            ...pressable,
            'hover:border-fg data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-on-primary',
            'forced-colors:data-[state=on]:forced-color-adjust-none forced-colors:data-[state=on]:border-[Highlight] forced-colors:data-[state=on]:bg-[Highlight] forced-colors:data-[state=on]:text-[HighlightText]',
        ],
        icon: 'size-3.5 shrink-0',
    },
});

export type SegmentedControlSize = 'sm' | 'md';

export const segmentedControl = tv({
    slots: {
        base: 'inline-flex items-center gap-0.5 rounded-full border border-line-2 p-[3px]',
        label: 'sr-only',
        item: [
            'inline-flex cursor-pointer items-center gap-1.5 rounded-full whitespace-nowrap text-muted',
            'transition-colors motion-reduce:transition-none hover:text-fg data-disabled:cursor-not-allowed data-disabled:opacity-40',
            'data-[state=checked]:bg-primary data-[state=checked]:text-on-primary',
            'forced-colors:data-[state=checked]:forced-color-adjust-none forced-colors:data-[state=checked]:bg-[Highlight] forced-colors:data-[state=checked]:text-[HighlightText]',
            focusRing,
        ],
        icon: 'shrink-0',
    },
    variants: {
        size: {
            sm: { item: 'h-[26px] px-2.5 font-mono text-[11px]', icon: 'size-3' },
            md: { item: 'h-8 px-3 text-[13px] font-semibold', icon: 'size-[15px]' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});
