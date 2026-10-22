import { createContext, useContext } from 'react';

/** State of a Field that Ark's field context does not carry: the success state */
export interface FieldStatus {
    success: boolean;
}

export const FieldStatusContext = createContext<FieldStatus>({ success: false });

/** The success state of the surrounding Field (false without one) */
export const useFieldStatus = () => useContext(FieldStatusContext);
