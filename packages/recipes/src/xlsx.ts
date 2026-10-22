// A small XLSX writer (Office Open XML spreadsheet) without a library: the parts of one worksheet as XML, packed
// into a ZIP archive with "stored" entries (no compression) and CRC-32 checksums. Numbers stay numbers, dates get a
// date format, the header row is bold and frozen. Used by the DataTable export (`exportXlsx`, `generateXlsx`).

const encoder = new TextEncoder();

let crcTable: Uint32Array | undefined;

/** CRC-32 (ZIP, polynomial 0xEDB88320) of the bytes */
export function crc32(bytes: Uint8Array): number {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let byte = 0; byte < 256; byte++) {
            let value = byte;
            for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
            crcTable[byte] = value >>> 0;
        }
    }
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

/** A file of a ZIP archive: its path and content (text is written as UTF-8) */
export interface ZipEntry {
    name: string;
    data: Uint8Array | string;
}

/** DOS time and date of the entries – fixed, so the same table gives the same bytes */
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

/** A ZIP archive with the files stored as they are (method 0). Enough for XLSX; no ZIP64, so below 4 GB. */
export function zipStore(entries: ZipEntry[]): Uint8Array {
    const files = entries.map((entry) => {
        const name = encoder.encode(entry.name);
        const data = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
        return { name, data, crc: crc32(data) };
    });
    const size =
        files.reduce((sum, file) => sum + 30 + file.name.length + file.data.length + 46 + file.name.length, 0) + 22;
    const bytes = new Uint8Array(size);
    const view = new DataView(bytes.buffer);
    let offset = 0;
    const u16 = (value: number) => {
        view.setUint16(offset, value, true);
        offset += 2;
    };
    const u32 = (value: number) => {
        view.setUint32(offset, value, true);
        offset += 4;
    };
    const put = (part: Uint8Array) => {
        bytes.set(part, offset);
        offset += part.length;
    };
    const header = (file: (typeof files)[number]) => {
        u16(20); // version needed: 2.0
        u16(0x0800); // flags: names in UTF-8
        u16(0); // method: stored
        u16(DOS_TIME);
        u16(DOS_DATE);
        u32(file.crc);
        u32(file.data.length); // compressed size
        u32(file.data.length); // size
        u16(file.name.length);
        u16(0); // extra field
    };
    const offsets: number[] = [];
    for (const file of files) {
        offsets.push(offset);
        u32(0x04034b50); // local file header
        header(file);
        put(file.name);
        put(file.data);
    }
    const directory = offset;
    files.forEach((file, index) => {
        u32(0x02014b50); // central directory header
        u16(20); // made by: 2.0
        header(file);
        u16(0); // comment
        u16(0); // disk
        u16(0); // internal attributes
        u32(0); // external attributes
        u32(offsets[index]!);
        put(file.name);
    });
    const directorySize = offset - directory;
    u32(0x06054b50); // end of central directory
    u16(0);
    u16(0);
    u16(files.length);
    u16(files.length);
    u32(directorySize);
    u32(directory);
    u16(0);
    return bytes;
}

/** Text for XML: &, <, >, quotes escaped; characters XML does not allow (control characters) dropped */
export function escapeXml(text: string): string {
    return (
        text
            // eslint-disable-next-line no-control-regex
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;')
    );
}

/** A date as a cell value; `time` shows the time of day as well */
export interface XlsxDate {
    date: Date | string | number;
    time?: boolean;
}

/** Value of a cell: text, number, yes/no, a date or empty */
export type XlsxValue = string | number | boolean | XlsxDate | null | undefined;

export interface XlsxColumn {
    header: string;
    /** Width in characters (default: fits header and values, at most 60) */
    width?: number;
}

/** A row of the sheet; `group` rows (interim headings) and the `total` row are bold */
export interface XlsxRow {
    cells: XlsxValue[];
    kind?: 'data' | 'group' | 'total';
    /** Outline level of a data row below group rows (Excel can fold them), 0–7 */
    level?: number;
}

export interface XlsxSheet {
    /** Name of the worksheet (at most 31 characters, without : \ / ? * [ ]) */
    name?: string;
    columns: XlsxColumn[];
    rows: XlsxRow[];
}

/** A sheet name Excel accepts: without : \ / ? * [ ], not empty, at most 31 characters */
export function xlsxSheetName(name: string | undefined): string {
    const clean = (name ?? '')
        .replace(/[:\\/?*[\]]/g, ' ')
        .replace(/^'+|'+$/g, '')
        .trim()
        .slice(0, 31);
    return clean || 'Sheet1';
}

/** Column letters of a 0-based index: 0 → A, 26 → AA */
export function xlsxColumnName(index: number): string {
    let name = '';
    for (let rest = index + 1; rest > 0; rest = Math.floor((rest - 1) / 26))
        name = String.fromCharCode(65 + ((rest - 1) % 26)) + name;
    return name;
}

const DAY = 86_400_000;
const EPOCH = Date.UTC(1899, 11, 30);

/**
 * Excel's serial number of a date: days since 30.12.1899, the time as a fraction. A calendar day ("2026-10-21") or
 * a local date and time ("2026-10-21T14:30") is taken as written; a Date or a timestamp in local time.
 */
export function xlsxDateSerial(value: Date | string | number): number | null {
    if (typeof value === 'string') {
        const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value.trim());
        if (match) {
            const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
            return (Date.UTC(+year!, +month! - 1, +day!, +hour, +minute, +second) - EPOCH) / DAY;
        }
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const local = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    );
    return (local - EPOCH) / DAY;
}

// Cell styles (xl/styles.xml, cellXfs): 0 normal, 1 bold, 2 date, 3 date and time, 4 bold date, 5 bold date and time
const STYLE = { normal: 0, bold: 1, date: 2, dateTime: 3 } as const;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="14" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

const isDate = (value: XlsxValue): value is XlsxDate => typeof value === 'object' && value !== null && 'date' in value;

/** Shown length of a value, for the column width */
const shownLength = (value: XlsxValue) =>
    isDate(value) ? (value.time ? 16 : 10) : value === null || value === undefined ? 0 : String(value).length;

function cellXml(value: XlsxValue, reference: string, bold: boolean): string {
    if (value === null || value === undefined || value === '') return bold ? `<c r="${reference}" s="1"/>` : '';
    if (typeof value === 'number')
        return Number.isFinite(value)
            ? `<c r="${reference}"${bold ? ' s="1"' : ''}><v>${value}</v></c>`
            : cellXml(String(value), reference, bold);
    if (typeof value === 'boolean')
        return `<c r="${reference}" t="b"${bold ? ' s="1"' : ''}><v>${value ? 1 : 0}</v></c>`;
    if (isDate(value)) {
        const serial = xlsxDateSerial(value.date);
        if (serial === null) return cellXml(String(value.date), reference, bold);
        const style = (value.time ? STYLE.dateTime : STYLE.date) + (bold ? 2 : 0);
        return `<c r="${reference}" s="${style}"><v>${serial}</v></c>`;
    }
    // Inline text: never a formula, so values like "=1+1" stay text (unlike CSV)
    const text = escapeXml(String(value));
    const space = /^\s|\s$|\n/.test(text) ? ' xml:space="preserve"' : '';
    return `<c r="${reference}" t="inlineStr"${bold ? ' s="1"' : ''}><is><t${space}>${text}</t></is></c>`;
}

function sheetXml(sheet: XlsxSheet): string {
    const widths = sheet.columns.map((column, index) => {
        if (column.width) return column.width;
        const longest = Math.max(
            column.header.length,
            ...sheet.rows.map((row) => (row.kind === 'group' && index === 0 ? 0 : shownLength(row.cells[index])))
        );
        return Math.min(60, Math.max(8, longest + 2));
    });
    const cols = widths
        .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
        .join('');
    const rowXml = (cells: XlsxValue[], number: number, bold: boolean, level = 0) =>
        `<row r="${number}"${level ? ` outlineLevel="${Math.min(7, level)}"` : ''}>${cells
            .map((value, index) => cellXml(value, `${xlsxColumnName(index)}${number}`, bold))
            .join('')}</row>`;
    const rows = [
        rowXml(
            sheet.columns.map((column) => column.header),
            1,
            true
        ),
        ...sheet.rows.map((row, index) =>
            rowXml(row.cells, index + 2, row.kind === 'group' || row.kind === 'total', row.level)
        ),
    ].join('');
    const last = `${xlsxColumnName(Math.max(0, sheet.columns.length - 1))}${sheet.rows.length + 1}`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${last}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${rows}</sheetData></worksheet>`;
}

/** The parts (files) of the workbook, before packing – for tests and own archives */
export function xlsxParts(sheet: XlsxSheet): ZipEntry[] {
    const name = escapeXml(xlsxSheetName(sheet.name));
    return [
        {
            name: '[Content_Types].xml',
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
        },
        {
            name: '_rels/.rels',
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
        },
        {
            name: 'xl/workbook.xml',
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
        },
        {
            name: 'xl/_rels/workbook.xml.rels',
            data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
        },
        { name: 'xl/styles.xml', data: STYLES },
        { name: 'xl/worksheets/sheet1.xml', data: sheetXml(sheet) },
    ];
}

/** An XLSX file (one worksheet) as bytes */
export function createXlsx(sheet: XlsxSheet): Uint8Array {
    return zipStore(xlsxParts(sheet));
}

export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Offers bytes as a file download. Browser only. */
export function downloadBytes(filename: string, bytes: Uint8Array, type = XLSX_TYPE) {
    const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type }));
    const link = Object.assign(document.createElement('a'), { href: url, download: filename });
    link.click();
    URL.revokeObjectURL(url);
}
