// Spreadsheet features of the DataTable: a range of cells (mouse, Shift+click, Shift+arrow keys), copying it as
// tab-separated text (TSV, what Excel puts on the clipboard), pasting TSV into editable cells with the values read
// per column type (German numbers and dates), collected changes (`editMode="batch"`) and undo/redo. Framework-neutral;
// Vue and React keep the state and call these.

import { defaultLocale, parseLocaleNumber } from './i18n.js';
import { listValueKey } from './list-items.js';

/** A cell by row id and column id */
export interface CellPosition {
    rowId: string;
    columnId: string;
}

/** A range of cells: where it started (anchor) and where it ends (focus, the active cell) */
export interface CellRange {
    anchor: CellPosition;
    focus: CellPosition;
}

/** Rows and columns of a range as indexes into the shown rows and columns (both inclusive) */
export interface RangeBounds {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

/** Bounds of the range in the shown rows and columns – null when a corner is not shown (filtered, hidden) */
export function rangeBounds(range: CellRange | null, rowIds: string[], columnIds: string[]): RangeBounds | null {
    if (!range) return null;
    const rows = [rowIds.indexOf(range.anchor.rowId), rowIds.indexOf(range.focus.rowId)];
    const columns = [columnIds.indexOf(range.anchor.columnId), columnIds.indexOf(range.focus.columnId)];
    if (rows.some((index) => index < 0) || columns.some((index) => index < 0)) return null;
    return {
        top: Math.min(...rows),
        bottom: Math.max(...rows),
        left: Math.min(...columns),
        right: Math.max(...columns),
    };
}

/** The row and column ids inside the range, in shown order */
export function rangeIds(range: CellRange | null, rowIds: string[], columnIds: string[]) {
    const bounds = rangeBounds(range, rowIds, columnIds);
    if (!bounds) return { rowIds: [] as string[], columnIds: [] as string[] };
    return {
        rowIds: rowIds.slice(bounds.top, bounds.bottom + 1),
        columnIds: columnIds.slice(bounds.left, bounds.right + 1),
    };
}

/** Whether the cell lies in the bounds */
export const inRange = (bounds: RangeBounds | null, row: number, column: number) =>
    !!bounds && row >= bounds.top && row <= bounds.bottom && column >= bounds.left && column <= bounds.right;

/**
 * The range after Shift+arrow key (or Shift+Home/End, Ctrl+Shift+arrow to the edge): the focus moves, the anchor
 * stays. `next`/`previous` follow the writing direction (the caller maps left/right).
 */
export function extendRange(
    range: CellRange,
    rowIds: string[],
    columnIds: string[],
    key: 'up' | 'down' | 'next' | 'previous' | 'home' | 'end',
    toEdge = false
): CellRange {
    let row = rowIds.indexOf(range.focus.rowId);
    let column = columnIds.indexOf(range.focus.columnId);
    if (row < 0 || column < 0) return range;
    if (key === 'up') row = toEdge ? 0 : Math.max(0, row - 1);
    if (key === 'down') row = toEdge ? rowIds.length - 1 : Math.min(rowIds.length - 1, row + 1);
    if (key === 'previous' || key === 'home') column = toEdge || key === 'home' ? 0 : Math.max(0, column - 1);
    if (key === 'next' || key === 'end')
        column = toEdge || key === 'end' ? columnIds.length - 1 : Math.min(columnIds.length - 1, column + 1);
    return { anchor: range.anchor, focus: { rowId: rowIds[row]!, columnId: columnIds[column]! } };
}

/**
 * Tab-separated text as Excel copies it: one line per row, a tab between the cells; cells with a tab, a line break
 * or a quote are quoted (quotes doubled).
 */
export function toTsv(rows: string[][]): string {
    const cell = (text: string) => (/[\t\n\r"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text);
    return rows.map((row) => row.map(cell).join('\t')).join('\r\n');
}

/**
 * Cells of tab-separated text (pasted from Excel, LibreOffice or a table): rows by line break, cells by tab, quoted
 * cells may hold tabs, line breaks and doubled quotes. A line break at the end does not add an empty row.
 */
export function parseTsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    let start = true;
    for (let index = 0; index < text.length; index++) {
        const char = text[index]!;
        if (quoted) {
            if (char === '"' && text[index + 1] === '"') {
                cell += '"';
                index++;
            } else if (char === '"') quoted = false;
            else cell += char;
            continue;
        }
        if (char === '"' && start) {
            quoted = true;
            start = false;
            continue;
        }
        start = false;
        if (char === '\t') {
            row.push(cell);
            cell = '';
            start = true;
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[index + 1] === '\n') index++;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
            start = true;
        } else cell += char;
    }
    if (cell !== '' || row.length) {
        row.push(cell);
        rows.push(row);
    }
    return rows;
}

/** Kind of value a pasted text becomes – the editor of the column */
export type SheetValueType =
    'text' | 'textarea' | 'number' | 'select' | 'multiSelect' | 'date' | 'datetime' | 'checkbox';

/** A choice of a select column: a plain value or `{ value, label }` */
export type SheetOption = string | number | boolean | { value: unknown; label: string };

/** Why a pasted text could not become a value */
export type SheetParseError = 'number' | 'date' | 'option' | 'boolean';

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * A calendar day "2026-10-21" (with `time` "2026-10-21T14:30") from "21.10.2026", "21.10.26", "2026-10-21",
 * "10/21/2026" (English) or a date with time ("21.10.2026 14:30"). Null when it is no valid date.
 */
export function parseDateText(text: string, locale = defaultLocale, time = false): string | null {
    const trimmed = text.trim();
    let year: number;
    let month: number;
    let day: number;
    let rest: string;
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](.*))?$/.exec(trimmed);
    const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})(?:,?\s+(.*))?$/.exec(trimmed);
    const slashed = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:,?\s+(.*))?$/.exec(trimmed);
    if (iso) [year, month, day, rest] = [+iso[1]!, +iso[2]!, +iso[3]!, iso[4] ?? ''];
    else if (dotted) [day, month, year, rest] = [+dotted[1]!, +dotted[2]!, +dotted[3]!, dotted[4] ?? ''];
    else if (slashed) {
        // Day first in most locales; month first in English (US)
        const monthFirst = locale.toLowerCase() === 'en-us' || locale.toLowerCase() === 'en';
        const [first, second] = [+slashed[1]!, +slashed[2]!];
        [day, month] = monthFirst ? [second, first] : [first, second];
        [year, rest] = [+slashed[3]!, slashed[4] ?? ''];
    } else return null;
    if (year < 100) year += 2000;
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
    const date = `${year}-${pad(month)}-${pad(day)}`;
    if (!time) return date;
    const clock = /^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*Uhr)?$/i.exec(rest.trim());
    if (rest.trim() && !clock) return null;
    const hours = clock ? +clock[1]! : 0;
    const minutes = clock ? +clock[2]! : 0;
    if (hours > 23 || minutes > 59) return null;
    return `${date}T${pad(hours)}:${pad(minutes)}`;
}

const TRUE = new Set(['ja', 'j', 'yes', 'y', 'true', 'wahr', '1', 'x', '✓', 'on']);
const FALSE = new Set(['nein', 'n', 'no', 'false', 'falsch', '0', '', 'off']);

const optionValue = (option: SheetOption) => (typeof option === 'object' ? option.value : option);
const optionLabel = (option: SheetOption) => (typeof option === 'object' ? option.label : String(option));

/**
 * The value of a pasted text for a column: numbers in German or English notation, dates as "21.10.2026" or ISO,
 * yes/no, a choice by its label (or value). `{ error }` when the text does not fit.
 */
export function parseCellText(
    text: string,
    type: SheetValueType = 'text',
    options: { locale?: string; choices?: readonly SheetOption[] } = {}
): { value: unknown } | { error: SheetParseError } {
    const locale = options.locale ?? defaultLocale;
    const trimmed = text.trim();
    switch (type) {
        case 'number': {
            if (!trimmed) return { value: null };
            const value = parseLocaleNumber(trimmed, locale);
            return value === null ? { error: 'number' } : { value };
        }
        case 'date':
        case 'datetime': {
            if (!trimmed) return { value: null };
            const value = parseDateText(trimmed, locale, type === 'datetime');
            return value === null ? { error: 'date' } : { value };
        }
        case 'checkbox': {
            const key = trimmed.toLowerCase();
            if (TRUE.has(key)) return { value: true };
            if (FALSE.has(key)) return { value: false };
            return { error: 'boolean' };
        }
        case 'select':
        case 'multiSelect': {
            const choices = options.choices;
            const find = (part: string) => {
                if (!choices?.length) return { value: part };
                const folded = part.toLocaleLowerCase(locale);
                const match =
                    choices.find((choice) => optionLabel(choice).toLocaleLowerCase(locale) === folded) ??
                    choices.find((choice) => String(optionValue(choice)).toLocaleLowerCase(locale) === folded);
                return match === undefined ? undefined : { value: optionValue(match) };
            };
            if (type === 'select') {
                if (!trimmed) return { value: null };
                return find(trimmed) ?? { error: 'option' };
            }
            const parts = trimmed ? trimmed.split(/\s*[,;]\s*/).filter(Boolean) : [];
            const values: unknown[] = [];
            for (const part of parts) {
                const found = find(part);
                if (!found) return { error: 'option' };
                values.push(found.value);
            }
            return { value: values };
        }
        default:
            return { value: text };
    }
}

/** A cell the pasted text goes into */
export interface PasteTarget extends CellPosition {
    text: string;
}

/**
 * Where pasted cells go: from the top left cell of the range on; a single value fills the whole range (like Excel).
 * Cells beyond the shown rows or columns are left out.
 */
export function pasteTargets(
    cells: string[][],
    start: { row: number; column: number },
    rowIds: string[],
    columnIds: string[],
    bounds?: RangeBounds | null
): PasteTarget[] {
    const single = cells.length === 1 && cells[0]!.length === 1;
    if (single && bounds && (bounds.bottom > bounds.top || bounds.right > bounds.left)) {
        const targets: PasteTarget[] = [];
        for (let row = bounds.top; row <= bounds.bottom; row++)
            for (let column = bounds.left; column <= bounds.right; column++)
                targets.push({ rowId: rowIds[row]!, columnId: columnIds[column]!, text: cells[0]![0]! });
        return targets;
    }
    return cells.flatMap((line, rowOffset) =>
        line.flatMap((text, columnOffset) => {
            const rowId = rowIds[start.row + rowOffset];
            const columnId = columnIds[start.column + columnOffset];
            return rowId !== undefined && columnId !== undefined ? [{ rowId, columnId, text }] : [];
        })
    );
}

/** The range around cells (pasted cells – rows of different length included); null without cells */
export function rangeAround(cells: CellPosition[], rowIds: string[], columnIds: string[]): CellRange | null {
    const rows = cells.map((cell) => rowIds.indexOf(cell.rowId)).filter((index) => index >= 0);
    const columns = cells.map((cell) => columnIds.indexOf(cell.columnId)).filter((index) => index >= 0);
    if (!rows.length || !columns.length) return null;
    return {
        anchor: { rowId: rowIds[Math.min(...rows)]!, columnId: columnIds[Math.min(...columns)]! },
        focus: { rowId: rowIds[Math.max(...rows)]!, columnId: columnIds[Math.max(...columns)]! },
    };
}

/** One changed cell: the value before and after */
export interface CellChange extends CellPosition {
    before: unknown;
    after: unknown;
}

/** Whether two cell values are the same (lists and objects by content) */
export const sameCellValue = (a: unknown, b: unknown) =>
    a === b ||
    ((a === null || a === undefined || a === '') && (b === null || b === undefined || b === '')) ||
    (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null && listValueKey(a) === listValueKey(b));

const cellKey = (position: CellPosition) => `${position.rowId}\u0000${position.columnId}`;

/** Collected changes of the batch mode: by cell, with the original value */
export type PendingChanges = Record<string, CellChange>;

/**
 * The collected changes after applying changes (`after`) – a cell changed back to its original value is no longer
 * pending. With `undo` the `before` values are applied instead.
 */
export function applyPending(pending: PendingChanges, changes: CellChange[], undo = false): PendingChanges {
    const next = { ...pending };
    for (const change of undo ? [...changes].reverse() : changes) {
        const key = cellKey(change);
        const original = next[key]?.before ?? (undo ? change.after : change.before);
        const value = undo ? change.before : change.after;
        if (sameCellValue(value, original)) delete next[key];
        else next[key] = { rowId: change.rowId, columnId: change.columnId, before: original, after: value };
    }
    return next;
}

/** Cell changes (paste, undo) as new values per row, in the order of the rows – row editing reports them per row */
export function changesByRow(
    changes: readonly CellChange[],
    undo = false
): { rowId: string; values: Record<string, unknown> }[] {
    const rows = new Map<string, Record<string, unknown>>();
    for (const change of undo ? [...changes].reverse() : changes) {
        const values = rows.get(change.rowId) ?? {};
        values[change.columnId] = undo ? change.before : change.after;
        rows.set(change.rowId, values);
    }
    return [...rows].map(([rowId, values]) => ({ rowId, values }));
}

/** The pending value of a cell, if it has one */
export function pendingValue(pending: PendingChanges, rowId: string, columnId: string): { value: unknown } | undefined {
    const change = pending[cellKey({ rowId, columnId })];
    return change ? { value: change.after } : undefined;
}

/** Undo and redo of cell changes (edits, pastes, the batch mode) – one step may change several cells */
export class EditHistory {
    private done: CellChange[][] = [];
    private undone: CellChange[][] = [];
    private readonly limit: number;

    /** `limit`: steps kept, default 100 */
    constructor(limit = 100) {
        this.limit = limit;
    }

    /** A new step; clears what could be redone */
    push(changes: CellChange[]) {
        if (!changes.length) return;
        this.done.push(changes);
        if (this.done.length > this.limit) this.done.shift();
        this.undone = [];
    }

    /** The last step, to apply its `before` values – undefined when there is none */
    undo(): CellChange[] | undefined {
        const step = this.done.pop();
        if (step) this.undone.push(step);
        return step;
    }

    /** The last undone step, to apply its `after` values again */
    redo(): CellChange[] | undefined {
        const step = this.undone.pop();
        if (step) this.done.push(step);
        return step;
    }

    get canUndo() {
        return this.done.length > 0;
    }

    get canRedo() {
        return this.undone.length > 0;
    }

    clear() {
        this.done = [];
        this.undone = [];
    }
}

/** Ctrl+Z undoes, Ctrl+Y and Ctrl+Shift+Z redo (Cmd on macOS) – other keys undefined */
export function historyKey(event: {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
}) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return undefined;
    const key = event.key.toLowerCase();
    if (key === 'z') return event.shiftKey ? 'redo' : 'undo';
    if (key === 'y' && !event.shiftKey) return 'redo';
    return undefined;
}
