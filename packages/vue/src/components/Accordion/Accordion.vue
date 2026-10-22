<script setup lang="ts">
import { Accordion } from '@ark-ui/vue/accordion';
import { accordion as accordionRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface AccordionProps {
    /** Open items (values of AccordionItem) – use with v-model */
    modelValue?: string[];
    defaultValue?: string[];
    /** Several items open at once */
    multiple?: boolean;
    /** The open item can be closed again (single mode) */
    collapsible?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof accordionRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AccordionProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    multiple: false,
    collapsible: true,
});
const accordion = useRecipe('accordion', accordionRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const attrs = useAttrs();
const styles = accordion();
</script>

<template>
    <Accordion.Root
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :model-value="modelValue"
        :default-value="defaultValue"
        :multiple="multiple"
        :collapsible="collapsible"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <slot />
    </Accordion.Root>
</template>
