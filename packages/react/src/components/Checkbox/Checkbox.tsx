import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox';
import { useFieldContext } from '@ark-ui/react/field';
import { controlIds, checkbox as checkboxRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Check, Minus } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export type CheckedState = boolean | 'indeterminate';

/**
 * `C`: the state type – inferred from `checked`/`defaultChecked`, so a boolean `checked` gets booleans back in
 * onCheckedChange (the indeterminate state only comes from `checked`)
 */
export interface CheckboxProps<C extends CheckedState = CheckedState> extends Omit<
    ComponentProps<'input'>,
    'checked' | 'defaultChecked' | 'value' | 'type'
> {
    checked?: C;
    defaultChecked?: C;
    onCheckedChange?: (checked: C) => void;
    invalid?: boolean;
    value?: string;
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof checkboxRecipe>;
}

/** Checkbox with label (also indeterminate), works inside Field */
export function Checkbox<C extends CheckedState = CheckedState>({
    classes,
    checked,
    defaultChecked,
    onCheckedChange,
    disabled,
    invalid,
    required,
    name,
    value,
    id,
    className,
    style,
    children,
    ...props
}: CheckboxProps<C>) {
    const checkbox = useRecipe('checkbox', checkboxRecipe, classes);
    const styles = checkbox();
    // An own id goes to the hidden input through Ark (it finds the input by its id)
    const field = useFieldContext();
    return (
        <ArkCheckbox.Root
            className={styles.base({ class: className })}
            style={style}
            checked={checked}
            defaultChecked={defaultChecked}
            onCheckedChange={(details) => onCheckedChange?.(details.checked as C)}
            disabled={disabled}
            invalid={invalid}
            required={required}
            name={name}
            value={value}
            {...controlIds(id, 'hiddenInput', { label: field?.ids.label, hiddenInput: field?.ids.control })}
        >
            <ArkCheckbox.Control className={styles.control()}>
                <ArkCheckbox.Indicator>
                    <Check className={styles.icon()} aria-hidden="true" />
                </ArkCheckbox.Indicator>
                <ArkCheckbox.Indicator indeterminate>
                    <Minus className={styles.icon()} aria-hidden="true" />
                </ArkCheckbox.Indicator>
            </ArkCheckbox.Control>
            {children && <ArkCheckbox.Label className={styles.label()}>{children}</ArkCheckbox.Label>}
            <ArkCheckbox.HiddenInput {...props} />
        </ArkCheckbox.Root>
    );
}
