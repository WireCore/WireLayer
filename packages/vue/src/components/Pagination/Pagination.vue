<script setup lang="ts">
import { Pagination, usePagination } from '@ark-ui/vue/pagination';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue';
import { pageForSize, pagination as paginationRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, ref, useAttrs, watch } from 'vue';
import Input from '../Input/Input.vue';
import Select from '../Select/Select.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface PaginationRange {
    start: number;
    end: number;
    count: number;
}

export interface PaginationTranslations {
    rootLabel: string;
    prevTriggerLabel: string;
    nextTriggerLabel: string;
    firstTriggerLabel?: string;
    lastTriggerLabel?: string;
    itemLabel: (details: { page: number; totalPages: number }) => string;
}

export interface PaginationProps {
    /** Total number of items */
    count: number;
    /** Items per page – use with v-model:pageSize when `pageSizes` lets the user change it */
    pageSize?: number;
    /** Current page (1-based) – use with v-model:page */
    page?: number;
    defaultPage?: number;
    /** Pages shown on each side of the current page before an ellipsis */
    siblingCount?: number;
    /** Pages always shown at the start and the end (default 1) */
    boundaryCount?: number;
    /** Text like "1–4 of 12" before the page buttons */
    showSummary?: boolean;
    summary?: (range: PaginationRange) => string;
    /** Choice of rows per page, e.g. [10, 25, 50]; the current page keeps its first item in view */
    pageSizes?: readonly number[];
    /** Field to go to a page by number */
    jumper?: boolean;
    /**
     * `full`: page buttons (default); `compact`: "Page 2 of 5" between the arrows; `auto`: compact when the
     * pagination is narrower than 28rem (container query)
     */
    variant?: 'full' | 'compact' | 'auto';
    /** Buttons to the first and the last page */
    withEdges?: boolean;
    /** Renders nothing when there is only one page */
    hideSinglePage?: boolean;
    /** Links instead of buttons (URL keeps the page, e.g. `?page=3`): the address of a page */
    getPageHref?: (page: number) => string;
    translations?: Partial<PaginationTranslations>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof paginationRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PaginationProps>(), {
    pageSize: 10,
    page: undefined,
    defaultPage: undefined,
    siblingCount: 1,
    showSummary: true,
    variant: 'full',
});
const pagination = useRecipe('pagination', paginationRecipe, () => props.classes);
const emit = defineEmits<{ 'update:page': [page: number]; 'update:pageSize': [pageSize: number] }>();
const attrs = useAttrs();
const styles = computed(() => pagination({ responsive: props.variant === 'auto' }));

const texts = useTranslations();
const translations = computed<PaginationTranslations>(() => ({ ...texts.pagination, ...props.translations }));
// The page size follows the prop and changes with the size choice
const size = ref(props.pageSize);
watch(
    () => props.pageSize,
    (value) => (size.value = value)
);
const rangeOf = (page: number): PaginationRange => ({
    start: Math.min((page - 1) * size.value + 1, props.count),
    end: Math.min(page * size.value, props.count),
    count: props.count,
});
const hidden = computed(() => props.hideSinglePage && props.count <= size.value);
const tag = computed(() => (props.getPageHref ? 'a' : 'button'));
/** A link without href (no page before/after) keeps its label as a link and says it is disabled */
const linkState = (disabled: boolean) =>
    props.getPageHref && disabled ? { role: 'link', 'aria-disabled': 'true' } : {};
const sizeItems = computed(() => (props.pageSizes ?? []).map((value) => ({ value, label: String(value) })));

// Ark Vue's Pagination.Root does not pass boundaryCount on – the machine gets all options through usePagination
const machine = usePagination(
    computed(() => ({
        count: props.count,
        pageSize: size.value,
        page: props.page,
        defaultPage: props.defaultPage,
        siblingCount: props.siblingCount,
        boundaryCount: props.boundaryCount,
        type: props.getPageHref ? ('link' as const) : ('button' as const),
        getPageUrl: props.getPageHref ? ({ page }: { page: number }) => props.getPageHref!(page) : undefined,
        translations: translations.value,
        onPageChange: ({ page }: { page: number }) => emit('update:page', page),
    }))
);

type Api = { page: number; totalPages: number; setPage: (page: number) => void };
async function changeSize(api: Api, value: number | null) {
    if (!value || value === size.value) return;
    const next = pageForSize(api.page, size.value, value);
    size.value = value;
    emit('update:pageSize', value);
    await nextTick();
    api.setPage(next);
}
function jump(event: KeyboardEvent, api: Api) {
    const field = event.target as HTMLInputElement;
    const page = Number.parseInt(field.value, 10);
    if (Number.isNaN(page)) return;
    event.preventDefault();
    api.setPage(Math.min(Math.max(page, 1), api.totalPages));
    field.value = '';
}
</script>

<template>
    <Pagination.RootProvider
        v-if="!hidden"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :value="machine"
    >
        <Pagination.Context v-slot="api">
            <span v-if="showSummary" :class="styles.summary()" aria-live="polite">{{
                (summary ?? texts.pagination.summary)(rangeOf(api.page))
            }}</span>
            <div v-if="pageSizes?.length" :class="styles.pageSize()">
                <span aria-hidden="true">{{ texts.pagination.pageSize }}</span>
                <Select
                    :class="styles.pageSizeSelect()"
                    size="sm"
                    :items="sizeItems"
                    :model-value="size"
                    :aria-label="texts.pagination.pageSize"
                    @update:model-value="changeSize(api, $event)"
                />
            </div>
            <div :class="styles.list()">
                <Pagination.FirstTrigger v-if="withEdges" as-child>
                    <component :is="tag" :class="styles.trigger()" v-bind="linkState(api.page === 1)">
                        <ChevronsLeft :class="styles.triggerIcon()" aria-hidden="true" />
                    </component>
                </Pagination.FirstTrigger>
                <Pagination.PrevTrigger as-child>
                    <component :is="tag" :class="styles.trigger()" v-bind="linkState(api.page === 1)">
                        <ChevronLeft :class="styles.triggerIcon()" aria-hidden="true" />
                    </component>
                </Pagination.PrevTrigger>
                <span v-if="variant !== 'full'" :class="styles.compact()">{{
                    texts.pagination.compact(api.page, api.totalPages)
                }}</span>
                <template v-if="variant !== 'compact'">
                    <template v-for="(item, index) in api.pages" :key="index">
                        <Pagination.Item v-if="item.type === 'page'" v-bind="item" as-child>
                            <component :is="tag" :class="styles.item()">{{ item.value }}</component>
                        </Pagination.Item>
                        <Pagination.Ellipsis v-else :index="index" :class="styles.ellipsis()" aria-hidden="true">
                            …
                        </Pagination.Ellipsis>
                    </template>
                </template>
                <Pagination.NextTrigger as-child>
                    <component :is="tag" :class="styles.trigger()" v-bind="linkState(api.page === api.totalPages)">
                        <ChevronRight :class="styles.triggerIcon()" aria-hidden="true" />
                    </component>
                </Pagination.NextTrigger>
                <Pagination.LastTrigger v-if="withEdges" as-child>
                    <component :is="tag" :class="styles.trigger()" v-bind="linkState(api.page === api.totalPages)">
                        <ChevronsRight :class="styles.triggerIcon()" aria-hidden="true" />
                    </component>
                </Pagination.LastTrigger>
            </div>
            <div v-if="jumper" :class="styles.jumper()">
                <span aria-hidden="true">{{ texts.pagination.jumper }}</span>
                <Input
                    :class="styles.jumperInput()"
                    size="sm"
                    inputmode="numeric"
                    autocomplete="off"
                    :aria-label="texts.pagination.jumper"
                    @keydown.enter="jump($event, api)"
                />
            </div>
        </Pagination.Context>
    </Pagination.RootProvider>
</template>
