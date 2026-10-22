<script setup lang="ts">
import { Menu } from '@ark-ui/vue/menu';
import { Check, ChevronRight, Circle } from '@lucide/vue';
import { menu as menuRecipe, SUBMENU_GUTTER } from '@wirecore/wirelayer-recipes';
import { useMenuState } from './state.js';
import type { MenuCheckboxItem, MenuEntry, MenuItem, MenuRadioItem } from './types.js';
import { useRecipe } from '../../recipes.js';

defineOptions({ name: 'MenuEntries' });
defineProps<{ entries: MenuEntry[] }>();
defineSlots<{
    /** Own content of an item (instead of icon, label and shortcut) */
    item?(props: { item: MenuItem | MenuCheckboxItem | MenuRadioItem }): unknown;
}>();
const menu = useRecipe('menu', menuRecipe);
const emit = defineEmits<{ select: [value: string] }>();
const styles = menu();
const state = useMenuState();
const keyOf = (entry: MenuEntry, index: number) => {
    if (!('type' in entry)) return entry.value;
    if (entry.type === 'checkbox') return entry.value;
    if (entry.type === 'radio') return `radio-${entry.name}`;
    return `${entry.type}-${index}`;
};
</script>

<template>
    <!-- Items, groups with a heading, checkbox and radio items, separators and submenus (recursive) -->
    <template v-for="(entry, index) in entries" :key="keyOf(entry, index)">
        <Menu.Separator v-if="'type' in entry && entry.type === 'separator'" :class="styles.separator()" />
        <Menu.ItemGroup v-else-if="'type' in entry && entry.type === 'group'">
            <Menu.ItemGroupLabel :class="styles.groupLabel()">{{ entry.label }}</Menu.ItemGroupLabel>
            <MenuEntries :entries="entry.items" @select="emit('select', $event)">
                <template v-if="$slots.item" #item="slotProps"><slot name="item" v-bind="slotProps" /></template>
            </MenuEntries>
        </Menu.ItemGroup>
        <Menu.RadioItemGroup
            v-else-if="'type' in entry && entry.type === 'radio'"
            :model-value="state?.radio(entry)"
            @update:model-value="state?.setRadio(entry, $event)"
        >
            <Menu.ItemGroupLabel v-if="entry.label" :class="styles.groupLabel()">{{ entry.label }}</Menu.ItemGroupLabel>
            <Menu.RadioItem
                v-for="option in entry.items"
                :key="option.value"
                :value="option.value"
                :disabled="option.disabled"
                :close-on-select="option.closeOnSelect ?? false"
                :class="styles.item()"
            >
                <span :class="styles.indicator()">
                    <Menu.ItemIndicator
                        ><Circle :class="styles.indicatorDot()" aria-hidden="true"
                    /></Menu.ItemIndicator>
                </span>
                <slot name="item" :item="option">
                    <component :is="option.icon" v-if="option.icon" :class="styles.icon()" aria-hidden="true" />
                    <span :class="styles.label()">{{ option.label }}</span>
                </slot>
            </Menu.RadioItem>
        </Menu.RadioItemGroup>
        <Menu.CheckboxItem
            v-else-if="'type' in entry && entry.type === 'checkbox'"
            :value="entry.value"
            :checked="state?.checked(entry) ?? !!entry.checked"
            :disabled="entry.disabled"
            :close-on-select="entry.closeOnSelect ?? false"
            :class="styles.item()"
            @update:checked="state?.setChecked(entry, $event)"
        >
            <span :class="styles.indicator()">
                <Menu.ItemIndicator><Check :class="styles.indicatorIcon()" aria-hidden="true" /></Menu.ItemIndicator>
            </span>
            <slot name="item" :item="entry">
                <component :is="entry.icon" v-if="entry.icon" :class="styles.icon()" aria-hidden="true" />
                <span :class="styles.label()">{{ entry.label }}</span>
            </slot>
        </Menu.CheckboxItem>
        <Menu.Root
            v-else-if="!('type' in entry) && entry.children"
            :positioning="{ placement: 'right-start', offset: { mainAxis: SUBMENU_GUTTER } }"
            @select="emit('select', $event.value)"
        >
            <Menu.TriggerItem :class="styles.item()">
                <component :is="entry.icon" v-if="entry.icon" :class="styles.icon()" aria-hidden="true" />
                <span :class="styles.label()">{{ entry.label }}</span>
                <ChevronRight :class="styles.submenuIcon()" aria-hidden="true" />
            </Menu.TriggerItem>
            <Teleport to="body">
                <Menu.Positioner>
                    <Menu.Content :class="styles.content()">
                        <MenuEntries :entries="entry.children" @select="emit('select', $event)">
                            <template v-if="$slots.item" #item="slotProps"
                                ><slot name="item" v-bind="slotProps"
                            /></template>
                        </MenuEntries>
                    </Menu.Content>
                </Menu.Positioner>
            </Teleport>
        </Menu.Root>
        <Menu.Item
            v-else-if="!('type' in entry) && entry.href"
            :value="entry.value"
            :disabled="entry.disabled"
            :close-on-select="entry.closeOnSelect"
            as-child
        >
            <component :is="state?.linkAs() ?? 'a'" :href="entry.href" :class="menu({ danger: entry.danger }).item()">
                <slot name="item" :item="entry">
                    <component :is="entry.icon" v-if="entry.icon" :class="styles.icon()" aria-hidden="true" />
                    <span :class="styles.label()">{{ entry.label }}</span>
                    <span v-if="entry.shortcut" :class="styles.shortcut()" aria-hidden="true">{{
                        entry.shortcut
                    }}</span>
                </slot>
            </component>
        </Menu.Item>
        <Menu.Item
            v-else-if="!('type' in entry)"
            :value="entry.value"
            :disabled="entry.disabled"
            :close-on-select="entry.closeOnSelect"
            :class="menu({ danger: entry.danger }).item()"
        >
            <slot name="item" :item="entry">
                <component :is="entry.icon" v-if="entry.icon" :class="styles.icon()" aria-hidden="true" />
                <span :class="styles.label()">{{ entry.label }}</span>
                <span v-if="entry.shortcut" :class="styles.shortcut()" aria-hidden="true">{{ entry.shortcut }}</span>
            </slot>
        </Menu.Item>
    </template>
</template>
