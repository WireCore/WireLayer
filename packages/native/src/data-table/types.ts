import type {
    DataSource,
    DataTableAggregate,
    DataTableFilterType,
    DataTableMatchMode,
    RowsRequest,
    RowsResult,
} from '@wirecore/wirelayer-recipes/native';
import type { ReactNode } from 'react';
export type {
    DataQuery,
    DataRequest,
    DataResult,
    DataSource,
    DataTableAggregate,
    DataTableFilterRule,
    DataTableFilterType,
    DataTableFilterValue,
    DataTableMatchMode,
    DataTableSort,
    RowsRequest,
    RowsResult,
} from '@wirecore/wirelayer-recipes/native';

/**
 * A choice of a select filter: a text, a number or yes/no – or an object with a value of any type, a label and
 * optionally a group heading
 */
export type DataTableOption =
    string | number | boolean | { value: unknown; label: string; group?: string; disabled?: boolean };

export interface DataTableColumn<TData> {
    id: string;
    header: string;
    /** Property name or getter for the cell value (default: the column id) */
    accessor?: keyof TData | ((row: TData) => unknown);
    /** Text of the value in the cell, the export and the search (default: the value as text) */
    format?: (value: unknown, row: TData) => string;
    /** Tapping the header (table) or the sort sheet sorts by this column */
    sortable?: boolean;
    /** Own order for sorting: negative when a comes first */
    sortFn?: (a: TData, b: TData) => number;
    align?: 'start' | 'end';
    /**
     * Filter of the column in the filter sheet: free text, a choice of the values (`select`, `multiSelect`),
     * numbers, dates or yes/no
     */
    filter?: DataTableFilterType;
    /**
     * Choices of a select filter (default: all values of the column as shown). Objects with a value of their own
     * (`{ value, label, group }`) or numbers compare the cell value instead of the shown text.
     */
    filterOptions?: DataTableOption[];
    /**
     * Match mode of the filter (default: the first of the type – contains, equals, is one of, on the day) –
     * `between` shows a from and a to input for numbers and dates
     */
    filterMatchMode?: DataTableMatchMode;
    /** Own comparison: whether the cell value (not formatted) passes the filter value – replaces the match mode */
    filterFn?: (value: unknown, filter: unknown, row: TData, matchMode: DataTableMatchMode) => boolean;
    /** Part of the search above the table, default true */
    searchable?: boolean;
    /** Width in the table in pt (default: 160, at least 60) */
    width?: number;
    /** Total of the column in the footer row (table) or the total card */
    aggregate?: DataTableAggregate | ((values: unknown[]) => unknown);
    /** Footer text of the column (instead of the aggregate) */
    footer?: string;
    /** Part of the export, default true */
    exportable?: boolean;
    /** Column name in the export (default: `header`) */
    exportHeader?: string;
    /** Value in the export (default: the shown text) */
    exportValue?: (row: TData) => unknown;
    /** Own cell content (default: the formatted value) – screen readers still read "header: text" on iOS/Android */
    cell?: (row: TData, value: unknown) => ReactNode;
}

/** Options of the CSV export (`generateCsv`) */
export interface DataTableCsvOptions {
    /** Only the selected rows (default: the filtered and sorted rows of all pages) */
    selectionOnly?: boolean;
    /** Separator, default ";" (opens in a German Excel) */
    separator?: string;
    /** Byte order mark at the start, so Excel reads UTF-8 – default true */
    bom?: boolean;
}

/** Options of the Excel export (`generateXlsx`) */
export interface DataTableXlsxOptions {
    /** Only the selected rows (default: the filtered and sorted rows of all pages) */
    selectionOnly?: boolean;
    /** Name of the worksheet (default: the caption) */
    sheetName?: string;
    /** Grouped tables (`groupBy`): a bold row per group with its aggregates (default true) */
    groups?: boolean;
    /** A bold row with the totals of the footer (`aggregate`, `footer`), default true */
    totals?: boolean;
}

/** A file of the export button (`onExport`) – `shareFile` of `@wirecore/wirelayer-native/expo-sharing` takes it as it is */
export interface DataTableExportFile {
    format: 'csv' | 'xlsx';
    /** Name with extension, e.g. "server.csv" */
    filename: string;
    mimeType: string;
    /** Text (CSV) or bytes (xlsx) */
    data: string | Uint8Array;
}

/**
 * Rows from a server: `getRows` gets page (1-based), page size, sorting, filters, search, grouping and an abort
 * signal and answers `{ rows, rowCount }` – or a general data source (`getItems`).
 */
export type DataTableDataSource<TData> =
    { getRows: (request: RowsRequest) => Promise<RowsResult<TData>> } | DataSource<TData>;

/** A tap on a row or card (`onRowClick`) */
export interface DataTableRowClick<TData> {
    row: TData;
    rowId: string;
}

/** A chosen row action (`onRowAction`) */
export interface DataTableRowAction<TData> {
    /** Value of the chosen menu item */
    value: string;
    row: TData;
    rowId: string;
}
