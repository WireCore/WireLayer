<script setup lang="ts">
import { inlineCode as inlineCodeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface CodeProps {
    /** The code (one line) – or pass it as the content */
    code?: string;
    /** Extra classes of the recipe (see the recipe inlineCode) */
    classes?: RecipeClasses<typeof inlineCodeRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<CodeProps>();
const inlineCode = useRecipe('inlineCode', inlineCodeRecipe, () => props.classes);
const attrs = useAttrs();
</script>

<template>
    <!-- Code inside a sentence, without syntax colours: the look of InlineCode (/code) without shiki -->
    <code v-bind="{ ...attrs, class: inlineCode({ class: normalizeClass(attrs.class) }) }"
        ><slot>{{ code }}</slot></code
    >
</template>
