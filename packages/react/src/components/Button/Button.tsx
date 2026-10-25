import { ark } from '@ark-ui/react/factory';
import {
    button as buttonRecipe,
    buttonColorKey,
    formatCount,
    spinner as spinnerRecipe,
    type ButtonColor,
    type ButtonShape,
    type ButtonSize,
    type ButtonVariant,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'color'> {
    variant?: ButtonVariant;
    /**
     * Colour combined with the variant: with `outline`, `text`, `soft` and `link` it colours that style (e.g. a
     * danger text button), with a filled variant it replaces the fill
     */
    color?: ButtonColor;
    size?: ButtonSize;
    /** Corner shape: `pill` (default), `rounded` or `square` */
    shape?: ButtonShape;
    /** Full width of the container */
    block?: boolean;
    /** Icon component rendered before the label */
    leadingIcon?: IconComponent;
    /** Icon component rendered after the label */
    trailingIcon?: IconComponent;
    /**
     * Props passed on to the leading and trailing icon, e.g. { fill: 'currentColor' } for a filled icon or
     * { strokeWidth: 1.5 }
     */
    iconProps?: Record<string, unknown>;
    /** Shows a spinner and ignores clicks; stays focusable (aria-disabled + aria-busy) so focus is not lost */
    loading?: boolean;
    /** Counter (number > 0) or dot (true) after the label */
    badge?: number | boolean;
    /**
     * Added to the accessible name while a badge is shown, e.g. "Notifications 4 new". Receives the visible counter
     * text ("4", "99+") or null for the dot
     */
    badgeLabel?: (count: string | null) => string;
    /** Render the child element (e.g. a link) with button styles instead of a <button> */
    asChild?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof buttonRecipe>;
}

/** Button in the variants of the design, with leading/trailing icon; loading keeps the focus (aria-busy) */
export function Button({
    classes,
    variant,
    color,
    size,
    shape,
    block,
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    iconProps,
    loading = false,
    disabled = false,
    type = 'button',
    badge = false,
    badgeLabel = (value) => (value === null ? 'new' : `${value} new`),
    asChild = false,
    className,
    children,
    onClick,
    ...props
}: ButtonProps) {
    const button = useRecipe('button', buttonRecipe, classes);
    const spinner = useRecipe('spinner', spinnerRecipe);
    const styles = button({ variant, color: buttonColorKey(color), size, shape, block });
    const count = typeof badge === 'number' && badge > 0 ? badge : 0;

    return (
        <ark.button
            {...props}
            className={styles.base({ class: className })}
            asChild={asChild}
            type={asChild ? undefined : type}
            disabled={asChild ? undefined : disabled}
            aria-disabled={loading || undefined}
            aria-busy={loading || undefined}
            onClick={(event) => {
                if (loading) {
                    event.preventDefault();
                    return;
                }
                onClick?.(event);
            }}
        >
            {asChild ? (
                children
            ) : (
                <>
                    {loading ? (
                        <LoaderCircle className={spinner().icon({ class: styles.icon() })} aria-hidden="true" />
                    ) : (
                        LeadingIcon && <LeadingIcon {...iconProps} className={styles.icon()} aria-hidden="true" />
                    )}
                    {children}
                    {TrailingIcon && <TrailingIcon {...iconProps} className={styles.icon()} aria-hidden="true" />}
                    {count ? (
                        <>
                            <span className={styles.badge()} aria-hidden="true">
                                {formatCount(count)}
                            </span>
                            <span className={styles.badgeLabel()}>{` ${badgeLabel(formatCount(count))}`}</span>
                        </>
                    ) : (
                        badge === true && (
                            <>
                                <span className={styles.dot()} aria-hidden="true" />
                                <span className={styles.badgeLabel()}>{` ${badgeLabel(null)}`}</span>
                            </>
                        )
                    )}
                </>
            )}
        </ark.button>
    );
}
