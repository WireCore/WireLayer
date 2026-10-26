import { useFieldContext } from '@ark-ui/react/field';
import { ToggleGroup } from '@ark-ui/react/toggle-group';
import { chipGroup as chipGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { ChipGroupContext } from './context.js';
import { useFieldStatus } from '../Field/context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ChipGroupProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'dir'> {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** Allow several selected chips (default) or only one */
    multiple?: boolean;
    /** Accessible name of the group – inside a Field with a label, the Field's label names it */
    label?: string;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chipGroupRecipe>;
}

/** Filter chips: one or several options as toggle buttons */
export function ChipGroup({
    classes,
    value,
    defaultValue,
    onValueChange,
    multiple = true,
    label,
    disabled,
    className,
    ...props
}: ChipGroupProps) {
    const chipGroup = useRecipe('chipGroup', chipGroupRecipe, classes);
    const styles = chipGroup();
    // Inside a Field: its label names the group (unless it has a name of its own), its texts describe it
    const field = useFieldContext();
    const fieldStatus = useFieldStatus();
    const fieldLabelled =
        !label && !props['aria-label'] && !props['aria-labelledby'] && !!field && fieldStatus.labelled;
    return (
        <ChipGroupContext.Provider value={true}>
            <ToggleGroup.Root
                aria-labelledby={fieldLabelled ? field.ids.label : undefined}
                aria-describedby={field?.ariaDescribedby}
                {...props}
                className={styles.base({ class: className })}
                value={value}
                defaultValue={defaultValue}
                onValueChange={(details) => onValueChange?.(details.value)}
                multiple={multiple}
                disabled={disabled ?? field?.disabled}
                aria-label={label}
            />
        </ChipGroupContext.Provider>
    );
}
