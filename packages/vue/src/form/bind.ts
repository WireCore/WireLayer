import type { AnyFieldApi } from '@tanstack/vue-form';
import type { CheckedState } from '../components/Checkbox/Checkbox.vue';

/** v-bind for Input and Textarea: `<Input v-bind="bindInput(field)" />` */
export const bindInput = (field: AnyFieldApi) => ({
    name: field.name,
    modelValue: field.state.value as string,
    'onUpdate:modelValue': (value: string) => field.handleChange(value),
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
