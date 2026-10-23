import DatePicker from '../components/DatePicker/DatePicker.vue';
import NumberInput from '../components/NumberInput/NumberInput.vue';
import type { DataTableFeature } from './types.js';

/** DataTable feature: the DatePicker for `date` and `datetime` filters and editors (without: the browser's date input) */
export const dateInput: DataTableFeature = { dateInput: DatePicker };
/** DataTable feature: the NumberInput for `number` filters and editors (without: the browser's number input) */
export const numberInput: DataTableFeature = { numberInput: NumberInput };
