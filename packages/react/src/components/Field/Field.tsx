import { Field as ArkField } from '@ark-ui/react/field';
import { field as fieldRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { CircleCheck } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { FieldStatusContext } from './context.js';
import { Toggletip } from '../Toggletip/Toggletip.js';

export interface FieldProps extends ComponentProps<'div'> {
    label?: ReactNode;
    helperText?: ReactNode;
    /** Error message – also marks the field as invalid */
    error?: ReactNode;
    invalid?: boolean;
    /**
     * Confirmation, e.g. "Username is available": shown with a check icon, part of the description; the control gets
     * a green border. Ignored while the field is invalid
     */
    success?: ReactNode;
    required?: boolean;
    /** Marks the field as optional: "(optional)" after the label */
    optional?: boolean;
    /** Text after the label of an optional field (default "optional") */
    optionalText?: string;
    disabled?: boolean;
    readOnly?: boolean;
    /**
     * Explanation behind an (i) button next to the label (Toggletip: a click shows it and screen readers read it)
     */
    labelHelp?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof fieldRecipe>;
}

/** Label, helper text and error for one input – connects them by ids (aria-describedby, aria-invalid) */
export function Field({
    classes,
    label,
    helperText,
    error,
    invalid = false,
    success,
    required = false,
    optional = false,
    optionalText,
    disabled = false,
    readOnly = false,
    labelHelp,
    className,
    children,
    ...props
}: FieldProps) {
    const field = useRecipe('field', fieldRecipe, classes);
    const translations = useTranslations();
    const styles = field();
    const isInvalid = invalid || !!error;
    const showSuccess = !!success && !isInvalid;
    const fieldLabel = (
        <ArkField.Label className={styles.label()}>
            {label}
            <ArkField.RequiredIndicator className={styles.requiredIndicator()} />
            {optional && !required && (
                <span
                    className={styles.optionalIndicator()}
                >{` (${optionalText ?? translations.field.optional})`}</span>
            )}
        </ArkField.Label>
    );
    return (
        <FieldStatusContext.Provider value={{ success: showSuccess, labelled: !!label }}>
            <ArkField.Root
                {...props}
                className={styles.base({ class: className })}
                invalid={isInvalid}
                required={required}
                disabled={disabled}
                readOnly={readOnly}
            >
                {label && labelHelp ? (
                    // With labelHelp: the label and the (i) button in a row
                    <div className={styles.labelRow()}>
                        {fieldLabel}
                        <Toggletip label={typeof label === 'string' ? label : undefined}>{labelHelp}</Toggletip>
                    </div>
                ) : (
                    label && fieldLabel
                )}
                {children}
                {/* The success text joins the helper text, so every control is described by it */}
                {(helperText || showSuccess) && (
                    <ArkField.HelperText className={styles.helperText()}>
                        {helperText}
                        {showSuccess && (
                            <span className={styles.successText()}>
                                <CircleCheck className={styles.successIcon()} aria-hidden="true" />
                                {success}
                            </span>
                        )}
                    </ArkField.HelperText>
                )}
                {error && <ArkField.ErrorText className={styles.errorText()}>{error}</ArkField.ErrorText>}
            </ArkField.Root>
        </FieldStatusContext.Provider>
    );
}
