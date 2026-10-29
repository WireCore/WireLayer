import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group';
import { radioGroup as radioGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useContext, useEffect, type ComponentProps } from 'react';
import { RadioGroupValuesContext } from './context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface RadioGroupItemProps extends ComponentProps<'label'> {
    /** Value of the option – a number makes the group's value a number */
    value: string | number;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radioGroupRecipe>;
}

/** One option of a RadioGroup */
export function RadioGroupItem({ classes, value, disabled, className, children, ...props }: RadioGroupItemProps) {
    const radioGroup = useRecipe('radioGroup', radioGroupRecipe, classes);
    const styles = radioGroup();
    // Tells the group the value behind its text (a number stays a number)
    const values = useContext(RadioGroupValuesContext);
    useEffect(() => {
        values?.set(String(value), value);
        return () => {
            if (values?.get(String(value)) === value) values.delete(String(value));
        };
    }, [values, value]);
    return (
        <ArkRadioGroup.Item
            {...props}
            className={styles.item({ class: className })}
            value={String(value)}
            disabled={disabled}
        >
            <ArkRadioGroup.ItemControl className={styles.control()} />
            <ArkRadioGroup.ItemText>{children}</ArkRadioGroup.ItemText>
            <ArkRadioGroup.ItemHiddenInput />
        </ArkRadioGroup.Item>
    );
}
