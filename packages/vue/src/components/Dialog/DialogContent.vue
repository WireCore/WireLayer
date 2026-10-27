<script setup lang="ts">
import { Dialog, useDialogContext } from '@ark-ui/vue/dialog';
import { Maximize2, Minimize2, X } from '@lucide/vue';
import {
    dialog as dialogRecipe,
    dialogMoveKeys,
    type DialogPosition,
    type DialogStatus,
    type OverlaySize,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, inject, normalizeClass, ref, useAttrs, watch, type Component } from 'vue';
import { dialogRootKey } from './context.js';
import { useDialogDrag } from './drag.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface DialogContentProps {
    title: string;
    /** The title only for screen readers – it still names the dialog (e.g. a video in a dialog) */
    hideTitle?: boolean;
    description?: string;
    /** Icon component in the coloured box at the top */
    icon?: Component;
    status?: DialogStatus;
    /**
     * Maximum width: sm 320px (20rem), md 400px (25rem, default), lg 560px (35rem), xl 800px (50rem), full (screen
     * width minus the margin). Another width: leave out `size` and set the CSS variable, e.g.
     * style="--wc-dialog-w: 36rem"
     */
    size?: OverlaySize;
    /** Where the dialog sits: centred (default), at the top/bottom or the start/end edge */
    position?: DialogPosition;
    /** Covers the whole screen */
    fullscreen?: boolean;
    /** Button in the header that switches between the normal size and the whole screen */
    maximizable?: boolean;
    /** Maximized state of a maximizable dialog – use with v-model:maximized */
    maximized?: boolean;
    defaultMaximized?: boolean;
    /** Moved by dragging the header; the keyboard moves it with Alt + arrow keys (Shift: larger steps) */
    draggable?: boolean;
    /** Shows the close button in the header */
    closable?: boolean;
    /** `inside`: only the body scrolls, header and footer stay in place; `outside` (default): the whole dialog scrolls */
    scrollBehavior?: 'inside' | 'outside';
    /** Full width on small screens (below 640px) */
    responsive?: boolean;
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Accessible names of the maximize button: maximize / restore */
    maximizeLabel?: string;
    restoreLabel?: string;
    /** Element the dialog is rendered into (default: the page body) – e.g. an element in full-screen mode */
    portalTarget?: HTMLElement | null;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dialogRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<DialogContentProps>(), {
    maximized: undefined,
    closable: true,
    responsive: true,
});
const emit = defineEmits<{ 'update:maximized': [maximized: boolean] }>();
defineSlots<{
    /** The content below the title */
    default?(): unknown;
    /** Buttons at the bottom, e.g. Cancel and Save (right-aligned) */
    footer?(): unknown;
}>();
const dialog = useRecipe('dialog', dialogRecipe, () => props.classes);
const attrs = useAttrs();
const root = inject(dialogRootKey, null);
const modal = computed(() => root?.value.modal ?? true);

const internalMaximized = ref(props.defaultMaximized ?? false);
const isMaximized = computed(() => props.maximized ?? internalMaximized.value);
function toggleMaximized() {
    const next = !isMaximized.value;
    internalMaximized.value = next;
    emit('update:maximized', next);
}

const drag = useDialogDrag(() => props.draggable && !isMaximized.value && !props.fullscreen);
// A reopened dialog starts in its place again
const context = useDialogContext();
watch(
    () => context.value.open,
    (open) => !open && drag.reset()
);

const styles = computed(() =>
    dialog({
        status: props.status,
        size: props.size,
        position: props.position,
        scrollBehavior: props.scrollBehavior,
        fullscreen: props.fullscreen || isMaximized.value,
        responsive: props.responsive,
        draggable: props.draggable && !isMaximized.value,
        maximizable: props.maximizable,
        hideTitle: props.hideTitle,
    })
);
</script>

<template>
    <Teleport :to="portalTarget ?? 'body'">
        <Dialog.Backdrop v-if="modal" :class="styles.backdrop()" />
        <Dialog.Positioner :class="styles.positioner()">
            <Dialog.Content
                v-bind="{
                    ...attrs,
                    class: styles.content({ class: normalizeClass(attrs.class) }),
                    ...(drag.style.value ? { style: [attrs.style, drag.style.value] } : {}),
                    ...(draggable ? { 'aria-keyshortcuts': dialogMoveKeys } : {}),
                }"
                @keydown="draggable && drag.onKeyDown($event)"
            >
                <div :class="styles.header()" v-on="draggable ? drag.header : {}">
                    <span v-if="icon" :class="styles.iconBox()">
                        <component :is="icon" :class="styles.icon()" aria-hidden="true" />
                    </span>
                    <button
                        v-if="maximizable"
                        type="button"
                        :class="styles.maximize()"
                        :aria-label="
                            isMaximized
                                ? (restoreLabel ?? translations.dialog.restore)
                                : (maximizeLabel ?? translations.dialog.maximize)
                        "
                        @click="toggleMaximized"
                    >
                        <component
                            :is="isMaximized ? Minimize2 : Maximize2"
                            :class="styles.maximizeIcon()"
                            aria-hidden="true"
                        />
                    </button>
                    <Dialog.CloseTrigger
                        v-if="closable"
                        :class="styles.close()"
                        :aria-label="closeLabel ?? translations.common.close"
                    >
                        <X :class="styles.closeIcon()" aria-hidden="true" />
                    </Dialog.CloseTrigger>
                </div>
                <div :class="styles.body()">
                    <Dialog.Title :class="styles.title()">{{ title }}</Dialog.Title>
                    <Dialog.Description v-if="description" :class="styles.description()">
                        {{ description }}
                    </Dialog.Description>
                    <slot />
                </div>
                <div v-if="$slots.footer" :class="styles.footer()"><slot name="footer" /></div>
            </Dialog.Content>
        </Dialog.Positioner>
    </Teleport>
</template>
