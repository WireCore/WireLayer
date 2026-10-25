<script setup lang="ts">
import { type RecipeClasses, sidebarNav as sidebarNavRecipe } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import SidebarNavItems from './SidebarNavItems.vue';
import type { SidebarNavItem } from './types.js';
import { useAppShellRail } from '../AppShell/context.js';
import { useRecipe } from '../../recipes.js';

export interface SidebarNavProps {
    items: readonly SidebarNavItem[];
    /** Name of the navigation landmark, e.g. "Main navigation" */
    label: string;
    /**
     * Icons only, the labels as tooltips (and for screen readers). Default: the collapsed state of a surrounding
     * AppShell (navbarCollapsed)
     */
    rail?: boolean;
    /** With `rail`: hovering or focusing the rail shows the labels (no tooltips) – default from the AppShell */
    expandOnHover?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sidebarNavRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SidebarNavProps>(), { rail: undefined, expandOnHover: undefined });
const sidebarNav = useRecipe('sidebarNav', sidebarNavRecipe, () => props.classes);
/** A link was clicked – call event.preventDefault() and route yourself in a single-page app */
const emit = defineEmits<{ navigate: [item: SidebarNavItem, event: MouseEvent] }>();
const slots = defineSlots<{
    /** Above the links, e.g. a logo or a switcher */
    header?(): unknown;
    /** Below the links, e.g. account or settings */
    footer?(): unknown;
}>();
const attrs = useAttrs();
const shell = useAppShellRail();
const rail = computed(() => props.rail ?? shell?.value.rail ?? false);
const expandOnHover = computed(() => rail.value && (props.expandOnHover ?? shell?.value.expandOnHover ?? false));
const styles = computed(() => sidebarNav(rail.value ? { rail: true, expandOnHover: expandOnHover.value } : undefined));
</script>

<template>
    <!-- Navigation landmark with links and expandable groups (buttons with aria-expanded); optionally a rail of icons -->
    <nav
        :aria-label="label"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :data-rail="rail ? '' : undefined"
    >
        <div v-if="slots.header" :class="styles.header()"><slot name="header" /></div>
        <ul :class="styles.list()">
            <SidebarNavItems
                :items="items"
                :depth="0"
                :rail="rail"
                :expand-on-hover="expandOnHover"
                @navigate="(item, event) => emit('navigate', item, event)"
            />
        </ul>
        <div v-if="slots.footer" :class="styles.footer()"><slot name="footer" /></div>
    </nav>
</template>
