<script setup lang="ts">
import { Toc } from '@ark-ui/vue/toc';
import { type RecipeClasses, tableOfContents as tableOfContentsRecipe } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface TocEntry {
    /** id of the heading on the page */
    id: string;
    label: string;
    /** 1 for the top level, 2 below it … */
    depth?: number;
}

export interface TableOfContentsProps {
    items: readonly TocEntry[];
    title?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tableOfContentsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<TableOfContentsProps>();
const tableOfContents = useRecipe('tableOfContents', tableOfContentsRecipe, () => props.classes);
const attrs = useAttrs();
const styles = tableOfContents();
const tocItems = computed(() => props.items.map((item) => ({ value: item.id, depth: item.depth ?? 1 })));
const labelOf = (id: string) => props.items.find((item) => item.id === id)?.label;
</script>

<template>
    <!-- Navigation to the headings of the page; the section in view is marked (aria-current="location") -->
    <Toc.Root :items="tocItems" :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <Toc.Nav :aria-label="title ?? translations.tableOfContents.title">
            <Toc.Title :class="styles.title()">{{ title ?? translations.tableOfContents.title }}</Toc.Title>
            <Toc.List :class="styles.list()">
                <Toc.Item v-for="item in tocItems" :key="item.value" :item="item">
                    <Toc.Link :href="`#${item.value}`" :class="styles.link()">{{ labelOf(item.value) }}</Toc.Link>
                </Toc.Item>
            </Toc.List>
        </Toc.Nav>
    </Toc.Root>
</template>
