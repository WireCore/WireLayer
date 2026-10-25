import type { AnyFieldApi } from '@tanstack/react-form';
import type { ChangeEvent } from 'react';
import type { CheckedState } from '../components/Checkbox/Checkbox.js';

/**
 * Props for the text fields with a change event: Input, Textarea and PasswordInput – `<Input {...bindInput(field)} />`.
 * SearchField, MaskInput, PhoneInput, ColorInput, JsonInput, PinInput, Mentions and Autocomplete report their text with
 * `onValueChange`: use bindValue
 */
export const bindInput = (field: AnyFieldApi) => ({
    name: field.name,
    value: (field.state.value as string) ?? '',
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => field.handleChange(event.target.value),
    onBlur: field.handleBlur,
});

/** Props for Checkbox and Switch */
export const bindCheckbox = (field: AnyFieldApi) => ({
    name: field.name,
    checked: field.state.value as boolean,
    onCheckedChange: (checked: CheckedState) => field.handleChange(checked === true),
    onBlur: field.handleBlur,
});

/** Props for Select, RadioGroup, ChipGroup, SegmentedControl and the other components with `value`/`onValueChange` */
export const bindValue = (field: AnyFieldApi) => ({
    name: field.name,
    value: field.state.value,
    onValueChange: (value: unknown) => field.handleChange(value),
    onBlur: field.handleBlur,
});
