import { NavigationMenu as ArkNavigationMenu } from '@ark-ui/react/navigation-menu';
import { navigationMenu as navigationMenuRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronDown } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface NavigationMenuLink {
    label: string;
    href: string;
    description?: string;
    icon?: IconComponent;
    /** The current page (aria-current="page") */
    current?: boolean;
}

export interface NavigationMenuEntry {
    label: string;
    /** A direct link; entries with children open a panel instead */
    href?: string;
    current?: boolean;
    children?: NavigationMenuLink[];
}

export interface NavigationMenuProps {
    items: NavigationMenuEntry[];
    /** Name of the navigation landmark */
    label?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof navigationMenuRecipe>;
}

/**
 * Website navigation (nav landmark): entries with children are buttons (aria-expanded) that open a panel with
 * links – on hover or click; Escape closes. Not a menu (role="menu"), so links behave like links.
 */
export function NavigationMenu({ classes, items, label: labelProp, className, style }: NavigationMenuProps) {
    const navigationMenu = useRecipe('navigationMenu', navigationMenuRecipe, classes);
    const styles = navigationMenu();
    const translations = useTranslations();
    const label = labelProp ?? translations.navigationMenu.rootLabel;
    return (
        <ArkNavigationMenu.Root
            className={styles.base({ class: className })}
            style={style}
            translations={{ rootLabel: label }}
        >
            <ArkNavigationMenu.List className={styles.list()}>
                {items.map((item) => (
                    <ArkNavigationMenu.Item key={item.label} value={item.label} className={styles.item()}>
                        {item.children ? (
                            <>
                                <ArkNavigationMenu.Trigger className={styles.trigger()}>
                                    {item.label}
                                    <ChevronDown className={styles.triggerIcon()} aria-hidden="true" />
                                </ArkNavigationMenu.Trigger>
                                <ArkNavigationMenu.Content className={styles.content()}>
                                    {item.children.map((child) => {
                                        const Icon = child.icon;
                                        return (
                                            <ArkNavigationMenu.Link
                                                key={child.href}
                                                href={child.href}
                                                current={child.current}
                                                className={styles.panelLink()}
                                            >
                                                {Icon && <Icon className={styles.panelIcon()} aria-hidden="true" />}
                                                <span className={styles.panelText()}>
                                                    <span className={styles.panelLabel()}>{child.label}</span>
                                                    {child.description && (
                                                        <span className={styles.panelDescription()}>
                                                            {child.description}
                                                        </span>
                                                    )}
                                                </span>
                                            </ArkNavigationMenu.Link>
                                        );
                                    })}
                                </ArkNavigationMenu.Content>
                            </>
                        ) : (
                            <ArkNavigationMenu.Link href={item.href} current={item.current} className={styles.link()}>
                                {item.label}
                            </ArkNavigationMenu.Link>
                        )}
                    </ArkNavigationMenu.Item>
                ))}
            </ArkNavigationMenu.List>
        </ArkNavigationMenu.Root>
    );
}
