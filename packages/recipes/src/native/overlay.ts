import { pressable, tv } from './tv.js';

export const tabs = tv({
    slots: {
        base: 'gap-3.5',
        list: 'flex-row gap-5 border-b border-line',
        trigger: ['-mb-px shrink-0 flex-row items-center gap-1.5 border-b-2 border-transparent pb-2.5', pressable],
        label: 'font-sans-medium text-sm text-muted',
        icon: 'size-[15px] shrink-0 text-muted',
        /** Count after the label (TabsTrigger `badge`) */
        badge: 'h-[18px] min-w-[18px] items-center justify-center rounded-full bg-line px-1.5',
        badgeLabel: 'font-mono text-[10.5px] text-fg',
        content: '',
        /** Scrollable tab list (TabsList `scrollable`): the row scrolls sideways */
        scroller: 'grow-0 border-b border-line',
        scrollList: 'flex-row gap-5',
    },
    variants: {
        selected: {
            true: { trigger: 'border-primary', label: 'text-fg', icon: 'text-fg' },
        },
    },
});

export const dialog = tv({
    slots: {
        backdrop: 'flex-1 items-center justify-center bg-black/60 p-4',
        /** Behind the content: pressing outside closes */
        dismissArea: 'absolute inset-0',
        content: 'w-full max-w-[400px] rounded-[14px] border border-line-2 bg-card',
        header: 'flex-row items-center justify-between gap-3 pt-4 pr-4 pl-[18px]',
        iconBox: 'size-9 items-center justify-center rounded-[10px]',
        icon: 'size-[18px]',
        close: [
            'ml-auto size-8 items-center justify-center rounded-full',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        closeIcon: 'size-4 text-muted',
        body: 'gap-1.5 px-[18px] pt-3 pb-[18px]',
        title: 'font-sans-semibold text-lg tracking-[-0.36px] text-fg',
        description: 'font-sans text-sm leading-[22px] text-muted',
        footer: 'flex-row flex-wrap justify-end gap-2 border-t border-line px-4 py-3',
        /** Scrolling body (`scrollBehavior: 'inside'`) */
        scroller: 'shrink',
    },
    variants: {
        /** Width: sm 320, md 400 (default), lg 560, xl 800, full the width of the screen */
        size: {
            sm: { content: 'max-w-[320px]' },
            md: {},
            lg: { content: 'max-w-[560px]' },
            xl: { content: 'max-w-[800px]' },
            full: { content: 'max-w-none' },
        },
        /** Where it sits: centred, near the top or at the bottom edge (a sheet without the sheet's list) */
        position: {
            center: {},
            top: { backdrop: 'justify-start pt-16' },
            bottom: { backdrop: 'justify-end px-0 pb-0', content: 'max-w-none rounded-b-none border-b-0 pb-4' },
        },
        /** Covers the whole screen */
        fullscreen: {
            true: {
                backdrop: 'p-0',
                content: 'h-full max-w-none rounded-none border-0',
                body: 'flex-1',
                scroller: 'flex-1',
            },
        },
        /** Without icon and close button there is no header row – the body keeps the top padding */
        bare: {
            true: { body: 'pt-[18px]' },
        },
        /** The body scrolls, title and buttons stay */
        scrollInside: {
            true: { content: 'max-h-full' },
        },
        status: {
            neutral: { iconBox: 'bg-line', icon: 'text-fg' },
            success: { iconBox: 'bg-success/14', icon: 'text-success' },
            info: { iconBox: 'bg-info/14', icon: 'text-info' },
            warn: { iconBox: 'bg-warn/14', icon: 'text-warn' },
            danger: { iconBox: 'bg-danger/14', icon: 'text-danger' },
        },
    },
    defaultVariants: {
        status: 'neutral',
        size: 'md',
        position: 'center',
    },
});
