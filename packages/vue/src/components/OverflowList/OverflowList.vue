<script setup lang="ts" generic="T">
import {
    overflowList as overflowListRecipe,
    overflowVisibleCount,
    visuallyHidden,
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
import Popover from '../Popover/Popover.vue';
import PopoverContent from '../Popover/PopoverContent.vue';
import PopoverTrigger from '../Popover/PopoverTrigger.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface OverflowListProps<T> {
    /** The items, e.g. tags, buttons or people */
    items: readonly T[];
    /** Show at most this many (the rest goes behind "+N" even if there is room) */
    maxVisible?: number;
    /** Rows the items may wrap into before the rest is hidden (default 1) */
    maxRows?: number;
    /** Which items hide first: from the end (default) or from the start (the "+N" button comes first) */
    collapseFrom?: 'end' | 'start';
    /** Accessible name of the list */
    label?: string;
    /** Title of the popover with the hidden items (default "More items") */
    overflowTitle?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof overflowListRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<OverflowListProps<T>>(), { maxRows: 1, collapseFrom: 'end' });
const overflowList = useRecipe('overflowList', overflowListRecipe, () => props.classes);
defineSlots<{
    /** One item – in the row and in the popover */
    item(props: { item: T; index: number }): unknown;
    /** Own content of the popover (default: the hidden items) */
    overflow?(props: { items: T[] }): unknown;
}>();
const attrs = useAttrs();
const translations = useTranslations();
const list = useTemplateRef<HTMLUListElement>('list');
const capped = () => Math.min(props.items.length, props.maxVisible ?? Infinity);
// Without layout (server, before measuring): everything up to maxVisible
const visible = ref(capped());
const hiddenCount = computed(() => props.items.length - visible.value);
const isHidden = (index: number) =>
    props.collapseFrom === 'start' ? index < hiddenCount.value : index >= visible.value;
const hiddenEntries = computed(() =>
    props.items.map((item, index) => ({ item, index })).filter((entry) => isHidden(entry.index))
);
/** The items in order, with the "+N" button at the end (or the start) */
const layout = computed(() => {
    const entries: ({ more: false; item: T; index: number } | { more: true })[] = props.items.map((item, index) => ({
        more: false,
        item,
        index,
    }));
    if (hiddenCount.value > 0) entries.splice(props.collapseFrom === 'start' ? 0 : entries.length, 0, { more: true });
    return entries;
});
const srOnly = visuallyHidden();
const styles = computed(() => overflowList({ wrap: props.maxRows > 1 ? 'rows' : 'single' }));

function measure() {
    const root = list.value;
    if (!root) return;
    const entries = [...root.children] as HTMLElement[];
    const items = entries.filter((entry) => entry.dataset.index !== undefined);
    const more = entries.find((entry) => entry.dataset.more !== undefined);
    const style = getComputedStyle(root);
    visible.value = overflowVisibleCount({
        widths: items.map((item) => item.offsetWidth),
        available: root.clientWidth - parseFloat(style.paddingLeft || '0') - parseFloat(style.paddingRight || '0'),
        moreWidth: more?.offsetWidth || 48,
        gap: parseFloat(style.columnGap) || 0,
        maxVisible: props.maxVisible,
        maxRows: props.maxRows,
        collapseFrom: props.collapseFrom,
    });
}
let observer: ResizeObserver | undefined;
onMounted(() => {
    measure();
    if (typeof ResizeObserver === 'undefined' || !list.value) return;
    observer = new ResizeObserver(() => measure());
    observer.observe(list.value);
});
watch(
    () => [props.items, props.maxVisible, props.maxRows, props.collapseFrom],
    async () => {
        visible.value = capped();
        await nextTick();
        measure();
    }
);
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
    <!-- Items in a row; the ones that do not fit are hidden and listed in a popover behind the "+N" button -->
    <ul
        ref="list"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :aria-label="label"
    >
        <template v-for="entry in layout" :key="entry.more ? 'more' : entry.index">
            <li v-if="entry.more" :class="styles.item()" data-more="">
                <Popover :placement="collapseFrom === 'start' ? 'bottom-start' : 'bottom-end'">
                    <PopoverTrigger>
                        <button type="button" :class="styles.more()">
                            +{{ hiddenCount }} <span :class="srOnly">{{ translations.overflowList.more }}</span>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent :title="overflowTitle ?? translations.overflowList.title">
                        <slot name="overflow" :items="hiddenEntries.map((hidden) => hidden.item)">
                            <ul :class="styles.rest()">
                                <li v-for="hidden in hiddenEntries" :key="hidden.index" :class="styles.restItem()">
                                    <slot name="item" :item="hidden.item" :index="hidden.index" />
                                </li>
                            </ul>
                        </slot>
                    </PopoverContent>
                </Popover>
            </li>
            <li
                v-else
                :class="styles.item({ overflowed: isHidden(entry.index) })"
                :data-index="entry.index"
                :aria-hidden="isHidden(entry.index) || undefined"
                :inert="isHidden(entry.index) || undefined"
            >
                <slot name="item" :item="entry.item" :index="entry.index" />
            </li>
        </template>
    </ul>
</template>
