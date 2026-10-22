import type { PeriodRange } from '@wirecore/wirelayer-recipes/native';
import { PeriodPicker, type PeriodPickerProps } from '../../utils/PeriodPicker.js';

export interface QuarterPickerProps<
    T extends string | PeriodRange | null = string | null,
> extends PeriodPickerProps<T> {
    /** Quarter as "2026-Q4"; with range { start, end } */
    value?: T;
}

/** Quarter field ("Q4 2026"): picks from the four quarters of a year (each named with its months); range: start – end */
export function QuarterPicker<T extends string | PeriodRange | null = string | null>(props: QuarterPickerProps<T>) {
    return <PeriodPicker<T> {...props} period="quarter" />;
}
