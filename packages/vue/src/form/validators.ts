import { createValidators, type Validators } from '@wirecore/wirelayer-recipes';
import { useLocale } from '../locale.js';

/**
 * The validators with the texts and number format of the nearest LocaleProvider: `const v = useValidators()`, then
 * `validators: { onChange: v.combine(v.isRequired(), v.isEmail()) }`. Each validator is a Standard Schema, so
 * TanStack Form takes it directly.
 */
export function useValidators(): Validators {
    const locale = useLocale();
    return createValidators(locale.value.translations.validation, locale.value.locale);
}

/** The parts of a TanStack form validateFields uses (methods, so every form's own field names fit) */
interface FormLike {
    validateField(name: never, cause: never): unknown;
    getFieldMeta(name: never): { errors?: unknown[] } | undefined;
    setFieldMeta(name: never, updater: never): void;
}

/**
 * Validates some fields of a TanStack form (e.g. one Wizard step) and marks them touched, so their errors show.
 * Resolves with true when none has an error.
 */
export async function validateFields(form: FormLike, names: string[]): Promise<boolean> {
    await Promise.all(names.map((name) => form.validateField(name as never, 'change' as never)));
    for (const name of names)
        form.setFieldMeta(name as never, ((meta: Record<string, unknown>) => ({ ...meta, isTouched: true })) as never);
    return names.every((name) => !form.getFieldMeta(name as never)?.errors?.some(Boolean));
}
