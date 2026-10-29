import { createContext } from 'react';

/** Provided by RadioGroup: the values of its items by their text – number values come back as numbers */
export const RadioGroupValuesContext = createContext<Map<string, string | number> | null>(null);
