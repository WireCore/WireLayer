<script setup lang="ts">
import {
    configProvider as configProviderRecipe,
    mergeRecipeOverrides,
    sizeOverrides,
    type RecipeClasses,
    type RecipeConfig,
    type RecipeOverrides,
    type Translations,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import LocaleProvider from '../LocaleProvider/LocaleProvider.vue';
import { provideRecipes, useRecipe } from '../../recipes.js';

export interface ConfigProviderProps {
    /** Language and formats of the part below (LocaleProvider) – e.g. "en-US" */
    locale?: string;
    /** Texts of a language without built-in translations */
    translations?: Translations;
    /** Defaults and classes per recipe (RecipesProvider) */
    recipes?: RecipeConfig;
    /**
     * Default size (density) of every component that has it – buttons, inputs, selects … – unless a component sets its
     * own; `recipes` win over it
     */
    size?: 'xs' | 'sm' | 'md' | 'lg';
    /** Colour theme of the part below (`data-theme`, e.g. "ocean") */
    theme?: string;
    /** Light or dark for the part below (`data-mode`) */
    mode?: 'light' | 'dark';
    /** Writing direction of the part below */
    dir?: 'ltr' | 'rtl';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof configProviderRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<ConfigProviderProps>();
const configProvider = useRecipe('configProvider', configProviderRecipe, () => props.classes);
const attrs = useAttrs();
provideRecipes(() =>
    mergeRecipeOverrides(props.size ? sizeOverrides(props.size) : {}, (props.recipes ?? {}) as RecipeOverrides)
);
// An element of its own only when theme, mode or direction apply to the part below
const wrapper = computed(() => !!(props.theme || props.mode || props.dir));
const localized = computed(() => !!(props.locale || props.translations));
</script>

<template>
    <!-- Locale, recipe defaults, size and theme for a part of the page – one wrapper instead of several providers -->
    <div
        v-if="wrapper"
        v-bind="{ ...attrs, class: configProvider({ class: normalizeClass(attrs.class) }) }"
        :data-theme="theme"
        :data-mode="mode"
        :dir="dir"
    >
        <LocaleProvider v-if="localized" :locale="locale" :translations="translations"><slot /></LocaleProvider>
        <slot v-else />
    </div>
    <LocaleProvider v-else-if="localized" :locale="locale" :translations="translations"><slot /></LocaleProvider>
    <slot v-else />
</template>
