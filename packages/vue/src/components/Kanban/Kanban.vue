<script setup lang="ts" generic="T = unknown">
import { ChevronLeft, CircleAlert } from '@lucide/vue';
import {
    kanban as kanbanRecipe,
    kanbanLimitState,
    type ItemAccessor,
    type RecipeClasses,
    type SortableMove,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, shallowRef, useAttrs, useId, watch } from 'vue';
import Button from '../Button/Button.vue';
import Sortable from '../Sortable/Sortable.vue';
import type { KanbanColumn, KanbanMove } from './types.js';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface KanbanProps<T = unknown> {
    /** The columns with their cards – use with v-model:columns */
    columns?: KanbanColumn<T>[];
    defaultColumns?: KanbanColumn<T>[];
    /** Accessible name of the board (default "Board") */
    label?: string;
    /** Key of a card: property name or function (default `id`, else `value`) */
    itemKey?: ItemAccessor<T, string | number>;
    /** Text of a card for its handle and the announcements (default `label`, `name` or `title`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Whether a card may move into a column */
    accepts?: (item: T, to: string, from: string) => boolean;
    disabled?: boolean;
    /** Heading level of the column titles (default h3) */
    titleTag?: 'h2' | 'h3' | 'h4';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof kanbanRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<KanbanProps<T>>(), {
    columns: undefined,
    defaultColumns: () => [],
    titleTag: 'h3',
});
const emit = defineEmits<{
    'update:columns': [columns: KanbanColumn<T>[]];
    /** A card was dropped at another place: from/to column id and index */
    move: [move: KanbanMove<T>];
    /** The column's "Load more" button */
    loadMore: [columnId: string];
    /** A column was collapsed or expanded */
    collapse: [columnId: string, collapsed: boolean];
}>();
defineSlots<{
    /** Content of a card (default: its text) */
    card?(props: { item: T; column: KanbanColumn<T>; index: number; grabbed: boolean }): unknown;
    /** Below the cards of a column, e.g. a button to add a card */
    add?(props: { column: KanbanColumn<T> }): unknown;
}>();
const kanban = useRecipe('kanban', kanbanRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.kanban);
const baseId = useId();
const internal = shallowRef<KanbanColumn<T>[]>(props.defaultColumns);
const shown = computed(() => props.columns ?? internal.value);
// Moving between columns sets two lists one after the other – the second builds on the first
let pending: KanbanColumn<T>[] | null = null;
watch(
    () => props.columns,
    () => (pending = null)
);
const collapsedOwn = ref<Record<string, boolean>>({});
const isCollapsed = (column: KanbanColumn<T>) => collapsedOwn.value[column.id] ?? !!column.collapsed;
const listName = (column: KanbanColumn<T>) => `${baseId}-${column.id}`;
const columnOf = (name: string) => name.slice(baseId.length + 1);

const labelOf = (item: T) => {
    if (typeof props.itemLabel === 'function') return props.itemLabel(item);
    if (typeof item !== 'object' || item === null) return String(item);
    const record = item as Record<string, unknown>;
    for (const key of props.itemLabel ? [props.itemLabel] : ['label', 'name', 'title'])
        if (record[key] !== undefined) return String(record[key]);
    return String(item);
};
function setItems(id: string, items: T[]) {
    const next = (pending ?? shown.value).map((column) => (column.id === id ? { ...column, items } : column));
    pending = next;
    internal.value = next;
    emit('update:columns', next);
}
function onMove(move: SortableMove<T>) {
    emit('move', {
        item: move.item,
        from: { column: columnOf(move.from.container), index: move.from.index },
        to: { column: columnOf(move.to.container), index: move.to.index },
    });
}
function toggle(column: KanbanColumn<T>) {
    const collapsed = !isCollapsed(column);
    collapsedOwn.value = { ...collapsedOwn.value, [column.id]: collapsed };
    emit('collapse', column.id, collapsed);
}
const view = computed(() =>
    shown.value.map((column) => {
        const state = kanbanLimitState(column.items.length, column.limit);
        return { column, state, styles: kanban({ limitState: state }), collapsed: isCollapsed(column) };
    })
);
</script>

<template>
    <!--
        Kanban board: each column is a sortable list of one group – cards move with the pointer, with Space and the
        arrow keys (left/right into the next column) or with two clicks; every step is announced.
    -->
    <div
        v-bind="{ ...attrs, class: kanban().base({ class: normalizeClass(attrs.class) }) }"
        role="group"
        :aria-label="label ?? t.label"
    >
        <section
            v-for="{ column, state, styles, collapsed } in view"
            :key="column.id"
            :class="styles.column()"
            :aria-labelledby="`${baseId}${column.id}title`"
            :data-collapsed="collapsed || undefined"
            :data-limit="state"
        >
            <div :class="styles.header()">
                <component
                    :is="titleTag"
                    v-if="!collapsed"
                    :id="`${baseId}${column.id}title`"
                    :class="styles.title()"
                    >{{ column.title }}</component
                >
                <span v-if="!collapsed" :class="styles.count()" :title="t.cards(column.items.length, column.limit)"
                    ><span aria-hidden="true">{{ t.count(column.items.length, column.limit) }}</span
                    ><span :class="styles.srOnly()">{{ t.cards(column.items.length, column.limit) }}</span></span
                >
                <button
                    type="button"
                    :class="styles.collapse()"
                    :aria-expanded="!collapsed"
                    :aria-controls="collapsed ? undefined : `${baseId}${column.id}body`"
                    :aria-label="collapsed ? t.expand(column.title) : t.collapse(column.title)"
                    @click="toggle(column)"
                >
                    <ChevronLeft :class="styles.collapseIcon()" aria-hidden="true" />
                </button>
            </div>
            <component
                :is="titleTag"
                v-if="collapsed"
                :id="`${baseId}${column.id}title`"
                :class="styles.collapsedTitle()"
                >{{ column.title }} ({{ t.count(column.items.length, column.limit) }})</component
            >
            <div v-else :id="`${baseId}${column.id}body`" :class="styles.footer()">
                <p v-if="state === 'reached' || state === 'over'" :class="styles.limit()" role="status">
                    <CircleAlert :class="styles.limitIcon()" aria-hidden="true" />{{
                        state === 'over' ? t.limitExceeded(column.items.length, column.limit!) : t.limitReached
                    }}
                </p>
                <Sortable
                    :model-value="column.items"
                    :name="listName(column)"
                    :group="baseId"
                    :label="column.title"
                    :item-key="itemKey"
                    :item-label="itemLabel"
                    :accepts="
                        accepts ? (item: T, from: string) => accepts!(item, column.id, columnOf(from)) : undefined
                    "
                    :disabled="disabled"
                    :empty-text="t.empty"
                    :classes="{ label: styles.srOnly(), list: styles.list() }"
                    @update:model-value="setItems(column.id, $event)"
                    @move="onMove"
                >
                    <template #item="{ item, index, grabbed }">
                        <div :class="styles.card()">
                            <slot name="card" :item="item" :column="column" :index="index" :grabbed="grabbed">
                                {{ labelOf(item) }}
                            </slot>
                        </div>
                    </template>
                </Sortable>
                <Button
                    v-if="column.hasMore"
                    size="sm"
                    variant="text"
                    :loading="column.loading"
                    :class="styles.more()"
                    @click="emit('loadMore', column.id)"
                    >{{ t.loadMore }}</Button
                >
                <slot name="add" :column="column" />
            </div>
        </section>
    </div>
</template>
