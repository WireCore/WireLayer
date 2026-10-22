<script setup lang="ts">
import { ScrollArea } from '@ark-ui/vue/scroll-area';
import { type RecipeClasses, scrollPanel as scrollPanelRecipe } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface ScrollPanelProps {
    /** Names the scrollable region – it is focusable, so keyboard users can scroll it */
    label: string;
    /** When the scrollbars show: `auto` (on overflow, default), `hover`, `always` or `hidden` */
    scrollbars?: 'auto' | 'hover' | 'always' | 'hidden';
    /** Fades the top and bottom edge while there is more to scroll in that direction */
    fade?: boolean;
    /** Distance in pixels from the start/end at which `reachStart`/`reachEnd` fire (default 0) */
    reachThreshold?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof scrollPanelRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ScrollPanelProps>(), { fade: undefined, reachThreshold: 0 });
const emit = defineEmits<{
    /** Scrolled back to the top */
    reachStart: [];
    /** Scrolled to the bottom, e.g. to load more */
    reachEnd: [];
}>();
const scrollPanel = useRecipe('scrollPanel', scrollPanelRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => scrollPanel({ scrollbars: props.scrollbars, fade: props.fade }));

// Fires once when the start or end is reached (vertically)
let atStart = true;
let atEnd = false;
function onScroll(event: Event) {
    const viewport = event.currentTarget as HTMLElement;
    const start = viewport.scrollTop <= props.reachThreshold;
    const end = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - props.reachThreshold - 1;
    if (start && !atStart) emit('reachStart');
    if (end && !atEnd) emit('reachEnd');
    atStart = start;
    atEnd = end;
}
</script>

<template>
    <!-- Native scrolling with slim scrollbars; the viewport is a named, focusable region (arrow keys scroll) -->
    <ScrollArea.Root :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <ScrollArea.Viewport
            :class="styles.viewport()"
            tabindex="0"
            role="region"
            :aria-label="label"
            @scroll="onScroll"
        >
            <ScrollArea.Content :class="styles.content()"><slot /></ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" :class="styles.scrollbar()">
            <ScrollArea.Thumb :class="styles.thumb()" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Scrollbar orientation="horizontal" :class="styles.scrollbar()">
            <ScrollArea.Thumb :class="styles.thumb()" />
        </ScrollArea.Scrollbar>
    </ScrollArea.Root>
</template>
