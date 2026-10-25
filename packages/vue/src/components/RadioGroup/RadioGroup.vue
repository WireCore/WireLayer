<script setup lang="ts">
import { useFieldContext } from '@ark-ui/vue/field';
import { RadioGroup } from '@ark-ui/vue/radio-group';
import {
    radioGroup as radioGroupRecipe,
    type RadioGroupOrientation,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useFieldStatus } from '../Field/context.js';
import { useRecipe } from '../../recipes.js';

export interface RadioGroupProps {
    /** Selected value – use with v-model */
    modelValue?: string | null;
    defaultValue?: string | null;
    /** Visible group label (otherwise pass aria-label – or place the group in a Field with a label) */
    label?: string;
    orientation?: RadioGroupOrientation;
    /** Cards in a grid with this many columns (one column on small screens) – for RadioCard */
    columns?: number;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radioGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<RadioGroupProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    orientation: 'horizontal',
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const radioGroup = useRecipe('radioGroup', radioGroupRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();
const attrs = useAttrs();
const styles = computed(() => radioGroup({ orientation: props.orientation, grid: props.columns !== undefined }));

// Inside a Field: its label names the group (unless it has a name of its own), its texts describe it
const field = useFieldContext();
const fieldStatus = useFieldStatus();
const fieldLabelled = computed(
    () => !props.label && !attrs['aria-label'] && !attrs['aria-labelledby'] && !!field && fieldStatus.value.labelled
);
const ids = computed(() => (fieldLabelled.value ? { label: field!.value.ids.label } : undefined));
</script>

<template>
    <RadioGroup.Root
        v-bind="{
            'aria-describedby': field?.ariaDescribedby,
            ...attrs,
            class: styles.base({ class: normalizeClass(attrs.class) }),
        }"
        :ids="ids"
        :model-value="modelValue"
        :default-value="defaultValue"
        :orientation="orientation"
        :disabled="disabled ?? field?.disabled"
        :invalid="invalid ?? field?.invalid"
        :required="required ?? field?.required"
        :name="name"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <RadioGroup.Label v-if="label" :class="styles.label()">{{ label }}</RadioGroup.Label>
        <div :class="styles.items()" v-bind="columns ? { style: { '--wc-columns': String(columns) } } : {}">
            <slot />
        </div>
    </RadioGroup.Root>
</template>
