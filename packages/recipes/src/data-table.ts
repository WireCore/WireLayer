// Framework-neutral logic of the DataTable (@wirecore/wirelayer-vue/data-table, @wirecore/wirelayer-react/data-table): filter rules
// with match modes, sorting clicks, aggregation, row ranges and the saved table state. Both packages call these,
// so Vue and React filter, sort and store alike.

import { moveTreeNode } from './hierarchy.js';
import { listValueKey } from './list-items.js';

export type DataTableFilterType = 'text' | 'select' | 'multiSelect' | 'number' | 'date' | 'boolean';

export type DataTableMatchMode =
    | 'startsWith'
    | 'contains'
    | 'notContains'
    | 'endsWith'
    | 'equals'
    | 'notEquals'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'between'
    | 'in'
    | 'dateIs'
    | 'dateIsNot'
    | 'dateBefore'
    | 'dateAfter'
    // Own match modes (defineMatchMode) by name
    | (string & Record<never, never>);

/** One condition of a column filter, e.g. { matchMode: 'gt', value: 50 } – `between` takes [from, to] */
export interface DataTableFilterConstraint {
    matchMode: DataTableMatchMode;
    value: unknown;
}

/** The conditions of one column, joined with "and" (all must hold) or "or" (one is enough) */
export interface DataTableFilterRule {
    operator: 'and' | 'or';
    constraints: DataTableFilterConstraint[];
}

/** A column filter: plain text (contains, for selects: equals) or a rule with match modes */
export type DataTableFilterValue = string | DataTableFilterRule;

export type DataTableAggregate = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface DataTableSort {
    id: string;
    desc: boolean;
}

/** Match modes offered in the filter menu, per filter type – the first is the default */
export const dataTableMatchModes: Record<DataTableFilterType, DataTableMatchMode[]> = {
    text: ['contains', 'startsWith', 'endsWith', 'notContains', 'equals', 'notEquals'],
    select: ['equals', 'notEquals'],
    multiSelect: ['in'],
    number: ['equals', 'notEquals', 'lt', 'lte', 'gt', 'gte', 'between'],
    date: ['dateIs', 'dateIsNot', 'dateBefore', 'dateAfter', 'between'],
    boolean: ['equals'],
};

const isEmpty = (value: unknown) =>
    value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

/**
 * An own match mode (`defineMatchMode`): offered in the filter menu (by `types` or a column's `matchModes`) and usable
 * in the filter row (`filterMatchMode`).
 */
export interface DataTableMatchModeDefinition {
    /** Name in the filter menu – a text or a function of the locale (e.g. "de-DE") */
    label: string | ((locale: string) => string);
    /** Filter types whose menus offer the mode (default: none – list it in the `matchModes` of a column) */
    types?: DataTableFilterType[];
    /** Two values, from and to – either may stay empty (open range) */
    range?: boolean;
    /** Input for the value (default: the input of the column's filter type) */
    input?: DataTableFilterType;
    /** Whether a row passes: the cell value (not formatted), the filter value ([from, to] with `range`) and the row */
    test: (value: unknown, filter: unknown, row: unknown) => boolean;
}

const ownMatchModes = new Map<string, DataTableMatchModeDefinition>();

/**
 * Registers a match mode for all tables, e.g. `defineMatchMode('arrayContains', { label: 'Contains', types:
 * ['select'], test: (value, filter) => Array.isArray(value) && value.includes(filter) })`.
 */
export function defineMatchMode(name: string, definition: DataTableMatchModeDefinition) {
    ownMatchModes.set(name, definition);
}

/** The definition of an own match mode, or undefined for the built-in ones */
export const matchModeDefinition = (name: string) => ownMatchModes.get(name);

/** Match modes with two values (from, to): `between` and own modes with `range` */
export const isRangeMatchMode = (mode: string) => mode === 'between' || !!ownMatchModes.get(mode)?.range;

/** The match modes of a filter type – the column's own list, or the built-in ones plus own modes for the type */
export function matchModesFor(type: DataTableFilterType, own?: readonly DataTableMatchMode[]): DataTableMatchMode[] {
    if (own) return [...own];
    const extra = [...ownMatchModes].filter(([, definition]) => definition.types?.includes(type)).map(([name]) => name);
    return [...dataTableMatchModes[type], ...extra];
}

/** Name of a match mode in the menu: the translation, the label of an own mode or the name itself */
export function matchModeLabel(mode: string, labels: Record<string, string>, locale: string): string {
    const own = ownMatchModes.get(mode);
    if (labels[mode]) return labels[mode];
    if (!own) return mode;
    return typeof own.label === 'function' ? own.label(locale) : own.label;
}

/** A constraint without a value does not filter (an empty input in the menu) */
export const isActiveConstraint = (constraint: DataTableFilterConstraint) =>
    isRangeMatchMode(constraint.matchMode)
        ? Array.isArray(constraint.value) && constraint.value.some((part) => !isEmpty(part))
        : !isEmpty(constraint.value);

/** Whether a column filter value filters anything */
export function isActiveFilter(filter: DataTableFilterValue | undefined): boolean {
    if (filter === undefined || filter === '') return false;
    return typeof filter === 'string' || filter.constraints.some(isActiveConstraint);
}

/** The filter as a rule – plain text becomes "contains" (text) or "equals" (selects, boolean) */
export function toFilterRule(filter: DataTableFilterValue, type: DataTableFilterType = 'text'): DataTableFilterRule {
    if (typeof filter !== 'string') return filter;
    return { operator: 'and', constraints: [{ matchMode: dataTableMatchModes[type][0]!, value: filter }] };
}

/** An empty rule with one condition of the default match mode */
export const emptyFilterRule = (type: DataTableFilterType = 'text'): DataTableFilterRule => ({
    operator: 'and',
    constraints: [{ matchMode: dataTableMatchModes[type][0]!, value: null }],
});

/** Calendar day "2026-10-20" of a Date, an ISO string or a timestamp (local time) */
function toDay(value: unknown): string | null {
    if (isEmpty(value)) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = value instanceof Date ? value : new Date(value as string | number);
    if (Number.isNaN(date.getTime())) return null;
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const toNumber = (value: unknown) => (isEmpty(value) ? NaN : Number(value));

/** Text for comparing: lower case and without accents ("Nürnberg" ~ "nurnberg"), like the search */
const fold = (value: unknown, locale?: string) =>
    String(value ?? '')
        .toLocaleLowerCase(locale)
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

/** Whether a cell value meets one condition */
export function matchesConstraint(
    cell: unknown,
    constraint: DataTableFilterConstraint,
    type: DataTableFilterType = 'text',
    locale?: string
): boolean {
    if (!isActiveConstraint(constraint)) return true;
    const { matchMode, value } = constraint;
    if (type === 'number') {
        const number = toNumber(cell);
        if (matchMode === 'between') {
            const [from, to] = (value as unknown[]).map(toNumber);
            return (Number.isNaN(from!) || number >= from!) && (Number.isNaN(to!) || number <= to!);
        }
        const target = toNumber(value);
        switch (matchMode) {
            case 'equals':
                return number === target;
            case 'notEquals':
                return number !== target;
            case 'lt':
                return number < target;
            case 'lte':
                return number <= target;
            case 'gt':
                return number > target;
            case 'gte':
                return number >= target;
            default:
                return true;
        }
    }
    if (type === 'date') {
        const day = toDay(cell);
        if (matchMode === 'between') {
            const [from, to] = (value as unknown[]).map(toDay);
            return !!day && (!from || day >= from) && (!to || day <= to);
        }
        const target = toDay(value);
        switch (matchMode) {
            case 'dateIs':
            case 'equals':
                return day === target;
            case 'dateIsNot':
            case 'notEquals':
                return day !== target;
            case 'dateBefore':
            case 'lt':
                return !!day && day < target!;
            case 'dateAfter':
            case 'gt':
                return !!day && day > target!;
            default:
                return true;
        }
    }
    if (type === 'boolean') return String(cell === true || cell === 'true') === String(value);
    if (matchMode === 'in' || type === 'multiSelect')
        return (value as unknown[]).map(String).includes(String(cell ?? ''));
    const text = fold(cell, locale);
    const query = fold(value, locale);
    switch (matchMode) {
        case 'startsWith':
            return text.startsWith(query);
        case 'contains':
            return text.includes(query);
        case 'notContains':
            return !text.includes(query);
        case 'endsWith':
            return text.endsWith(query);
        case 'equals':
            return text === query;
        case 'notEquals':
            return text !== query;
        default:
            return true;
    }
}

/** Whether a cell value passes the column filter (plain text or rule) */
export function matchesFilter(
    cell: unknown,
    filter: DataTableFilterValue | undefined,
    type: DataTableFilterType = 'text',
    locale?: string
): boolean {
    if (!filter || !isActiveFilter(filter)) return true;
    const rule = toFilterRule(filter, type);
    const active = rule.constraints.filter(isActiveConstraint);
    const test = (constraint: DataTableFilterConstraint) => matchesConstraint(cell, constraint, type, locale);
    return rule.operator === 'or' ? active.some(test) : active.every(test);
}

/** What a column filter compares for one row */
export interface DataTableCellFilterInput {
    /** The cell value, not formatted */
    value: unknown;
    /** The cell as shown (format) – text and select filters compare it */
    text: string;
    /** The row (for own comparisons) */
    row: unknown;
    type?: DataTableFilterType;
    locale?: string;
    /** Own comparison of the column: replaces the match modes (each condition is checked with it) */
    filterFn?: (value: unknown, filter: unknown, row: unknown, matchMode: DataTableMatchMode) => boolean;
    /** The choices have values of their own (objects, numbers): selects compare the values, not the shown text */
    byValue?: boolean;
}

const sameValue = (a: unknown, b: unknown) => !isEmpty(a) && listValueKey(a) === listValueKey(b);

/**
 * Whether a row passes a column filter: the own comparison of the column (`filterFn`), an own match mode
 * (`defineMatchMode`), the values of choices (`byValue`) or the built-in match modes (as `matchesFilter`).
 */
export function matchesColumnFilter(cell: DataTableCellFilterInput, filter: DataTableFilterValue | undefined): boolean {
    if (!filter || !isActiveFilter(filter)) return true;
    const type = cell.type ?? 'text';
    const rule = toFilterRule(filter, type);
    const test = (constraint: DataTableFilterConstraint) => {
        if (cell.filterFn) return cell.filterFn(cell.value, constraint.value, cell.row, constraint.matchMode);
        const own = ownMatchModes.get(constraint.matchMode);
        if (own) return own.test(cell.value, constraint.value, cell.row);
        if (cell.byValue && (type === 'select' || type === 'multiSelect')) {
            const values = Array.isArray(constraint.value) ? constraint.value : [constraint.value];
            if (constraint.matchMode === 'notEquals') return !sameValue(cell.value, constraint.value);
            return values.some((value) => sameValue(cell.value, value));
        }
        const input = type === 'text' || type === 'select' || type === 'multiSelect' ? cell.text : cell.value;
        return matchesConstraint(input, constraint, type, cell.locale);
    };
    const active = rule.constraints.filter(isActiveConstraint);
    return rule.operator === 'or' ? active.some(test) : active.every(test);
}

/** Whether any text of the row contains the search (ignores case and accents) */
export const matchesSearch = (values: unknown[], search: string, locale?: string) =>
    !search || values.some((value) => fold(value, locale).includes(fold(search, locale)));

/**
 * The sorting after a click on a column header: ascending → descending → unsorted. With `add` (Shift+click in
 * the multiple mode) the column is added to the existing sorting instead of replacing it.
 */
export function nextSorting(sorting: DataTableSort[], id: string, add = false): DataTableSort[] {
    const current = sorting.find((sort) => sort.id === id);
    const next: DataTableSort | null = !current ? { id, desc: false } : !current.desc ? { id, desc: true } : null;
    if (!add) return next ? [next] : [];
    if (!current) return [...sorting, next!];
    return next ? sorting.map((sort) => (sort.id === id ? next : sort)) : sorting.filter((sort) => sort.id !== id);
}

/** Aggregate of the column values (numbers only for sum, avg, min, max; empty values are skipped) */
export function aggregateValues(values: unknown[], aggregate: DataTableAggregate | ((values: unknown[]) => unknown)) {
    if (typeof aggregate === 'function') return aggregate(values);
    if (aggregate === 'count') return values.length;
    const numbers = values
        .filter((value) => !isEmpty(value))
        .map(Number)
        .filter((value) => !Number.isNaN(value));
    if (numbers.length === 0) return null;
    switch (aggregate) {
        case 'sum':
            return numbers.reduce((sum, value) => sum + value, 0);
        case 'avg':
            return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
        case 'min':
            return Math.min(...numbers);
        case 'max':
            return Math.max(...numbers);
    }
}

/** Sum, average and count of the numbers – null when there is none, or a value is something else than a number */
export function numberSummary(values: unknown[]): { sum: number; avg: number; count: number } | null {
    const present = values.filter((value) => !isEmpty(value));
    if (!present.length || present.some((value) => typeof value !== 'number' || !Number.isFinite(value))) return null;
    const sum = (present as number[]).reduce((total, value) => total + value, 0);
    return { sum, avg: sum / present.length, count: present.length };
}

/**
 * The errors of the checks by key – a promise when a check is asynchronous (e.g. a server request). Checks
 * without an error are left out.
 */
export function collectErrors(
    checks: [key: string, check: () => string | undefined | null | Promise<string | undefined | null>][]
): Record<string, string> | Promise<Record<string, string>> {
    const results = checks.map(([, check]) => check());
    const toErrors = (messages: (string | undefined | null)[]) =>
        Object.fromEntries(
            messages.flatMap((message, index) => (message ? [[checks[index]![0], message] as const] : []))
        );
    return results.some((result) => result instanceof Promise)
        ? Promise.all(results).then(toErrors)
        : toErrors(results as (string | undefined | null)[]);
}

/** Ids from `anchor` to `target` (both included) in the order of `ids` – Shift+click selects a range */
export function idRange(ids: string[], anchor: string, target: string): string[] {
    const from = ids.indexOf(anchor);
    const to = ids.indexOf(target);
    if (from < 0 || to < 0) return [target];
    return ids.slice(Math.min(from, to), Math.max(from, to) + 1);
}

/** A copy of the list with one item moved from one position to another */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(to, next.length)), 0, item!);
    return next;
}

/** What the DataTable keeps in localStorage/sessionStorage with `stateKey` */
export interface DataTableState {
    sorting?: DataTableSort[];
    filters?: Record<string, DataTableFilterValue>;
    globalFilter?: string;
    page?: number;
    pageSize?: number;
    columnSizing?: Record<string, number>;
    columnOrder?: string[];
    hiddenColumns?: string[];
    pinnedColumns?: { start: string[]; end: string[] };
    expanded?: string[];
    selection?: string[];
    density?: 'sm' | 'md' | 'lg';
}

const storageOf = (kind: 'local' | 'session') => {
    try {
        return typeof window === 'undefined'
            ? undefined
            : kind === 'local'
              ? window.localStorage
              : window.sessionStorage;
    } catch {
        // Blocked storage (privacy settings, sandboxed frames)
        return undefined;
    }
};

/** The saved state, or undefined (server, nothing saved, blocked or broken storage) */
export function loadTableState(key: string, kind: 'local' | 'session' = 'session'): DataTableState | undefined {
    try {
        const text = storageOf(kind)?.getItem(`wirecore-table:${key}`);
        return text ? (JSON.parse(text) as DataTableState) : undefined;
    } catch {
        return undefined;
    }
}

export function saveTableState(key: string, state: DataTableState, kind: 'local' | 'session' = 'session') {
    try {
        storageOf(kind)?.setItem(`wirecore-table:${key}`, JSON.stringify(state));
    } catch {
        // Full or blocked storage: the table works without
    }
}

export function clearTableState(key: string, kind: 'local' | 'session' = 'session') {
    try {
        storageOf(kind)?.removeItem(`wirecore-table:${key}`);
    } catch {
        // Blocked storage
    }
}

/** Ids of the cells whose text contains the query (case and accents ignored) – "Find in table" */
export function findMatches(
    rows: { id: string; cells: { columnId: string; text: string }[] }[],
    query: string,
    locale?: string
): { rowId: string; columnId: string }[] {
    if (!query.trim()) return [];
    return rows.flatMap((row) =>
        row.cells
            .filter((cell) => matchesSearch([cell.text], query.trim(), locale))
            .map((cell) => ({ rowId: row.id, columnId: cell.columnId }))
    );
}

/** A top level column of the table with the leaf columns below it (a column group, or one column) */
export interface ColumnBlock {
    id: string;
    leaves: string[];
}

/**
 * The column order after moving a whole column group one place earlier (-1) or later (1) among the top level
 * columns – the columns inside the group keep their order. Undefined at the edge.
 */
export function moveColumnBlock(
    order: string[],
    blocks: ColumnBlock[],
    blockId: string,
    direction: -1 | 1
): string[] | undefined {
    const position = (leaf: string) => {
        const index = order.indexOf(leaf);
        return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    const sorted = blocks
        .map((block) => ({ ...block, leaves: [...block.leaves].sort((a, b) => position(a) - position(b)) }))
        .sort((a, b) => position(a.leaves[0] ?? '') - position(b.leaves[0] ?? ''));
    const index = sorted.findIndex((block) => block.id === blockId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return undefined;
    return moveItem(sorted, index, target).flatMap((block) => block.leaves);
}

/**
 * Moving a row with the arrow keys in a grouped table: one place up or down in its group, past the edge of the
 * group into the neighbouring one (it takes the values of that group). `rows` are the data rows in shown order with
 * a key of their group. Undefined at the start or end.
 */
export function groupedRowMove(
    rows: { id: string; group: string }[],
    id: string,
    direction: 'up' | 'down'
): { targetId: string; after: boolean; groupChanged: boolean } | undefined {
    const index = rows.findIndex((row) => row.id === id);
    const neighbour = rows[index + (direction === 'up' ? -1 : 1)];
    if (index < 0 || !neighbour) return undefined;
    const groupChanged = neighbour.group !== rows[index]!.group;
    // Within the group: past the neighbour; into another group: at its edge next to the old group
    return { targetId: neighbour.id, after: direction === 'up' ? groupChanged : !groupChanged, groupChanged };
}

/** A cell of the print view */
export interface PrintCell {
    text: string;
    colSpan?: number;
    rowSpan?: number;
    align?: 'start' | 'end';
}

/** What `printTableHtml` prints: header rows, body rows (group rows bold) and a footer row */
export interface PrintTable {
    title: string;
    caption?: string;
    lang?: string;
    dir?: 'ltr' | 'rtl';
    head: PrintCell[][];
    body: { cells: PrintCell[]; kind?: 'row' | 'group' }[];
    foot?: PrintCell[];
}

const html = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * A document for printing a table: all rows, plain text, the header repeated on every page (`thead` as
 * table-header-group), no controls. Open it with `printHtml`.
 */
export function printTableHtml(table: PrintTable): string {
    const cell = (tag: 'th' | 'td', item: PrintCell, scope?: string) =>
        `<${tag}${scope ? ` scope="${scope}"` : ''}${item.colSpan && item.colSpan > 1 ? ` colspan="${item.colSpan}"` : ''}${
            item.rowSpan && item.rowSpan > 1 ? ` rowspan="${item.rowSpan}"` : ''
        }${item.align === 'end' ? ' class="end"' : ''}>${html(item.text)}</${tag}>`;
    const head = table.head
        .map(
            (row) =>
                `<tr>${row.map((item) => cell('th', item, item.colSpan && item.colSpan > 1 ? 'colgroup' : 'col')).join('')}</tr>`
        )
        .join('');
    const body = table.body
        .map(
            (row) =>
                `<tr${row.kind === 'group' ? ' class="group"' : ''}>${row.cells.map((item) => cell('td', item)).join('')}</tr>`
        )
        .join('');
    const foot = table.foot ? `<tfoot><tr>${table.foot.map((item) => cell('td', item)).join('')}</tr></tfoot>` : '';
    return `<!doctype html><html lang="${html(table.lang ?? 'en')}" dir="${table.dir ?? 'ltr'}"><head><meta charset="utf-8"><title>${html(table.title)}</title><style>
@page{margin:12mm}
body{margin:0;font:10pt/1.35 system-ui,sans-serif;color:#000;background:#fff}
table{width:100%;border-collapse:collapse}
caption{caption-side:top;text-align:start;font-size:12pt;font-weight:600;margin-bottom:6pt}
thead{display:table-header-group}
tfoot{display:table-footer-group}
th,td{border:.5pt solid #888;padding:3pt 5pt;text-align:start;vertical-align:top}
th{background:#eee;font-weight:600}
tr{break-inside:avoid}
.end{text-align:end;font-variant-numeric:tabular-nums}
.group td,tfoot td{font-weight:600;background:#f4f4f4}
</style></head><body><table>${table.caption ? `<caption>${html(table.caption)}</caption>` : ''}<thead>${head}</thead><tbody>${body}</tbody>${foot}</table></body></html>`;
}

/** Prints an HTML document in a hidden frame and removes the frame afterwards. Browser only. */
export function printHtml(document_: string) {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;inset-inline-start:-10000px;top:0;width:1px;height:1px;border:0';
    const cleanup = () => setTimeout(() => frame.remove(), 1000);
    frame.addEventListener('load', () => {
        const view = frame.contentWindow;
        if (!view) return cleanup();
        view.addEventListener('afterprint', cleanup, { once: true });
        view.focus();
        view.print();
    });
    frame.srcdoc = document_;
    document.body.append(frame);
}

/**
 * Applies a row move of a tree table (`row-reorder` with `parentId` and `index`) to the data: a copy with the row
 * under its new parent. `childrenKey` is the property holding the child rows.
 */
export function moveTreeRow<T extends object>(
    rows: T[],
    move: { rowId: string; parentId?: string | null; index?: number; to?: number },
    getRowId: (row: T) => string,
    childrenKey: keyof T
): T[] {
    interface Node {
        id: string;
        row: T;
        children?: Node[];
    }
    const wrap = (row: T): Node => {
        const children = row[childrenKey] as T[] | undefined;
        return { id: getRowId(row), row, ...(Array.isArray(children) ? { children: children.map(wrap) } : {}) };
    };
    const unwrap = (node: Node): T =>
        node.children ? ({ ...node.row, [childrenKey]: node.children.map(unwrap) } as T) : node.row;
    const moved = moveTreeNode(rows.map(wrap), {
        id: move.rowId,
        parentId: move.parentId ?? null,
        index: move.index ?? move.to ?? 0,
    });
    return moved.map(unwrap);
}
