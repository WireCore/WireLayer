import { Field, useFieldContext } from '@ark-ui/react/field';
import { nativeSelect as nativeSelectRecipe, type Size, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface NativeSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface NativeSelectProps extends Omit<ComponentProps<'select'>, 'size' | 'onChange'> {
    items: NativeSelectOption[];
    onValueChange?: (value: string) => void;
    /** First, empty option, e.g. "Please choose" */
    placeholder?: string;
    size?: Size;
    invalid?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof nativeSelectRecipe>;
}

/** The browser's select: its own keyboard and mobile pickers; inside a Field it is labelled and described */
export function NativeSelect({
    classes,
    items,
    onValueChange,
    placeholder,
    size = 'md',
    invalid,
    disabled,
    className,
    style,
    ...props
}: NativeSelectProps) {
    const nativeSelect = useRecipe('nativeSelect', nativeSelectRecipe, classes);
    const field = useFieldContext();
    const styles = nativeSelect({ size });
    return (
        <div className={styles.base({ class: className })} style={style}>
            <Field.Select
                {...props}
                className={styles.select()}
                disabled={disabled ?? field?.disabled}
                aria-invalid={(invalid ?? field?.invalid) || undefined}
                onChange={(event) => onValueChange?.(event.target.value)}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {items.map((item) => (
                    <option key={item.value} value={item.value} disabled={item.disabled}>
                        {item.label}
                    </option>
                ))}
            </Field.Select>
            <ChevronDown className={styles.icon()} aria-hidden="true" />
        </div>
    );
}
