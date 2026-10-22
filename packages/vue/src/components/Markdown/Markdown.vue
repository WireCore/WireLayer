<script setup lang="ts">
import {
    markdownElements,
    prose as proseRecipe,
    type MarkdownElement,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, h, normalizeClass, useAttrs, type VNode } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface MarkdownProps {
    /** The Markdown text – rendered as elements, never as HTML (raw HTML in it stays text) */
    source: string;
    /** Heading level of `#` (default 2, so `#` fits below the page's h1) */
    headingLevel?: number;
    /** A single line break is a break (chat style) instead of a space */
    breaks?: boolean;
    /** target of links, e.g. "_blank" */
    linkTarget?: string;
    /** rel of links (default "noopener noreferrer nofollow") */
    linkRel?: string;
    /** Extra classes of the prose recipe (see the recipe) */
    classes?: RecipeClasses<typeof proseRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<MarkdownProps>();
const slots = defineSlots<{
    /** A code block, e.g. with CodeHighlight (default: pre/code) */
    code?(props: { language?: string; code: string }): unknown;
}>();
const prose = useRecipe('prose', proseRecipe, () => props.classes);
const attrs = useAttrs();
const elements = computed(() =>
    markdownElements(props.source, {
        headingLevel: props.headingLevel,
        breaks: props.breaks,
        linkTarget: props.linkTarget,
        linkRel: props.linkRel,
    })
);

// Booleans and the checked state as attributes ('^'), as React renders them
const toAttrs = (attributes: MarkdownElement['attrs']) =>
    Object.fromEntries(
        Object.entries(attributes).map(([name, value]) =>
            typeof value === 'boolean' ? [`^${name}`, value ? '' : undefined] : [name, value]
        )
    );
const toVNode = (node: MarkdownElement | string): VNode | string => {
    if (typeof node === 'string') return node;
    if (node.code && slots.code)
        return h('div', {}, slots.code({ language: node.code.language, code: node.code.text }) as VNode[]);
    return h(node.tag, toAttrs(node.attrs), node.children.length ? node.children.map(toVNode) : undefined);
};
const Content = () => elements.value.map(toVNode);
</script>

<template>
    <!-- Markdown as elements with the prose typography: headings, lists, links (rel), code, quotes, tables -->
    <div v-bind="{ ...attrs, class: prose({ class: normalizeClass(attrs.class) }) }"><Content /></div>
</template>
