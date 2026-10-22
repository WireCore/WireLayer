import { tv } from './tv.js';

// Divider, skeleton and accordion – structure the page, no floating parts.

export type DividerOrientation = 'horizontal' | 'vertical';

export const divider = tv({
    slots: {
        base: 'flex shrink-0 items-center gap-3 border-line',
        line: 'flex-1 border-line',
        label: 'shrink-0 font-mono text-[11px] leading-4 tracking-label text-muted uppercase',
    },
    variants: {
        orientation: {
            horizontal: { base: 'w-full', line: 'border-t' },
            vertical: { base: 'flex-col self-stretch', line: 'border-s' },
        },
        /** Without a label the divider is a single line */
        plain: {
            true: { base: 'm-0' },
        },
        /** Line style */
        lineStyle: {
            solid: {},
            dashed: { base: 'border-dashed', line: 'border-dashed' },
            dotted: { base: 'border-dotted', line: 'border-dotted' },
        },
        /** Where the label sits on the line */
        labelPosition: {
            start: { line: 'first:hidden' },
            center: {},
            end: { line: 'last:hidden' },
        },
    },
    compoundVariants: [
        { plain: true, orientation: 'horizontal', class: { base: 'h-0 border-t' } },
        { plain: true, orientation: 'vertical', class: { base: 'w-0 border-s' } },
    ],
    defaultVariants: {
        orientation: 'horizontal',
        lineStyle: 'solid',
        labelPosition: 'center',
    },
});

export type SkeletonShape = 'line' | 'rect' | 'circle';

export const skeleton = tv({
    base: 'block shrink-0 bg-line motion-safe:animate-pulse forced-colors:border forced-colors:border-[CanvasText]',
    variants: {
        shape: {
            line: 'h-3.5 w-full rounded',
            rect: 'h-24 w-full rounded-xl',
            circle: 'size-10 rounded-full',
        },
    },
    defaultVariants: {
        shape: 'line',
    },
});

export const accordion = tv({
    slots: {
        base: 'flex w-full flex-col border-b border-line',
        item: 'border-t border-line',
        heading: 'm-0 font-normal',
        trigger: [
            'flex w-full cursor-pointer items-center gap-3 rounded-sm py-4 text-start text-[15px] font-semibold text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'disabled:cursor-not-allowed disabled:opacity-40',
        ],
        icon: 'size-[18px] shrink-0 text-muted',
        title: 'min-w-0 flex-1',
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-180',
        indicatorIcon: 'size-full',
        /** Heading and actions side by side (AccordionItem with actions) */
        header: 'flex items-center gap-2',
        actions: 'flex shrink-0 items-center gap-1',
        content: [
            'overflow-hidden text-sm leading-[1.6] text-muted',
            'motion-safe:data-[state=open]:animate-collapse-in motion-safe:data-[state=closed]:animate-collapse-out',
        ],
        body: 'pb-4',
    },
    variants: {
        withActions: {
            true: { heading: 'min-w-0 flex-1' },
        },
    },
});
