<script setup lang="ts">
import { SegmentGroup } from '@ark-ui/vue/segment-group';
import {
    type RecipeClasses,
    segmentedControl as segmentedControlRecipe,
    type SegmentedControlSize,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, useAttrs } from 'vue';
import { segmentedControlKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface SegmentedControlProps {
    /** Selected value – use with v-model */
    modelValue?: string | null;
    defaultValue?: string;
    /** Accessible name of the group (visually hidden) */
    label: string;
    size?: SegmentedControlSize;
    disabled?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof segmentedControlRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SegmentedControlProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    size: 'md',
    disabled: undefined,
});
const segmentedControl = useRecipe('segmentedControl', segmentedControlRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();
const attrs = useAttrs();
const styles = computed(() => segmentedControl({ size: props.size }));

provide(
    segmentedControlKey,
    computed(() => props.size)
);
</script>

<template>
    <SegmentGroup.Root
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :model-value="modelValue"
        :default-value="defaultValue"
        orientation="horizontal"
        :disabled="disabled"
        :name="name"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <SegmentGroup.Label :class="styles.label()">{{ label }}</SegmentGroup.Label>
        <slot />
    </SegmentGroup.Root>
</template>
