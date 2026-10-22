import type { PeriodRange } from '@wirecore/wirelayer-recipes/native';
import { PeriodPicker, type PeriodPickerProps } from '../../utils/PeriodPicker.js';

export interface MonthPickerProps<T extends string | PeriodRange | null = string | null> extends PeriodPickerProps<T> {
    /** Month as "2026-10"; with range { start, end } */
    value?: T;
}

/** Month field ("10.2026"): picks from the month grid of a year in a sheet; range: start – end */
export function MonthPicker<T extends string | PeriodRange | null = string | null>(props: MonthPickerProps<T>) {
    return <PeriodPicker<T> {...props} period="month" />;
}
