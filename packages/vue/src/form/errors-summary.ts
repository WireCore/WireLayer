import { useStore, type AnyFormApi } from '@tanstack/vue-form';
import { computed, type ComputedRef } from 'vue';
import type { FormErrorSummaryItem } from '../components/FormErrorSummary/FormErrorSummary.vue';
import { firstError } from './errors.js';

export interface FormErrorsOptions {
    /** Id of each field's control (default: the field name – give FormField `id` the same name) */
    ids?: Record<string, string> | ((name: string) => string);
}

/**
 * The errors of a TanStack form for FormErrorSummary: one entry per touched field with an error, linked to the
 * field; `attempts` (submit attempts) refocuses the summary on every submit:
 * `<FormErrorSummary :errors="summary.errors.value" :focus-key="summary.attempts.value" />`
 */
export function useFormErrors(
    form: AnyFormApi,
    options: FormErrorsOptions = {}
): { errors: ComputedRef<FormErrorSummaryItem[]>; attempts: ComputedRef<number> } {
    const fieldMeta = useStore(form.store, (state) => state.fieldMeta);
    const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
    const idOf = (name: string) =>
        typeof options.ids === 'function' ? options.ids(name) : (options.ids?.[name] ?? name);
    const errors = computed(() =>
        Object.entries(fieldMeta.value as Record<string, { isTouched?: boolean; errors?: unknown[] } | undefined>)
            .map(([name, meta]) => ({
                id: idOf(name),
                message: (meta?.isTouched && firstError(meta.errors ?? [])) || '',
            }))
            .filter((item) => !!item.message)
    );
    return { errors, attempts: computed(() => submissionAttempts.value) };
}
