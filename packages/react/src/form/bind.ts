import type { AnyFieldApi } from '@tanstack/react-form';
import type { ChangeEvent } from 'react';
import type { CheckedState } from '../components/Checkbox/Checkbox.js';

/** Props for Input and Textarea: `<Input {...bindInput(field)} />` */
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

/** Props for Select, RadioGroup, ChipGroup and SegmentedControl */
export const bindValue = (field: AnyFieldApi) => ({
    name: field.name,
    value: field.state.value,
    onValueChange: (value: unknown) => field.handleChange(value),
    onBlur: field.handleBlur,
});
