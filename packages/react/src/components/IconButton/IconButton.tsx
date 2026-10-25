import {
    buttonColorKey,
    formatCount,
    iconButton as iconButtonRecipe,
    type ButtonColor,
    type ButtonShape,
    type ButtonSize,
    type IconButtonVariant,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
    /** Icon component */
    icon: IconComponent;
    /** Props passed on to the icon component, e.g. { fill: 'currentColor' } for a filled icon or { strokeWidth: 1.5 } */
    iconProps?: Record<string, unknown>;
    /** Accessible name – icon buttons have no visible text */
    label: string;
    variant?: IconButtonVariant;
    /** Colour combined with the variant, like Button `color` (e.g. a danger text button) */
    color?: ButtonColor;
    /** `xs` is 24px – the minimum target size (WCAG 2.5.8) */
    size?: ButtonSize;
    /** Corner shape: `pill` (round, default), `rounded` or `square` */
    shape?: ButtonShape;
    /** Counter (number > 0) or dot (true) in the top-right corner */
    badge?: number | boolean;
    /**
     * Appended to the accessible name while a badge is shown, e.g. "Notifications, 4 new".
     * Receives the visible counter text ("4", "99+") or null for the dot – the visible text must stay
     * part of the name (WCAG 2.5.3).
     */
    badgeLabel?: (count: string | null) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof iconButtonRecipe>;
}

/** Button with only an icon; the label is its accessible name, optionally with a counter badge */
export function IconButton({
    classes,
    icon: Icon,
    iconProps,
    label,
    variant,
    color,
    size,
    shape,
    disabled = false,
    type = 'button',
    badge = false,
    badgeLabel = (value) => (value === null ? 'new' : `${value} new`),
    className,
    ...props
}: IconButtonProps) {
    const iconButton = useRecipe('iconButton', iconButtonRecipe, classes);
    const styles = iconButton({ variant, color: buttonColorKey(color), size, shape });
    const count = typeof badge === 'number' && badge > 0 ? badge : 0;
    const accessibleName = count
        ? `${label}, ${badgeLabel(formatCount(count))}`
        : badge === true
          ? `${label}, ${badgeLabel(null)}`
          : label;

    return (
        <button
            {...props}
            className={styles.base({ class: className })}
            type={type}
            disabled={disabled}
            aria-label={accessibleName}
        >
            <Icon {...iconProps} className={styles.icon()} aria-hidden="true" />
            {count ? (
                <span className={styles.badge()} aria-hidden="true">
                    {formatCount(count)}
                </span>
            ) : (
                badge === true && <span className={styles.dot()} aria-hidden="true" />
            )}
        </button>
    );
}
