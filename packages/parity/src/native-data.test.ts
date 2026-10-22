import {
    cellText,
    cellValue,
    compareCellValues,
    createXlsx,
    filterTableRows,
    groupTableRows,
    matchesTableRow,
    pageTableRows,
    sortTableRows,
    tableAggregateText,
    tableCsv,
    tablePageCount,
    tableXlsxSheet,
    xlsxCellValue,
    type TableViewColumn,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// Table logic of the React Native DataTable (no TanStack) – framework-neutral in @wirecore/wirelayer-recipes

interface Server {
    id: number;
    name: string;
    city: string;
    load: number | null;
    since: string;
    active: boolean;
    price?: { amount: number };
}

const rows: Server[] = [
    { id: 1, name: 'srv-10', city: 'Cologne', load: 40, since: '2024-03-01', active: true },
    { id: 2, name: 'srv-2', city: 'Berlin', load: 85, since: '2023-11-20', active: false },
    { id: 3, name: 'Srv-1', city: 'Nürnberg', load: null, since: '2025-01-15', active: true },
    { id: 4, name: 'srv-3', city: 'Berlin', load: 12, since: '2024-07-09', active: true },
];

const columns: TableViewColumn<Server>[] = [
    { id: 'name', header: 'Name' },
    { id: 'city', header: 'City', filter: 'select' },
    { id: 'load', header: 'Load', filter: 'number', format: (value) => (value === null ? '–' : `${value} %`) },
    { id: 'since', header: 'Since', filter: 'date' },
    { id: 'active', header: 'Active', filter: 'boolean', format: (value) => (value ? 'Yes' : 'No'), searchable: false },
];
const column = (id: string) => columns.find((entry) => entry.id === id)!;
const ids = (list: Server[]) => list.map((row) => row.id);

describe('cell values and texts', () => {
    it('reads the accessor (property or getter), else the property of the column id', () => {
        expect(cellValue(column('city'), rows[0]!)).toBe('Cologne');
        expect(cellValue({ id: 'x', header: 'X', accessor: 'name' }, rows[0]!)).toBe('srv-10');
        expect(cellValue({ id: 'x', header: 'X', accessor: (row: Server) => row.id * 2 }, rows[1]!)).toBe(4);
    });

    it('shows the formatted value, empty values as empty text', () => {
        expect(cellText(column('load'), rows[0]!)).toBe('40 %');
        expect(cellText({ id: 'price', header: 'Price' }, rows[0]!)).toBe('');
    });
});

describe('search and column filters', () => {
    it('searches the shown texts of searchable columns, ignoring case and accents', () => {
        expect(ids(filterTableRows(rows, columns, { search: 'nurnberg' }))).toEqual([3]);
        expect(ids(filterTableRows(rows, columns, { search: '85 %' }))).toEqual([2]);
        // "Yes" is in a column that is not searchable
        expect(ids(filterTableRows(rows, columns, { search: 'Yes' }))).toEqual([]);
    });

    it('filters by text, choice, number, date and yes/no – all filters must hold', () => {
        expect(ids(filterTableRows(rows, columns, { filters: { city: 'Berlin' } }))).toEqual([2, 4]);
        const atLeast = { operator: 'and' as const, constraints: [{ matchMode: 'gte', value: 40 }] };
        expect(ids(filterTableRows(rows, columns, { filters: { load: atLeast } }))).toEqual([1, 2]);
        const since = { matchMode: 'between', value: ['2024-01-01', null] };
        const range = { operator: 'and' as const, constraints: [since] };
        expect(ids(filterTableRows(rows, columns, { filters: { since: range } }))).toEqual([1, 3, 4]);
        expect(ids(filterTableRows(rows, columns, { filters: { active: 'false' } }))).toEqual([2]);
        expect(ids(filterTableRows(rows, columns, { filters: { city: 'Berlin', active: 'true' } }))).toEqual([4]);
    });

    it('several choices compare the shown text; choices with own values the cell value', () => {
        const some = { operator: 'and' as const, constraints: [{ matchMode: 'in', value: ['Cologne', 'Nürnberg'] }] };
        const cities: TableViewColumn<Server>[] = [{ ...column('city'), filter: 'multiSelect' }];
        expect(ids(filterTableRows(rows, cities, { filters: { city: some } }))).toEqual([1, 3]);
        const byValue: TableViewColumn<Server> = { id: 'id', header: 'No.', filter: 'select', filterOptions: [1, 2] };
        const equals = { operator: 'and' as const, constraints: [{ matchMode: 'equals', value: 2 }] };
        expect(ids(filterTableRows(rows, [byValue], { filters: { id: equals } }))).toEqual([2]);
    });

    it('an own comparison (filterFn) replaces the match modes; unknown columns do not filter', () => {
        const even: TableViewColumn<Server> = {
            id: 'id',
            header: 'No.',
            filter: 'text',
            filterFn: (value, filter) => filter === 'even' && (value as number) % 2 === 0,
        };
        expect(ids(filterTableRows(rows, [even], { filters: { id: 'even' } }))).toEqual([2, 4]);
        expect(matchesTableRow(rows[0]!, columns, { filters: { missing: 'x' } })).toBe(true);
    });
});

describe('sorting', () => {
    it('sorts texts by the locale with numbers counted, ascending and descending', () => {
        expect(ids(sortTableRows(rows, columns, [{ id: 'name', desc: false }], 'de'))).toEqual([3, 2, 4, 1]);
        expect(ids(sortTableRows(rows, columns, [{ id: 'name', desc: true }], 'de'))).toEqual([1, 4, 2, 3]);
        expect(ids(sortTableRows(rows, columns, [{ id: 'city', desc: false }], 'de'))).toEqual([2, 4, 1, 3]);
    });

    it('sorts numbers by size; empty values stay last in both directions', () => {
        expect(ids(sortTableRows(rows, columns, [{ id: 'load', desc: false }]))).toEqual([4, 1, 2, 3]);
        expect(ids(sortTableRows(rows, columns, [{ id: 'load', desc: true }]))).toEqual([2, 1, 4, 3]);
    });

    it('the next column decides on a tie; equal rows keep their order', () => {
        const sorting = [
            { id: 'city', desc: false },
            { id: 'load', desc: true },
        ];
        expect(ids(sortTableRows(rows, columns, sorting, 'de'))).toEqual([2, 4, 1, 3]);
        expect(ids(sortTableRows(rows, columns, [{ id: 'active', desc: true }]))).toEqual([1, 3, 4, 2]);
        expect(ids(sortTableRows(rows, columns, []))).toEqual([1, 2, 3, 4]);
    });

    it('an own order (sortFn) is reversed for descending', () => {
        const byId: TableViewColumn<Server> = { id: 'id', header: 'No.', sortFn: (a, b) => b.id - a.id };
        expect(ids(sortTableRows(rows, [byId], [{ id: 'id', desc: false }]))).toEqual([4, 3, 2, 1]);
        expect(ids(sortTableRows(rows, [byId], [{ id: 'id', desc: true }]))).toEqual([1, 2, 3, 4]);
    });

    it('compares dates and yes/no by value', () => {
        const collator = new Intl.Collator('de');
        expect(compareCellValues(new Date(2024, 0, 2), new Date(2024, 0, 1), collator)).toBeGreaterThan(0);
        expect(compareCellValues(false, true, collator)).toBeLessThan(0);
        expect(compareCellValues('Äpfel', 'Birnen', collator)).toBeLessThan(0);
    });
});

describe('pages and groups', () => {
    it('cuts a page – a page past the end shows the last one', () => {
        expect(ids(pageTableRows(rows, 2, 3))).toEqual([4]);
        expect(ids(pageTableRows(rows, 9, 3))).toEqual([4]);
        expect(ids(pageTableRows(rows, 1, 0))).toEqual([1, 2, 3, 4]);
        expect(tablePageCount(4, 3)).toBe(2);
        expect(tablePageCount(0, 3)).toBe(1);
    });

    it('groups by the shown value, in the order of the first row', () => {
        const groups = groupTableRows(rows, column('city'));
        expect(groups.map((group) => [group.text, ids(group.rows)])).toEqual([
            ['Cologne', [1]],
            ['Berlin', [2, 4]],
            ['Nürnberg', [3]],
        ]);
    });

    it('totals a column as text in the locale', () => {
        expect(tableAggregateText(rows, { id: 'load', header: 'Load', aggregate: 'sum' }, 'de-DE')).toBe('137');
        expect(tableAggregateText(rows, { id: 'load', header: 'Load', aggregate: 'avg' }, 'de-DE')).toBe('45,67');
        expect(tableAggregateText(rows, { ...column('load'), aggregate: 'max' }, 'de-DE')).toBe('85 %');
        expect(tableAggregateText(rows, column('load'), 'de-DE')).toBe('');
    });
});

describe('export', () => {
    const exported: TableViewColumn<Server>[] = [
        { id: 'name', header: 'Name', exportHeader: 'Server' },
        { id: 'city', header: 'City' },
        { id: 'load', header: 'Load', format: (value) => `${value} %`, exportValue: (row) => row.load },
        { id: 'id', header: 'No.', exportable: false },
    ];

    it('CSV: export headers, export values or the shown text, separator and BOM', () => {
        const csv = tableCsv(rows.slice(0, 2), exported);
        expect(csv).toBe('﻿Server;City;Load\r\nsrv-10;Cologne;40\r\nsrv-2;Berlin;85');
        expect(tableCsv(rows.slice(0, 1), exported, { separator: ',', bom: false })).toBe(
            'Server,City,Load\r\nsrv-10,Cologne,40'
        );
    });

    it('Excel cells: numbers stay numbers, date columns become dates, yes/no stays', () => {
        expect(xlsxCellValue(columns[2]!, rows[0]!)).toBe(40);
        expect(xlsxCellValue(columns[3]!, rows[0]!)).toEqual({ date: '2024-03-01' });
        expect(xlsxCellValue({ id: 'active', header: 'Active' }, rows[0]!)).toBe(true);
        expect(xlsxCellValue(columns[4]!, rows[0]!)).toBe('Yes');
        expect(xlsxCellValue(columns[2]!, rows[2]!)).toBeNull();
    });

    it('Excel sheet: group rows with their totals, data rows below, a total row', () => {
        const summed: TableViewColumn<Server>[] = [
            { id: 'name', header: 'Name' },
            { id: 'load', header: 'Load', aggregate: 'sum' },
        ];
        const sheet = tableXlsxSheet(rows, summed, {
            name: 'Server',
            groupBy: column('city'),
            groupLabel: (group) => `${group.text} (${group.rows.length})`,
            totalLabel: 'Total',
        });
        expect(sheet.columns).toEqual([{ header: 'Name' }, { header: 'Load' }]);
        expect(sheet.rows.map((row) => [row.kind ?? 'data', ...row.cells])).toEqual([
            ['group', 'Cologne (1)', 40],
            ['data', 'srv-10', 40],
            ['group', 'Berlin (2)', 97],
            ['data', 'srv-2', 85],
            ['data', 'srv-3', 12],
            ['group', 'Nürnberg (1)', null],
            ['data', 'Srv-1', null],
            ['total', 'Total', 137],
        ]);
        expect(tableXlsxSheet(rows, summed, { totals: false }).rows).toHaveLength(4);
        // A real file: a zip archive (PK)
        const bytes = createXlsx(sheet);
        expect([bytes[0], bytes[1]]).toEqual([0x50, 0x4b]);
    });
});
