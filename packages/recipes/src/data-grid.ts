// Keyboard navigation of the DataTable as a grid (`navigation="grid"`, ARIA APG data grid): one Tab stop, the arrow
// keys move from cell to cell, Home/End, Ctrl+Home/End, Page Up/Down, Enter/F2 enter a cell (or start editing),
// Escape leaves it, Space selects the row. Works on the rendered table (browser only); Vue and React share it.

/**
 * The cell covering each column of each row, as an HTML table lays them out: a cell with rowSpan > 1 also covers
 * the rows below, so header rows with column groups line up.
 */
export function tableSlots<T>(
    rows: readonly (readonly T[])[],
    span: (cell: T) => { rowSpan: number; colSpan: number }
) {
    const slots: T[][] = rows.map(() => []);
    rows.forEach((cells, rowIndex) => {
        let column = 0;
        for (const cell of cells) {
            while (slots[rowIndex]![column] !== undefined) column++;
            const { rowSpan, colSpan } = span(cell);
            for (let down = 0; down < Math.max(1, rowSpan); down++)
                for (let across = 0; across < Math.max(1, colSpan); across++) {
                    const row = slots[rowIndex + down];
                    if (row) row[column + across] = cell;
                }
            column += Math.max(1, colSpan);
        }
    });
    return slots;
}

export interface GridNavigationOptions {
    /** Number of rows in the body, rendered or not (virtual scrolling renders only some) */
    itemCount: number;
    /** Brings a body row into the rendered range (virtual scrolling) */
    scrollToItem?: (index: number) => void;
    /** Rows per Page Up/Down (default 10) */
    pageRows?: number;
    /** Space on a cell of a row: select it */
    onSelectRow?: (rowId: string) => void;
}

/** Focusable content of a cell; inside the grid these are not Tab stops – Enter or F2 reach them */
const WIDGETS =
    'a[href], button, input:not([type="hidden"]), select, textarea, [contenteditable=""], [contenteditable="true"], [tabindex]';
/** Widgets that use the arrow keys themselves (text, choices, spin buttons, popup triggers) */
const OWN_KEYS =
    'input:not([type="checkbox"], [type="radio"], [type="button"]), textarea, select, [contenteditable=""], [contenteditable="true"], [role="combobox"], [role="spinbutton"], [role="slider"], [aria-haspopup]:not([aria-haspopup="false"])';

const isCell = (element: Element) => element.tagName === 'TD' || element.tagName === 'TH';

/** Rows of the table that are part of the grid (not the spacer rows of virtual scrolling) */
const visibleRows = (rows: HTMLCollectionOf<HTMLTableRowElement> | undefined) =>
    [...(rows ?? [])].filter((row) => row.getAttribute('aria-hidden') !== 'true');

/** Focusable elements in a cell (or a row being edited), in DOM order */
export function gridWidgets(scope: Element): HTMLElement[] {
    return [...scope.querySelectorAll<HTMLElement>(WIDGETS)].filter(
        (element) =>
            !isCell(element) &&
            !element.closest('[hidden], [aria-hidden="true"]') &&
            !(element as HTMLButtonElement).disabled &&
            element.getAttribute('aria-disabled') !== 'true'
    );
}

/** The cell of this table that holds the element (not one of a table nested in a cell) */
export function gridCellOf(table: HTMLTableElement, element: Element | null): HTMLElement | null {
    let cell = element?.closest<HTMLElement>('td, th') ?? null;
    while (cell && cell.closest('table') !== table) cell = cell.parentElement?.closest<HTMLElement>('td, th') ?? null;
    return cell;
}

interface GridState {
    cell?: HTMLElement;
    /** Column kept while moving up and down through cells that span several columns */
    column?: number;
}
const states = new WeakMap<HTMLTableElement, GridState>();

/** One line of the grid: a rendered row, or a body row that is not rendered (virtual scrolling) */
interface Line {
    row?: HTMLTableRowElement;
    item?: number;
    /** Cells by column (header rows: with the cells of the rows above that span into this one) */
    slots?: HTMLElement[];
}

function lines(table: HTMLTableElement, itemCount: number) {
    const span = (cell: HTMLTableCellElement) => ({ rowSpan: cell.rowSpan, colSpan: cell.colSpan });
    const slotsOf = (rows: HTMLTableRowElement[]) =>
        tableSlots(
            rows.map((row) => [...row.cells]),
            span
        );
    const result: Line[] = [];
    const head = visibleRows(table.tHead?.rows);
    slotsOf(head).forEach((slots, index) => result.push({ row: head[index], slots }));
    const bodies = [...table.tBodies];
    const main = bodies.pop();
    for (const body of bodies) for (const row of visibleRows(body.rows)) result.push({ row, slots: slotsOf([row])[0] });
    const bodyStart = result.length;
    const rows = visibleRows(main?.rows);
    // The rendered rows together: cells merged down (rowSpan) cover the rows below
    const bodySlots = new Map(slotsOf(rows).map((slots, index) => [rows[index]!, slots]));
    const indexed = rows.filter((row) => row.dataset.index !== undefined);
    if (itemCount > 0 && indexed.length) {
        const byIndex = new Map(indexed.map((row) => [Number(row.dataset.index), row]));
        for (let item = 0; item < itemCount; item++) {
            const row = byIndex.get(item);
            result.push({ row, item, slots: row ? bodySlots.get(row) : undefined });
        }
    } else for (const row of rows) result.push({ row, slots: bodySlots.get(row) });
    const bodyEnd = result.length - 1;
    for (const row of visibleRows(table.tFoot?.rows)) result.push({ row, slots: slotsOf([row])[0] });
    return { lines: result, bodyStart, bodyEnd };
}

const firstColumn = (slots: HTMLElement[], cell: HTMLElement) => slots.indexOf(cell);
const lastColumn = (slots: HTMLElement[], cell: HTMLElement) => slots.lastIndexOf(cell);

/** Sticky parts in the scroll container: header, frozen rows, footer and pinned cells must not cover the cell */
function reveal(table: HTMLTableElement, cell: HTMLElement) {
    cell.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    const scroller = table.parentElement;
    if (!scroller?.scrollBy) return;
    const sticky = (element: Element) => getComputedStyle(element).position === 'sticky';
    const view = scroller.getBoundingClientRect();
    const box = cell.getBoundingClientRect();
    let top = view.top;
    let bottom = view.top + scroller.clientHeight;
    const section = cell.parentElement?.parentElement;
    const parts = [table.tHead, ...[...table.tBodies].slice(0, -1)].filter((part) => !!part && sticky(part));
    for (const part of parts) top = Math.max(top, part!.getBoundingClientRect().bottom);
    if (table.tFoot && sticky(table.tFoot)) bottom = Math.min(bottom, table.tFoot.getBoundingClientRect().top);
    const down =
        section && sticky(section) ? 0 : box.top < top ? box.top - top : box.bottom > bottom ? box.bottom - bottom : 0;
    let left = view.left;
    let right = view.left + scroller.clientWidth;
    if (!sticky(cell))
        for (const other of cell.parentElement?.children ?? []) {
            if (other === cell || !sticky(other)) continue;
            const rect = other.getBoundingClientRect();
            if (rect.left + rect.width / 2 < box.left + box.width / 2) left = Math.max(left, rect.right);
            else right = Math.min(right, rect.left);
        }
    const across = sticky(cell) ? 0 : box.left < left ? box.left - left : box.right > right ? box.right - right : 0;
    if (down || across) scroller.scrollBy({ top: down, left: across });
}

function focusCell(table: HTMLTableElement, cell: HTMLElement, column?: number) {
    const state = states.get(table) ?? {};
    states.set(table, { ...state, cell, column: column ?? state.column });
    syncGrid(table);
    cell.focus({ preventScroll: true });
    reveal(table, cell);
}

/** Calls `then` once the element exists – virtual scrolling renders a row a frame or two after scrolling */
function whenRendered(find: () => HTMLElement | undefined, then: (element: HTMLElement) => void, frames = 30) {
    const element = find();
    if (element) then(element);
    else if (frames > 0) requestAnimationFrame(() => whenRendered(find, then, frames - 1));
}

/**
 * Makes the table a grid with one Tab stop: the active cell (the last focused one, at first the first cell) has
 * tabindex 0, every other cell and all content -1. Call it after each render.
 */
export function syncGrid(table: HTMLTableElement) {
    const cells = [...table.querySelectorAll<HTMLElement>('tr:not([aria-hidden="true"]) > :is(td, th)')].filter(
        (cell) => cell.closest('table') === table
    );
    const state = states.get(table) ?? {};
    const active = state.cell && state.cell.isConnected && cells.includes(state.cell) ? state.cell : cells[0];
    if (active !== state.cell) states.set(table, { ...state, cell: active });
    for (const cell of cells) {
        const value = cell === active ? '0' : '-1';
        if (cell.getAttribute('tabindex') !== value) cell.setAttribute('tabindex', value);
    }
    for (const widget of gridWidgets(table))
        if (widget.getAttribute('tabindex') !== '-1') widget.setAttribute('tabindex', '-1');
}

/** Focus moved into the table (click, Enter, a re-render): the cell becomes the active one */
export function gridFocusIn(table: HTMLTableElement, target: Element) {
    const cell = gridCellOf(table, target);
    if (!cell || states.get(table)?.cell === cell) return;
    states.set(table, { cell });
    syncGrid(table);
}

const NAVIGATION = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']);

/** Keyboard of the grid – call it from the keydown handler of the table; returns whether it handled the key */
export function gridKeydown(event: KeyboardEvent, table: HTMLTableElement, options: GridNavigationOptions): boolean {
    if (event.defaultPrevented || event.altKey) return false;
    const target = event.target as HTMLElement;
    const cell = gridCellOf(table, target);
    if (!cell) return false;
    const onCell = target === cell;
    const handled = () => {
        event.preventDefault();
        return true;
    };

    if (!onCell) {
        if (event.key === 'Escape') {
            focusCell(table, cell);
            return handled();
        }
        if (event.key === 'Tab') {
            // Through the content of the cell – or of the whole row while it is edited
            const row = cell.parentElement!;
            const widgets = gridWidgets(row.querySelector('[data-editor]') ? row : cell);
            const position = widgets.findIndex((widget) => widget === target || widget.contains(target));
            const next = widgets[position + (event.shiftKey ? -1 : 1)];
            if (position < 0 || !next) return false;
            next.focus();
            return handled();
        }
        // Keys of the widget itself; buttons, checkboxes and links leave the arrow keys to the grid
        if (!NAVIGATION.has(event.key) || target.closest(OWN_KEYS)) return false;
    }

    const rtl = getComputedStyle(table).direction === 'rtl';
    const key =
        event.key === 'ArrowLeft' || event.key === 'ArrowRight'
            ? (event.key === 'ArrowRight') !== rtl
                ? 'next'
                : 'previous'
            : event.key;
    const ctrl = event.ctrlKey || event.metaKey;

    if (NAVIGATION.has(event.key)) {
        const { lines: all, bodyStart, bodyEnd } = lines(table, options.itemCount);
        const row = cell.parentElement as HTMLTableRowElement;
        const current = all.findIndex((line) => line.row === row || line.slots?.includes(cell));
        if (current < 0) return false;
        const slots = all[current]!.slots ?? [];
        const state = states.get(table) ?? {};
        const start = firstColumn(slots, cell);
        const end = lastColumn(slots, cell);
        const column =
            state.column !== undefined && state.column >= start && state.column <= end ? state.column : start;

        const goTo = (lineIndex: number, at: number | 'last', keep = true) => {
            const line = all[lineIndex];
            if (!line) return;
            const pick = (slotsOfLine: HTMLElement[]) =>
                at === 'last' ? slotsOfLine.at(-1) : (slotsOfLine[Math.min(at, slotsOfLine.length - 1)] ?? undefined);
            const columnOf = (target2: HTMLElement, slotsOfLine: HTMLElement[]) =>
                keep && at !== 'last' ? at : firstColumn(slotsOfLine, target2);
            if (line.slots) {
                const next = pick(line.slots);
                if (next) focusCell(table, next, columnOf(next, line.slots));
                return;
            }
            // A body row outside the rendered range: scroll there first
            options.scrollToItem?.(line.item!);
            whenRendered(
                () =>
                    table.tBodies[table.tBodies.length - 1]?.querySelector<HTMLTableRowElement>(
                        `tr[data-index="${line.item}"]`
                    ) ?? undefined,
                (found) => {
                    const slotsOfLine = [...(found as HTMLTableRowElement).cells] as HTMLElement[];
                    const expanded = tableSlots([slotsOfLine], (item) => ({
                        rowSpan: 1,
                        colSpan: (item as HTMLTableCellElement).colSpan,
                    }))[0]!;
                    const next = pick(expanded);
                    if (next) focusCell(table, next, columnOf(next, expanded));
                }
            );
        };
        /** Up or down to the next line where the column is another cell (header cells span several rows) */
        const vertical = (step: number, distance = 1) => {
            let index = Math.max(0, Math.min(all.length - 1, current + step * distance));
            while (index !== current && all[index]?.slots?.[column] === cell) index += step;
            if (index < 0 || index >= all.length || index === current) return;
            goTo(index, column);
        };
        switch (key) {
            case 'next':
                if (slots[end + 1]) focusCell(table, slots[end + 1]!, end + 1);
                break;
            case 'previous':
                if (start > 0 && slots[start - 1])
                    focusCell(table, slots[start - 1]!, firstColumn(slots, slots[start - 1]!));
                break;
            case 'Home':
                if (ctrl) goTo(0, 0, false);
                else if (slots[0]) focusCell(table, slots[0], 0);
                break;
            case 'End':
                if (ctrl) goTo(bodyEnd >= bodyStart ? bodyEnd : all.length - 1, 'last', false);
                else if (slots.length) focusCell(table, slots.at(-1)!, slots.length - 1);
                break;
            case 'ArrowUp':
                vertical(-1);
                break;
            case 'ArrowDown':
                vertical(1);
                break;
            case 'PageUp':
                vertical(-1, options.pageRows ?? 10);
                break;
            case 'PageDown':
                vertical(1, options.pageRows ?? 10);
                break;
        }
        return handled();
    }

    if (!onCell) return false;
    const widgets = gridWidgets(cell);
    const single = widgets.length === 1 ? widgets[0]! : undefined;
    const pressable = single?.matches('button, a[href], input[type="checkbox"], input[type="radio"]')
        ? single
        : undefined;
    switch (event.key) {
        case 'Enter':
            // One button, checkbox or link: use it; otherwise into the cell
            if (pressable) pressable.click();
            else widgets[0]?.focus();
            return widgets.length ? handled() : false;
        case 'F2': {
            const edit = cell.querySelector<HTMLElement>('[data-edit]');
            if (edit) edit.click();
            else widgets[0]?.focus();
            return edit || widgets.length ? handled() : false;
        }
        case ' ': {
            if (pressable?.matches('input[type="checkbox"], input[type="radio"], [role="checkbox"]')) {
                pressable.click();
                return handled();
            }
            const rowId = (cell.parentElement as HTMLElement).dataset.rowId;
            if (!rowId || !options.onSelectRow) return false;
            options.onSelectRow(rowId);
            return handled();
        }
    }
    return false;
}

/**
 * Tree table as a treegrid: what ArrowRight/ArrowLeft do on the tree cell of a row (APG treegrid) – open a closed row,
 * close an open one, go to the parent row; undefined: the normal grid move. Left and right are swapped right-to-left.
 */
export function treeGridKeyAction(
    key: string,
    row: { expandable: boolean; expanded: boolean; level: number },
    rtl = false
): 'expand' | 'collapse' | 'parent' | undefined {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (key === forward) return row.expandable && !row.expanded ? 'expand' : undefined;
    if (key === backward) return row.expandable && row.expanded ? 'collapse' : row.level > 1 ? 'parent' : undefined;
    return undefined;
}

let measureContext: CanvasRenderingContext2D | null | undefined;

/**
 * Width of the widest text in the font of `cell`, its padding and border added – measured on a canvas, so it also
 * covers rows that are not rendered (virtual scrolling). Browser only; 0 without a canvas.
 */
export function textColumnWidth(cell: HTMLElement, texts: Iterable<string>): number {
    measureContext ??= document.createElement('canvas').getContext?.('2d') ?? null;
    if (!measureContext) return 0;
    const style = getComputedStyle(cell);
    measureContext.font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    let widest = 0;
    for (const text of new Set(texts)) widest = Math.max(widest, measureContext.measureText(text).width);
    const frame = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const;
    return Math.ceil(widest + frame.reduce((sum, side) => sum + (parseFloat(style[side]) || 0), 0));
}

/**
 * Width that fits the content of a column on one line (double click on the resize handle): the header cell and
 * the rendered cells of the column are measured in a hidden copy; `texts` (every value of the column, e.g. with
 * virtual scrolling) are measured on a canvas in the font of a body cell as well. Browser only.
 */
export function fitColumnWidth(table: HTMLTableElement, header: HTMLElement, texts?: Iterable<string>): number {
    const span = (cell: HTMLTableCellElement) => ({ rowSpan: cell.rowSpan, colSpan: cell.colSpan });
    const head = tableSlots(
        visibleRows(table.tHead?.rows).map((row) => [...row.cells]),
        span
    );
    const column = head.map((slots) => slots.indexOf(header as HTMLTableCellElement)).find((index) => index >= 0) ?? -1;
    if (column < 0) return 0;
    const cells: HTMLElement[] = [header];
    for (const body of [...table.tBodies, ...(table.tFoot ? [table.tFoot] : [])])
        for (const row of visibleRows(body.rows)) {
            const cell = tableSlots([[...row.cells]], span)[0]![column];
            if (cell && cell.colSpan === 1) cells.push(cell);
        }
    const probe = document.createElement('table');
    probe.style.cssText =
        'position:absolute;visibility:hidden;top:0;inset-inline-start:0;width:auto;table-layout:auto;border-spacing:0';
    const body = probe.createTBody();
    for (const cell of cells) {
        const copy = cell.cloneNode(true) as HTMLElement;
        // No second radio button of the same group, no duplicate ids
        for (const element of [copy, ...copy.querySelectorAll('[id], [name]')]) {
            element.removeAttribute('id');
            element.removeAttribute('name');
        }
        Object.assign(copy.style, { whiteSpace: 'nowrap', width: 'auto', position: 'static' });
        body.insertRow().append(copy);
    }
    (table.parentElement ?? table).append(probe);
    const width = Math.ceil(probe.getBoundingClientRect().width);
    probe.remove();
    if (!texts) return width;
    // A rendered body cell gives the font of the values (the header is bold)
    const sample = cells.find((cell) => cell !== header && cell.closest('tbody')) ?? header;
    return Math.max(width, textColumnWidth(sample, texts));
}
