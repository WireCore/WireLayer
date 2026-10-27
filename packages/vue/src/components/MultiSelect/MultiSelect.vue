<script setup lang="ts" generic="T = SelectItem, V = ItemValueOf<T>">
import { createListCollection } from '@ark-ui/vue/collection';
import { useFieldContext } from '@ark-ui/vue/field';
import { Select } from '@ark-ui/vue/select';
import { Check, ChevronDown, LoaderCircle, Minus, X } from '@lucide/vue';
import {
    controlIds,
    allListOptionsState,
    multiSelect as multiSelectRecipe,
    toggleAllListOptions,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, onMounted, ref, useAttrs, useId, watch } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useOptionSource } from '../../utils/data-source.js';
import { useListOptions, useListSelection } from '../../utils/list.js';
import ListOptions from '../Select/ListOptions.vue';
import type { ListItemState, SelectItem, SelectSize } from '../Select/types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface MultiSelectProps<T = SelectItem, V = ItemValueOf<T>> {
    /** Options: SelectItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled/itemGroup */
    items: readonly T[];
    /** Selected values – use with v-model; any type (string, number, boolean, object) */
    modelValue?: V[];
    defaultValue?: V[];
    placeholder?: string;
    /** Trigger text once more than `maxShown` items are selected, e.g. "4 selected" */
    summary?: (count: number) => string;
    /** Selected labels shown in the trigger before the summary is used */
    maxShown?: number;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Value of an item: property name or function (default: `value`, otherwise the item itself) */
    itemValue?: ItemAccessor<T, V>;
    /** Label of an item: property name or function (default: `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of an item: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Group heading of an item: property name or function (default: `group`); items are listed per group */
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    /**
     * More text the search finds an item by, besides its label: property name or function, one text or a list
     * (default: `keywords`), e.g. the name of the item's category
     */
    itemKeywords?: ItemAccessor<T, string | readonly string[] | null | undefined>;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** Selected items as text (default) or as chips with a remove button each (Backspace removes the last) */
    display?: 'text' | 'chips';
    /** Check boxes before the options (default); false shows a check mark after the label */
    checkboxes?: boolean;
    /** "Select all" above the options – takes the options in view (filtered, enabled) */
    selectAll?: boolean;
    /** Most options that can be chosen; the others are disabled then and the limit is announced */
    max?: number;
    /** Button that clears all values (also Delete on the closed field) */
    clearable?: boolean;
    /** Shows a spinner in the field and "Loading" in the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row in the list */
    loadingText?: string;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: SelectSize;
    /** Search field at the top of the list; filters by label and itemKeywords, ignoring case and accents */
    filter?: boolean;
    /** The items are filtered elsewhere (server): no local filtering, listen to filterChange */
    manualFilter?: boolean;
    /** Shown when no item is left (default "No results" / "No entries") */
    emptyText?: string;
    /** More items can be loaded: scrolling to the end of the list emits loadMore */
    hasMore?: boolean;
    /**
     * Loads the options when the list opens (pages while scrolling; with `filter` the search asks it, after a
     * typing pause, outdated answers dropped); `getItemsByKeys` gives the labels of chosen values that are not loaded
     */
    dataSource?: DataSource<T>;
    /** Fewest characters the search needs before the data source is asked */
    minSearchLength?: number;
    /** Options per request of the data source (default 50) */
    pageSize?: number;
    /** Id of the field (the trigger), e.g. for a `<label for>` */
    id?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof multiSelectRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<MultiSelectProps<T, V>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    maxShown: 2,
    disabled: undefined,
    invalid: undefined,
    required: undefined,
    display: 'text',
    checkboxes: true,
});
const multiSelect = useRecipe('multiSelect', multiSelectRecipe, () => props.classes);
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
    /** Content of the field for the selected items (display "text") */
    value?(props: { items: T[] }): unknown;
}>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const chips = computed(() => props.display === 'chips');
const styles = computed(() => multiSelect({ size: props.size, clearable: props.clearable && !chips.value }));
const t = translations.select;

const accessors = computed(() => ({
    itemValue: props.itemValue,
    itemLabel: props.itemLabel,
    itemDisabled: props.itemDisabled,
    itemGroup: props.itemGroup,
    itemKeywords: props.itemKeywords,
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
    // Without a data source and loaded: a value outside the items warns in development
    check: { component: 'MultiSelect', ready: () => !props.dataSource && !props.loading && props.items.length > 0 },
});
// Chosen values that are not loaded get their labels from the data source
onMounted(() => source.resolve(keys.value, known.value));
watch(keys, (next) => source.resolve(next, known.value));
const listLoading = computed(() => props.loading || source.loading.value);
const listHasMore = computed(() => props.hasMore || source.hasMore.value);
function onLoadMore() {
    if (props.dataSource) source.loadMore();
    else emit('loadMore');
}
const atMax = computed(() => props.max !== undefined && selected.value.length >= props.max);
const collection = computed(() => {
    const chosen = new Set(keys.value);
    return createListCollection({
        items: ordered.value,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.key,
        // At the maximum only the chosen options can still be changed
        isItemDisabled: (item) => item.disabled || (atMax.value && !chosen.has(item.key)),
    });
});
const panel = computed(() => props.filter || props.selectAll);
const listId = useId();
const emptyLabel = computed(
    () =>
        props.emptyText ??
        source.emptyText.value ??
        (query.value ? translations.common.noResults : translations.common.empty)
);
const listClasses = computed(() => ({
    item: styles.value.item(),
    itemText: styles.value.itemText(),
    icon: styles.value.icon(),
    itemIndicator: styles.value.itemIndicator(),
    itemBody: styles.value.itemBody(),
    itemDescription: styles.value.itemDescription(),
    group: styles.value.group(),
    groupLabel: styles.value.groupLabel(),
    loading: styles.value.loading(),
    loadingIcon: styles.value.loadingIcon(),
    sentinel: styles.value.sentinel(),
    empty: styles.value.empty(),
    check: styles.value.check(),
    checkIcon: styles.value.checkIcon(),
}));
const triggerText = computed(() =>
    !selected.value.length
        ? (props.placeholder ?? translations.common.placeholder)
        : selected.value.length > props.maxShown
          ? (props.summary ?? translations.common.selectedCount)(selected.value.length)
          : selected.value.map((option) => option.label).join(', ')
);
// "Select all" counts the selectable options in view
const selectable = computed(() => visible.value.filter((option) => !option.disabled));
const allState = computed(() => allListOptionsState(selected.value, selectable.value));

// Removed chips and the reached maximum are announced
const announcement = ref('');
function update(next: ListOption<T>[]) {
    const reached = props.max !== undefined && next.length >= props.max && selected.value.length < props.max;
    commit(next);
    if (reached) announcement.value = t.maxReached(props.max!);
}
function onValueChange(nextKeys: string[], arkItems: ListOption<T>[]) {
    const reached = props.max !== undefined && nextKeys.length >= props.max && selected.value.length < props.max;
    commitKeys(nextKeys, arkItems);
    if (reached) announcement.value = t.maxReached(props.max!);
}
function remove(option: ListOption<T>) {
    commit(selected.value.filter((other) => other.key !== option.key));
    announcement.value = t.removed(option.label);
}

interface Api {
    focus(): void;
    disabled: boolean;
    setHighlightValue(value: string): void;
    highlightedItem: unknown;
    getItemProps(props: { item: unknown }): { id?: string };
}
function onTriggerKeydown(event: KeyboardEvent) {
    const last = selected.value.at(-1);
    if (!last) return;
    if (chips.value && event.key === 'Backspace') {
        event.preventDefault();
        remove(last);
    } else if (props.clearable && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault();
        commit([]);
    }
}
function clear(api: Api) {
    commit([]);
    api.focus();
}
function onFilterInput(api: Api, event: Event) {
    query.value = (event.target as HTMLInputElement).value;
    emit('filterChange', query.value);
    if (props.dataSource) source.search(query.value);
    // Highlight the first match, so Space/Enter takes it (once the list shows it)
    if (props.manualFilter || props.dataSource) return;
    void nextTick(() => {
        const first = ordered.value.find((option) => !option.disabled);
        if (first) api.setHighlightValue(first.key);
    });
}
// Space types a space, Home/End move the caret – the list would take them otherwise
function onFilterKeydown(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Home' || event.key === 'End') event.stopPropagation();
}
// The list would take Space/Enter as "choose the highlighted option"
function onSelectAllKeydown(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
}
function onOpenChange(open: boolean) {
    if (open) source.open();
    if (open || !query.value) return;
    query.value = '';
    emit('filterChange', '');
    if (props.dataSource) source.search('');
}
const activeId = (api: Api) => (api.highlightedItem ? api.getItemProps({ item: api.highlightedItem }).id : undefined);
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const listPositioning = { sameWidth: true, gutter: 4 } as const;
// An own id goes to the trigger through Ark (it finds the trigger by its id)
const field = useFieldContext();
const ids = computed(() =>
    controlIds(props.id, 'trigger', { label: field?.value.ids.label, hiddenSelect: field?.value.ids.control })
);
</script>

<template>
    <!-- Select with several values: the list stays open while choosing, Space/Enter toggle an option -->
    <Select.Root
        :class="styles.base({ class: split.className })"
        :style="split.style"
        :collection="collection"
        multiple
        :close-on-select="false"
        :model-value="keys"
        :disabled="disabled"
        :invalid="invalid"
        :required="required"
        :name="name"
        :positioning="listPositioning"
        :composite="!panel"
        v-bind="ids"
        lazy-mount
        unmount-on-exit
        @value-change="onValueChange($event.value, $event.items as ListOption<T>[])"
        @open-change="onOpenChange($event.open)"
    >
        <Select.Context v-slot="api">
            <!-- No class attribute without chips or clear button (unchanged DOM) -->
            <Select.Control
                v-bind="chips || clearable ? { class: chips ? styles.chipsControl() : styles.control() } : {}"
            >
                <template v-if="chips">
                    <span v-for="option in selected" :key="option.key" :class="styles.chip()">
                        <span :class="styles.chipText()">{{ option.label }}</span>
                        <!-- Not a tab stop: Backspace on the field removes the last chip -->
                        <button
                            v-if="!api.disabled"
                            type="button"
                            tabindex="-1"
                            :class="styles.chipRemove()"
                            :aria-label="t.removeItem(option.label)"
                            @click="remove(option)"
                        >
                            <X :class="styles.chipRemoveIcon()" aria-hidden="true" />
                        </button>
                    </span>
                </template>
                <Select.Trigger
                    v-bind="split.rest"
                    :class="chips ? styles.chipsTrigger() : styles.trigger()"
                    :aria-busy="loading || undefined"
                    @keydown="onTriggerKeydown"
                >
                    <span v-if="chips" :class="styles.value()" :data-placeholder-shown="!selected.length || undefined">
                        <span v-if="selected.length" :class="styles.hiddenValue()">{{
                            selected.map((option) => option.label).join(', ')
                        }}</span>
                        <template v-else>{{ placeholder ?? translations.common.placeholder }}</template>
                    </span>
                    <span v-else :class="styles.value()" :data-placeholder-shown="!selected.length || undefined">
                        <slot
                            v-if="$slots.value && selected.length"
                            name="value"
                            :items="selected.map((option) => option.item)"
                        />
                        <template v-else>{{ triggerText }}</template>
                    </span>
                    <Select.Indicator :class="styles.indicator()">
                        <LoaderCircle v-if="loading" :class="styles.spinner()" aria-hidden="true" />
                        <ChevronDown v-else :class="styles.indicatorIcon()" aria-hidden="true" />
                    </Select.Indicator>
                </Select.Trigger>
                <!-- Not a tab stop: Delete on the field clears, too -->
                <button
                    v-if="clearable && selected.length && !api.disabled"
                    type="button"
                    tabindex="-1"
                    :class="chips ? styles.chipsClear() : styles.clear()"
                    :aria-label="t.clear"
                    @click="clear(api)"
                >
                    <X :class="styles.clearIcon()" aria-hidden="true" />
                </button>
            </Select.Control>
        </Select.Context>
        <span v-if="chips || max !== undefined || dataSource" role="status" :class="styles.status()">{{
            announcement || source.announcement.value
        }}</span>
        <Teleport to="body">
            <Select.Positioner>
                <Select.Content
                    :class="styles.content()"
                    :aria-busy="listLoading || undefined"
                    :aria-label="panel ? (split.rest['aria-label'] as string | undefined) : undefined"
                >
                    <!-- With a search field or "select all" the popup is a dialog: those on top, then the list -->
                    <template v-if="panel">
                        <div :class="styles.header()">
                            <Select.Context v-slot="api">
                                <input
                                    v-if="filter"
                                    type="text"
                                    role="combobox"
                                    autocomplete="off"
                                    aria-autocomplete="list"
                                    aria-expanded="true"
                                    data-autofocus
                                    :aria-controls="listId"
                                    :aria-activedescendant="activeId(api)"
                                    :aria-label="t.filter"
                                    :placeholder="translations.combobox.search"
                                    :value="query"
                                    :class="styles.search()"
                                    @input="onFilterInput(api, $event)"
                                    @keydown="onFilterKeydown"
                                />
                            </Select.Context>
                            <button
                                v-if="selectAll && selectable.length"
                                type="button"
                                role="checkbox"
                                :aria-checked="allState"
                                :class="styles.selectAll()"
                                @click="update(toggleAllListOptions(selected, visible, max))"
                                @keydown="onSelectAllKeydown"
                            >
                                <span
                                    :class="styles.check()"
                                    :data-state="
                                        allState === 'mixed' ? 'indeterminate' : allState ? 'checked' : 'unchecked'
                                    "
                                    aria-hidden="true"
                                >
                                    <Minus v-if="allState === 'mixed'" :class="styles.checkIcon()" />
                                    <Check v-else-if="allState" :class="styles.checkIcon()" />
                                </span>
                                {{ t.selectAll }}
                            </button>
                        </div>
                        <Select.List :id="listId" :class="styles.list()" :data-autofocus="filter ? undefined : ''">
                            <ListOptions
                                :parts="Select"
                                :groups="groups"
                                :classes="listClasses"
                                :checkbox="checkboxes"
                                :loading="listLoading"
                                :loading-text="loadingText ?? translations.common.loading"
                                :has-more="listHasMore"
                                :empty-text="emptyLabel"
                                @load-more="onLoadMore"
                            >
                                <template v-if="$slots.item" #item="state"
                                    ><slot name="item" v-bind="state"
                                /></template>
                            </ListOptions>
                        </Select.List>
                    </template>
                    <ListOptions
                        v-else
                        :parts="Select"
                        :groups="groups"
                        :classes="listClasses"
                        :checkbox="checkboxes"
                        :loading="listLoading"
                        :loading-text="loadingText ?? translations.common.loading"
                        :has-more="listHasMore"
                        :empty-text="emptyLabel"
                        @load-more="onLoadMore"
                    >
                        <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
                    </ListOptions>
                </Select.Content>
            </Select.Positioner>
        </Teleport>
        <Select.HiddenSelect />
    </Select.Root>
</template>
