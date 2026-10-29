import { tv } from './tv.js';

export type AlertStatus = 'neutral' | 'success' | 'info' | 'warn' | 'danger';
/** `box` (default): bordered box with icon tile; `simple`: only icon and text, e.g. below a field */
export type AlertVariant = 'box' | 'simple';

export const alert = tv({
    slots: {
        base: 'grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-line-2 bg-card py-3 pe-3 ps-3.5',
        iconBox: 'flex size-7 items-center justify-center rounded-lg',
        icon: 'size-4',
        content: 'flex flex-col gap-0.5 pt-[3px]',
        title: 'text-sm font-semibold',
        description: 'text-[13px] leading-normal text-muted',
        /** Title and text next to the actions (`actions`) */
        text: 'flex min-w-0 flex-1 basis-48 flex-col gap-0.5',
        /** Buttons in the message, e.g. "Unlock" – beside the text, below it when there is little room */
        actions: 'flex shrink-0 flex-wrap items-center gap-2',
        dismiss: [
            'flex size-7 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-line hover:text-fg motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        dismissIcon: 'size-3.5',
    },
    variants: {
        status: {
            neutral: { iconBox: 'bg-line text-fg' },
            success: { iconBox: 'bg-success/14 text-success' },
            info: { iconBox: 'bg-info/14 text-info' },
            warn: { iconBox: 'bg-warn/14 text-warn' },
            danger: { iconBox: 'bg-danger/14 text-danger' },
        },
        variant: {
            box: {},
            simple: {
                base: 'gap-1.5 rounded-none border-0 bg-transparent p-0',
                iconBox: 'size-auto rounded-none bg-transparent pt-0.5',
                content: 'pt-0',
                title: 'text-[13px] font-medium',
                description: 'text-[13px]',
                dismiss: 'size-6',
            },
        },
        /** With actions: text and buttons side by side, wrapping below each other */
        hasActions: {
            true: { content: 'flex-row flex-wrap items-center gap-x-4 gap-y-2' },
        },
        size: {
            sm: {
                base: 'gap-2 py-2 pe-2 ps-2.5',
                iconBox: 'size-6 rounded-md',
                icon: 'size-3.5',
                content: 'pt-[2px]',
                title: 'text-[13px]',
                // leading-4 explicitly: in @wirecore/wirelayer-css the base's leading-normal would otherwise stay
                description: 'text-xs leading-4',
                dismiss: 'size-6',
            },
            md: {},
        },
    },
    compoundVariants: [
        // Simple alerts carry the status in the text colour (the icon tile is gone); text and icon stay ≥ 4.5:1
        { variant: 'simple', status: 'neutral', class: { base: 'text-muted', title: 'text-fg' } },
        { variant: 'simple', status: 'success', class: { base: 'text-success', description: 'text-success' } },
        { variant: 'simple', status: 'info', class: { base: 'text-info', description: 'text-info' } },
        { variant: 'simple', status: 'warn', class: { base: 'text-warn', description: 'text-warn' } },
        { variant: 'simple', status: 'danger', class: { base: 'text-danger', description: 'text-danger' } },
        { variant: 'simple', size: 'sm', class: { base: 'p-0', title: 'text-xs', description: 'text-xs leading-4' } },
    ],
    defaultVariants: {
        status: 'info',
        variant: 'box',
        size: 'md',
    },
});
