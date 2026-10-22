import type { AnyFieldApi } from '@tanstack/react-form';
import type { CheckedState } from '../components/Checkbox/Checkbox.js';

/** Props for Input, Textarea, PasswordInput, MaskInput …: `<Input {...bindInput(field)} />` */
export const bindInput = (field: AnyFieldApi) => ({
    value: (field.state.value as string) ?? '',
    onChangeText: (text: string) => field.handleChange(text),
    onBlur: field.handleBlur,
});

/** Props for Checkbox and Switch */
export const bindCheckbox = (field: AnyFieldApi) => ({
    checked: field.state.value as boolean,
    onCheckedChange: (checked: CheckedState) => {
        field.handleChange(checked === true);
        field.handleBlur();
    },
    onBlur: field.handleBlur,
});

/**
 * Props for Select, MultiSelect, RadioGroup, ChipGroup, SegmentedControl, DatePicker, NumberInput … – a choice in a
 * sheet has no blur, so choosing marks the field touched as well
 */
export const bindValue = (field: AnyFieldApi) => ({
    value: field.state.value,
    onValueChange: (value: unknown) => {
        field.handleChange(value);
        field.handleBlur();
    },
});
