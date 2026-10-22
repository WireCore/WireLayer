import { ChoiceGroup, type CheckboxGroupProps } from '../CheckboxGroup/CheckboxGroup.js';

export interface SwitchGroupProps extends Omit<CheckboxGroupProps, 'columns'> {
    /** Values of the switches that are on (controlled) */
    value?: string[];
}

/** A named group (role "group") of switches with a `value` each; helper and error text describe it */
export function SwitchGroup(props: SwitchGroupProps) {
    return <ChoiceGroup {...props} />;
}
