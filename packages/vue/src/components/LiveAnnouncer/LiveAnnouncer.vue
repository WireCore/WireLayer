<script setup lang="ts">
import { announcer, liveAnnouncer as liveAnnouncerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface LiveAnnouncerProps {
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof liveAnnouncerRecipe>;
}

const props = defineProps<LiveAnnouncerProps>();
const liveAnnouncer = useRecipe('liveAnnouncer', liveAnnouncerRecipe, () => props.classes);
const polite = useTemplateRef<HTMLElement>('polite');
const assertive = useTemplateRef<HTMLElement>('assertive');
let release = () => {};
onMounted(() => {
    if (polite.value && assertive.value)
        release = announcer.attach({ polite: polite.value, assertive: assertive.value });
});
onBeforeUnmount(() => release());
</script>

<template>
    <!--
        The live regions for announce() – one per politeness, rendered on the server already (screen readers only pick
        up regions that exist before their text changes). Without a LiveAnnouncer, announce() adds them to <body>.
    -->
    <slot />
    <div :class="liveAnnouncer()" data-wc-announcer="">
        <div ref="polite" role="status" aria-live="polite" aria-atomic="true" />
        <div ref="assertive" role="alert" aria-live="assertive" aria-atomic="true" />
    </div>
</template>
