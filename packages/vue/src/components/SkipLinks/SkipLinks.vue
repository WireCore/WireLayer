<script setup lang="ts">
import { skipLinks as skipLinksRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface SkipLink {
    /** Target, e.g. "#main" or "#search" */
    href: string;
    /** Text, e.g. "Skip to content" */
    label: string;
}

export interface SkipLinksProps {
    links: readonly SkipLink[];
    /** Accessible name of the navigation (default "Skip links") */
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof skipLinksRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<SkipLinksProps>();
const skipLinks = useRecipe('skipLinks', skipLinksRecipe, () => props.classes);
const attrs = useAttrs();
const translations = useTranslations();
const styles = skipLinks();
</script>

<template>
    <!--
        Links to the main parts of the page, the first thing Tab reaches; each appears at the top left while focused.
        Not a stop for F6 (data-landmark="off").
    -->
    <nav
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :aria-label="label ?? translations.skipLinks.label"
        data-landmark="off"
    >
        <ul :class="styles.list()">
            <li v-for="link in links" :key="link.href">
                <a :href="link.href" :class="styles.link()">{{ link.label }}</a>
            </li>
        </ul>
    </nav>
</template>
