import { collapse as collapseRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface CollapseProps extends ComponentProps<'div'> {
    /** Shown (the height – or width – animates; closed content is out of the tab order) */
    open?: boolean;
    /** vertical: animates the height (default); horizontal: the width */
    orientation?: 'vertical' | 'horizontal';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof collapseRecipe>;
}

/**
 * Content that opens and closes with an animated height (or width, motion-safe). Give it an id and point the
 * button's aria-controls at it; the button carries aria-expanded.
 */
export function Collapse({ classes, open = false, orientation, className, children, ...props }: CollapseProps) {
    const collapse = useRecipe('collapse', collapseRecipe, classes);
    const styles = collapse({ orientation });
    return (
        <div
            {...props}
            className={styles.base({ class: className })}
            data-state={open ? 'open' : 'closed'}
            data-orientation={orientation ?? 'vertical'}
        >
            <div className={styles.inner()}>{children}</div>
        </div>
    );
}
