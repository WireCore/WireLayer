<script setup lang="ts">
import { RadioGroup } from '@ark-ui/vue/radio-group';
import {
    radioGroup as radioGroupRecipe,
    type RadioGroupOrientation,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface RadioGroupProps {
    /** Selected value – use with v-model */
    modelValue?: string | null;
    defaultValue?: string | null;
    /** Visible group label (otherwise pass aria-label) */
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
</script>

<template>
    <RadioGroup.Root
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :model-value="modelValue"
        :default-value="defaultValue"
        :orientation="orientation"
        :disabled="disabled"
        :invalid="invalid"
        :required="required"
        :name="name"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <RadioGroup.Label v-if="label" :class="styles.label()">{{ label }}</RadioGroup.Label>
        <div :class="styles.items()" v-bind="columns ? { style: { '--wc-columns': String(columns) } } : {}">
            <slot />
        </div>
    </RadioGroup.Root>
</template>
