import type { LinkTo } from '@wirecore/wirelayer-recipes';
import type { Component } from 'vue';

export interface SidebarNavItem {
    label: string;
    /** Link target; items with children are groups and have none */
    href?: string;
    /** Router target, passed as `to` to `linkAs` instead of `href` (e.g. RouterLink or NuxtLink) */
    to?: LinkTo;
    icon?: Component;
    /** The current page (aria-current="page"); its groups start open. Else `currentHref`/`isCurrent` decide */
    current?: boolean;
    children?: SidebarNavItem[];
    /** Count or short text after the label (part of the link's name) */
    badge?: number | string;
}

/** Whether a link is the current page (its own `current`, else `isCurrent`, else `currentHref`) */
export type SidebarNavCurrentCheck = (item: SidebarNavItem) => boolean;

/** Whether the item or one of its descendants is the current page */
export const containsCurrent = (item: SidebarNavItem, check: SidebarNavCurrentCheck): boolean =>
    check(item) || !!item.children?.some((child) => containsCurrent(child, check));
