import { checkboxGroup as checkboxGroupRecipe, visuallyHidden, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { SwitchGroupContext } from './context.js';

export interface SwitchGroupProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
    /** Values of the switches that are on (controlled) */
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** Visible label of the group (names it); otherwise pass aria-label */
    label?: string;
    helperText?: ReactNode;
    /** Error message – also marks the group and its switches invalid */
    error?: ReactNode;
    invalid?: boolean;
    /** Shows the required mark after the label */
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /** Name of the inputs for form submission */
    name?: string;
    /** At most this many can be on – the others are disabled until one is switched off (announced) */
    max?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof checkboxGroupRecipe>;
}

/** role="group" named by its label, described by helper and error text; Switches with a value inside */
export function SwitchGroup({
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
    className,
    children,
    ...props
}: SwitchGroupProps) {
    const checkboxGroup = useRecipe('checkboxGroup', checkboxGroupRecipe, classes);
    const translations = useTranslations();
    const id = useId();
    const [internal, setInternal] = useState(defaultValue ?? []);
    const current = value ?? internal;
    const isInvalid = invalid || !!error || undefined;
    const atMax = max !== undefined && current.length >= max;
    const styles = checkboxGroup({ orientation: 'vertical' });
    const describedBy = [helperText && `${id}help`, error && `${id}error`].filter(Boolean).join(' ') || undefined;
    const setChecked = (item: string, checked: boolean) => {
        if (readOnly || disabled) return;
        if (checked && atMax && !current.includes(item)) return;
        const rest = current.filter((entry) => entry !== item);
        const next = checked ? [...rest, item] : rest;
        setInternal(next);
        onValueChange?.(next);
    };
    return (
        <SwitchGroupContext
            value={{
                isChecked: (item) => current.includes(item),
                setChecked,
                disabled,
                invalid: isInvalid,
                readOnly,
                name,
                blocked: (item) => atMax && !current.includes(item),
            }}
        >
            <div
                {...props}
                className={styles.base({ class: className })}
                role="group"
                aria-labelledby={label ? `${id}label` : undefined}
                aria-describedby={describedBy}
                data-invalid={isInvalid ? '' : undefined}
                data-disabled={disabled ? '' : undefined}
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
                <div className={styles.items()}>{children}</div>
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
            </div>
        </SwitchGroupContext>
    );
}
