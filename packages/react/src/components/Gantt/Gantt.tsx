import {
    addIsoDays,
    criticalPath,
    daysBetween,
    dependencyCycle,
    dependencyPath,
    gantt as ganttRecipe,
    ganttBar,
    ganttGroupIds,
    ganttPredecessors,
    ganttRows,
    ganttScale,
    pluralText,
    shiftTask,
    taskDuration,
    todayIso,
    type GanttRow,
    type GanttTask,
    type GanttZoom,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronRight } from 'lucide-react';
import {
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type ComponentProps,
    type KeyboardEvent,
    type PointerEvent,
} from 'react';
import { Button } from '../Button/Button.js';
import { Dialog, DialogContent } from '../Dialog/Dialog.js';
import { Field } from '../Field/Field.js';
import { NativeSelect } from '../NativeSelect/NativeSelect.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { SegmentedControlItem } from '../SegmentedControl/SegmentedControlItem.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

/** New dates of a task (moved or resized) */
export interface GanttChange {
    task: GanttTask;
    start: string;
    end: string;
}

/** New progress of a task in percent */
export interface GanttProgress {
    task: GanttTask;
    progress: number;
}

/** A new finish-to-start dependency: `to` depends on `from` */
export interface GanttLink {
    from: GanttTask;
    to: GanttTask;
}

export interface GanttProps extends Omit<ComponentProps<'div'>, 'children' | 'title'> {
    tasks: GanttTask[];
    /** Unit of the time axis; controlled together with onZoomChange */
    zoom?: GanttZoom;
    defaultZoom?: GanttZoom;
    onZoomChange?: (zoom: GanttZoom) => void;
    /** Zoom levels offered in the toolbar */
    zooms?: GanttZoom[];
    /** Ids of the expanded groups; controlled together with onExpandedChange (default: all expanded) */
    expanded?: string[];
    defaultExpanded?: string[];
    onExpandedChange?: (ids: string[]) => void;
    /** Tasks can be moved, resized and their progress changed: drag the bars, or Alt(+Shift)+arrow keys in the list */
    editable?: boolean;
    /** New dependencies by dragging from the dot at the end of a bar onto another bar, or by keyboard with "Add dependency…" */
    linkable?: boolean;
    /** The tasks are loading (e.g. from a server): the chart is aria-busy, without tasks it says "Loading" */
    loading?: boolean;
    /** Marks the critical path (tasks without slack) in the chart and the list */
    showCriticalPath?: boolean;
    /** Today (ISO) for the line in the chart – default the current day (only in the browser) */
    today?: string;
    /** Title above the chart */
    title?: string;
    /** Level of the title heading */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Height of the chart (CSS length); it scrolls inside */
    height?: string;
    /** Accessible name of the task list */
    label?: string;
    locale?: string;
    /** A task was chosen (Enter in the list, click on its bar) */
    onTaskClick?: (task: GanttTask) => void;
    /** A task was moved or resized – apply start and end to your data */
    onTaskChange?: (change: GanttChange) => void;
    /** The progress of a task was changed */
    onProgressChange?: (change: GanttProgress) => void;
    /** A dependency was drawn (linkable) – add `from.id` to the dependencies of `to` */
    onDependencyCreate?: (link: GanttLink) => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof ganttRecipe>;
}

const ROW = 40;
const ZOOMS: GanttZoom[] = ['day', 'week', 'month', 'quarter'];
const KEYS = 'Alt+ArrowLeft Alt+ArrowRight Alt+Shift+ArrowLeft Alt+Shift+ArrowRight Alt+ArrowUp Alt+ArrowDown';
const noSubscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

interface Drag {
    id: string;
    mode: 'move' | 'start' | 'end' | 'progress' | 'link';
    days: number;
    progress: number;
    x: number;
    y: number;
}

/** Gantt chart: task list as treegrid (keyboard, texts of dates and dependencies), the chart beside it */
export function Gantt({
    tasks,
    zoom: zoomProp,
    defaultZoom = 'week',
    onZoomChange,
    zooms = ZOOMS,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    editable = false,
    linkable = false,
    loading = false,
    showCriticalPath = false,
    today: todayProp,
    title,
    headingLevel = 2,
    height = '480px',
    label,
    locale: localeProp,
    onTaskClick,
    onTaskChange,
    onProgressChange,
    onDependencyCreate,
    classes,
    className,
    ...props
}: GanttProps) {
    const gantt = useRecipe('gantt', ganttRecipe, classes);
    const styles = gantt();
    const localeContext = useLocale();
    const translations = useTranslations();
    const t = translations.gantt;
    const locale = localeProp ?? localeContext.locale;
    const rtl = localeContext.dir === 'rtl';

    const [internalZoom, setInternalZoom] = useState(defaultZoom);
    const zoom = zoomProp ?? internalZoom;
    const setZoom = (next: GanttZoom) => {
        setInternalZoom(next);
        onZoomChange?.(next);
    };
    const [internalExpanded, setInternalExpanded] = useState(() => defaultExpanded ?? ganttGroupIds(tasks));
    const expanded = expandedProp ?? internalExpanded;
    const toggle = (id: string, open = !expanded.includes(id)) => {
        const next = open ? [...new Set([...expanded, id])] : expanded.filter((item) => item !== id);
        setInternalExpanded(next);
        onExpandedChange?.(next);
    };

    // Dragging: the dates (or progress) of one task change while the pointer moves
    const [drag, setDrag] = useState<Drag | null>(null);
    const byId = new Map(tasks.map((task) => [task.id, task]));
    const previewOf = (task: GanttTask): GanttTask => {
        if (!drag || drag.id !== task.id || !drag.days) return task;
        if (drag.mode === 'move') return { ...task, ...shiftTask(task, drag.days) };
        if (drag.mode === 'end') return { ...task, ...shiftTask(task, drag.days, true) };
        if (drag.mode === 'start') {
            const start = addIsoDays(task.start, drag.days);
            return { ...task, start: start > task.end ? task.end : start };
        }
        return task;
    };
    const rows = ganttRows(tasks.map(previewOf), expanded);
    const scale = ganttScale(tasks, zoom, locale, translations);
    const critical = showCriticalPath ? criticalPath(tasks) : new Set<string>();
    const bar = (row: GanttRow) => ganttBar({ ...row, milestone: row.task.milestone }, scale);
    const chartWidth = scale.days * scale.dayWidth;
    const rowIndex = new Map(rows.map((row, position) => [row.task.id, position]));
    const links = rows.flatMap((row, position) =>
        (row.task.dependencies ?? [])
            .filter((id) => rowIndex.has(id))
            .map((id) => {
                const from = rows[rowIndex.get(id)!]!;
                const box = bar(from);
                const to = bar(row);
                const half = scale.dayWidth / 2;
                const path = dependencyPath(
                    {
                        x: from.task.milestone ? box.x + half : box.x,
                        width: from.task.milestone ? 0 : box.width,
                        row: rowIndex.get(id)!,
                    },
                    { x: row.task.milestone ? to.x + half - 8 : to.x, row: position },
                    ROW
                );
                return {
                    key: `${id}-${row.task.id}`,
                    ...path,
                    critical: critical.has(id) && critical.has(row.task.id),
                };
            })
    );

    // Today: from the prop, else only in the browser (server and client render alike)
    const mounted = useSyncExternalStore(noSubscribe, onClient, onServer);
    const today = todayProp ?? (mounted ? todayIso() : null);
    const todayOffset = today ? daysBetween(scale.start, today) : -1;
    const todayLeft = todayOffset >= 0 && todayOffset < scale.days ? (todayOffset + 0.5) * scale.dayWidth : -1;
    const scroll = useRef<HTMLDivElement>(null);
    const table = useRef<HTMLTableElement>(null);
    const scrollToToday = () => {
        const offset = daysBetween(scale.start, today ?? todayIso()) * scale.dayWidth;
        const left = Math.max(0, offset - (scroll.current?.clientWidth ?? 0) / 3);
        scroll.current?.scrollTo({ left: rtl ? -left : left, behavior: 'smooth' });
    };

    // Texts
    const format = (iso: string) =>
        new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(
            new Date(`${iso}T00:00Z`)
        );
    const durationText = (row: GanttRow) =>
        row.task.milestone ? t.milestone : pluralText(t.days, taskDuration({ ...row, milestone: false }), locale);
    const details = (row: GanttRow) => {
        const parts: string[] = [];
        if (row.task.milestone) parts.push(t.milestone);
        else parts.push(t.progress(row.progress));
        const names = (row.task.dependencies ?? []).map((id) => byId.get(id)?.name).filter(Boolean) as string[];
        if (names.length) parts.push(t.dependsOn(new Intl.ListFormat(locale, { type: 'conjunction' }).format(names)));
        if (critical.has(row.task.id)) parts.push(t.critical);
        return `, ${parts.join(', ')}`;
    };
    const [status, setStatus] = useState('');
    const change = (task: GanttTask, next: { start: string; end: string }) => {
        if (next.start === task.start && next.end === task.end) return;
        const duration = task.milestone ? t.milestone : pluralText(t.days, taskDuration(next), locale);
        setStatus(t.changed(task.name, `${format(next.start)} – ${format(next.end)}, ${duration}`));
        onTaskChange?.({ task, ...next });
    };
    const changeProgress = (task: GanttTask, progress: number) => {
        const value = Math.max(0, Math.min(100, Math.round(progress)));
        if (value === (task.progress ?? 0)) return;
        setStatus(t.progressChanged(task.name, value));
        onProgressChange?.({ task, progress: value });
    };

    // A dependency by keyboard (linkable): the toolbar action asks for a predecessor of the active task
    const [linking, setLinking] = useState<GanttTask | null>(null);
    const [predecessor, setPredecessor] = useState('');
    const predecessors = linking ? ganttPredecessors(tasks, linking.id) : [];
    const openLinking = () => {
        const task = activeId ? byId.get(activeId) : undefined;
        if (!task) return;
        setPredecessor(ganttPredecessors(tasks, task.id)[0]?.id ?? '');
        setLinking(task);
    };
    const confirmLinking = () => {
        const from = byId.get(predecessor);
        const to = linking;
        setLinking(null);
        if (!from || !to) return;
        setStatus(t.linked(from.name, to.name));
        onDependencyCreate?.({ from, to });
    };

    // Task list (treegrid): one row in the tab order; arrows move, Left/Right collapse and expand, Enter chooses,
    // Alt+Left/Right moves the task by a day, Alt+Shift+Left/Right changes its length, Alt+Up/Down its progress
    const [active, setActive] = useState<string | null>(null);
    const activeId = rows.some((row) => row.task.id === active) ? active : (rows[0]?.task.id ?? null);
    const [focusNext, setFocusNext] = useState<{ id: string } | null>(null);
    useEffect(() => {
        if (focusNext)
            table.current?.querySelector<HTMLElement>(`[data-task-id="${CSS.escape(focusNext.id)}"]`)?.focus();
    }, [focusNext]);
    const focusRow = (id: string) => {
        setActive(id);
        setFocusNext({ id });
    };
    const onRowKey = (index: number, key: KeyboardEvent) => {
        const row = rows[index]!;
        const task = byId.get(row.task.id)!;
        const direction = rtl ? -1 : 1;
        if (key.altKey) {
            if (!editable || row.hasChildren) return;
            const step = ({ ArrowLeft: -direction, ArrowRight: direction } as Record<string, number>)[key.key];
            if (step) {
                key.preventDefault();
                if (key.shiftKey && task.milestone) return;
                change(task, shiftTask(task, step, key.shiftKey));
            } else if ((key.key === 'ArrowUp' || key.key === 'ArrowDown') && !key.shiftKey && !task.milestone) {
                key.preventDefault();
                changeProgress(task, (task.progress ?? 0) + (key.key === 'ArrowUp' ? 10 : -10));
            }
            return;
        }
        const target = (position: number) => {
            const next = rows[Math.max(0, Math.min(rows.length - 1, position))];
            if (next) focusRow(next.task.id);
        };
        const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
        const back = rtl ? 'ArrowRight' : 'ArrowLeft';
        if (key.key === 'ArrowDown') target(index + 1);
        else if (key.key === 'ArrowUp') target(index - 1);
        else if (key.key === 'Home') target(0);
        else if (key.key === 'End') target(rows.length - 1);
        else if (key.key === forward && row.hasChildren) {
            if (row.expanded) target(index + 1);
            else toggle(row.task.id, true);
        } else if (key.key === back) {
            if (row.hasChildren && row.expanded) toggle(row.task.id, false);
            else if (row.task.parentId) focusRow(row.task.parentId);
            else return;
        } else if (key.key === 'Enter' || key.key === ' ') onTaskClick?.(task);
        else return;
        key.preventDefault();
    };

    // Dragging the bars: move, resize at either end, progress, and (linkable) a dependency onto another bar
    const lanes = useRef<HTMLDivElement>(null);
    const origin = useRef({ x: 0, left: 0, top: 0, width: 1, moved: false });
    const suppressClick = useRef(false);
    const onBarDown = (row: GanttRow, mode: Drag['mode'], pointer: PointerEvent<HTMLElement>) => {
        if (pointer.button !== 0 || row.hasChildren) return;
        if (mode === 'link' ? !linkable : !editable) return;
        pointer.stopPropagation();
        const box = lanes.current!.getBoundingClientRect();
        origin.current = { x: pointer.clientX, left: box.left, top: box.top, width: bar(row).width, moved: false };
        setDrag({
            id: row.task.id,
            mode,
            days: 0,
            progress: row.progress,
            x: pointer.clientX - box.left,
            y: pointer.clientY - box.top,
        });
    };
    const onBarMove = (pointer: globalThis.PointerEvent) => {
        if (!drag) return;
        const dx = (pointer.clientX - origin.current.x) * (rtl ? -1 : 1);
        origin.current.moved ||= Math.abs(dx) > 3;
        const task = byId.get(drag.id)!;
        if (drag.mode === 'progress')
            setDrag({
                ...drag,
                progress: Math.max(
                    0,
                    Math.min(100, Math.round(((task.progress ?? 0) / 100 + dx / origin.current.width) * 20) * 5)
                ),
            });
        else if (drag.mode === 'link')
            setDrag({ ...drag, x: pointer.clientX - origin.current.left, y: pointer.clientY - origin.current.top });
        else setDrag({ ...drag, days: Math.round(dx / scale.dayWidth) });
    };
    const onBarUp = (pointer: globalThis.PointerEvent) => {
        const done = drag;
        setDrag(null);
        suppressClick.current = origin.current.moved;
        if (!done) return;
        const task = byId.get(done.id)!;
        if (done.mode === 'progress') return changeProgress(task, done.progress);
        if (done.mode === 'link') {
            const target = document
                .elementFromPoint(pointer.clientX, pointer.clientY)
                ?.closest<HTMLElement>('[data-gantt-bar]')?.dataset.taskId;
            const to = target ? byId.get(target) : undefined;
            if (!to || dependencyCycle(tasks, task.id, to.id)) return;
            setStatus(t.linked(task.name, to.name));
            onDependencyCreate?.({ from: task, to });
            return;
        }
        const preview = previewOf(task);
        change(task, { start: preview.start, end: preview.end });
    };
    const handlers = useRef({ move: onBarMove, up: onBarUp });
    useEffect(() => {
        handlers.current = { move: onBarMove, up: onBarUp };
    });
    const dragging = drag !== null;
    useEffect(() => {
        if (!dragging) return;
        const move = (pointer: globalThis.PointerEvent) => handlers.current.move(pointer);
        const up = (pointer: globalThis.PointerEvent) => handlers.current.up(pointer);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up, { once: true });
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, [dragging]);
    const onBarClick = (task: GanttTask) => {
        if (suppressClick.current) {
            suppressClick.current = false;
            return;
        }
        onTaskClick?.(byId.get(task.id)!);
    };
    const progressOf = (row: GanttRow) =>
        drag?.id === row.task.id && drag.mode === 'progress' ? drag.progress : row.progress;
    const draftLine = (() => {
        if (drag?.mode !== 'link') return '';
        const position = rowIndex.get(drag.id) ?? 0;
        const box = bar(rows[position]!);
        const x = rtl ? chartWidth - drag.x : drag.x;
        return `M ${box.x + box.width} ${position * ROW + ROW / 2} L ${x} ${drag.y}`;
    })();
    const Heading = `h${headingLevel}` as const;
    const unitStyle = (unit: { start: string; days: number }) => ({
        insetInlineStart: `${daysBetween(scale.start, unit.start) * scale.dayWidth}px`,
        width: `${unit.days * scale.dayWidth}px`,
    });

    return (
        <div
            {...props}
            className={styles.base({ class: className })}
            role="region"
            aria-label={label ?? title ?? t.label}
            aria-busy={loading || undefined}
        >
            <div className={styles.toolbar()}>
                {title && <Heading className={styles.heading()}>{title}</Heading>}
                <Button variant="outline" size="sm" onClick={scrollToToday}>
                    {t.today}
                </Button>
                {linkable && (
                    <Button variant="outline" size="sm" disabled={!activeId} onClick={openLinking}>
                        {t.addDependency}
                    </Button>
                )}
                {zooms.length > 1 && (
                    <SegmentedControl
                        label={t.zoom}
                        size="sm"
                        value={zoom}
                        onValueChange={(next) => next && setZoom(next as GanttZoom)}
                    >
                        {zooms.map((option) => (
                            <SegmentedControlItem key={option} value={option}>
                                {t.zooms[option]}
                            </SegmentedControlItem>
                        ))}
                    </SegmentedControl>
                )}
            </div>
            <div ref={scroll} className={styles.scroll()} style={{ maxHeight: height }}>
                <div className={styles.layout()}>
                    <table
                        ref={table}
                        role="treegrid"
                        aria-label={label ?? title ?? t.label}
                        className={styles.table()}
                    >
                        <thead>
                            <tr role="row">
                                <th role="columnheader" scope="col" className={styles.headCell()}>
                                    {t.task}
                                </th>
                                <th role="columnheader" scope="col" className={styles.headCell()}>
                                    {t.start}
                                </th>
                                <th role="columnheader" scope="col" className={styles.headCell()}>
                                    {t.end}
                                </th>
                                <th role="columnheader" scope="col" className={styles.headCell()}>
                                    {t.duration}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, index) => (
                                <tr
                                    key={row.task.id}
                                    role="row"
                                    data-task-id={row.task.id}
                                    aria-level={row.level}
                                    aria-posinset={row.posinset}
                                    aria-setsize={row.setsize}
                                    aria-expanded={row.hasChildren ? row.expanded : undefined}
                                    aria-keyshortcuts={row.hasChildren || !editable ? undefined : KEYS}
                                    tabIndex={row.task.id === activeId ? 0 : -1}
                                    className={styles.row()}
                                    onFocus={() => setActive(row.task.id)}
                                    onKeyDown={(key) => onRowKey(index, key)}
                                >
                                    <td
                                        role="gridcell"
                                        className={styles.nameCell()}
                                        style={{ paddingInlineStart: `${(row.level - 1) * 1.25 + 0.5}rem` }}
                                    >
                                        <span className={styles.name()}>
                                            {row.hasChildren ? (
                                                <span
                                                    className={styles.toggle()}
                                                    data-expanded={row.expanded || undefined}
                                                    aria-hidden="true"
                                                    onClick={() => toggle(row.task.id)}
                                                >
                                                    <ChevronRight />
                                                </span>
                                            ) : (
                                                <span className={styles.toggleSpace()} />
                                            )}
                                            <span className={styles.nameText()}>{row.task.name}</span>
                                            <span className={styles.srOnly()}>{details(row)}</span>
                                        </span>
                                    </td>
                                    <td role="gridcell" className={styles.cell()}>
                                        {format(row.start)}
                                    </td>
                                    <td role="gridcell" className={styles.cell()}>
                                        {format(row.end)}
                                    </td>
                                    <td role="gridcell" className={styles.cell()}>
                                        {durationText(row)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className={styles.chart()} style={{ width: `${chartWidth}px` }} aria-hidden="true">
                        <div className={styles.header()}>
                            <div className={styles.headerRow()}>
                                {scale.top.map((unit) => (
                                    <span key={unit.start} className={styles.unit()} style={unitStyle(unit)}>
                                        {unit.label}
                                    </span>
                                ))}
                            </div>
                            <div className={styles.headerRow()}>
                                {scale.bottom.map((unit) => (
                                    <span key={unit.start} className={styles.unit()} style={unitStyle(unit)}>
                                        {unit.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div ref={lanes} className={styles.lanes()} style={{ height: `${rows.length * ROW}px` }}>
                            {scale.bottom.map((unit) => (
                                <span
                                    key={unit.start}
                                    className={styles.gridLine()}
                                    style={{
                                        insetInlineStart: `${daysBetween(scale.start, unit.start) * scale.dayWidth}px`,
                                    }}
                                />
                            ))}
                            {rows.map((row) => (
                                <div key={row.task.id} className={styles.lane()}>
                                    {row.hasChildren ? (
                                        <span
                                            className={styles.summary()}
                                            data-critical={critical.has(row.task.id) || undefined}
                                            style={{
                                                insetInlineStart: `${bar(row).x}px`,
                                                width: `${bar(row).width}px`,
                                            }}
                                        />
                                    ) : row.task.milestone ? (
                                        <span
                                            data-gantt-bar=""
                                            data-task-id={row.task.id}
                                            data-editable={editable || undefined}
                                            data-critical={critical.has(row.task.id) || undefined}
                                            className={gantt({ tone: row.task.tone }).milestone()}
                                            style={{ insetInlineStart: `${bar(row).x + scale.dayWidth / 2}px` }}
                                            onPointerDown={(pointer) => onBarDown(row, 'move', pointer)}
                                            onClick={() => onBarClick(row.task)}
                                        />
                                    ) : (
                                        <span
                                            data-gantt-bar=""
                                            data-task-id={row.task.id}
                                            data-editable={editable || undefined}
                                            data-dragging={drag?.id === row.task.id || undefined}
                                            data-critical={critical.has(row.task.id) || undefined}
                                            className={gantt({ tone: row.task.tone }).bar()}
                                            style={{
                                                insetInlineStart: `${bar(row).x}px`,
                                                width: `${bar(row).width}px`,
                                            }}
                                            onPointerDown={(pointer) => onBarDown(row, 'move', pointer)}
                                            onClick={() => onBarClick(row.task)}
                                        >
                                            <span
                                                className={gantt({ tone: row.task.tone }).barProgress()}
                                                style={{ width: `${progressOf(row)}%` }}
                                            />
                                            <span className={styles.barLabel()}>{row.task.name}</span>
                                            {editable && (
                                                <>
                                                    <span
                                                        className={styles.resizeStart()}
                                                        onPointerDown={(pointer) => onBarDown(row, 'start', pointer)}
                                                    />
                                                    <span
                                                        className={styles.resizeEnd()}
                                                        onPointerDown={(pointer) => onBarDown(row, 'end', pointer)}
                                                    />
                                                    <span
                                                        className={styles.progressHandle()}
                                                        style={{ insetInlineStart: `${progressOf(row)}%` }}
                                                        onPointerDown={(pointer) => onBarDown(row, 'progress', pointer)}
                                                    />
                                                </>
                                            )}
                                            {linkable && (
                                                <span
                                                    className={styles.linkHandle()}
                                                    onPointerDown={(pointer) => onBarDown(row, 'link', pointer)}
                                                />
                                            )}
                                        </span>
                                    )}
                                    {row.task.milestone && !row.hasChildren && (
                                        <span
                                            className={styles.milestoneLabel()}
                                            style={{ insetInlineStart: `${bar(row).x + scale.dayWidth / 2}px` }}
                                        >
                                            {row.task.name}
                                        </span>
                                    )}
                                </div>
                            ))}
                            <svg className={styles.links()} width={chartWidth} height={rows.length * ROW}>
                                {links.map((link) => (
                                    <g key={link.key}>
                                        <path
                                            className={styles.link()}
                                            d={link.line}
                                            data-critical={link.critical || undefined}
                                        />
                                        <path
                                            className={styles.linkHead()}
                                            d={link.head}
                                            data-critical={link.critical || undefined}
                                        />
                                    </g>
                                ))}
                                {draftLine && <path className={styles.linkDraft()} d={draftLine} />}
                            </svg>
                            {todayLeft >= 0 && (
                                <span className={styles.today()} style={{ insetInlineStart: `${todayLeft}px` }} />
                            )}
                        </div>
                    </div>
                </div>
                {rows.length === 0 && (
                    <p className={styles.empty()}>{loading ? translations.common.loading : t.empty}</p>
                )}
            </div>
            <p role="status" className={styles.status()}>
                {status}
            </p>
            {linkable && (
                <Dialog open={!!linking} onOpenChange={(open) => !open && setLinking(null)}>
                    <DialogContent
                        title={linking ? t.dependencyTitle(linking.name) : t.addDependency}
                        size="sm"
                        footer={
                            <>
                                <Button variant="outline" size="sm" onClick={() => setLinking(null)}>
                                    {translations.common.cancel}
                                </Button>
                                <Button size="sm" disabled={!predecessor} onClick={confirmLinking}>
                                    {t.addDependencyConfirm}
                                </Button>
                            </>
                        }
                    >
                        {predecessors.length ? (
                            <Field label={t.predecessor}>
                                <NativeSelect
                                    items={predecessors.map((task) => ({ value: task.id, label: task.name }))}
                                    value={predecessor}
                                    onValueChange={setPredecessor}
                                />
                            </Field>
                        ) : (
                            <p>{t.noPredecessor}</p>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
