import { group as groupRecipe, type LayoutGap, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, ElementType } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface GroupProps extends ComponentProps<'div'> {
    /** Space between the children: none, xs (4px), sm (8px), md (16px, default), lg (24px), xl (32px) */
    gap?: LayoutGap;
    /** Distribution along the row */
    justify?: 'start' | 'center' | 'end' | 'between';
    /** Vertical alignment of the children (default middle) */
    align?: 'middle' | 'top' | 'bottom' | 'baseline' | 'stretch';
    /** Keep everything on one line instead of wrapping */
    nowrap?: boolean;
    /** Children share the width evenly */
    grow?: boolean;
    /** Element to render, e.g. "ul" (default div) */
    as?: ElementType;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof groupRecipe>;
}

/** Children side by side, wrapping onto new lines */
export function Group({
    classes,
    gap,
    justify,
    align,
    nowrap,
    grow,
    as: Element = 'div',
    className,
    ...props
}: GroupProps) {
    const group = useRecipe('group', groupRecipe, classes);
    return <Element {...props} className={group({ gap, justify, align, nowrap, grow, class: className })} />;
}
