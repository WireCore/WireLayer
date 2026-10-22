import { tv } from './tv.js';

export type StatusDotStatus = 'neutral' | 'success' | 'info' | 'warn' | 'danger';

export const statusDot = tv({
    slots: {
        base: 'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-line-2 px-2.5 font-mono text-[10.5px] whitespace-nowrap text-fg',
        dot: 'size-1.5 shrink-0 rounded-full forced-colors:bg-[CanvasText]',
        /** Status icon instead of the dot (shape as a second cue next to the colour) */
        icon: 'size-3.5 shrink-0',
    },
    variants: {
        status: {
            neutral: { dot: 'bg-muted', icon: 'text-muted' },
            success: { dot: 'bg-success', icon: 'text-success' },
            info: { dot: 'bg-info', icon: 'text-info' },
            warn: { dot: 'bg-warn', icon: 'text-warn' },
            danger: { dot: 'bg-danger', icon: 'text-danger' },
        },
        pulse: {
            true: { dot: 'motion-safe:animate-status-pulse' },
        },
    },
    defaultVariants: {
        status: 'neutral',
    },
});
