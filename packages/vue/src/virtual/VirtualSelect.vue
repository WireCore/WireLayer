<script setup lang="ts" generic="T = SelectItem, V = ItemValueOf<T>">
import { createListCollection } from '@ark-ui/vue/collection';
import { useFieldContext } from '@ark-ui/vue/field';
import { Select } from '@ark-ui/vue/select';
import { Check, ChevronDown, LoaderCircle, X } from '@lucide/vue';
import { useVirtualizer } from '@tanstack/vue-virtual';
import {
    controlIds,
    select as selectRecipe,
    virtualList as virtualListRecipe,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, onMounted, ref, useAttrs, useId, watch } from 'vue';
import type { SelectItem, SelectSize } from '../components/Select/types.js';
import { splitAttrs } from '../utils/attrs.js';
import { useListOptions, useListSelection } from '../utils/list.js';
import { useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';
import { useOptionSource } from '../utils/data-source.js';

export interface VirtualSelectProps<T = SelectItem, V = ItemValueOf<T>> {
    /** Any number of items – only the visible options are rendered */
    items: readonly T[];
    /** Selected value – use with v-model; any type (string, number, boolean, object) */
    modelValue?: V | null;
    defaultValue?: V | null;
    placeholder?: string;
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
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** Button that clears the value (also Backspace/Delete on the closed field) */
    clearable?: boolean;
    /** Shows a spinner in the field and "Loading" in the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row in the list */
    loadingText?: string;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: SelectSize;
    /** Search field at the top of the list; filters by label, ignoring case and accents */
    filter?: boolean;
    /** The items are filtered elsewhere (server): no local filtering, listen to filterChange */
    manualFilter?: boolean;
    /** Shown when no item is left (default "No results" / "No entries") */
    emptyText?: string;
    /** More items can be loaded: reaching the end of the list emits loadMore (endless list) */
    hasMore?: boolean;
    /**
     * Loads the items from a server instead of `items`: the first page when it opens, more while scrolling, the search
     * field asks the server (after a typing pause); labels of chosen values that are not loaded come from
     * `getItemsByKeys`
     */
    dataSource?: DataSource<T>;
    /** Items per request of the data source (default 50) */
    pageSize?: number;
    /** Fewest characters the search needs before the data source is asked */
    minSearchLength?: number;
    /** Id of the field (the trigger), e.g. for a `<label for>` */
    id?: string;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<VirtualSelectProps<T, V>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    disabled: undefined,
    invalid: undefined,
    required: undefined,
    dataSource: undefined,
});
const select = useRecipe('select', selectRecipe);
const virtualList = useRecipe('virtualList', virtualListRecipe);
const emit = defineEmits<{
    'update:modelValue': [value: V | null];
    /** Text of the search field (filter) – e.g. to load matching items from a server (manualFilter) */
    filterChange: [text: string];
    /** The end of the list was reached (hasMore) */
    loadMore: [];
}>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = computed(() => select({ size: props.size, clearable: props.clearable }));
const list = virtualList();
const t = translations.select;

// No groups: the rows are positioned one below the other
const accessors = computed(() => ({
    itemValue: props.itemValue,
    itemLabel: props.itemLabel,
    itemDisabled: props.itemDisabled,
    itemGroup: () => undefined,
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
const { options, visible: rows } = useListOptions(
    () => source.items.value,
    () => accessors.value,
    () => (props.filter && !props.manualFilter && !props.dataSource ? query.value : '')
);
const known = computed(() => [...options.value, ...source.resolvedOptions.value]);
const { selected, keys, commit, commitKeys } = useListSelection<T>({
    multiple: false,
    model: () => props.modelValue,
    defaultValue: props.defaultValue,
    accessors: () => accessors.value,
    items: known,
    emit: (value) => emit('update:modelValue', value as V | null),
    // Without a data source and loaded: a value outside the items warns in development
    check: { component: 'VirtualSelect', ready: () => !props.dataSource && !props.loading && props.items.length > 0 },
});
const current = computed(() => selected.value[0]);
const collection = computed(() =>
    createListCollection({
        items: rows.value,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.key,
        isItemDisabled: (item) => item.disabled,
    })
);
const listId = useId();

const content = ref<{ $el?: HTMLElement } | HTMLElement | null>(null);
const scroller = ref<{ $el?: HTMLElement } | HTMLElement | null>(null);
// No instanceof HTMLElement – it does not exist during server-side rendering
const element = (value: { $el?: HTMLElement } | HTMLElement | null) => {
    if (!value) return null;
    return '$el' in value ? (value.$el ?? null) : (value as HTMLElement);
};
// With a search field the list below it scrolls, otherwise the whole popup. Rows are 36px high (h-9)
const virtualizer = useVirtualizer(
    computed(() => ({
        count: rows.value.length,
        getScrollElement: () => element(props.filter ? scroller.value : content.value),
        estimateSize: () => 36,
        overscan: 8,
        // Render the first page before the list is measured (no empty flash on open, SSR)
        initialRect: { width: 0, height: 288 },
    }))
);
// A chosen value that is not loaded gets its label from the data source
onMounted(() => source.resolve(keys.value, known.value));
watch(keys, (next) => source.resolve(next, known.value));
const busy = computed(() => props.loading || source.loading.value);
const more = computed(() => props.hasMore || source.hasMore.value);
// Endless list: the last rendered row is near the end
const lastIndex = computed(() => virtualizer.value.getVirtualItems().at(-1)?.index ?? -1);
watch([lastIndex, () => rows.value.length, busy, more], () => {
    if (!more.value || busy.value || !rows.value.length || lastIndex.value < rows.value.length - 1) return;
    if (props.dataSource) source.loadMore();
    else emit('loadMore');
});

interface Api {
    focus(): void;
    setHighlightValue(value: string): void;
    highlightedItem: unknown;
    getItemProps(props: { item: unknown }): { id?: string };
}
function onTriggerKeydown(event: KeyboardEvent) {
    if (!props.clearable || !selected.value.length || (event.key !== 'Backspace' && event.key !== 'Delete')) return;
    event.preventDefault();
    commit([]);
}
function onFilterInput(api: Api, event: Event) {
    query.value = (event.target as HTMLInputElement).value;
    emit('filterChange', query.value);
    if (props.dataSource) source.search(query.value);
    if (props.manualFilter || props.dataSource) return;
    void nextTick(() => {
        const first = rows.value.find((option) => !option.disabled);
        if (first) api.setHighlightValue(first.key);
    });
}
// Space types a space, Home/End move the caret – the list would take them otherwise
function onFilterKeydown(event: KeyboardEvent) {
    if (event.key === ' ' || event.key === 'Home' || event.key === 'End') event.stopPropagation();
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
    <!-- Ark navigates the full collection; scrollToIndexFn brings the highlighted option into the rendered window -->
    <Select.Root
        :class="styles.base({ class: split.className })"
        :style="split.style"
        :collection="collection"
        :model-value="keys"
        :disabled="disabled"
        :invalid="invalid"
        :required="required"
        :name="name"
        :positioning="listPositioning"
        :composite="!filter"
        v-bind="ids"
        :scroll-to-index-fn="
            (details: { index: number }) => virtualizer.scrollToIndex(details.index, { align: 'auto' })
        "
        @value-change="commitKeys($event.value, $event.items as ListOption<T>[])"
        @open-change="onOpenChange($event.open)"
    >
        <!-- No class attribute without a clear button (unchanged DOM) -->
        <Select.Control v-bind="clearable ? { class: styles.control() } : {}">
            <Select.Trigger
                v-bind="split.rest"
                :class="styles.trigger()"
                :aria-busy="busy || undefined"
                @keydown="onTriggerKeydown"
            >
                <span :class="styles.value()">
                    <component :is="current.icon" v-if="current?.icon" :class="styles.icon()" aria-hidden="true" />
                    <Select.ValueText :placeholder="placeholder ?? translations.common.placeholder">
                        <template v-if="current" #default>{{ current.label }}</template>
                    </Select.ValueText>
                </span>
                <Select.Indicator :class="styles.indicator()">
                    <LoaderCircle v-if="busy" :class="styles.spinner()" aria-hidden="true" />
                    <ChevronDown v-else :class="styles.indicatorIcon()" aria-hidden="true" />
                </Select.Indicator>
            </Select.Trigger>
            <Select.Context v-if="clearable" v-slot="api">
                <!-- Not a tab stop: Backspace/Delete on the field clears, too -->
                <button
                    v-if="current && !api.disabled"
                    type="button"
                    tabindex="-1"
                    :class="styles.clear()"
                    :aria-label="t.clear"
                    @click="
                        commit([]);
                        api.focus();
                    "
                >
                    <X :class="styles.clearIcon()" aria-hidden="true" />
                </button>
            </Select.Context>
        </Select.Control>
        <Teleport to="body">
            <Select.Positioner>
                <Select.Content
                    ref="content"
                    :class="styles.content()"
                    :aria-busy="busy || undefined"
                    :aria-label="filter ? (split.rest['aria-label'] as string | undefined) : undefined"
                >
                    <div v-if="filter" :class="styles.header()">
                        <Select.Context v-slot="api">
                            <input
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
                    </div>
                    <Select.List
                        v-if="filter"
                        :id="listId"
                        ref="scroller"
                        :class="styles.list({ class: list.scroll() })"
                    >
                        <div :class="list.spacer()" :style="{ height: `${virtualizer.getTotalSize()}px` }">
                            <Select.Item
                                v-for="row in virtualizer.getVirtualItems()"
                                :key="String(row.key)"
                                :item="rows[row.index]!"
                                :class="styles.item({ class: list.item() })"
                                :style="{ transform: `translateY(${row.start}px)` }"
                                :aria-setsize="rows.length"
                                :aria-posinset="row.index + 1"
                            >
                                <component
                                    :is="rows[row.index]!.icon"
                                    v-if="rows[row.index]!.icon"
                                    :class="styles.icon()"
                                    aria-hidden="true"
                                />
                                <Select.ItemText :class="styles.itemText()">{{
                                    rows[row.index]!.label
                                }}</Select.ItemText>
                                <Select.ItemIndicator>
                                    <Check :class="styles.itemIndicator()" aria-hidden="true" />
                                </Select.ItemIndicator>
                            </Select.Item>
                        </div>
                        <div v-if="busy" :class="styles.loading()">
                            <LoaderCircle :class="styles.loadingIcon()" aria-hidden="true" />
                            {{ loadingText ?? translations.common.loading }}
                        </div>
                        <!-- A disabled option, so the listbox is never empty -->
                        <div v-if="!rows.length && !busy" role="option" aria-disabled="true" :class="styles.empty()">
                            {{
                                emptyText ??
                                source.emptyText.value ??
                                (query ? translations.common.noResults : translations.common.empty)
                            }}
                        </div>
                    </Select.List>
                    <template v-else>
                        <div :class="list.spacer()" :style="{ height: `${virtualizer.getTotalSize()}px` }">
                            <Select.Item
                                v-for="row in virtualizer.getVirtualItems()"
                                :key="String(row.key)"
                                :item="rows[row.index]!"
                                :class="styles.item({ class: list.item() })"
                                :style="{ transform: `translateY(${row.start}px)` }"
                                :aria-setsize="rows.length"
                                :aria-posinset="row.index + 1"
                            >
                                <component
                                    :is="rows[row.index]!.icon"
                                    v-if="rows[row.index]!.icon"
                                    :class="styles.icon()"
                                    aria-hidden="true"
                                />
                                <Select.ItemText :class="styles.itemText()">{{
                                    rows[row.index]!.label
                                }}</Select.ItemText>
                                <Select.ItemIndicator>
                                    <Check :class="styles.itemIndicator()" aria-hidden="true" />
                                </Select.ItemIndicator>
                            </Select.Item>
                        </div>
                        <div v-if="busy" :class="styles.loading()">
                            <LoaderCircle :class="styles.loadingIcon()" aria-hidden="true" />
                            {{ loadingText ?? translations.common.loading }}
                        </div>
                        <!-- A disabled option, so the listbox is never empty -->
                        <div v-if="!rows.length && !busy" role="option" aria-disabled="true" :class="styles.empty()">
                            {{
                                emptyText ??
                                source.emptyText.value ??
                                (query ? translations.common.noResults : translations.common.empty)
                            }}
                        </div>
                    </template>
                </Select.Content>
            </Select.Positioner>
        </Teleport>
        <Select.HiddenSelect />
        <span v-if="dataSource" role="status" :class="styles.status()">{{ source.announcement.value }}</span>
    </Select.Root>
</template>
