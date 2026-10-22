<script setup lang="ts">
import { Popover } from '@ark-ui/vue/popover';
import { confirmPopup as confirmPopupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ref, useId, type ComponentPublicInstance } from 'vue';
import Button from '../Button/Button.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface ConfirmPopupProps {
    /** The question, e.g. "Delete the server?" */
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** The confirm button in the danger colour */
    danger?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof confirmPopupRecipe>;
}

const props = withDefaults(defineProps<ConfirmPopupProps>(), {
    danger: false,
});
const confirmPopup = useRecipe('confirmPopup', confirmPopupRecipe, () => props.classes);
const emit = defineEmits<{ confirm: []; cancel: [] }>();
const styles = confirmPopup();
const id = useId();
const open = ref(false);
const cancelButton = ref<ComponentPublicInstance | null>(null);

// Escape or a click outside count as cancel – but not after an answer closed it
let answered = false;
function settle(confirmed: boolean) {
    answered = true;
    open.value = false;
    if (confirmed) emit('confirm');
    else emit('cancel');
}
function onOpenChange(next: boolean) {
    open.value = next;
    if (next) answered = false;
    else if (!answered) emit('cancel');
}
</script>

<template>
    <!--
        Asks right at the control (e.g. a delete button). An alert dialog without a backdrop: the focus starts on the
        safe answer, Escape cancels, then it returns to the control.
    -->
    <Popover.Root
        :open="open"
        :initial-focus-el="() => (cancelButton?.$el as HTMLElement | undefined) ?? null"
        :positioning="{ placement: 'bottom', gutter: 8 }"
        lazy-mount
        unmount-on-exit
        @update:open="onOpenChange"
    >
        <Popover.Trigger as-child><slot /></Popover.Trigger>
        <Teleport to="body">
            <Popover.Positioner>
                <Popover.Content :class="styles.content()" role="alertdialog" :aria-labelledby="`${id}message`">
                    <p :id="`${id}message`" :class="styles.message()">{{ message }}</p>
                    <div :class="styles.actions()">
                        <Button ref="cancelButton" variant="outline" size="sm" @click="settle(false)">
                            {{ cancelLabel ?? translations.confirmPopup.cancel }}
                        </Button>
                        <Button :variant="danger ? 'danger' : 'primary'" size="sm" @click="settle(true)">
                            {{ confirmLabel ?? translations.confirmPopup.confirm }}
                        </Button>
                    </div>
                </Popover.Content>
            </Popover.Positioner>
        </Teleport>
    </Popover.Root>
</template>
