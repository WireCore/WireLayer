<script setup lang="ts">
import { ImageCropper, useImageCropper } from '@ark-ui/vue/image-cropper';
import { FlipHorizontal2, RotateCcw, RotateCcwSquare, RotateCwSquare, ZoomIn, ZoomOut } from '@lucide/vue';
import { blobToCanvas, imageCropper as imageCropperRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ImageCropperProps {
    /** Image URL (an object URL of a chosen file works, too) */
    src: string;
    /** Width / height of the crop area, e.g. 1 or 16 / 9 (free without) */
    aspectRatio?: number;
    /** Rectangle (default) or circle (e.g. for avatars) */
    cropShape?: 'rectangle' | 'circle';
    /** Zoom factor – use with v-model:zoom */
    zoom?: number;
    /** Rotation in degrees – use with v-model:rotation */
    rotation?: number;
    /** Smallest and largest zoom (default 1 and 5) */
    minZoom?: number;
    maxZoom?: number;
    /** Buttons for zoom, rotation, mirroring and reset (default true) */
    toolbar?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof imageCropperRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ImageCropperProps>(), {
    cropShape: 'rectangle',
    zoom: undefined,
    rotation: undefined,
    minZoom: 1,
    maxZoom: 5,
    toolbar: true,
});
const emit = defineEmits<{
    'update:zoom': [zoom: number];
    'update:rotation': [rotation: number];
    /** The crop area changed (in px of the shown image) */
    cropChange: [crop: { x: number; y: number; width: number; height: number }];
}>();
const imageCropper = useRecipe('imageCropper', imageCropperRecipe, () => props.classes);
const attrs = useAttrs();
const t = useTranslations().imageCropper;
const styles = imageCropper();
const api = useImageCropper(
    computed(() => ({
        aspectRatio: props.aspectRatio,
        cropShape: props.cropShape,
        zoom: props.zoom,
        rotation: props.rotation,
        minZoom: props.minZoom,
        maxZoom: props.maxZoom,
        translations: {
            rootLabel: t.label,
            rootRoleDescription: t.roleDescription,
            previewLoading: t.loading,
            previewDescription: ({ zoom, rotation }: { zoom: number | null; rotation: number | null }) =>
                t.description(zoom, rotation),
            selectionLabel: ({ shape }: { shape: string }) => t.selection(shape === 'circle'),
            selectionRoleDescription: t.selectionRoleDescription,
            selectionInstructions: t.instructions,
            selectionValueText: ({ width, height, x, y }: { width: number; height: number; x: number; y: number }) =>
                t.selectionValue(width, height, x, y),
        },
        onZoomChange: (details: { zoom: number }) => emit('update:zoom', details.zoom),
        onRotationChange: (details: { rotation: number }) => emit('update:rotation', details.rotation),
        onCropChange: (details: { crop: { x: number; y: number; width: number; height: number } }) =>
            emit('cropChange', details.crop),
    }))
);
const handles = ['nw', 'ne', 'sw', 'se'] as const;

/** The cropped image as Blob (default, PNG) or data URL – zoom, rotation and mirroring applied */
function getCroppedImage(options?: {
    type?: string;
    quality?: number;
    maxSize?: { width: number; height: number };
    output?: 'blob' | 'dataUrl';
}) {
    return api.value.getCroppedImage(options);
}
/** The cropped image on a canvas */
async function getCanvas(options?: { maxSize?: { width: number; height: number } }) {
    const blob = await api.value.getCroppedImage({ ...options, output: 'blob' });
    return blob instanceof Blob ? blobToCanvas(blob) : null;
}
defineExpose({ getCroppedImage, getCanvas, reset: () => api.value.reset() });
</script>

<template>
    <!--
        The image with a crop area (a slider): arrow keys move it, Alt+arrows resize it, + and − zoom; drag the
        area or its corners, drag the image to pan. The toolbar does the same with buttons.
    -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <ImageCropper.RootProvider :value="api" :class="styles.root()">
            <ImageCropper.Viewport :class="styles.viewport()">
                <ImageCropper.Image :src="src" :class="styles.image()" />
                <ImageCropper.Selection :class="styles.selection()">
                    <ImageCropper.Handle
                        v-for="position in handles"
                        :key="position"
                        :position="position"
                        :class="styles.handle()"
                    />
                    <ImageCropper.Grid axis="horizontal" :class="styles.grid()" />
                    <ImageCropper.Grid axis="vertical" :class="styles.grid()" />
                </ImageCropper.Selection>
            </ImageCropper.Viewport>
        </ImageCropper.RootProvider>
        <div v-if="toolbar" role="group" :aria-label="t.toolbar" :class="styles.toolbar()">
            <IconButton :icon="ZoomOut" :label="t.zoomOut" variant="text" size="sm" @click="api.zoomBy(-0.1)" />
            <span :class="styles.zoom()" aria-hidden="true">{{ Math.round(api.zoom * 100) }} %</span>
            <IconButton :icon="ZoomIn" :label="t.zoomIn" variant="text" size="sm" @click="api.zoomBy(0.1)" />
            <IconButton
                :icon="RotateCcwSquare"
                :label="t.rotateLeft"
                variant="text"
                size="sm"
                @click="api.rotateBy(-90)"
            />
            <IconButton
                :icon="RotateCwSquare"
                :label="t.rotateRight"
                variant="text"
                size="sm"
                @click="api.rotateBy(90)"
            />
            <IconButton
                :icon="FlipHorizontal2"
                :label="t.flip"
                variant="text"
                size="sm"
                @click="api.flipHorizontally()"
            />
            <IconButton :icon="RotateCcw" :label="t.reset" variant="text" size="sm" @click="api.reset()" />
        </div>
    </div>
</template>
