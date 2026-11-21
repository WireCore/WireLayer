import {
    columnFilteringFeature,
    columnGroupingFeature,
    columnOrderingFeature,
    columnPinningFeature,
    columnResizingFeature,
    columnSizingFeature,
    columnVisibilityFeature,
    createExpandedRowModel,
    createFilteredRowModel,
    createGroupedRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    filterFn_equalsString,
    filterFn_includesString,
    globalFilteringFeature,
    rowExpandingFeature,
    rowPaginationFeature,
    rowPinningFeature,
    rowSelectionFeature,
    constructSortFn,
    rowSortingFeature,
    sortFn_alphanumericCaseSensitive,
    sortFn_basic,
    sortFn_datetime,
    sortFn_textCaseSensitive,
    tableFeatures,
} from '@tanstack/react-table';
import { createContext } from 'react';
import type { DataTableFeature } from './types.js';

/** Data of the table for the sort functions: the language of the table (LocaleProvider/ConfigProvider) */
export interface DataTableMeta {
    locale?: string;
}

const collators = new Map<string, Intl.Collator>();
/** Texts by the rules of the language: case and accents do not separate, numbers in them count ("Server 2" < "10") */
const collatorOf = (row: { table: { options: { meta?: unknown } } }) => {
    const locale = (row.table.options.meta as DataTableMeta | undefined)?.locale ?? '';
    let collator = collators.get(locale);
    if (!collator) {
        collator = new Intl.Collator(locale || undefined, { numeric: true, sensitivity: 'base' });
        collators.set(locale, collator);
    }
    return collator;
};
const asText = (value: unknown) =>
    typeof value === 'string' ? value : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
/** `text` and `alphanumeric` (what TanStack picks for text columns) – as React Native and the CSV sort them */
const sortFn_collated = constructSortFn({
    resolveDataValue: asText,
    sort: (a: string, b: string, row) => collatorOf(row).compare(a, b),
});

/** Registered TanStack Table v9 features – stable at module scope */
export const features = tableFeatures({
    tableMeta: {} as DataTableMeta,
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    // Every sort function the automatic choice of TanStack can pick (text, alphanumeric for strings, datetime for
    // Date values); text by the language of the table, the case-sensitive ones and the rest as TanStack has them
    sortFns: {
        text: sortFn_collated,
        alphanumeric: sortFn_collated,
        textCaseSensitive: sortFn_textCaseSensitive,
        alphanumericCaseSensitive: sortFn_alphanumericCaseSensitive,
        datetime: sortFn_datetime,
        basic: sortFn_basic,
    },
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
    rowSelectionFeature,
    // Frozen rows at the top
    rowPinningFeature,
    // TreeTable (getSubRows) and groups (groupBy): rows with sub rows
    rowExpandingFeature,
    expandedRowModel: createExpandedRowModel(),
    columnGroupingFeature,
    groupedRowModel: createGroupedRowModel(),
    // Search over all columns and filters per column, both without case
    columnFilteringFeature,
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: { includesString: filterFn_includesString, equalsString: filterFn_equalsString },
    columnVisibilityFeature,
    columnOrderingFeature,
    columnPinningFeature,
    columnSizingFeature,
    columnResizingFeature,
});

/** The feature modules of a table (`features`) for its value inputs in filter menus and editors */
export const FeatureContext = createContext<DataTableFeature>({});
