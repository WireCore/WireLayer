<script setup lang="ts">
import { NavigationMenu } from '@ark-ui/vue/navigation-menu';
import { ChevronDown } from '@lucide/vue';
import { navigationMenu as navigationMenuRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs, type Component } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface NavigationMenuLink {
    label: string;
    href: string;
    description?: string;
    icon?: Component;
    /** The current page (aria-current="page") */
    current?: boolean;
}

export interface NavigationMenuEntry {
    label: string;
    /** A direct link; entries with children open a panel instead */
    href?: string;
    current?: boolean;
    children?: NavigationMenuLink[];
}

export interface NavigationMenuProps {
    items: NavigationMenuEntry[];
    /** Name of the navigation landmark */
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof navigationMenuRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<NavigationMenuProps>();
const navigationMenu = useRecipe('navigationMenu', navigationMenuRecipe, () => props.classes);
const attrs = useAttrs();
const styles = navigationMenu();
</script>

<template>
    <!--
        Website navigation (nav landmark): entries with children are buttons (aria-expanded) that open a panel with
        links – on hover or click; Escape closes. Not a menu (role="menu"), so links behave like links.
    -->
    <NavigationMenu.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :translations="{ rootLabel: label ?? translations.navigationMenu.rootLabel }"
    >
        <NavigationMenu.List :class="styles.list()">
            <NavigationMenu.Item v-for="item in items" :key="item.label" :value="item.label" :class="styles.item()">
                <template v-if="item.children">
                    <NavigationMenu.Trigger :class="styles.trigger()">
                        {{ item.label }}
                        <ChevronDown :class="styles.triggerIcon()" aria-hidden="true" />
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content :class="styles.content()">
                        <NavigationMenu.Link
                            v-for="child in item.children"
                            :key="child.href"
                            :href="child.href"
                            :current="child.current"
                            :class="styles.panelLink()"
                        >
                            <component
                                :is="child.icon"
                                v-if="child.icon"
                                :class="styles.panelIcon()"
                                aria-hidden="true"
                            />
                            <span :class="styles.panelText()">
                                <span :class="styles.panelLabel()">{{ child.label }}</span>
                                <span v-if="child.description" :class="styles.panelDescription()">{{
                                    child.description
                                }}</span>
                            </span>
                        </NavigationMenu.Link>
                    </NavigationMenu.Content>
                </template>
                <NavigationMenu.Link v-else :href="item.href" :current="item.current" :class="styles.link()">
                    {{ item.label }}
                </NavigationMenu.Link>
            </NavigationMenu.Item>
        </NavigationMenu.List>
    </NavigationMenu.Root>
</template>
