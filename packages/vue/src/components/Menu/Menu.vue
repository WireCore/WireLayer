<script setup lang="ts">
import { Menu } from '@ark-ui/vue/menu';
import { useFilter } from '@ark-ui/vue/locale';
import {
    filterMenuEntries,
    highlightFirstMenuItem,
    menu as menuRecipe,
    menuSearchKey,
    type OverlayAnchor,
    type OverlayHandle,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, ref, watch, type Component } from 'vue';
import MenuEntries from './MenuEntries.vue';
import { provideMenuState } from './state.js';
import type { MenuCheckboxItem, MenuEntry, MenuItem, MenuRadioItem } from './types.js';
import { useTranslations } from '../../locale.js';
import { useAnchoredOverlay } from '../../overlay.js';
import { useRecipe } from '../../recipes.js';

export interface MenuProps {
    /**
     * Items, groups ({ type: 'group' }), separators ({ type: 'separator' }), checkbox items ({ type: 'checkbox' }) and
     * radio groups ({ type: 'radio' }); items with children open a submenu, items with href are links
     */
    items: MenuEntry[];
    /** Controlled state – use with v-model:open */
    open?: boolean;
    defaultOpen?: boolean;
    /** Element (or point) to open at instead of the trigger; open with v-model:open or the exposed `open(anchor)` */
    anchor?: OverlayAnchor | null;
    /** Filter field at the top – for long menus; arrow keys move through the matching items, Enter chooses */
    searchable?: boolean;
    /** Placeholder and accessible name of the filter field */
    searchLabel?: string;
    /** Component for items with href, e.g. RouterLink or NuxtLink (gets `href`); default <a> */
    linkAs?: Component | string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof menuRecipe>;
}

const props = withDefaults(defineProps<MenuProps>(), { open: undefined, defaultOpen: undefined, anchor: undefined });
const menu = useRecipe('menu', menuRecipe, () => props.classes);
const emit = defineEmits<{
    select: [value: string];
    /** A checkbox item was switched */
    'checked-change': [value: string, checked: boolean];
    /** A radio group got a new value */
    'value-change': [name: string, value: string];
    'update:open': [open: boolean];
}>();
defineSlots<{
    /** The trigger (e.g. a Button or IconButton) – optional with `anchor` or `open(anchor)` */
    default?(): unknown;
    /** Own content of an item (instead of icon, label and shortcut) */
    item?(props: { item: MenuItem | MenuCheckboxItem | MenuRadioItem }): unknown;
}>();
const styles = menu();
const translations = useTranslations();
provideMenuState({
    items: () => props.items,
    linkAs: () => props.linkAs,
    onCheckedChange: (value, checked) => emit('checked-change', value, checked),
    onValueChange: (name, value) => emit('value-change', name, value),
});
const overlay = useAnchoredOverlay({
    open: () => props.open,
    defaultOpen: () => props.defaultOpen,
    anchor: () => props.anchor,
    onOpenChange: (next) => emit('update:open', next),
    restoreFocus: true,
});
defineExpose<OverlayHandle>(overlay.handle);

// Filter field: accent- and case-blind over the labels; the filter starts empty with every opening
const query = ref('');
const activeId = ref<string>();
const filters = useFilter({ sensitivity: 'base', usage: 'sort' });
const entries = computed(() =>
    props.searchable && query.value
        ? filterMenuEntries(props.items, (label) => filters.value.contains(label, query.value))
        : props.items
);
const search = ref<HTMLInputElement | null>(null);
async function onInput(event: Event, api: { setHighlightedValue: (value: string) => void }) {
    const field = event.target as HTMLInputElement;
    await nextTick();
    activeId.value = highlightFirstMenuItem(field, api);
}
watch(overlay.isOpen, async (open) => {
    query.value = '';
    activeId.value = undefined;
    if (!open || !props.searchable) return;
    await nextTick();
    // After Ark has focused the menu
    requestAnimationFrame(() => requestAnimationFrame(() => search.value?.focus()));
});
</script>

<template>
    <!-- The trigger is the slotted element (e.g. a Button or IconButton) -->
    <Menu.Root
        :open="overlay.isOpen.value"
        :positioning="overlay.positioning({})"
        :anchor-point="overlay.anchorPoint.value"
        lazy-mount
        unmount-on-exit
        @update:open="overlay.onOpenChange($event)"
        @select="emit('select', $event.value)"
    >
        <Menu.Trigger v-if="$slots.default" as-child><slot /></Menu.Trigger>
        <Teleport to="body">
            <Menu.Positioner>
                <Menu.Content :class="styles.content()">
                    <Menu.Context v-if="searchable" v-slot="api">
                        <!-- A group: a text field may not sit directly in a menu -->
                        <div
                            role="group"
                            :aria-label="searchLabel ?? translations.menu.search"
                            :class="styles.search()"
                        >
                            <input
                                ref="search"
                                v-model="query"
                                type="text"
                                autocomplete="off"
                                :class="styles.searchInput()"
                                :placeholder="searchLabel ?? translations.menu.search"
                                :aria-label="searchLabel ?? translations.menu.search"
                                :aria-activedescendant="activeId"
                                @keydown="activeId = menuSearchKey($event, api) ?? activeId"
                                @input="onInput($event, api)"
                            />
                        </div>
                    </Menu.Context>
                    <MenuEntries :entries="entries" @select="emit('select', $event)">
                        <template v-if="$slots.item" #item="slotProps"
                            ><slot name="item" v-bind="slotProps"
                        /></template>
                    </MenuEntries>
                    <div v-if="searchable && !entries.length" role="group" :class="styles.empty()">
                        <span role="status">{{ translations.common.noResults }}</span>
                    </div>
                </Menu.Content>
            </Menu.Positioner>
        </Teleport>
    </Menu.Root>
</template>
