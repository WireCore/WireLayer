// TanStack Form bindings – requires @tanstack/vue-form (optional peer dependency)
export { bindCheckbox, bindInput, bindValue } from './bind.js';
export { firstError } from './errors.js';
export { useFormErrors, type FormErrorsOptions } from './errors-summary.js';
export { default as FormField, type FormFieldProps } from './FormField.vue';
export { default as FormList, default as FieldArray, type FormListProps } from './FormList.vue';
export { default as KeyValueEditor, type KeyValueEditorProps, type KeyValuePair } from './KeyValueEditor.vue';
export { useValidators, validateFields } from './validators.js';
/** Validators with translated messages – also Standard Schemas, so TanStack Form takes them directly */
export {
    combineValidators,
    createValidator,
    hasLength,
    isEmail,
    isIban,
    isInRange,
    isInteger,
    isPhone,
    isRequired,
    isUrl,
    matchesField,
    matchesPattern,
    type Validator,
    type ValidatorOptions,
} from '@wirecore/wirelayer-recipes';
