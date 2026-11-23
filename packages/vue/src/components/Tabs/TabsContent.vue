<script setup lang="ts">
import { Tabs, useTabsContext } from '@ark-ui/vue/tabs';
import { type RecipeClasses, tabs as tabsRecipe } from '@wirecore/wirelayer-recipes';
import { computed, inject, normalizeClass, ref, useAttrs, watch } from 'vue';
import { tabsRenderStrategyKey } from './context.js';
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
// lazyMount: rendered from the first selection on and kept; unmountOnExit: removed again when the tab is left
const tabsContext = useTabsContext();
const strategy = inject(
    tabsRenderStrategyKey,
    computed(() => ({ lazyMount: false, unmountOnExit: false }))
);
const selected = computed(() => tabsContext.value.value === props.value);
const wasSelected = ref(selected.value);
watch(selected, (now) => {
    if (now) wasSelected.value = true;
});
const mounted = computed(
    () => selected.value || (wasSelected.value ? !strategy.value.unmountOnExit : !strategy.value.lazyMount)
);
</script>

<template>
    <Tabs.Content
        v-if="mounted"
        v-bind="{ ...attrs, class: styles.content({ class: normalizeClass(attrs.class) }) }"
        :value="value"
    >
        <slot />
    </Tabs.Content>
</template>
