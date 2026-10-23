<script setup lang="ts">
import { HoverCard } from '@ark-ui/vue/hover-card';
import {
    hoverCard as hoverCardRecipe,
    type OverlayAnchor,
    type OverlayHandle,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed } from 'vue';
import { useAnchoredOverlay } from '../../overlay.js';
import { useRecipe } from '../../recipes.js';

export interface HoverCardProps {
    /** Delay before opening (ms) */
    openDelay?: number;
    /** Delay before closing (ms) – time to move the pointer onto the card */
    closeDelay?: number;
    /** Controlled state – use with v-model:open */
    open?: boolean;
    defaultOpen?: boolean;
    /** Element (or point) to open at instead of the trigger; open with v-model:open or the exposed `open(anchor)` */
    anchor?: OverlayAnchor | null;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof hoverCardRecipe>;
}

const props = withDefaults(defineProps<HoverCardProps>(), {
    openDelay: 500,
    closeDelay: 300,
    open: undefined,
    defaultOpen: undefined,
    anchor: undefined,
});
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
const hoverCard = useRecipe('hoverCard', hoverCardRecipe, () => props.classes);
const slots = defineSlots<{ default?(): unknown; content(): unknown }>();
const styles = hoverCard();
const overlay = useAnchoredOverlay({
    open: () => props.open,
    defaultOpen: () => props.defaultOpen,
    anchor: () => props.anchor,
    onOpenChange: (next) => emit('update:open', next),
});
defineExpose<OverlayHandle>(overlay.handle);
// One object until the inputs change – a new one on every render can make Ark re-render endlessly
const positioning = computed(() => overlay.positioning({}));
</script>

<template>
    <!--
        Extra information on hover or keyboard focus of the trigger (WCAG 1.4.13: stays while hovered, Escape closes).
        Only additional content – everything essential must be reachable without it.
    -->
    <HoverCard.Root
        :open="overlay.isOpen.value"
        :open-delay="openDelay"
        :close-delay="closeDelay"
        :positioning="positioning"
        lazy-mount
        unmount-on-exit
        @update:open="overlay.onOpenChange($event)"
    >
        <HoverCard.Trigger v-if="slots.default" as-child><slot /></HoverCard.Trigger>
        <Teleport to="body">
            <HoverCard.Positioner>
                <HoverCard.Content :class="styles.content()">
                    <HoverCard.Arrow :class="styles.arrow()"
                        ><HoverCard.ArrowTip :class="styles.arrowTip()"
                    /></HoverCard.Arrow>
                    <slot name="content" />
                </HoverCard.Content>
            </HoverCard.Positioner>
        </Teleport>
    </HoverCard.Root>
</template>
