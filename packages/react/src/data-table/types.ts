import type { ReactNode } from 'react';
export type {
    DataTableAggregate,
    DataTableFilterConstraint,
    DataTableFilterRule,
    DataTableFilterType,
    DataTableFilterValue,
    DataTableMatchMode,
    DataTableMatchModeDefinition,
    DataTableSort,
} from '@wirecore/wirelayer-recipes';
export type {
    DataQuery,
    DataRequest,
    DataResult,
    DataSource,
    RowsRequest,
    RowsResult,
} from '@wirecore/wirelayer-recipes';
import type {
    ConditionField,
    ConditionGroup,
    DataSource,
    DataTableAggregate,
    DataTableFilterType,
    DataTableMatchMode,
    PivotValue,
    RowsRequest,
    RowsResult,
} from '@wirecore/wirelayer-recipes';

/** Kind of input for editing a cell – `datetime` is a date with time ("2026-10-20T14:30") */
export type DataTableEditor =
    'text' | 'textarea' | 'number' | 'select' | 'multiSelect' | 'date' | 'datetime' | 'checkbox';

/**
 * A choice of a select filter or editor: a text, a number or yes/no – or an object with a value of any type, a
 * label and optionally a group heading
 */
export type DataTableOption =
    string | number | boolean | { value: unknown; label: string; group?: string; disabled?: boolean };

/** What an own filter input gets (`#filter-<id>` / `renderFilter`) */
export interface DataTableFilterInputProps<TData> {
    /** The value of the condition (filter row: the first condition) */
    value: unknown;
    /** Sets the value – the table filters at once (an empty value removes the filter) */
    setValue: (value: unknown) => void;
    column: DataTableColumn<TData>;
}

/** What the editor of the advanced filter gets (`renderAdvancedFilter`) – fits ConditionBuilder's props */
export interface DataTableAdvancedFilterProps {
    /** The fields the rules can test */
    fields: ConditionField[];
    /** The condition tree */
    value: ConditionGroup;
    /** Sets the tree – the table filters at once */
    onValueChange: (value: ConditionGroup) => void;
    /** Name of the panel ("Advanced filter") */
    label: string;
}

/** What an own editor gets (`#editor-<id>` / `renderEditor`) */
export interface DataTableEditorProps<TData> {
    /** The value being edited */
    value: unknown;
    setValue: (value: unknown) => void;
    row: TData;
    /** Saves (cell: leaves the editor; row: saves the whole row) */
    commit: () => void;
    /** Discards the change */
    cancel: () => void;
    /** The check (`validate`) found an error */
    invalid: boolean;
}

export interface DataTableColumn<TData> {
    id: string;
    header: string;
    /** Columns below this header – the column becomes a group header spanning them */
    columns?: DataTableColumn<TData>[];
    /** Property name or getter for the cell value (default: the column id) */
    accessor?: keyof TData | ((row: TData) => unknown);
    /** Text of the value in the cell, the export and the search (default: the value as text) */
    format?: (value: unknown, row: TData) => string;
    sortable?: boolean;
    /** Own order for sorting: negative when a comes first */
    sortFn?: (a: TData, b: TData) => number;
    align?: 'start' | 'end';
    /**
     * Filter of the column: free text, a choice of the values (`select`, `multiSelect`), numbers, dates or yes/no.
     * In the filter row (`filterDisplay="row"`) or as a menu with match modes and several conditions.
     */
    filter?: DataTableFilterType;
    /**
     * Choices of a select filter (default: all values of the column as shown). Objects with a value of their own
     * (`{ value, label, group }`) or numbers compare the cell value instead of the shown text.
     */
    filterOptions?: DataTableOption[];
    /** Match modes offered in the filter menu (default: all of the filter type and own ones for the type) */
    matchModes?: DataTableMatchMode[];
    /** Match mode of the filter row (default: the first of the type) – `between` shows a from and a to input */
    filterMatchMode?: DataTableMatchMode;
    /**
     * Own comparison: whether the cell value (not formatted) passes the value of a filter condition – replaces the
     * match modes of the column
     */
    filterFn?: (value: unknown, filter: unknown, row: TData, matchMode: DataTableMatchMode) => boolean;
    /** Part of the search above the table, default true */
    searchable?: boolean;
    /** Initial width in px (with `resizable` the user can change it) */
    width?: number;
    /** Stays visible at the start or end while the table scrolls sideways */
    pinned?: 'start' | 'end';
    /** Can be hidden in the column menu (`columnToggle`), default true */
    hideable?: boolean;
    /** Hidden on screens below this breakpoint */
    hideBelow?: 'sm' | 'md' | 'lg';
    /** The value can be edited in place – reported via the cell edit (row edit) event */
    editable?: boolean;
    /** Input for editing, default text */
    editor?: DataTableEditor;
    /** Choices of a select or multi select editor */
    editOptions?: DataTableOption[];
    /** Checks an edited value: an error text keeps the editor open – may answer later (a promise) */
    validate?: (value: unknown, row: TData) => string | undefined | Promise<string | undefined>;
    /** Total of the column in the footer row and in group rows */
    aggregate?: DataTableAggregate | ((values: unknown[]) => unknown);
    /** Footer text of the column (instead of the aggregate) */
    footer?: string;
    /** Part of the CSV export, default true */
    exportable?: boolean;
    /** Column name in the CSV export (default: `header`) */
    exportHeader?: string;
    /** Value in the CSV export (default: the shown text) */
    exportValue?: (row: TData) => unknown;
    /** A copy button next to the value */
    copyable?: boolean;
    /**
     * `auto`: equal values one below the other become one cell (merged down) – after sorting and inside the merged
     * cells of the columns before. Not with virtual scrolling (`virtual`).
     */
    rowSpan?: 'auto';
    /** Columns a cell of this column spans in a row (it covers the next cells) – not with virtual scrolling */
    colSpan?: (row: TData) => number;
    /** Can be moved with drag and drop or the column menu (`reorderableColumns`), default true */
    reorderable?: boolean;
    /** The column can group the rows (column menu), default false */
    groupable?: boolean;
    /** Custom cell content (default: the formatted value) */
    cell?: (row: TData, value: unknown) => ReactNode;
    /** Own filter input for the filter row and the filter menu (instead of the input of the filter type) */
    renderFilter?: (props: DataTableFilterInputProps<TData>) => ReactNode;
    /** Own editor (instead of the input of `editor`) */
    renderEditor?: (props: DataTableEditorProps<TData>) => ReactNode;
}

/** "Select all" across the pages of a server table (`selectAllMode="all"`): every row except these */
export interface DataTableAllSelection {
    mode: 'all';
    except: string[];
}

/** Options of the CSV export (`exportCsv`, `generateCsv`) */
export interface DataTableCsvOptions {
    /** Only the selected rows (default: the filtered and sorted rows of all pages) */
    selectionOnly?: boolean;
    /** Separator – default: `csvSeparator` of the table, else from the locale (";" with a decimal comma, "," otherwise) */
    separator?: string;
    /** Byte order mark at the start, so Excel reads UTF-8 – default true */
    bom?: boolean;
    /** File name without ".csv" (exportCsv, default: `exportFilename`) */
    filename?: string;
}

/** Options of the Excel export (`exportXlsx`, `generateXlsx`) */
export interface DataTableXlsxOptions {
    /** Only the selected rows (default: the filtered and sorted rows of all pages) */
    selectionOnly?: boolean;
    /** File name without ".xlsx" (exportXlsx, default: `exportFilename`) */
    filename?: string;
    /** Name of the worksheet (default: the caption) */
    sheetName?: string;
    /** Grouped tables: a bold row per group with its aggregates (default true) */
    groups?: boolean;
    /** A bold row with the totals of the footer (`aggregate`, `footer`), default true */
    totals?: boolean;
}

/** Options of `print()` */
export interface DataTablePrintOptions {
    /** Title of the printed page (default: the caption) */
    title?: string;
    /** Only the selected rows */
    selectionOnly?: boolean;
}

/** The selected range of cells (`cellSelection`) */
export interface DataTableCellSelection<TData> {
    rowIds: string[];
    columnIds: string[];
    rows: TData[];
    /** Values by row and column of the range (changed values of the batch mode included) */
    values: unknown[][];
}

/** A changed cell: pasted, undone or collected in the batch mode */
export interface DataTableCellChange<TData> {
    row: TData;
    rowId: string;
    columnId: string;
    value: unknown;
    oldValue: unknown;
}

/** Cells pasted with Ctrl+V (`cellSelection`) – `preventDefault()` keeps the changes out of the table */
export interface DataTableCellPaste<TData> {
    /** Valid values for editable cells, read per column type (numbers, dates, choices) and checked (`validate`) */
    changes: DataTableCellChange<TData>[];
    /** Cells left out: not editable, not readable for the column or failed the check */
    errors: { rowId: string; columnId: string; text: string; message: string }[];
    preventDefault: () => void;
    defaultPrevented: boolean;
}

/** Saving the collected changes (`editMode="batch"`) – apply them to `data`; the table forgets them */
export interface DataTableBatchSave<TData> {
    changes: DataTableCellChange<TData>[];
    /** The changes by row: the new values by column id */
    rows: { row: TData; rowId: string; values: Record<string, unknown> }[];
}

/**
 * Rows from a server: `getRows` gets page (1-based), page size, sorting, filters, search, grouping and an abort
 * signal and answers `{ rows, rowCount }` – or a general data source (`getItems`).
 */
export type DataTableDataSource<TData> =
    { getRows: (request: RowsRequest) => Promise<RowsResult<TData>> } | DataSource<TData>;

/** Cross table: rows grouped by `rows`, column headers from the values of `columns`, `values` aggregated */
export interface DataTablePivot {
    rows: string[];
    columns: string[];
    values: PivotValue[];
}

/** A click on a row with `rowHref` – call `event.preventDefault()` to navigate with your router instead */
export interface DataTableRowClick<TData> {
    row: TData;
    rowId: string;
    href?: string;
    event: MouseEvent;
}

export interface DataTableCellEdit<TData> {
    row: TData;
    rowId: string;
    columnId: string;
    /** The new value: text, number, ISO date ("2026-10-20"), list or boolean, depending on the editor */
    value: unknown;
}

export interface DataTableRowEdit<TData> {
    row: TData;
    rowId: string;
    /** New values of the editable columns, by column id */
    values: Record<string, unknown>;
}

export interface DataTableRowReorder<TData> {
    row: TData;
    rowId: string;
    /** Positions in `data` (0-based) – in a tree table: in the old and the new parent */
    from: number;
    to: number;
    /** Grouped table: the values of the group the row went into (only when it changed) – set them on the row */
    group?: Record<string, unknown>;
    /** Tree table: the new parent (null: top level) and the position among its children – see moveTreeRow */
    parentId?: string | null;
    index?: number;
}

export interface DataTableRowAction<TData> {
    /** Value of the chosen menu item */
    value: string;
    row: TData;
    rowId: string;
}
