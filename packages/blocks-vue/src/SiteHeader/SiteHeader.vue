<script setup lang="ts">
import { Collapsible } from '@ark-ui/vue/collapsible';
import { Menu, X } from '@lucide/vue';
import { type RecipeClasses, siteHeader as siteHeaderRecipe } from '@wirecore/wirelayer-recipes';
import { IconButton, useTranslations } from '@wirecore/wirelayer-vue';
import { ref } from 'vue';
import type { NavItem } from '../types.js';
import { useRecipe } from '@wirecore/wirelayer-vue';

export interface SiteHeaderProps {
    /** Name next to the logo, links to the home page */
    brand: string;
    homeHref?: string;
    items?: NavItem[];
    /** Accessible name of the navigation landmark */
    navLabel?: string;
    /** Accessible name of the mobile menu button */
    menuLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof siteHeaderRecipe>;
}

const props = withDefaults(defineProps<SiteHeaderProps>(), {
    homeHref: '/',
    items: () => [],
});
const siteHeader = useRecipe('siteHeader', siteHeaderRecipe, () => props.classes);
defineSlots<{
    /** Logo before the brand name (decorative – the name is the link text) */
    logo?: () => unknown;
    /** Actions on the right, e.g. a CTA button and the ModeToggle – repeated in the mobile menu */
    actions?: () => unknown;
    /** Custom link, e.g. RouterLink/NuxtLink: bind `attrs` to it */
    link?: (props: { item: NavItem; attrs: Record<string, unknown> }) => unknown;
}>();

const translations = useTranslations();
const styles = siteHeader();
const open = ref(false);

const linkAttrs = (item: NavItem, mobile: boolean) => ({
    class: mobile ? styles.panelLink() : styles.link(),
    'aria-current': item.current ? ('page' as const) : undefined,
    // Following a link in the mobile menu closes it (SPA navigation keeps the header mounted)
    onClick: mobile ? () => (open.value = false) : undefined,
});
</script>

<template>
    <Collapsible.Root v-model:open="open" as-child lazy-mount unmount-on-exit>
        <header :class="styles.base()">
            <div :class="styles.bar()">
                <a :href="homeHref" :class="styles.brand()">
                    <span v-if="$slots.logo" :class="styles.logo()" aria-hidden="true"><slot name="logo" /></span>
                    {{ brand }}
                </a>
                <nav
                    v-if="items.length"
                    :aria-label="navLabel ?? translations.siteHeader.navigation"
                    :class="styles.nav()"
                >
                    <template v-for="item in items" :key="item.href">
                        <slot name="link" :item="item" :attrs="linkAttrs(item, false)">
                            <a :href="item.href" v-bind="linkAttrs(item, false)">{{ item.label }}</a>
                        </slot>
                    </template>
                </nav>
                <div v-if="$slots.actions" :class="styles.actions()"><slot name="actions" /></div>
                <Collapsible.Trigger v-if="items.length || $slots.actions" as-child>
                    <IconButton
                        :icon="open ? X : Menu"
                        :label="menuLabel ?? translations.siteHeader.menu"
                        variant="text"
                        :class="styles.toggle()"
                    />
                </Collapsible.Trigger>
            </div>
            <Collapsible.Content :class="styles.panel()">
                <nav
                    v-if="items.length"
                    :aria-label="navLabel ?? translations.siteHeader.navigation"
                    :class="styles.panelNav()"
                >
                    <template v-for="item in items" :key="item.href">
                        <slot name="link" :item="item" :attrs="linkAttrs(item, true)">
                            <a :href="item.href" v-bind="linkAttrs(item, true)">{{ item.label }}</a>
                        </slot>
                    </template>
                </nav>
                <div v-if="$slots.actions" :class="styles.panelActions()"><slot name="actions" /></div>
            </Collapsible.Content>
        </header>
    </Collapsible.Root>
</template>
