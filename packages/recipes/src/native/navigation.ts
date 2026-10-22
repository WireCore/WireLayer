import { pressable, tv } from './tv.js';

// Navigation for React Native (RN part 2): tab bar, page header, pagination, breadcrumb, navigation drawer,
// sidebar, app shell, notification centre and tour. Touch targets are at least 44 pt.

export const bottomNavigation = tv({
    slots: {
        base: 'w-full flex-row border-t border-line bg-card',
        item: ['min-h-14 flex-1 items-center justify-center gap-0.5 px-1 pt-2 pb-1.5', pressable],
        icon: 'size-[22px] text-muted',
        label: 'font-sans-medium text-[11px] text-muted',
        /** Over the top end of the icon */
        badge: 'absolute top-0.5 left-1/2 ml-1 h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1',
        badgeLabel: 'font-mono text-[9.5px] text-on-danger',
        /** Line above the current destination */
        indicator: 'absolute top-0 right-4 left-4 h-0.5 rounded-full bg-primary',
    },
    variants: {
        current: {
            true: { icon: 'text-primary', label: 'text-fg' },
        },
        inline: {
            false: { base: 'absolute right-0 bottom-0 left-0 z-10' },
        },
    },
});

export const pageHeader = tv({
    slots: {
        base: 'w-full gap-2 pb-4',
        back: ['-ml-2 h-11 flex-row items-center gap-1 self-start rounded-full pr-3 pl-2', pressable],
        backIcon: 'size-4 text-muted',
        backLabel: 'font-sans-medium text-sm text-muted',
        row: 'flex-row flex-wrap items-start gap-3',
        headings: 'min-w-0 flex-1 gap-1',
        titleRow: 'flex-row flex-wrap items-center gap-2',
        title: 'font-sans-semibold text-2xl tracking-[-0.6px] text-fg',
        subtitle: 'font-sans text-[15px] leading-6 text-muted',
        meta: 'flex-row flex-wrap items-center gap-3',
        actions: 'flex-row flex-wrap items-center gap-2',
        tabs: 'pt-2',
    },
    variants: {
        size: {
            sm: { title: 'text-lg tracking-[-0.4px]', subtitle: 'text-sm' },
            md: {},
        },
        divided: {
            true: { base: 'border-b border-line' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const pagination = tv({
    slots: {
        base: 'w-full gap-3',
        row: 'flex-row flex-wrap items-center gap-1',
        item: [
            'size-11 items-center justify-center rounded-lg border border-transparent',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        itemLabel: 'font-sans-medium text-sm text-fg',
        ellipsis: 'size-11 items-center justify-center',
        ellipsisLabel: 'font-sans text-sm text-muted',
        icon: 'size-4 text-fg',
        compact: 'min-w-0 flex-1 items-center',
        compactLabel: 'font-sans-medium text-sm text-fg',
        footer: 'flex-row flex-wrap items-center justify-between gap-3',
        summary: 'font-mono text-[11px] text-muted',
        pageSize: 'w-40',
    },
    variants: {
        selected: {
            true: { item: 'border-primary bg-primary/10', itemLabel: 'text-primary' },
        },
        disabled: {
            true: { item: 'opacity-40' },
        },
    },
});

export const breadcrumb = tv({
    slots: {
        base: 'w-full grow-0',
        list: 'flex-row items-center gap-1 pr-2',
        item: 'flex-row items-center gap-1',
        link: ['min-h-11 flex-row items-center gap-1.5 rounded-md px-1', pressable],
        linkLabel: 'font-sans text-sm text-muted underline',
        current: 'min-h-11 flex-row items-center gap-1.5 px-1',
        currentLabel: 'font-sans-medium text-sm text-fg',
        icon: 'size-4 text-muted',
        separator: 'size-3.5 text-muted',
        more: ['size-11 items-center justify-center rounded-md', pressable, 'active:bg-line active:opacity-100'],
        moreIcon: 'size-4 text-muted',
    },
});

/** Links in the navigation drawer (NavigationMenu, SidebarNav) */
export const navList = tv({
    slots: {
        base: 'w-full gap-0.5',
        header: 'pb-3',
        footer: 'mt-3 border-t border-line pt-3',
        link: [
            'min-h-12 flex-row items-center gap-3 rounded-lg px-3 py-2',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        icon: 'size-[18px] shrink-0 text-muted',
        text: 'min-w-0 flex-1 gap-0.5',
        label: 'font-sans-medium text-[15px] text-fg',
        description: 'font-sans text-[13px] leading-[18px] text-muted',
        badge: 'h-5 min-w-5 items-center justify-center rounded-full bg-line px-1.5',
        badgeLabel: 'font-mono text-[10.5px] text-fg',
        group: ['min-h-12 flex-row items-center gap-3 rounded-lg px-3', pressable, 'active:bg-line active:opacity-100'],
        groupLabel: 'flex-1 font-sans-semibold text-[15px] text-fg',
        chevron: 'size-4 shrink-0 text-muted',
        children: 'gap-0.5 pl-4',
        heading: 'px-3 pt-3 pb-1 font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        trigger: ['size-11 items-center justify-center rounded-full', pressable, 'active:bg-line active:opacity-100'],
        triggerIcon: 'size-5 text-fg',
    },
    variants: {
        current: {
            true: { link: 'bg-primary/10', icon: 'text-primary', label: 'text-primary' },
        },
        open: {
            true: { chevron: 'rotate-180' },
        },
    },
});

/** Header, content and bottom bar of an app screen */
export const appShell = tv({
    slots: {
        base: 'flex-1 bg-bg',
        header: 'min-h-14 flex-row items-center gap-2 border-b border-line bg-card px-2',
        headerContent: 'min-w-0 flex-1 flex-row items-center gap-2',
        menuButton: [
            'size-11 items-center justify-center rounded-full',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        menuIcon: 'size-5 text-fg',
        main: 'flex-1',
        footer: 'w-full',
    },
});

export const notificationCenter = tv({
    slots: {
        trigger: 'self-start',
        toolbar: 'flex-row items-center justify-between gap-2 px-3 pt-1 pb-2',
        count: 'font-sans text-sm text-muted',
        markAll: ['min-h-11 justify-center rounded-md px-2', pressable],
        markAllLabel: 'font-sans-medium text-sm text-primary',
        day: 'px-3 pt-3 pb-1 font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        item: 'flex-row items-start gap-3 rounded-lg px-3 py-3',
        /** The notification as a button (onSelect) */
        itemButton: ['min-w-0 flex-1 flex-row items-start gap-3 rounded-md', pressable],
        iconBox: 'size-9 shrink-0 items-center justify-center rounded-full bg-line',
        icon: 'size-4 text-fg',
        body: 'min-w-0 flex-1 gap-0.5',
        title: 'font-sans-medium text-[15px] text-fg',
        description: 'font-sans text-[13px] leading-5 text-muted',
        time: 'font-mono text-[11px] text-muted',
        dot: 'mt-2 size-2 shrink-0 rounded-full bg-primary',
        markRead: ['size-11 items-center justify-center rounded-full', pressable, 'active:bg-line active:opacity-100'],
        markReadIcon: 'size-4 text-muted',
        empty: 'px-3 py-8 text-center font-sans text-sm text-muted',
        more: 'px-3 pt-2',
    },
    variants: {
        unread: {
            true: { item: 'bg-primary/5', title: 'font-sans-semibold' },
        },
    },
});

/** Coachmarks: the screen dimmed around the target, a bubble with the step */
export const tour = tv({
    slots: {
        root: 'flex-1',
        shade: 'absolute bg-black/60',
        ring: 'absolute rounded-lg border-2 border-primary',
        bubble: 'absolute right-4 left-4 gap-2 rounded-xl border border-line-2 bg-card p-4 shadow-lg',
        progress: 'font-mono text-[11px] text-muted',
        title: 'font-sans-semibold text-base text-fg',
        description: 'font-sans text-sm leading-[22px] text-muted',
        footer: 'flex-row flex-wrap items-center justify-between gap-2 pt-2',
        buttons: 'flex-row gap-2',
    },
});
