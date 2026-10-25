// DataTable on TanStack Table – requires @tanstack/vue-table as an optional peer dependency (virtual rows: the feature
// virtualRows from /virtual with @tanstack/vue-virtual)
export { default as DataTable, type DataTableProps } from './DataTable.vue';
export type {
    DataTableAdvancedFilterProps,
    DataTableAggregate,
    DataTableAllSelection,
    DataTableBatchSave,
    DataTableCellChange,
    DataTableCellEdit,
    DataTableCellPaste,
    DataTableCellSelection,
    DataTableColumn,
    DataTableCsvOptions,
    DataTableDataSource,
    DataTableEditor,
    DataTableEditorProps,
    DataTableFeature,
    DataTableFilterConstraint,
    DataTableFilterInputOptions,
    DataTableFilterInputProps,
    DataTableFilterRule,
    DataTableFilterType,
    DataTableFilterValue,
    DataTableMatchMode,
    DataTableMatchModeDefinition,
    DataTableOption,
    DataTablePivot,
    DataTablePrintOptions,
    DataTableRowAction,
    DataTableRowClick,
    DataTableRowEdit,
    DataTableRowReorder,
    DataTableSort,
    DataTableStateKey,
    DataTableVirtualizer,
    DataTableVirtualOptions,
    DataTableXlsxOptions,
    DataQuery,
    DataRequest,
    DataResult,
    DataSource,
    RowsRequest,
    RowsResult,
} from './types.js';
/** Feature modules for `features`: the DatePicker and NumberInput of date and number filters and editors */
export { dateInput, numberInput } from './inputs.js';
/** Registers an own match mode for the filter menus of all tables (label, value input, test) */
export { defineMatchMode } from '@wirecore/wirelayer-recipes';
/** Moves a row in your data after a row-reorder event: `data = moveItem(data, from, to)` */
export { moveItem } from '@wirecore/wirelayer-recipes';
/** Applies a row move of a tree table to your data: `data = moveTreeRow(data, move, getRowId, 'children')` */
export { moveTreeRow } from '@wirecore/wirelayer-recipes';
/** A data source controller for own lists (abort, cache, debounced search) and the DataTable adapters */
export { createDataController, dataSourceToRows, rowsToDataSource } from '@wirecore/wirelayer-recipes';

// Types of the recipes in the pivot props above
export type { PivotValue } from '@wirecore/wirelayer-recipes';
