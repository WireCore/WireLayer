import { sticky as stickyRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, CSSProperties, ElementType } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface StickyProps extends ComponentProps<'div'> {
    /** Edge it sticks to while its container scrolls (default top) */
    edge?: 'top' | 'bottom';
    /** Distance from the edge, e.g. "3.5rem" below a fixed header (default 0) */
    offset?: string;
    /** Action bar look (background, line, buttons at the end) – e.g. Save/Cancel below a long form */
    bar?: boolean;
    /** Element to render (default div) */
    as?: ElementType;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof stickyRecipe>;
}

/** Sticks to the top or bottom edge while its container scrolls */
export function Sticky({ classes, edge, offset, bar, as: Element = 'div', className, style, ...props }: StickyProps) {
    const sticky = useRecipe('sticky', stickyRecipe, classes);
    return (
        <Element
            {...props}
            className={sticky({ edge, bar, class: className })}
            style={{ ...(offset ? { '--wc-sticky-offset': offset } : {}), ...style } as CSSProperties}
        />
    );
}
