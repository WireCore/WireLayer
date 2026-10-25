<script setup lang="ts">
import { ChevronRight } from '@lucide/vue';
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
    type GanttTask,
    type GanttZoom,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, onBeforeUnmount, onMounted, ref, useAttrs, useTemplateRef } from 'vue';
import Button from '../Button/Button.vue';
import Dialog from '../Dialog/Dialog.vue';
import DialogContent from '../Dialog/DialogContent.vue';
import Field from '../Field/Field.vue';
import NativeSelect from '../NativeSelect/NativeSelect.vue';
import SegmentedControl from '../SegmentedControl/SegmentedControl.vue';
import SegmentedControlItem from '../SegmentedControl/SegmentedControlItem.vue';
import { useRecipe } from '../../recipes.js';
import { useLocale, useTranslations } from '../../locale.js';

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

export interface GanttProps {
    tasks: readonly GanttTask[];
    /** Unit of the time axis – use with v-model:zoom */
    zoom?: GanttZoom;
    defaultZoom?: GanttZoom;
    /** Zoom levels offered in the toolbar */
    zooms?: readonly GanttZoom[];
    /** Ids of the expanded groups – use with v-model:expanded (default: all expanded) */
    expanded?: string[];
    defaultExpanded?: string[];
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
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof ganttRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<GanttProps>(), {
    zoom: undefined,
    defaultZoom: 'week',
    zooms: () => ['day', 'week', 'month', 'quarter'],
    expanded: undefined,
    defaultExpanded: undefined,
    today: undefined,
    headingLevel: 2,
    height: '480px',
});
const emit = defineEmits<{
    'update:zoom': [zoom: GanttZoom];
    'update:expanded': [ids: string[]];
    /** A task was chosen (Enter in the list, click on its bar) */
    taskClick: [task: GanttTask];
    /** A task was moved or resized – apply start and end to your data */
    taskChange: [change: GanttChange];
    /** The progress of a task was changed */
    progressChange: [change: GanttProgress];
    /** A dependency was drawn (linkable) – add `from.id` to the dependencies of `to` */
    dependencyCreate: [link: GanttLink];
}>();
const gantt = useRecipe('gantt', ganttRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => gantt());
const localeContext = useLocale();
const translations = useTranslations();
const t = translations.gantt;
const locale = computed(() => props.locale ?? localeContext.value.locale);
const rtl = computed(() => localeContext.value.dir === 'rtl');
const ROW = 40;

const internalZoom = ref(props.defaultZoom);
const zoom = computed(() => props.zoom ?? internalZoom.value);
function setZoom(next: GanttZoom) {
    internalZoom.value = next;
    emit('update:zoom', next);
}
const internalExpanded = ref(props.defaultExpanded ?? ganttGroupIds(props.tasks));
const expanded = computed(() => props.expanded ?? internalExpanded.value);
function toggle(id: string, open = !expanded.value.includes(id)) {
    const next = open ? [...new Set([...expanded.value, id])] : expanded.value.filter((item) => item !== id);
    internalExpanded.value = next;
    emit('update:expanded', next);
}

// Dragging: the dates (or progress) of one task change while the pointer moves
interface Drag {
    id: string;
    mode: 'move' | 'start' | 'end' | 'progress' | 'link';
    days: number;
    progress: number;
    x: number;
    y: number;
}
const drag = ref<Drag | null>(null);
const byId = computed(() => new Map(props.tasks.map((task) => [task.id, task])));
const previewOf = (task: GanttTask) => {
    const current = drag.value;
    if (!current || current.id !== task.id || !current.days) return task;
    if (current.mode === 'move') return { ...task, ...shiftTask(task, current.days) };
    if (current.mode === 'end') return { ...task, ...shiftTask(task, current.days, true) };
    if (current.mode === 'start') {
        const start = addIsoDays(task.start, current.days);
        return { ...task, start: start > task.end ? task.end : start };
    }
    return task;
};
const shownTasks = computed(() => props.tasks.map(previewOf));
const rows = computed(() => ganttRows(shownTasks.value, expanded.value));
const scale = computed(() => ganttScale(props.tasks, zoom.value, locale.value, translations));
const critical = computed(() => (props.showCriticalPath ? criticalPath(props.tasks) : new Set<string>()));
const bar = (row: (typeof rows.value)[number]) => ganttBar({ ...row, milestone: row.task.milestone }, scale.value);
const chartWidth = computed(() => scale.value.days * scale.value.dayWidth);
const links = computed(() => {
    const index = new Map(rows.value.map((row, position) => [row.task.id, position]));
    return rows.value.flatMap((row, position) =>
        (row.task.dependencies ?? [])
            .filter((id) => index.has(id))
            .map((id) => {
                const from = rows.value[index.get(id)!]!;
                const box = bar(from);
                const to = bar(row);
                const half = scale.value.dayWidth / 2;
                const path = dependencyPath(
                    {
                        x: from.task.milestone ? box.x + half : box.x,
                        width: from.task.milestone ? 0 : box.width,
                        row: index.get(id)!,
                    },
                    { x: row.task.milestone ? to.x + half - 8 : to.x, row: position },
                    ROW
                );
                return {
                    key: `${id}-${row.task.id}`,
                    ...path,
                    critical: critical.value.has(id) && critical.value.has(row.task.id),
                };
            })
    );
});

// Today: from the prop, else only in the browser (server and client render alike)
const mounted = ref(false);
onMounted(() => (mounted.value = true));
const today = computed(() => props.today ?? (mounted.value ? todayIso() : null));
const todayLeft = computed(() => {
    if (!today.value) return -1;
    const offset = daysBetween(scale.value.start, today.value);
    return offset >= 0 && offset < scale.value.days ? (offset + 0.5) * scale.value.dayWidth : -1;
});
const scroll = useTemplateRef<HTMLElement>('scroll');
const table = useTemplateRef<HTMLElement>('table');
function scrollToToday() {
    const day = today.value ?? todayIso();
    const offset = daysBetween(scale.value.start, day) * scale.value.dayWidth;
    const left = Math.max(0, offset - (scroll.value?.clientWidth ?? 0) / 3);
    scroll.value?.scrollTo({ left: rtl.value ? -left : left, behavior: 'smooth' });
}

// Texts
const format = (iso: string) =>
    new Intl.DateTimeFormat(locale.value, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${iso}T00:00Z`));
const durationText = (row: { start: string; end: string; task: GanttTask }) =>
    row.task.milestone ? t.milestone : pluralText(t.days, taskDuration({ ...row, milestone: false }), locale.value);
const details = (row: (typeof rows.value)[number]) => {
    const parts: string[] = [];
    if (row.task.milestone) parts.push(t.milestone);
    else parts.push(t.progress(row.progress));
    const names = (row.task.dependencies ?? []).map((id) => byId.value.get(id)?.name).filter(Boolean) as string[];
    if (names.length) parts.push(t.dependsOn(new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(names)));
    if (critical.value.has(row.task.id)) parts.push(t.critical);
    return `, ${parts.join(', ')}`;
};
const status = ref('');
function announce(task: GanttTask, start: string, end: string) {
    const duration = task.milestone ? t.milestone : pluralText(t.days, taskDuration({ start, end }), locale.value);
    status.value = t.changed(task.name, `${format(start)} – ${format(end)}, ${duration}`);
}
function change(task: GanttTask, next: { start: string; end: string }) {
    if (next.start === task.start && next.end === task.end) return;
    announce(task, next.start, next.end);
    emit('taskChange', { task, ...next });
}
function changeProgress(task: GanttTask, progress: number) {
    const value = Math.max(0, Math.min(100, Math.round(progress)));
    if (value === (task.progress ?? 0)) return;
    status.value = t.progressChanged(task.name, value);
    emit('progressChange', { task, progress: value });
}

// Task list (treegrid): one row in the tab order; arrows move, Left/Right collapse and expand, Enter chooses,
// Alt+Left/Right moves the task by a day, Alt+Shift+Left/Right changes its length, Alt+Up/Down its progress
const active = ref<string | null>(null);
const activeId = computed(() =>
    rows.value.some((row) => row.task.id === active.value) ? active.value : (rows.value[0]?.task.id ?? null)
);
// A dependency by keyboard (linkable): the toolbar action asks for a predecessor of the active task
const linking = ref<GanttTask | null>(null);
const predecessor = ref('');
const predecessors = computed(() => (linking.value ? ganttPredecessors(props.tasks, linking.value.id) : []));
function openLinking() {
    const task = activeId.value ? byId.value.get(activeId.value) : undefined;
    if (!task) return;
    predecessor.value = ganttPredecessors(props.tasks, task.id)[0]?.id ?? '';
    linking.value = task;
}
function confirmLinking() {
    const from = byId.value.get(predecessor.value);
    const to = linking.value;
    linking.value = null;
    if (!from || !to) return;
    status.value = t.linked(from.name, to.name);
    emit('dependencyCreate', { from, to });
}
async function focusRow(id: string) {
    active.value = id;
    await nextTick();
    table.value?.querySelector<HTMLElement>(`[data-task-id="${CSS.escape(id)}"]`)?.focus();
}
const isGroup = (row: (typeof rows.value)[number]) => row.hasChildren;
const keyShortcuts = computed(() =>
    props.editable
        ? 'Alt+ArrowLeft Alt+ArrowRight Alt+Shift+ArrowLeft Alt+Shift+ArrowRight Alt+ArrowUp Alt+ArrowDown'
        : undefined
);
function onRowKey(index: number, key: KeyboardEvent) {
    const row = rows.value[index]!;
    const task = byId.value.get(row.task.id)!;
    const direction = rtl.value ? -1 : 1;
    if (key.altKey) {
        if (!props.editable || isGroup(row)) return;
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
        const next = rows.value[Math.max(0, Math.min(rows.value.length - 1, position))];
        if (next) void focusRow(next.task.id);
    };
    const forward = rtl.value ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl.value ? 'ArrowRight' : 'ArrowLeft';
    if (key.key === 'ArrowDown') target(index + 1);
    else if (key.key === 'ArrowUp') target(index - 1);
    else if (key.key === 'Home') target(0);
    else if (key.key === 'End') target(rows.value.length - 1);
    else if (key.key === forward && isGroup(row)) {
        if (row.expanded) target(index + 1);
        else toggle(row.task.id, true);
    } else if (key.key === back) {
        if (isGroup(row) && row.expanded) toggle(row.task.id, false);
        else if (row.task.parentId) void focusRow(row.task.parentId);
        else return;
    } else if (key.key === 'Enter' || key.key === ' ') emit('taskClick', task);
    else return;
    key.preventDefault();
}

// Dragging the bars: move, resize at either end, progress, and (linkable) a dependency onto another bar
const lanes = useTemplateRef<HTMLElement>('lanes');
let dragOrigin = { x: 0, left: 0, top: 0, width: 1, moved: false };
let suppressClick = false;
function onBarDown(row: (typeof rows.value)[number], mode: Drag['mode'], pointer: PointerEvent) {
    if (pointer.button !== 0 || isGroup(row)) return;
    if (mode === 'link' ? !props.linkable : !props.editable) return;
    pointer.stopPropagation();
    const box = lanes.value!.getBoundingClientRect();
    dragOrigin = { x: pointer.clientX, left: box.left, top: box.top, width: bar(row).width, moved: false };
    drag.value = {
        id: row.task.id,
        mode,
        days: 0,
        progress: row.progress,
        x: pointer.clientX - box.left,
        y: pointer.clientY - box.top,
    };
    window.addEventListener('pointermove', onBarMove);
    window.addEventListener('pointerup', onBarUp, { once: true });
}
function onBarMove(pointer: PointerEvent) {
    const current = drag.value;
    if (!current) return;
    const dx = (pointer.clientX - dragOrigin.x) * (rtl.value ? -1 : 1);
    dragOrigin.moved ||= Math.abs(dx) > 3;
    const task = byId.value.get(current.id)!;
    if (current.mode === 'progress')
        drag.value = {
            ...current,
            progress: Math.max(
                0,
                Math.min(100, Math.round(((task.progress ?? 0) / 100 + dx / dragOrigin.width) * 20) * 5)
            ),
        };
    else if (current.mode === 'link')
        drag.value = { ...current, x: pointer.clientX - dragOrigin.left, y: pointer.clientY - dragOrigin.top };
    else drag.value = { ...current, days: Math.round(dx / scale.value.dayWidth) };
}
function onBarUp(pointer: PointerEvent) {
    window.removeEventListener('pointermove', onBarMove);
    const done = drag.value;
    drag.value = null;
    suppressClick = dragOrigin.moved;
    if (!done) return;
    const task = byId.value.get(done.id)!;
    if (done.mode === 'progress') return changeProgress(task, done.progress);
    if (done.mode === 'link') {
        const target = document
            .elementFromPoint(pointer.clientX, pointer.clientY)
            ?.closest<HTMLElement>('[data-gantt-bar]')?.dataset.taskId;
        const to = target ? byId.value.get(target) : undefined;
        if (!to || dependencyCycle(props.tasks, task.id, to.id)) return;
        status.value = t.linked(task.name, to.name);
        emit('dependencyCreate', { from: task, to });
        return;
    }
    const preview = previewOf(task);
    change(task, { start: preview.start, end: preview.end });
}
onBeforeUnmount(() => window.removeEventListener('pointermove', onBarMove));
function onBarClick(task: GanttTask) {
    if (suppressClick) {
        suppressClick = false;
        return;
    }
    emit('taskClick', byId.value.get(task.id)!);
}
const progressOf = (row: (typeof rows.value)[number]) =>
    drag.value?.id === row.task.id && drag.value.mode === 'progress' ? drag.value.progress : row.progress;
const draftLine = computed(() => {
    const current = drag.value;
    if (current?.mode !== 'link') return '';
    const position = rows.value.findIndex((row) => row.task.id === current.id);
    const box = bar(rows.value[position]!);
    const x = rtl.value ? chartWidth.value - current.x : current.x;
    return `M ${box.x + box.width} ${position * ROW + ROW / 2} L ${x} ${current.y}`;
});
</script>

<template>
    <!-- Gantt chart: task list as treegrid (keyboard, texts of dates and dependencies), the chart beside it -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="region"
        :aria-label="label ?? title ?? t.label"
        :aria-busy="loading || undefined"
    >
        <div :class="styles.toolbar()">
            <component :is="`h${headingLevel}`" v-if="title" :class="styles.heading()">{{ title }}</component>
            <Button variant="outline" size="sm" @click="scrollToToday">{{ t.today }}</Button>
            <Button v-if="linkable" variant="outline" size="sm" :disabled="!activeId" @click="openLinking">{{
                t.addDependency
            }}</Button>
            <SegmentedControl
                v-if="zooms.length > 1"
                :label="t.zoom"
                size="sm"
                :model-value="zoom"
                @update:model-value="$event && setZoom($event as GanttZoom)"
            >
                <SegmentedControlItem v-for="option in zooms" :key="option" :value="option">{{
                    t.zooms[option]
                }}</SegmentedControlItem>
            </SegmentedControl>
        </div>
        <div ref="scroll" :class="styles.scroll()" :style="{ maxHeight: height }">
            <div :class="styles.layout()">
                <table ref="table" role="treegrid" :aria-label="label ?? title ?? t.label" :class="styles.table()">
                    <thead>
                        <tr role="row">
                            <th role="columnheader" scope="col" :class="styles.headCell()">{{ t.task }}</th>
                            <th role="columnheader" scope="col" :class="styles.headCell()">{{ t.start }}</th>
                            <th role="columnheader" scope="col" :class="styles.headCell()">{{ t.end }}</th>
                            <th role="columnheader" scope="col" :class="styles.headCell()">{{ t.duration }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(row, index) in rows"
                            :key="row.task.id"
                            role="row"
                            :data-task-id="row.task.id"
                            :aria-level="row.level"
                            :aria-posinset="row.posinset"
                            :aria-setsize="row.setsize"
                            :aria-expanded="row.hasChildren ? row.expanded : undefined"
                            :aria-keyshortcuts="row.hasChildren ? undefined : keyShortcuts"
                            :tabindex="row.task.id === activeId ? 0 : -1"
                            :class="styles.row()"
                            @focus="active = row.task.id"
                            @keydown="onRowKey(index, $event)"
                        >
                            <td
                                role="gridcell"
                                :class="styles.nameCell()"
                                :style="{ paddingInlineStart: `${(row.level - 1) * 1.25 + 0.5}rem` }"
                            >
                                <span :class="styles.name()">
                                    <span
                                        v-if="row.hasChildren"
                                        :class="styles.toggle()"
                                        :data-expanded="row.expanded || undefined"
                                        aria-hidden="true"
                                        @click="toggle(row.task.id)"
                                        ><ChevronRight
                                    /></span>
                                    <span v-else :class="styles.toggleSpace()" />
                                    <span :class="styles.nameText()">{{ row.task.name }}</span>
                                    <span :class="styles.srOnly()">{{ details(row) }}</span>
                                </span>
                            </td>
                            <td role="gridcell" :class="styles.cell()">{{ format(row.start) }}</td>
                            <td role="gridcell" :class="styles.cell()">{{ format(row.end) }}</td>
                            <td role="gridcell" :class="styles.cell()">{{ durationText(row) }}</td>
                        </tr>
                    </tbody>
                </table>
                <div :class="styles.chart()" :style="{ width: `${chartWidth}px` }" aria-hidden="true">
                    <div :class="styles.header()">
                        <div :class="styles.headerRow()">
                            <span
                                v-for="unit in scale.top"
                                :key="unit.start"
                                :class="styles.unit()"
                                :style="{
                                    insetInlineStart: `${daysBetween(scale.start, unit.start) * scale.dayWidth}px`,
                                    width: `${unit.days * scale.dayWidth}px`,
                                }"
                                >{{ unit.label }}</span
                            >
                        </div>
                        <div :class="styles.headerRow()">
                            <span
                                v-for="unit in scale.bottom"
                                :key="unit.start"
                                :class="styles.unit()"
                                :style="{
                                    insetInlineStart: `${daysBetween(scale.start, unit.start) * scale.dayWidth}px`,
                                    width: `${unit.days * scale.dayWidth}px`,
                                }"
                                >{{ unit.label }}</span
                            >
                        </div>
                    </div>
                    <div ref="lanes" :class="styles.lanes()" :style="{ height: `${rows.length * ROW}px` }">
                        <span
                            v-for="unit in scale.bottom"
                            :key="unit.start"
                            :class="styles.gridLine()"
                            :style="{ insetInlineStart: `${daysBetween(scale.start, unit.start) * scale.dayWidth}px` }"
                        />
                        <div v-for="row in rows" :key="row.task.id" :class="styles.lane()">
                            <span
                                v-if="row.hasChildren"
                                :class="styles.summary()"
                                :data-critical="critical.has(row.task.id) || undefined"
                                :style="{ insetInlineStart: `${bar(row).x}px`, width: `${bar(row).width}px` }"
                            />
                            <span
                                v-else-if="row.task.milestone"
                                data-gantt-bar=""
                                :data-task-id="row.task.id"
                                :data-editable="editable || undefined"
                                :data-critical="critical.has(row.task.id) || undefined"
                                :class="gantt({ tone: row.task.tone }).milestone()"
                                :style="{ insetInlineStart: `${bar(row).x + scale.dayWidth / 2}px` }"
                                @pointerdown="onBarDown(row, 'move', $event)"
                                @click="onBarClick(row.task)"
                            />
                            <span
                                v-else
                                data-gantt-bar=""
                                :data-task-id="row.task.id"
                                :data-editable="editable || undefined"
                                :data-dragging="drag?.id === row.task.id || undefined"
                                :data-critical="critical.has(row.task.id) || undefined"
                                :class="gantt({ tone: row.task.tone }).bar()"
                                :style="{ insetInlineStart: `${bar(row).x}px`, width: `${bar(row).width}px` }"
                                @pointerdown="onBarDown(row, 'move', $event)"
                                @click="onBarClick(row.task)"
                            >
                                <span
                                    :class="gantt({ tone: row.task.tone }).barProgress()"
                                    :style="{ width: `${progressOf(row)}%` }"
                                />
                                <span :class="styles.barLabel()">{{ row.task.name }}</span>
                                <template v-if="editable">
                                    <span
                                        :class="styles.resizeStart()"
                                        @pointerdown="onBarDown(row, 'start', $event)"
                                    />
                                    <span :class="styles.resizeEnd()" @pointerdown="onBarDown(row, 'end', $event)" />
                                    <span
                                        :class="styles.progressHandle()"
                                        :style="{ insetInlineStart: `${progressOf(row)}%` }"
                                        @pointerdown="onBarDown(row, 'progress', $event)"
                                    />
                                </template>
                                <span
                                    v-if="linkable"
                                    :class="styles.linkHandle()"
                                    @pointerdown="onBarDown(row, 'link', $event)"
                                />
                            </span>
                            <span
                                v-if="row.task.milestone && !row.hasChildren"
                                :class="styles.milestoneLabel()"
                                :style="{ insetInlineStart: `${bar(row).x + scale.dayWidth / 2}px` }"
                                >{{ row.task.name }}</span
                            >
                        </div>
                        <svg :class="styles.links()" :width="chartWidth" :height="rows.length * ROW">
                            <g v-for="link in links" :key="link.key">
                                <path
                                    :class="styles.link()"
                                    :d="link.line"
                                    :data-critical="link.critical || undefined"
                                />
                                <path
                                    :class="styles.linkHead()"
                                    :d="link.head"
                                    :data-critical="link.critical || undefined"
                                />
                            </g>
                            <path v-if="draftLine" :class="styles.linkDraft()" :d="draftLine" />
                        </svg>
                        <span
                            v-if="todayLeft >= 0"
                            :class="styles.today()"
                            :style="{ insetInlineStart: `${todayLeft}px` }"
                        />
                    </div>
                </div>
            </div>
            <p v-if="rows.length === 0" :class="styles.empty()">
                {{ loading ? translations.common.loading : t.empty }}
            </p>
        </div>
        <p role="status" :class="styles.status()">{{ status }}</p>
        <Dialog v-if="linkable" :open="!!linking" @update:open="!$event && (linking = null)">
            <DialogContent :title="linking ? t.dependencyTitle(linking.name) : t.addDependency" size="sm">
                <Field v-if="predecessors.length" :label="t.predecessor">
                    <NativeSelect
                        v-model="predecessor"
                        :items="predecessors.map((task) => ({ value: task.id, label: task.name }))"
                    />
                </Field>
                <p v-else>{{ t.noPredecessor }}</p>
                <template #footer>
                    <Button variant="outline" size="sm" @click="linking = null">{{
                        translations.common.cancel
                    }}</Button>
                    <Button size="sm" :disabled="!predecessor" @click="confirmLinking">{{
                        t.addDependencyConfirm
                    }}</Button>
                </template>
            </DialogContent>
        </Dialog>
    </div>
</template>
