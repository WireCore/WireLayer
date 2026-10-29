<script setup lang="ts">
import { Menu } from '@ark-ui/vue/menu';
import {
    createContextMenuSource,
    createLongPress,
    menu as menuRecipe,
    type ContextMenuOpenDetails,
    type OverlayHandle,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, onBeforeUnmount, useTemplateRef, type Component } from 'vue';
import MenuEntries from '../Menu/MenuEntries.vue';
import { provideMenuState, useMenuBehavior } from '../Menu/state.js';
import type { MenuCheckboxItem, MenuEntry, MenuItem, MenuRadioItem } from '../Menu/types.js';
import { useAnchoredOverlay } from '../../overlay.js';
import { useRecipe } from '../../recipes.js';

export interface ContextMenuProps {
    /** Items, groups, separators, checkbox items, radio groups and submenus – as in Menu */
    items: readonly MenuEntry[];
    /** Accessible name of the menu – without it the menu is named by the area's content */
    label?: string;
    /** Component for link items, e.g. RouterLink or NuxtLink (gets `to` for items with `to`, else `href`); default <a> */
    linkAs?: Component | string;
    /** Whether the menu is open – use with v-model:open, or listen to update:open (e.g. to pause list shortcuts) */
    open?: boolean;
    /** Closes when the page (or a container) scrolls */
    closeOnScroll?: boolean;
    /** Closes when the window is resized */
    closeOnResize?: boolean;
    /** Closes when the window loses the focus (switching to another window) */
    closeOnBlur?: boolean;
    /** Highlights the first item when the menu opens, so Enter takes it (as in desktop context menus) */
    highlightFirst?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof menuRecipe>;
}

const props = withDefaults(defineProps<ContextMenuProps>(), { open: undefined });
const menu = useRecipe('menu', menuRecipe, () => props.classes);
const emit = defineEmits<{
    select: [value: string];
    /** A checkbox item was switched */
    'checked-change': [value: string, checked: boolean];
    /** A radio group got a new value */
    'value-change': [name: string, value: string];
    'update:open': [open: boolean];
    /**
     * A right click, long press or the menu key is opening the menu, on this element (e.g. the row under the pointer –
     * select it before the menu shows); `details.source` tells pointer from keyboard, with the keyboard
     * `details.focused` is the focused element (e.g. the row with the focus)
     */
    'before-open': [target: Element, details: ContextMenuOpenDetails];
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
    open: () => props.open,
    anchor: () => undefined,
    onOpenChange: (next) => emit('update:open', next),
    restoreFocus: true,
});
defineExpose<OverlayHandle>(overlay.handle);
const content = useTemplateRef<{ $el: HTMLElement }>('content');
const highlight = useMenuBehavior({
    open: () => overlay.isOpen.value,
    close: overlay.handle.close,
    content: () => content.value?.$el,
    closeOnScroll: () => props.closeOnScroll,
    closeOnResize: () => props.closeOnResize,
    closeOnBlur: () => props.closeOnBlur,
    highlightFirst: () => props.highlightFirst,
});

// Touch and pen: holding still for half a second opens the menu at the finger
let pressed: Element | null = null;
const longPress = createLongPress((point) => {
    if (pressed) emit('before-open', pressed, { source: 'pointer', focused: null });
    overlay.handle.open(point);
});
// Shift+F10 and the menu key open it as well (the browser's contextmenu event)
const source = createContextMenuSource();
function onPointerDown(event: PointerEvent) {
    pressed = event.target as Element | null;
    source.pointerdown();
    longPress.down(event);
}
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
        v-bind="highlight"
        lazy-mount
        unmount-on-exit
        @update:open="overlay.onOpenChange($event)"
        @select="emit('select', $event.value)"
    >
        <Menu.ContextTrigger
            as-child
            @pointerdown="onPointerDown"
            @keydown="source.keydown($event)"
            @contextmenu="emit('before-open', $event.target as Element, source.contextmenu())"
            @pointermove="longPress.move($event)"
            @pointerup="longPress.cancel()"
            @pointercancel="longPress.cancel()"
        >
            <slot />
        </Menu.ContextTrigger>
        <Teleport to="body">
            <Menu.Positioner>
                <Menu.Content
                    ref="content"
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
