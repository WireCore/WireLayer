<script setup lang="ts">
import {
    type RecipeClasses,
    setupToolbar,
    toolbar as toolbarRecipe,
    toolbarRegion as toolbarRegionRecipe,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, onMounted, useAttrs, useTemplateRef } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface ToolbarProps {
    /** Accessible name, e.g. "Formatting" */
    label: string;
    orientation?: 'horizontal' | 'vertical';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof toolbarRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ToolbarProps>(), { orientation: 'horizontal' });
const toolbar = useRecipe('toolbar', toolbarRecipe, () => props.classes);
const toolbarRegion = useRecipe('toolbarRegion', toolbarRegionRecipe);
const slots = defineSlots<{
    default?(): unknown;
    /** Start area (before the default content) – with start, center or end the toolbar has three areas */
    start?(): unknown;
    /** Centre area, stays in the middle */
    center?(): unknown;
    /** End area */
    end?(): unknown;
}>();
const attrs = useAttrs();
const regions = computed(() => !!(slots.start || slots.center || slots.end));
const element = useTemplateRef<HTMLElement>('element');
let cleanup: (() => void) | undefined;
onMounted(() => (cleanup = setupToolbar(element.value!, props.orientation)));
onBeforeUnmount(() => cleanup?.());
</script>

<template>
    <!-- Groups controls (role="toolbar"): one tab stop, arrow keys move between the controls (across all areas) -->
    <div
        ref="element"
        role="toolbar"
        :aria-label="label"
        :aria-orientation="orientation"
        :class="toolbar({ regions: regions || undefined, class: normalizeClass(attrs.class) })"
        :style="attrs.style"
    >
        <template v-if="regions">
            <div :class="toolbarRegion({ region: 'start' })"><slot name="start" /><slot /></div>
            <div :class="toolbarRegion({ region: 'center' })"><slot name="center" /></div>
            <div :class="toolbarRegion({ region: 'end' })"><slot name="end" /></div>
        </template>
        <slot v-else />
    </div>
</template>
