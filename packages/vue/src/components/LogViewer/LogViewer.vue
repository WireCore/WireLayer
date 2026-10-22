<script setup lang="ts">
import { ArrowDown, Bug, CircleX, Info, Search, TriangleAlert } from '@lucide/vue';
import {
    detectLogLevel,
    filterLogLines,
    isAtBottom,
    logViewer as logViewerRecipe,
    logWindow,
    toLogLines,
    type DataSource,
    type LogLevel,
    type LogLine,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import {
    computed,
    nextTick,
    normalizeClass,
    onBeforeUnmount,
    onMounted,
    ref,
    useAttrs,
    useTemplateRef,
    watch,
} from 'vue';
import Button from '../Button/Button.vue';
import Highlight from '../Highlight/Highlight.vue';
import Input from '../Input/Input.vue';
import ToggleButton from '../ToggleButton/ToggleButton.vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { useDataSource } from '../../utils/data-source.js';

export interface LogViewerProps {
    /** The lines, oldest first – strings or { text, level, time, id } (with `dataSource`: the newest, after the loaded) */
    lines?: (LogLine | string)[];
    /**
     * Older lines from a server, page by page going back in time – each page newest first (page or cursor). The first
     * page is loaded at the start, "Load older entries" loads the next; `lines` (e.g. live lines) follow them
     */
    dataSource?: DataSource<LogLine | string>;
    /** Lines per page of the data source (default 200) */
    pageSize?: number;
    /** Accessible name of the scroll area (default "Log") */
    label?: string;
    /** Search field: filters the lines and marks the hits (default true) */
    search?: boolean;
    /** Buttons to show and hide the levels (default true) */
    levelFilter?: boolean;
    /** Levels shown – use with v-model:levels (default all) */
    levels?: LogLevel[];
    /** Reads the level from the text when a line has none ("ERROR", "[warn]" …, default true) */
    detectLevels?: boolean;
    /** Keeps the newest line in view; scrolling up pauses it – use with v-model:autoScroll (default true) */
    autoScroll?: boolean;
    /** Line numbers (default true) */
    lineNumbers?: boolean;
    /** Older lines can be loaded: a button at the top emits loadMore */
    hasMore?: boolean;
    /** Older lines are loading */
    loading?: boolean;
    /** Height of a line in px – must match the styles (default 20) */
    rowHeight?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof logViewerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<LogViewerProps>(), {
    lines: () => [],
    dataSource: undefined,
    pageSize: 200,
    search: true,
    levelFilter: true,
    levels: undefined,
    detectLevels: true,
    autoScroll: true,
    lineNumbers: true,
    rowHeight: 20,
});
const emit = defineEmits<{
    'update:levels': [levels: LogLevel[]];
    'update:autoScroll': [autoScroll: boolean];
    /** Load older lines (they are added at the top, the view stays where it is) */
    loadMore: [];
}>();
const logViewer = useRecipe('logViewer', logViewerRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.logViewer);
const styles = logViewer();
const viewport = useTemplateRef<HTMLElement>('viewport');
const icons = { debug: Bug, info: Info, warn: TriangleAlert, error: CircleX };
const order: LogLevel[] = ['error', 'warn', 'info', 'debug'];

// Older lines from a data source (newest first, shown oldest first) before the given lines
const source = useDataSource<LogLine | string>({ source: () => props.dataSource, pageSize: () => props.pageSize });
onMounted(() => props.dataSource && source.open());
watch(
    () => props.dataSource,
    (dataSource) => dataSource && source.open()
);
const older = computed(() => (source.active.value ? source.state.value.items : []));
const more = computed(() => (source.active.value ? source.state.value.hasMore : props.hasMore));
const busy = computed(() => props.loading || (source.active.value && source.state.value.status === 'loading'));
function loadOlder() {
    if (source.active.value) source.loadMore();
    else emit('loadMore');
}
const all = computed(() =>
    toLogLines(older.value.length ? [...older.value].reverse().concat(props.lines) : props.lines).map((line) =>
        line.level || !props.detectLevels ? line : { ...line, level: detectLogLevel(line.text) }
    )
);
const present = computed(() => order.filter((level) => all.value.some((line) => line.level === level)));
const internalLevels = ref<LogLevel[]>(order);
const shownLevels = computed(() => props.levels ?? internalLevels.value);
const query = ref('');
const filtered = computed(() => filterLogLines(all.value, { query: query.value, levels: shownLevels.value }));
const scrollTop = ref(0);
const height = ref(0);
const view = computed(() => logWindow(scrollTop.value, height.value, props.rowHeight, filtered.value.length));
const rows = computed(() =>
    filtered.value.slice(view.value.start, view.value.end).map((index, offset) => ({
        index,
        position: view.value.start + offset,
        line: all.value[index]!,
    }))
);
const internalAuto = ref(props.autoScroll);
const following = computed(() => internalAuto.value);
const atBottom = ref(true);
const timeFormat = computed(() => new Intl.DateTimeFormat(locale.value.locale, { timeStyle: 'medium' }));
const timeText = (time: LogLine['time']) => {
    if (time === undefined) return '';
    const date = time instanceof Date ? time : new Date(time);
    return Number.isNaN(date.getTime()) ? String(time) : timeFormat.value.format(date);
};
watch(
    () => props.autoScroll,
    (value) => (internalAuto.value = value)
);

function toggleLevel(level: LogLevel, on: boolean) {
    const next = on ? [...shownLevels.value, level] : shownLevels.value.filter((entry) => entry !== level);
    internalLevels.value = next;
    emit('update:levels', next);
}
function setFollowing(value: boolean) {
    internalAuto.value = value;
    emit('update:autoScroll', value);
    if (value) scrollToEnd();
}
function scrollToEnd() {
    void nextTick(() => {
        const element = viewport.value;
        if (element) element.scrollTop = element.scrollHeight;
    });
}
let lastTop = 0;
function onScroll() {
    const element = viewport.value;
    if (!element) return;
    scrollTop.value = element.scrollTop;
    atBottom.value = isAtBottom(element);
    // Scrolling up pauses following; back at the end it follows again
    if (element.scrollTop < lastTop && !atBottom.value && internalAuto.value) setFollowing(false);
    lastTop = element.scrollTop;
}
// New lines: follow them; lines added at the top (older ones): keep the view where it is
let olderCount = 0;
watch(all, (next, previous) => {
    const first = previous?.[0];
    // Pages of the data source come in at the top; otherwise the old first line tells the shift
    const added = older.value.length - olderCount;
    olderCount = older.value.length;
    const shift = added > 0 ? added : first ? next.indexOf(first) : -1;
    if (shift > 0 && viewport.value) {
        const element = viewport.value;
        void nextTick(() => (element.scrollTop += shift * props.rowHeight));
        return;
    }
    if (following.value) scrollToEnd();
});
let observer: ResizeObserver | undefined;
onMounted(() => {
    const element = viewport.value;
    if (!element) return;
    height.value = element.clientHeight;
    observer = new ResizeObserver(() => (height.value = element.clientHeight));
    observer.observe(element);
    if (following.value) scrollToEnd();
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
    <!--
        Log: a scrollable, focusable area (arrow keys scroll) with numbered lines; level as icon and text; search
        filters and marks; new lines stay in view until you scroll up. Only the visible lines are rendered.
    -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <div :class="styles.toolbar()">
            <Input
                v-if="search"
                v-model="query"
                type="search"
                size="sm"
                :leading-icon="Search"
                clearable
                :placeholder="t.search"
                :aria-label="t.search"
                :class="styles.search()"
            />
            <div v-if="levelFilter && present.length" role="group" :aria-label="t.levelFilter" :class="styles.levels()">
                <ToggleButton
                    v-for="level in present"
                    :key="level"
                    size="sm"
                    :icon="icons[level]"
                    :pressed="shownLevels.includes(level)"
                    @update:pressed="toggleLevel(level, $event)"
                >
                    {{ t.levels[level] }}
                </ToggleButton>
            </div>
            <ToggleButton size="sm" :icon="ArrowDown" :pressed="following" @update:pressed="setFollowing">
                {{ t.autoScroll }}
            </ToggleButton>
        </div>
        <div :class="styles.body()">
            <div
                ref="viewport"
                :class="styles.viewport()"
                tabindex="0"
                role="region"
                :aria-label="label ?? t.label"
                @scroll="onScroll"
            >
                <div v-if="more" :class="styles.more()">
                    <Button variant="outline" size="sm" :loading="busy" @click="loadOlder">
                        {{ t.loadMore }}
                    </Button>
                </div>
                <ol
                    v-if="filtered.length"
                    :class="styles.list()"
                    :style="{ paddingTop: `${view.before}px`, paddingBottom: `${view.after}px` }"
                >
                    <li
                        v-for="row in rows"
                        :key="row.line.id === undefined ? `#${row.index}` : `id:${row.line.id}`"
                        :class="logViewer({ level: row.line.level ?? 'none' }).line()"
                        :aria-setsize="filtered.length"
                        :aria-posinset="row.position + 1"
                    >
                        <span v-if="lineNumbers" :class="styles.number()" aria-hidden="true">{{ row.index + 1 }}</span>
                        <span v-if="row.line.level" :class="logViewer({ level: row.line.level }).level()">
                            <component :is="icons[row.line.level]" :class="styles.levelIcon()" aria-hidden="true" />
                            {{ t.levels[row.line.level] }}
                        </span>
                        <span v-if="row.line.time !== undefined" :class="styles.time()">{{
                            timeText(row.line.time)
                        }}</span>
                        <span :class="styles.text()">
                            <Highlight
                                v-if="query.trim()"
                                :text="row.line.text"
                                :query="query.trim().split(/\s+/)"
                                ignore-accents
                            />
                            <template v-else>{{ row.line.text }}</template>
                        </span>
                    </li>
                </ol>
                <p v-else :class="styles.empty()">{{ t.empty }}</p>
            </div>
            <Button
                v-if="!atBottom && filtered.length"
                variant="secondary"
                size="sm"
                :leading-icon="ArrowDown"
                :class="styles.jump()"
                @click="setFollowing(true)"
            >
                {{ t.jumpToEnd }}
            </Button>
        </div>
        <div :class="styles.footer()">
            <span>{{ t.lines(filtered.length, all.length) }}</span>
            <span v-if="!following">{{ t.paused }}</span>
        </div>
        <span role="status" :class="styles.status()">{{
            query.trim() ? t.lines(filtered.length, all.length) : ''
        }}</span>
    </div>
</template>
