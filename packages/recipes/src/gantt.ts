// Gantt chart: tasks with start and end (whole days), progress, milestones, groups with sub-tasks and finish-to-start
// dependencies – the rows of the task list, the scale of the time axis per zoom, bars, the paths of the dependency
// arrows, the critical path and checks for new dependencies. Dates are ISO dates ("2026-10-20"), ends inclusive.

import { addIsoDays, isoWeek, isoWeekday } from './date-time.js';
import type { Translations } from './i18n.js';
import { tv } from './tv.js';
import type { VisualTone } from './visualizations.js';

/** Zoom of the time axis: days, weeks, months or quarters as units */
export type GanttZoom = 'day' | 'week' | 'month' | 'quarter';

export interface GanttTask {
    id: string;
    name: string;
    /** First day ("2026-10-20") */
    start: string;
    /** Last day, inclusive; a milestone has the same start and end */
    end: string;
    /** Done in percent, 0–100 */
    progress?: number;
    /** A point in time instead of a bar (shown as a diamond) */
    milestone?: boolean;
    /** Parent task: makes the parent a group that spans its sub-tasks */
    parentId?: string;
    /** Tasks that must be finished before this one starts (finish-to-start) */
    dependencies?: string[];
    tone?: VisualTone;
}

/** A visible row of the task list */
export interface GanttRow {
    task: GanttTask;
    /** Shown dates and progress – a group spans its sub-tasks */
    start: string;
    end: string;
    progress: number;
    /** Depth, 1 = top level */
    level: number;
    hasChildren: boolean;
    expanded: boolean;
    /** Position among its siblings (1-based) and their number */
    posinset: number;
    setsize: number;
}

const DAY_MS = 86_400_000;
const dayNumber = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00Z`) / DAY_MS;

/** Days from one date to another ("2026-10-20" → "2026-10-22": 2) */
export const daysBetween = (from: string, to: string) => Math.round(dayNumber(to) - dayNumber(from));

/** Length of a task in days, both ends counted; milestones 0 */
export const taskDuration = (task: Pick<GanttTask, 'start' | 'end' | 'milestone'>) =>
    task.milestone ? 0 : Math.max(1, daysBetween(task.start, task.end) + 1);

/** Sub-tasks by parent id (top-level tasks under "") in their order */
function childrenOf(tasks: GanttTask[]) {
    const ids = new Set(tasks.map((task) => task.id));
    const children = new Map<string, GanttTask[]>();
    for (const task of tasks) {
        const parent = task.parentId && ids.has(task.parentId) ? task.parentId : '';
        children.set(parent, [...(children.get(parent) ?? []), task]);
    }
    return children;
}

/** Dates and progress of every task – groups span their sub-tasks, their progress is weighted by duration */
export function ganttSpans(tasks: GanttTask[]): Map<string, { start: string; end: string; progress: number }> {
    const children = childrenOf(tasks);
    const spans = new Map<string, { start: string; end: string; progress: number }>();
    const visit = (task: GanttTask, seen: Set<string>): { start: string; end: string; progress: number } => {
        const known = spans.get(task.id);
        if (known) return known;
        const kids = seen.has(task.id) ? [] : (children.get(task.id) ?? []);
        let span = { start: task.start, end: task.end, progress: task.progress ?? 0 };
        if (kids.length) {
            const parts = kids.map((kid) => ({
                ...visit(kid, new Set([...seen, task.id])),
                weight: Math.max(1, taskDuration(kid)),
            }));
            const weight = parts.reduce((sum, part) => sum + part.weight, 0);
            span = {
                start: parts.reduce((min, part) => (part.start < min ? part.start : min), parts[0]!.start),
                end: parts.reduce((max, part) => (part.end > max ? part.end : max), parts[0]!.end),
                progress: Math.round(parts.reduce((sum, part) => sum + part.progress * part.weight, 0) / weight),
            };
        }
        spans.set(task.id, span);
        return span;
    };
    for (const task of tasks) visit(task, new Set());
    return spans;
}

/** The visible rows: top-level tasks and the sub-tasks of expanded groups, depth first */
export function ganttRows(tasks: GanttTask[], expanded: Iterable<string>): GanttRow[] {
    const open = new Set(expanded);
    const children = childrenOf(tasks);
    const spans = ganttSpans(tasks);
    const rows: GanttRow[] = [];
    const walk = (parent: string, level: number, seen: Set<string>) => {
        const siblings = children.get(parent) ?? [];
        siblings.forEach((task, index) => {
            const hasChildren = !!children.get(task.id)?.length && !seen.has(task.id);
            const span = spans.get(task.id)!;
            const isOpen = hasChildren && open.has(task.id);
            rows.push({
                task,
                ...span,
                level,
                hasChildren,
                expanded: isOpen,
                posinset: index + 1,
                setsize: siblings.length,
            });
            if (isOpen) walk(task.id, level + 1, new Set([...seen, task.id]));
        });
    };
    walk('', 1, new Set());
    return rows;
}

/** Ids of all tasks that have sub-tasks (e.g. to expand everything) */
export const ganttGroupIds = (tasks: GanttTask[]) => [...childrenOf(tasks).keys()].filter(Boolean);

/** A task moved by days, or with `resize` its end moved (at least one day long); milestones keep start = end */
export function shiftTask(
    task: Pick<GanttTask, 'start' | 'end' | 'milestone'>,
    days: number,
    resize = false
): { start: string; end: string } {
    if (task.milestone) {
        const day = addIsoDays(task.start, days);
        return { start: day, end: day };
    }
    if (resize) {
        const end = addIsoDays(task.end, days);
        return { start: task.start, end: end < task.start ? task.start : end };
    }
    return { start: addIsoDays(task.start, days), end: addIsoDays(task.end, days) };
}

// ── Time axis ───────────────────────────────────────────────────────────────────────────────────────────────────

/** Width of a day in pixels per zoom */
export const GANTT_DAY_WIDTH: Record<GanttZoom, number> = { day: 36, week: 16, month: 5, quarter: 2 };

/** A unit of the axis header: from `start`, `days` long */
export interface GanttUnit {
    start: string;
    days: number;
    label: string;
}

export interface GanttScale {
    /** First day of the axis */
    start: string;
    /** Number of days */
    days: number;
    dayWidth: number;
    /** Upper header row (months or years) and lower one (days, weeks, months or quarters) */
    top: GanttUnit[];
    bottom: GanttUnit[];
}

const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;
const nextMonth = (iso: string) => {
    const [year = 0, month = 1] = iso.split('-').map(Number);
    return month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
};
const quarterStart = (iso: string) => {
    const month = Number(iso.slice(5, 7));
    return `${iso.slice(0, 4)}-${String(month - ((month - 1) % 3)).padStart(2, '0')}-01`;
};
const yearStart = (iso: string) => `${iso.slice(0, 4)}-01-01`;
const weekStart = (iso: string) => addIsoDays(iso, -((isoWeekday(iso) + 6) % 7));

/** Start of the unit holding a day, and the start of the next unit */
function unitBounds(unit: 'day' | 'week' | 'month' | 'quarter' | 'year', iso: string): [string, string] {
    if (unit === 'day') return [iso, addIsoDays(iso, 1)];
    if (unit === 'week') return [weekStart(iso), addIsoDays(weekStart(iso), 7)];
    if (unit === 'month') return [monthStart(iso), nextMonth(iso)];
    if (unit === 'quarter') {
        const first = quarterStart(iso);
        return [first, nextMonth(nextMonth(nextMonth(first)))];
    }
    return [yearStart(iso), `${Number(iso.slice(0, 4)) + 1}-01-01`];
}

const UNITS: Record<GanttZoom, { bottom: 'day' | 'week' | 'month' | 'quarter'; top: 'month' | 'year' }> = {
    day: { bottom: 'day', top: 'month' },
    week: { bottom: 'week', top: 'month' },
    month: { bottom: 'month', top: 'year' },
    quarter: { bottom: 'quarter', top: 'year' },
};

/**
 * The axis for tasks at a zoom: from the start of the unit holding the earliest task to one unit after the latest
 * (or around `fallback` without tasks), with the header units labelled in the locale.
 */
export function ganttScale(
    tasks: Pick<GanttTask, 'start' | 'end'>[],
    zoom: GanttZoom,
    locale: string,
    translations: Translations,
    fallback = '2026-01-01'
): GanttScale {
    const units = UNITS[zoom];
    const first = tasks.reduce((min, task) => (task.start < min ? task.start : min), tasks[0]?.start ?? fallback);
    const last = tasks.reduce((max, task) => (task.end > max ? task.end : max), tasks[0]?.end ?? fallback);
    const start = unitBounds(units.bottom, addIsoDays(first.slice(0, 10), zoom === 'day' ? -1 : 0))[0];
    let end = unitBounds(units.bottom, last.slice(0, 10))[1];
    end = unitBounds(units.bottom, end)[1];
    const days = daysBetween(start, end);
    const format = (options: Intl.DateTimeFormatOptions, iso: string) =>
        new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(new Date(`${iso}T00:00Z`));
    const t = translations.gantt;
    const label = (unit: string, iso: string) => {
        if (unit === 'day') return String(Number(iso.slice(8, 10)));
        if (unit === 'week') return t.week(isoWeek(iso).week);
        if (unit === 'month')
            return format(
                { month: zoom === 'month' ? 'short' : 'long', year: zoom === 'month' ? undefined : 'numeric' },
                iso
            );
        if (unit === 'quarter') return t.quarter(Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1);
        return iso.slice(0, 4);
    };
    const row = (unit: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
        const result: GanttUnit[] = [];
        for (let at = start; at < end;) {
            const [, next] = unitBounds(unit, at);
            const stop = next < end ? next : end;
            result.push({ start: at, days: daysBetween(at, stop), label: label(unit, at) });
            at = stop;
        }
        return result;
    };
    return { start, days, dayWidth: GANTT_DAY_WIDTH[zoom], top: row(units.top), bottom: row(units.bottom) };
}

/** Position of a bar on the axis in pixels: from the start of its first day to the end of its last (milestone: a point) */
export function ganttBar(
    task: Pick<GanttTask, 'start' | 'end' | 'milestone'>,
    scale: Pick<GanttScale, 'start' | 'dayWidth'>
): { x: number; width: number } {
    const x = daysBetween(scale.start, task.start) * scale.dayWidth;
    return { x, width: taskDuration(task) * scale.dayWidth };
}

/** Arrow of a finish-to-start dependency: the path (with a bend around the bars) and its arrowhead */
export function dependencyPath(
    from: { x: number; width: number; row: number },
    to: { x: number; row: number },
    rowHeight: number,
    rtl = false
): { line: string; head: string } {
    const sign = rtl ? -1 : 1;
    const y1 = from.row * rowHeight + rowHeight / 2;
    const y2 = to.row * rowHeight + rowHeight / 2;
    const x1 = rtl ? from.x : from.x + from.width;
    const x2 = to.x;
    const gap = 8;
    let line: string;
    if (sign * (x2 - x1) >= 2 * gap) line = `M ${x1} ${y1} H ${x1 + sign * gap} V ${y2} H ${x2}`;
    else {
        const middle = y2 > y1 ? to.row * rowHeight : (to.row + 1) * rowHeight;
        line = `M ${x1} ${y1} H ${x1 + sign * gap} V ${middle} H ${x2 - sign * gap} V ${y2} H ${x2}`;
    }
    const head = `M ${x2} ${y2} l ${-sign * 6} -4 v 8 z`;
    return { line, head };
}

// ── Dependencies ────────────────────────────────────────────────────────────────────────────────────────────────

/** Ids of the tasks a task depends on, groups replaced by their sub-tasks without children (leaves) */
function leafDependencies(tasks: GanttTask[]) {
    const children = childrenOf(tasks);
    const leaves = (id: string, seen = new Set<string>()): string[] => {
        const kids = children.get(id);
        if (!kids?.length || seen.has(id)) return [id];
        return kids.flatMap((kid) => leaves(kid.id, new Set([...seen, id])));
    };
    return { children, leaves };
}

/**
 * The critical path: tasks (without sub-tasks) whose delay would delay the end of the project. Tasks without
 * predecessors start at their planned start, the others as soon as their predecessors are finished; latest ends run
 * back from the end of the project, tasks without slack are critical. Tasks in a cycle of dependencies are left out.
 */
export function criticalPath(tasks: GanttTask[]): Set<string> {
    const { children, leaves } = leafDependencies(tasks);
    const nodes = tasks.filter((task) => !children.get(task.id)?.length);
    const byId = new Map(nodes.map((task) => [task.id, task]));
    const predecessors = new Map(
        nodes.map((task) => [
            task.id,
            [...new Set((task.dependencies ?? []).flatMap((id) => leaves(id)))].filter(
                (id) => byId.has(id) && id !== task.id
            ),
        ])
    );
    if (!nodes.length) return new Set();
    const origin = nodes.reduce((min, task) => (task.start < min ? task.start : min), nodes[0]!.start);
    // Topological order (Kahn); tasks in cycles never get there
    const waiting = new Map(nodes.map((task) => [task.id, predecessors.get(task.id)!.length]));
    const successors = new Map<string, string[]>();
    for (const [id, before] of predecessors)
        for (const pred of before) successors.set(pred, [...(successors.get(pred) ?? []), id]);
    const order: string[] = [];
    const queue = nodes.filter((task) => waiting.get(task.id) === 0).map((task) => task.id);
    while (queue.length) {
        const id = queue.shift()!;
        order.push(id);
        for (const next of successors.get(id) ?? []) {
            waiting.set(next, waiting.get(next)! - 1);
            if (waiting.get(next) === 0) queue.push(next);
        }
    }
    const earliestFinish = new Map<string, number>();
    const earliestStart = new Map<string, number>();
    for (const id of order) {
        const task = byId.get(id)!;
        const before = predecessors.get(id)!;
        const start = before.length
            ? Math.max(...before.map((pred) => earliestFinish.get(pred) ?? 0))
            : daysBetween(origin, task.start);
        earliestStart.set(id, start);
        earliestFinish.set(id, start + taskDuration(task));
    }
    const projectEnd = Math.max(...earliestFinish.values());
    const latestStart = new Map<string, number>();
    const critical = new Set<string>();
    for (const id of [...order].reverse()) {
        const task = byId.get(id)!;
        const finish = Math.min(
            projectEnd,
            ...(successors.get(id) ?? []).filter((next) => latestStart.has(next)).map((next) => latestStart.get(next)!)
        );
        latestStart.set(id, finish - taskDuration(task));
        if (finish - earliestFinish.get(id)! <= 0) critical.add(id);
    }
    return critical;
}

/** Whether "`to` depends on `from`" would close a cycle (or is the task itself, or exists already) */
export function dependencyCycle(tasks: GanttTask[], from: string, to: string): boolean {
    if (from === to) return true;
    const byId = new Map(tasks.map((task) => [task.id, task]));
    if (byId.get(to)?.dependencies?.includes(from)) return true;
    // A cycle when `to` is already (directly or indirectly) a predecessor of `from`
    const seen = new Set<string>();
    const stack = [from];
    while (stack.length) {
        const id = stack.pop()!;
        if (id === to) return true;
        if (seen.has(id)) continue;
        seen.add(id);
        stack.push(...(byId.get(id)?.dependencies ?? []));
    }
    return false;
}

const toneClasses = {
    primary: {
        bar: 'border-primary bg-primary/12',
        barProgress: 'bg-primary/30',
        milestone: 'border-primary bg-primary/30',
    },
    info: { bar: 'border-info bg-info/12', barProgress: 'bg-info/30', milestone: 'border-info bg-info/30' },
    success: {
        bar: 'border-success bg-success/12',
        barProgress: 'bg-success/30',
        milestone: 'border-success bg-success/30',
    },
    warn: { bar: 'border-warn bg-warn/12', barProgress: 'bg-warn/30', milestone: 'border-warn bg-warn/30' },
    danger: { bar: 'border-danger bg-danger/12', barProgress: 'bg-danger/30', milestone: 'border-danger bg-danger/30' },
};

export const gantt = tv({
    slots: {
        base: 'flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-card text-fg',
        toolbar: 'flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2.5',
        heading: 'me-auto min-w-0 truncate text-base font-semibold text-fg',
        scroll: 'relative overflow-auto',
        layout: 'flex min-w-max items-start',
        // Task list (treegrid) – stays at the start while the chart scrolls sideways
        table: 'sticky start-0 z-[3] border-separate border-spacing-0 border-e border-line bg-card text-sm',
        headCell: [
            'sticky top-0 z-[1] h-16 border-b border-line bg-card px-3 pb-2 text-start align-bottom whitespace-nowrap',
            'font-mono text-[10px] font-normal tracking-label text-muted uppercase',
        ],
        row: [
            'h-10 outline-none hover:bg-bg-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        cell: 'border-b border-line px-3 whitespace-nowrap text-muted tabular-nums',
        nameCell: 'max-w-72 border-b border-line pe-3 font-medium text-fg',
        name: 'flex min-w-0 items-center gap-1',
        nameText: 'truncate',
        toggle: [
            'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted hover:bg-line',
            '[&>svg]:size-4 [&>svg]:motion-safe:transition-transform data-expanded:[&>svg]:rotate-90 rtl:[&>svg]:-scale-x-100',
        ],
        toggleSpace: 'inline-block size-6 shrink-0',
        srOnly: 'sr-only',
        // Chart
        chart: 'relative shrink-0',
        header: 'sticky top-0 z-[2] h-16 border-b border-line bg-card',
        headerRow: 'relative h-8 first:border-b first:border-line',
        unit: 'absolute inset-y-0 flex items-center overflow-hidden border-s border-line px-1.5 font-mono text-[10px] whitespace-nowrap text-muted',
        lanes: 'relative',
        lane: 'relative h-10 border-b border-line',
        gridLine: 'pointer-events-none absolute inset-y-0 w-px bg-line',
        bar: [
            'group/bar absolute top-2 h-6 touch-none rounded-md border text-xs select-none forced-colors:border-[CanvasText]',
            'data-editable:cursor-grab data-dragging:cursor-grabbing data-dragging:shadow-lg',
            'data-critical:outline-2 data-critical:outline-offset-1 data-critical:outline-danger',
        ],
        barProgress: 'pointer-events-none absolute inset-y-0 start-0 rounded-s-md',
        barLabel: 'pointer-events-none relative block truncate px-1.5 leading-[1.375rem] font-medium text-fg',
        summary: [
            'absolute top-3.5 h-3 rounded-xs bg-fg/70 forced-colors:bg-[CanvasText]',
            'before:absolute before:-bottom-1.5 before:start-0 before:border-x-4 before:border-t-6 before:border-x-transparent before:border-t-fg/70',
            'after:absolute after:-bottom-1.5 after:end-0 after:border-x-4 after:border-t-6 after:border-x-transparent after:border-t-fg/70',
            'data-critical:outline-2 data-critical:outline-offset-1 data-critical:outline-danger',
        ],
        milestone: [
            'absolute top-2.5 size-5 -translate-x-1/2 rotate-45 touch-none rounded-[3px] border-2 select-none rtl:translate-x-1/2',
            'data-editable:cursor-grab data-critical:outline-2 data-critical:outline-offset-1 data-critical:outline-danger',
        ],
        milestoneLabel:
            'pointer-events-none absolute top-2.5 ms-4 text-xs leading-5 font-medium whitespace-nowrap text-fg',
        resizeStart: 'absolute inset-y-0 start-0 w-2 cursor-ew-resize',
        resizeEnd: 'absolute inset-y-0 end-0 w-2 cursor-ew-resize',
        progressHandle: [
            'absolute -bottom-1.5 size-3 -translate-x-1/2 rotate-45 cursor-ew-resize border border-fg bg-card rtl:translate-x-1/2',
            'opacity-0 group-hover/bar:opacity-100',
        ],
        linkHandle: [
            'absolute -end-4 top-1/2 size-3 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-fg bg-card',
            'opacity-0 group-hover/bar:opacity-100',
        ],
        links: 'pointer-events-none absolute inset-0 overflow-visible rtl:-scale-x-100',
        link: 'fill-none stroke-muted stroke-[1.5] data-critical:stroke-danger data-critical:stroke-2 forced-colors:stroke-[CanvasText]',
        linkHead: 'fill-muted data-critical:fill-danger forced-colors:fill-[CanvasText]',
        linkDraft: 'fill-none stroke-fg stroke-[1.5] [stroke-dasharray:4_3]',
        today: 'pointer-events-none absolute inset-y-0 z-[1] w-0.5 bg-danger',
        empty: 'px-3 py-10 text-center text-sm text-muted',
        status: 'sr-only',
    },
    variants: {
        tone: {
            primary: toneClasses.primary,
            info: toneClasses.info,
            success: toneClasses.success,
            warn: toneClasses.warn,
            danger: toneClasses.danger,
        },
    },
    defaultVariants: {
        tone: 'primary',
    },
});

/**
 * Tasks that can become a predecessor of the task (a new finish-to-start dependency): not the task itself, not one it
 * already depends on, none that would close a cycle – in the order of `tasks`
 */
export function ganttPredecessors(tasks: GanttTask[], taskId: string): GanttTask[] {
    const task = tasks.find((entry) => entry.id === taskId);
    if (!task) return [];
    return tasks.filter(
        (entry) =>
            entry.id !== taskId && !task.dependencies?.includes(entry.id) && !dependencyCycle(tasks, entry.id, taskId)
    );
}

// ── Task list (React Native) ────────────────────────────────────────────────────────────────────────────────────

/** First and last day of all tasks and the number of days from one to the other (both counted); null without tasks */
export function ganttExtent(
    tasks: Pick<GanttTask, 'start' | 'end'>[]
): { start: string; end: string; days: number } | null {
    if (!tasks.length) return null;
    const start = tasks.reduce((min, task) => (task.start < min ? task.start : min), tasks[0]!.start).slice(0, 10);
    const end = tasks.reduce((max, task) => (task.end > max ? task.end : max), tasks[0]!.end).slice(0, 10);
    return { start, end, days: Math.max(1, daysBetween(start, end) + 1) };
}

/**
 * A bar in percent of the extent (the bars of a task list share one scale): `offset` of its first day and `width` of
 * its days; a milestone has no width, its offset is the middle of its day
 */
export function ganttBarPercent(
    task: Pick<GanttTask, 'start' | 'end' | 'milestone'>,
    extent: { start: string; days: number }
): { offset: number; width: number } {
    const from = daysBetween(extent.start, task.start);
    if (task.milestone) return { offset: ((from + 0.5) / extent.days) * 100, width: 0 };
    const offset = Math.max(0, Math.min(100, (from / extent.days) * 100));
    return { offset, width: Math.max(0, Math.min(100 - offset, (taskDuration(task) / extent.days) * 100)) };
}

/** Progress changed by a step (e.g. ±10), rounded and kept within 0–100 */
export const stepProgress = (progress: number, step: number) => Math.max(0, Math.min(100, Math.round(progress + step)));
