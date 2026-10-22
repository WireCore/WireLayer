import type { ItemValueOf } from '@wirecore/wirelayer-recipes/native';
import { Select, type SelectItem, type SelectProps } from '../Select/Select.js';

export interface ComboboxProps<T = SelectItem, V = ItemValueOf<T>> extends Omit<SelectProps<T, V>, 'filter'> {
    /** Shown when nothing matches */
    emptyText?: string;
}

/**
 * Picker for long lists: the sheet starts with a search field that filters the options while typing (accent- and
 * case-blind); with `dataSource` the search asks the server. Same props as Select.
 */
export function Combobox<T = SelectItem, V = ItemValueOf<T>>(props: ComboboxProps<T, V>) {
    return <Select<T, V> {...props} filter />;
}
