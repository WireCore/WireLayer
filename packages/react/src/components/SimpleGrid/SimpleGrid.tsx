import {
    columnVariables,
    simpleGrid as simpleGridRecipe,
    type LayoutGap,
    type RecipeClasses,
    type ResponsiveColumns,
} from '@wirecore/wirelayer-recipes';
import type { ComponentProps, CSSProperties, ElementType } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SimpleGridProps extends ComponentProps<'div'> {
    /** Columns: a number or per breakpoint, e.g. { base: 1, sm: 2, lg: 4 } (default 1) */
    columns?: ResponsiveColumns;
    /** As many columns as fit, each at least this wide (e.g. "14rem") – instead of `columns` */
    minColumnWidth?: string;
    /** Space between the cells (default md, 16px) */
    gap?: LayoutGap;
    /** Element to render, e.g. "ul" (default div) */
    as?: ElementType;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof simpleGridRecipe>;
}

/** Columns of equal width, fixed per breakpoint or as many as fit */
export function SimpleGrid({
    classes,
    columns = 1,
    minColumnWidth,
    gap,
    as: Element = 'div',
    className,
    style,
    ...props
}: SimpleGridProps) {
    const simpleGrid = useRecipe('simpleGrid', simpleGridRecipe, classes);
    const variables = minColumnWidth ? { '--wc-min-col': minColumnWidth } : columnVariables(columns);
    return (
        <Element
            {...props}
            className={simpleGrid({ gap, autoFit: !!minColumnWidth, class: className })}
            style={{ ...variables, ...style } as CSSProperties}
        />
    );
}
