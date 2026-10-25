import type { AnyFieldApi } from '@tanstack/vue-form';
import type { CheckedState } from '../components/Checkbox/Checkbox.vue';

/**
 * v-bind for the components with a string v-model: Input, Textarea, PasswordInput, SearchField, MaskInput, PhoneInput,
 * ColorInput, JsonInput, PinInput, Mentions and Autocomplete – `<Input v-bind="bindInput(field)" />`
 */
export const bindInput = (field: AnyFieldApi) => ({
    name: field.name,
    modelValue: (field.state.value as string | undefined) ?? '',
    // Input and Textarea emit string | undefined (defineModel) – the field keeps a string, like in React
    'onUpdate:modelValue': (value: string | undefined) => field.handleChange(value ?? ''),
    onBlur: field.handleBlur,
});

/** v-bind for Checkbox and Switch */
export const bindCheckbox = (field: AnyFieldApi) => ({
    name: field.name,
    checked: field.state.value as boolean,
    'onUpdate:checked': (checked: CheckedState) => field.handleChange(checked === true),
    onBlur: field.handleBlur,
});

/** v-bind for Select, RadioGroup, ChipGroup and SegmentedControl */
export const bindValue = (field: AnyFieldApi) => ({
    name: field.name,
    modelValue: field.state.value,
    'onUpdate:modelValue': (value: unknown) => field.handleChange(value),
    onBlur: field.handleBlur,
});
