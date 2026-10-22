import { tv } from './tv.js';

export const spinner = tv({
    slots: {
        base: 'inline-flex shrink-0',
        icon: 'shrink-0 animate-[spin_0.8s_linear_infinite] motion-reduce:animate-[spin_2s_linear_infinite]',
        label: 'sr-only',
        /** Fixed progress (`value`): a small ring instead of the turning icon */
        ring: '-rotate-90',
        ringTrack: 'fill-none stroke-current opacity-25',
        ringRange: 'fill-none stroke-current transition-[stroke-dasharray] motion-reduce:transition-none',
    },
    variants: {
        size: {
            sm: { icon: 'size-3.5', ring: 'size-3.5' },
            md: { icon: 'size-4', ring: 'size-4' },
            lg: { icon: 'size-6', ring: 'size-6' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});
