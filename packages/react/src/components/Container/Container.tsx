import { container as containerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, ElementType } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ContainerProps extends ComponentProps<'div'> {
    /** Maximum width: sm (42rem), md (48rem), lg (64rem, default), xl (80rem) or full */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Without the side padding */
    flush?: boolean;
    /** Element to render, e.g. "section" (default div) */
    as?: ElementType;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof containerRecipe>;
}

/** Centred content with a maximum width and side padding */
export function Container({ classes, size, flush, as: Element = 'div', className, ...props }: ContainerProps) {
    const container = useRecipe('container', containerRecipe, classes);
    return <Element {...props} className={container({ size, flush, class: className })} />;
}
