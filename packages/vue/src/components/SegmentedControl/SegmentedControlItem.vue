<script setup lang="ts">
import { SegmentGroup } from '@ark-ui/vue/segment-group';
import { type RecipeClasses, segmentedControl as segmentedControlRecipe } from '@wirecore/wirelayer-recipes';
import { computed, inject, normalizeClass, useAttrs, useSlots, type Component } from 'vue';
import { segmentedControlKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface SegmentedControlItemProps {
    value: string;
    /** Icon component before the label */
    icon?: Component;
    /** Text of the segment without the default slot; with `icon` (and no slot) only the icon shows, this names it */
    label?: string;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof segmentedControlRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SegmentedControlItemProps>(), { disabled: undefined });
const segmentedControl = useRecipe('segmentedControl', segmentedControlRecipe, () => props.classes);
const attrs = useAttrs();
const size = inject(segmentedControlKey, null);
const slots = useSlots();
const iconOnly = computed(() => !!props.icon && !!props.label && !slots.default);
const styles = computed(() => segmentedControl({ size: size?.value, iconOnly: iconOnly.value }));
</script>

<template>
    <SegmentGroup.Item
        v-bind="{ ...attrs, class: styles.item({ class: normalizeClass(attrs.class) }) }"
        :value="value"
        :disabled="disabled"
    >
        <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
        <!-- The class only on an icon-only segment: an empty one would add class="" -->
        <SegmentGroup.ItemText v-bind="iconOnly ? { class: styles.itemText() } : {}"
            ><slot>{{ label }}</slot></SegmentGroup.ItemText
        >
        <SegmentGroup.ItemHiddenInput />
    </SegmentGroup.Item>
</template>
