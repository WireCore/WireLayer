<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import { X } from '@lucide/vue';
import { dialog as dialogRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, ref, shallowRef, watch, type ComponentPublicInstance } from 'vue';
import Button from '../Button/Button.vue';
import Field from '../Field/Field.vue';
import Input from '../Input/Input.vue';
import { confirmRequest, type ConfirmButtonOptions, type ConfirmRequest } from './confirm.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface ConfirmDialogProps {
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Look of the confirm button in every request (default: size sm, `primary`, `danger` for status danger) */
    confirmButton?: ConfirmButtonOptions;
    /** Look of the cancel button in every request (default: size sm, `outline`) */
    cancelButton?: ConfirmButtonOptions;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dialogRecipe>;
}

const props = defineProps<ConfirmDialogProps>();
const dialog = useRecipe('dialog', dialogRecipe, () => props.classes);
// Keeps the content while the closing animation runs
const content = shallowRef<ConfirmRequest | null>(null);
// Text of prompt() or typeToConfirm; the error shows after the first attempt to confirm
const value = ref('');
const attempted = ref(false);
watch(
    confirmRequest,
    (request) => {
        if (!request) return;
        content.value = request;
        value.value = request.kind === 'prompt' ? (request.defaultValue ?? '') : '';
        attempted.value = false;
    },
    { immediate: true }
);
const styles = computed(() => dialog({ status: content.value?.status, position: content.value?.position }));
// The look of the buttons: the defaults, then the props, then the request
const confirmProps = computed<ConfirmButtonOptions>(() => ({
    variant: content.value?.status === 'danger' ? 'danger' : 'primary',
    size: 'sm',
    ...props.confirmButton,
    ...content.value?.confirmButton,
}));
const cancelProps = computed<ConfirmButtonOptions>(() => ({
    variant: 'outline',
    size: 'sm',
    ...props.cancelButton,
    ...content.value?.cancelButton,
}));
const typeToConfirm = computed(() => (content.value?.kind === 'confirm' ? content.value.typeToConfirm : undefined));
const inputLabel = computed(() => {
    if (content.value?.kind === 'prompt') return content.value.label;
    return typeToConfirm.value === undefined ? undefined : translations.confirm.typeToConfirm(typeToConfirm.value);
});
const error = computed(() => {
    const request = content.value;
    if (!request) return undefined;
    if (request.kind === 'prompt') return request.validate?.(value.value) ?? undefined;
    if (typeToConfirm.value !== undefined && value.value.trim() !== typeToConfirm.value)
        return translations.confirm.mismatch;
    return undefined;
});

function submit() {
    attempted.value = true;
    if (!error.value) confirmRequest.value?.settle(true, value.value);
}

const cancelButtonRef = ref<ComponentPublicInstance | null>(null);
const inputBox = ref<HTMLElement | null>(null);
// The text field gets the focus when there is one, otherwise cancelling (the safe choice)
const initialFocus = () =>
    inputBox.value?.querySelector('input') ?? (cancelButtonRef.value?.$el as HTMLElement | undefined) ?? null;
</script>

<template>
    <!-- Place once in the app; ask with `await confirm({ title, … })` or `await prompt({ title, label })` -->
    <Dialog.Root
        :open="!!confirmRequest"
        role="alertdialog"
        :initial-focus-el="initialFocus"
        :final-focus-el="() => content?.returnFocus ?? null"
        lazy-mount
        unmount-on-exit
        @update:open="!$event && confirmRequest?.settle(false)"
    >
        <Teleport v-if="content" to="body">
            <Dialog.Backdrop :class="styles.backdrop()" />
            <Dialog.Positioner :class="styles.positioner()">
                <Dialog.Content :class="styles.content()">
                    <div :class="styles.header()">
                        <span v-if="content.icon" :class="styles.iconBox()">
                            <component :is="content.icon" :class="styles.icon()" aria-hidden="true" />
                        </span>
                        <Dialog.CloseTrigger
                            :class="styles.close()"
                            :aria-label="closeLabel ?? translations.common.close"
                        >
                            <X :class="styles.closeIcon()" aria-hidden="true" />
                        </Dialog.CloseTrigger>
                    </div>
                    <div :class="styles.body()">
                        <Dialog.Title :class="styles.title()">{{ content.title }}</Dialog.Title>
                        <Dialog.Description v-if="content.description" :class="styles.description()">
                            {{ content.description }}
                        </Dialog.Description>
                        <div v-if="inputLabel" ref="inputBox">
                            <Field :label="inputLabel" :error="attempted ? error : undefined">
                                <Input
                                    v-model="value"
                                    :placeholder="content.kind === 'prompt' ? content.placeholder : undefined"
                                    autocomplete="off"
                                    @keydown.enter.prevent="submit"
                                />
                            </Field>
                        </div>
                    </div>
                    <div :class="styles.footer()">
                        <Button ref="cancelButtonRef" v-bind="cancelProps" @click="confirmRequest?.settle(false)">
                            {{ content.cancelLabel ?? translations.common.cancel }}
                        </Button>
                        <Button v-bind="confirmProps" @click="submit">
                            {{ content.confirmLabel ?? translations.common.confirm }}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Positioner>
        </Teleport>
    </Dialog.Root>
</template>
