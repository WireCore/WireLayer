import { skeleton as skeletonRecipe, type SkeletonShape, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SkeletonProps extends ComponentProps<'span'> {
    shape?: SkeletonShape;
    /** CSS width, e.g. "60%" or 120 (px) */
    width?: string | number;
    /** CSS height */
    height?: string | number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof skeletonRecipe>;
}

/**
 * Placeholder while content loads. Hidden from assistive tech – mark the loading region with
 * aria-busy="true" (and announce the result) instead.
 */
export function Skeleton({ classes, shape, width, height, className, style, ...props }: SkeletonProps) {
    const skeleton = useRecipe('skeleton', skeletonRecipe, classes);
    return (
        <span
            aria-hidden="true"
            {...props}
            className={skeleton({ shape, class: className })}
            style={{ width, height, ...style }}
        />
    );
}
