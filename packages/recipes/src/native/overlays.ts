import { pressable, tv } from './tv.js';

// Drawer from the side, Popover, Toggletip and ActionBar for React Native (RN part 2)

/** Drawer from the left, right or top (`placement`); from the bottom it is the shared sheet */
export const drawer = tv({
    slots: {
        backdrop: 'flex-1 bg-black/60',
        dismissArea: 'absolute inset-0',
        panel: 'max-w-[90%] bg-card',
        header: 'flex-row items-center justify-between gap-3 border-b border-line py-3 pr-3 pl-5 ios:pt-14',
        title: 'min-w-0 flex-1 font-sans-semibold text-base text-fg',
        close: ['size-11 items-center justify-center rounded-full', pressable, 'active:bg-line active:opacity-100'],
        closeIcon: 'size-4 text-muted',
        description: 'px-5 pt-3 font-sans text-sm leading-[22px] text-muted',
        body: 'grow gap-3 px-5 py-4',
        footer: 'flex-row flex-wrap justify-end gap-2 border-t border-line px-4 py-3 ios:pb-8',
    },
    variants: {
        placement: {
            left: { backdrop: 'flex-row', panel: 'h-full border-r border-line-2' },
            right: { backdrop: 'flex-row justify-end', panel: 'h-full border-l border-line-2' },
            top: { panel: 'w-full max-w-none rounded-b-2xl border-b border-line-2' },
            bottom: { backdrop: 'justify-end', panel: 'w-full max-w-none rounded-t-2xl border-t border-line-2' },
        },
        size: {
            sm: {},
            md: {},
            lg: {},
            xl: {},
            full: { panel: 'max-w-none rounded-none' },
        },
    },
    compoundVariants: [
        { placement: ['left', 'right'], size: 'sm', class: { panel: 'w-[280px]' } },
        { placement: ['left', 'right'], size: 'md', class: { panel: 'w-[320px]' } },
        { placement: ['left', 'right'], size: 'lg', class: { panel: 'w-[400px]' } },
        { placement: ['left', 'right'], size: 'xl', class: { panel: 'w-[480px]' } },
        { placement: ['left', 'right'], size: 'full', class: { panel: 'w-full' } },
        { placement: 'top', size: 'sm', class: { panel: 'h-[30%]' } },
        { placement: 'top', size: 'md', class: { panel: 'h-[50%]' } },
        { placement: 'top', size: 'lg', class: { panel: 'h-[70%]' } },
        { placement: 'top', size: 'xl', class: { panel: 'h-[85%]' } },
        { placement: 'top', size: 'full', class: { panel: 'h-full' } },
    ],
    defaultVariants: {
        placement: 'left',
        size: 'md',
    },
});

/** Panel next to its trigger (measured on screen), in a transparent modal */
export const popover = tv({
    slots: {
        anchor: 'self-start',
        backdrop: 'flex-1',
        dismissArea: 'absolute inset-0',
        panel: 'absolute gap-1.5 rounded-xl border border-line-2 bg-card p-4 shadow-lg',
        header: 'flex-row items-start gap-2',
        title: 'min-w-0 flex-1 pt-1 font-sans-semibold text-sm text-fg',
        description: 'font-sans text-[13px] leading-5 text-muted',
        close: [
            '-mt-2 -mr-2 size-11 items-center justify-center rounded-full',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        closeIcon: 'size-4 text-muted',
        body: 'gap-2 pt-1',
    },
    variants: {
        overlay: {
            true: { backdrop: 'bg-black/40' },
        },
    },
});

/** Info button whose explanation is announced when it opens (role status), the focus stays on the button */
export const toggletip = tv({
    slots: {
        base: 'relative self-start',
        trigger: ['size-6 items-center justify-center rounded-full', pressable, 'active:bg-line active:opacity-100'],
        icon: 'size-4 text-muted',
        anchor: 'absolute top-full right-[-120px] left-[-120px] mt-1 items-center',
        bubble: 'max-w-64 rounded-lg border border-line-2 bg-card px-3 py-2 shadow-lg',
        text: 'font-sans text-[13px] leading-5 text-fg',
    },
    variants: {
        open: {
            true: { icon: 'text-fg' },
        },
    },
});

/** Bar with the actions for a selection, docked to the bottom of the screen */
export const actionBar = tv({
    slots: {
        base: 'flex-row items-center gap-2 rounded-2xl border border-line-2 bg-card py-1.5 pr-1.5 pl-4 shadow-lg',
        count: 'font-sans-semibold text-sm text-fg',
        actions: 'min-w-0 flex-1 flex-row flex-wrap items-center justify-end gap-1.5',
        separator: 'mx-1 h-6 w-px bg-line',
        clear: ['size-11 items-center justify-center rounded-full', pressable, 'active:bg-line active:opacity-100'],
        clearIcon: 'size-4 text-muted',
    },
    variants: {
        placement: {
            fixed: { base: 'absolute right-4 bottom-6 left-4 z-10' },
            inline: {},
        },
    },
    defaultVariants: {
        placement: 'fixed',
    },
});
