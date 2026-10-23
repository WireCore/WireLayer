<script setup lang="ts">
import { Popover } from '@ark-ui/vue/popover';
import type { OverlayAnchor, OverlayHandle } from '@wirecore/wirelayer-recipes';
import { computed, provide } from 'vue';
import { popoverRootKey } from './context.js';
import { useAnchoredOverlay } from '../../overlay.js';

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right' | `${'top' | 'bottom'}-${'start' | 'end'}`;

export interface PopoverProps {
    /** Controlled state – use with v-model:open */
    open?: boolean;
    defaultOpen?: boolean;
    placement?: PopoverPlacement;
    /**
     * Element (or point) to open at instead of the trigger – e.g. a table cell; open with v-model:open or the
     * exposed `open(anchor)`
     */
    anchor?: OverlayAnchor | null;
    /** `trigger`: as wide as the trigger or anchor */
    width?: 'trigger';
    /** Keeps the focus inside the panel and makes the page behind inert (modal popover) */
    trapFocus?: boolean;
    /** Dims the page behind the panel */
    overlay?: boolean;
}

const props = withDefaults(defineProps<PopoverProps>(), {
    open: undefined,
    defaultOpen: undefined,
    placement: 'bottom',
    anchor: undefined,
});
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
const overlay = useAnchoredOverlay({
    open: () => props.open,
    defaultOpen: () => props.defaultOpen,
    anchor: () => props.anchor,
    onOpenChange: (next) => emit('update:open', next),
});
provide(
    popoverRootKey,
    computed(() => ({ overlay: props.overlay, width: props.width }))
);
defineExpose<OverlayHandle>(overlay.handle);
// One object until the inputs change – a new one on every render can make Ark re-render endlessly
const positioning = computed(() =>
    overlay.positioning({ placement: props.placement, gutter: 10, sameWidth: props.width === 'trigger' })
);
</script>

<template>
    <!-- Non-modal panel next to its trigger; Escape and clicking outside close it, focus returns to the trigger -->
    <Popover.Root
        :open="overlay.isOpen.value"
        :positioning="positioning"
        :modal="trapFocus"
        :final-focus-el="overlay.finalFocusEl"
        lazy-mount
        unmount-on-exit
        @update:open="overlay.onOpenChange($event)"
    >
        <slot />
    </Popover.Root>
</template>
