import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group';
import { radioGroup as radioGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface RadioGroupItemProps extends ComponentProps<'label'> {
    value: string;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radioGroupRecipe>;
}

/** One option of a RadioGroup */
export function RadioGroupItem({ classes, value, disabled, className, children, ...props }: RadioGroupItemProps) {
    const radioGroup = useRecipe('radioGroup', radioGroupRecipe, classes);
    const styles = radioGroup();
    return (
        <ArkRadioGroup.Item {...props} className={styles.item({ class: className })} value={value} disabled={disabled}>
            <ArkRadioGroup.ItemControl className={styles.control()} />
            <ArkRadioGroup.ItemText>{children}</ArkRadioGroup.ItemText>
            <ArkRadioGroup.ItemHiddenInput />
        </ArkRadioGroup.Item>
    );
}
