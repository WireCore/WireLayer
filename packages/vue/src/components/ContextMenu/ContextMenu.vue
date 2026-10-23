<script setup lang="ts">
import { Menu } from '@ark-ui/vue/menu';
import {
    createLongPress,
    menu as menuRecipe,
    type OverlayHandle,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, onBeforeUnmount, type Component } from 'vue';
import MenuEntries from '../Menu/MenuEntries.vue';
import { provideMenuState } from '../Menu/state.js';
import type { MenuCheckboxItem, MenuEntry, MenuItem, MenuRadioItem } from '../Menu/types.js';
import { useAnchoredOverlay } from '../../overlay.js';
import { useRecipe } from '../../recipes.js';

export interface ContextMenuProps {
    /** Items, groups, separators, checkbox items, radio groups and submenus – as in Menu */
    items: MenuEntry[];
    /** Accessible name of the menu – without it the menu is named by the area's content */
    label?: string;
    /** Component for items with href, e.g. RouterLink or NuxtLink (gets `href`); default <a> */
    linkAs?: Component | string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof menuRecipe>;
}

const props = defineProps<ContextMenuProps>();
const menu = useRecipe('menu', menuRecipe, () => props.classes);
const emit = defineEmits<{
    select: [value: string];
    /** A checkbox item was switched */
    'checked-change': [value: string, checked: boolean];
    /** A radio group got a new value */
    'value-change': [name: string, value: string];
}>();
defineSlots<{
    /** The area that opens the menu */
    default(): unknown;
    /** Own content of an item (instead of icon, label and shortcut) */
    item?(props: { item: MenuItem | MenuCheckboxItem | MenuRadioItem }): unknown;
}>();
const styles = menu();
provideMenuState({
    items: () => props.items,
    linkAs: () => props.linkAs,
    onCheckedChange: (value, checked) => emit('checked-change', value, checked),
    onValueChange: (name, value) => emit('value-change', name, value),
});
const overlay = useAnchoredOverlay({
    open: () => undefined,
    anchor: () => undefined,
    onOpenChange: () => {},
    restoreFocus: true,
});
defineExpose<OverlayHandle>(overlay.handle);

// Touch and pen: holding still for half a second opens the menu at the finger
const longPress = createLongPress((point) => overlay.handle.open(point));
onBeforeUnmount(longPress.cancel);
// One object until the inputs change – a new one on every render can make Ark re-render endlessly
const positioning = computed(() => overlay.positioning({}));
</script>

<template>
    <!--
        Opens at the pointer on right click, on touch screens with a long press (and with Shift+F10 or the menu key
        on the focused area). The actions should also be reachable another way.
    -->
    <Menu.Root
        :open="overlay.isOpen.value"
        :positioning="positioning"
        :anchor-point="overlay.anchorPoint.value"
        lazy-mount
        unmount-on-exit
        @update:open="overlay.onOpenChange($event)"
        @select="emit('select', $event.value)"
    >
        <Menu.ContextTrigger
            as-child
            @pointerdown="longPress.down($event)"
            @pointermove="longPress.move($event)"
            @pointerup="longPress.cancel()"
            @pointercancel="longPress.cancel()"
        >
            <slot />
        </Menu.ContextTrigger>
        <Teleport to="body">
            <Menu.Positioner>
                <Menu.Content
                    :class="styles.content()"
                    v-bind="label ? { 'aria-label': label, 'aria-labelledby': undefined } : {}"
                >
                    <MenuEntries :entries="items" @select="emit('select', $event)">
                        <template v-if="$slots.item" #item="slotProps"
                            ><slot name="item" v-bind="slotProps"
                        /></template>
                    </MenuEntries>
                </Menu.Content>
            </Menu.Positioner>
        </Teleport>
    </Menu.Root>
</template>
