import { useStore, type AnyFormApi } from '@tanstack/react-form';
import type { FormErrorSummaryItem } from '../components/FormErrorSummary/FormErrorSummary.js';
import { firstError } from './errors.js';

export interface FormErrorsOptions {
    /** Id of each field's control (default: the field name – give FormField `id` the same name) */
    ids?: Record<string, string> | ((name: string) => string);
}

/**
 * The errors of a TanStack form for FormErrorSummary: one entry per touched field with an error, linked to the
 * field; `attempts` (submit attempts) refocuses the summary on every submit:
 * `<FormErrorSummary errors={summary.errors} focusKey={summary.attempts} />`
 */
export function useFormErrors(
    form: AnyFormApi,
    options: FormErrorsOptions = {}
): { errors: FormErrorSummaryItem[]; attempts: number } {
    const fieldMeta = useStore(form.store, (state) => state.fieldMeta) as Record<
        string,
        { isTouched?: boolean; errors?: unknown[] } | undefined
    >;
    const attempts = useStore(form.store, (state) => state.submissionAttempts);
    const idOf = (name: string) =>
        typeof options.ids === 'function' ? options.ids(name) : (options.ids?.[name] ?? name);
    const errors = Object.entries(fieldMeta)
        .map(([name, meta]) => ({ id: idOf(name), message: (meta?.isTouched && firstError(meta.errors ?? [])) || '' }))
        .filter((item) => !!item.message);
    return { errors, attempts };
}
