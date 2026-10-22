<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import { Maximize2, RotateCw, X, ZoomIn, ZoomOut } from '@lucide/vue';
import {
    dialog as dialogRecipe,
    imagePreview as imagePreviewRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs } from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface ImageProps {
    src: string;
    /** Describes the picture (WCAG 1.1.1) */
    alt: string;
    /** Opens the picture large on click, with zoom and rotation */
    preview?: boolean;
    /** Larger file for the preview; defaults to src */
    previewSrc?: string;
    /** Shown instead when the picture cannot be loaded (also in the preview) */
    fallbackSrc?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof imagePreviewRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ImageProps>(), {
    preview: false,
    previewSrc: undefined,
    fallbackSrc: undefined,
});
const dialog = useRecipe('dialog', dialogRecipe);
const imagePreview = useRecipe('imagePreview', imagePreviewRecipe, () => props.classes);
const attrs = useAttrs();
const styles = imagePreview();
const backdrop = dialog().backdrop();
const t = translations.image;
const zoom = ref(1);
const rotation = ref(0);
const reset = (open: boolean) => open && ((zoom.value = 1), (rotation.value = 0));
// A picture that fails shows the fallback (once per source)
const failed = ref<string | null>(null);
const shownSrc = computed(() => (props.fallbackSrc && failed.value === props.src ? props.fallbackSrc : props.src));
const previewFailed = ref(false);
const shownPreview = computed(() => (props.fallbackSrc && previewFailed.value ? props.fallbackSrc : props.previewSrc));
const fallback = computed(() =>
    props.fallbackSrc
        ? {
              onError: (event: Event) => {
                  (attrs.onError as ((event: Event) => void) | undefined)?.(event);
                  if (failed.value !== props.src) failed.value = props.src;
              },
          }
        : {}
);
</script>

<template>
    <img
        v-if="!preview"
        v-bind="{ ...attrs, ...fallback }"
        :src="shownSrc"
        :alt="alt"
        :class="styles.image({ class: normalizeClass(attrs.class) })"
    />
    <!-- With preview: a button around the picture opens a dialog (zoom, rotate; Escape closes) -->
    <Dialog.Root v-else lazy-mount unmount-on-exit @update:open="reset">
        <Dialog.Trigger :class="styles.trigger()" :aria-label="t.preview(alt)">
            <img
                v-bind="{ ...attrs, ...fallback }"
                :src="shownSrc"
                alt=""
                :class="styles.image({ class: normalizeClass(attrs.class) })"
            />
            <span :class="styles.hint()" aria-hidden="true"><Maximize2 :class="styles.hintIcon()" /></span>
        </Dialog.Trigger>
        <Teleport to="body">
            <Dialog.Backdrop :class="backdrop" />
            <Dialog.Positioner :class="styles.positioner()">
                <Dialog.Content :class="styles.content()" :aria-label="alt">
                    <div :class="styles.toolbar()">
                        <IconButton
                            :icon="ZoomIn"
                            :label="t.zoomIn"
                            variant="text"
                            size="sm"
                            :disabled="zoom >= 4"
                            @click="zoom = Math.min(4, zoom + 0.5)"
                        />
                        <IconButton
                            :icon="ZoomOut"
                            :label="t.zoomOut"
                            variant="text"
                            size="sm"
                            :disabled="zoom <= 0.5"
                            @click="zoom = Math.max(0.5, zoom - 0.5)"
                        />
                        <IconButton
                            :icon="RotateCw"
                            :label="t.rotate"
                            variant="text"
                            size="sm"
                            @click="rotation = (rotation + 90) % 360"
                        />
                        <Dialog.CloseTrigger as-child>
                            <IconButton :icon="X" :label="t.close" variant="text" size="sm" />
                        </Dialog.CloseTrigger>
                    </div>
                    <div :class="styles.stage()">
                        <img
                            :src="shownPreview ?? shownSrc"
                            v-bind="fallbackSrc ? { onError: () => (previewFailed = true) } : {}"
                            :alt="alt"
                            :class="styles.preview()"
                            :style="{ transform: `scale(${zoom}) rotate(${rotation}deg)` }"
                        />
                    </div>
                </Dialog.Content>
            </Dialog.Positioner>
        </Teleport>
    </Dialog.Root>
</template>
