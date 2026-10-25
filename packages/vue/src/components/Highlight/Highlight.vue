<script setup lang="ts">
import { Highlight } from '@ark-ui/vue/highlight';
import {
    highlight as highlightRecipe,
    highlightChunks,
    type HighlightColor,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface HighlightProps {
    text: string;
    /** Word(s) to mark */
    query: string | string[];
    ignoreCase?: boolean;
    /** Every hit, not only the first */
    matchAll?: boolean;
    /** Only complete words ("Server" does not mark "Webserver") */
    wholeWord?: boolean;
    /** Ignores accents: "Muller" finds "Müller" */
    ignoreAccents?: boolean;
    /** Colour per search term, in the order of `query` (default: all warn) */
    colors?: readonly HighlightColor[];
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof highlightRecipe>;
}

const props = withDefaults(defineProps<HighlightProps>(), { ignoreCase: true, matchAll: true });
const highlight = useRecipe('highlight', highlightRecipe, () => props.classes);
// Ark marks plain hits; whole words, accents and colours per term need the own splitting
const own = computed(() => props.wholeWord || props.ignoreAccents || !!props.colors?.length);
const chunks = computed(() =>
    own.value
        ? highlightChunks(props.text, props.query, {
              ignoreCase: props.ignoreCase,
              matchAll: props.matchAll,
              wholeWord: props.wholeWord,
              ignoreAccents: props.ignoreAccents,
          })
        : []
);
</script>

<template>
    <!-- Text with the hits as <mark> -->
    <Highlight
        v-if="!own"
        :text="text"
        :query="query"
        :ignore-case="ignoreCase"
        :match-all="matchAll"
        :class="highlight()"
    />
    <template v-for="(chunk, index) in chunks" v-else :key="index">
        <mark v-if="chunk.match" :class="highlight({ color: colors?.[chunk.term ?? 0] })">{{ chunk.text }}</mark>
        <template v-else>{{ chunk.text }}</template>
    </template>
</template>
