import { skipLinks as skipLinksRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SkipLink {
    /** Target, e.g. "#main" or "#search" */
    href: string;
    /** Text, e.g. "Skip to content" */
    label: string;
}

export interface SkipLinksProps extends ComponentProps<'nav'> {
    links: SkipLink[];
    /** Accessible name of the navigation (default "Skip links") */
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof skipLinksRecipe>;
}

/**
 * Links to the main parts of the page, the first thing Tab reaches; each appears at the top left while focused.
 * Not a stop for F6 (data-landmark="off").
 */
export function SkipLinks({ classes, links, label, className, ...props }: SkipLinksProps) {
    const skipLinks = useRecipe('skipLinks', skipLinksRecipe, classes);
    const translations = useTranslations();
    const styles = skipLinks();
    return (
        <nav
            {...props}
            className={styles.base({ class: className })}
            aria-label={label ?? translations.skipLinks.label}
            data-landmark="off"
        >
            <ul className={styles.list()}>
                {links.map((link) => (
                    <li key={link.href}>
                        <a href={link.href} className={styles.link()}>
                            {link.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
