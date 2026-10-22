<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import { computed, provide } from 'vue';
import { dialogRootKey } from '../Dialog/context.js';

export interface DrawerProps {
    /** Controlled state – use with v-model:open */
    open?: boolean;
    defaultOpen?: boolean;
    /** `false`: non-modal – no backdrop, no focus trap, the page stays usable next to the panel */
    modal?: boolean;
    /** Escape closes the drawer */
    closeOnEscape?: boolean;
    /** A click outside closes the drawer – by default for modal drawers */
    closeOnInteractOutside?: boolean;
}

const props = withDefaults(defineProps<DrawerProps>(), {
    open: undefined,
    defaultOpen: undefined,
    modal: true,
    closeOnEscape: true,
    closeOnInteractOutside: undefined,
});
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
provide(
    dialogRootKey,
    computed(() => ({ modal: props.modal }))
);
</script>

<template>
    <!-- Modal panel at the edge of the screen – a dialog: focus trap, Escape, scroll lock, focus returns -->
    <Dialog.Root
        :open="open"
        :default-open="defaultOpen"
        :modal="modal"
        :close-on-escape="closeOnEscape"
        :close-on-interact-outside="closeOnInteractOutside"
        lazy-mount
        unmount-on-exit
        @update:open="emit('update:open', $event)"
    >
        <slot />
    </Dialog.Root>
</template>
