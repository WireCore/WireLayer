import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox';
import { checkbox as checkboxRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Check, Minus } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export type CheckedState = boolean | 'indeterminate';

export interface CheckboxProps extends Omit<ComponentProps<'input'>, 'checked' | 'defaultChecked' | 'value' | 'type'> {
    checked?: CheckedState;
    defaultChecked?: CheckedState;
    onCheckedChange?: (checked: CheckedState) => void;
    invalid?: boolean;
    value?: string;
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof checkboxRecipe>;
}

/** Checkbox with label (also indeterminate), works inside Field */
export function Checkbox({
    classes,
    checked,
    defaultChecked,
    onCheckedChange,
    disabled,
    invalid,
    required,
    name,
    value,
    className,
    style,
    children,
    ...props
}: CheckboxProps) {
    const checkbox = useRecipe('checkbox', checkboxRecipe, classes);
    const styles = checkbox();
    return (
        <ArkCheckbox.Root
            className={styles.base({ class: className })}
            style={style}
            checked={checked}
            defaultChecked={defaultChecked}
            onCheckedChange={(details) => onCheckedChange?.(details.checked)}
            disabled={disabled}
            invalid={invalid}
            required={required}
            name={name}
            value={value}
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
