<script setup lang="ts">
import { RadioGroup } from '@ark-ui/vue/radio-group';
import { radioGroup as radioGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface RadioGroupItemProps {
    value: string;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radioGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<RadioGroupItemProps>(), { disabled: undefined });
const radioGroup = useRecipe('radioGroup', radioGroupRecipe, () => props.classes);
const attrs = useAttrs();
const styles = radioGroup();
</script>

<template>
    <RadioGroup.Item
        v-bind="{ ...attrs, class: styles.item({ class: normalizeClass(attrs.class) }) }"
        :value="value"
        :disabled="disabled"
    >
        <RadioGroup.ItemControl :class="styles.control()" />
        <RadioGroup.ItemText><slot /></RadioGroup.ItemText>
        <RadioGroup.ItemHiddenInput />
    </RadioGroup.Item>
</template>
