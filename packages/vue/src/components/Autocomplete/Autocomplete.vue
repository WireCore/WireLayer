<script setup lang="ts" generic="T = string">
import { createListCollection } from '@ark-ui/vue/collection';
import { Combobox } from '@ark-ui/vue/combobox';
import { LoaderCircle, X } from '@lucide/vue';
import {
    combobox as comboboxRecipe,
    type DataSource,
    type ItemAccessor,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, ref, useAttrs } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useOptionSource } from '../../utils/data-source.js';
import { useListOptions } from '../../utils/list.js';
import ListOptions from '../Select/ListOptions.vue';
import type { ListItemState, SelectSize } from '../Select/types.js';
import TagsInput from '../TagsInput/TagsInput.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface AutocompleteProps<T = string> {
    /** Suggestions while typing – any other text is allowed, too; strings or objects (read with itemLabel) */
    items: readonly T[];
    /** The text – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Several entries as chips (a TagsInput with these suggestions) – use with v-model:values */
    multiple?: boolean;
    /** The entries with `multiple` – use with v-model:values */
    values?: string[];
    defaultValues?: string[];
    /** Most entries with `multiple` */
    max?: number;
    /** Filters the suggestions by the typed text (ignores case and accents) */
    filter?: boolean;
    /** The suggestions are filtered elsewhere (server): no local filtering, listen to filterChange */
    manualFilter?: boolean;
    /** Text of a suggestion: property name or function (default: `label`, or the item itself) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of a suggestion: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Group heading of a suggestion: property name or function (default: `group`) */
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    /** Button that clears the text (not a tab stop – the text can be deleted, too) */
    clearable?: boolean;
    /** Shows a spinner in the field and "Loading" in the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row in the list */
    loadingText?: string;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: SelectSize;
    /** More suggestions can be loaded: scrolling to the end of the list emits loadMore */
    hasMore?: boolean;
    /** Loads the suggestions for the typed text (after a typing pause, outdated answers dropped) */
    dataSource?: DataSource<T>;
    /** Fewest characters typed before the data source is asked */
    minSearchLength?: number;
    /** Suggestions per request of the data source (default 50) */
    pageSize?: number;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof comboboxRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<AutocompleteProps<T>>(), {
    modelValue: undefined,
    defaultValue: '',
    values: undefined,
    defaultValues: undefined,
    filter: true,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
});
const combobox = useRecipe('combobox', comboboxRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [value: string];
    /** The entries with `multiple` */
    'update:values': [values: string[]];
    /** Typed text – e.g. to load matching suggestions from a server (manualFilter) */
    filterChange: [text: string];
    /** The end of the list was scrolled into view (hasMore) */
    loadMore: [];
}>();
defineSlots<{
    /** Content of a suggestion (instead of its text) */
    item?(props: { item: T } & ListItemState): unknown;
}>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = computed(() => combobox({ size: props.size }));

const internal = ref(props.defaultValue);
const text = computed(() => props.modelValue ?? internal.value);
// A suggestion's value is its text
function labelOf(item: T): string {
    const accessor = props.itemLabel;
    if (typeof accessor === 'function') return accessor(item);
    if (typeof item === 'object' && item !== null)
        return String((item as Record<string, unknown>)[accessor ?? 'label'] ?? '');
    return String(item);
}
const accessors = computed(() => ({
    itemValue: labelOf,
    itemLabel: labelOf,
    itemDisabled: props.itemDisabled,
    itemGroup: props.itemGroup,
}));
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
    () => (props.filter && !props.manualFilter && !props.dataSource ? text.value : '')
);
const listLoading = computed(() => props.loading || source.loading.value);
const listHasMore = computed(() => props.hasMore || source.hasMore.value);
function onLoadMore() {
    if (props.dataSource) source.loadMore();
    else emit('loadMore');
}
function onFilter(value: string) {
    emit('filterChange', value);
    if (props.dataSource) source.search(value);
}
const collection = computed(() =>
    createListCollection({
        items: ordered.value,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.key,
        isItemDisabled: (item) => item.disabled,
    })
);
// The list only opens while there are suggestions – an empty popup would hide nothing useful
const open = ref(false);
const suggestions = computed(() => options.value.filter((option) => !option.disabled).map((option) => option.label));
const listClasses = computed(() => ({
    item: styles.value.item(),
    itemText: styles.value.itemText(),
    icon: styles.value.itemIndicator(),
    itemIndicator: styles.value.itemIndicator(),
    itemBody: styles.value.itemBody(),
    itemDescription: styles.value.itemDescription(),
    group: styles.value.group(),
    groupLabel: styles.value.groupLabel(),
    loading: styles.value.loading(),
    loadingIcon: styles.value.loadingIcon(),
    sentinel: styles.value.sentinel(),
}));

function setText(value: string) {
    internal.value = value;
    emit('update:modelValue', value);
}
function onInput(details: { inputValue: string; reason?: string }) {
    if (details.inputValue === text.value) return;
    setText(details.inputValue);
    if (details.reason === 'input-change') onFilter(details.inputValue);
}
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const listPositioning = { sameWidth: true, gutter: 4 } as const;
</script>

<template>
    <!-- Several entries: chips with suggestions (see TagsInput) -->
    <TagsInput
        v-if="multiple"
        v-bind="attrs"
        :model-value="values"
        :default-value="defaultValues"
        :suggestions="suggestions"
        :filter="filter"
        :manual-filter="manualFilter"
        :loading="listLoading"
        :loading-text="loadingText"
        :has-more="listHasMore"
        :max="max"
        :placeholder="placeholder"
        :disabled="disabled"
        :invalid="invalid"
        :name="name"
        @update:model-value="emit('update:values', $event)"
        @filter-change="onFilter"
        @load-more="onLoadMore"
    />
    <!-- Free text with suggestions: type, arrow keys to pick a suggestion, Enter takes it, Escape closes the list -->
    <Combobox.Root
        v-else
        :class="styles.base({ class: split.className })"
        :style="split.style"
        :collection="collection"
        :input-value="text"
        :open="open && (visible.length > 0 || listLoading)"
        allow-custom-value
        :disabled="disabled"
        :read-only="readOnly"
        :invalid="invalid"
        :required="required"
        :name="name"
        :placeholder="placeholder"
        :positioning="listPositioning"
        :translations="translations.combobox"
        lazy-mount
        unmount-on-exit
        @input-value-change="onInput"
        @open-change="open = $event.open"
    >
        <Combobox.Control :class="styles.control()">
            <Combobox.Input v-bind="split.rest" :class="styles.input()" :aria-busy="loading || undefined" />
            <Combobox.Context v-if="clearable" v-slot="api">
                <!-- Not a tab stop: the text can be deleted with the keyboard -->
                <button
                    v-if="text && !api.disabled && !readOnly"
                    type="button"
                    tabindex="-1"
                    :class="styles.clear()"
                    :aria-label="translations.combobox.clearTriggerLabel"
                    @click="
                        setText('');
                        api.focus();
                    "
                >
                    <X :class="styles.clearIcon()" aria-hidden="true" />
                </button>
            </Combobox.Context>
            <span v-if="loading" :class="styles.status()">
                <LoaderCircle :class="styles.spinner()" aria-hidden="true" />
            </span>
        </Combobox.Control>
        <Teleport to="body">
            <Combobox.Positioner>
                <Combobox.Content :class="styles.content()" :aria-busy="listLoading || undefined">
                    <ListOptions
                        :parts="Combobox"
                        :groups="groups"
                        :classes="listClasses"
                        :loading="listLoading"
                        :loading-text="loadingText ?? translations.common.loading"
                        :has-more="listHasMore"
                        no-indicator
                        @load-more="onLoadMore"
                    >
                        <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
                    </ListOptions>
                </Combobox.Content>
            </Combobox.Positioner>
        </Teleport>
        <span v-if="dataSource" role="status" :class="styles.announcer()">{{ source.announcement.value }}</span>
    </Combobox.Root>
</template>
