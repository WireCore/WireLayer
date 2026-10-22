import { center as centerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface CenterProps extends ComponentProps<'div'> {
    /** inline-flex instead of flex (e.g. an icon next to text) */
    inline?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof centerRecipe>;
}

/** Centres its content horizontally and vertically */
export function Center({ classes, inline, className, ...props }: CenterProps) {
    const center = useRecipe('center', centerRecipe, classes);
    return <div {...props} className={center({ inline, class: className })} />;
}
