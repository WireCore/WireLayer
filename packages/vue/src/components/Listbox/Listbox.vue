<script setup lang="ts" generic="T = ListboxItem, V = ItemValueOf<T>">
import { createListCollection, Listbox } from '@ark-ui/vue/listbox';
import { Check, Minus } from '@lucide/vue';
import {
    allListOptionsState,
    listbox as listboxRecipe,
    toggleAllListOptions,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onMounted, ref, useAttrs, watch, type Component } from 'vue';
import { useOptionSource } from '../../utils/data-source.js';
import { useListOptions, useListSelection } from '../../utils/list.js';
import ListOptions from '../Select/ListOptions.vue';
import type { ListItemState } from '../Select/types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ListboxItem<V = string> {
    value: V;
    label: string;
    icon?: Component;
    disabled?: boolean;
    /** Second line below the label */
    description?: string;
    /** Items with the same group are listed under this heading */
    group?: string;
}

export interface ListboxProps<T = ListboxItem, V = ItemValueOf<T>> {
    /** Options: ListboxItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled/itemGroup */
    items: readonly T[];
    /** Visible label, also the list's accessible name */
    label?: string;
    /** Several options can be chosen (Space toggles) */
    multiple?: boolean;
    /** Chosen values – use with v-model; any type (string, number, boolean, object) */
    modelValue?: V[];
    defaultValue?: V[];
    disabled?: boolean;
    /** Value of an item: property name or function (default: `value`, otherwise the item itself) */
    itemValue?: ItemAccessor<T, V>;
    /** Label of an item: property name or function (default: `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of an item: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Group heading of an item: property name or function (default: `group`); items are listed per group */
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** Search field above the list; filters by label, ignoring case and accents */
    filter?: boolean;
    /** The items are filtered elsewhere (server): no local filtering, listen to filterChange */
    manualFilter?: boolean;
    /** Shown when no item is left (default "No results" / "No entries") */
    emptyText?: string;
    /** Shows "Loading" at the end of the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row */
    loadingText?: string;
    /** More items can be loaded: scrolling to the end of the list emits loadMore */
    hasMore?: boolean;
    /** Check boxes before the options (`multiple`) */
    checkboxes?: boolean;
    /** "Select all" above the options (`multiple`) – takes the options in view (filtered, enabled) */
    selectAll?: boolean;
    /**
     * Loads the options (pages while scrolling, the search field asks it); `getItemsByKeys` gives the labels of
     * chosen values that are not loaded
     */
    dataSource?: DataSource<T>;
    /** Fewest characters the search needs before the data source is asked */
    minSearchLength?: number;
    /** Options per request of the data source (default 50) */
    pageSize?: number;
    /** The options can be dragged (`draggable`, `data-value` is the key) – lists that exchange items (PickList) */
    draggableItems?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof listboxRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<ListboxProps<T, V>>(), {
    label: undefined,
    multiple: false,
    modelValue: undefined,
    defaultValue: undefined,
    disabled: false,
    checkboxes: false,
    selectAll: false,
    draggableItems: false,
});
const listbox = useRecipe('listbox', listboxRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [value: V[]];
    /** Text of the search field (filter) – e.g. to load matching items from a server (manualFilter) */
    filterChange: [text: string];
    /** The end of the list was scrolled into view (hasMore) */
    loadMore: [];
}>();
defineSlots<{
    /** Content of an option (instead of icon and label) */
    item?(props: { item: T } & ListItemState): unknown;
}>();
const attrs = useAttrs();
const styles = listbox();

const accessors = computed(() => ({
    itemValue: props.itemValue,
    itemLabel: props.itemLabel,
    itemDisabled: props.itemDisabled,
    itemGroup: props.itemGroup,
    valueKey: props.valueKey,
}));
const query = ref('');
const source = useOptionSource<T>({
    items: () => props.items,
    source: () => props.dataSource,
    accessors: () => accessors.value,
    pageSize: () => props.pageSize,
    minSearchLength: () => props.minSearchLength,
});
const { options, visible, groups, ordered } = useListOptions(
    () => source.items.value,
    () => accessors.value,
    () => (props.filter && !props.manualFilter && !props.dataSource ? query.value : '')
);
const known = computed(() => [...options.value, ...source.resolvedOptions.value]);
const { selected, keys, commit, commitKeys } = useListSelection<T>({
    multiple: true,
    model: () => props.modelValue,
    defaultValue: props.defaultValue,
    accessors: () => accessors.value,
    items: known,
    emit: (value) => emit('update:modelValue', value as V[]),
});
// Always visible: the first page loads at once; chosen values that are not loaded get their labels
onMounted(() => {
    source.open();
    source.resolve(keys.value, known.value);
});
watch(keys, (next) => source.resolve(next, known.value));
const isLoading = computed(() => props.loading || source.loading.value);
const selectable = computed(() => visible.value.filter((option) => !option.disabled));
const allState = computed(() => allListOptionsState(selected.value, selectable.value));
const collection = computed(() =>
    createListCollection({
        items: ordered.value,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.key,
        isItemDisabled: (item) => item.disabled,
    })
);
const listClasses = {
    item: styles.item(),
    itemText: styles.itemText(),
    icon: styles.icon(),
    itemIndicator: styles.itemIndicator(),
    itemBody: styles.itemBody(),
    itemDescription: styles.itemDescription(),
    group: styles.group(),
    groupLabel: styles.groupLabel(),
    loading: styles.loading(),
    loadingIcon: styles.loadingIcon(),
    sentinel: styles.sentinel(),
    empty: styles.empty(),
    check: styles.check(),
    checkIcon: styles.checkIcon(),
};
function onFilterInput(event: Event) {
    query.value = (event.target as HTMLInputElement).value;
    emit('filterChange', query.value);
    if (props.dataSource) source.search(query.value);
}
function onLoadMore() {
    if (props.dataSource) source.loadMore();
    else emit('loadMore');
}
</script>

<template>
    <!-- Always visible list (role="listbox"): arrow keys move, Enter/Space choose, typing jumps to an option -->
    <Listbox.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :collection="collection"
        :selection-mode="multiple ? 'multiple' : 'single'"
        :model-value="keys"
        :disabled="disabled"
        @value-change="commitKeys($event.value, $event.items as ListOption<T>[])"
    >
        <Listbox.Label v-if="label" :class="styles.label()">{{ label }}</Listbox.Label>
        <!-- Search field: arrow keys move in the list, Enter chooses -->
        <Listbox.Input
            v-if="filter"
            :class="styles.search()"
            :aria-label="translations.select.filter"
            :placeholder="translations.combobox.search"
            @input="onFilterInput"
        />
        <!-- "Select all": a check box for the options in view -->
        <button
            v-if="multiple && selectAll && selectable.length"
            type="button"
            role="checkbox"
            :aria-checked="allState"
            :disabled="disabled"
            :class="styles.selectAll()"
            @click="commit(toggleAllListOptions(selected, visible))"
        >
            <span
                :class="styles.check()"
                :data-state="allState === 'mixed' ? 'indeterminate' : allState ? 'checked' : 'unchecked'"
                aria-hidden="true"
            >
                <Minus v-if="allState === 'mixed'" :class="styles.checkIcon()" />
                <Check v-else-if="allState" :class="styles.checkIcon()" />
            </span>
            {{ translations.select.selectAll }}
        </button>
        <Listbox.Content
            :class="styles.content()"
            :aria-label="label ? undefined : (attrs['aria-label'] as string)"
            :aria-busy="isLoading || undefined"
        >
            <ListOptions
                :parts="Listbox"
                :groups="groups"
                :classes="listClasses"
                :checkbox="checkboxes"
                :draggable="draggableItems"
                :loading="isLoading"
                :loading-text="loadingText ?? translations.common.loading"
                :has-more="hasMore || source.hasMore.value"
                :empty-text="
                    emptyText ??
                    source.emptyText.value ??
                    (query ? translations.common.noResults : translations.common.empty)
                "
                @load-more="onLoadMore"
            >
                <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
            </ListOptions>
        </Listbox.Content>
        <p v-if="dataSource" role="status" :class="styles.status()">{{ source.announcement.value }}</p>
    </Listbox.Root>
</template>
