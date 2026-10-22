import { stack as stackRecipe, type LayoutGap, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, ElementType } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface StackProps extends ComponentProps<'div'> {
    /** Space between the children: none, xs (4px), sm (8px), md (16px, default), lg (24px), xl (32px) */
    gap?: LayoutGap;
    /** Horizontal alignment of the children */
    align?: 'stretch' | 'start' | 'center' | 'end';
    /** Element to render, e.g. "ul" or "section" (default div) */
    as?: ElementType;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof stackRecipe>;
}

/** Children below each other with an even gap */
export function Stack({ classes, gap, align, as: Element = 'div', className, ...props }: StackProps) {
    const stack = useRecipe('stack', stackRecipe, classes);
    return <Element {...props} className={stack({ gap, align, class: className })} />;
}
