import { type RecipeClasses, topBar as topBarRecipe } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface TopBarProps extends ComponentProps<'header'> {
    /** Start, e.g. the logo or the app name */
    start?: ReactNode;
    /** End, e.g. an app switcher and the user menu */
    end?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof topBarRecipe>;
}

/**
 * Slim header of an app outside AppShell: `start`, the middle (children, takes the free space) and `end` – no menus
 * and no toolbar keyboard navigation, the content keeps its own
 */
export function TopBar({ classes, start, end, children, className, ...props }: TopBarProps) {
    const topBar = useRecipe('topBar', topBarRecipe, classes);
    const styles = topBar();
    // A header landmark (banner at the top level of the page)
    return (
        <header {...props} className={styles.base({ class: className })}>
            {start && <div className={styles.start()}>{start}</div>}
            {children && <div className={styles.center()}>{children}</div>}
            {end && <div className={styles.end()}>{end}</div>}
        </header>
    );
}
