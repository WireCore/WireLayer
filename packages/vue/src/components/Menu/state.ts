import { closeMenuOnPageEvents, highlightFirstMenuItem } from '@wirecore/wirelayer-recipes';
import { computed, inject, nextTick, provide, reactive, ref, watch, type Component, type InjectionKey } from 'vue';
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

/**
 * Opt-in behaviour of an open Menu or ContextMenu: closing when the page scrolls, the window is resized or loses the
 * focus, and highlighting the first item when it opens by pointer (Enter then takes it, as in desktop context menus).
 * Returns Ark's root props for the highlight – controlled only with `highlightFirst`.
 */
export function useMenuBehavior(options: {
    open: () => boolean;
    close: () => void;
    content: () => HTMLElement | null | undefined;
    closeOnScroll: () => boolean;
    closeOnResize: () => boolean;
    closeOnBlur: () => boolean;
    highlightFirst: () => boolean;
}) {
    watch(
        [options.open, options.closeOnScroll, options.closeOnResize, options.closeOnBlur],
        ([open, scroll, resize, blur], _, onCleanup) => {
            if (open && (scroll || resize || blur) && typeof window !== 'undefined')
                onCleanup(closeMenuOnPageEvents(options.close, { scroll, resize, blur }));
        },
        // Also a menu that starts open (defaultOpen)
        { immediate: true }
    );
    const highlighted = ref<string | null>(null);
    watch(options.open, async (open) => {
        highlighted.value = null;
        if (!open || !options.highlightFirst()) return;
        await nextTick();
        // Once the items are rendered; a keyboard opening (or the pointer) may have highlighted one already
        requestAnimationFrame(() => {
            const content = options.content();
            if (content && highlighted.value === null)
                highlightFirstMenuItem(content, { setHighlightedValue: (value) => (highlighted.value = value) });
        });
    });
    return computed(() =>
        options.highlightFirst()
            ? {
                  // null: controlled, nothing highlighted (Ark's Vue types leave null out, zag takes it)
                  highlightedValue: highlighted.value as string | undefined,
                  onHighlightChange: (details: { highlightedValue: string | null }) =>
                      (highlighted.value = details.highlightedValue),
              }
            : {}
    );
}
