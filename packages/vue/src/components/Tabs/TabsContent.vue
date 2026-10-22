<script setup lang="ts">
import { Tabs } from '@ark-ui/vue/tabs';
import { type RecipeClasses, tabs as tabsRecipe } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface TabsContentProps {
    value: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tabsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<TabsContentProps>();
const tabs = useRecipe('tabs', tabsRecipe, () => props.classes);
const attrs = useAttrs();
const styles = tabs();
</script>

<template>
    <Tabs.Content v-bind="{ ...attrs, class: styles.content({ class: normalizeClass(attrs.class) }) }" :value="value">
        <slot />
    </Tabs.Content>
</template>
