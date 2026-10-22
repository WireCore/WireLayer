import { affix as affixRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, CSSProperties } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface AffixProps extends ComponentProps<'div'> {
    /** Corner of the window (default bottom-end) */
    position?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
    /** Distance from the edges, e.g. "1rem" (default 1.5rem) */
    offset?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof affixRecipe>;
}

/** Fixed in a corner of the window, e.g. a help or chat button */
export function Affix({ classes, position, offset, className, style, ...props }: AffixProps) {
    const affix = useRecipe('affix', affixRecipe, classes);
    return (
        <div
            {...props}
            className={affix({ position, class: className })}
            style={{ ...(offset ? { '--wc-affix-offset': offset } : {}), ...style } as CSSProperties}
        />
    );
}
