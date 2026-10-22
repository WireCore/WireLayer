<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { type RecipeClasses, scrollEdges, scroller as scrollerRecipe } from '@wirecore/wirelayer-recipes';
import { normalizeClass, onBeforeUnmount, onMounted, ref, useAttrs, useTemplateRef } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface ScrollerProps {
    /** Name of the scrollable row – it is focusable, so keyboard users scroll it with the arrow keys */
    label: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof scrollerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<ScrollerProps>();
const scroller = useRecipe('scroller', scrollerRecipe, () => props.classes);
const attrs = useAttrs();
const styles = scroller();
const viewport = useTemplateRef<HTMLElement>('viewport');
const edges = ref({ start: false, end: false });
const update = () => {
    if (viewport.value) edges.value = scrollEdges(viewport.value);
};
let observer: ResizeObserver | undefined;
onMounted(() => {
    update();
    observer = new ResizeObserver(update);
    observer.observe(viewport.value!);
});
onBeforeUnmount(() => observer?.disconnect());
function scroll(towardsEnd: boolean) {
    const element = viewport.value;
    if (!element) return;
    const rtl = getComputedStyle(element).direction === 'rtl';
    const distance = element.clientWidth * 0.8 * (towardsEnd ? 1 : -1) * (rtl ? -1 : 1);
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollBy({ left: distance, behavior: smooth ? 'smooth' : 'auto' });
}
</script>

<template>
    <!--
        A row that scrolls sideways: the row is a focusable region (arrow keys scroll it); the arrow buttons are for
        the pointer only and show while there is more in that direction, the edges fade.
    -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <button
            v-if="edges.start"
            type="button"
            tabindex="-1"
            aria-hidden="true"
            data-side="start"
            :class="styles.button()"
            @click="scroll(false)"
        >
            <ChevronLeft :class="styles.buttonIcon()" />
        </button>
        <div
            ref="viewport"
            role="region"
            :aria-label="label"
            tabindex="0"
            :class="styles.viewport()"
            :data-more-start="edges.start ? '' : undefined"
            :data-more-end="edges.end ? '' : undefined"
            @scroll="update"
        >
            <slot />
        </div>
        <button
            v-if="edges.end"
            type="button"
            tabindex="-1"
            aria-hidden="true"
            data-side="end"
            :class="styles.button()"
            @click="scroll(true)"
        >
            <ChevronRight :class="styles.buttonIcon()" />
        </button>
    </div>
</template>
