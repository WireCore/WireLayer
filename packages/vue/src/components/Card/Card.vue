<script setup lang="ts">
import { ark } from '@ark-ui/vue/factory';
import { card as cardRecipe, cardParts as cardPartsRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface CardProps {
    /**
     * Hover state and glow, for cards that act as a link or button.
     * Combine with `asChild` and an `<a>`/`<button>` – a clickable `<div>` is not keyboard accessible.
     */
    interactive?: boolean;
    /** Render the slotted element (e.g. a link) with card styles instead of a <div> (the parts are not rendered) */
    asChild?: boolean;
    /** Heading of the card (also via #title) */
    title?: string;
    /** Line below the title (also via #subtitle) */
    subtitle?: string;
    /** Element of the title – pick the level that fits the page outline */
    titleTag?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
    /** `horizontal`: media at the start, the content beside it */
    orientation?: 'vertical' | 'horizontal';
    /** Extra classes per part of the component, e.g. { base: "…", title: "…" } (see the recipes card and cardParts) */
    classes?: RecipeClasses<typeof cardRecipe> & RecipeClasses<typeof cardPartsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CardProps>(), { titleTag: 'h3', orientation: 'vertical' });
const slots = defineSlots<{
    default?: () => unknown;
    /** Image or video above the content (beside it when horizontal) */
    media?: () => unknown;
    title?: () => unknown;
    subtitle?: () => unknown;
    /** Extra content in the header, after the title (e.g. a badge or a menu) */
    header?: () => unknown;
    /** Actions at the end of the card */
    footer?: () => unknown;
}>();
const card = useRecipe('card', cardRecipe, () => props.classes);
const cardParts = useRecipe('cardParts', cardPartsRecipe, () => props.classes);
const attrs = useAttrs();
const horizontal = computed(() => props.orientation === 'horizontal');
const parts = computed(() => cardParts({ horizontal: horizontal.value }));
const hasTitle = computed(() => !!props.title || !!slots.title || !!props.subtitle || !!slots.subtitle);
// Without title, media, header or footer the card renders its content as before
const hasParts = computed(
    () => !props.asChild && (hasTitle.value || !!slots.media || !!slots.header || !!slots.footer)
);
</script>

<template>
    <ark.div
        v-if="!hasParts"
        v-bind="{
            ...attrs,
            class: card({ interactive, horizontal: horizontal || undefined, class: normalizeClass(attrs.class) }),
        }"
        :as-child="asChild"
    >
        <slot />
    </ark.div>
    <div
        v-else
        v-bind="{
            ...attrs,
            class: card({ interactive, horizontal: horizontal || undefined, class: normalizeClass(attrs.class) }),
        }"
    >
        <div v-if="slots.media" :class="parts.media()"><slot name="media" /></div>
        <div :class="parts.content()">
            <div v-if="hasTitle || slots.header" :class="parts.header()">
                <div v-if="hasTitle" :class="parts.heading()">
                    <component :is="titleTag" v-if="title || slots.title" :class="parts.title()"
                        ><slot name="title">{{ title }}</slot></component
                    >
                    <p v-if="subtitle || slots.subtitle" :class="parts.subtitle()">
                        <slot name="subtitle">{{ subtitle }}</slot>
                    </p>
                </div>
                <slot name="header" />
            </div>
            <slot />
            <div v-if="slots.footer" :class="parts.footer()"><slot name="footer" /></div>
        </div>
    </div>
</template>
