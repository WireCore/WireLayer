<script setup lang="ts">
import {
    columnVariables,
    descriptions as descriptionsRecipe,
    type RecipeClasses,
    type ResponsiveColumns,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface DescriptionsItem {
    /** Key for the slots `value-<id>` and `edit-<id>` (default: the position) */
    id?: string;
    label: string;
    value?: string | number;
    /** Columns the item spans (never more than there are), or `full` for the whole row */
    span?: number | 'full';
}

export interface DescriptionsProps {
    items: DescriptionsItem[];
    /** Heading above the list */
    title?: string;
    /** Level of the title (default 3) */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Columns: a number or per breakpoint (default { base: 1, sm: 2, lg: 3 }) */
    columns?: ResponsiveColumns;
    /** Label above its value (vertical, default) or beside it */
    orientation?: 'vertical' | 'horizontal';
    /** Table look with lines between the cells */
    bordered?: boolean;
    /** Edit mode: the values give way to the `edit-<id>` slots (inputs labelled by the term via `labelId`) */
    editing?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof descriptionsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<DescriptionsProps>(), {
    headingLevel: 3,
    columns: () => ({ base: 1, sm: 2, lg: 3 }),
});
const descriptions = useRecipe('descriptions', descriptionsRecipe, () => props.classes);
const slots = defineSlots<
    {
        /** Buttons next to the title, e.g. "Edit" */
        actions?(): unknown;
    } & Record<`value-${string}`, (props: { item: DescriptionsItem }) => unknown> &
        Record<`edit-${string}`, (props: { item: DescriptionsItem; labelId: string }) => unknown>
>();
const attrs = useAttrs();
const id = useId();
const styles = computed(() => descriptions({ orientation: props.orientation, bordered: props.bordered }));
const keyOf = (item: DescriptionsItem, index: number) => item.id ?? String(index);
const spanStyle = (item: DescriptionsItem) =>
    item.span === undefined ? undefined : { '--wc-span': item.span === 'full' ? '999' : String(item.span) };
</script>

<template>
    <!-- Terms and values (<dl>) in columns, with an optional title and actions; values can turn into inputs -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <div v-if="title || slots.actions" :class="styles.header()">
            <component :is="`h${headingLevel}`" v-if="title" :class="styles.title()">{{ title }}</component>
            <div v-if="slots.actions" :class="styles.actions()"><slot name="actions" /></div>
        </div>
        <dl :class="styles.list()" :style="columnVariables(columns)">
            <div
                v-for="(item, index) in items"
                :key="keyOf(item, index)"
                :class="styles.item()"
                :data-span="item.span"
                :style="spanStyle(item)"
            >
                <dt :id="`${id}-${index}`" :class="styles.term()">{{ item.label }}</dt>
                <dd :class="styles.details()">
                    <slot
                        v-if="editing && slots[`edit-${keyOf(item, index)}`]"
                        :name="`edit-${keyOf(item, index)}`"
                        v-bind="{ item, labelId: `${id}-${index}` }"
                    />
                    <slot v-else :name="`value-${keyOf(item, index)}`" :item="item">{{ item.value }}</slot>
                </dd>
            </div>
        </dl>
    </div>
</template>
