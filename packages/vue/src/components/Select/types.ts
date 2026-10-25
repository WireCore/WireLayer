import type { Component } from 'vue';

/** Option of Select, MultiSelect, Combobox and VirtualSelect */
export interface SelectItem<V = string> {
    value: V;
    label: string;
    /** Icon component shown in the option and in the trigger when selected */
    icon?: Component;
    disabled?: boolean;
    /** Second line below the label */
    description?: string;
    /** Items with the same group are listed under this heading */
    group?: string;
    /** More text the search finds the item by, besides its label */
    keywords?: readonly string[];
}

/** State of an option, passed to the `item` slot */
export interface ListItemState {
    selected: boolean;
    highlighted: boolean;
    disabled: boolean;
}

/** Field sizes, like Button and Input: 32, 40 and 48 px */
export type SelectSize = 'sm' | 'md' | 'lg';

/** Classes of the parts of one option list (Select, MultiSelect, Combobox, Listbox) */
export interface ListClasses {
    item: string;
    itemText: string;
    icon: string;
    itemIndicator: string;
    itemBody: string;
    itemDescription: string;
    group: string;
    groupLabel: string;
    loading: string;
    loadingIcon: string;
    sentinel: string;
    empty?: string;
    check?: string;
    checkIcon?: string;
}
