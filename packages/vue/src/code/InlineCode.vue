<script setup lang="ts">
import { inlineCode as inlineCodeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, ref, useAttrs, watch } from 'vue';
import { useRecipe } from '../recipes.js';
import { plainLines, tokenize, tokenStyle, type CodeLanguageInput, type CodeToken } from './highlight.js';

export interface InlineCodeProps {
    /** The code (one line) */
    code: string;
    /** Language id or alias, e.g. "ts", "css", "bash" (default: plain text) */
    language?: string;
    /** More grammars than the built-in ones (see CodeHighlight) */
    languages?: CodeLanguageInput[];
    /** Extra classes of the recipe (see the recipe) */
    classes?: RecipeClasses<typeof inlineCodeRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<InlineCodeProps>(), { language: 'text', languages: () => [] });
const inlineCode = useRecipe('inlineCode', inlineCodeRecipe, () => props.classes);
const attrs = useAttrs();
const tokens = ref<CodeToken[]>(plainLines(props.code).flat());
watch(
    () => [props.code, props.language, props.languages] as const,
    async ([code, language, languages], _, onCleanup) => {
        tokens.value = plainLines(code).flat();
        if (typeof window === 'undefined') return;
        let cancelled = false;
        onCleanup(() => (cancelled = true));
        const lines = await tokenize(code, language, languages);
        if (!cancelled) tokens.value = lines.flat();
    },
    { immediate: true }
);
</script>

<template>
    <!-- Code inside a sentence, with syntax colours -->
    <code v-bind="{ ...attrs, class: inlineCode({ class: normalizeClass(attrs.class) }) }"
        ><span v-for="(token, index) in tokens" :key="index" :style="tokenStyle(token)">{{ token.content }}</span></code
    >
</template>
