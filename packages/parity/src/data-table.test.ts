import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import {
    applyPending,
    changesByRow,
    treeGridKeyAction,
    autoRowSpans,
    collectErrors,
    crc32,
    createDataController,
    createXlsx,
    dataAnnouncement,
    dataSourceToRows,
    defineMatchMode,
    EditHistory,
    escapeXml,
    extendRange,
    findMatches,
    groupedRowMove,
    historyKey,
    inRange,
    isActiveConstraint,
    matchesColumnFilter,
    matchModeLabel,
    matchModesFor,
    messages,
    moveColumnBlock,
    moveTreeRow,
    numberSummary,
    parseCellText,
    parseTsv,
    pasteTargets,
    pendingValue,
    pivotTable,
    pivotView,
    printTableHtml,
    queryKey,
    rangeBounds,
    rangeIds,
    rowColumnSpans,
    rowsToDataSource,
    sameCellValue,
    tableSlots,
    toTsv,
    xlsxColumnName,
    xlsxSheetName,
    zipStore,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, render, toReact, type El } from './harness.js';
import { de as german } from '@wirecore/wirelayer-recipes/locales/de';

// The extended DataTable (PrimeVue feature set): sorting by several columns, filter menus, column menu, details,
// row order, selection modes, editing, totals and the saved state – in Vue and React alike

const fleet = [
    { id: 'web-01', name: 'web-01', location: 'Frankfurt', load: 42, since: '2024-03-01' },
    { id: 'db-primary', name: 'db-primary', location: 'Frankfurt', load: 71, since: '2023-11-15' },
    { id: 'k8s-node-3', name: 'k8s-node-3', location: 'Nuremberg', load: 18, since: '2025-06-30' },
];
const columns = [
    { id: 'name', header: 'Name', sortable: true, filter: 'text' },
    { id: 'location', header: 'Location', sortable: true, groupable: true },
    { id: 'load', header: 'Load', sortable: true, align: 'end', filter: 'number', aggregate: 'avg' },
];
const getRowId = (row: { id: string }) => row.id;
const rowLabel = (row: { name: string }) => row.name;
const names = () =>
    within(screen.getByRole('table'))
        .getAllByRole('row')
        .filter((row) => row.closest('tbody'))
        .map((row) => row.querySelector('td')?.textContent?.trim());

// Own match modes for all tables (registered once, like an app would)
defineMatchMode('arrayContains', {
    label: (locale) => (locale.startsWith('de') ? 'Enthält Eintrag' : 'Contains item'),
    types: ['select'],
    test: (value, filter) => Array.isArray(value) && value.includes(filter),
});
defineMatchMode('amountRange', {
    label: 'Amount from–to',
    range: true,
    input: 'number',
    test: (value, filter) => {
        const [from, to] = filter as [number | null, number | null];
        return (from === null || Number(value) >= from) && (to === null || Number(value) <= to);
    },
});

describe('DataTable logic', () => {
    it('treegrid keys and row edits from cell changes', () => {
        const closed = { expandable: true, expanded: false, level: 1 };
        expect(treeGridKeyAction('ArrowRight', closed)).toBe('expand');
        expect(treeGridKeyAction('ArrowLeft', closed, true)).toBe('expand');
        expect(treeGridKeyAction('ArrowLeft', { ...closed, expanded: true })).toBe('collapse');
        expect(treeGridKeyAction('ArrowLeft', { expandable: false, expanded: false, level: 2 })).toBe('parent');
        expect(treeGridKeyAction('ArrowLeft', closed)).toBeUndefined();
        expect(treeGridKeyAction('ArrowDown', closed)).toBeUndefined();
        const changes = [
            { rowId: 'a', columnId: 'x', before: 1, after: 2 },
            { rowId: 'b', columnId: 'x', before: 3, after: 4 },
            { rowId: 'a', columnId: 'y', before: 'p', after: 'q' },
        ];
        expect(changesByRow(changes)).toEqual([
            { rowId: 'a', values: { x: 2, y: 'q' } },
            { rowId: 'b', values: { x: 4 } },
        ]);
        expect(changesByRow(changes, true)).toEqual([
            { rowId: 'a', values: { y: 'p', x: 1 } },
            { rowId: 'b', values: { x: 3 } },
        ]);
    });

    const cell = (value: unknown, extra: Partial<Parameters<typeof matchesColumnFilter>[0]> = {}) => ({
        value,
        text: String(value),
        row: {},
        ...extra,
    });

    it('own match modes: in the menu of their types, with labels, ranges with open bounds', () => {
        expect(matchModesFor('select')).toEqual(['equals', 'notEquals', 'arrayContains']);
        expect(matchModesFor('number', ['gt', 'amountRange'])).toEqual(['gt', 'amountRange']);
        expect(matchModeLabel('arrayContains', {}, 'de-DE')).toBe('Enthält Eintrag');
        expect(matchModeLabel('arrayContains', {}, 'en-US')).toBe('Contains item');
        expect(matchModeLabel('gt', { gt: 'Größer als' }, 'de-DE')).toBe('Größer als');
        const tags = { operator: 'and' as const, constraints: [{ matchMode: 'arrayContains', value: 'web' }] };
        expect(matchesColumnFilter(cell(['web', 'db'], { type: 'select' }), tags)).toBe(true);
        expect(matchesColumnFilter(cell(['db'], { type: 'select' }), tags)).toBe(false);
        const range = (from: number | null, to: number | null) => ({
            operator: 'and' as const,
            constraints: [{ matchMode: 'amountRange', value: [from, to] }],
        });
        expect(isActiveConstraint({ matchMode: 'amountRange', value: [null, null] })).toBe(false);
        expect(matchesColumnFilter(cell(120), range(100, null))).toBe(true);
        expect(matchesColumnFilter(cell(80), range(100, null))).toBe(false);
        expect(matchesColumnFilter(cell(80), range(null, 90))).toBe(true);
        expect(matchesColumnFilter(cell(80), range(null, null))).toBe(true);
    });

    it('a column comparison replaces the match modes; select values compare the value, not the text', () => {
        const filterFn = vi.fn((value: unknown, filter: unknown) => Number(value) % Number(filter) === 0);
        expect(matchesColumnFilter(cell(12, { filterFn, type: 'number' }), '4')).toBe(true);
        expect(filterFn).toHaveBeenCalledWith(12, '4', {}, 'equals');
        expect(matchesColumnFilter(cell(13, { filterFn }), '4')).toBe(false);
        const status = { value: 2, text: 'Two', row: {}, type: 'select' as const, byValue: true };
        const equals = (value: unknown) => ({
            operator: 'and' as const,
            constraints: [{ matchMode: 'equals', value }],
        });
        expect(matchesColumnFilter(status, equals(2))).toBe(true);
        expect(matchesColumnFilter(status, equals('Two'))).toBe(false);
        const many = { operator: 'and' as const, constraints: [{ matchMode: 'in', value: [{ id: 1 }, 2] }] };
        expect(matchesColumnFilter({ ...status, type: 'multiSelect' }, many)).toBe(true);
        expect(matchesColumnFilter({ ...status, value: { id: 1 }, type: 'multiSelect' }, many)).toBe(true);
        expect(matchesColumnFilter({ ...status, value: 3, type: 'multiSelect' }, many)).toBe(false);
    });

    it('built-in ranges keep open bounds and include the last day', () => {
        const between = (value: unknown) => ({
            operator: 'and' as const,
            constraints: [{ matchMode: 'between', value }],
        });
        const day = (value: string) => cell(value, { type: 'date' });
        expect(matchesColumnFilter(day('2026-10-31T18:00'), between([null, '2026-10-31']))).toBe(true);
        expect(matchesColumnFilter(day('2026-11-01'), between([null, '2026-10-31']))).toBe(false);
        expect(matchesColumnFilter(cell(5, { type: 'number' }), between([5, null]))).toBe(true);
    });

    it('sum and average of numbers; checks that answer later', async () => {
        expect(numberSummary([42, 71, null])).toEqual({ sum: 113, avg: 56.5, count: 2 });
        expect(numberSummary(['42', 71])).toBeNull();
        expect(numberSummary([])).toBeNull();
        expect(
            collectErrors([
                ['a', () => undefined],
                ['b', () => 'Required'],
            ])
        ).toEqual({ b: 'Required' });
        const later = collectErrors([
            ['a', () => Promise.resolve('Already taken')],
            ['b', () => undefined],
        ]);
        expect(later).toBeInstanceOf(Promise);
        expect(await later).toEqual({ a: 'Already taken' });
    });

    it('lays out header cells with row and column spans', () => {
        const cells = (...spans: [string, number, number][]) =>
            spans.map(([name, rowSpan, colSpan]) => ({ name, rowSpan, colSpan }));
        const slots = tableSlots(
            [cells(['select', 2, 1], ['name', 2, 1], ['usage', 1, 2]), cells(['load', 1, 1], ['since', 1, 1])],
            (item) => item
        );
        expect(slots.map((row) => row.map((item) => item.name))).toEqual([
            ['select', 'name', 'usage', 'usage'],
            ['select', 'name', 'load', 'since'],
        ]);
    });
});

/** Files of a ZIP archive by name – read from the central directory, stored entries only */
function unzip(bytes: Uint8Array) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const end = bytes.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    const count = view.getUint16(end + 10, true);
    let offset = view.getUint32(end + 16, true);
    const files = new Map<string, { data: Uint8Array; crc: number; method: number }>();
    const decoder = new TextDecoder();
    for (let index = 0; index < count; index++) {
        expect(view.getUint32(offset, true)).toBe(0x02014b50);
        const method = view.getUint16(offset + 10, true);
        const crc = view.getUint32(offset + 16, true);
        const size = view.getUint32(offset + 24, true);
        const nameLength = view.getUint16(offset + 28, true);
        const local = view.getUint32(offset + 42, true);
        const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
        expect(view.getUint32(local, true)).toBe(0x04034b50);
        const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
        files.set(name, { data: bytes.subarray(start, start + size), crc, method });
        offset += 46 + nameLength;
    }
    return files;
}

describe('DataTable sheet logic', () => {
    it('CRC-32 and a stored ZIP archive', () => {
        expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
        const files = unzip(
            zipStore([
                { name: 'a.txt', data: 'Grüße' },
                { name: 'b/c.bin', data: new Uint8Array([1, 2]) },
            ])
        );
        expect([...files.keys()]).toEqual(['a.txt', 'b/c.bin']);
        const text = files.get('a.txt')!;
        expect(new TextDecoder().decode(text.data)).toBe('Grüße');
        expect(text.method).toBe(0);
        expect(text.crc).toBe(crc32(text.data));
    });

    it('XLSX: the parts of a workbook, valid XML, numbers, dates, bold header, widths, escaped text', () => {
        const bytes = createXlsx({
            name: 'Server: Overview/2026 [all]',
            columns: [{ header: 'Name' }, { header: 'Cores', width: 12 }, { header: 'Since' }, { header: 'Online' }],
            rows: [
                { kind: 'group', cells: ['Location: Frankfurt (2)', 6, null, null] },
                { cells: ['web <01> & "Co" \'x\'\u0001', 2, { date: '2026-10-21' }, true], level: 1 },
                { cells: ['=1+1', 4, { date: '2026-10-21T14:30', time: true }, false], level: 1 },
                { kind: 'total', cells: ['Total', 6, null, null] },
            ],
        });
        const files = unzip(bytes);
        expect([...files.keys()]).toEqual([
            '[Content_Types].xml',
            '_rels/.rels',
            'xl/workbook.xml',
            'xl/_rels/workbook.xml.rels',
            'xl/styles.xml',
            'xl/worksheets/sheet1.xml',
        ]);
        const parse = (name: string) => {
            const file = files.get(name)!;
            expect(file.crc).toBe(crc32(file.data));
            const xml = new DOMParser().parseFromString(new TextDecoder().decode(file.data), 'application/xml');
            expect(xml.getElementsByTagName('parsererror')).toHaveLength(0);
            return xml;
        };
        for (const name of files.keys()) parse(name);
        expect(parse('xl/workbook.xml').querySelector('sheet')!.getAttribute('name')).toBe(
            'Server  Overview 2026  all'
        );
        const sheet = parse('xl/worksheets/sheet1.xml');
        const cell = (reference: string) => sheet.querySelector(`c[r="${reference}"]`)!;
        // Header bold (style 1), group and total rows bold
        expect(cell('A1').getAttribute('s')).toBe('1');
        expect(cell('A1').textContent).toBe('Name');
        expect(cell('A2').getAttribute('s')).toBe('1');
        expect(cell('B5').getAttribute('s')).toBe('1');
        // Escaped text, control characters dropped; a formula-like text stays text
        expect(cell('A3').getAttribute('t')).toBe('inlineStr');
        expect(cell('A3').textContent).toBe('web <01> & "Co" \'x\'');
        expect(new TextDecoder().decode(files.get('xl/worksheets/sheet1.xml')!.data)).toContain(
            'web &lt;01&gt; &amp; &quot;Co&quot; &apos;x&apos;'
        );
        expect(cell('A4').querySelector('f')).toBeNull();
        expect(cell('A4').textContent).toBe('=1+1');
        // Numbers as numbers, dates as serial numbers with a date format, yes/no as booleans
        expect(cell('B3').getAttribute('t')).toBeNull();
        expect(cell('B3').textContent).toBe('2');
        expect(cell('C3').getAttribute('s')).toBe('2');
        expect(Number(cell('C3').textContent)).toBe(46316);
        expect(cell('C4').getAttribute('s')).toBe('3');
        expect(Number(cell('C4').textContent)).toBeCloseTo(46316 + 14.5 / 24, 6);
        expect(cell('D3').getAttribute('t')).toBe('b');
        expect(sheet.querySelector('row[r="3"]')!.getAttribute('outlineLevel')).toBe('1');
        // Widths: given, or fitting the longest value; the header row frozen
        const widths = [...sheet.querySelectorAll('col')].map((col) => Number(col.getAttribute('width')));
        expect(widths[1]).toBe(12);
        expect(widths[0]).toBeGreaterThan(20);
        expect(sheet.querySelector('pane')!.getAttribute('state')).toBe('frozen');
        expect(xlsxColumnName(0)).toBe('A');
        expect(xlsxColumnName(27)).toBe('AB');
        expect(xlsxSheetName('')).toBe('Sheet1');
        expect(escapeXml('a<b')).toBe('a&lt;b');
    });

    it('TSV: copies like Excel and reads quoted cells, line breaks and a trailing line break', () => {
        expect(
            toTsv([
                ['a', 'b\tc'],
                ['Line\n2', '"x"'],
            ])
        ).toBe('a\t"b\tc"\r\n"Line\n2"\t"""x"""');
        expect(parseTsv('a\t"b\tc"\r\n"Line\n2"\t"""x"""\r\n')).toEqual([
            ['a', 'b\tc'],
            ['Line\n2', '"x"'],
        ]);
        expect(parseTsv('1,5\t\t3\n')).toEqual([['1,5', '', '3']]);
        expect(parseTsv('')).toEqual([]);
    });

    it('reads pasted values per column type: German numbers and dates, yes/no, choices', () => {
        expect(parseCellText('1.234,5', 'number')).toEqual({ value: 1234.5 });
        expect(parseCellText('1,234.5', 'number', { locale: 'en-US' })).toEqual({ value: 1234.5 });
        expect(parseCellText('viel', 'number')).toEqual({ error: 'number' });
        expect(parseCellText('', 'number')).toEqual({ value: null });
        expect(parseCellText('21.10.2026', 'date')).toEqual({ value: '2026-10-21' });
        expect(parseCellText('1.2.26', 'date')).toEqual({ value: '2026-02-01' });
        expect(parseCellText('2026-10-21', 'date')).toEqual({ value: '2026-10-21' });
        expect(parseCellText('10/21/2026', 'date', { locale: 'en-US' })).toEqual({ value: '2026-10-21' });
        expect(parseCellText('31.02.2026', 'date')).toEqual({ error: 'date' });
        expect(parseCellText('21.10.2026 14:30', 'datetime')).toEqual({ value: '2026-10-21T14:30' });
        expect(parseCellText('Ja', 'checkbox')).toEqual({ value: true });
        expect(parseCellText('falsch', 'checkbox')).toEqual({ value: false });
        expect(parseCellText('vielleicht', 'checkbox')).toEqual({ error: 'boolean' });
        const choices = [
            { value: 'fra', label: 'Frankfurt' },
            { value: 'vie', label: 'Vienna' },
        ];
        expect(parseCellText('vienna', 'select', { choices })).toEqual({ value: 'vie' });
        expect(parseCellText('Berlin', 'select', { choices })).toEqual({ error: 'option' });
        expect(parseCellText('Vienna, fra', 'multiSelect', { choices })).toEqual({ value: ['vie', 'fra'] });
        expect(parseCellText(' Text ', 'text')).toEqual({ value: ' Text ' });
    });

    it('cell ranges: bounds, extending with the keys, paste targets and filling a range', () => {
        const rows = ['r1', 'r2', 'r3'];
        const cols = ['a', 'b', 'c'];
        const range = { anchor: { rowId: 'r2', columnId: 'b' }, focus: { rowId: 'r1', columnId: 'c' } };
        expect(rangeBounds(range, rows, cols)).toEqual({ top: 0, bottom: 1, left: 1, right: 2 });
        expect(rangeIds(range, rows, cols)).toEqual({ rowIds: ['r1', 'r2'], columnIds: ['b', 'c'] });
        expect(inRange(rangeBounds(range, rows, cols), 1, 1)).toBe(true);
        expect(inRange(rangeBounds(range, rows, cols), 2, 1)).toBe(false);
        expect(extendRange(range, rows, cols, 'down').focus).toEqual({ rowId: 'r2', columnId: 'c' });
        expect(extendRange(range, rows, cols, 'previous', true).focus).toEqual({ rowId: 'r1', columnId: 'a' });
        expect(extendRange(range, rows, cols, 'down', true).anchor).toEqual(range.anchor);
        expect(
            pasteTargets(
                [
                    ['1', '2'],
                    ['3', '4'],
                ],
                { row: 2, column: 1 },
                rows,
                cols
            )
        ).toEqual([
            { rowId: 'r3', columnId: 'b', text: '1' },
            { rowId: 'r3', columnId: 'c', text: '2' },
        ]);
        expect(pasteTargets([['x']], { row: 0, column: 1 }, rows, cols, rangeBounds(range, rows, cols))).toHaveLength(
            4
        );
    });

    it('undo stack and collected changes: undo, redo, a change back to the original is not pending', () => {
        const history = new EditHistory(2);
        const first = [{ rowId: 'r1', columnId: 'a', before: 1, after: 2 }];
        const second = [{ rowId: 'r1', columnId: 'a', before: 2, after: 3 }];
        history.push(first);
        history.push(second);
        expect(history.canUndo).toBe(true);
        expect(history.undo()).toBe(second);
        expect(history.canRedo).toBe(true);
        expect(history.redo()).toBe(second);
        history.push([{ rowId: 'r2', columnId: 'a', before: 0, after: 1 }]);
        // Only two steps kept
        expect(history.undo()).toBeDefined();
        expect(history.undo()).toBe(second);
        expect(history.undo()).toBeUndefined();
        expect(historyKey({ key: 'z', ctrlKey: true, metaKey: false, shiftKey: false, altKey: false })).toBe('undo');
        expect(historyKey({ key: 'Z', ctrlKey: true, metaKey: false, shiftKey: true, altKey: false })).toBe('redo');
        expect(historyKey({ key: 'y', ctrlKey: false, metaKey: true, shiftKey: false, altKey: false })).toBe('redo');
        expect(
            historyKey({ key: 'z', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false })
        ).toBeUndefined();

        let pending = applyPending({}, first);
        pending = applyPending(pending, second);
        expect(pendingValue(pending, 'r1', 'a')).toEqual({ value: 3 });
        expect(Object.values(pending)).toEqual([{ rowId: 'r1', columnId: 'a', before: 1, after: 3 }]);
        pending = applyPending(pending, second, true);
        pending = applyPending(pending, first, true);
        expect(pending).toEqual({});
        expect(sameCellValue(['a'], ['a'])).toBe(true);
        expect(sameCellValue(null, '')).toBe(true);
    });

    it('pivot: rows and columns from the values, aggregates, totals per row and column', () => {
        const sales = [
            { region: 'North', year: 2025, product: 'A', amount: 10 },
            { region: 'North', year: 2026, product: 'A', amount: 20 },
            { region: 'South', year: 2025, product: 'B', amount: 5 },
            { region: 'North', year: 2025, product: 'B', amount: 1 },
        ];
        const config = { rows: ['region'], columns: ['year'], values: [{ id: 'amount', aggregate: 'sum' as const }] };
        const result = pivotTable(sales, config, (row, id) => row[id as keyof typeof row]);
        expect(result.rows.map((row) => row.labels)).toEqual([['North'], ['South']]);
        expect(result.columns.map((column) => column.labels)).toEqual([['2025'], ['2026']]);
        const [north, south] = result.rows;
        const [y2025, y2026] = result.columns;
        expect(result.cell(north!.key, y2025!.key, 'amount')).toBe(11);
        expect(result.cell(south!.key, y2026!.key, 'amount')).toBeNull();
        expect(result.cell(north!.key, '', 'amount')).toBe(31);
        expect(result.total(y2025!.key, 'amount')).toBe(16);
        expect(result.total('', 'amount')).toBe(36);
        const view = pivotView(result, config, {
            header: (id) => ({ region: 'Region', amount: 'Revenue' })[id] ?? id,
            format: (value) => (value === null ? '' : String(value)),
        });
        expect(view.columns.map((column) => column.header)).toEqual(['Region', '2025', '2026', 'Total']);
        expect(view.columns.map((column) => column.footer)).toEqual(['Total', '16', '20', '36']);
        expect(view.rows[0]).toMatchObject({ region: 'North', [view.columns[1]!.id]: 11, [view.columns[3]!.id]: 31 });
        // Two values: a column group per year
        const two = pivotView(
            pivotTable(
                sales,
                { ...config, values: [...config.values, { id: 'amount', aggregate: 'count', header: 'Count' }] },
                (row, id) => row[id as keyof typeof row]
            ),
            { ...config, values: [...config.values, { id: 'amount', aggregate: 'count', header: 'Count' }] }
        );
        expect(two.columns[1]!.columns).toHaveLength(2);
    });

    it('merged cells: equal values below each other, nested, broken by group rows; column spans', () => {
        expect(
            autoRowSpans([
                ['North', 'North', 'North', 'South', 'South'],
                ['A', 'A', 'B', 'B', 'B'],
            ])
        ).toEqual([
            [3, 0, 0, 2, 0],
            [2, 0, 1, 2, 0],
        ]);
        expect(autoRowSpans([['x', 'x', 'x']], [false, false, true])).toEqual([[2, 0, 1]]);
        expect(autoRowSpans([[null, null]])).toEqual([[1, 1]]);
        expect(rowColumnSpans([2, 1, 1, 5])).toEqual([2, 0, 1, 1]);
        expect(rowColumnSpans([1, 3, 1, 1])).toEqual([1, 3, 0, 0]);
    });

    it('find, moving column groups and rows between groups', () => {
        const rows = [
            {
                id: 'r1',
                cells: [
                    { columnId: 'name', text: 'Nürnberg' },
                    { columnId: 'os', text: 'Debian' },
                ],
            },
            {
                id: 'r2',
                cells: [
                    { columnId: 'name', text: 'Vienna' },
                    { columnId: 'os', text: 'debian' },
                ],
            },
        ];
        expect(findMatches(rows, 'nurn')).toEqual([{ rowId: 'r1', columnId: 'name' }]);
        expect(findMatches(rows, 'DEB')).toHaveLength(2);
        expect(findMatches(rows, ' ')).toEqual([]);
        const blocks = [
            { id: 'name', leaves: ['name'] },
            { id: 'usage', leaves: ['cpu', 'ram'] },
            { id: 'os', leaves: ['os'] },
        ];
        expect(moveColumnBlock(['name', 'ram', 'cpu', 'os'], blocks, 'usage', 1)).toEqual(['name', 'os', 'ram', 'cpu']);
        expect(moveColumnBlock(['name', 'cpu', 'ram', 'os'], blocks, 'usage', -1)).toEqual([
            'cpu',
            'ram',
            'name',
            'os',
        ]);
        expect(moveColumnBlock(['name', 'cpu', 'ram', 'os'], blocks, 'name', -1)).toBeUndefined();
        const grouped = [
            { id: 'a', group: 'F' },
            { id: 'b', group: 'F' },
            { id: 'c', group: 'N' },
        ];
        expect(groupedRowMove(grouped, 'a', 'down')).toEqual({ targetId: 'b', after: true, groupChanged: false });
        expect(groupedRowMove(grouped, 'b', 'down')).toEqual({ targetId: 'c', after: false, groupChanged: true });
        expect(groupedRowMove(grouped, 'c', 'up')).toEqual({ targetId: 'b', after: true, groupChanged: true });
        expect(groupedRowMove(grouped, 'a', 'up')).toBeUndefined();
    });

    it('print document: header on every page, escaped text, no controls', () => {
        const page = printTableHtml({
            title: 'Server <List>',
            caption: 'Server',
            head: [[{ text: 'Name' }, { text: 'Load', align: 'end' }]],
            body: [
                { kind: 'group', cells: [{ text: 'Frankfurt', colSpan: 2 }] },
                { cells: [{ text: 'web & co' }, { text: '42', align: 'end' }] },
            ],
            foot: [{ text: 'Total' }, { text: '42', align: 'end' }],
        });
        expect(page).toContain('thead{display:table-header-group}');
        const doc = new DOMParser().parseFromString(page, 'text/html');
        expect(doc.title).toBe('Server <List>');
        expect(doc.querySelectorAll('thead th')).toHaveLength(2);
        expect(doc.querySelector('tbody tr.group td')!.getAttribute('colspan')).toBe('2');
        expect(doc.querySelector('tbody tr:not(.group) td')!.textContent).toBe('web & co');
        expect(doc.querySelectorAll('button, input')).toHaveLength(0);
        expect(doc.querySelector('tfoot td.end')!.textContent).toBe('42');
    });
});

describe('Data source controller', () => {
    const deferred = <T>() => {
        let resolve!: (value: T) => void;
        const promise = new Promise<T>((done) => (resolve = done));
        return { promise, resolve };
    };

    it('aborts outdated requests and keeps only the newest answer', async () => {
        const answers: ReturnType<typeof deferred<{ items: string[]; totalCount: number }>>[] = [];
        const signals: AbortSignal[] = [];
        const controller = createDataController<string>({
            source: {
                getItems: (request) => {
                    signals.push(request.signal);
                    const answer = deferred<{ items: string[]; totalCount: number }>();
                    answers.push(answer);
                    return answer.promise;
                },
            },
        });
        const first = controller.load({ page: 1 });
        const second = controller.load({ page: 2 });
        expect(signals[0]!.aborted).toBe(true);
        expect(signals[1]!.aborted).toBe(false);
        answers[1]!.resolve({ items: ['b'], totalCount: 2 });
        await second;
        // The late answer of the first request does not overwrite the newer one
        answers[0]!.resolve({ items: ['a'], totalCount: 1 });
        await first;
        expect(controller.current).toMatchObject({
            status: 'success',
            items: ['b'],
            totalCount: 2,
            query: { page: 2 },
        });
    });

    it('caches answers per query for the ttl, refresh asks again, errors keep the items', async () => {
        let time = 0;
        let calls = 0;
        let fail = false;
        const states: string[] = [];
        const controller = createDataController<number>({
            ttl: 1000,
            now: () => time,
            onChange: (state) => states.push(state.status),
            source: {
                getItems: async (request) => {
                    calls++;
                    if (fail) throw new Error('offline');
                    return { items: [request.page ?? 0], totalCount: 1 };
                },
            },
        });
        await controller.load({ page: 1, sorting: [{ id: 'a', desc: false }] });
        await controller.load({ sorting: [{ desc: false, id: 'a' }], page: 1 });
        expect(calls).toBe(1);
        time = 2000;
        await controller.load({ page: 1, sorting: [{ id: 'a', desc: false }] });
        expect(calls).toBe(2);
        fail = true;
        await controller.refresh();
        expect(calls).toBe(3);
        expect(controller.current).toMatchObject({ status: 'error', items: [1] });
        expect(states).toContain('loading');
        expect(queryKey({ page: 1, search: undefined })).toBe(queryKey({ page: 1 }));
        expect(dataAnnouncement(controller.current, german, 'de-DE')).toBe('Die Daten konnten nicht geladen werden.');
        expect(dataAnnouncement({ status: 'success', items: [1], totalCount: 1 }, german, 'de-DE')).toBe(
            '1 Eintrag geladen'
        );
        expect(dataAnnouncement({ status: 'success', items: [], totalCount: 1234 }, german, 'de-DE')).toBe(
            '1.234 Einträge geladen'
        );
        expect(dataAnnouncement({ status: 'success', items: [], totalCount: 1 }, messages.en, 'en-US')).toBe(
            '1 item loaded'
        );
    });

    it('waits for a pause while typing; adapters between getRows and getItems', async () => {
        vi.useFakeTimers();
        try {
            const getItems = vi.fn(async (request: { search?: string }) => ({
                items: [request.search],
                totalCount: 1,
            }));
            const controller = createDataController({ source: { getItems }, debounce: 200 });
            const typed = controller.load({ search: 'w' }, { debounce: true });
            const last = controller.load({ search: 'web' }, { debounce: true });
            await vi.advanceTimersByTimeAsync(199);
            expect(getItems).not.toHaveBeenCalled();
            await vi.advanceTimersByTimeAsync(1);
            await Promise.all([typed, last]);
            expect(getItems).toHaveBeenCalledTimes(1);
            expect(controller.current.items).toEqual(['web']);
        } finally {
            vi.useRealTimers();
        }
        const getRows = vi.fn(async (request: { page: number; pageSize: number }) => ({
            rows: [`Page ${request.page}`],
            rowCount: 40,
        }));
        const source = rowsToDataSource(getRows);
        const signal = new AbortController().signal;
        expect(await source.getItems({ page: 2, pageSize: 20, signal })).toEqual({
            items: ['Page 2'],
            totalCount: 40,
        });
        expect(getRows).toHaveBeenLastCalledWith(
            expect.objectContaining({ page: 2, pageSize: 20, sorting: [], filters: {}, search: '', groupBy: [] })
        );
        const back = dataSourceToRows(source);
        expect(
            await back({ page: 3, pageSize: 20, sorting: [], filters: {}, search: '', groupBy: [], signal })
        ).toEqual({
            rows: ['Page 3'],
            rowCount: 40,
        });
    });
});

describe.each(frameworks)('%s DataTable', (framework) => {
    const on = (vue: string, react: string) => (framework === 'vue' ? vue : react);
    const table = (props: Record<string, unknown> = {}) =>
        el('DataTable', { data: fleet, columns, caption: 'Server', getRowId, rowLabel, ...props });

    it('sorts by several columns with Shift+click and names the sort levels', async () => {
        const onSorting = vi.fn();
        await render(
            framework,
            table({ sortMode: 'multiple', [on('onUpdate:sorting', 'onSortingChange')]: onSorting })
        );
        const location = screen.getByRole('columnheader', { name: /Location/ });
        const load = screen.getByRole('columnheader', { name: /Load/ });
        const user = userEvent.setup();
        await user.click(within(location).getByRole('button'));
        await user.keyboard('{Shift>}');
        await user.click(within(load).getByRole('button'));
        await user.keyboard('{/Shift}');
        expect(onSorting).toHaveBeenLastCalledWith([
            { id: 'location', desc: false },
            { id: 'load', desc: false },
        ]);
        expect(location).toHaveAttribute('aria-sort', 'ascending');
        expect(load).toHaveAttribute('aria-sort', 'none');
        expect(within(load).getByRole('button')).toHaveTextContent('sort level 2, ascending');
        expect(names()).toEqual(['web-01', 'db-primary', 'k8s-node-3']);
    });

    it('filters with conditions in the filter menu', async () => {
        const onFilters = vi.fn();
        await render(
            framework,
            table({ filterDisplay: 'menu', [on('onUpdate:filters', 'onFiltersChange')]: onFilters })
        );
        await userEvent.click(screen.getByRole('button', { name: 'Filter for Name' }));
        const dialog = await screen.findByRole('dialog', { name: 'Filter for Name' });
        await userEvent.type(within(dialog).getByRole('textbox', { name: 'Value 1' }), 'node{Enter}');
        expect(onFilters).toHaveBeenLastCalledWith({
            name: { operator: 'and', constraints: [{ matchMode: 'contains', value: 'node' }] },
        });
        expect(names()).toEqual(['k8s-node-3']);
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'Filter for Name, active' })).toHaveFocus();

        // A second condition joined with "or"
        await userEvent.click(screen.getByRole('button', { name: 'Filter for Name, active' }));
        const again = await screen.findByRole('dialog', { name: 'Filter for Name' });
        await userEvent.click(within(again).getByRole('button', { name: 'Add condition' }));
        await userEvent.type(within(again).getByRole('textbox', { name: 'Value 2' }), 'web');
        expect(within(again).getByRole('combobox', { name: 'Combine' })).toBeInTheDocument();
        await userEvent.click(within(again).getByRole('button', { name: 'Apply' }));
        // "and" by default: no name contains both
        expect(names()).toEqual(['No entries']);
        await userEvent.click(screen.getByRole('button', { name: 'Filter for Name, active' }));
        await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Clear' }));
        expect(names()).toHaveLength(3);
    });

    it('filters numbers in the filter row', async () => {
        await render(framework, table());
        await userEvent.type(screen.getByRole('spinbutton', { name: 'Filter Load' }), '71');
        await waitFor(() => expect(names()).toEqual(['db-primary']));
        expect(screen.getAllByRole('status')[0]).toHaveTextContent('1 entry');
    });

    it('column menu: hide, move and pin columns', async () => {
        const onHidden = vi.fn();
        const onPinned = vi.fn();
        await render(
            framework,
            table({
                columnMenu: true,
                reorderableColumns: true,
                [on('onUpdate:hiddenColumns', 'onHiddenColumnsChange')]: onHidden,
                [on('onUpdate:pinnedColumns', 'onPinnedColumnsChange')]: onPinned,
            })
        );
        await userEvent.click(screen.getByRole('button', { name: 'Options for Name' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Move one column forward' }));
        await waitFor(() =>
            expect(screen.getAllByRole('columnheader').map((header) => header.textContent?.trim())).toEqual([
                'Location',
                'Name',
                'Load',
            ])
        );
        await waitFor(() => expect(screen.getAllByRole('status')[0]).toHaveTextContent('Name is now column 2 of 3'));

        await userEvent.click(screen.getByRole('button', { name: 'Options for Load' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Pin to start' }));
        expect(onPinned).toHaveBeenLastCalledWith({ start: ['load'], end: [] });

        await userEvent.click(screen.getByRole('button', { name: 'Options for Location' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Hide' }));
        expect(onHidden).toHaveBeenLastCalledWith(['location']);
        expect(screen.queryByRole('columnheader', { name: /Location/ })).not.toBeInTheDocument();
    });

    it('groups by a column from the column menu, with averages per group', async () => {
        const onGroupBy = vi.fn();
        await render(framework, table({ columnMenu: true, [on('onUpdate:groupBy', 'onGroupByChange')]: onGroupBy }));
        await userEvent.click(screen.getByRole('button', { name: 'Options for Location' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Group by this column' }));
        expect(onGroupBy).toHaveBeenLastCalledWith(['location']);
        const group = screen.getByRole('button', { name: 'Location: Frankfurt, 2 entries' });
        expect(group.closest('tr')).toHaveTextContent('56.5');
    });

    it('opens the details of a row', async () => {
        await render(
            framework,
            table({ $render: { expansion: (row: { name: string }) => el('p', {}, `Maintenance plan ${row.name}`) } })
        );
        const toggle = screen.getByRole('button', { name: 'Details of db-primary' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        const details = document.getElementById(toggle.getAttribute('aria-controls')!);
        expect(details).toHaveTextContent('Maintenance plan db-primary');
        await userEvent.click(screen.getByRole('button', { name: 'Expand all rows' }));
        expect(screen.getByText('Maintenance plan k8s-node-3')).toBeInTheDocument();
    });

    it('moves rows with the arrow keys on the drag handle', async () => {
        const onReorder = vi.fn();
        await render(framework, table({ reorderableRows: true, onRowReorder: onReorder }));
        screen.getByRole('button', { name: 'Move web-01' }).focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onReorder).toHaveBeenLastCalledWith(expect.objectContaining({ rowId: 'web-01', from: 0, to: 1 }));
        await waitFor(() =>
            expect(screen.getAllByRole('status')[0]).toHaveTextContent('web-01 is now at position 2 of 3')
        );
        screen.getByRole('button', { name: 'Move k8s-node-3' }).focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(onReorder).toHaveBeenLastCalledWith(expect.objectContaining({ rowId: 'k8s-node-3', from: 2, to: 1 }));
    });

    it('selects one row with radio buttons, or a range with Shift', async () => {
        const onSelection = vi.fn();
        await render(
            framework,
            table({
                selectable: true,
                selectionMode: 'single',
                [on('onUpdate:selection', 'onSelectionChange')]: onSelection,
            })
        );
        await userEvent.click(screen.getByRole('radio', { name: 'Select k8s-node-3' }));
        expect(onSelection).toHaveBeenLastCalledWith(['k8s-node-3']);
        await userEvent.click(screen.getByRole('radio', { name: 'Select web-01' }));
        expect(onSelection).toHaveBeenLastCalledWith(['web-01']);
    });

    it('selects a range with Shift+click and rows by clicking them', async () => {
        const onSelection = vi.fn();
        await render(
            framework,
            table({
                selectable: true,
                selectOnRowClick: true,
                [on('onUpdate:selection', 'onSelectionChange')]: onSelection,
            })
        );
        const user = userEvent.setup();
        await user.click(screen.getByRole('checkbox', { name: 'Select web-01' }));
        await user.keyboard('{Shift>}');
        await user.click(screen.getByRole('checkbox', { name: 'Select k8s-node-3' }));
        await user.keyboard('{/Shift}');
        expect(onSelection.mock.lastCall?.[0]).toEqual(['web-01', 'db-primary', 'k8s-node-3']);
        await user.click(screen.getByText('k8s-node-3'));
        expect(onSelection).toHaveBeenLastCalledWith(['web-01', 'db-primary']);
    });

    it('rows that cannot be selected have a disabled checkbox', async () => {
        await render(
            framework,
            table({ selectable: true, isRowSelectable: (row: { id: string }) => row.id !== 'db-primary' })
        );
        expect(screen.getByRole('checkbox', { name: 'Select db-primary' })).toBeDisabled();
        expect(screen.getByRole('checkbox', { name: 'Select web-01' })).toBeEnabled();
    });

    it('edits cells: Tab moves on, an invalid value keeps the editor, Escape cancels', async () => {
        const onEdit = vi.fn();
        await render(
            framework,
            table({
                columns: [
                    {
                        id: 'name',
                        header: 'Name',
                        editable: true,
                        validate: (value: unknown) => (value ? undefined : 'Please enter a name'),
                    },
                    { id: 'load', header: 'Load', editable: true, editor: 'number' },
                ],
                onCellEdit: onEdit,
            })
        );
        await userEvent.click(screen.getByRole('button', { name: 'web-01, edit Name' }));
        const input = screen.getByRole('textbox', { name: 'Name' });
        await waitFor(() => expect(input).toHaveFocus());
        await userEvent.clear(input);
        await userEvent.keyboard('{Enter}');
        expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a name');
        expect(onEdit).not.toHaveBeenCalled();
        await userEvent.type(input, 'web-11');
        await userEvent.keyboard('{Tab}');
        expect(onEdit).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'web-01', columnId: 'name', value: 'web-11' })
        );
        // The next editable cell of the row is open
        await waitFor(() => expect(screen.getByRole('spinbutton', { name: 'Load' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.getByRole('button', { name: '42, edit Load' })).toHaveFocus());
    });

    it('edits a whole row and saves it', async () => {
        const onRowEdit = vi.fn();
        await render(
            framework,
            table({
                editMode: 'row',
                columns: [
                    { id: 'name', header: 'Name', editable: true },
                    { id: 'location', header: 'Location' },
                ],
                onRowEdit,
            })
        );
        await userEvent.click(screen.getByRole('button', { name: 'Edit db-primary' }));
        const input = screen.getByRole('textbox', { name: 'Name' });
        await userEvent.clear(input);
        await userEvent.type(input, 'db-main');
        await userEvent.click(screen.getByRole('button', { name: 'Save db-primary' }));
        expect(onRowEdit).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'db-primary', values: { name: 'db-main' } })
        );
        await waitFor(() => expect(screen.getByRole('button', { name: 'Edit db-primary' })).toHaveFocus());
    });

    it('frozen rows are editable like the others (cell mode)', async () => {
        const onEdit = vi.fn();
        const columns = [
            { id: 'name', header: 'Name', editable: true },
            { id: 'location', header: 'Location' },
        ];
        await render(framework, table({ frozenRows: ['db-primary'], columns, onCellEdit: onEdit }));
        await userEvent.click(screen.getByRole('button', { name: 'db-primary, edit Name' }));
        const input = screen.getByRole('textbox', { name: 'Name' });
        await waitFor(() => expect(input).toHaveFocus());
        await userEvent.clear(input);
        await userEvent.type(input, 'db-main{Enter}');
        expect(onEdit).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'db-primary', columnId: 'name', value: 'db-main' })
        );
    });

    it('frozen rows: row editing', async () => {
        const onRowEdit = vi.fn();
        const columns = [
            { id: 'name', header: 'Name', editable: true },
            { id: 'location', header: 'Location' },
        ];
        await render(framework, table({ frozenRows: ['db-primary'], columns, editMode: 'row', onRowEdit }));
        await userEvent.click(screen.getByRole('button', { name: 'Edit db-primary' }));
        const row = screen.getByRole('textbox', { name: 'Name' });
        await userEvent.clear(row);
        await userEvent.type(row, 'db-1');
        await userEvent.click(screen.getByRole('button', { name: 'Save db-primary' }));
        expect(onRowEdit).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'db-primary', values: { name: 'db-1' } })
        );
    });

    it('row actions in a menu per row', async () => {
        const onAction = vi.fn();
        await render(framework, table({ rowActions: [{ value: 'restart', label: 'Restart' }], onRowAction: onAction }));
        await userEvent.click(screen.getByRole('button', { name: 'Actions for k8s-node-3' }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Restart' }));
        expect(onAction).toHaveBeenLastCalledWith(expect.objectContaining({ value: 'restart', rowId: 'k8s-node-3' }));
    });

    it('totals in the footer and column groups in the header', async () => {
        await render(
            framework,
            table({
                columns: [
                    { id: 'name', header: 'Name', footer: 'Total' },
                    {
                        id: 'usage',
                        header: 'Usage',
                        columns: [
                            { id: 'load', header: 'Load', aggregate: 'sum' },
                            { id: 'since', header: 'Since', aggregate: 'count' },
                        ],
                    },
                ],
            })
        );
        expect(screen.getByRole('columnheader', { name: 'Usage' })).toHaveAttribute('colspan', '2');
        expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('rowspan', '2');
        const footer = screen.getByRole('table').querySelector('tfoot')!;
        expect(footer).toHaveTextContent('Total');
        expect(footer).toHaveTextContent('Total 131');
        expect(footer).toHaveTextContent('Count 3');
    });

    it('restores and saves the state under stateKey', async () => {
        sessionStorage.setItem(
            'wirecore-table:server-test',
            JSON.stringify({ sorting: [{ id: 'load', desc: true }], hiddenColumns: ['location'] })
        );
        await render(framework, table({ stateKey: 'server-test' }));
        const load = screen.getByRole('columnheader', { name: /Load/ });
        await waitFor(() => expect(load).toHaveAttribute('aria-sort', 'descending'));
        expect(screen.queryByRole('columnheader', { name: /Location/ })).not.toBeInTheDocument();
        await userEvent.click(within(load).getByRole('button'));
        await waitFor(() =>
            expect(JSON.parse(sessionStorage.getItem('wirecore-table:server-test')!).sorting).toEqual([])
        );
        sessionStorage.clear();
    });

    it('full screen is a modal dialog named by the caption; Escape leaves it', async () => {
        await render(framework, table({ fullscreenToggle: true }));
        await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
        const dialog = await screen.findByRole('dialog', { name: 'Server' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        await waitFor(() => expect(screen.getByRole('button', { name: 'Exit full screen' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'Full screen' })).toHaveFocus();
    });

    /** An own filter input or editor: a Vue scoped slot, a React render function of the column */
    const ownContent = (kind: 'filter' | 'editor', columnId: string, content: (props: never) => El) =>
        framework === 'vue'
            ? { $scoped: { [`${kind}-${columnId}`]: { react: 'unused', args: () => ({}), render: content } } }
            : {};
    const withRender = (
        list: Record<string, unknown>[],
        kind: 'filter' | 'editor',
        columnId: string,
        content: (props: never) => El
    ) =>
        framework === 'vue'
            ? list
            : list.map((column) =>
                  column.id === columnId
                      ? {
                            ...column,
                            [kind === 'filter' ? 'renderFilter' : 'renderEditor']: (props: never) =>
                                toReact(content(props)),
                        }
                      : column
              );
    const input = on('onInput', 'onChange');

    it('own filter input and comparison in the filter row and the filter menu', async () => {
        const minimum = ({ value, setValue }: { value: unknown; setValue: (value: unknown) => void }) =>
            el('input', {
                'aria-label': 'Minimum',
                value: value === null || value === undefined ? '' : String(value),
                [input]: (event: Event) => {
                    const text = (event.target as HTMLInputElement).value;
                    setValue(text ? Number(text) : null);
                },
            });
        const ownColumns = withRender(
            [
                { id: 'name', header: 'Name', filter: 'text' },
                {
                    id: 'load',
                    header: 'Load',
                    filterFn: (value: unknown, filter: unknown) => Number(value) >= Number(filter),
                },
            ],
            'filter',
            'load',
            minimum
        );
        const onFilters = vi.fn();
        await render(
            framework,
            table({
                columns: ownColumns,
                ...ownContent('filter', 'load', minimum),
                [on('onUpdate:filters', 'onFiltersChange')]: onFilters,
            })
        );
        fireEvent.input(screen.getByRole('textbox', { name: 'Minimum' }), { target: { value: '40' } });
        await waitFor(() => expect(names()).toEqual(['web-01', 'db-primary']));
        expect(onFilters).toHaveBeenLastCalledWith({
            // Without a filter type the condition has the default match mode of text – filterFn decides
            load: { operator: 'and', constraints: [{ matchMode: 'contains', value: 40 }] },
        });
    });

    it('range filter in the filter row: from and to, either may stay empty', async () => {
        await render(
            framework,
            table({
                columns: [
                    { id: 'name', header: 'Name' },
                    { id: 'load', header: 'Load', filter: 'number', filterMatchMode: 'between' },
                ],
            })
        );
        await userEvent.type(screen.getByRole('spinbutton', { name: 'Filter Load, From' }), '20');
        await waitFor(() => expect(names()).toEqual(['web-01', 'db-primary']));
        await userEvent.type(screen.getByRole('spinbutton', { name: 'Filter Load, To' }), '50');
        await waitFor(() => expect(names()).toEqual(['web-01']));
    });

    it('select filters with values of their own, multiple values, grouped choices', async () => {
        const statusColumns = [
            { id: 'name', header: 'Name' },
            {
                id: 'level',
                header: 'Level',
                accessor: (row: { load: number }) => (row.load > 50 ? 2 : 1),
                format: (value: unknown) => (value === 2 ? 'High' : 'Normal'),
                filter: 'select',
                filterOptions: [
                    { value: 1, label: 'Normal', group: 'Levels' },
                    { value: 2, label: 'High', group: 'Levels' },
                ],
            },
        ];
        await render(
            framework,
            table({
                columns: statusColumns,
                filters: { level: { operator: 'and', constraints: [{ matchMode: 'equals', value: 2 }] } },
            })
        );
        expect(names()).toEqual(['db-primary']);
        expect(screen.getByRole('combobox', { name: 'Filter Level' })).toHaveTextContent('High');
    });

    it('filters can be hidden: no filter row with filterDisplay="none", a toggle button in the toolbar', async () => {
        const onShow = vi.fn();
        await render(
            framework,
            table({
                filterToggle: true,
                [on('onUpdate:showFilters', 'onShowFiltersChange')]: onShow,
                $slots: { toolbarStart: el('span', {}, 'Start'), toolbarEnd: el('span', {}, 'End') },
            })
        );
        const toggle = screen.getByRole('button', { name: 'Show filters' });
        expect(toggle).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('textbox', { name: 'Filter Name' })).toBeInTheDocument();
        await userEvent.click(toggle);
        expect(onShow).toHaveBeenLastCalledWith(false);
        expect(toggle).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByRole('textbox', { name: 'Filter Name' })).not.toBeInTheDocument();
        // Own content before the search and before the built-in buttons
        const toolbar = toggle.closest('div')!.parentElement!;
        expect(toolbar.firstElementChild).toHaveTextContent('Start');
        expect(toggle.previousElementSibling).toHaveTextContent('End');
    });

    it('no filters at all with filterDisplay="none"', async () => {
        await render(framework, table({ filterDisplay: 'none' }));
        expect(screen.queryByRole('textbox', { name: 'Filter Name' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Filter for/ })).not.toBeInTheDocument();
    });

    it('generateCsv: the CSV as text, own column names and values, columns left out', async () => {
        let handle: { generateCsv: (options?: object) => string } | undefined;
        await render(
            framework,
            table({
                ref: (value: typeof handle | null) => (handle = value ?? handle),
                selectable: true,
                selection: ['db-primary'],
                columns: [
                    { id: 'name', header: 'Name', exportHeader: 'Hostname' },
                    { id: 'location', header: 'Location', exportable: false },
                    {
                        id: 'load',
                        header: 'Load',
                        exportValue: (row: { load: number }) => (row.load / 100).toFixed(2),
                    },
                ],
            })
        );
        // en-US: "," – a spreadsheet there expects it
        expect(handle!.generateCsv({ bom: false }).split('\r\n')).toEqual([
            'Hostname,Load',
            'web-01,0.42',
            'db-primary,0.71',
            'k8s-node-3,0.18',
        ]);
        expect(handle!.generateCsv({ selectionOnly: true, separator: ';' })).toBe(
            '\uFEFFHostname;Load\r\ndb-primary;0.71'
        );
    });

    it('csvSeparator sets the separator of the export, the option of a single export still wins', async () => {
        let handle: { generateCsv: (options?: object) => string } | undefined;
        await render(
            framework,
            table({
                ref: (value: typeof handle | null) => (handle = value ?? handle),
                csvSeparator: '\t',
                columns: [
                    { id: 'name', header: 'Name' },
                    { id: 'location', header: 'Location' },
                ],
            })
        );
        expect(handle!.generateCsv({ bom: false }).split('\r\n')[0]).toBe('Name\tLocation');
        expect(handle!.generateCsv({ bom: false, separator: '|' }).split('\r\n')[0]).toBe('Name|Location');
    });

    it('edits with a select of values, an own editor and a check that answers later', async () => {
        const onEdit = vi.fn();
        const stepper = ({
            value,
            setValue,
            commit,
        }: {
            value: unknown;
            setValue: (v: unknown) => void;
            commit: () => void;
        }) =>
            el(
                'span',
                {},
                el('button', { type: 'button', onClick: () => setValue(Number(value) + 1) }, `+1 (${value})`),
                el('button', { type: 'button', onClick: commit }, 'Apply')
            );
        await render(
            framework,
            table({
                columns: withRender(
                    [
                        {
                            id: 'name',
                            header: 'Name',
                            editable: true,
                            validate: (value: unknown) =>
                                new Promise((done) =>
                                    setTimeout(() => done(value === 'web-02' ? 'Already taken' : undefined), 10)
                                ),
                        },
                        {
                            id: 'location',
                            header: 'Location',
                            editable: true,
                            editor: 'select',
                            editOptions: [
                                { value: 'FRA', label: 'Frankfurt' },
                                { value: 'NUE', label: 'Nuremberg' },
                            ],
                        },
                        { id: 'load', header: 'Load', editable: true },
                    ],
                    'editor',
                    'load',
                    stepper
                ),
                ...ownContent('editor', 'load', stepper),
                onCellEdit: onEdit,
            })
        );
        // Own editor: the value changes until it is committed
        await userEvent.click(screen.getByRole('button', { name: '42, edit Load' }));
        await userEvent.click(await screen.findByRole('button', { name: '+1 (42)' }));
        await userEvent.click(screen.getByRole('button', { name: '+1 (43)' }));
        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onEdit).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'web-01', columnId: 'load', value: 44 })
        );

        // Asynchronous check: the editor stays open with the error
        await userEvent.click(screen.getByRole('button', { name: 'web-01, edit Name' }));
        const name = await screen.findByRole('textbox', { name: 'Name' });
        await userEvent.clear(name);
        await userEvent.type(name, 'web-02{Enter}');
        expect(await screen.findByRole('alert')).toHaveTextContent('Already taken');
        expect(onEdit).toHaveBeenCalledTimes(1);
        await userEvent.clear(name);
        await userEvent.type(name, 'web-11{Enter}');
        await waitFor(() =>
            expect(onEdit).toHaveBeenLastCalledWith(expect.objectContaining({ columnId: 'name', value: 'web-11' }))
        );
    });

    it('loading with placeholder rows or own content; no results apart from no data', async () => {
        const { unmount } = { unmount: () => document.body.replaceChildren() };
        await render(framework, table({ loading: true, loadingVariant: 'skeleton', pageSize: 2 }));
        const body = screen.getByRole('table').querySelector('tbody')!;
        // As many placeholders as rows on the page
        expect(body.querySelectorAll('tr')).toHaveLength(2);
        expect(screen.queryByText('web-01')).not.toBeInTheDocument();
        unmount();
        await render(
            framework,
            table({ data: [], loading: true, $slots: { loadingContent: el('p', {}, 'Loading servers') } })
        );
        expect(screen.getByText('Loading servers')).toBeInTheDocument();
        unmount();
        await render(framework, table({ noResultsText: 'No matches for these filters', globalFilter: 'nothing' }));
        expect(screen.getByText('No matches for these filters')).toBeInTheDocument();
        unmount();
        await render(
            framework,
            table({ data: [], noResultsText: 'No matches for these filters', globalFilter: 'nothing' })
        );
        expect(screen.getByText('No entries')).toBeInTheDocument();
    });

    it('reports the selected rows as objects; "select all" across the pages of a server table', async () => {
        const onRows = vi.fn();
        const onAll = vi.fn();
        await render(
            framework,
            table({
                selectable: true,
                manual: true,
                rowCount: 30,
                pageSize: 3,
                selectAllMode: 'all',
                onSelectedRowsChange: onRows,
                [on('onUpdate:allSelection', 'onAllSelectionChange')]: onAll,
            })
        );
        await userEvent.click(screen.getByRole('checkbox', { name: 'Select db-primary' }));
        expect(onRows).toHaveBeenLastCalledWith([fleet[1]]);
        const all = screen.getByRole('checkbox', { name: 'Select all rows' });
        await userEvent.click(all);
        expect(onAll).toHaveBeenLastCalledWith({ mode: 'all', except: [] });
        expect(screen.getByRole('checkbox', { name: 'Select k8s-node-3' })).toBeChecked();
        await userEvent.click(screen.getByRole('checkbox', { name: 'Select k8s-node-3' }));
        expect(onAll).toHaveBeenLastCalledWith({ mode: 'all', except: ['k8s-node-3'] });
        expect(screen.getByRole('checkbox', { name: 'Select k8s-node-3' })).not.toBeChecked();
        await userEvent.click(all);
        expect(onAll).toHaveBeenLastCalledWith(null);
    });

    it('lenient tree filter keeps the parents of matching children', async () => {
        const tree = [
            { id: 'projects', name: 'Projects', children: [{ id: 'wirecore', name: 'WireLayer' }] },
            { id: 'notes', name: 'Notes' },
        ];
        const treeTable = (mode?: string) =>
            el('DataTable', {
                data: tree,
                caption: 'Files',
                getRowId,
                columns: [{ id: 'name', header: 'Name' }],
                getSubRows: (row: { children?: unknown[] }) => row.children,
                defaultExpanded: ['projects'],
                globalFilter: 'wire',
                treeFilterMode: mode,
            });
        await render(framework, treeTable('lenient'));
        expect(names()).toEqual(['Projects', 'WireLayer']);
        document.body.replaceChildren();
        await render(framework, treeTable());
        expect(names()).toEqual(['No entries']);
    });

    it('tree table with grid keys is a treegrid: levels, left/right close, open and go to the parent', async () => {
        const tree = [
            { id: 'projects', name: 'Projects', children: [{ id: 'wirecore', name: 'WireLayer' }] },
            { id: 'notes', name: 'Notes' },
        ];
        await render(
            framework,
            el('DataTable', {
                data: tree,
                caption: 'Files',
                getRowId,
                navigation: 'grid',
                columns: [{ id: 'name', header: 'Name' }],
                getSubRows: (row: { children?: unknown[] }) => row.children,
            })
        );
        const grid = screen.getByRole('treegrid', { name: 'Files' });
        const row = (id: string) => grid.querySelector<HTMLElement>(`tr[data-row-id="${id}"]`);
        expect(row('projects')).toHaveAttribute('aria-level', '1');
        expect(row('projects')).toHaveAttribute('aria-expanded', 'false');
        expect(row('notes')).not.toHaveAttribute('aria-expanded');
        const cell = row('projects')!.querySelector('td')!;
        cell.focus();
        await userEvent.keyboard('{ArrowRight}');
        await waitFor(() => expect(row('projects')).toHaveAttribute('aria-expanded', 'true'));
        expect(row('wirecore')).toHaveAttribute('aria-level', '2');
        row('wirecore')!.querySelector('td')!.focus();
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(row('projects')!.querySelector('td')).toHaveFocus());
        await userEvent.keyboard('{ArrowLeft}');
        await waitFor(() => expect(row('projects')).toHaveAttribute('aria-expanded', 'false'));
    });

    it('grid navigation: one Tab stop, arrow keys, Enter edits, Escape back, Space selects', async () => {
        const onSelection = vi.fn();
        await render(
            framework,
            table({
                navigation: 'grid',
                selectable: true,
                columns: [
                    { id: 'name', header: 'Name', editable: true },
                    { id: 'load', header: 'Load' },
                ],
                [on('onUpdate:selection', 'onSelectionChange')]: onSelection,
            })
        );
        const grid = screen.getByRole('grid', { name: 'Server' });
        expect(grid).toHaveAttribute('aria-multiselectable', 'true');
        expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
        await userEvent.tab();
        const corner = grid.querySelector('th')!;
        expect(corner).toHaveFocus();
        await userEvent.keyboard('{ArrowDown}{ArrowRight}');
        const nameCell = screen.getByRole('button', { name: 'web-01, edit Name' }).closest('td')!;
        expect(nameCell).toHaveFocus();
        expect(nameCell).toHaveAttribute('tabindex', '0');
        expect(corner).toHaveAttribute('tabindex', '-1');
        await userEvent.keyboard('{Enter}');
        await waitFor(() => expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus());
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(nameCell).toHaveFocus());
        await userEvent.keyboard(' ');
        expect(onSelection).toHaveBeenLastCalledWith(['web-01']);
        expect(nameCell.closest('tr')).toHaveAttribute('aria-selected', 'true');
        await userEvent.keyboard('{End}');
        expect(screen.getByText('42').closest('td')).toHaveFocus();
        await userEvent.keyboard('{Control>}{End}{/Control}');
        expect(screen.getByText('18').closest('td')).toHaveFocus();
        await userEvent.keyboard('{Control>}{Home}{/Control}');
        expect(corner).toHaveFocus();
    });

    it('status bar: rows, filtered and selected rows, totals of the selected numbers', async () => {
        await render(framework, table({ statusBar: true, selectable: true, selection: ['web-01', 'db-primary'] }));
        const bar = screen.getByText('3 rows').parentElement!;
        expect(bar).toHaveTextContent('2 selected');
        expect(bar).toHaveTextContent('Load: Total 113 · Avg. 56.5');
    });

    it('rows as links: a real link in the first cell, a click on the row reports it', async () => {
        const onRowClick = vi.fn((click: { event: MouseEvent }) => click.event.preventDefault());
        await render(framework, table({ rowHref: (row: { id: string }) => `/server/${row.id}`, onRowClick }));
        expect(screen.getByRole('link', { name: 'db-primary' })).toHaveAttribute('href', '/server/db-primary');
        await userEvent.click(screen.getByRole('cell', { name: '71' }));
        expect(onRowClick).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'db-primary', href: '/server/db-primary' })
        );
    });

    it('page by row offset (first) and an initial sorting', async () => {
        const onFirst = vi.fn();
        await render(
            framework,
            table({
                pageSize: 1,
                first: 1,
                defaultSorting: { id: 'load', desc: true },
                [on('onUpdate:first', 'onFirstChange')]: onFirst,
            })
        );
        expect(names()).toEqual(['web-01']);
        await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
        expect(onFirst).toHaveBeenLastCalledWith(2);
    });
});

describe.each(frameworks)('%s DataTable spreadsheet, server and layout', (framework) => {
    const table = (props: Record<string, unknown> = {}) =>
        el('DataTable', { data: fleet, columns, caption: 'Server', getRowId, rowLabel, ...props });
    type Handle = {
        generateXlsx: (options?: object) => Uint8Array;
        print: (options?: object) => void;
        refresh: () => Promise<void>;
        undo: () => void;
    };
    const sheetXml = (bytes: Uint8Array) =>
        new DOMParser().parseFromString(
            new TextDecoder().decode(unzip(bytes).get('xl/worksheets/sheet1.xml')!.data),
            'application/xml'
        );

    it('Excel export: numbers and dates typed, group and total rows; a menu of formats', async () => {
        let handle: Handle | undefined;
        await render(
            framework,
            table({
                ref: (value: Handle | null) => (handle = value ?? handle),
                columns: [...columns, { id: 'since', header: 'Since', filter: 'date' }],
                groupBy: 'location',
                exportFilename: 'server',
                exportFormats: ['csv', 'xlsx'],
            })
        );
        const sheet = sheetXml(handle!.generateXlsx());
        const cells = (row: number) => [...sheet.querySelectorAll(`row[r="${row}"] c`)].map((cell) => cell.textContent);
        expect(cells(1)).toEqual(['Name', 'Location', 'Load', 'Since']);
        expect(cells(2)).toEqual(['Location: Frankfurt (2)', '', '56.5', '']);
        expect(sheet.querySelector('c[r="C3"]')!.getAttribute('t')).toBeNull();
        expect(sheet.querySelector('c[r="C3"]')!.textContent).toBe('42');
        expect(sheet.querySelector('c[r="D3"]')!.getAttribute('s')).toBe('2');
        // The total row: the average of all rows
        expect(sheet.querySelector('row[r="7"] c[r="C7"]')!.textContent).toBe(String((42 + 71 + 18) / 3));
        expect(sheet.querySelector('row[r="7"] c[r="A7"]')!.textContent).toBe('Total');
        const flat = sheetXml(handle!.generateXlsx({ groups: false, totals: false }));
        expect(flat.querySelectorAll('row')).toHaveLength(4);
        await userEvent.click(screen.getByRole('button', { name: 'Export' }));
        expect(await screen.findByRole('menuitem', { name: 'All rows as Excel' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'All rows as CSV' })).toBeInTheDocument();
    });

    it('cell range: dragging and Shift+arrow keys select cells, Ctrl+C copies them as tab-separated text', async () => {
        const onRange = vi.fn();
        await render(framework, table({ navigation: 'grid', cellSelection: true, onCellSelectionChange: onRange }));
        const user = userEvent.setup();
        const cell = (text: string) => screen.getByText(text).closest('td')!;
        expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');
        await user.pointer([
            { keys: '[MouseLeft>]', target: cell('web-01') },
            { target: within(cell('db-primary').closest('tr')!).getByText('Frankfurt').closest('td')! },
            { keys: '[/MouseLeft]' },
        ]);
        expect(onRange).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowIds: ['web-01', 'db-primary'], columnIds: ['name', 'location'] })
        );
        expect(screen.getByRole('grid').querySelectorAll('[aria-selected="true"]')).toHaveLength(4);
        expect(cell('k8s-node-3')).toHaveAttribute('aria-selected', 'false');
        expect(cell('web-01')).toHaveFocus();
        await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
        expect(onRange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                rowIds: ['web-01', 'db-primary', 'k8s-node-3'],
                values: [
                    ['web-01', 'Frankfurt'],
                    ['db-primary', 'Frankfurt'],
                    ['k8s-node-3', 'Nuremberg'],
                ],
            })
        );
        expect(cell('Nuremberg')).toHaveFocus();
        // user-event copies only a text selection – the copy event as Ctrl+C sends it
        const clipboard = { text: '', setData: (_: string, text: string) => (clipboard.text = text) };
        fireEvent.copy(document.activeElement!, { clipboardData: clipboard });
        expect(clipboard.text).toBe('web-01\tFrankfurt\r\ndb-primary\tFrankfurt\r\nk8s-node-3\tNuremberg');
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('6 cells copied'));
        // A click elsewhere starts a new range
        await user.click(cell('71'));
        expect(onRange).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowIds: ['db-primary'], columnIds: ['load'] })
        );
    });

    it('pastes text from Excel: values read per column, checked, reported; Ctrl+Z undoes it', async () => {
        const onCellEdit = vi.fn();
        const onCellPaste = vi.fn();
        await render(
            framework,
            table({
                navigation: 'grid',
                cellSelection: true,
                onCellEdit,
                onCellPaste,
                columns: [
                    { id: 'name', header: 'Name' },
                    {
                        id: 'load',
                        header: 'Load',
                        editable: true,
                        editor: 'number',
                        validate: (value: number) => (value > 100 ? 'At most 100' : undefined),
                    },
                    { id: 'since', header: 'Since', editable: true, editor: 'date' },
                ],
            })
        );
        const user = userEvent.setup();
        await user.tab();
        await user.keyboard('{ArrowDown}{ArrowRight}');
        await user.paste('55\t10/21/2026\n120\t02/01/2026\nlots');
        await waitFor(() => expect(onCellPaste).toHaveBeenCalled());
        const paste = onCellPaste.mock.calls[0]![0] as { changes: object[]; errors: { message: string }[] };
        expect(paste.changes).toEqual([
            expect.objectContaining({ rowId: 'web-01', columnId: 'load', value: 55, oldValue: 42 }),
            expect.objectContaining({ rowId: 'web-01', columnId: 'since', value: '2026-10-21' }),
            expect.objectContaining({ rowId: 'db-primary', columnId: 'since', value: '2026-02-01' }),
        ]);
        expect(paste.errors.map((error) => error.message)).toEqual(['Not a number', 'At most 100']);
        expect(onCellEdit).toHaveBeenCalledTimes(3);
        expect(onCellEdit).toHaveBeenCalledWith(
            expect.objectContaining({ rowId: 'web-01', columnId: 'load', value: 55 })
        );
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3 cells pasted, 2 invalid'));
        // The pasted cells are the range now
        expect(screen.getByRole('grid').querySelectorAll('[aria-selected="true"]').length).toBe(6);
        await user.keyboard('{Control>}z{/Control}');
        expect(onCellEdit).toHaveBeenCalledTimes(6);
        expect(onCellEdit).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'web-01', columnId: 'load', value: 42 })
        );
        await user.keyboard('{Control>}y{/Control}');
        expect(onCellEdit).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'db-primary', columnId: 'since', value: '2026-02-01' })
        );
    });

    it('row editing: a paste is reported per row (rowEdit with every editable value)', async () => {
        const onRowEdit = vi.fn();
        await render(
            framework,
            table({
                navigation: 'grid',
                cellSelection: true,
                editMode: 'row',
                onRowEdit,
                columns: [
                    { id: 'name', header: 'Name', editable: true },
                    { id: 'load', header: 'Load', editable: true, editor: 'number' },
                ],
            })
        );
        const user = userEvent.setup();
        await user.tab();
        await user.keyboard('{ArrowDown}{ArrowRight}');
        await user.paste('55\n60');
        await waitFor(() => expect(onRowEdit).toHaveBeenCalledTimes(2));
        expect(onRowEdit).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ rowId: 'web-01', values: { name: 'web-01', load: 55 } })
        );
        expect(onRowEdit).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ rowId: 'db-primary', values: { name: 'db-primary', load: 60 } })
        );
    });

    it('a paste can be cancelled; pasting into cells that are not editable changes nothing', async () => {
        const onCellEdit = vi.fn();
        await render(
            framework,
            table({
                navigation: 'grid',
                cellSelection: true,
                onCellEdit,
                onCellPaste: (paste: { preventDefault: () => void }) => paste.preventDefault(),
                columns: [
                    { id: 'name', header: 'Name', editable: true },
                    { id: 'load', header: 'Load' },
                ],
            })
        );
        const user = userEvent.setup();
        await user.tab();
        await user.keyboard('{ArrowDown}{ArrowRight}');
        await user.paste('web-99');
        await user.keyboard('{ArrowLeft}');
        await user.paste('web-99');
        expect(onCellEdit).not.toHaveBeenCalled();
    });

    it('batch mode: changes are collected and marked, undo and redo, save reports them, discard drops them', async () => {
        const onSave = vi.fn();
        const onCellEdit = vi.fn();
        await render(
            framework,
            table({
                editMode: 'batch',
                onSave,
                onCellEdit,
                columns: [{ id: 'name', header: 'Name', editable: true }, columns[2]],
            })
        );
        const user = userEvent.setup();
        expect(screen.getByText('0 changes')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'web-01, edit Name' }));
        await user.clear(screen.getByRole('textbox', { name: 'Name' }));
        await user.type(screen.getByRole('textbox', { name: 'Name' }), 'web-99{Enter}');
        const changed = await screen.findByRole('button', { name: 'web-99, edit Name, changed' });
        expect(changed.closest('td')).toHaveAttribute('data-changed');
        expect(screen.getByText('1 change')).toBeInTheDocument();
        expect(onCellEdit).not.toHaveBeenCalled();
        await user.keyboard('{Control>}z{/Control}');
        expect(await screen.findByRole('button', { name: 'web-01, edit Name' })).toBeInTheDocument();
        expect(screen.getByText('0 changes')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Redo' }));
        expect(await screen.findByText('1 change')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Save' }));
        expect(onSave).toHaveBeenCalledWith({
            changes: [
                expect.objectContaining({ rowId: 'web-01', columnId: 'name', value: 'web-99', oldValue: 'web-01' }),
            ],
            rows: [expect.objectContaining({ rowId: 'web-01', values: { name: 'web-99' } })],
        });
        expect(await screen.findByText('0 changes')).toBeInTheDocument();
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 change saved'));
        // The app did not apply the change: the row shows its value again
        await user.click(screen.getByRole('button', { name: 'db-primary, edit Name' }));
        await user.type(screen.getByRole('textbox', { name: 'Name' }), '-x{Enter}');
        expect(await screen.findByText('1 change')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Discard' }));
        expect(await screen.findByRole('button', { name: 'db-primary, edit Name' })).toBeInTheDocument();
        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('advancedFilter goes to the server: dataSource gets the tree as condition, manual keeps the rows', async () => {
        const tree = {
            type: 'group',
            id: 'root',
            combinator: 'and',
            children: [{ type: 'rule', id: 'r1', field: 'load', operator: 'gt', value: 40 }],
        };
        const rows = [
            { id: 'a', name: 'web-01', load: 42 },
            { id: 'b', name: 'backup', load: 18 },
        ];
        const getRows = vi.fn(async () => ({ rows, rowCount: 2 }));
        const columns = [
            { id: 'name', header: 'Name', filter: 'text' },
            { id: 'load', header: 'Load', filter: 'number' },
        ];
        await render(
            framework,
            el('DataTable', {
                caption: 'Server',
                columns,
                getRowId,
                dataSource: { getRows },
                advancedFilter: true,
                advancedFilterValue: tree,
            })
        );
        expect(await screen.findByRole('cell', { name: 'backup' })).toBeInTheDocument();
        expect(getRows).toHaveBeenLastCalledWith(expect.objectContaining({ condition: tree }));
    });

    it('advancedFilter with manual: the page is not filtered in the browser', async () => {
        await render(
            framework,
            el('DataTable', {
                caption: 'Server',
                columns: [
                    { id: 'name', header: 'Name', filter: 'text' },
                    { id: 'load', header: 'Load', filter: 'number' },
                ],
                getRowId,
                data: [
                    { id: 'a', name: 'web-01', load: 42 },
                    { id: 'b', name: 'backup', load: 18 },
                ],
                manual: true,
                rowCount: 2,
                advancedFilter: true,
                advancedFilterValue: {
                    type: 'group',
                    id: 'root',
                    combinator: 'and',
                    children: [{ type: 'rule', id: 'r1', field: 'load', operator: 'gt', value: 40 }],
                },
            })
        );
        expect(screen.getByRole('cell', { name: 'backup' })).toBeInTheDocument();
    });

    it('server data source: pages, sorting back to page 1, outdated requests aborted, errors with retry', async () => {
        const all = Array.from({ length: 5 }, (_, index) => ({
            id: `vm-${index + 1}`,
            name: `vm-${index + 1}`,
            location: index % 2 ? 'Vienna' : 'Frankfurt',
            load: index * 10,
        }));
        const signals: AbortSignal[] = [];
        let fail = false;
        const getRows = vi.fn(
            async (request: { page: number; pageSize: number; sorting: { desc: boolean }[]; signal: AbortSignal }) => {
                signals.push(request.signal);
                if (fail) throw new Error('offline');
                const sorted = request.sorting[0]?.desc ? [...all].reverse() : all;
                const start = (request.page - 1) * request.pageSize;
                return { rows: sorted.slice(start, start + request.pageSize), rowCount: all.length };
            }
        );
        let handle: Handle | undefined;
        await render(
            framework,
            el('DataTable', {
                caption: 'Server',
                columns: [{ id: 'name', header: 'Name', sortable: true }, columns[1], columns[2]],
                getRowId,
                pageSize: 2,
                dataSource: { getRows },
                ref: (value: Handle | null) => (handle = value ?? handle),
            })
        );
        expect(await screen.findByRole('cell', { name: 'vm-1' })).toBeInTheDocument();
        expect(getRows).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, pageSize: 2, sorting: [] }));
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('5 items loaded'));
        await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
        expect(await screen.findByRole('cell', { name: 'vm-3' })).toBeInTheDocument();
        expect(getRows).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
        // Sorting goes back to page 1
        await userEvent.click(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'));
        await userEvent.click(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'));
        await waitFor(() =>
            expect(getRows).toHaveBeenLastCalledWith(
                expect.objectContaining({ page: 1, sorting: [{ id: 'name', desc: true }] })
            )
        );
        expect(await screen.findByRole('cell', { name: 'vm-5' })).toBeInTheDocument();
        expect(signals.at(-1)!.aborted).toBe(false);
        fail = true;
        await handle!.refresh();
        expect(await screen.findByRole('alert')).toHaveTextContent('The data could not be loaded.');
        fail = false;
        await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByRole('cell', { name: 'vm-5' })).toBeInTheDocument();
    });

    it('moves rows into the neighbouring group with the arrow keys and names the group', async () => {
        const onRowReorder = vi.fn();
        await render(framework, table({ groupBy: 'location', reorderableRows: true, onRowReorder }));
        screen.getByRole('button', { name: 'Move db-primary' }).focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onRowReorder).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'db-primary', group: { location: 'Nuremberg' } })
        );
        await waitFor(() =>
            expect(screen.getByRole('status')).toHaveTextContent(
                'db-primary is now in Location: Nuremberg, position 1 of 2'
            )
        );
        screen.getByRole('button', { name: 'Move web-01' }).focus();
        await userEvent.keyboard('{ArrowDown}');
        expect(onRowReorder).toHaveBeenLastCalledWith(expect.not.objectContaining({ group: expect.anything() }));
    });

    it('moves rows of a tree into a row and out of it with the arrow keys', async () => {
        const onRowReorder = vi.fn();
        const tree = [
            { id: 'a', name: 'Projects', children: [{ id: 'a1', name: 'WireLayer' }] },
            { id: 'b', name: 'Archive', children: [] },
            { id: 'c', name: 'Notes' },
        ];
        await render(
            framework,
            el('DataTable', {
                data: tree,
                columns: [{ id: 'name', header: 'Name' }],
                caption: 'Files',
                getRowId,
                rowLabel,
                getSubRows: (row: { children?: object[] }) => row.children,
                defaultExpanded: ['a'],
                reorderableRows: true,
                onRowReorder,
            })
        );
        const handle = screen.getByRole('button', { name: 'Move Notes' });
        expect(handle).toHaveAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight');
        handle.focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(onRowReorder).toHaveBeenLastCalledWith(expect.objectContaining({ rowId: 'c', parentId: 'b', index: 0 }));
        await waitFor(() =>
            expect(screen.getByRole('status')).toHaveTextContent('Notes moved into Archive, position 1 of 1')
        );
        screen.getByRole('button', { name: 'Move WireLayer' }).focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(onRowReorder).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 'a1', parentId: null, index: 1 })
        );
        expect(moveTreeRow(tree, { rowId: 'a1', parentId: null, index: 1 }, getRowId, 'children')).toEqual([
            { id: 'a', name: 'Projects', children: [] },
            { id: 'a1', name: 'WireLayer' },
            { id: 'b', name: 'Archive', children: [] },
            { id: 'c', name: 'Notes' },
        ]);
    });

    it('pivot: rows by one column, headers from the values of another, totals per row and column', async () => {
        await render(
            framework,
            table({
                data: [
                    ...fleet,
                    { id: 'web-02', name: 'web-02', location: 'Nuremberg', load: 30, since: '2026-01-01' },
                ],
                columns: [
                    ...columns,
                    { id: 'year', header: 'Year', accessor: (row: { since: string }) => row.since.slice(0, 4) },
                ],
                pivot: { rows: ['location'], columns: ['year'], values: [{ id: 'load', aggregate: 'sum' }] },
            })
        );
        expect(screen.getAllByRole('columnheader').map((header) => header.textContent?.trim())).toEqual([
            'Location',
            '2023',
            '2024',
            '2025',
            '2026',
            'Total',
        ]);
        const rows = within(screen.getByRole('table'))
            .getAllByRole('row')
            .map((row) => [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim()));
        expect(rows).toContainEqual(['Frankfurt', '71', '42', '', '', '113']);
        expect(rows).toContainEqual(['Nuremberg', '', '', '18', '30', '48']);
        expect(rows).toContainEqual(['Total', '71', '42', '18', '30', '161']);
    });

    it('merged cells: equal values below each other span rows, cells span columns, headers name the columns', async () => {
        await render(
            framework,
            table({
                defaultSorting: { id: 'location', desc: false },
                columns: [
                    { ...columns[1], rowSpan: 'auto' },
                    {
                        ...columns[0],
                        colSpan: (row: { id: string }) => (row.id === 'k8s-node-3' ? 2 : 1),
                    },
                    columns[2],
                ],
            })
        );
        const frankfurt = screen.getByRole('cell', { name: 'Frankfurt' });
        expect(frankfurt).toHaveAttribute('rowspan', '2');
        const header = screen.getByRole('columnheader', { name: /Location/ });
        expect(frankfurt.getAttribute('headers')).toBe(header.id);
        expect(screen.getAllByRole('cell', { name: 'Frankfurt' })).toHaveLength(1);
        const wide = screen.getByRole('cell', { name: 'k8s-node-3' });
        expect(wide).toHaveAttribute('colspan', '2');
        expect(wide.getAttribute('headers')!.split(' ')).toHaveLength(2);
        expect(wide.closest('tr')!.querySelectorAll('td')).toHaveLength(2);
    });

    it('find in the table: matches x of y, next and previous, marked, Escape closes', async () => {
        await render(framework, table({ find: true }));
        const user = userEvent.setup();
        const toggle = screen.getByRole('button', { name: 'Find in table' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await user.click(toggle);
        const field = await screen.findByRole('searchbox', { name: 'Find in table' });
        await waitFor(() => expect(field).toHaveFocus());
        await user.type(field, 'frank');
        expect(await screen.findByText('Match 1 of 2')).toBeInTheDocument();
        expect(screen.getByRole('table').querySelectorAll('mark')).toHaveLength(2);
        await user.keyboard('{Enter}');
        expect(screen.getByText('Match 2 of 2')).toBeInTheDocument();
        await user.keyboard('{Shift>}{Enter}{/Shift}');
        expect(screen.getByText('Match 1 of 2')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Next match' }));
        expect(screen.getByText('Match 2 of 2')).toBeInTheDocument();
        await user.clear(field);
        await user.type(field, 'xyz');
        expect(screen.getByText('No matches')).toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('searchbox', { name: 'Find in table' })).toBeNull();
        await waitFor(() => expect(toggle).toHaveFocus());
    });

    it('prints all filtered rows as plain text with the header on every page', async () => {
        let handle: Handle | undefined;
        await render(
            framework,
            table({ ref: (value: Handle | null) => (handle = value ?? handle), pageSize: 1, globalFilter: 'frank' })
        );
        handle!.print({ title: 'Print servers' });
        const frame = document.querySelector<HTMLIFrameElement>('iframe[aria-hidden="true"]')!;
        const page = new DOMParser().parseFromString(frame.srcdoc, 'text/html');
        frame.remove();
        expect(page.title).toBe('Print servers');
        expect(frame.srcdoc).toContain('thead{display:table-header-group}');
        expect([...page.querySelectorAll('tbody tr')].map((row) => row.querySelector('td')?.textContent)).toEqual([
            'web-01',
            'db-primary',
        ]);
        expect(page.querySelector('tfoot')!.textContent).toContain('Avg. 56.5');
        expect(page.querySelectorAll('button, input')).toHaveLength(0);
    });

    it('column groups in the column menu: shown, hidden and moved as a whole', async () => {
        await render(
            framework,
            table({
                columnToggle: true,
                reorderableColumns: true,
                columns: [
                    columns[0],
                    { id: 'usage', header: 'Usage', columns: [columns[2], { id: 'since', header: 'Since' }] },
                    columns[1],
                ],
            })
        );
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Columns' }));
        await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Usage' }));
        await waitFor(() => expect(screen.queryByRole('columnheader', { name: /Load/ })).toBeNull());
        expect(screen.queryByRole('columnheader', { name: 'Since' })).toBeNull();
        await user.click(screen.getByRole('menuitemcheckbox', { name: 'Usage' }));
        await waitFor(() => expect(screen.getByRole('columnheader', { name: 'Since' })).toBeInTheDocument());
        await user.click(screen.getByRole('menuitem', { name: 'Move Usage forward' }));
        await waitFor(() =>
            expect(screen.getAllByRole('columnheader').map((header) => header.textContent?.trim())).toEqual([
                expect.stringContaining('Name'),
                expect.stringContaining('Location'),
                'Usage',
                expect.stringContaining('Load'),
                'Since',
            ])
        );
        expect(screen.getByRole('menuitem', { name: 'Move Usage forward' })).toHaveAttribute('data-disabled');
    });
});
