import { statusDot as statusDotRecipe, type StatusDotStatus, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Circle, CircleCheck, Info, OctagonX, TriangleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface StatusDotProps extends ComponentProps<'span'> {
    /** Colour of the dot – always pair it with a text label, colour alone is not enough */
    status?: StatusDotStatus;
    /** Pulsing dot for live states (off with reduced motion) */
    pulse?: boolean;
    /**
     * Status icon instead of the dot – shape as a second cue next to colour and text. `true` uses the icon of the
     * status (check, info, warning, error), or pass an icon component
     */
    icon?: boolean | IconComponent;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof statusDotRecipe>;
}

const statusIcons = { neutral: Circle, success: CircleCheck, info: Info, warn: TriangleAlert, danger: OctagonX };

/** Coloured dot (or status icon) with a status text (colour is never the only cue) */
export function StatusDot({ classes, status, pulse = false, icon, className, children, ...props }: StatusDotProps) {
    const statusDot = useRecipe('statusDot', statusDotRecipe, classes);
    const styles = statusDot({ status, pulse });
    const Icon = icon === true ? statusIcons[status ?? 'neutral'] : icon || undefined;

    return (
        <span {...props} className={styles.base({ class: className })}>
            {Icon ? (
                <Icon className={styles.icon()} aria-hidden="true" />
            ) : (
                <span className={styles.dot()} aria-hidden="true" />
            )}
            {children}
        </span>
    );
}
