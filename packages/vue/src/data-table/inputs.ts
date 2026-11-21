import DatePicker from '../components/DatePicker/DatePicker.vue';
import DateRangePicker from '../components/DateRangePicker/DateRangePicker.vue';
import NumberInput from '../components/NumberInput/NumberInput.vue';
import type { DataTableFeature } from './types.js';

/** DataTable feature: the DatePicker for `date` and `datetime` filters and editors (without: the browser's date input) */
export const dateInput: DataTableFeature = { dateInput: DatePicker };
/** DataTable feature: the NumberInput for `number` filters and editors (without: the browser's number input) */
export const numberInput: DataTableFeature = { numberInput: NumberInput };
/**
 * DataTable feature: the DateRangePicker for `between` filters of `date` and `datetime` columns – one field for from and
 * to (without: two fields)
 */
export const dateRangeInput: DataTableFeature = { dateRangeInput: DateRangePicker };
