<script setup lang="ts">
import { Tabs } from '@ark-ui/vue/tabs';
import { type RecipeClasses, tabs as tabsRecipe } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface TabsProps {
    /** Selected tab – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Accessible name of the tab list */
    label?: string;
    /** Tab list above (default) or beside the panels */
    orientation?: 'horizontal' | 'vertical';
    /** `automatic`: arrow keys select (default); `manual`: arrow keys only move the focus, Enter/Space select */
    activationMode?: 'automatic' | 'manual';
    /** Renders a panel only once its tab was selected */
    lazyMount?: boolean;
    /** Removes a panel again when its tab is left */
    unmountOnExit?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tabsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<TabsProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    orientation: undefined,
    activationMode: undefined,
    lazyMount: undefined,
    unmountOnExit: undefined,
});
const tabs = useRecipe('tabs', tabsRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();
const attrs = useAttrs();
const styles = tabs();
</script>

<template>
    <Tabs.Root
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :model-value="modelValue"
        :default-value="defaultValue"
        :orientation="orientation"
        :activation-mode="activationMode"
        :lazy-mount="lazyMount"
        :unmount-on-exit="unmountOnExit"
        :translations="label ? { listLabel: label } : undefined"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <slot />
    </Tabs.Root>
</template>
