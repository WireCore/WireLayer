import { createContext, useContext } from 'react';

/** State of a Field that Ark's field context does not carry: the success state, whether it has a label */
export interface FieldStatus {
    success: boolean;
    /** The Field shows a label – groups (RadioGroup, SegmentedControl, ChipGroup) take it as their name */
    labelled: boolean;
}

export const FieldStatusContext = createContext<FieldStatus>({ success: false, labelled: false });

/** The success state of the surrounding Field (false without one) */
export const useFieldStatus = () => useContext(FieldStatusContext);
