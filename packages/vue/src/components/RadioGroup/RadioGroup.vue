<script setup lang="ts" generic="V extends string | number = string, R extends boolean = false">
import { useFieldContext } from '@ark-ui/vue/field';
import { RadioGroup } from '@ark-ui/vue/radio-group';
import {
    radioGroup as radioGroupRecipe,
    type RadioGroupOrientation,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, useAttrs } from 'vue';
import { radioGroupValuesKey } from './context.js';
import { useFieldStatus } from '../Field/context.js';
import { useRecipe } from '../../recipes.js';
import { useLabelForWarning } from '../../utils/label-for.js';

/**
 * `V`: the type of the values – a union like `'ssh' | 'sftp'` or numbers (default string); `R`: whether `required` is
 * set (then v-model only gets values, never null)
 */
export interface RadioGroupProps<V extends string | number = string, R extends boolean = false> {
    /** Selected value – use with v-model; numbers when the items have number values */
    modelValue?: V | null;
    defaultValue?: V | null;
    /** Visible group label (otherwise pass aria-label – or place the group in a Field with a label) */
    label?: string;
    orientation?: RadioGroupOrientation;
    /** Cards in a grid with this many columns (one column on small screens) – for RadioCard */
    columns?: number;
    disabled?: boolean;
    invalid?: boolean;
    /**
     * A choice is required (aria-required). v-model then only gets values (typed `V`, not `V | null`): a form reset
     * back to an empty start is not passed on
     */
    required?: R & boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radioGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<RadioGroupProps<V, R>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    orientation: 'horizontal',
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const radioGroup = useRecipe('radioGroup', radioGroupRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: R extends true ? V : V | null] }>();
const attrs = useAttrs();
useLabelForWarning('RadioGroup', () => attrs.id);
const styles = computed(() => radioGroup({ orientation: props.orientation, grid: props.columns !== undefined }));

// Inside a Field: its label names the group (unless it has a name of its own), its texts describe it
const field = useFieldContext();
const fieldStatus = useFieldStatus();
const fieldLabelled = computed(
    () => !props.label && !attrs['aria-label'] && !attrs['aria-labelledby'] && !!field && fieldStatus.value.labelled
);
const ids = computed(() => (fieldLabelled.value ? { label: field!.value.ids.label } : undefined));

// Ark works with strings: number values go in as text and come back as the item's value
const values = new Map<string, string | number>();
provide(radioGroupValuesKey, values);
const toText = (value: V | null | undefined) => (value == null ? value : String(value));
// A required group never reports an empty value (Ark does on a form reset to an empty start: null or undefined)
function onValueChange(value: string | null) {
    if (value == null && props.required) return;
    emit('update:modelValue', (value === null ? null : (values.get(value) ?? value)) as R extends true ? V : V | null);
}
</script>

<template>
    <RadioGroup.Root
        v-bind="{
            'aria-describedby': field?.ariaDescribedby,
            ...attrs,
            class: styles.base({ class: normalizeClass(attrs.class) }),
        }"
        :ids="ids"
        :model-value="toText(modelValue)"
        :default-value="toText(defaultValue)"
        :orientation="orientation"
        :disabled="disabled ?? field?.disabled"
        :invalid="invalid ?? field?.invalid"
        :required="required ?? field?.required"
        :name="name"
        @update:model-value="onValueChange"
    >
        <RadioGroup.Label v-if="label" :class="styles.label()">{{ label }}</RadioGroup.Label>
        <div :class="styles.items()" v-bind="columns ? { style: { '--wc-columns': String(columns) } } : {}">
            <slot />
        </div>
    </RadioGroup.Root>
</template>
