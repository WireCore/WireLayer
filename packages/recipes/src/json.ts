import { foldText } from './tree-data.js';

// JSON for JsonViewer (a tree of the data: types, search, depth) and JsonInput (check and format the text).

export type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'undefined';

export interface JsonNode {
    /** Path from the root, e.g. "$", "$.items[0].name" – unique, used as the tree id */
    id: string;
    /** Property name or array index (null for the root) */
    key: string | number | null;
    type: JsonType;
    value: unknown;
    /** Child nodes of objects and arrays */
    children?: JsonNode[];
}

/** JSON type of a value (arrays and null separate from objects) */
export function jsonTypeOf(value: unknown): JsonType {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean' || type === 'undefined') return type;
    if (type === 'bigint') return 'number';
    return 'object';
}

const identifier = /^[A-Za-z_$][\w$]*$/;
const childPath = (parent: string, key: string | number) =>
    typeof key === 'number'
        ? `${parent}[${key}]`
        : identifier.test(key)
          ? `${parent}.${key}`
          : `${parent}[${JSON.stringify(key)}]`;

/** The data as a tree (objects and arrays have children) */
export function jsonTree(data: unknown, id = '$', key: string | number | null = null): JsonNode {
    const type = jsonTypeOf(data);
    const node: JsonNode = { id, key, type, value: data };
    if (type === 'array')
        node.children = (data as unknown[]).map((item, index) => jsonTree(item, childPath(id, index), index));
    else if (type === 'object')
        node.children = Object.entries(data as Record<string, unknown>).map(([name, item]) =>
            jsonTree(item, childPath(id, name), name)
        );
    return node;
}

/** Ids of the branches down to `depth` levels below the root (0: all closed, Infinity: all open) */
export function jsonExpandedIds(root: JsonNode, depth: number): string[] {
    const ids: string[] = [];
    const visit = (node: JsonNode, level: number) => {
        if (!node.children || level >= depth) return;
        ids.push(node.id);
        for (const child of node.children) visit(child, level + 1);
    };
    visit(root, 0);
    return ids;
}

/** A primitive value as JSON text ("\"Anna\"", "42", "null") */
export function jsonValueText(value: unknown): string {
    if (value === undefined) return 'undefined';
    if (typeof value === 'bigint') return value.toString();
    return JSON.stringify(value);
}

/** What the copy button copies: the value as formatted JSON (strings without quotes) */
export function jsonCopyText(value: unknown, indent = 2): string {
    return typeof value === 'string' ? value : (JSON.stringify(value, null, indent) ?? String(value));
}

/**
 * Nodes whose key or (primitive) value contains the query (case and accents ignored), and the branches to open so
 * that every hit is visible.
 */
export function searchJson(root: JsonNode, query: string): { matches: string[]; expand: string[] } {
    const needle = foldText(query.trim());
    if (!needle) return { matches: [], expand: [] };
    const matches: string[] = [];
    const expand = new Set<string>();
    const visit = (node: JsonNode, ancestors: string[]) => {
        const keyHit = node.key !== null && foldText(String(node.key)).includes(needle);
        const valueHit = !node.children && foldText(String(node.value)).includes(needle);
        if (keyHit || valueHit) {
            matches.push(node.id);
            for (const id of ancestors) expand.add(id);
        }
        for (const child of node.children ?? []) visit(child, [...ancestors, node.id]);
    };
    visit(root, []);
    return { matches, expand: [...expand] };
}

export interface JsonCheck {
    valid: boolean;
    value?: unknown;
    /** Where the text stops being valid JSON (1-based) */
    line?: number;
    column?: number;
    /** The parser's message (English, from the browser) */
    message?: string;
}

/** Line and column (1-based) of a character offset */
function lineAndColumn(text: string, offset: number): { line: number; column: number } {
    const before = text.slice(0, offset).split('\n');
    return { line: before.length, column: before.at(-1)!.length + 1 };
}

/**
 * Offset of the first character that makes the text invalid JSON (a small scanner – engines do not all report a
 * position, e.g. V8 says only "is not valid JSON"); -1 when the text is valid.
 */
export function jsonErrorOffset(text: string): number {
    let index = 0;
    const fail = (at = index): never => {
        throw at;
    };
    const space = () => {
        while (index < text.length && ' \t\n\r'.includes(text[index]!)) index++;
    };
    const literal = (word: string) => {
        for (const char of word) if (text[index++] !== char) fail(index - 1);
    };
    const string = () => {
        index++;
        while (index < text.length) {
            const char = text[index]!;
            if (char === '"') {
                index++;
                return;
            }
            if (char < ' ') fail();
            if (char === '\\') {
                const next = text[index + 1];
                if (next === 'u') {
                    if (!/^[\da-fA-F]{4}$/.test(text.slice(index + 2, index + 6))) fail(index + 2);
                    index += 6;
                    continue;
                }
                if (!next || !'"\\/bfnrt'.includes(next)) fail(index + 1);
                index += 2;
                continue;
            }
            index++;
        }
        fail();
    };
    const number = () => {
        const match = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(index));
        if (!match || !match[0] || match[0] === '-') fail();
        index += match![0].length;
    };
    const value = (): void => {
        space();
        const char = text[index];
        if (char === '{') {
            index++;
            space();
            if (text[index] === '}') {
                index++;
                return;
            }
            for (;;) {
                space();
                if (text[index] !== '"') fail();
                string();
                space();
                if (text[index] !== ':') fail();
                index++;
                value();
                space();
                if (text[index] === ',') {
                    index++;
                    continue;
                }
                if (text[index] === '}') {
                    index++;
                    return;
                }
                fail();
            }
        }
        if (char === '[') {
            index++;
            space();
            if (text[index] === ']') {
                index++;
                return;
            }
            for (;;) {
                value();
                space();
                if (text[index] === ',') {
                    index++;
                    continue;
                }
                if (text[index] === ']') {
                    index++;
                    return;
                }
                fail();
            }
        }
        if (char === '"') return string();
        if (char === 't') return literal('true');
        if (char === 'f') return literal('false');
        if (char === 'n') return literal('null');
        if (char === '-' || (char !== undefined && char >= '0' && char <= '9')) return number();
        fail();
    };
    try {
        value();
        space();
        if (index < text.length) fail();
        return -1;
    } catch (offset) {
        return Math.min(Number(offset), text.length);
    }
}

/** Parses JSON text; on an error its position (line, column, 1-based) */
export function checkJson(text: string): JsonCheck {
    try {
        return { valid: true, value: JSON.parse(text) };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const offset = jsonErrorOffset(text);
        return { valid: false, message, ...lineAndColumn(text, offset < 0 ? text.length : offset) };
    }
}

/** Formatted JSON text (`indent` spaces, 0: one line); null when the text is no valid JSON */
export function formatJson(text: string, indent = 2): string | null {
    const result = checkJson(text);
    if (!result.valid) return null;
    return JSON.stringify(result.value, null, indent || undefined);
}
