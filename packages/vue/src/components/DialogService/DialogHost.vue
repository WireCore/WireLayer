<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import { X } from '@lucide/vue';
import { dialog as dialogRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { onBeforeUnmount } from 'vue';
import { dialogStack, removeClosedDialogs, removeDialog, type DialogRequest } from './dialogs.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface DialogHostProps {
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dialogRecipe>;
}

const props = defineProps<DialogHostProps>();
const dialog = useRecipe('dialog', dialogRecipe, () => props.classes);
const stylesOf = (request: DialogRequest) =>
    dialog({
        size: request.size,
        position: request.position,
        fullscreen: request.fullscreen,
        scrollBehavior: request.scrollBehavior,
        responsive: true,
    });
const componentProps = (request: DialogRequest) =>
    request.data === undefined ? request.props : { ...request.props, data: request.data };
// Closed dialogs would otherwise stay in the stack when their exit animation never ends
onBeforeUnmount(removeClosedDialogs);
</script>

<template>
    <!-- Place once in the app; open with `await openDialog({ title, component })` -->
    <Dialog.Root
        v-for="request in dialogStack"
        :key="request.id"
        :open="request.open"
        :close-on-escape="request.closeOnEscape"
        :close-on-interact-outside="request.closeOnInteractOutside"
        :final-focus-el="() => request.returnFocus"
        @update:open="!$event && request.settle(undefined)"
        @exit-complete="removeDialog(request.id)"
    >
        <Teleport to="body">
            <Dialog.Backdrop :class="stylesOf(request).backdrop()" />
            <Dialog.Positioner :class="stylesOf(request).positioner()">
                <Dialog.Content :class="stylesOf(request).content()">
                    <div :class="stylesOf(request).header()">
                        <Dialog.CloseTrigger
                            v-if="request.closable !== false"
                            :class="stylesOf(request).close()"
                            :aria-label="closeLabel ?? translations.common.close"
                        >
                            <X :class="stylesOf(request).closeIcon()" aria-hidden="true" />
                        </Dialog.CloseTrigger>
                    </div>
                    <div :class="stylesOf(request).body()">
                        <Dialog.Title :class="stylesOf(request).title()">{{ request.title }}</Dialog.Title>
                        <Dialog.Description v-if="request.description" :class="stylesOf(request).description()">
                            {{ request.description }}
                        </Dialog.Description>
                        <component :is="request.component" v-bind="componentProps(request)" :close="request.settle" />
                    </div>
                </Dialog.Content>
            </Dialog.Positioner>
        </Teleport>
    </Dialog.Root>
</template>
