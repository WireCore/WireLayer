<script setup lang="ts">
import { Menu } from '@ark-ui/vue/menu';
import { Menu as MenuIcon } from '@lucide/vue';
import {
    inlineArrowStep,
    menu as menuRecipe,
    menubar as menubarRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, h, nextTick, ref, useSlots, useTemplateRef, type Component, type FunctionalComponent } from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import MenuComponent from '../Menu/Menu.vue';
import MenuEntries from '../Menu/MenuEntries.vue';
import { provideMenuState } from '../Menu/state.js';
import type { MenuCheckboxItem, MenuEntry, MenuItem, MenuRadioItem } from '../Menu/types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface MenubarMenu {
    label: string;
    items: MenuEntry[];
}

export interface MenubarProps {
    menus: MenubarMenu[];
    /** Below the md breakpoint (768px) a menu button with all menus replaces the bar */
    responsive?: boolean;
    /** Accessible name of the menu button on small screens */
    menuLabel?: string;
    /** Component for items with href, e.g. RouterLink or NuxtLink (gets `href`); default <a> */
    linkAs?: Component | string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof menubarRecipe>;
}

// The attributes (aria-label) belong to the bar, also when start/end content wraps it
defineOptions({ inheritAttrs: false });
const props = defineProps<MenubarProps>();
const menu = useRecipe('menu', menuRecipe);
const menubar = useRecipe('menubar', menubarRecipe, () => props.classes);
const emit = defineEmits<{
    select: [value: string];
    /** A checkbox item was switched */
    'checked-change': [value: string, checked: boolean];
    /** A radio group got a new value */
    'value-change': [name: string, value: string];
}>();
defineSlots<{
    /** Content before the bar, e.g. a logo */
    start?(): unknown;
    /** Content after the bar, e.g. a search or an avatar */
    end?(): unknown;
    /** Own content of an item (instead of icon, label and shortcut) */
    item?(props: { item: MenuItem | MenuCheckboxItem | MenuRadioItem }): unknown;
}>();
const slots = useSlots();
const translations = useTranslations();
const styles = computed(() => menubar({ responsive: props.responsive }));
const menuStyles = menu();
const bar = useTemplateRef<HTMLElement>('bar');
provideMenuState({
    items: () => props.menus.map((entry) => entry.items),
    linkAs: () => props.linkAs,
    onCheckedChange: (value, checked) => emit('checked-change', value, checked),
    onValueChange: (name, value) => emit('value-change', name, value),
});
// The menu button on small screens: every menu becomes a submenu
const burgerItems = computed<MenuEntry[]>(() =>
    props.menus.map((entry, index) => ({ value: `menubar-${index}`, label: entry.label, children: entry.items }))
);
// Content before/after the bar and the menu button sit outside role="menubar" (only menu items may be inside)
const wrapped = computed(() => !!(slots.start || slots.end || props.responsive));
const Wrap: FunctionalComponent<{ wrap: boolean; wrapClass: string }> = (wrapProps, { slots: content }) =>
    wrapProps.wrap ? h('div', { class: wrapProps.wrapClass }, content.default?.()) : content.default?.();
Wrap.props = ['wrap', 'wrapClass'];

// One menu open at a time; the bar is one tab stop (roving tabindex)
const open = ref<number | null>(null);
const focused = ref(0);
const triggers = () => [...(bar.value?.querySelectorAll<HTMLElement>(':scope > [role=menuitem]') ?? [])];

async function move(index: number, keepOpen: boolean) {
    const count = props.menus.length;
    const next = (index + count) % count;
    focused.value = next;
    open.value = keepOpen ? next : null;
    await nextTick();
    if (!keepOpen) triggers()[next]?.focus();
}

function onTriggerKey(event: KeyboardEvent, index: number) {
    const keys: Record<string, number | undefined> = {
        Home: 0,
        End: props.menus.length - 1,
    };
    const step = inlineArrowStep(event.key, event.currentTarget as HTMLElement);
    const next = step ? index + step : keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    move(next, false);
}

// Inside an open menu, arrow left/right go to the neighbouring menu – unless they open or close a submenu
function onContentKey(event: KeyboardEvent, index: number) {
    const step = inlineArrowStep(event.key, event.currentTarget as HTMLElement);
    if (!step) return;
    const highlighted = (event.currentTarget as HTMLElement).querySelector('[data-highlighted]');
    if (step === 1 && highlighted?.getAttribute('aria-haspopup')) return;
    event.preventDefault();
    move(index + step, true);
}
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const bottomStartPositioning = { placement: 'bottom-start', gutter: 4 } as const;
</script>

<template>
    <Wrap :wrap="wrapped" :wrap-class="styles.root()">
        <div v-if="$slots.start" :class="styles.start()"><slot name="start" /></div>
        <!-- Menu bar (role="menubar"): arrow keys move along the bar and between open menus, arrow down opens -->
        <div ref="bar" v-bind="$attrs" role="menubar" :class="styles.base()">
            <Menu.Root
                v-for="(entry, index) in menus"
                :key="entry.label"
                :open="open === index"
                :positioning="bottomStartPositioning"
                lazy-mount
                unmount-on-exit
                @open-change="open = $event.open ? index : open === index ? null : open"
                @select="emit('select', $event.value)"
            >
                <Menu.Trigger
                    role="menuitem"
                    :tabindex="index === focused ? 0 : -1"
                    :class="styles.item()"
                    @focus="focused = index"
                    @keydown="onTriggerKey($event, index)"
                >
                    {{ entry.label }}
                </Menu.Trigger>
                <Teleport to="body">
                    <Menu.Positioner>
                        <Menu.Content :class="menuStyles.content()" @keydown="onContentKey($event, index)">
                            <MenuEntries :entries="entry.items" @select="emit('select', $event)">
                                <template v-if="$slots.item" #item="slotProps"
                                    ><slot name="item" v-bind="slotProps"
                                /></template>
                            </MenuEntries>
                        </Menu.Content>
                    </Menu.Positioner>
                </Teleport>
            </Menu.Root>
        </div>
        <MenuComponent
            v-if="responsive"
            :items="burgerItems"
            :link-as="linkAs"
            @select="emit('select', $event)"
            @checked-change="(value, checked) => emit('checked-change', value, checked)"
            @value-change="(name, value) => emit('value-change', name, value)"
        >
            <IconButton
                :icon="MenuIcon"
                :label="menuLabel ?? translations.menubar.menu"
                variant="text"
                size="sm"
                :class="styles.burger()"
            />
            <template v-if="$slots.item" #item="slotProps"><slot name="item" v-bind="slotProps" /></template>
        </MenuComponent>
        <div v-if="$slots.end" :class="styles.end()"><slot name="end" /></div>
    </Wrap>
</template>
