import { createContext } from 'react';

/** What a Switch with a `value` reads from the surrounding SwitchGroup */
export interface SwitchGroupState {
    isChecked: (value: string) => boolean;
    setChecked: (value: string, checked: boolean) => void;
    disabled?: boolean;
    invalid?: boolean;
    readOnly?: boolean;
    name?: string;
    /** Values that cannot be switched on any more (max reached) */
    blocked: (value: string) => boolean;
}

export const SwitchGroupContext = createContext<SwitchGroupState | null>(null);
