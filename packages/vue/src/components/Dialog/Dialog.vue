<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import { computed, provide } from 'vue';
import { dialogRootKey } from './context.js';

export interface DialogProps {
    /** Controlled state – use with v-model:open */
    open?: boolean;
    defaultOpen?: boolean;
    /** "alertdialog" for confirmations that interrupt the user */
    role?: 'dialog' | 'alertdialog';
    /**
     * `false`: non-modal – no backdrop, no focus trap, no scroll lock; the page stays usable next to the dialog
     * (role="dialog" with aria-modal="false")
     */
    modal?: boolean;
    /** Escape closes the dialog */
    closeOnEscape?: boolean;
    /** A click outside closes the dialog – by default for modal dialogs, not for alertdialogs and non-modal ones */
    closeOnInteractOutside?: boolean;
}

const props = withDefaults(defineProps<DialogProps>(), {
    open: undefined,
    defaultOpen: undefined,
    role: 'dialog',
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
    <!-- Ark handles focus trap, aria-modal, Escape, scroll lock and returning focus to the trigger -->
    <Dialog.Root
        :open="open"
        :default-open="defaultOpen"
        :role="role"
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
