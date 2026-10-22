import { tv } from './tv.js';

export type ChipSize = 'sm' | 'md' | 'lg';

/** Standalone chip: a compact label with an optional icon or image and a remove button */
export const chip = tv({
    slots: {
        base: [
            'inline-flex shrink-0 items-center rounded-full border border-line-2 bg-card font-medium whitespace-nowrap text-fg',
            'forced-colors:border-[CanvasText]',
        ],
        icon: 'shrink-0 text-muted',
        /** Small round image (decorative – the label names the chip) */
        avatar: 'shrink-0 rounded-full object-cover',
        label: 'min-w-0 truncate',
        remove: [
            'flex shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors',
            'hover:bg-line hover:text-fg motion-reduce:transition-none disabled:cursor-not-allowed',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        removeIcon: 'size-3.5',
    },
    variants: {
        // The remove button keeps the 24px target size (WCAG 2.5.8) in every size
        size: {
            sm: { base: 'h-7 gap-1 ps-2.5 pe-2.5 text-xs', icon: 'size-3', avatar: 'size-5', remove: 'size-6' },
            md: { base: 'h-8 gap-1.5 ps-3 pe-3 text-[13px]', icon: 'size-3.5', avatar: 'size-6', remove: 'size-6' },
            lg: { base: 'h-10 gap-2 ps-4 pe-4 text-sm', icon: 'size-4', avatar: 'size-8', remove: 'size-7' },
        },
        removable: {
            true: { base: 'pe-0.5' },
        },
        /** An image at the start sits close to the edge */
        withAvatar: {
            true: { base: 'ps-1' },
        },
        // Muted text instead of transparency: the label stays readable (4.5:1), the dashed border marks the state
        disabled: {
            true: {
                base: 'border-dashed text-muted',
                avatar: 'opacity-50 grayscale',
                remove: 'opacity-40 hover:bg-transparent hover:text-muted',
            },
        },
    },
    compoundVariants: [{ removable: true, size: 'lg', class: { base: 'pe-1.5' } }],
    defaultVariants: {
        size: 'md',
    },
});
