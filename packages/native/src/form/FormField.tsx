import { useStore, type AnyFieldApi } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { Field } from '../components/Field/Field.js';
import { firstError } from './errors.js';

export interface FormFieldProps {
    /** The TanStack Form field (from `<form.Field children={(field) => …}>`) */
    field: AnyFieldApi;
    /** Id of the control – e.g. the field name, so FormErrorSummary (useFormErrors) can lead to it */
    id?: string;
    label?: string;
    helperText?: string;
    /** Confirmation below the control (Field `success`) */
    success?: string;
    required?: boolean;
    /** "(optional)" after the label */
    optional?: boolean;
    /** Explanation behind an (i) button next to the label */
    labelHelp?: string;
    disabled?: boolean;
    children?: ReactNode;
}

/** Label, helper text, error and the invalid state of the control come from Field; errors show once the field was left (or the form submitted) */
export function FormField({
    field,
    id,
    label,
    helperText,
    success,
    required,
    optional,
    labelHelp,
    disabled,
    children,
}: FormFieldProps) {
    const meta = useStore(field.store, (state) => state.meta);
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
            labelHelp={labelHelp}
            disabled={disabled}
        >
            {children}
        </Field>
    );
}
