<script setup lang="ts">
import { watermark as watermarkRecipe, watermarkBackground, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface WatermarkProps {
    /** Text of the watermark; several lines as an array */
    text?: string | string[];
    /** Image URL drawn instead of the text (e.g. a logo) */
    image?: string;
    /** Size of the image in px (default 120 × 64) */
    imageWidth?: number;
    imageHeight?: number;
    /** Rotation in degrees (default -22) */
    rotate?: number;
    /** Space between the repetitions in px: [horizontal, vertical] (default [96, 72]) */
    gap?: [number, number];
    /** Font size in px (default 16) */
    fontSize?: number;
    /** Text colour – a real colour, CSS variables do not work inside the image (default mid grey) */
    color?: string;
    /** Opacity 0–1 (default 0.15) */
    opacity?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof watermarkRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<WatermarkProps>();
const watermark = useRecipe('watermark', watermarkRecipe, () => props.classes);
const attrs = useAttrs();
const styles = watermark();
const background = computed(() =>
    watermarkBackground({
        text: props.text,
        image: props.image,
        imageWidth: props.imageWidth,
        imageHeight: props.imageHeight,
        rotate: props.rotate,
        gap: props.gap,
        fontSize: props.fontSize,
        color: props.color,
        opacity: props.opacity,
    })
);
</script>

<template>
    <!-- Content with a repeated text or image on top: decoration only (aria-hidden), clicks go through -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <slot />
        <div :class="styles.layer()" :style="background" aria-hidden="true" />
    </div>
</template>
