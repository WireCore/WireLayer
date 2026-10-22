import {
    bottomNavigation as bottomNavigationRecipe,
    formatCount,
    isCurrentLink,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import type { ComponentProps, ElementType, MouseEvent } from 'react';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface BottomNavigationItem {
    label: string;
    href: string;
    icon: IconComponent;
    /** Count (shown as 99+ above 99) or short text on the icon; it is part of the link's name */
    badge?: number | string;
    /** The current page (aria-current="page"); else `currentHref`/`isCurrent` decide */
    current?: boolean;
}

export interface BottomNavigationProps extends ComponentProps<'nav'> {
    /** 3 to 5 destinations */
    items: BottomNavigationItem[];
    /** Name of the navigation landmark (default "Navigation") */
    label?: string;
    /** Path of the current page – the item with exactly this href gets aria-current="page" */
    currentHref?: string;
    /** Own check for the current page, e.g. with the router */
    isCurrent?: (item: BottomNavigationItem) => boolean;
    /** Component for the links, e.g. a router link (gets `href`); default <a> */
    linkAs?: ElementType;
    /** A link was clicked – call event.preventDefault() and route yourself in a single-page app */
    onNavigate?: (item: BottomNavigationItem, event: MouseEvent<HTMLAnchorElement>) => void;
    /** In the flow of the page instead of fixed at the bottom */
    inline?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof bottomNavigationRecipe>;
}

/**
 * Navigation landmark fixed at the bottom (above the home indicator): icon and text per destination, the current
 * one with aria-current="page", targets of at least 44 px
 */
export function BottomNavigation({
    classes,
    items,
    label,
    currentHref,
    isCurrent,
    linkAs: Link = 'a',
    onNavigate,
    inline,
    className,
    ...props
}: BottomNavigationProps) {
    const bottomNavigation = useRecipe('bottomNavigation', bottomNavigationRecipe, classes);
    const styles = bottomNavigation({ inline });
    const translations = useTranslations();
    return (
        <nav
            {...props}
            className={styles.base({ class: className })}
            aria-label={label ?? translations.bottomNavigation.label}
        >
            <ul className={styles.list()}>
                {items.map((item) => {
                    const Icon = item.icon;
                    return (
                        <li key={item.href} className={styles.item()}>
                            <Link
                                href={item.href}
                                className={styles.link()}
                                aria-current={isCurrentLink(item, currentHref, isCurrent) ? 'page' : undefined}
                                onClick={(event: MouseEvent<HTMLAnchorElement>) => onNavigate?.(item, event)}
                            >
                                <span className={styles.iconBox()}>
                                    <Icon className={styles.icon()} aria-hidden="true" />
                                    {item.badge !== undefined && item.badge !== 0 && (
                                        <span className={styles.badge()}>
                                            {typeof item.badge === 'number' ? formatCount(item.badge) : item.badge}
                                        </span>
                                    )}
                                </span>
                                <span className={styles.label()}>{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
