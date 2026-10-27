<script setup lang="ts" generic="T = SelectItem, V = ItemValueOf<T>">
import { createListCollection } from '@ark-ui/vue/collection';
import { useFieldContext } from '@ark-ui/vue/field';
import { Select } from '@ark-ui/vue/select';
import { ChevronDown, LoaderCircle, X } from '@lucide/vue';
import {
    controlIds,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
    type RecipeClasses,
    select as selectRecipe,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, onMounted, ref, useAttrs, useId, watch } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useOptionSource } from '../../utils/data-source.js';
import { useListOptions, useListSelection } from '../../utils/list.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import ListOptions from './ListOptions.vue';
import type { ListItemState, SelectItem, SelectSize } from './types.js';

export interface SelectProps<T = SelectItem, V = ItemValueOf<T>> {
    /** Options: SelectItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled/itemGroup */
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
    /** Group heading of an item: property name or function (default: `group`); items are listed per group */
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    /**
     * More text the search finds an item by, besides its label: property name or function, one text or a list
     * (default: `keywords`), e.g. the name of the item's category
     */
    itemKeywords?: ItemAccessor<T, string | readonly string[] | null | undefined>;
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
     * typing pause, outdated answers dropped); `getItemsByKeys` gives the label of a chosen value that is not loaded
     */
    dataSource?: DataSource<T>;
    /** Fewest characters the search needs before the data source is asked */
    minSearchLength?: number;
    /** Options per request of the data source (default 50) */
    pageSize?: number;
    /** Not labelled by a surrounding Field – for a second control inside it (e.g. PhoneInput's country) */
    standalone?: boolean;
    /** Id of the field (the trigger), e.g. for a `<label for>` */
    id?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof selectRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<SelectProps<T, V>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const select = useRecipe('select', selectRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [value: V | null];
    /** Text of the search field (filter) – e.g. to load matching items from a server (manualFilter) */
    filterChange: [text: string];
    /** The end of the list was scrolled into view (hasMore) */
    loadMore: [];
}>();
defineSlots<{
    /** Content of an option (instead of icon and label) */
    item?(props: { item: T } & ListItemState): unknown;
    /** Content of the field for the selected item */
    value?(props: { item: T }): unknown;
}>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = computed(() => select({ size: props.size, clearable: props.clearable }));
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
const { options, groups, ordered } = useListOptions(
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
    check: { component: 'Select', ready: () => !props.dataSource && !props.loading && props.items.length > 0 },
});
// A chosen value that is not loaded gets its label from the data source
onMounted(() => source.resolve(keys.value, known.value));
watch(keys, (next) => source.resolve(next, known.value));
const listLoading = computed(() => props.loading || source.loading.value);
const listHasMore = computed(() => props.hasMore || source.hasMore.value);
function onLoadMore() {
    if (props.dataSource) source.loadMore();
    else emit('loadMore');
}
const current = computed(() => selected.value[0]);
const collection = computed(() =>
    createListCollection({
        items: ordered.value,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.key,
        isItemDisabled: (item) => item.disabled,
    })
);
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
}));

interface Api {
    focus(): void;
    setHighlightValue(value: string): void;
    highlightedItem: unknown;
    getItemProps(props: { item: unknown }): { id?: string };
}
function clear(api: Api) {
    commit([]);
    api.focus();
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
    // Highlight the first match, so Enter takes it (once the list shows it)
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
    controlIds(
        props.id,
        'trigger',
        { label: field?.value.ids.label, hiddenSelect: field?.value.ids.control },
        props.standalone
    )
);
</script>

<template>
    <!-- Dropdown list for one option: arrow keys, typeahead, Escape; native select hidden for forms -->
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
        lazy-mount
        unmount-on-exit
        @value-change="commitKeys($event.value, $event.items as ListOption<T>[])"
        @open-change="onOpenChange($event.open)"
    >
        <!-- No class attribute without a clear button (unchanged DOM) -->
        <Select.Control v-bind="clearable ? { class: styles.control() } : {}">
            <Select.Trigger
                v-bind="split.rest"
                :class="styles.trigger()"
                :aria-busy="loading || undefined"
                @keydown="onTriggerKeydown"
            >
                <span :class="styles.value()">
                    <slot v-if="$slots.value && current" name="value" :item="current.item" />
                    <template v-else>
                        <component :is="current.icon" v-if="current?.icon" :class="styles.icon()" aria-hidden="true" />
                        <Select.ValueText :placeholder="placeholder ?? translations.common.placeholder">
                            <template v-if="current" #default>{{ current.label }}</template>
                        </Select.ValueText>
                    </template>
                </span>
                <Select.Indicator :class="styles.indicator()">
                    <LoaderCircle v-if="loading" :class="styles.spinner()" aria-hidden="true" />
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
                    @click="clear(api)"
                >
                    <X :class="styles.clearIcon()" aria-hidden="true" />
                </button>
            </Select.Context>
        </Select.Control>
        <Teleport to="body">
            <Select.Positioner>
                <Select.Content
                    :class="styles.content()"
                    :aria-busy="listLoading || undefined"
                    :aria-label="filter ? (split.rest['aria-label'] as string | undefined) : undefined"
                >
                    <!-- With a search field the popup is a dialog: search field, then the list -->
                    <template v-if="filter">
                        <div :class="styles.header()">
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
                        <Select.List :id="listId" :class="styles.list()">
                            <ListOptions
                                :parts="Select"
                                :groups="groups"
                                :classes="listClasses"
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
        <span v-if="dataSource" role="status" :class="styles.status()">{{ source.announcement.value }}</span>
    </Select.Root>
</template>
