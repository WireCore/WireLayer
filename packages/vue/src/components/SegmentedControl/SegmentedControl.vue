<script setup lang="ts" generic="V extends string = string">
import { useFieldContext } from '@ark-ui/vue/field';
import { SegmentGroup } from '@ark-ui/vue/segment-group';
import {
    type RecipeClasses,
    segmentedControl as segmentedControlRecipe,
    type SegmentedControlSize,
    warnInDevelopment,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onMounted, provide, useAttrs } from 'vue';
import { segmentedControlKey } from './context.js';
import { useFieldStatus } from '../Field/context.js';
import { useRecipe } from '../../recipes.js';
import { useLabelForWarning } from '../../utils/label-for.js';

/** `V`: the type of the values, e.g. a union like `'ssh' | 'sftp'` (default string) */
export interface SegmentedControlProps<V extends string = string> {
    /** Selected value – use with v-model */
    modelValue?: V | null;
    defaultValue?: V;
    /** Accessible name of the group (visually hidden) – inside a Field with a label, the Field's label names it */
    label?: string;
    size?: SegmentedControlSize;
    disabled?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof segmentedControlRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SegmentedControlProps<V>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    size: 'md',
    disabled: undefined,
});
const segmentedControl = useRecipe('segmentedControl', segmentedControlRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: V | null] }>();
const attrs = useAttrs();
useLabelForWarning('SegmentedControl', () => attrs.id);
const styles = computed(() => segmentedControl({ size: props.size }));

// Inside a Field: its label names the group (unless it has a name of its own), its texts describe it
const field = useFieldContext();
const fieldStatus = useFieldStatus();
const fieldLabelled = computed(
    () => !props.label && !attrs['aria-label'] && !attrs['aria-labelledby'] && !!field && fieldStatus.value.labelled
);
const ids = computed(() => (fieldLabelled.value ? { label: field!.value.ids.label } : undefined));
onMounted(() => {
    if (!props.label && !attrs['aria-label'] && !attrs['aria-labelledby'] && !fieldLabelled.value)
        warnInDevelopment('SegmentedControl: pass `label` or place it in a Field with a label – the group has no name');
});

provide(
    segmentedControlKey,
    computed(() => props.size)
);
</script>

<template>
    <SegmentGroup.Root
        v-bind="{
            'aria-describedby': field?.ariaDescribedby,
            ...attrs,
            class: styles.base({ class: normalizeClass(attrs.class) }),
        }"
        :ids="ids"
        :model-value="modelValue"
        :default-value="defaultValue"
        orientation="horizontal"
        :disabled="disabled ?? field?.disabled"
        :name="name"
        @update:model-value="emit('update:modelValue', $event as V | null)"
    >
        <SegmentGroup.Label v-if="!fieldLabelled" :class="styles.label()">{{ label }}</SegmentGroup.Label>
        <slot />
    </SegmentGroup.Root>
</template>
