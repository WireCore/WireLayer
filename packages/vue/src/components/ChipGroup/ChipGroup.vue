<script setup lang="ts">
import { useFieldContext } from '@ark-ui/vue/field';
import { ToggleGroup } from '@ark-ui/vue/toggle-group';
import { chipGroup as chipGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, useAttrs } from 'vue';
import { chipGroupKey } from './context.js';
import { useFieldStatus } from '../Field/context.js';
import { useRecipe } from '../../recipes.js';

export interface ChipGroupProps {
    /** Selected values – use with v-model */
    modelValue?: string[];
    defaultValue?: string[];
    /** Allow several selected chips (default) or only one */
    multiple?: boolean;
    /** Accessible name of the group – inside a Field with a label, the Field's label names it */
    label?: string;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chipGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ChipGroupProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    multiple: true,
    disabled: undefined,
});
const chipGroup = useRecipe('chipGroup', chipGroupRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const attrs = useAttrs();
const styles = chipGroup();
provide(chipGroupKey, true);

// Inside a Field: its label names the group (unless it has a name of its own), its texts describe it
const field = useFieldContext();
const fieldStatus = useFieldStatus();
const fieldLabelled = computed(
    () => !props.label && !attrs['aria-label'] && !attrs['aria-labelledby'] && !!field && fieldStatus.value.labelled
);
</script>

<template>
    <ToggleGroup.Root
        v-bind="{
            'aria-labelledby': fieldLabelled ? field!.ids.label : undefined,
            'aria-describedby': field?.ariaDescribedby,
            ...attrs,
            class: styles.base({ class: normalizeClass(attrs.class) }),
        }"
        :model-value="modelValue"
        :default-value="defaultValue"
        :multiple="multiple"
        :disabled="disabled ?? field?.disabled"
        :aria-label="label"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <slot />
    </ToggleGroup.Root>
</template>
