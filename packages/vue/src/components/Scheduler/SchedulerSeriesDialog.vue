<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import { dialog as dialogRecipe, type RecurrenceScope } from '@wirecore/wirelayer-recipes';
import Button from '../Button/Button.vue';
import { useRecipe } from '../../recipes.js';

// The question when an occurrence of a series is moved: only this one, all of the series, or cancel (alertdialog);
// the focus goes back to the event afterwards

defineProps<{
    open: boolean;
    title: string;
    description: string;
    cancelLabel: string;
    onlyLabel: string;
    allLabel: string;
    /** Element that gets the focus after closing (the moved event) */
    returnFocus: () => HTMLElement | null;
}>();
const emit = defineEmits<{ choose: [scope: RecurrenceScope | null] }>();
const dialog = useRecipe('dialog', dialogRecipe, () => undefined);
const styles = dialog({ responsive: true });
</script>

<template>
    <Dialog.Root
        :open="open"
        role="alertdialog"
        :final-focus-el="returnFocus"
        lazy-mount
        unmount-on-exit
        @update:open="!$event && emit('choose', null)"
    >
        <Teleport to="body">
            <Dialog.Backdrop :class="styles.backdrop()" />
            <Dialog.Positioner :class="styles.positioner()">
                <Dialog.Content :class="styles.content()">
                    <div :class="styles.body()">
                        <Dialog.Title :class="styles.title()">{{ title }}</Dialog.Title>
                        <Dialog.Description :class="styles.description()">{{ description }}</Dialog.Description>
                    </div>
                    <div :class="styles.footer()">
                        <Button variant="outline" size="sm" @click="emit('choose', null)">{{ cancelLabel }}</Button>
                        <Button variant="outline" size="sm" @click="emit('choose', 'occurrence')">{{
                            onlyLabel
                        }}</Button>
                        <Button size="sm" @click="emit('choose', 'series')">{{ allLabel }}</Button>
                    </div>
                </Dialog.Content>
            </Dialog.Positioner>
        </Teleport>
    </Dialog.Root>
</template>
