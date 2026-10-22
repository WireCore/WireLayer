import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group';
import {
    radioGroup as radioGroupRecipe,
    type RadioGroupOrientation,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import type { ComponentProps, CSSProperties } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface RadioGroupProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'dir'> {
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    /** Visible group label (otherwise pass aria-label) */
    label?: string;
    orientation?: RadioGroupOrientation;
    /** Cards in a grid with this many columns (one column on small screens) – for RadioCard */
    columns?: number;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radioGroupRecipe>;
}

/** One choice out of several (role="radiogroup", arrow keys), horizontal or vertical */
export function RadioGroup({
    classes,
    value,
    defaultValue,
    onValueChange,
    label,
    orientation = 'horizontal',
    columns,
    disabled,
    invalid,
    required,
    name,
    className,
    children,
    ...props
}: RadioGroupProps) {
    const radioGroup = useRecipe('radioGroup', radioGroupRecipe, classes);
    const styles = radioGroup({ orientation, grid: columns !== undefined });

    return (
        <ArkRadioGroup.Root
            {...props}
            className={styles.base({ class: className })}
            value={value}
            defaultValue={defaultValue}
            onValueChange={(details) => onValueChange?.(details.value)}
            orientation={orientation}
            disabled={disabled}
            invalid={invalid}
            required={required}
            name={name}
        >
            {label && <ArkRadioGroup.Label className={styles.label()}>{label}</ArkRadioGroup.Label>}
            <div
                className={styles.items()}
                style={columns ? ({ '--wc-columns': String(columns) } as CSSProperties) : undefined}
            >
                {children}
            </div>
        </ArkRadioGroup.Root>
    );
}
