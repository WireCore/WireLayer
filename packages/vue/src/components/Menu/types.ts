import type { Component } from 'vue';

export interface MenuItem {
    value: string;
    label: string;
    /** Icon component before the label */
    icon?: Component;
    /** Shortcut hint shown on the right, e.g. "⌘E" (display only) */
    shortcut?: string;
    /** Destructive action – shown in the danger colour */
    danger?: boolean;
    disabled?: boolean;
    /** Opens a submenu to the side (arrow right); the item itself is then not selectable */
    children?: MenuEntry[];
    /** Link target – the item is a link (rendered with the menu's `linkAs`, e.g. a router link) */
    href?: string;
    /** Closes the menu when chosen (default true) */
    closeOnSelect?: boolean;
}

/** Item that is switched on and off (role="menuitemcheckbox") */
export interface MenuCheckboxItem {
    type: 'checkbox';
    value: string;
    label: string;
    /** Initial state; changes are reported with checked-change / onCheckedChange */
    checked?: boolean;
    icon?: Component;
    disabled?: boolean;
    /** Closes the menu when switched (default false: several can be switched in a row) */
    closeOnSelect?: boolean;
}

/** One choice of a radio group */
export interface MenuRadioItem {
    value: string;
    label: string;
    icon?: Component;
    disabled?: boolean;
    /** Closes the menu when chosen (default false) */
    closeOnSelect?: boolean;
}

/** Items of which exactly one is chosen (role="menuitemradio"), e.g. a sort order */
export interface MenuRadioGroup {
    type: 'radio';
    /** Name of the group – reported with value-change / onValueChange */
    name: string;
    /** Heading of the group */
    label?: string;
    /** Initially chosen value */
    value?: string;
    items: MenuRadioItem[];
}

/** Items under a heading */
export interface MenuGroup {
    type: 'group';
    label: string;
    items: MenuEntry[];
}

export interface MenuSeparator {
    type: 'separator';
}

export type MenuEntry = MenuItem | MenuGroup | MenuSeparator | MenuCheckboxItem | MenuRadioGroup;
