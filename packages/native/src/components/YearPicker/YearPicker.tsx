import type { PeriodRange } from '@wirecore/wirelayer-recipes/native';
import { PeriodPicker, type PeriodPickerProps } from '../../utils/PeriodPicker.js';

export interface YearPickerProps<T extends string | PeriodRange | null = string | null> extends PeriodPickerProps<T> {
    /** Year as "2026"; with range { start, end } */
    value?: T;
}

/** Year field ("2026"): picks from a grid of twelve years; range: start – end */
export function YearPicker<T extends string | PeriodRange | null = string | null>(props: YearPickerProps<T>) {
    return <PeriodPicker<T> {...props} period="year" />;
}
