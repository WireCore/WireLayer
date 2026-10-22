<script setup lang="ts">
import {
    bottomNavigation as bottomNavigationRecipe,
    formatCount,
    isCurrentLink,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface BottomNavigationItem {
    label: string;
    href: string;
    icon: Component;
    /** Count (shown as 99+ above 99) or short text on the icon; it is part of the link's name */
    badge?: number | string;
    /** The current page (aria-current="page"); else `currentHref`/`isCurrent` decide */
    current?: boolean;
}

export interface BottomNavigationProps {
    /** 3 to 5 destinations */
    items: BottomNavigationItem[];
    /** Name of the navigation landmark (default "Navigation") */
    label?: string;
    /** Path of the current page – the item with exactly this href gets aria-current="page" */
    currentHref?: string;
    /** Own check for the current page, e.g. with the router */
    isCurrent?: (item: BottomNavigationItem) => boolean;
    /** Component for the links, e.g. RouterLink or NuxtLink (gets `href`); default <a> */
    linkAs?: string | Component;
    /** In the flow of the page instead of fixed at the bottom */
    inline?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof bottomNavigationRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<BottomNavigationProps>(), { linkAs: 'a' });
const bottomNavigation = useRecipe('bottomNavigation', bottomNavigationRecipe, () => props.classes);
/** A link was clicked – call event.preventDefault() and route yourself in a single-page app */
const emit = defineEmits<{ navigate: [item: BottomNavigationItem, event: MouseEvent] }>();
const attrs = useAttrs();
const translations = useTranslations();
const styles = computed(() => bottomNavigation({ inline: props.inline }));
const badgeText = (badge: number | string) => (typeof badge === 'number' ? formatCount(badge) : badge);
</script>

<template>
    <!--
        Navigation landmark fixed at the bottom (above the home indicator): icon and text per destination, the
        current one with aria-current="page", targets of at least 44 px
    -->
    <nav
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :aria-label="label ?? translations.bottomNavigation.label"
    >
        <ul :class="styles.list()">
            <li v-for="item in items" :key="item.href" :class="styles.item()">
                <component
                    :is="linkAs"
                    :href="item.href"
                    :class="styles.link()"
                    :aria-current="isCurrentLink(item, currentHref, isCurrent) ? 'page' : undefined"
                    @click="emit('navigate', item, $event)"
                >
                    <span :class="styles.iconBox()">
                        <component :is="item.icon" :class="styles.icon()" aria-hidden="true" />
                        <span v-if="item.badge !== undefined && item.badge !== 0" :class="styles.badge()">{{
                            badgeText(item.badge)
                        }}</span>
                    </span>
                    <span :class="styles.label()">{{ item.label }}</span>
                </component>
            </li>
        </ul>
    </nav>
</template>
