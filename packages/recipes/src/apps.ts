import { tv } from './tv.js';

// App patterns: Kanban board (columns of Sortable lists) and the session timeout warning.

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

/** Kanban board: columns side by side, each a sortable list of cards; columns collapse to a narrow strip */
export const kanban = tv({
    slots: {
        base: 'flex w-full gap-4 overflow-x-auto pb-2',
        column: [
            'flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-line bg-bg-2 p-2',
            'data-collapsed:w-12 data-collapsed:items-center',
        ],
        header: 'flex min-h-9 items-center gap-1.5 ps-1.5',
        title: 'm-0 min-w-0 flex-1 truncate text-sm font-semibold text-fg',
        count: 'shrink-0 rounded-full bg-line px-2 py-0.5 text-xs text-fg tabular-nums',
        collapse: [
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-line hover:text-fg',
            focusRing,
        ],
        collapseIcon: 'size-4 rtl:-scale-x-100',
        /** The collapsed column: title written from top to bottom */
        collapsedTitle: 'm-0 text-sm font-semibold text-fg [writing-mode:vertical-rl]',
        limit: 'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
        limitIcon: 'size-3.5 shrink-0',
        list: 'min-h-16',
        card: 'flex min-w-0 flex-col gap-1',
        footer: 'flex flex-col gap-2',
        more: 'self-center',
        srOnly: 'sr-only',
    },
    variants: {
        /** Number of cards against the column's WIP limit */
        limitState: {
            within: {},
            reached: { limit: 'bg-warn/14 text-warn', count: 'bg-warn/14 text-warn' },
            over: {
                limit: 'bg-danger/14 text-danger',
                count: 'bg-danger/14 text-danger',
                column: 'border-danger forced-colors:border-[Mark]',
            },
        },
    },
    defaultVariants: {
        limitState: 'within',
    },
});

/** Number of cards against the WIP limit: below, at or over it */
export function kanbanLimitState(count: number, limit?: number): 'within' | 'reached' | 'over' {
    if (limit === undefined || limit <= 0) return 'within';
    return count > limit ? 'over' : count === limit ? 'reached' : 'within';
}

/** Session timeout warning: the remaining time and the actions in an alert dialog */
export const sessionTimeout = tv({
    slots: {
        base: 'flex flex-col gap-3',
        remaining: 'font-mono text-3xl text-fg tabular-nums',
        text: 'text-sm text-muted',
    },
});

/** State of a session: the time left (ms, never below 0) and whether to warn or it has expired */
export function sessionTimeoutState(
    expiresAt: number,
    now: number,
    warnBefore: number
): { remaining: number; warn: boolean; expired: boolean } {
    const remaining = Math.max(0, expiresAt - now);
    return { remaining, warn: remaining > 0 && remaining <= warnBefore, expired: remaining <= 0 };
}

/** Remaining time as "m:ss" (or "h:mm:ss") */
export function formatRemaining(ms: number): string {
    const total = Math.ceil(Math.max(0, ms) / 1000);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = String(total % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}
