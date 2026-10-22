<script setup lang="ts">
import { blockUi as blockUiRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import Spinner from '../Spinner/Spinner.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface BlockUiProps {
    /** Covers the content and makes it inert */
    blocked?: boolean;
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof blockUiRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<BlockUiProps>(), { blocked: false });
const blockUi = useRecipe('blockUi', blockUiRecipe, () => props.classes);
const attrs = useAttrs();
const styles = blockUi();
</script>

<template>
    <!-- While blocked: the content is inert (no focus, no clicks) and busy; the overlay says why -->
    <div
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :aria-busy="blocked || undefined"
    >
        <div :inert="blocked || undefined"><slot /></div>
        <div v-if="blocked" :class="styles.overlay()" role="status">
            <Spinner :label="label ?? translations.blockUi.label" />
            {{ label ?? translations.blockUi.label }}
        </div>
    </div>
</template>
