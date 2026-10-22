<script setup lang="ts" generic="T">
import { LayoutGrid, List } from '@lucide/vue';
import {
    createDataController,
    dataAnnouncement,
    dataView as dataViewRecipe,
    type DataController,
    type DataQuery,
    type DataSource,
    type DataState,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, watch } from 'vue';
import Button from '../Button/Button.vue';
import Pagination from '../Pagination/Pagination.vue';
import SegmentedControl from '../SegmentedControl/SegmentedControl.vue';
import SegmentedControlItem from '../SegmentedControl/SegmentedControlItem.vue';
import Skeleton from '../Skeleton/Skeleton.vue';
import LoadMore from '../Select/LoadMore.vue';
import { useDataSource } from '../../utils/data-source.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface DataViewProps<T> {
    items?: T[];
    /** Accessible name of the list, e.g. "Server" */
    label: string;
    /** List or grid – use with v-model:layout */
    layout?: 'list' | 'grid';
    defaultLayout?: 'list' | 'grid';
    /** Switch between list and grid above the items */
    layoutToggle?: boolean;
    /** Items per page – enables pagination (v-model:page-size with `pageSizes`) */
    pageSize?: number;
    /** Page sizes to choose from below the items */
    pageSizes?: number[];
    /** Current page, 1-based – use with v-model:page */
    page?: number;
    defaultPage?: number;
    /** The items are the current page only (server); `totalCount` is the number of all items */
    manual?: boolean;
    /** Number of all items (`manual`) */
    totalCount?: number;
    /** Loads the items (pages, or growing with `loadMode: 'infinite'`); `query` adds sorting, filters, search */
    dataSource?: DataSource<T>;
    /** Sorting, filters and search for the data source (e.g. from the toolbar); a change starts at page 1 */
    query?: Omit<DataQuery, 'page' | 'pageSize' | 'cursor'>;
    /** `pages` (default): pagination below the items; `infinite`: the list grows with "Load more" */
    loadMode?: 'pages' | 'infinite';
    /** `infinite`: loads the next page when the end of the list scrolls into view (the button stays as fallback) */
    autoLoad?: boolean;
    /** More items can be loaded (`infinite` without a data source): the button emits loadMore */
    hasMore?: boolean;
    /** Placeholder items while there are none yet, "Loading" on the button otherwise (aria-busy) */
    loading?: boolean;
    /** Placeholder items while loading (default: the page size, at most 6) */
    skeletonCount?: number;
    /** The items are filtered: shows the no-results text (slot `noResults`) instead of the empty text */
    filtered?: boolean;
    /** An error to show instead of the items (slot `error`); a data source sets it itself */
    error?: unknown;
    emptyText?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dataViewRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const locale = useLocale();
const props = withDefaults(defineProps<DataViewProps<T>>(), {
    items: () => [],
    layout: undefined,
    defaultLayout: 'list',
    layoutToggle: true,
    pageSize: undefined,
    page: undefined,
    defaultPage: 1,
    manual: false,
    loadMode: 'pages',
    autoLoad: false,
    hasMore: false,
    loading: false,
    filtered: false,
    error: undefined,
});
const dataView = useRecipe('dataView', dataViewRecipe, () => props.classes);
const emit = defineEmits<{
    'update:layout': [layout: 'list' | 'grid'];
    'update:page': [page: number];
    'update:pageSize': [pageSize: number];
    /** "Load more" (`infinite` without a data source) */
    loadMore: [];
}>();
const slots = defineSlots<{
    item(props: { item: T; layout: 'list' | 'grid' }): unknown;
    header?(): unknown;
    /** Sorting and filters above the items */
    toolbar?(): unknown;
    /** Shown without items */
    empty?(): unknown;
    /** Shown without items while filtered */
    noResults?(): unknown;
    /** Shown instead of the items after an error */
    error?(props: { error: unknown; retry: () => void }): unknown;
}>();
const attrs = useAttrs();
const t = translations.dataView;

const internal = ref(props.defaultLayout);
const current = computed(() => props.layout ?? internal.value);
function setLayout(next: string | null) {
    if (next !== 'list' && next !== 'grid') return;
    internal.value = next;
    emit('update:layout', next);
}
const pageInternal = ref(props.defaultPage);
const page = computed(() => props.page ?? pageInternal.value);
function setPage(next: number) {
    pageInternal.value = next;
    emit('update:page', next);
}
const sizeInternal = ref(props.pageSize);
watch(
    () => props.pageSize,
    (size) => (sizeInternal.value = size)
);
const size = computed(() => sizeInternal.value);
function setSize(next: number) {
    sizeInternal.value = next;
    emit('update:pageSize', next);
    setPage(1);
}
const infinite = computed(() => props.loadMode === 'infinite');

// Data source, pages: one page per request
const paged = shallowRef<DataState<T>>({ status: 'idle', items: [] });
let controller: DataController<T> | undefined;
const pagedSource = computed(() => (props.dataSource && !infinite.value ? props.dataSource : undefined));
function loadPage() {
    const source = pagedSource.value;
    if (!source) return;
    controller ??= createDataController<T>({ source, onChange: (state) => (paged.value = state) });
    controller.configure({ source });
    void controller.load({ ...props.query, page: page.value, pageSize: size.value });
}
onMounted(loadPage);
watch([pagedSource, page, size], loadPage);
watch(
    () => JSON.stringify(props.query ?? {}),
    () => (page.value === 1 ? loadPage() : setPage(1))
);
onBeforeUnmount(() => controller?.dispose());

// Data source, infinite: the list grows page by page
const growing = useDataSource<T>({
    source: () => (infinite.value ? props.dataSource : undefined),
    pageSize: () => size.value,
    query: () => {
        if (!props.query) return undefined;
        const rest = { ...props.query };
        delete rest.search;
        return rest;
    },
});
onMounted(() => {
    if (infinite.value && props.dataSource) growing.search(props.query?.search ?? '', false);
});
watch(
    () => props.query?.search,
    (search) => {
        if (infinite.value && props.dataSource) growing.search(search ?? '');
    }
);

const sourceState = computed<DataState<T> | undefined>(() =>
    !props.dataSource ? undefined : infinite.value ? growing.state.value : paged.value
);
const all = computed(() => sourceState.value?.items ?? props.items);
const total = computed(() =>
    sourceState.value ? (sourceState.value.totalCount ?? all.value.length) : (props.totalCount ?? props.items.length)
);
const serverPaged = computed(() => props.manual || !!pagedSource.value);
const visible = computed(() =>
    size.value && !infinite.value && !serverPaged.value
        ? all.value.slice((page.value - 1) * size.value, page.value * size.value)
        : all.value
);
const failed = computed(() => (sourceState.value?.status === 'error' ? sourceState.value.error : props.error));
const busy = computed(() => props.loading || sourceState.value?.status === 'loading');
/** Nothing to show yet: placeholders */
const firstLoad = computed(() => busy.value && !all.value.length);
const skeletons = computed(() => props.skeletonCount ?? Math.min(size.value ?? 6, 6));
const more = computed(() => (props.dataSource ? !!growing.state.value.hasMore : props.hasMore));
const isFiltered = computed(
    () => props.filtered || !!props.query?.search || !!Object.keys(props.query?.filters ?? {}).length
);
const announces = computed(() => !!props.dataSource || props.loading || props.manual);
const announcement = computed(() =>
    sourceState.value
        ? dataAnnouncement(sourceState.value, translations, locale.value.locale)
        : props.loading
          ? translations.common.loading
          : ''
);
function retry() {
    if (infinite.value) growing.retry();
    else void controller?.refresh();
}
function loadMore() {
    if (props.dataSource) growing.loadMore();
    else emit('loadMore');
}
const styles = computed(() => dataView({ layout: current.value }));
</script>

<template>
    <!-- Items as a list or grid (a list either way); the switch is a radio group "View" -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <div v-if="layoutToggle || $slots.header" :class="styles.header()">
            <slot name="header" />
            <SegmentedControl
                v-if="layoutToggle"
                :model-value="current"
                :label="t.layout"
                @update:model-value="setLayout"
            >
                <SegmentedControlItem value="list" :icon="List">{{ t.list }}</SegmentedControlItem>
                <SegmentedControlItem value="grid" :icon="LayoutGrid">{{ t.grid }}</SegmentedControlItem>
            </SegmentedControl>
        </div>
        <div v-if="$slots.toolbar" :class="styles.header()"><slot name="toolbar" /></div>
        <div v-if="failed" role="alert" :class="styles.error()">
            <slot name="error" :error="failed" :retry="retry">
                {{ translations.dataSource.error }}
                <Button v-if="dataSource" variant="outline" size="sm" @click="retry">{{
                    translations.dataSource.retry
                }}</Button>
            </slot>
        </div>
        <ul v-else-if="firstLoad" :class="styles.items()" :aria-label="label" aria-busy="true">
            <li v-for="index in skeletons" :key="index" :class="styles.item()">
                <div :class="styles.skeleton()">
                    <Skeleton width="60%" />
                    <Skeleton width="85%" />
                </div>
            </li>
        </ul>
        <ul
            v-else-if="all.length"
            :class="styles.items()"
            :aria-label="label"
            :aria-busy="(announces && busy) || undefined"
        >
            <li v-for="(item, index) in visible" :key="index" :class="styles.item()">
                <slot name="item" :item="item" :layout="current" />
            </li>
        </ul>
        <p v-else-if="isFiltered && slots.noResults" :class="styles.empty()"><slot name="noResults" /></p>
        <p v-else :class="styles.empty()">
            <slot name="empty">{{
                emptyText ?? (isFiltered ? translations.common.noResults : translations.common.empty)
            }}</slot>
        </p>
        <div v-if="infinite && !failed && all.length && (more || total > all.length)" :class="styles.footer()">
            <span v-if="total > all.length" :class="styles.summary()">{{ t.shown(all.length, total) }}</span>
            <Button v-if="more" variant="outline" size="sm" :loading="busy" @click="loadMore">{{
                busy ? translations.dataSource.loadingMore : t.loadMore
            }}</Button>
            <LoadMore
                v-if="autoLoad && more"
                :class="styles.sentinel()"
                :active="!busy"
                :count="all.length"
                @load="loadMore"
            />
        </div>
        <Pagination
            v-if="!infinite && size && total > size"
            :count="total"
            :page-size="size"
            :page-sizes="pageSizes"
            :page="page"
            :translations="{ rootLabel: `${label}: ${translations.pagination.rootLabel}` }"
            @update:page="setPage"
            @update:page-size="setSize"
        />
        <p v-if="announces" role="status" :class="styles.status()">{{ announcement }}</p>
    </div>
</template>
