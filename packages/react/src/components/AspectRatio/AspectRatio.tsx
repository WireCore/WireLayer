import { aspectRatio as aspectRatioRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, CSSProperties } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface AspectRatioProps extends ComponentProps<'div'> {
    /** Width divided by height, e.g. 16 / 9 (default), 4 / 3 or 1 */
    ratio?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof aspectRatioRecipe>;
}

/** Keeps the ratio of width to height; an image, video or iframe inside fills it */
export function AspectRatio({ classes, ratio = 16 / 9, className, style, ...props }: AspectRatioProps) {
    const aspectRatio = useRecipe('aspectRatio', aspectRatioRecipe, classes);
    return (
        <div
            {...props}
            className={aspectRatio({ class: className })}
            style={{ '--wc-ratio': String(ratio), ...style } as CSSProperties}
        />
    );
}
