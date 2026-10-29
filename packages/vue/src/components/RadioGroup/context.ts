import type { InjectionKey } from 'vue';

/** Provided by RadioGroup: the values of its items by their text – number values come back as numbers */
export const radioGroupValuesKey: InjectionKey<Map<string, string | number>> = Symbol('RadioGroupValues');
