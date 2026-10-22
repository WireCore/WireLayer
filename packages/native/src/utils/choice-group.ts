import { createContext, useContext } from 'react';

/** CheckboxGroup and SwitchGroup: the checkboxes/switches with a `value` inside take their state from here */
export interface ChoiceGroupContextValue {
    value: string[];
    toggle: (value: string, checked: boolean) => void;
    /** The group is full (max) – unchecked entries are disabled */
    isBlocked: (value: string) => boolean;
    disabled: boolean;
    invalid: boolean;
    /** Width of a cell when the group shows cards in columns */
    columns?: number;
}

export const ChoiceGroupContext = createContext<ChoiceGroupContextValue | null>(null);

/** The state of one entry inside a group (null outside of one, or without `value`) */
export function useChoiceGroupItem(value: string | undefined) {
    const group = useContext(ChoiceGroupContext);
    if (!group || value === undefined) return null;
    const checked = group.value.includes(value);
    return {
        checked,
        set: (next: boolean) => group.toggle(value, next),
        disabled: group.disabled || (!checked && group.isBlocked(value)),
        invalid: group.invalid,
        columns: group.columns,
    };
}
