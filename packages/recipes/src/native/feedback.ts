import { pressable, tv } from './tv.js';

// Banner, SaveStatus, Result, EmptyState and SessionTimeout for React Native (RN part 2)

export const banner = tv({
    slots: {
        base: 'w-full flex-row items-start gap-3 px-4 py-3',
        icon: 'mt-0.5 size-[18px] shrink-0',
        content: 'min-w-0 flex-1 gap-0.5',
        title: 'font-sans-semibold text-sm text-fg',
        message: 'font-sans text-sm leading-5 text-fg',
        actions: 'flex-row flex-wrap gap-2 pt-2',
        dismiss: [
            '-my-2 -mr-2 size-11 items-center justify-center rounded-full',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        dismissIcon: 'size-4 text-muted',
    },
    variants: {
        variant: {
            info: { base: 'bg-info/10', icon: 'text-info' },
            success: { base: 'bg-success/10', icon: 'text-success' },
            warn: { base: 'bg-warn/10', icon: 'text-warn' },
            danger: { base: 'bg-danger/10', icon: 'text-danger' },
            neutral: { base: 'bg-bg-2', icon: 'text-fg' },
        },
        /** `inline` in the layout, `top`/`bottom` over that edge of the screen */
        position: {
            inline: { base: 'rounded-xl border border-line' },
            top: { base: 'absolute top-0 right-0 left-0 z-10 border-b border-line ios:pt-14' },
            bottom: { base: 'absolute right-0 bottom-0 left-0 z-10 border-t border-line ios:pb-8' },
        },
    },
    defaultVariants: {
        variant: 'info',
        position: 'inline',
    },
});

export const saveStatus = tv({
    slots: {
        base: 'min-h-5 flex-row items-center gap-1.5',
        icon: 'size-3.5 shrink-0 text-muted',
        label: 'font-sans text-xs text-muted',
    },
    variants: {
        status: {
            idle: {},
            saving: {},
            saved: { icon: 'text-success' },
            error: { icon: 'text-danger', label: 'text-danger' },
        },
    },
    defaultVariants: {
        status: 'idle',
    },
});

export const result = tv({
    slots: {
        base: 'w-full items-center gap-3 px-6 py-10',
        iconBox: 'mb-1 size-16 items-center justify-center rounded-full',
        icon: 'size-8',
        code: 'font-mono text-sm tracking-[2px] text-muted',
        title: 'text-center font-sans-semibold text-xl tracking-[-0.4px] text-fg',
        description: 'max-w-[420px] text-center font-sans text-[15px] leading-6 text-muted',
        actions: 'flex-row flex-wrap justify-center gap-2 pt-2',
        extra: 'w-full pt-2',
    },
    variants: {
        status: {
            success: { iconBox: 'bg-success/14', icon: 'text-success' },
            info: { iconBox: 'bg-info/14', icon: 'text-info' },
            warn: { iconBox: 'bg-warn/14', icon: 'text-warn' },
            error: { iconBox: 'bg-danger/14', icon: 'text-danger' },
            '403': { iconBox: 'bg-warn/14', icon: 'text-warn' },
            '404': { iconBox: 'bg-line', icon: 'text-fg' },
            '500': { iconBox: 'bg-danger/14', icon: 'text-danger' },
        },
    },
    defaultVariants: {
        status: 'info',
    },
});

export const emptyState = tv({
    slots: {
        base: 'w-full items-center gap-2 px-6 py-10',
        iconBox: 'mb-1 size-12 items-center justify-center rounded-full bg-line',
        icon: 'size-6 text-muted',
        title: 'text-center font-sans-semibold text-base text-fg',
        description: 'max-w-[360px] text-center font-sans text-sm leading-[22px] text-muted',
        actions: 'flex-row flex-wrap justify-center gap-2 pt-3',
    },
    variants: {
        variant: {
            plain: {},
            dashed: { base: 'rounded-card border border-dashed border-line-strong' },
        },
        size: {
            sm: { base: 'gap-1.5 px-4 py-6', iconBox: 'size-10', icon: 'size-5', title: 'text-sm' },
            md: {},
        },
    },
    defaultVariants: {
        variant: 'plain',
        size: 'md',
    },
});

export const sessionTimeout = tv({
    slots: {
        remaining: 'pt-3 font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        timer: 'font-mono text-3xl text-fg',
    },
});
