import type { DateLike } from '@wirecore/wirelayer-recipes';

export interface DateRange {
    /** ISO date (with time "2026-10-20T14:30"), null while not entered; a Date with valueType "date" */
    start: string | null;
    end: string | null;
}

/** A range as ISO strings or Date objects (valueType "date") */
export interface DateRangeLike {
    start: DateLike | null;
    end: DateLike | null;
}
