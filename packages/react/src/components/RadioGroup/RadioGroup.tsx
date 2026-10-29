import { useFieldContext } from '@ark-ui/react/field';
import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group';
import {
    radioGroup as radioGroupRecipe,
    type RadioGroupOrientation,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useState, type ComponentProps, type CSSProperties } from 'react';
import { RadioGroupValuesContext } from './context.js';
import { useFieldStatus } from '../Field/context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useLabelForWarning } from '../../utils/label-for.js';

/**
 * `V`: the type of the values – a union like `'ssh' | 'sftp'` or numbers (default string); `R`: whether `required` is
 * set (then onValueChange only gets values, never null)
 */
export interface RadioGroupProps<V extends string | number = string, R extends boolean = false> extends Omit<
    ComponentProps<'div'>,
    'defaultValue' | 'dir'
> {
    /** Selected value; numbers when the items have number values */
    value?: V | null;
    defaultValue?: V | null;
    onValueChange?: (value: R extends true ? V : V | null) => void;
    /** Visible group label (otherwise pass aria-label – or place the group in a Field with a label) */
    label?: string;
    orientation?: RadioGroupOrientation;
    /** Cards in a grid with this many columns (one column on small screens) – for RadioCard */
    columns?: number;
    disabled?: boolean;
    invalid?: boolean;
    /**
     * A choice is required (aria-required). onValueChange then only gets values (typed `V`, not `V | null`): a form
     * reset back to an empty start is not passed on
     */
    required?: R;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radioGroupRecipe>;
}

/** One choice out of several (role="radiogroup", arrow keys), horizontal or vertical */
export function RadioGroup<V extends string | number = string, R extends boolean = false>({
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
}: RadioGroupProps<V, R>) {
    useLabelForWarning('RadioGroup', props.id);
    const radioGroup = useRecipe('radioGroup', radioGroupRecipe, classes);
    const styles = radioGroup({ orientation, grid: columns !== undefined });
    // Inside a Field: its label names the group (unless it has a name of its own), its texts describe it
    const field = useFieldContext();
    const fieldStatus = useFieldStatus();
    const fieldLabelled =
        !label && !props['aria-label'] && !props['aria-labelledby'] && !!field && fieldStatus.labelled;
    // Ark works with strings: number values go in as text and come back as the item's value
    const [values] = useState(() => new Map<string, string | number>());
    const toText = (current: V | null | undefined) => (current == null ? current : String(current));

    return (
        <RadioGroupValuesContext value={values}>
            <ArkRadioGroup.Root
                aria-describedby={field?.ariaDescribedby}
                {...props}
                className={styles.base({ class: className })}
                {...(fieldLabelled ? { ids: { label: field.ids.label } } : {})}
                value={toText(value)}
                defaultValue={toText(defaultValue)}
                onValueChange={(details) => {
                    // A required group never reports an empty value (Ark does on a form reset to an empty start:
                    // null or undefined)
                    if (details.value == null && required) return;
                    onValueChange?.(
                        (details.value === null ? null : (values.get(details.value) ?? details.value)) as R extends true
                            ? V
                            : V | null
                    );
                }}
                orientation={orientation}
                disabled={disabled ?? field?.disabled}
                invalid={invalid ?? field?.invalid}
                required={required ?? field?.required}
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
        </RadioGroupValuesContext>
    );
}
