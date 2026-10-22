<script setup lang="ts">
import { ctaSection as ctaSectionRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs, useId } from 'vue';
import { useRecipe } from '@wirecore/wirelayer-vue';

export interface CtaSectionProps {
    title: string;
    description?: string;
    /** Decorative background image (e.g. the logo), shown faintly on the right */
    image?: string;
    /** Heading level that fits the page outline */
    titleTag?: 'h2' | 'h3' | 'h4';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof ctaSectionRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CtaSectionProps>(), { titleTag: 'h2' });
const ctaSection = useRecipe('ctaSection', ctaSectionRecipe, () => props.classes);
const attrs = useAttrs();
const styles = ctaSection();
const titleId = useId();
</script>

<template>
    <!-- A named region: the title labels it -->
    <section
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :aria-labelledby="titleId"
    >
        <img v-if="image" :src="image" alt="" :class="styles.image()" />
        <component :is="titleTag" :id="titleId" :class="styles.title()">{{ title }}</component>
        <p v-if="description" :class="styles.description()">{{ description }}</p>
        <div v-if="$slots.default" :class="styles.actions()"><slot /></div>
    </section>
</template>
