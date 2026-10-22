<script setup lang="ts" generic="T">
import { LoaderCircle } from '@lucide/vue';
import { defaultRangeExtractor, useVirtualizer, type Range } from '@tanstack/vue-virtual';
import {
    virtualListBox as virtualListBoxRecipe,
    type DataQuery,
    type DataSource,
    type ItemAccessor,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onMounted, ref, useAttrs, watch } from 'vue';
import { useDataSource } from '../utils/data-source.js';
import { useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';

export interface VirtualListProps<T> {
    items?: T[];
    /** Accessible name of the list */
    label: string;
    /** Estimated row height in px (rows are measured when shown) */
    itemHeight?: number;
    /** Estimated height of one item, when the heights differ a lot (rows are measured when shown) */
    estimateSize?: (item: T, index: number) => number;
    /** Height of the scroll area (CSS length) */
    height?: string;
    /** Group heading of an item (property name or function); the heading of the group in view sticks to the top */
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    /** More items can be loaded: scrolling near the end emits loadMore */
    hasMore?: boolean;
    /** The next items are loading: a loading row at the end */
    loading?: boolean;
    /** @deprecated Same as `loading` (the name of the other lists) */
    loadingMore?: boolean;
    /** How many rows before the end loadMore is emitted (default 5) */
    endThreshold?: number;
    /** Loads the items page by page while scrolling (instead of `items`) */
    dataSource?: DataSource<T>;
    /** Sorting, filters and search for the data source; a change starts over */
    query?: Omit<DataQuery, 'page' | 'pageSize' | 'cursor'>;
    /** Items per request of the data source (default 50) */
    pageSize?: number;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VirtualListProps<T>>(), {
    items: () => [],
    itemHeight: 40,
    height: '20rem',
    hasMore: false,
    loadingMore: false,
    loading: false,
    endThreshold: 5,
});
const emit = defineEmits<{
    /** The end of the list scrolled near (hasMore) – load the next items */
    loadMore: [];
    /** @deprecated Same as `loadMore` (the name of the other lists) */
    endReached: [];
}>();
const virtualListBox = useRecipe('virtualListBox', virtualListBoxRecipe);
defineSlots<{ default(props: { item: T; index: number }): unknown }>();
const attrs = useAttrs();
const translations = useTranslations();
const styles = virtualListBox();
const scrollElement = ref<HTMLElement | null>(null);

// A data source fills the list page by page
const source = useDataSource<T>({
    source: () => props.dataSource,
    pageSize: () => props.pageSize,
    query: () => {
        if (!props.query) return undefined;
        const rest = { ...props.query };
        delete rest.search;
        return rest;
    },
});
onMounted(() => {
    if (props.dataSource) source.search(props.query?.search ?? '', false);
});
watch(
    () => props.query?.search,
    (search) => {
        if (props.dataSource) source.search(search ?? '');
    }
);
const list = computed(() => (props.dataSource ? source.state.value.items : props.items));
const more = computed(() => (props.dataSource ? source.state.value.hasMore : props.hasMore));
const busy = computed(() =>
    props.dataSource ? source.state.value.status === 'loading' : props.loading || props.loadingMore
);

// Rows: the items, with a heading row before each group (itemGroup)
type Row = { kind: 'item'; item: T; index: number } | { kind: 'header'; label: string };
const groupOf = (item: T) => {
    const accessor = props.itemGroup;
    const group =
        typeof accessor === 'function'
            ? accessor(item)
            : (item as Record<string, unknown> | null)?.[accessor as string];
    return group === null || group === undefined || group === '' ? undefined : String(group);
};
const rows = computed<Row[]>(() => {
    if (!props.itemGroup) return list.value.map((item, index) => ({ kind: 'item', item, index }));
    const result: Row[] = [];
    let last: string | undefined;
    list.value.forEach((item, index) => {
        const group = groupOf(item);
        if (group !== undefined && group !== last) result.push({ kind: 'header', label: group });
        last = group;
        result.push({ kind: 'item', item, index });
    });
    return result;
});
const headers = computed(() => rows.value.flatMap((row, index) => (row.kind === 'header' ? [index] : [])));
// The heading of the group in view stays rendered (and sticks), wherever the range is
const headerAt = (start: number) => [...headers.value].reverse().find((index) => start >= index) ?? -1;
const virtualizer = useVirtualizer(
    computed(() => ({
        count: rows.value.length,
        getScrollElement: () => scrollElement.value,
        estimateSize: (index: number) => {
            const row = rows.value[index];
            return row?.kind === 'item' && props.estimateSize
                ? props.estimateSize(row.item, row.index)
                : props.itemHeight;
        },
        // A hidden list measures 0 px – keep the estimate then
        measureElement: (element: Element) => element.getBoundingClientRect().height || props.itemHeight,
        overscan: 6,
        rangeExtractor: headers.value.length
            ? (range: Range) => {
                  const active = headerAt(range.startIndex);
                  const indexes = new Set(defaultRangeExtractor(range));
                  if (active >= 0) indexes.add(active);
                  return [...indexes].sort((a, b) => a - b);
              }
            : defaultRangeExtractor,
        // Render the first rows before the list is measured (SSR, tests)
        initialRect: { width: 0, height: 320 },
    }))
);
const virtualRows = computed(() => virtualizer.value.getVirtualItems());
// Read with the rows, so it follows scrolling (the range itself is not reactive)
const activeHeader = computed(() => {
    const range = virtualRows.value.length ? virtualizer.value.range : null;
    return headers.value.length ? headerAt(range?.startIndex ?? 0) : -1;
});

// Near the end: ask for more, once per length of the list
let asked = -1;
function checkEnd() {
    const last = virtualRows.value.at(-1)?.index;
    const count = rows.value.length;
    if (last === undefined || !more.value || busy.value || asked === count) return;
    if (last < count - 1 - props.endThreshold) return;
    asked = count;
    if (props.dataSource) source.loadMore();
    else {
        emit('loadMore');
        emit('endReached');
    }
}
onMounted(checkEnd);
watch(() => [virtualRows.value.at(-1)?.index, rows.value.length, more.value, busy.value], checkEnd);
const extended = computed(() => !!props.dataSource || props.hasMore || props.loading || props.loadingMore);

defineExpose({
    /** Scrolls an item into view (index in `items`) */
    scrollToIndex(index: number, options: { align?: 'start' | 'center' | 'end' | 'auto' } = {}) {
        const row = rows.value.findIndex((entry) => entry.kind === 'item' && entry.index === index);
        if (row >= 0) virtualizer.value.scrollToIndex(row, { align: options.align ?? 'auto' });
    },
    /** Loads the data source again from the start */
    refresh: () => source.refresh(),
});
</script>

<template>
    <!--
        Only the visible rows are in the DOM; each row says its position (aria-posinset/setsize), so screen readers
        still know the length. The area scrolls with the keyboard (tabindex).
    -->
    <div
        ref="scrollElement"
        role="list"
        :aria-label="label"
        :aria-busy="(extended && busy) || undefined"
        tabindex="0"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="[{ height }, attrs.style]"
    >
        <div :class="styles.spacer()" :style="{ height: `${virtualizer.getTotalSize()}px` }">
            <template v-for="row in virtualRows" :key="String(row.key)">
                <div
                    v-if="rows[row.index]?.kind === 'header'"
                    :ref="(element) => element && virtualizer.measureElement(element as HTMLElement)"
                    role="presentation"
                    :data-index="row.index"
                    :class="
                        row.index === activeHeader
                            ? styles.groupHeader({ class: styles.sticky() })
                            : styles.item({ class: styles.groupHeader() })
                    "
                    :style="row.index === activeHeader ? undefined : { transform: `translateY(${row.start}px)` }"
                >
                    {{ (rows[row.index] as { label: string }).label }}
                </div>
                <div
                    v-else-if="rows[row.index]"
                    :ref="(element) => element && virtualizer.measureElement(element as HTMLElement)"
                    role="listitem"
                    :aria-posinset="(rows[row.index] as { index: number }).index + 1"
                    :aria-setsize="list.length"
                    :data-index="row.index"
                    :class="styles.item()"
                    :style="{ transform: `translateY(${row.start}px)` }"
                >
                    <slot
                        :item="(rows[row.index] as { item: T }).item"
                        :index="(rows[row.index] as { index: number }).index"
                    />
                </div>
            </template>
        </div>
        <div v-if="extended && busy && list.length" :class="styles.loading()" aria-hidden="true">
            <LoaderCircle :class="styles.loadingIcon()" />
            {{ translations.dataSource.loadingMore }}
        </div>
    </div>
    <p v-if="dataSource" role="status" :class="styles.status()">{{ source.announcement.value }}</p>
</template>
