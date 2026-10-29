import { Field, useFieldContext } from '@ark-ui/react/field';
import { nativeSelect as nativeSelectRecipe, type Size, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface NativeSelectOption<V extends string | number = string> {
    /** A string or a number – onValueChange gets it back with its type */
    value: V;
    label: string;
    disabled?: boolean;
}

/** `V`: the type of the values – a union like `'ssh' | 'sftp'` or numbers (default string) */
export interface NativeSelectProps<V extends string | number = string> extends Omit<
    ComponentProps<'select'>,
    'size' | 'onChange'
> {
    items: readonly NativeSelectOption<V>[];
    /** The chosen option's value with its type; the placeholder option gives an empty string */
    onValueChange?: (value: V | '') => void;
    /** First, empty option, e.g. "Please choose" */
    placeholder?: string;
    size?: Size;
    invalid?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof nativeSelectRecipe>;
}

/** The browser's select: its own keyboard and mobile pickers; inside a Field it is labelled and described */
export function NativeSelect<V extends string | number = string>({
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
}: NativeSelectProps<V>) {
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
                onChange={(event) => {
                    // The option's value with its type (a number stays a number); the placeholder gives ''
                    const text = event.target.value;
                    onValueChange?.(items.find((item) => String(item.value) === text)?.value ?? (text as V | ''));
                }}
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
