import { tv } from './tv.js';

export type BadgeVariant = 'solid' | 'soft' | 'outline' | 'success' | 'info' | 'warn' | 'danger';

export const badge = tv({
    slots: {
        base: 'inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2 font-mono text-[10.5px] leading-none whitespace-nowrap forced-colors:border',
        icon: 'size-3 shrink-0',
    },
    variants: {
        variant: {
            solid: { base: 'bg-fg text-bg' },
            soft: { base: 'bg-line text-fg' },
            outline: { base: 'border border-line-2 text-muted' },
            success: { base: 'bg-success/14 text-success' },
            info: { base: 'bg-info/14 text-info' },
            warn: { base: 'bg-warn/14 text-warn' },
            danger: { base: 'bg-danger/14 text-danger' },
        },
        /** Round for a count or a single character; grows into a pill for longer content */
        circle: {
            true: { base: 'min-w-[22px] justify-center px-1.5' },
        },
    },
    defaultVariants: {
        variant: 'soft',
    },
});
