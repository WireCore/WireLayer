<script setup lang="ts" generic="T">
import { LoaderCircle } from '@lucide/vue';
import type { ListGroup } from '@wirecore/wirelayer-recipes';
import ListOption, { type ListParts } from './ListOption.vue';
import LoadMore from './LoadMore.vue';
import type { ListClasses, ListItemState } from './types.js';

// The options of Select, MultiSelect, Combobox and Listbox: under group headings (role="group", named by the
// heading), then the loading row and the end marker that loads the next page
defineProps<{
    parts: ListParts;
    groups: readonly ListGroup<T>[];
    classes: ListClasses;
    checkbox?: boolean;
    /** No check mark (Autocomplete: suggestions are not selected) */
    noIndicator?: boolean;
    /** The options can be dragged (PickList, OrderList) */
    draggable?: boolean;
    loading?: boolean;
    loadingText: string;
    hasMore?: boolean;
    /** Shown (as a disabled option, so the listbox is never empty) when there is no option */
    emptyText?: string;
}>();
const emit = defineEmits<{ loadMore: [] }>();
defineSlots<{ item?(props: { item: T } & ListItemState): unknown }>();
</script>

<template>
    <template v-for="(group, index) in groups" :key="group.label ?? `#${index}`">
        <component :is="parts.ItemGroup" v-if="group.label !== undefined" :class="classes.group">
            <component :is="parts.ItemGroupLabel" :class="classes.groupLabel">{{ group.label }}</component>
            <ListOption
                v-for="option in group.options"
                :key="option.key"
                :parts="parts"
                :option="option"
                :classes="classes"
                :checkbox="checkbox"
                :no-indicator="noIndicator"
                :draggable="draggable"
            >
                <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
            </ListOption>
        </component>
        <template v-else>
            <ListOption
                v-for="option in group.options"
                :key="option.key"
                :parts="parts"
                :option="option"
                :classes="classes"
                :checkbox="checkbox"
                :no-indicator="noIndicator"
                :draggable="draggable"
            >
                <template v-if="$slots.item" #item="state"><slot name="item" v-bind="state" /></template>
            </ListOption>
        </template>
    </template>
    <div
        v-if="emptyText !== undefined && !loading && !groups.length"
        role="option"
        aria-disabled="true"
        :class="classes.empty"
    >
        {{ emptyText }}
    </div>
    <div v-if="loading" :class="classes.loading">
        <LoaderCircle :class="classes.loadingIcon" aria-hidden="true" />
        {{ loadingText }}
    </div>
    <LoadMore
        v-if="hasMore"
        :class="classes.sentinel"
        :active="!loading"
        :count="groups.reduce((sum, group) => sum + group.options.length, 0)"
        @load="emit('loadMore')"
    />
</template>
