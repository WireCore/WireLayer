import { foldText } from './tree-data.js';

// Log lines for LogViewer: levels, filter and search, and the window of lines that is rendered.

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogLine {
    /** Stable id (default: the line number) */
    id?: string | number;
    text: string;
    level?: LogLevel;
    /** Time stamp shown before the text (ISO text or Date) */
    time?: string | Date;
}

/** Strings become info lines without a level */
export function toLogLines(lines: readonly (LogLine | string)[]): LogLine[] {
    return lines.map((line) => (typeof line === 'string' ? { text: line } : line));
}

/** Level read from the text when a line has none: "ERROR", "[warn]", "WARNING:" … */
export function detectLogLevel(text: string): LogLevel | undefined {
    const match = /\b(error|err|fatal|warn|warning|info|debug|trace)\b/i.exec(text.slice(0, 40));
    if (!match) return undefined;
    const word = match[1]!.toLowerCase();
    if (word === 'error' || word === 'err' || word === 'fatal') return 'error';
    if (word.startsWith('warn')) return 'warn';
    if (word === 'info') return 'info';
    return 'debug';
}

/**
 * Indexes of the lines shown: levels in `levels` (lines without a level always) and every word of `query` in the
 * text (case and accents ignored).
 */
export function filterLogLines(
    lines: readonly LogLine[],
    options: { query?: string; levels?: readonly LogLevel[] } = {}
): number[] {
    const words = foldText(options.query ?? '')
        .split(/\s+/)
        .filter(Boolean);
    const levels = options.levels ? new Set(options.levels) : undefined;
    const result: number[] = [];
    lines.forEach((line, index) => {
        if (levels && line.level && !levels.has(line.level)) return;
        if (words.length) {
            const text = foldText(line.text);
            if (!words.every((word) => text.includes(word))) return;
        }
        result.push(index);
    });
    return result;
}

/**
 * The rows to render for a scroll position: from `start` to `end` (exclusive) plus `overscan` rows on each side,
 * and the space above and below them. Without a measured height (server, jsdom) the first `fallback` rows.
 */
export function logWindow(
    scrollTop: number,
    viewportHeight: number,
    rowHeight: number,
    count: number,
    overscan = 10,
    fallback = 100
): { start: number; end: number; before: number; after: number } {
    if (viewportHeight <= 0 || rowHeight <= 0) {
        const end = Math.min(count, fallback);
        return { start: 0, end, before: 0, after: 0 };
    }
    const first = Math.floor(scrollTop / rowHeight);
    const start = Math.max(0, first - overscan);
    const end = Math.min(count, first + Math.ceil(viewportHeight / rowHeight) + overscan);
    return { start, end, before: start * rowHeight, after: (count - end) * rowHeight };
}

/** The scroll position is at the end (within `threshold` px) – new lines then keep it there */
export function isAtBottom(element: { scrollTop: number; scrollHeight: number; clientHeight: number }, threshold = 8) {
    return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}
