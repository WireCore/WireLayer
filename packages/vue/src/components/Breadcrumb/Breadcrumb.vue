<script setup lang="ts">
import { ChevronRight, Ellipsis } from '@lucide/vue';
import { breadcrumb as breadcrumbRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, getCurrentInstance, normalizeClass, useAttrs, type Component } from 'vue';
import Menu from '../Menu/Menu.vue';
import BreadcrumbItem from './BreadcrumbItem.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

/** One step of the path, for `items` */
export interface BreadcrumbEntry {
    label: string;
    href?: string;
    /** Icon component before the label */
    icon?: Component;
    /** Show only the icon; the label stays available to screen readers */
    iconOnly?: boolean;
    /** The current page (usually the last entry) */
    current?: boolean;
}

export interface BreadcrumbProps {
    /** Accessible name of the navigation landmark */
    label?: string;
    /** The path as data instead of BreadcrumbItem children (needed for maxItems) */
    items?: readonly BreadcrumbEntry[];
    /** With more items, the middle ones collapse into "…" – a menu with the hidden steps */
    maxItems?: number;
    /** Items kept before the "…" (default 1) */
    itemsBeforeCollapse?: number;
    /** Items kept after the "…" (default 1) */
    itemsAfterCollapse?: number;
    /** Accessible name of the "…" button (default "Ausgeblendete Ebenen") */
    moreLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof breadcrumbRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<BreadcrumbProps>(), {
    items: undefined,
    maxItems: undefined,
    itemsBeforeCollapse: 1,
    itemsAfterCollapse: 1,
});
const emit = defineEmits<{
    /** A hidden step was chosen from the "…" menu – without a listener the browser opens its href */
    navigate: [item: BreadcrumbEntry];
}>();
const breadcrumb = useRecipe('breadcrumb', breadcrumbRecipe, () => props.classes);
const attrs = useAttrs();
const styles = breadcrumb();
const instance = getCurrentInstance();

const parts = computed(() => {
    const items = props.items ?? [];
    const before = Math.max(1, props.itemsBeforeCollapse);
    const after = Math.max(1, props.itemsAfterCollapse);
    if (!props.maxItems || items.length <= props.maxItems || before + after >= items.length) {
        return { before: items, hidden: [], after: [] };
    }
    return {
        before: items.slice(0, before),
        hidden: items.slice(before, items.length - after),
        after: items.slice(items.length - after),
    };
});
const menuItems = computed(() =>
    parts.value.hidden.map((item, index) => ({ value: String(index), label: item.label, icon: item.icon }))
);
function choose(value: string) {
    const item = parts.value.hidden[Number(value)];
    if (!item) return;
    if (instance?.vnode.props?.onNavigate) emit('navigate', item);
    else if (item.href) window.location.assign(item.href);
}
</script>

<template>
    <nav
        v-bind="{ ...attrs, class: normalizeClass(attrs.class) || undefined }"
        :aria-label="label ?? translations.breadcrumb.label"
    >
        <ol :class="styles.list()">
            <template v-if="items">
                <BreadcrumbItem
                    v-for="(item, index) in parts.before"
                    :key="`before-${index}`"
                    :href="item.href"
                    :icon="item.icon"
                    :icon-only="item.iconOnly"
                    :current="item.current"
                    >{{ item.label }}</BreadcrumbItem
                >
                <li v-if="parts.hidden.length" :class="styles.item()">
                    <ChevronRight :class="styles.separator()" aria-hidden="true" />
                    <Menu :items="menuItems" @select="choose">
                        <button
                            type="button"
                            :class="styles.ellipsis()"
                            :aria-label="moreLabel ?? translations.breadcrumb.more"
                        >
                            <Ellipsis :class="styles.ellipsisIcon()" aria-hidden="true" />
                        </button>
                    </Menu>
                </li>
                <BreadcrumbItem
                    v-for="(item, index) in parts.after"
                    :key="`after-${index}`"
                    :href="item.href"
                    :icon="item.icon"
                    :icon-only="item.iconOnly"
                    :current="item.current"
                    >{{ item.label }}</BreadcrumbItem
                >
            </template>
            <slot v-else />
        </ol>
    </nav>
</template>
