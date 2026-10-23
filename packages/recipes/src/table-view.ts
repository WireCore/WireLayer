// Rows of a table without a table library (the DataTable of @wirecore/wirelayer-native): cell values and texts of the
// columns, search and column filters, sorting (numbers, dates, text by the rules of the locale, own order), pages,
// groups, totals and the rows of a CSV or Excel export. Same rules as the web DataTable (matchesColumnFilter,
// matchesSearch, aggregateValues), framework-neutral.

import {
    aggregateValues,
    matchesColumnFilter,
    matchesSearch,
    type DataTableAggregate,
    type DataTableFilterType,
    type DataTableFilterValue,
    type DataTableMatchMode,
    type DataTableSort,
} from './data-table.js';
import { toCsv } from './utils.js';
import type { XlsxRow, XlsxSheet, XlsxValue } from './xlsx.js';

/** What the table logic reads of a column – a part of the DataTable column */
export interface TableViewColumn<T> {
    id: string;
    header: string;
    /** Property name or getter for the cell value (default: the column id) */
    accessor?: keyof T | ((row: T) => unknown);
    /** Text of the value in the cell, the export and the search (default: the value as text) */
    format?: (value: unknown, row: T) => string;
    /** Own order for sorting: negative when a comes first */
    sortFn?: (a: T, b: T) => number;
    /** Filter type of the column: text and choices compare the shown text, numbers and dates the value */
    filter?: DataTableFilterType;
    /** Choices of a select filter – numbers or objects with a value compare the cell value, not the text */
    filterOptions?: readonly unknown[];
    /** Own comparison of the column: replaces the match modes */
    filterFn?: (value: unknown, filter: unknown, row: T, matchMode: DataTableMatchMode) => boolean;
    /** Part of the search, default true */
    searchable?: boolean;
    /** Part of the export, default true */
    exportable?: boolean;
    /** Column name in the export (default: `header`) */
    exportHeader?: string;
    /** Value in the export (default: the shown text) */
    exportValue?: (row: T) => unknown;
    /** Total of the column (footer, group rows of the Excel export) */
    aggregate?: DataTableAggregate | ((values: unknown[]) => unknown);
    /** Footer text of the column (instead of the aggregate) */
    footer?: string;
}

const isEmpty = (value: unknown) => value === null || value === undefined || value === '';
const plain = (value: unknown) => (value === null || value === undefined ? '' : String(value));

/** The value of a cell: the accessor (property name or getter), else the property named like the column */
export function cellValue<T>(column: TableViewColumn<T>, row: T): unknown {
    if (typeof column.accessor === 'function') return column.accessor(row);
    return (row as Record<PropertyKey, unknown>)[(column.accessor ?? column.id) as PropertyKey];
}

/** The text of a cell as shown, searched and exported (`format`, else the value as text) */
export function cellText<T>(column: TableViewColumn<T>, row: T): string {
    const value = cellValue(column, row);
    return column.format ? column.format(value, row) : plain(value);
}

/** Choices with values of their own (numbers, objects): select filters compare the value, not the shown text */
const byValue = (column: { filterOptions?: readonly unknown[] }) =>
    (column.filterOptions ?? []).some((option) => typeof option !== 'string');

/** Search and column filters of a table */
export interface TableViewFilter {
    /** Text searched in every searchable column (ignores case and accents) */
    search?: string;
    /** Column filters by column id – plain text or a rule with match modes */
    filters?: Record<string, DataTableFilterValue>;
    /** Locale for comparing texts, e.g. "de-DE" */
    locale?: string;
}

/** Whether a row passes the search and every column filter */
export function matchesTableRow<T>(
    row: T,
    columns: readonly TableViewColumn<T>[],
    { search = '', filters = {}, locale }: TableViewFilter
): boolean {
    if (
        search &&
        !matchesSearch(
            columns.filter((column) => column.searchable !== false).map((column) => cellText(column, row)),
            search,
            locale
        )
    )
        return false;
    return Object.entries(filters).every(([id, filter]) => {
        const column = columns.find((entry) => entry.id === id);
        if (!column) return true;
        const type = column.filter ?? 'text';
        const textual = type === 'text' || type === 'select' || type === 'multiSelect';
        return matchesColumnFilter(
            {
                value: cellValue(column, row),
                text: textual ? cellText(column, row) : '',
                row,
                type,
                locale,
                filterFn: column.filterFn as ((...args: unknown[]) => boolean) | undefined,
                byValue: byValue(column),
            },
            filter
        );
    });
}

/** The rows that pass the search and the column filters (order kept) */
export function filterTableRows<T>(
    rows: readonly T[],
    columns: readonly TableViewColumn<T>[],
    filter: TableViewFilter
): T[] {
    if (!filter.search && !Object.keys(filter.filters ?? {}).length) return [...rows];
    return rows.filter((row) => matchesTableRow(row, columns, filter));
}

/**
 * Compares two cell values: numbers and dates by size, yes/no (no first), texts by the rules of the locale with
 * numbers in them counted ("Server 2" before "Server 10")
 */
export function compareCellValues(a: unknown, b: unknown, collator: Intl.Collator): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return collator.compare(plain(a), plain(b));
}

/**
 * The rows sorted by one or more columns (the first decides, the next on a tie): the column's `sortFn`, else the
 * values (compareCellValues). Empty values stay at the end in both directions; equal rows keep their order.
 */
export function sortTableRows<T>(
    rows: readonly T[],
    columns: readonly TableViewColumn<T>[],
    sorting: readonly DataTableSort[],
    locale?: string
): T[] {
    const sorts = sorting.flatMap((sort) => {
        const column = columns.find((entry) => entry.id === sort.id);
        return column ? [{ column, desc: sort.desc }] : [];
    });
    if (!sorts.length) return [...rows];
    const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
    return rows
        .map((row, index) => ({ row, index }))
        .sort((left, right) => {
            for (const { column, desc } of sorts) {
                let result: number;
                if (column.sortFn) result = column.sortFn(left.row, right.row);
                else {
                    const a = cellValue(column, left.row);
                    const b = cellValue(column, right.row);
                    if (isEmpty(a) || isEmpty(b)) {
                        if (isEmpty(a) && isEmpty(b)) continue;
                        return isEmpty(a) ? 1 : -1;
                    }
                    result = compareCellValues(a, b, collator);
                }
                if (result) return desc ? -result : result;
            }
            return left.index - right.index;
        })
        .map((entry) => entry.row);
}

/** Number of pages (at least 1) */
export const tablePageCount = (count: number, pageSize: number) =>
    pageSize > 0 ? Math.max(1, Math.ceil(count / pageSize)) : 1;

/** The rows of a page (1-based) – a page past the end shows the last one */
export function pageTableRows<T>(rows: readonly T[], page: number, pageSize: number): T[] {
    if (!pageSize) return [...rows];
    const current = Math.min(Math.max(1, page), tablePageCount(rows.length, pageSize));
    return rows.slice((current - 1) * pageSize, current * pageSize);
}

/** Rows with the same value of a column */
export interface TableRowGroup<T> {
    /** The value of the column (of the first row) */
    value: unknown;
    /** The value as shown */
    text: string;
    rows: T[];
}

/** The rows grouped by the shown value of a column, the groups in the order of their first row */
export function groupTableRows<T>(rows: readonly T[], column: TableViewColumn<T>): TableRowGroup<T>[] {
    const groups = new Map<string, TableRowGroup<T>>();
    for (const row of rows) {
        const text = cellText(column, row);
        const group = groups.get(text);
        if (group) group.rows.push(row);
        else groups.set(text, { value: cellValue(column, row), text, rows: [row] });
    }
    return [...groups.values()];
}

/** An aggregate as text: a number in the locale (at most 2 decimals) or with the column's `format` */
export function formatAggregate<T>(column: TableViewColumn<T>, value: unknown, row: T | undefined, locale?: string) {
    if (value === null || value === undefined) return '';
    if (column.format && row !== undefined && column.aggregate !== 'count') return column.format(value, row);
    return typeof value === 'number'
        ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
        : plain(value);
}

/** The total of a column over rows (`aggregate`) as text – empty without an aggregate */
export function tableAggregateText<T>(rows: readonly T[], column: TableViewColumn<T>, locale?: string): string {
    if (!column.aggregate) return '';
    const value = aggregateValues(
        rows.map((row) => cellValue(column, row)),
        column.aggregate
    );
    return formatAggregate(column, value, rows[0], locale);
}

/** The columns of an export (`exportable` not false) */
export const exportColumns = <T>(columns: readonly TableViewColumn<T>[]) =>
    columns.filter((column) => column.exportable !== false);

/** Options of the CSV of a table */
export interface TableCsvOptions {
    /** Separator (default ";"; the DataTable passes its `csvSeparator`, by default from the locale) */
    separator?: string;
    /** Byte order mark at the start, so Excel reads UTF-8 – default true */
    bom?: boolean;
}

/** The CSV of rows: a header line (`exportHeader`), the values (`exportValue`, else the shown text) */
export function tableCsv<T>(
    rows: readonly T[],
    columns: readonly TableViewColumn<T>[],
    { separator, bom = true }: TableCsvOptions = {}
): string {
    const visible = exportColumns(columns);
    const csv = toCsv(
        [
            visible.map((column) => column.exportHeader ?? column.header),
            ...rows.map((row) =>
                visible.map((column) => (column.exportValue ? column.exportValue(row) : cellText(column, row)))
            ),
        ],
        separator
    );
    return bom ? csv : csv.slice(1);
}

/** A cell of the Excel export: numbers as numbers, dates (filter type `date`) as dates, else the shown text */
export function xlsxCellValue<T>(column: TableViewColumn<T>, row: T): XlsxValue {
    if (column.exportValue) {
        const value = column.exportValue(row);
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        if (typeof value === 'boolean') return value;
        if (value instanceof Date) return { date: value };
        return plain(value);
    }
    const value = cellValue(column, row);
    if (isEmpty(value)) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (value instanceof Date) return { date: value };
    if (column.filter === 'date' && typeof value === 'string') return { date: value };
    if (typeof value === 'boolean' && !column.format) return value;
    return cellText(column, row);
}

/** Options of the Excel sheet of a table */
export interface TableXlsxOptions<T> {
    /** Name of the worksheet */
    name?: string;
    /** A bold row of a group before its rows (with the aggregates of the group) */
    groupBy?: TableViewColumn<T>;
    /** Text of a group row, e.g. "City: Berlin, 3 entries" (default "Header: value (count)") */
    groupLabel?: (group: TableRowGroup<T>) => string;
    /** A bold row with the totals (`aggregate`, `footer`), default true */
    totals?: boolean;
    /** First cell of the total row when the first column has no total, e.g. "Total" */
    totalLabel?: string;
}

/** The Excel sheet of rows (for createXlsx): bold group rows, data rows below them, a bold total row */
export function tableXlsxSheet<T>(
    rows: readonly T[],
    columns: readonly TableViewColumn<T>[],
    { name, groupBy, groupLabel, totals = true, totalLabel = '' }: TableXlsxOptions<T> = {}
): XlsxSheet {
    const visible = exportColumns(columns);
    const dataRow = (row: T, level: number): XlsxRow => ({
        level,
        cells: visible.map((column) => xlsxCellValue(column, row)),
    });
    const aggregateCell = (column: TableViewColumn<T>, list: readonly T[]): XlsxValue => {
        if (!column.aggregate) return null;
        const value = aggregateValues(
            list.map((row) => cellValue(column, row)),
            column.aggregate
        );
        return typeof value === 'number' ? value : isEmpty(value) ? null : plain(value);
    };
    const sheetRows: XlsxRow[] = groupBy
        ? groupTableRows(rows, groupBy).flatMap((group) => [
              {
                  kind: 'group' as const,
                  cells: visible.map((column, index) =>
                      index === 0
                          ? (groupLabel?.(group) ?? `${groupBy.header}: ${group.text} (${group.rows.length})`)
                          : aggregateCell(column, group.rows)
                  ),
              },
              ...group.rows.map((row) => dataRow(row, 1)),
          ])
        : rows.map((row) => dataRow(row, 0));
    if (totals && visible.some((column) => column.aggregate || column.footer !== undefined)) {
        const cells = visible.map((column) =>
            column.footer !== undefined ? column.footer : aggregateCell(column, rows)
        );
        if (cells[0] === null) cells[0] = totalLabel;
        sheetRows.push({ kind: 'total', cells });
    }
    return {
        name,
        columns: visible.map((column) => ({ header: column.exportHeader ?? column.header })),
        rows: sheetRows,
    };
}
