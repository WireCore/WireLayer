<script setup lang="ts" generic="T = unknown">
import { GripVertical } from '@lucide/vue';
import {
    FLIP_KEY_ATTRIBUTE,
    flipRelease,
    flipSync,
    focusHandle,
    SORTABLE_HANDLE,
    sortable as sortableRecipe,
    sortableController,
    type ItemAccessor,
    type RecipeClasses,
    type SortableMove,
    type SortableOrientation,
    type SortableState,
} from '@wirecore/wirelayer-recipes';
import {
    computed,
    nextTick,
    normalizeClass,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    useAttrs,
    useId,
    watch,
} from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface SortableProps<T = unknown> {
    /** The items in their order – use with v-model */
    modelValue?: T[];
    defaultValue?: T[];
    /** Key of an item: property name or function (default `id`, else `value`, else the item) */
    itemKey?: ItemAccessor<T, string | number>;
    /** Text of an item for its handle and the announcements (default `label`, `name` or `title`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Name of the list (visible label, also announced when an item moves in) */
    label?: string;
    /** Lists of the same group exchange items (e.g. Kanban columns) */
    group?: string;
    /** Id of this list in `move` events (default: generated) */
    name?: string;
    /** vertical (default), horizontal or grid (with `columns`) */
    orientation?: SortableOrientation;
    /** Columns of the grid */
    columns?: number;
    /** Whether an item from another list of the group may come in */
    accepts?: (item: T, from: string) => boolean;
    /** Items glide to their new place when they move (default: yes; not with reduced motion) */
    animate?: boolean;
    disabled?: boolean;
    /** Text of an empty list (it stays a drop target) */
    emptyText?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sortableRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SortableProps<T>>(), {
    modelValue: undefined,
    defaultValue: () => [],
    orientation: 'vertical',
    columns: 3,
    animate: true,
});
const emit = defineEmits<{
    'update:modelValue': [items: T[]];
    /** An item was dropped at another place (also in another list of the group) */
    move: [move: SortableMove<T>];
}>();
defineSlots<{
    /** Content of an item (default: its text) */
    item?(props: { item: T; index: number; grabbed: boolean }): unknown;
}>();
const sortableStyles = useRecipe('sortable', sortableRecipe, () => props.classes);
const attrs = useAttrs();
const t = useTranslations().sortable;
const baseId = useId();
const id = computed(() => props.name ?? baseId);
const labelId = `${baseId}label`;
const instructionsId = `${baseId}instructions`;
const list = ref<HTMLElement | null>(null);
const internal = shallowRef<T[]>(props.defaultValue);
const items = computed(() => props.modelValue ?? internal.value);
// The order set last, until the parent passes it back (several moves before Vue renders)
let pending: T[] | null = null;
watch(
    () => props.modelValue,
    () => (pending = null)
);
const state = shallowRef<SortableState>(sortableController.state(id.value));
const styles = computed(() => sortableStyles({ orientation: props.orientation }));

const read = <R,>(item: T, accessor: ItemAccessor<T, R> | undefined, names: string[]): R | undefined => {
    if (typeof accessor === 'function') return accessor(item);
    if (typeof item !== 'object' || item === null) return undefined;
    const record = item as Record<string, unknown>;
    for (const key of accessor ? [accessor] : names) if (record[key] !== undefined) return record[key] as R;
    return undefined;
};
const keyOf = (item: T, index: number) =>
    read(item, props.itemKey, ['id', 'value']) ?? (typeof item === 'object' ? index : String(item));
const labelOf = (item: T) => String(read(item, props.itemLabel, ['label', 'name', 'title']) ?? item);

// After every update: items that changed place (also from another list of the group) glide there
const flip = () => {
    if (props.animate) flipSync(list.value, props.group ?? id.value);
};
onMounted(flip);
onUpdated(flip);
let unregister = () => {};
let unsubscribe = () => {};
onMounted(() => {
    unregister = sortableController.register({
        id: id.value,
        group: () => props.group,
        element: () => list.value,
        items: () => pending ?? items.value,
        setItems: (next) => {
            pending = next as T[];
            internal.value = next as T[];
            emit('update:modelValue', next as T[]);
        },
        onMove: (move) => emit('move', move as SortableMove<T>),
        itemLabel: (item) => labelOf(item as T),
        label: () => props.label ?? '',
        orientation: () => props.orientation,
        columns: () => props.columns,
        disabled: () => !!props.disabled,
        accepts: props.accepts ? (item, from) => props.accepts!(item as T, from) : undefined,
        texts: () => t,
        // Right after Vue has rendered the new order (before the next key arrives)
        focus: (index) => void nextTick(() => focusHandle({ id: id.value, element: () => list.value }, index)),
    });
    unsubscribe = sortableController.subscribe(() => (state.value = sortableController.state(id.value)));
});
onBeforeUnmount(() => {
    flipRelease(list.value);
    unsubscribe();
    unregister();
});
</script>

<template>
    <!--
        Sortable list: every item has a handle – drag it, or press Space/Enter, move with the arrow keys and drop
        with Space (Escape cancels), or click it and click the target (WCAG 2.5.7). Every step is announced.
    -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <span v-if="label" :id="labelId" :class="styles.label()">{{ label }}</span>
        <ul
            ref="list"
            :class="styles.list()"
            role="list"
            :aria-labelledby="label ? labelId : undefined"
            :aria-label="label ? undefined : (attrs['aria-label'] as string | undefined)"
            :data-sortable-container="id"
            :data-active="(state.active && state.grabbed === null) || undefined"
            :style="orientation === 'grid' ? { '--wc-columns': String(columns) } : undefined"
            @click="sortableController.containerClick(id, $event)"
        >
            <li
                v-for="(item, index) in items"
                :key="keyOf(item, index)"
                :class="styles.item()"
                :data-sortable-index="index"
                :[FLIP_KEY_ATTRIBUTE]="animate ? String(keyOf(item, index)) : undefined"
                :data-grabbed="state.grabbed === index || undefined"
                :data-dragging="(state.dragging && state.grabbed === index) || undefined"
            >
                <button
                    type="button"
                    :class="styles.handle()"
                    v-bind="{ [SORTABLE_HANDLE]: id }"
                    :aria-label="t.handle(labelOf(item))"
                    :aria-pressed="state.grabbed === index"
                    :aria-describedby="instructionsId"
                    :disabled="disabled"
                    @keydown="sortableController.keydown(id, index, $event)"
                    @pointerdown="sortableController.pointerdown(id, index, $event)"
                    @pointermove="sortableController.pointermove($event)"
                    @pointerup="sortableController.pointerup($event)"
                    @pointercancel="sortableController.pointercancel()"
                >
                    <GripVertical :class="styles.handleIcon()" aria-hidden="true" />
                </button>
                <div :class="styles.content()">
                    <slot name="item" :item="item" :index="index" :grabbed="state.grabbed === index">
                        {{ labelOf(item) }}
                    </slot>
                </div>
            </li>
            <li v-if="!items.length" :class="styles.empty()">{{ emptyText ?? t.empty }}</li>
        </ul>
        <span :id="instructionsId" :class="styles.instructions()">{{ t.instructions }}</span>
    </div>
</template>
