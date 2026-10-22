import { Collapsible } from '@ark-ui/react/collapsible';
import { siteHeader as siteHeaderRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { IconButton, useTranslations } from '@wirecore/wirelayer-react';
import { Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { NavItem } from '../types.js';
import { useRecipe } from '@wirecore/wirelayer-react';

export interface NavLinkAttributes {
    className: string;
    'aria-current'?: 'page';
    onClick?: () => void;
}

export interface SiteHeaderProps {
    /** Name next to the logo, links to the home page */
    brand: string;
    homeHref?: string;
    items?: NavItem[];
    /** Logo before the brand name (decorative – the name is the link text) */
    logo?: ReactNode;
    /** Actions on the right, e.g. a CTA button and the ModeToggle – repeated in the mobile menu */
    actions?: ReactNode;
    /** Accessible name of the navigation landmark */
    navLabel?: string;
    /** Accessible name of the mobile menu button */
    menuLabel?: string;
    /** Custom link, e.g. Next.js Link: spread `attributes` onto it */
    renderLink?: (item: NavItem, attributes: NavLinkAttributes) => ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof siteHeaderRecipe>;
}

const defaultRenderLink = (item: NavItem, attributes: NavLinkAttributes) => (
    <a key={item.href} href={item.href} {...attributes}>
        {item.label}
    </a>
);

export function SiteHeader({
    classes,
    brand,
    homeHref = '/',
    items = [],
    logo,
    actions,
    navLabel: navLabelProp,
    menuLabel: menuLabelProp,
    renderLink = defaultRenderLink,
}: SiteHeaderProps) {
    const siteHeader = useRecipe('siteHeader', siteHeaderRecipe, classes);
    const styles = siteHeader();
    const translations = useTranslations();
    const navLabel = navLabelProp ?? translations.siteHeader.navigation;
    const menuLabel = menuLabelProp ?? translations.siteHeader.menu;
    const [open, setOpen] = useState(false);

    const attributesFor = (item: NavItem, mobile: boolean): NavLinkAttributes => ({
        className: mobile ? styles.panelLink() : styles.link(),
        'aria-current': item.current ? 'page' : undefined,
        // Following a link in the mobile menu closes it (SPA navigation keeps the header mounted)
        onClick: mobile ? () => setOpen(false) : undefined,
    });

    return (
        <Collapsible.Root open={open} onOpenChange={(details) => setOpen(details.open)} asChild lazyMount unmountOnExit>
            <header className={styles.base()}>
                <div className={styles.bar()}>
                    <a href={homeHref} className={styles.brand()}>
                        {logo && (
                            <span className={styles.logo()} aria-hidden="true">
                                {logo}
                            </span>
                        )}
                        {brand}
                    </a>
                    {items.length > 0 && (
                        <nav aria-label={navLabel} className={styles.nav()}>
                            {items.map((item) => renderLink(item, attributesFor(item, false)))}
                        </nav>
                    )}
                    {actions && <div className={styles.actions()}>{actions}</div>}
                    {(items.length > 0 || actions) && (
                        <Collapsible.Trigger asChild>
                            <IconButton
                                icon={open ? X : Menu}
                                label={menuLabel}
                                variant="text"
                                className={styles.toggle()}
                            />
                        </Collapsible.Trigger>
                    )}
                </div>
                <Collapsible.Content className={styles.panel()}>
                    {items.length > 0 && (
                        <nav aria-label={navLabel} className={styles.panelNav()}>
                            {items.map((item) => renderLink(item, attributesFor(item, true)))}
                        </nav>
                    )}
                    {actions && <div className={styles.panelActions()}>{actions}</div>}
                </Collapsible.Content>
            </header>
        </Collapsible.Root>
    );
}
