<script setup lang="ts" generic="V extends string = string, R extends boolean = false">
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

/**
 * `V`: the type of the values, e.g. a union like `'ssh' | 'sftp'` (default string); `R`: whether `required` is set
 * (then v-model only gets values, never null)
 */
export interface SegmentedControlProps<V extends string = string, R extends boolean = false> {
    /** Selected value – use with v-model */
    modelValue?: V | null;
    defaultValue?: V;
    /** Accessible name of the group (visually hidden) – inside a Field with a label, the Field's label names it */
    label?: string;
    size?: SegmentedControlSize;
    disabled?: boolean;
    /**
     * A value is required (aria-required). v-model then only gets values (typed `V`, not `V | null`): a form reset
     * back to an empty start is not passed on
     */
    required?: R & boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof segmentedControlRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SegmentedControlProps<V, R>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    size: 'md',
    disabled: undefined,
    required: undefined,
});
const segmentedControl = useRecipe('segmentedControl', segmentedControlRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: R extends true ? V : V | null] }>();
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

// A required control never reports an empty value (Ark does on a form reset to an empty start: null or undefined)
function onValueChange(value: string | null) {
    if (value == null && props.required) return;
    emit('update:modelValue', value as R extends true ? V : V | null);
}

provide(
    segmentedControlKey,
    computed(() => props.size)
);
</script>

<template>
    <SegmentGroup.Root
        v-bind="{
            'aria-describedby': field?.ariaDescribedby,
            ...(required ? { 'aria-required': 'true' } : {}),
            ...attrs,
            class: styles.base({ class: normalizeClass(attrs.class) }),
        }"
        :ids="ids"
        :model-value="modelValue"
        :default-value="defaultValue"
        orientation="horizontal"
        :disabled="disabled ?? field?.disabled"
        :name="name"
        @update:model-value="onValueChange"
    >
        <SegmentGroup.Label v-if="!fieldLabelled" :class="styles.label()">{{ label }}</SegmentGroup.Label>
        <slot />
    </SegmentGroup.Root>
</template>
