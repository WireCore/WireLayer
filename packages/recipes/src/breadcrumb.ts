import { tv } from './tv.js';

export const breadcrumb = tv({
    slots: {
        list: 'flex flex-wrap items-center gap-1.5 text-[13px] text-muted',
        item: 'group/item inline-flex items-center gap-1.5',
        separator: 'size-[13px] shrink-0 group-first/item:hidden rtl:-scale-x-100',
        link: [
            'inline-flex min-h-6 items-center gap-1.5 rounded-sm transition-colors hover:text-fg motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        text: 'inline-flex min-h-6 items-center gap-1.5',
        icon: 'size-[15px] shrink-0',
        /** Label of an icon-only item: visually hidden, still read by screen readers */
        hiddenLabel: 'sr-only',
        /** "…" in place of the collapsed middle items (maxItems): opens a menu with them */
        ellipsis: [
            'inline-flex min-h-6 min-w-6 cursor-pointer items-center justify-center rounded-sm transition-colors hover:bg-line hover:text-fg',
            'motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        ellipsisIcon: 'size-4',
    },
    variants: {
        current: {
            true: { text: 'font-medium text-fg', link: 'font-medium text-fg' },
        },
    },
});
