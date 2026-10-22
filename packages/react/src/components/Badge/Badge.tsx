import { badge as badgeRecipe, type BadgeVariant, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface BadgeProps extends ComponentProps<'span'> {
    variant?: BadgeVariant;
    /** Icon component rendered before the text */
    icon?: IconComponent;
    /** Round shape for a count or a single character (grows into a pill for longer content) */
    circle?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof badgeRecipe>;
}

/** Short label or status (solid, soft, outline or a status colour) */
export function Badge({ classes, variant, icon: Icon, circle, className, children, ...props }: BadgeProps) {
    const badge = useRecipe('badge', badgeRecipe, classes);
    const styles = badge({ variant, circle });

    return (
        <span {...props} className={styles.base({ class: className })}>
            {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
            {children}
        </span>
    );
}
