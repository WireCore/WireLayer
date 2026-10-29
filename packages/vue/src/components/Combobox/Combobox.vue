<script setup lang="ts" generic="T = SelectItem, V = ItemValueOf<T>">
import { createListCollection } from '@ark-ui/vue/collection';
import { Combobox } from '@ark-ui/vue/combobox';
import { useFieldContext } from '@ark-ui/vue/field';
import { ChevronDown, LoaderCircle, X } from '@lucide/vue';
import {
    controlIds,
    combobox as comboboxRecipe,
    type DataSource,
    type ItemAccessor,
    type ItemValueOf,
    type ListOption,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, onMounted, ref, useAttrs, watch } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useOptionSource } from '../../utils/data-source.js';
import { useListOptions, useListSelection } from '../../utils/list.js';
import ListOptions from '../Select/ListOptions.vue';
import type { ListItemState, SelectItem, SelectSize } from '../Select/types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ComboboxProps<T = SelectItem, V = ItemValueOf<T>> {
    /** Options: SelectItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled/itemGroup */
    items: readonly T[];
    /** Chosen value – use with v-model; any type (string, number, boolean, object) */
    modelValue?: V | null;
    defaultValue?: V | null;
    /** Filters the items by the typed text (label and itemKeywords; ignores case and accents) */
    filter?: boolean;
    /** The items are filtered elsewhere (server): no local filtering, listen to filterChange */
    manualFilter?: boolean;
    /**
     * Typed text that matches no item becomes the value (a string) on Enter or when leaving the field – an editable
     * select
     */
    allowCustomValue?: boolean;
    /** Shown when nothing matches */
    emptyText?: string;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
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
    /** Button that clears value and text (default true; not a tab stop – the text can be deleted, too) */
    clearable?: boolean;
    /** Shows a spinner in the field and "Loading" in the list (aria-busy) */
    loading?: boolean;
    /** Text of the loading row in the list */
    loadingText?: string;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: SelectSize;
    /** More items can be loaded: scrolling to the end of the list emits loadMore */
    hasMore?: boolean;
    /**
     * Loads the options for the typed text (after a typing pause, outdated answers dropped; pages while
     * scrolling); `getItemsByKeys` gives the label of a chosen value that is not loaded
     */
    dataSource?: DataSource<T>;
    /** Fewest characters typed before the data source is asked */
    minSearchLength?: number;
    /** Options per request of the data source (default 50) */
    pageSize?: number;
    /** Id of the input, e.g. for a `<label for>` */
    id?: string;
    /** Whether the list is open – use with v-model:open, or listen to update:open */
    open?: boolean;
    /**
     * Keeps the keys the open list handles itself (Enter choosing, Escape closing, Tab leaving) from bubbling up – e.g.
     * in a dialog with window shortcuts for Enter (save) and Escape (cancel)
     */
    stopKeyPropagation?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof comboboxRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<ComboboxProps<T, V>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    filter: true,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
    clearable: true,
    open: undefined,
});
const combobox = useRecipe('combobox', comboboxRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [value: V | null];
    /** Every change of the text (typing, choosing, clearing) */
    inputValueChange: [inputValue: string];
    /** Typed text – e.g. to load matching items from a server (manualFilter) */
    filterChange: [text: string];
    /** The end of the list was scrolled into view (hasMore) */
    loadMore: [];
    /** The list opened or closed */
    'update:open': [open: boolean];
}>();
defineSlots<{
    /** Content of an option (instead of icon and label) */
    item?(props: { item: T } & ListItemState): unknown;
}>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = computed(() => combobox({ size: props.size }));

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
    check: {
        component: 'Combobox',
        ready: () => !props.dataSource && !props.loading && props.items.length > 0 && !props.allowCustomValue,
    },
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
// The list's keys stay in the combobox while it is open – also the key that closes it (it closes before the key
// reaches the input), so the state drops only after the event
let isOpen = false;
let listOpen = false;
function onOpenChange(open: boolean) {
    emit('update:open', open);
    isOpen = open;
    if (open) listOpen = true;
    else setTimeout(() => (listOpen = isOpen));
    if (open && !editing.value) source.open();
}
const collection = computed(() =>
    createListCollection({
        items: ordered.value,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.key,
        isItemDisabled: (item) => item.disabled,
    })
);
// The text shows the label of the value – also when it is not among the items (server search, own entries) –
// except while typing
const editing = ref(false);
const draft = ref('');
const text = computed(() => (editing.value ? draft.value : (selected.value[0]?.label ?? '')));
const highlighted = ref<string | null>(null);
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

function onInput(details: { inputValue: string; reason?: string }) {
    // Only typing filters; choosing an item or clearing shows all items again
    const typing = details.reason === 'input-change';
    query.value = typing ? details.inputValue : '';
    editing.value = typing;
    draft.value = details.inputValue;
    emit('inputValueChange', details.inputValue);
    if (typing) emit('filterChange', details.inputValue);
    if (typing && props.dataSource) source.search(details.inputValue);
}
/** allowCustomValue: the typed text becomes the value – the matching item, the text itself or nothing */
function commitText() {
    if (!props.allowCustomValue || !editing.value) return;
    editing.value = false;
    const typed = draft.value.trim();
    const lower = typed.toLocaleLowerCase();
    const match = options.value.find((option) => option.label.toLocaleLowerCase() === lower);
    if (match && match.key === selected.value[0]?.key) return;
    commit(
        !typed
            ? []
            : [match ?? ({ key: typed, value: typed, label: typed, disabled: false, item: typed } as ListOption<T>)]
    );
}
function onKeydown(event: KeyboardEvent) {
    if (props.stopKeyPropagation && (listOpen || props.open) && ['Enter', 'Escape', 'Tab'].includes(event.key))
        event.stopPropagation();
    if (event.key === 'Enter' && !highlighted.value) commitText();
}
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const listPositioning = { sameWidth: true, gutter: 4 } as const;
// An own id goes to the input through Ark (it finds the input by its id)
const field = useFieldContext();
const ids = computed(() =>
    controlIds(props.id, 'input', { label: field?.value.ids.label, input: field?.value.ids.control })
);
</script>

<template>
    <!-- Text field with suggestions (autocomplete): type to filter, arrow keys to choose, Enter to take -->
    <Combobox.Root
        :class="styles.base({ class: split.className })"
        :style="split.style"
        :collection="collection"
        :model-value="keys"
        :input-value="text"
        :allow-custom-value="allowCustomValue"
        :disabled="disabled"
        :read-only="readOnly"
        :invalid="invalid"
        :required="required"
        :name="name"
        :placeholder="placeholder"
        :positioning="listPositioning"
        :translations="translations.combobox"
        :open="open"
        v-bind="ids"
        lazy-mount
        unmount-on-exit
        @value-change="commitKeys($event.value, $event.items as ListOption<T>[])"
        @input-value-change="onInput"
        @highlight-change="highlighted = $event.highlightedValue"
        @open-change="onOpenChange($event.open)"
    >
        <Combobox.Control :class="styles.control()">
            <Combobox.Input
                v-bind="split.rest"
                :class="styles.input()"
                :aria-busy="loading || undefined"
                @blur="commitText"
                @keydown="onKeydown"
            />
            <Combobox.ClearTrigger v-if="clearable" :class="styles.clear()">
                <X :class="styles.clearIcon()" aria-hidden="true" />
            </Combobox.ClearTrigger>
            <Combobox.Trigger :class="styles.trigger()">
                <LoaderCircle v-if="loading" :class="styles.spinner()" aria-hidden="true" />
                <ChevronDown v-else :class="styles.triggerIcon()" aria-hidden="true" />
            </Combobox.Trigger>
        </Combobox.Control>
        <Teleport to="body">
            <Combobox.Positioner>
                <Combobox.Content :class="styles.content()" :aria-busy="listLoading || undefined">
                    <Combobox.Empty v-if="!listLoading" :class="styles.empty()">{{
                        emptyText ?? source.emptyText.value ?? translations.common.noResults
                    }}</Combobox.Empty>
                    <ListOptions
                        :parts="Combobox"
                        :groups="groups"
                        :classes="listClasses"
                        :loading="listLoading"
                        :loading-text="loadingText ?? translations.common.loading"
                        :has-more="listHasMore"
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
