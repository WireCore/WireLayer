import { emptyState as emptyStateRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
    title: string;
    /** Text below the title */
    description?: ReactNode;
    /** Icon component above the title */
    icon?: IconComponent;
    variant?: 'plain' | 'dashed';
    size?: 'sm' | 'md';
    /** Renders the title as a heading of this level – without it the title is a paragraph */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Buttons or links for the next step */
    actions?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof emptyStateRecipe>;
}

/** Placeholder for an empty list, table or search result, with the next step as actions */
export function EmptyState({
    classes,
    title,
    description,
    icon: Icon,
    variant,
    size,
    headingLevel,
    actions,
    className,
    ...props
}: EmptyStateProps) {
    const emptyState = useRecipe('emptyState', emptyStateRecipe, classes);
    const styles = emptyState({ variant, size });
    const Title = headingLevel ? (`h${headingLevel}` as const) : 'p';
    return (
        <div {...props} className={styles.base({ class: className })}>
            {Icon && (
                <span className={styles.icon()}>
                    <Icon className={styles.iconSvg()} aria-hidden="true" />
                </span>
            )}
            <Title className={styles.title()}>{title}</Title>
            {description && <p className={styles.description()}>{description}</p>}
            {actions && <div className={styles.actions()}>{actions}</div>}
        </div>
    );
}
