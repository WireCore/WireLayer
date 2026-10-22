import { visuallyHidden as visuallyHiddenRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { AnchorHTMLAttributes, ElementType } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface VisuallyHiddenProps extends AnchorHTMLAttributes<HTMLElement> {
    /** Element (default span) */
    as?: ElementType;
    /** Becomes visible while it (or something inside) has the focus – e.g. a skip link */
    focusable?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof visuallyHiddenRecipe>;
}

/** Text only for screen readers, e.g. a label next to an icon */
export function VisuallyHidden({ classes, as: Element = 'span', focusable, className, ...props }: VisuallyHiddenProps) {
    const visuallyHidden = useRecipe('visuallyHidden', visuallyHiddenRecipe, classes);
    return <Element {...props} className={visuallyHidden({ focusable, class: className })} />;
}
