<script setup lang="ts">
import { SegmentGroup } from '@ark-ui/vue/segment-group';
import { type RecipeClasses, segmentedControl as segmentedControlRecipe } from '@wirecore/wirelayer-recipes';
import { computed, inject, normalizeClass, useAttrs, type Component } from 'vue';
import { segmentedControlKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface SegmentedControlItemProps {
    value: string;
    /** Icon component before the label */
    icon?: Component;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof segmentedControlRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SegmentedControlItemProps>(), { disabled: undefined });
const segmentedControl = useRecipe('segmentedControl', segmentedControlRecipe, () => props.classes);
const attrs = useAttrs();
const size = inject(segmentedControlKey, null);
const styles = computed(() => segmentedControl({ size: size?.value }));
</script>

<template>
    <SegmentGroup.Item
        v-bind="{ ...attrs, class: styles.item({ class: normalizeClass(attrs.class) }) }"
        :value="value"
        :disabled="disabled"
    >
        <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
        <SegmentGroup.ItemText><slot /></SegmentGroup.ItemText>
        <SegmentGroup.ItemHiddenInput />
    </SegmentGroup.Item>
</template>
