import { buttonGroup as buttonGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ButtonGroupProps extends ComponentProps<'div'> {
    /** Accessible name of the group (role="group"), e.g. "View"; or pass aria-labelledby */
    label?: string;
    /** Buttons side by side (default) or stacked */
    orientation?: 'horizontal' | 'vertical';
    /** Full width of the container; the buttons share it */
    block?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof buttonGroupRecipe>;
}

/** Buttons joined into one control (role="group"): only the outer corners stay round, also stacked */
export function ButtonGroup({
    classes,
    label,
    orientation = 'horizontal',
    block,
    className,
    children,
    ...props
}: ButtonGroupProps) {
    const buttonGroup = useRecipe('buttonGroup', buttonGroupRecipe, classes);
    return (
        <div
            {...props}
            className={buttonGroup({ orientation, block, class: className })}
            role="group"
            aria-label={label}
            data-orientation={orientation}
        >
            {children}
        </div>
    );
}
