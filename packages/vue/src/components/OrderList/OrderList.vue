<script setup lang="ts" generic="T = ListboxItem, V = ItemValueOf<T>">
import { ChevronDown, ChevronsDown, ChevronsUp, ChevronUp } from '@lucide/vue';
import {
    listValueKey,
    orderList as orderListRecipe,
    toListOption,
    type ItemAccessor,
    type ItemValueOf,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, type Ref } from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import Listbox, { type ListboxItem } from '../Listbox/Listbox.vue';
import type { ListItemState } from '../Select/types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface OrderListProps<T = ListboxItem, V = ItemValueOf<T>> {
    /** Items in their order – use with v-model; ListboxItem objects or any objects/values (see itemValue/itemLabel) */
    modelValue?: T[];
    defaultValue?: T[];
    /** Visible label of the list */
    label: string;
    /** Value of an item: property name or function (default: `value`, otherwise the item itself) */
    itemValue?: ItemAccessor<T, V>;
    /** Label of an item: property name or function (default: `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Disabled state of an item: property name or function (default: `disabled`) */
    itemDisabled?: ItemAccessor<T, boolean>;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** A search field above the list (moving works on the whole list) */
    filter?: boolean;
    /** Items can be dragged to another place (the buttons and Alt + arrow keys stay the keyboard way) */
    draggable?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof orderListRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<OrderListProps<T, V>>(), {
    modelValue: undefined,
    defaultValue: () => [],
    filter: false,
    draggable: false,
});
const orderList = useRecipe('orderList', orderListRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [items: T[]] }>();
defineSlots<{
    /** Content of an item (instead of icon and label) */
    item?(props: { item: T } & ListItemState): unknown;
}>();
const attrs = useAttrs();
const styles = orderList();
const t = translations.orderList;

const accessors = computed(() => ({
    itemValue: props.itemValue,
    itemLabel: props.itemLabel,
    itemDisabled: props.itemDisabled,
    valueKey: props.valueKey,
}));
const internal = ref(props.defaultValue) as Ref<T[]>;
const items = computed(() => props.modelValue ?? internal.value);
const options = computed(() => items.value.map((item) => toListOption(item, accessors.value)));
const selected = ref<V[]>([]) as Ref<V[]>;
const keyOf = (value: unknown) => listValueKey(value, props.valueKey);
const index = computed(() =>
    selected.value.length ? options.value.findIndex((option) => option.key === keyOf(selected.value[0])) : -1
);
const status = ref('');

function moveFrom(from: number, to: number) {
    if (from < 0) return;
    const target = Math.max(0, Math.min(items.value.length - 1, to));
    if (target === from) return;
    const moved = options.value[from]!.label;
    const next = [...items.value];
    const [item] = next.splice(from, 1);
    next.splice(target, 0, item!);
    internal.value = next;
    emit('update:modelValue', next);
    status.value = t.moved(moved, target + 1, next.length);
}
const move = (to: number) => moveFrom(index.value, to);
// Alt + arrow keys move the chosen item right in the list
function onKey(event: KeyboardEvent) {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    move(index.value + (event.key === 'ArrowUp' ? -1 : 1));
}

// Ark's options prevent the default of mousedown (keeps the focus in the list) – that would stop the browser from
// starting a drag; the press goes to the list instead, which takes the focus itself
function letDrag(event: MouseEvent) {
    if ((event.target as HTMLElement).closest('[draggable="true"]')) event.stopPropagation();
}
// Dragging: the item goes to the place of the item it is dropped on
const dragKey = ref<string | null>(null);
const dropping = ref(false);
const indexOfKey = (key: string | undefined) => options.value.findIndex((option) => option.key === key);
const itemKey = (event: DragEvent) =>
    (event.target as HTMLElement).closest<HTMLElement>('[data-part="item"]')?.dataset.value;
function onDragStart(event: DragEvent) {
    const key = itemKey(event);
    if (key === undefined) return;
    dragKey.value = key;
    event.dataTransfer?.setData('text/plain', options.value[indexOfKey(key)]?.label ?? key);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
function onDragOver(event: DragEvent) {
    if (dragKey.value === null) return;
    event.preventDefault();
    dropping.value = true;
}
function onDrop(event: DragEvent) {
    if (dragKey.value === null) return;
    event.preventDefault();
    const to = indexOfKey(itemKey(event));
    moveFrom(indexOfKey(dragKey.value), to < 0 ? items.value.length - 1 : to);
    onDragEnd();
}
function onDragEnd() {
    dragKey.value = null;
    dropping.value = false;
}
</script>

<template>
    <!-- Choose an item, then move it with the buttons (or Alt + arrow keys); the new position is announced -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <div
            :class="styles.list({ class: draggable ? styles.dropZone() : undefined })"
            :data-drop="dropping || undefined"
            @keydown="onKey"
            @mousedown.capture="letDrag"
            @dragstart="onDragStart"
            @dragover="onDragOver"
            @dragleave="dropping = false"
            @drop="onDrop"
            @dragend="onDragEnd"
        >
            <Listbox
                v-model="selected"
                :items="items"
                :label="label"
                v-bind="accessors"
                :filter="filter"
                :draggable-items="draggable"
            >
                <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
            </Listbox>
        </div>
        <div :class="styles.controls()">
            <IconButton :icon="ChevronsUp" :label="t.top" size="sm" :disabled="index <= 0" @click="move(0)" />
            <IconButton :icon="ChevronUp" :label="t.up" size="sm" :disabled="index <= 0" @click="move(index - 1)" />
            <IconButton
                :icon="ChevronDown"
                :label="t.down"
                size="sm"
                :disabled="index < 0 || index === items.length - 1"
                @click="move(index + 1)"
            />
            <IconButton
                :icon="ChevronsDown"
                :label="t.bottom"
                size="sm"
                :disabled="index < 0 || index === items.length - 1"
                @click="move(items.length - 1)"
            />
        </div>
        <p role="status" :class="styles.status()">{{ status }}</p>
    </div>
</template>
