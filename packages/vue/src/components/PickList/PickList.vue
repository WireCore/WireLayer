<script setup lang="ts" generic="T = ListboxItem, V = ItemValueOf<T>">
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue';
import {
    listValueKey,
    pickList as pickListRecipe,
    toListOptions,
    type ItemAccessor,
    type ItemValueOf,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, shallowRef, useAttrs, type Ref } from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import Listbox, { type ListboxItem } from '../Listbox/Listbox.vue';
import type { ListItemState } from '../Select/types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface PickListProps<T = ListboxItem, V = ItemValueOf<T>> {
    /** All items: ListboxItem objects – or any objects or values, read with itemValue/itemLabel/itemDisabled */
    items: readonly T[];
    /** Values of the chosen items, in their order – use with v-model; any type (see `valueKey`) */
    modelValue?: V[];
    defaultValue?: V[];
    sourceLabel?: string;
    targetLabel?: string;
    /** Value of an item: property name or function (default: `value`, otherwise the item itself) */
    itemValue?: ItemAccessor<T, V>;
    /** Label of an item: property name or function (default: `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of an item: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** A search field above each list */
    filter?: boolean;
    /**
     * The source list is searched elsewhere (server): no local filtering there, listen to filterChange and pass the
     * found items; chosen items keep their labels
     */
    manualFilter?: boolean;
    /** The source list is loading (aria-busy, "Loading") */
    loading?: boolean;
    /** More items can be loaded into the source list: scrolling to its end emits loadMore */
    hasMore?: boolean;
    /** Check boxes and "Select all" in each list */
    selectAll?: boolean;
    /** Items can be dragged from one list to the other (the buttons stay the keyboard way) */
    draggable?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof pickListRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<PickListProps<T, V>>(), {
    modelValue: undefined,
    defaultValue: () => [],
    filter: false,
    selectAll: false,
    draggable: false,
});
const pickList = useRecipe('pickList', pickListRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [values: V[]];
    /** Text of the search field of the source list – e.g. to load matching items from a server (manualFilter) */
    filterChange: [text: string];
    /** The end of the source list was scrolled into view (hasMore) */
    loadMore: [];
}>();
defineSlots<{
    /** Content of an item in both lists (instead of icon and label) */
    item?(props: { item: T } & ListItemState): unknown;
}>();
const attrs = useAttrs();
const styles = pickList();
const t = translations.pickList;
const sourceText = computed(() => props.sourceLabel ?? t.source);
const targetText = computed(() => props.targetLabel ?? t.target);

const accessors = computed(() => ({
    itemValue: props.itemValue,
    itemLabel: props.itemLabel,
    itemDisabled: props.itemDisabled,
    valueKey: props.valueKey,
}));
const keyOf = (value: unknown) => listValueKey(value, props.valueKey);
const options = computed(() => toListOptions(props.items, accessors.value));
const internal = ref(props.defaultValue) as Ref<V[]>;
const chosen = computed(() => props.modelValue ?? internal.value);
const chosenKeys = computed(() => new Set(chosen.value.map(keyOf)));
const byKey = computed(() => new Map(options.value.map((option) => [option.key, option])));
const source = computed(() => options.value.filter((option) => !chosenKeys.value.has(option.key)));
// Options of chosen values – they stay when the items change (search on a server)
const remembered = shallowRef(
    new Map(
        chosen.value.flatMap((value) =>
            byKey.value.has(keyOf(value)) ? [[keyOf(value), byKey.value.get(keyOf(value))!] as const] : []
        )
    )
);
const target = computed(() =>
    chosen.value
        .map((value) => byKey.value.get(keyOf(value)) ?? remembered.value.get(keyOf(value)))
        .filter((option) => option !== undefined)
);
const sourceItems = computed(() => source.value.map((option) => option.item));
const targetItems = computed(() => target.value.map((option) => option.item));
const sourceSelection = ref<V[]>([]) as Ref<V[]>;
const targetSelection = ref<V[]>([]) as Ref<V[]>;
const status = ref('');

function set(next: V[], moved: number, to: string) {
    internal.value = next;
    emit('update:modelValue', next);
    status.value = t.moved(moved, to);
}
function add(values: V[]) {
    if (!values.length) return;
    if (props.manualFilter) {
        const next = new Map(remembered.value);
        for (const value of values) {
            const option = byKey.value.get(keyOf(value));
            if (option) next.set(option.key, option);
        }
        remembered.value = next;
    }
    set(
        [...chosen.value, ...values.filter((value) => !chosenKeys.value.has(keyOf(value)))],
        values.length,
        targetText.value
    );
    sourceSelection.value = [];
}
function remove(values: V[]) {
    if (!values.length) return;
    const removed = new Set(values.map(keyOf));
    set(
        chosen.value.filter((value) => !removed.has(keyOf(value))),
        values.length,
        sourceText.value
    );
    targetSelection.value = [];
}

// Dragging: the dragged item – with the other chosen ones of its list, if it is one of them
const dragFrom = ref<'source' | 'target' | null>(null);
const dragged = ref<V[]>([]) as Ref<V[]>;
const dropOn = ref<'source' | 'target' | null>(null);
function onDragStart(list: 'source' | 'target', event: DragEvent) {
    const key = (event.target as HTMLElement).closest<HTMLElement>('[data-part="item"]')?.dataset.value;
    const option = key === undefined ? undefined : byKey.value.get(key);
    if (!option) return;
    const selection = list === 'source' ? sourceSelection.value : targetSelection.value;
    const keys = new Set(selection.map(keyOf));
    dragFrom.value = list;
    dragged.value = keys.has(option.key) ? selection : [option.value as V];
    event.dataTransfer?.setData('text/plain', option.label);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
function onDragOver(list: 'source' | 'target', event: DragEvent) {
    if (!dragFrom.value || dragFrom.value === list) return;
    event.preventDefault();
    dropOn.value = list;
}
function onDrop(list: 'source' | 'target', event: DragEvent) {
    if (!dragFrom.value || dragFrom.value === list) return;
    event.preventDefault();
    if (list === 'target') add(dragged.value);
    else remove(dragged.value);
    onDragEnd();
}
function onDragEnd() {
    dragFrom.value = null;
    dropOn.value = null;
    dragged.value = [];
}
// Ark's options prevent the default of mousedown (keeps the focus in the list) – that would stop the browser from
// starting a drag; the press goes to the list instead, which takes the focus itself
function letDrag(event: MouseEvent) {
    if ((event.target as HTMLElement).closest('[draggable="true"]')) event.stopPropagation();
}
const listProps = computed(() => ({
    ...accessors.value,
    multiple: true,
    filter: props.filter,
    checkboxes: props.selectAll,
    selectAll: props.selectAll,
    draggableItems: props.draggable,
}));
// Server search in the source list only
const sourceServer = computed(() => ({
    manualFilter: props.manualFilter,
    loading: props.loading,
    hasMore: props.hasMore,
}));
</script>

<template>
    <!-- Two lists with several choices each; the buttons move the chosen items across, the move is announced -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <div
            v-if="draggable"
            :class="styles.dropZone()"
            :data-drop="dropOn === 'source' || undefined"
            @mousedown.capture="letDrag"
            @dragstart="onDragStart('source', $event)"
            @dragover="onDragOver('source', $event)"
            @dragleave="dropOn = null"
            @drop="onDrop('source', $event)"
            @dragend="onDragEnd"
        >
            <Listbox
                v-model="sourceSelection"
                :items="sourceItems"
                :label="sourceText"
                v-bind="{ ...listProps, ...sourceServer }"
                @filter-change="emit('filterChange', $event)"
                @load-more="emit('loadMore')"
            >
                <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
            </Listbox>
        </div>
        <Listbox
            v-else
            v-model="sourceSelection"
            :items="sourceItems"
            :label="sourceText"
            v-bind="{ ...listProps, ...sourceServer }"
            @filter-change="emit('filterChange', $event)"
            @load-more="emit('loadMore')"
        >
            <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
        </Listbox>
        <div :class="styles.controls()">
            <IconButton
                :icon="ChevronRight"
                :label="t.add"
                size="sm"
                :disabled="!sourceSelection.length"
                @click="add(sourceSelection)"
            />
            <IconButton
                :icon="ChevronsRight"
                :label="t.addAll"
                size="sm"
                :disabled="!source.length"
                @click="add(source.map((option) => option.value as V))"
            />
            <IconButton
                :icon="ChevronLeft"
                :label="t.remove"
                size="sm"
                :disabled="!targetSelection.length"
                @click="remove(targetSelection)"
            />
            <IconButton
                :icon="ChevronsLeft"
                :label="t.removeAll"
                size="sm"
                :disabled="!target.length"
                @click="remove(chosen)"
            />
        </div>
        <div
            v-if="draggable"
            :class="styles.dropZone()"
            :data-drop="dropOn === 'target' || undefined"
            @mousedown.capture="letDrag"
            @dragstart="onDragStart('target', $event)"
            @dragover="onDragOver('target', $event)"
            @dragleave="dropOn = null"
            @drop="onDrop('target', $event)"
            @dragend="onDragEnd"
        >
            <Listbox v-model="targetSelection" :items="targetItems" :label="targetText" v-bind="listProps">
                <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
            </Listbox>
        </div>
        <Listbox v-else v-model="targetSelection" :items="targetItems" :label="targetText" v-bind="listProps">
            <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
        </Listbox>
        <p role="status" :class="styles.status()">{{ status }}</p>
    </div>
</template>
