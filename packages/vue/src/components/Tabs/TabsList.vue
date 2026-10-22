<script setup lang="ts">
import { Tabs } from '@ark-ui/vue/tabs';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { scrollEdges, tabs as tabsRecipe } from '@wirecore/wirelayer-recipes';
import { normalizeClass, onBeforeUnmount, onMounted, ref, useAttrs, useTemplateRef } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface TabsListProps {
    /**
     * Scrolls when the tabs do not fit, with arrows at the sides while there is more (pointer only – the arrow keys
     * move between the tabs and scroll them into view)
     */
    scrollable?: boolean;
}

const props = defineProps<TabsListProps>();
const tabs = useRecipe('tabs', tabsRecipe);

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const styles = tabs();

const list = useTemplateRef<{ $el: HTMLElement }>('list');
const edges = ref({ start: false, end: false });
const update = () => {
    if (list.value?.$el) edges.value = scrollEdges(list.value.$el);
};
let observer: ResizeObserver | undefined;
onMounted(() => {
    if (!props.scrollable || !list.value?.$el) return;
    update();
    observer = new ResizeObserver(update);
    observer.observe(list.value.$el);
});
onBeforeUnmount(() => observer?.disconnect());
function scroll(towardsEnd: boolean) {
    const element = list.value?.$el;
    if (!element) return;
    const rtl = getComputedStyle(element).direction === 'rtl';
    const distance = element.clientWidth * 0.8 * (towardsEnd ? 1 : -1) * (rtl ? -1 : 1);
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollBy({ left: distance, behavior: smooth ? 'smooth' : 'auto' });
}
</script>

<template>
    <div v-if="scrollable" :class="styles.scroller()">
        <button
            v-if="edges.start"
            type="button"
            tabindex="-1"
            aria-hidden="true"
            data-side="start"
            :class="styles.scrollButton()"
            @click="scroll(false)"
        >
            <ChevronLeft :class="styles.scrollIcon()" />
        </button>
        <Tabs.List
            ref="list"
            v-bind="{ ...attrs, class: styles.list({ class: [styles.scrollList(), normalizeClass(attrs.class)] }) }"
            @scroll="update"
        >
            <slot />
        </Tabs.List>
        <button
            v-if="edges.end"
            type="button"
            tabindex="-1"
            aria-hidden="true"
            data-side="end"
            :class="styles.scrollButton()"
            @click="scroll(true)"
        >
            <ChevronRight :class="styles.scrollIcon()" />
        </button>
    </div>
    <Tabs.List v-else v-bind="{ ...attrs, class: styles.list({ class: normalizeClass(attrs.class) }) }">
        <slot />
    </Tabs.List>
</template>
