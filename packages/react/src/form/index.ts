// TanStack Form bindings – requires @tanstack/react-form (optional peer dependency)
export { bindCheckbox, bindInput, bindValue } from './bind.js';
export { firstError } from './errors.js';
export { useFormErrors, type FormErrorsOptions } from './errors-summary.js';
export { FormField, type FormFieldProps } from './FormField.js';
export { FormList, FormList as FieldArray, type FormListItemProps, type FormListProps } from './FormList.js';
export { KeyValueEditor, type KeyValueEditorProps, type KeyValuePair } from './KeyValueEditor.js';
export { useValidators, validateFields } from './validators.js';
export { useUnsavedChanges, type UnsavedChangesOptions } from './unsaved.js';
/** One question before leaving a page with unsaved input – the guard goes into the router */
export { confirmLeave, unsavedChangesGuard, type UnsavedChangesRoute } from '@wirecore/wirelayer-recipes';
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
