import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox';
import { checkboxGroup as checkboxGroupRecipe, visuallyHidden, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useId, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

interface GroupFrameProps {
    /** Visible label of the group (names it); otherwise pass aria-label */
    label?: string;
    helperText?: ReactNode;
    /** Error message – also marks the group and its controls invalid */
    error?: ReactNode;
    invalid?: boolean;
    /** Shows the required mark after the label */
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /** Name of the inputs for form submission */
    name?: string;
    children?: ReactNode;
}

export interface CheckboxGroupProps
    extends GroupFrameProps, Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'children'> {
    /** Values of the ticked checkboxes (controlled) */
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** At most this many can be ticked – the others are disabled until one is unticked (announced) */
    max?: number;
    /** vertical (default) or horizontal */
    orientation?: 'vertical' | 'horizontal';
    /** Cards in a grid with this many columns (one column on small screens) – for CheckboxCard */
    columns?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof checkboxGroupRecipe>;
}

/** role="group" named by its label, described by helper and error text; Checkbox/CheckboxCard inside */
export function CheckboxGroup({
    classes,
    value,
    defaultValue,
    onValueChange,
    label,
    helperText,
    error,
    invalid,
    required,
    disabled,
    readOnly,
    name,
    max,
    orientation = 'vertical',
    columns,
    className,
    children,
    ...props
}: CheckboxGroupProps) {
    const checkboxGroup = useRecipe('checkboxGroup', checkboxGroupRecipe, classes);
    const translations = useTranslations();
    const id = useId();
    const [internal, setInternal] = useState(defaultValue ?? []);
    const current = value ?? internal;
    const isInvalid = invalid || !!error || undefined;
    const atMax = max !== undefined && current.length >= max;
    const styles = checkboxGroup({ orientation, grid: columns !== undefined });
    const describedBy = [helperText && `${id}help`, error && `${id}error`].filter(Boolean).join(' ') || undefined;
    return (
        <ArkCheckbox.Group
            {...props}
            className={styles.base({ class: className })}
            value={value}
            defaultValue={defaultValue}
            onValueChange={(next) => {
                setInternal(next);
                onValueChange?.(next);
            }}
            disabled={disabled}
            invalid={isInvalid}
            readOnly={readOnly}
            name={name}
            maxSelectedValues={max}
            aria-labelledby={label ? `${id}label` : undefined}
            aria-describedby={describedBy}
        >
            {label && (
                <span id={`${id}label`} className={styles.label()}>
                    {label}
                    {required && (
                        <span className={styles.requiredIndicator()} aria-hidden="true">
                            *
                        </span>
                    )}
                </span>
            )}
            <div
                className={styles.items()}
                style={columns ? ({ '--wc-columns': String(columns) } as CSSProperties) : undefined}
            >
                {children}
            </div>
            {helperText && (
                <p id={`${id}help`} className={styles.helperText()}>
                    {helperText}
                </p>
            )}
            {error && (
                <p id={`${id}error`} className={styles.errorText()}>
                    {error}
                </p>
            )}
            {max !== undefined && (
                <span role="status" className={visuallyHidden()}>
                    {atMax ? translations.checkboxGroup.maxReached(max) : ''}
                </span>
            )}
        </ArkCheckbox.Group>
    );
}
