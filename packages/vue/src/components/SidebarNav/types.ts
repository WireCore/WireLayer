import type { Component } from 'vue';

export interface SidebarNavItem {
    label: string;
    /** Link target; items with children are groups and have none */
    href?: string;
    icon?: Component;
    /** The current page (aria-current="page"); its groups start open */
    current?: boolean;
    children?: SidebarNavItem[];
    /** Count or short text after the label (part of the link's name) */
    badge?: number | string;
}

/** Whether the item or one of its descendants is the current page */
export const containsCurrent = (item: SidebarNavItem): boolean =>
    !!item.current || !!item.children?.some(containsCurrent);
