import { formatCount, overlayBadge as overlayBadgeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface OverlayBadgeProps {
    /** Number on the badge; without it a dot is shown */
    count?: number;
    /** Highest number shown, above it "99+" */
    max?: number;
    /** Text for screen readers, e.g. "3 unread messages" – the badge itself is only visual */
    label: string;
    children: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof overlayBadgeRecipe>;
}

/** Count or dot on the corner of the wrapped element; screen readers get the label instead */
export function OverlayBadge({ classes, count, max = 99, label, children }: OverlayBadgeProps) {
    const overlayBadge = useRecipe('overlayBadge', overlayBadgeRecipe, classes);
    const styles = overlayBadge();
    return (
        <span className={styles.base()}>
            {children}
            {count === undefined ? (
                <span className={styles.dot()} aria-hidden="true" />
            ) : (
                count > 0 && (
                    <span className={styles.badge()} aria-hidden="true">
                        {formatCount(count, max)}
                    </span>
                )
            )}
            <span className={styles.label()}>{label}</span>
        </span>
    );
}
