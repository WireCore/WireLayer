<script setup lang="ts">
import { ark } from '@ark-ui/vue/factory';
import { ChevronRight } from '@lucide/vue';
import { breadcrumb as breadcrumbRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, useAttrs, type Component } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useRecipe } from '../../recipes.js';

export interface BreadcrumbItemProps {
    href?: string;
    /** The current page – sets aria-current="page" */
    current?: boolean;
    /** Icon component before the label */
    icon?: Component;
    /** Show only the icon; the label stays available to screen readers */
    iconOnly?: boolean;
    /** Render the slotted link (e.g. RouterLink) with breadcrumb styles */
    asChild?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof breadcrumbRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<BreadcrumbItemProps>();
const breadcrumb = useRecipe('breadcrumb', breadcrumbRecipe, () => props.classes);
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = computed(() => breadcrumb({ current: props.current }));
</script>

<template>
    <li :class="styles.item({ class: split.className })" :style="split.style">
        <ChevronRight :class="styles.separator()" aria-hidden="true" />
        <ark.a
            v-if="href || asChild"
            v-bind="split.rest"
            :href="asChild ? undefined : href"
            :as-child="asChild"
            :aria-current="current ? 'page' : undefined"
            :class="styles.link()"
        >
            <slot v-if="asChild" />
            <template v-else>
                <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
                <span v-if="iconOnly" :class="styles.hiddenLabel()"><slot /></span>
                <slot v-else />
            </template>
        </ark.a>
        <span v-else v-bind="split.rest" :aria-current="current ? 'page' : undefined" :class="styles.text()">
            <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
            <span v-if="iconOnly" :class="styles.hiddenLabel()"><slot /></span>
            <slot v-else />
        </span>
    </li>
</template>
