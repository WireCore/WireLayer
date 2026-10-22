import { useStore, type AnyFieldApi } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { Field } from '../components/Field/Field.js';
import { firstError } from './errors.js';

export interface FormFieldProps {
    /** The TanStack Form field (from `<form.Field children={(field) => …}>`) */
    field: AnyFieldApi;
    /** Id of the control – e.g. the field name, so FormErrorSummary (useFormErrors) can link to it */
    id?: string;
    label?: ReactNode;
    helperText?: ReactNode;
    /** Confirmation below the control (Field `success`) */
    success?: ReactNode;
    required?: boolean;
    /** "(optional)" after the label */
    optional?: boolean;
    disabled?: boolean;
    children?: ReactNode;
}

/** Label, helper text, error, aria-invalid and aria-describedby come from Field */
export function FormField({
    field,
    id,
    label,
    helperText,
    success,
    required,
    optional,
    disabled,
    children,
}: FormFieldProps) {
    const meta = useStore(field.store, (state) => state.meta);
    // Errors appear once the field was left (or the form submitted, which touches every field)
    const error = meta.isTouched ? firstError(meta.errors) : undefined;

    return (
        <Field
            id={id}
            label={label}
            helperText={helperText}
            success={success}
            error={error}
            required={required}
            optional={optional}
            disabled={disabled}
        >
            {children}
        </Field>
    );
}
