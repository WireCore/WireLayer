import { divider as dividerRecipe, type DividerOrientation, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps, ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface DividerProps extends ComponentProps<'div'> {
    orientation?: DividerOrientation;
    /** Line style: `solid` (default), `dashed` or `dotted` */
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    /** Where the label sits: at the `start`, in the `center` (default) or at the `end` */
    labelPosition?: 'start' | 'center' | 'end';
    /** Text in the middle, e.g. "or" – read as normal text, the lines are decorative */
    label?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dividerRecipe>;
}

/** Horizontal or vertical line, optionally with a label */
export function Divider({
    classes,
    orientation = 'horizontal',
    lineStyle,
    labelPosition,
    label,
    className,
    ...props
}: DividerProps) {
    const divider = useRecipe('divider', dividerRecipe, classes);
    const styles = divider({ orientation, plain: !label, lineStyle, labelPosition });

    if (!label) {
        return (
            <div
                role="separator"
                aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
                {...props}
                className={styles.base({ class: className })}
            />
        );
    }
    return (
        <div {...props} className={styles.base({ class: className })}>
            <span className={styles.line()} aria-hidden="true" />
            <span className={styles.label()}>{label}</span>
            <span className={styles.line()} aria-hidden="true" />
        </div>
    );
}
