import { inject, provide, reactive, watch, type Component, type InjectionKey } from 'vue';
import type { MenuCheckboxItem, MenuEntry, MenuRadioGroup } from './types.js';

/** State of the checkbox and radio items of a menu and how links are rendered – shared with nested MenuEntries */
export interface MenuState {
    checked: (entry: MenuCheckboxItem) => boolean;
    setChecked: (entry: MenuCheckboxItem, checked: boolean) => void;
    radio: (group: MenuRadioGroup) => string | undefined;
    setRadio: (group: MenuRadioGroup, value: string) => void;
    linkAs: () => Component | string;
}

const key: InjectionKey<MenuState> = Symbol('wirecore-menu-state');

/**
 * Checkbox and radio items start with the state of the items and keep their changes until new items arrive, so the
 * menu works without handling the events (they still report every change).
 */
export function provideMenuState(options: {
    items: () => readonly MenuEntry[] | (readonly MenuEntry[])[];
    linkAs: () => Component | string | undefined;
    onCheckedChange: (value: string, checked: boolean) => void;
    onValueChange: (name: string, value: string) => void;
}) {
    const changed = reactive({ checked: {} as Record<string, boolean>, radio: {} as Record<string, string> });
    watch(options.items, () => {
        changed.checked = {};
        changed.radio = {};
    });
    const state: MenuState = {
        checked: (entry) => changed.checked[entry.value] ?? entry.checked ?? false,
        setChecked: (entry, checked) => {
            changed.checked[entry.value] = checked;
            options.onCheckedChange(entry.value, checked);
        },
        radio: (group) => changed.radio[group.name] ?? group.value,
        setRadio: (group, value) => {
            changed.radio[group.name] = value;
            options.onValueChange(group.name, value);
        },
        linkAs: () => options.linkAs() ?? 'a',
    };
    provide(key, state);
    return state;
}

export const useMenuState = () => inject(key, null);
