import { computed, inject, type ComputedRef, type InjectionKey } from 'vue';

/** State of a Field that Ark's field context does not carry: the success state, whether it has a label */
export interface FieldStatus {
    success: boolean;
    /** The Field shows a label – groups (RadioGroup, SegmentedControl, ChipGroup) take it as their name */
    labelled: boolean;
}

export const fieldStatusKey: InjectionKey<ComputedRef<FieldStatus>> = Symbol('FieldStatus');

/** The success state of the surrounding Field (false without one) */
export function useFieldStatus(): ComputedRef<FieldStatus> {
    const status = inject(fieldStatusKey, null);
    return computed(() => status?.value ?? { success: false, labelled: false });
}
