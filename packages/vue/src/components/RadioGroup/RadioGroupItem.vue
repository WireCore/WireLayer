<script setup lang="ts">
import { RadioGroup } from '@ark-ui/vue/radio-group';
import { radioGroup as radioGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { inject, normalizeClass, useAttrs, watchEffect } from 'vue';
import { radioGroupValuesKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface RadioGroupItemProps {
    /** Value of the option – a number makes the group's v-model a number */
    value: string | number;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radioGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<RadioGroupItemProps>(), { disabled: undefined });
const radioGroup = useRecipe('radioGroup', radioGroupRecipe, () => props.classes);
const attrs = useAttrs();
const styles = radioGroup();
// Tells the group the value behind its text (a number stays a number)
const values = inject(radioGroupValuesKey, null);
watchEffect((onCleanup) => {
    const value = props.value;
    values?.set(String(value), value);
    onCleanup(() => values?.get(String(value)) === value && values.delete(String(value)));
});
</script>

<template>
    <RadioGroup.Item
        v-bind="{ ...attrs, class: styles.item({ class: normalizeClass(attrs.class) }) }"
        :value="String(value)"
        :disabled="disabled"
    >
        <RadioGroup.ItemControl :class="styles.control()" />
        <RadioGroup.ItemText><slot /></RadioGroup.ItemText>
        <RadioGroup.ItemHiddenInput />
    </RadioGroup.Item>
</template>
