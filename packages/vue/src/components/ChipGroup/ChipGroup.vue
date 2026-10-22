<script setup lang="ts">
import { ToggleGroup } from '@ark-ui/vue/toggle-group';
import { chipGroup as chipGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, provide, useAttrs } from 'vue';
import { chipGroupKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface ChipGroupProps {
    /** Selected values – use with v-model */
    modelValue?: string[];
    defaultValue?: string[];
    /** Allow several selected chips (default) or only one */
    multiple?: boolean;
    /** Accessible name of the group */
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
</script>

<template>
    <ToggleGroup.Root
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :model-value="modelValue"
        :default-value="defaultValue"
        :multiple="multiple"
        :disabled="disabled"
        :aria-label="label"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <slot />
    </ToggleGroup.Root>
</template>
