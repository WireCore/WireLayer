import { ToggleGroup } from '@ark-ui/react/toggle-group';
import { chipGroup as chipGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { ChipGroupContext } from './context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ChipGroupProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'dir'> {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** Allow several selected chips (default) or only one */
    multiple?: boolean;
    /** Accessible name of the group */
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
    return (
        <ChipGroupContext.Provider value={true}>
            <ToggleGroup.Root
                {...props}
                className={styles.base({ class: className })}
                value={value}
                defaultValue={defaultValue}
                onValueChange={(details) => onValueChange?.(details.value)}
                multiple={multiple}
                disabled={disabled}
                aria-label={label}
            />
        </ChipGroupContext.Provider>
    );
}
