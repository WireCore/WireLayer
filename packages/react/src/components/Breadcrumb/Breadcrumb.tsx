import { breadcrumb as breadcrumbRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronRight, Ellipsis } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { Menu } from '../Menu/Menu.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { BreadcrumbItem } from './BreadcrumbItem.js';

/** One step of the path, for `items` */
export interface BreadcrumbEntry {
    label: string;
    href?: string;
    /** Icon component before the label */
    icon?: IconComponent;
    /** Show only the icon; the label stays available to screen readers */
    iconOnly?: boolean;
    /** The current page (usually the last entry) */
    current?: boolean;
}

export interface BreadcrumbProps extends ComponentProps<'nav'> {
    /** Accessible name of the navigation landmark */
    label?: string;
    /** The path as data instead of BreadcrumbItem children (needed for maxItems) */
    items?: BreadcrumbEntry[];
    /** With more items, the middle ones collapse into "…" – a menu with the hidden steps */
    maxItems?: number;
    /** Items kept before the "…" (default 1) */
    itemsBeforeCollapse?: number;
    /** Items kept after the "…" (default 1) */
    itemsAfterCollapse?: number;
    /** Accessible name of the "…" button (default "Ausgeblendete Ebenen") */
    moreLabel?: string;
    /** A hidden step was chosen from the "…" menu – without it the browser opens its href */
    onNavigate?: (item: BreadcrumbEntry) => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof breadcrumbRecipe>;
}

/** Path to the current page: navigation "Breadcrumb" with a list of links; the last item is the current page */
export function Breadcrumb({
    classes,
    label,
    items,
    maxItems,
    itemsBeforeCollapse = 1,
    itemsAfterCollapse = 1,
    moreLabel,
    onNavigate,
    className,
    children,
    ...props
}: BreadcrumbProps) {
    const breadcrumb = useRecipe('breadcrumb', breadcrumbRecipe, classes);
    const styles = breadcrumb();
    const translations = useTranslations();

    const all = items ?? [];
    const before = Math.max(1, itemsBeforeCollapse);
    const after = Math.max(1, itemsAfterCollapse);
    const collapse = !!maxItems && all.length > maxItems && before + after < all.length;
    const shownBefore = collapse ? all.slice(0, before) : all;
    const hidden = collapse ? all.slice(before, all.length - after) : [];
    const shownAfter = collapse ? all.slice(all.length - after) : [];
    const entry = (item: BreadcrumbEntry, key: string) => (
        <BreadcrumbItem key={key} href={item.href} icon={item.icon} iconOnly={item.iconOnly} current={item.current}>
            {item.label}
        </BreadcrumbItem>
    );

    return (
        <nav {...props} className={className || undefined} aria-label={label ?? translations.breadcrumb.label}>
            <ol className={styles.list()}>
                {items ? (
                    <>
                        {shownBefore.map((item, index) => entry(item, `before-${index}`))}
                        {hidden.length > 0 && (
                            <li className={styles.item()}>
                                <ChevronRight className={styles.separator()} aria-hidden="true" />
                                <Menu
                                    items={hidden.map((item, index) => ({
                                        value: String(index),
                                        label: item.label,
                                        icon: item.icon,
                                    }))}
                                    onSelect={(value) => {
                                        const item = hidden[Number(value)];
                                        if (!item) return;
                                        if (onNavigate) onNavigate(item);
                                        else if (item.href) window.location.assign(item.href);
                                    }}
                                >
                                    <button
                                        type="button"
                                        className={styles.ellipsis()}
                                        aria-label={moreLabel ?? translations.breadcrumb.more}
                                    >
                                        <Ellipsis className={styles.ellipsisIcon()} aria-hidden="true" />
                                    </button>
                                </Menu>
                            </li>
                        )}
                        {shownAfter.map((item, index) => entry(item, `after-${index}`))}
                    </>
                ) : (
                    children
                )}
            </ol>
        </nav>
    );
}
