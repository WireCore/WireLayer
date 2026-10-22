import { tv } from './tv.js';

export const card = tv({
    base: 'flex flex-col gap-2.5 rounded-card border border-line bg-card p-6',
    variants: {
        interactive: {
            true: [
                'cursor-pointer bg-glow transition-colors duration-200 hover:border-line-2 motion-reduce:transition-none',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            ],
        },
        /** Media at the start, content beside it */
        horizontal: {
            true: 'flex-row items-stretch gap-5',
        },
    },
});

/**
 * Parts of a Card with title, subtitle, media and footer (the Card itself keeps the `card` recipe). In HTML the
 * media of a horizontal card needs `wc-card-parts-horizontal` on the card as well.
 */
export const cardParts = tv({
    slots: {
        /** Image or video above the content (beside it when horizontal) */
        media: 'overflow-hidden rounded-xl',
        /** Column with header, content and footer */
        content: 'flex min-w-0 flex-1 flex-col gap-2.5',
        header: 'flex items-start justify-between gap-3',
        heading: 'flex min-w-0 flex-col gap-0.5',
        title: 'text-lg font-semibold tracking-[-0.015em] text-fg',
        subtitle: 'text-sm text-muted',
        /** Actions at the end, e.g. buttons */
        footer: 'mt-auto flex flex-wrap items-center gap-2 pt-1.5',
    },
    variants: {
        horizontal: {
            true: { media: 'w-2/5 max-w-64 shrink-0 self-stretch' },
        },
    },
});
