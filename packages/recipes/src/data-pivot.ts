// Pivot (cross table) and merged cells of the DataTable: the pivot groups the rows by the values of some columns
// (rows) and spreads others into column headers (columns), with an aggregate per value and totals per row and
// column. Merged cells: equal values one below the other become one cell (`rowSpan: 'auto'`), a cell may span the
// next columns (`colSpan`). Framework-neutral; Vue and React render the result.

import { aggregateValues, type DataTableAggregate } from './data-table.js';
import { listValueKey } from './list-items.js';

/** A value of the pivot: a column and how its values are combined */
export interface PivotValue {
    id: string;
    aggregate: DataTableAggregate | ((values: unknown[]) => unknown);
    /** Name of the value in the header (default: the header of the column) */
    header?: string;
}

/** Pivot configuration: column ids for the rows, for the column headers, and the values */
export interface PivotConfig {
    rows: string[];
    columns: string[];
    values: PivotValue[];
}

/** A combination of dimension values (one row or one column of the pivot) */
export interface PivotKey {
    key: string;
    values: unknown[];
    labels: string[];
}

export interface PivotResult {
    rows: PivotKey[];
    columns: PivotKey[];
    /** Aggregate of a cell: row key, column key ('' for the row total) and value id */
    cell: (rowKey: string, columnKey: string, valueId: string) => unknown;
    /** Total of a column over all rows (column key '' for the grand total) */
    total: (columnKey: string, valueId: string) => unknown;
}

const SEPARATOR = '\u0000';
/** Key of a combination – never empty ('' stands for the totals) */
const keyOf = (values: unknown[]) => `#${values.map((value) => listValueKey(value)).join(SEPARATOR)}`;
/** Joins a row key and a column key to the key of their values */
const BUCKET = '\u0001';

const compareLabels = (a: PivotKey, b: PivotKey) => {
    for (let index = 0; index < a.labels.length; index++) {
        const [left, right] = [a.values[index], b.values[index]];
        const order =
            typeof left === 'number' && typeof right === 'number'
                ? left - right
                : a.labels[index]!.localeCompare(b.labels[index]!, undefined, { numeric: true });
        if (order) return order;
    }
    return 0;
};

/**
 * The cross table of the records: `value(record, id)` reads a column value, `label(record, id, value)` its text.
 * Row and column keys are sorted by their values (numbers numerically, texts naturally).
 */
export function pivotTable<T>(
    records: readonly T[],
    config: PivotConfig,
    value: (record: T, id: string) => unknown,
    label: (record: T, id: string, value: unknown) => string = (_, __, item) =>
        item === null || item === undefined ? '' : String(item)
): PivotResult {
    const rows = new Map<string, PivotKey>();
    const columns = new Map<string, PivotKey>();
    // Collected values per cell (row key, column key; '' for all) → value id → values
    const buckets = new Map<string, Map<string, unknown[]>>();
    const add = (bucket: string, record: T) => {
        let byValue = buckets.get(bucket);
        if (!byValue) buckets.set(bucket, (byValue = new Map()));
        for (const item of config.values) {
            const list = byValue.get(item.id) ?? [];
            list.push(value(record, item.id));
            byValue.set(item.id, list);
        }
    };
    const keyFor = (record: T, ids: string[], into: Map<string, PivotKey>) => {
        const values = ids.map((id) => value(record, id));
        const key = keyOf(values);
        if (!into.has(key))
            into.set(key, { key, values, labels: ids.map((id, index) => label(record, id, values[index])) });
        return key;
    };
    for (const record of records) {
        const row = keyFor(record, config.rows, rows);
        const column = keyFor(record, config.columns, columns);
        add(`${row}${BUCKET}${column}`, record);
        add(`${row}${BUCKET}`, record);
        add(`${BUCKET}${column}`, record);
        add(BUCKET, record);
    }
    const aggregateOf = (bucket: string, valueId: string) => {
        const item = config.values.find((entry) => entry.id === valueId);
        const values = buckets.get(bucket)?.get(valueId);
        return item && values ? aggregateValues(values, item.aggregate) : null;
    };
    return {
        rows: [...rows.values()].sort(compareLabels),
        columns: [...columns.values()].sort(compareLabels),
        cell: (rowKey, columnKey, valueId) => aggregateOf(`${rowKey}${BUCKET}${columnKey}`, valueId),
        total: (columnKey, valueId) => aggregateOf(`${BUCKET}${columnKey}`, valueId),
    };
}

/** A column of the pivot view – the shape of a DataTable column */
export interface PivotColumn {
    id: string;
    header: string;
    columns?: PivotColumn[];
    align?: 'start' | 'end';
    sortable?: boolean;
    footer?: string;
    /** Text of an aggregate in the cells */
    format?: (value: unknown) => string;
    /** Merge equal row labels one below the other */
    rowSpan?: 'auto';
}

/** A row of the pivot view: `id`, the row labels by dimension id and the aggregates by column id */
export type PivotRow = Record<string, unknown> & { id: string };

export interface PivotViewOptions {
    /** Header of a dimension or value column (default: the id) */
    header?: (id: string) => string;
    /** Text of an aggregate in the footer */
    format?: (value: unknown, valueId: string) => string;
    /** Name of the total column and the first footer cell, default "Total" */
    totalLabel?: string;
}

/** Column id of a pivot cell: column key and value id */
export const pivotCellId = (columnKey: string, valueId: string) =>
    `pivot:${columnKey.replaceAll(SEPARATOR, '|')}:${valueId}`;

/**
 * Rows and columns for a DataTable showing the pivot: one column per row dimension (merged when equal), a column
 * group per column key with a column per value, the row totals and a footer with the column totals.
 */
export function pivotView(
    result: PivotResult,
    config: PivotConfig,
    options: PivotViewOptions = {}
): { rows: PivotRow[]; columns: PivotColumn[] } {
    const header = options.header ?? ((id: string) => id);
    const format = options.format ?? ((value: unknown) => (value === null || value === undefined ? '' : String(value)));
    const totalLabel = options.totalLabel ?? 'Total';
    const single = config.values.length === 1;
    const valueHeader = (item: PivotValue) => item.header ?? header(item.id);
    const valueColumns = (columnKey: string, groupHeader: string): PivotColumn[] => {
        const leaves = config.values.map((item) => ({
            id: pivotCellId(columnKey, item.id),
            header: single ? groupHeader : valueHeader(item),
            align: 'end' as const,
            sortable: true,
            footer: format(result.total(columnKey, item.id), item.id),
            format: (value: unknown) => format(value, item.id),
        }));
        return single
            ? leaves
            : [{ id: `pivot-group:${columnKey.replaceAll(SEPARATOR, '|')}`, header: groupHeader, columns: leaves }];
    };
    const dimensions: PivotColumn[] = config.rows.map((id, index) => ({
        id,
        header: header(id),
        sortable: true,
        ...(index === 0 ? { footer: totalLabel } : {}),
        ...(index < config.rows.length - 1 ? { rowSpan: 'auto' as const } : {}),
    }));
    const columns = [
        ...dimensions,
        ...result.columns.flatMap((column) => valueColumns(column.key, column.labels.join(' · ') || totalLabel)),
        ...(result.columns.length > 1 || config.columns.length ? valueColumns('', totalLabel) : []),
    ];
    const rows = result.rows.map((row) => {
        const record: PivotRow = { id: `pivot-row:${row.key.replaceAll(SEPARATOR, '|')}` };
        config.rows.forEach((id, index) => (record[id] = row.labels[index]));
        for (const column of [...result.columns, { key: '' }])
            for (const item of config.values)
                record[pivotCellId(column.key, item.id)] = result.cell(row.key, column.key, item.id);
        return record;
    });
    return { rows, columns };
}

/**
 * Row spans of merged columns (`rowSpan: 'auto'`): per column the number of rows a cell spans – 0 for a cell
 * covered by the one above. Equal values one below the other merge; a column merges only inside the merged cells
 * of the columns before it (like nested groups). Empty values do not merge. `breaks[i]` stops merging before row i
 * (group rows, details between the rows).
 */
export function autoRowSpans(columns: unknown[][], breaks: readonly boolean[] = []): number[][] {
    const count = columns[0]?.length ?? 0;
    const blank = (value: unknown) => value === null || value === undefined || value === '';
    // Where a new block starts, inherited from the columns before
    const starts = Array.from({ length: count }, (_, index) => index === 0 || !!breaks[index]);
    return columns.map((values) => {
        const spans = new Array<number>(count).fill(1);
        let start = 0;
        for (let index = 1; index <= count; index++) {
            const merge =
                index < count &&
                !starts[index] &&
                !blank(values[index]) &&
                listValueKey(values[index]) === listValueKey(values[start]);
            if (merge) {
                spans[index] = 0;
                continue;
            }
            spans[start] = index - start;
            if (index < count) {
                starts[index] = true;
                start = index;
            }
        }
        return spans;
    });
}

/**
 * Which cells of a row are covered by column spans: `spans[i]` is how many columns cell i spans (1 normally),
 * clamped to the end of the row. Returns the clamped spans, 0 for covered cells.
 */
export function rowColumnSpans(spans: readonly number[]): number[] {
    const result = spans.map(() => 1);
    for (let index = 0; index < spans.length; index++) {
        const span = Math.max(1, Math.min(Math.floor(spans[index] ?? 1), spans.length - index));
        result[index] = span;
        for (let covered = 1; covered < span; covered++) result[index + covered] = 0;
        index += span - 1;
    }
    return result;
}
