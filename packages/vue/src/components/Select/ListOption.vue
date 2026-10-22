<script setup lang="ts" generic="T">
import { Check } from '@lucide/vue';
import type { ListOption } from '@wirecore/wirelayer-recipes';
import type { Component } from 'vue';
import type { ListClasses, ListItemState } from './types.js';

/** Ark parts of the list component: Select, Combobox or Listbox (same names in each) */
export interface ListParts {
    Item: Component;
    ItemText: Component;
    ItemIndicator: Component;
    ItemContext: Component;
    ItemGroup: Component;
    ItemGroupLabel: Component;
}

defineProps<{
    parts: ListParts;
    option: ListOption<T>;
    classes: ListClasses;
    /** Check box before the label instead of the check mark after it (MultiSelect) */
    checkbox?: boolean;
    /** No check mark (Autocomplete: suggestions are not selected) */
    noIndicator?: boolean;
    /** The option can be dragged (PickList, OrderList) */
    draggable?: boolean;
}>();
defineSlots<{ item?(props: { item: T } & ListItemState): unknown }>();
</script>

<template>
    <component
        :is="parts.Item"
        :item="option"
        :class="classes.item"
        :data-description="option.description ? '' : undefined"
        :draggable="draggable && !option.disabled ? 'true' : undefined"
    >
        <component :is="parts.ItemContext" v-if="checkbox" v-slot="state">
            <span :class="classes.check" :data-state="state.selected ? 'checked' : 'unchecked'" aria-hidden="true">
                <Check v-if="state.selected" :class="classes.checkIcon" />
            </span>
        </component>
        <component :is="parts.ItemContext" v-if="$slots.item" v-slot="state">
            <slot
                name="item"
                :item="option.item"
                :selected="state.selected"
                :highlighted="state.highlighted"
                :disabled="state.disabled"
            />
        </component>
        <template v-else>
            <component :is="option.icon" v-if="option.icon" :class="classes.icon" aria-hidden="true" />
            <span v-if="option.description" :class="classes.itemBody">
                <component :is="parts.ItemText" :class="classes.itemText">{{ option.label }}</component>
                <span :class="classes.itemDescription">{{ option.description }}</span>
            </span>
            <component :is="parts.ItemText" v-else :class="classes.itemText">{{ option.label }}</component>
        </template>
        <component :is="parts.ItemIndicator" v-if="!checkbox && !noIndicator">
            <Check :class="classes.itemIndicator" aria-hidden="true" />
        </component>
    </component>
</template>
