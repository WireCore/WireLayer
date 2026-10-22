import type { BadgeVariant } from '@wirecore/wirelayer-recipes';
import type { Component } from 'vue';

/** A link inside a panel */
export interface MegaMenuLink {
    label: string;
    href: string;
    /** Second line; linked to the link with aria-describedby */
    description?: string;
    icon?: Component;
    /** Short text after the label, e.g. "New" (part of the link's name) */
    badge?: string;
    badgeVariant?: BadgeVariant;
    /** The current page (aria-current="page"); else `currentHref`/`isCurrent` decide */
    current?: boolean;
}

/** Links under a visible heading (the list is named by it) */
export interface MegaMenuGroup {
    title: string;
    items: MegaMenuLink[];
    /** "Show all" link below the group */
    moreHref?: string;
    moreLabel?: string;
}

export interface MegaMenuColumn {
    groups: MegaMenuGroup[];
}

/** Promotion or teaser beside the columns */
export interface MegaMenuFeatured {
    title: string;
    href: string;
    description?: string;
    /** Small line above the title, e.g. "New" or "Case study" */
    eyebrow?: string;
    image?: string;
    /** Alternative text of the image (default empty: decorative) */
    imageAlt?: string;
}

/** An entry of the top level: a link, a button with a panel, or both (link plus chevron button) */
export interface MegaMenuItem {
    label: string;
    /** Identifies the open panel (default: the label) */
    value?: string;
    /** Link of the entry; together with columns/featured it gets a separate chevron button for the panel */
    href?: string;
    current?: boolean;
    columns?: MegaMenuColumn[];
    featured?: MegaMenuFeatured;
    /** "Show all" at the bottom of the panel */
    allHref?: string;
    allLabel?: string;
}

export const itemValue = (item: MegaMenuItem) => item.value ?? item.label;
export const hasPanel = (item: MegaMenuItem) => !!item.columns?.length || !!item.featured;
