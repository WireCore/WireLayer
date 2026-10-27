<script setup lang="ts">
import { Tooltip } from '@ark-ui/vue/tooltip';
import { createLongPress, type RecipeClasses, tooltip as tooltipRecipe } from '@wirecore/wirelayer-recipes';
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import { tooltipGroupKey } from './context.js';
import { useRecipe } from '../../recipes.js';

export interface TooltipProps {
    /** Tooltip text – becomes the trigger's description (aria-describedby) */
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    /** Delay before opening (ms); default 400 or that of the TooltipGroup */
    openDelay?: number;
    /** Delay before closing (ms); default 150 or that of the TooltipGroup */
    closeDelay?: number;
    /** The pointer can move onto the tooltip without it closing (WCAG 1.4.13) */
    interactive?: boolean;
    /** Follows the mouse pointer over the trigger */
    followCursor?: boolean;
    /** Closes when the page (or a container around the trigger) scrolls – false keeps it open while scrolling */
    closeOnScroll?: boolean;
    /** Never opens (e.g. Truncate while the text fits) – the trigger stays the same element */
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tooltipRecipe>;
}

const props = withDefaults(defineProps<TooltipProps>(), { placement: 'top', interactive: true, closeOnScroll: true });
const tooltip = useRecipe('tooltip', tooltipRecipe, () => props.classes);
const styles = tooltip();
const group = inject(tooltipGroupKey, null);
const openDelay = computed(() => (group?.instant.value ? 0 : (props.openDelay ?? group?.openDelay() ?? 400)));
const closeDelay = computed(() => props.closeDelay ?? group?.closeDelay() ?? 150);

// Touch has no hover: a long press opens the tooltip, the next tap anywhere else closes it
const touchOpen = ref(false);
let trigger: Element | null = null;
const longPress = createLongPress(() => (touchOpen.value = true));
const closeOnTap = (event: PointerEvent) => {
    if (!trigger?.contains(event.target as Node)) touchOpen.value = false;
};
watch(touchOpen, (open) => {
    if (open) document.addEventListener('pointerdown', closeOnTap, true);
    else document.removeEventListener('pointerdown', closeOnTap, true);
});
onBeforeUnmount(() => {
    longPress.cancel();
    if (typeof document !== 'undefined') document.removeEventListener('pointerdown', closeOnTap, true);
});
function onPointerDown(event: PointerEvent) {
    trigger = event.currentTarget as Element;
    longPress.down(event);
}
// The click that ends a long press must not also press the trigger
function onClickCapture(event: MouseEvent) {
    if (!longPress.consumeClick()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
}

// followCursor: the anchor is the pointer position, read on every frame
let pointer: { x: number; y: number } | null = null;
const positioning = computed(() =>
    props.followCursor
        ? {
              placement: props.placement,
              gutter: 12,
              getAnchorRect: () => (pointer ? { ...pointer, width: 0, height: 0 } : null),
              listeners: { animationFrame: true },
          }
        : { placement: props.placement, gutter: 8 }
);
function onPointerMove(event: PointerEvent) {
    longPress.move(event);
    pointer = { x: event.clientX, y: event.clientY };
}
function onOpenChange(open: boolean) {
    if (open) return;
    touchOpen.value = false;
    group?.closed();
}
</script>

<template>
    <Tooltip.Root
        :open="touchOpen || undefined"
        :open-delay="openDelay"
        :close-delay="closeDelay"
        :positioning="positioning"
        :interactive="interactive"
        :close-on-scroll="closeOnScroll"
        :disabled="disabled"
        lazy-mount
        unmount-on-exit
        @update:open="onOpenChange"
    >
        <!-- No element of its own: the trigger is the slotted element -->
        <Tooltip.Trigger
            as-child
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="longPress.cancel()"
            @pointercancel="longPress.cancel()"
            @click.capture="onClickCapture"
        >
            <slot />
        </Tooltip.Trigger>
        <Teleport to="body">
            <Tooltip.Positioner>
                <Tooltip.Content :class="styles.content()">
                    <Tooltip.Arrow :class="styles.arrow()"><Tooltip.ArrowTip /></Tooltip.Arrow>
                    {{ content }}
                </Tooltip.Content>
            </Tooltip.Positioner>
        </Teleport>
    </Tooltip.Root>
</template>
