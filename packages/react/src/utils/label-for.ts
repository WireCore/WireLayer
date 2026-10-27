import { warnLabelFor } from '@wirecore/wirelayer-recipes';
import { useEffect } from 'react';

/** Development warning when a `<label for>` points at this control, which a label element cannot name */
export function useLabelForWarning(component: string, id: string | undefined) {
    useEffect(() => warnLabelFor(component, id), [component, id]);
}
