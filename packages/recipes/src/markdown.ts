// A small, safe Markdown renderer (Markdown, ChatMessage): the text becomes a tree of element descriptions that Vue
// and React turn into their own elements – never HTML strings. Only the tags below are created, every text stays a
// text node (escaped by the framework), and links only keep http(s), mailto, tel and relative addresses. Raw HTML in
// the source is shown as text.

/** Inline content */
export type MarkdownInline =
    | { type: 'text'; text: string }
    | { type: 'strong' | 'em' | 'del'; children: MarkdownInline[] }
    | { type: 'code'; text: string }
    | { type: 'link'; href: string; title?: string; children: MarkdownInline[] }
    | { type: 'break' };

export type MarkdownAlign = 'start' | 'center' | 'end' | undefined;

export interface MarkdownListItem {
    /** Task list item: `- [ ]` / `- [x]` */
    checked?: boolean;
    children: MarkdownBlock[];
}

/** Block content */
export type MarkdownBlock =
    | { type: 'heading'; level: number; children: MarkdownInline[] }
    | { type: 'paragraph'; children: MarkdownInline[] }
    | { type: 'list'; ordered: boolean; start?: number; items: MarkdownListItem[] }
    | { type: 'code'; language?: string; text: string }
    | { type: 'quote'; children: MarkdownBlock[] }
    | { type: 'table'; align: MarkdownAlign[]; head: MarkdownInline[][]; rows: MarkdownInline[][][] }
    | { type: 'rule' };

export interface MarkdownOptions {
    /** A single line break inside a paragraph is a break (chat style) instead of a space (default false) */
    breaks?: boolean;
}

/** Deeper nesting (quotes, lists, emphasis) is kept as text – protects against stack overflows from hostile input */
const MAX_DEPTH = 12;

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)[^`]*$/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}> ?(.*)$/;
const LIST_ITEM = /^( {0,3})([-*+]|(\d{1,9})[.)])([ \t]+(.*)|$)/;
const TABLE_SEPARATOR = /^ {0,3}\|?(\s*:?-+:?\s*\|)*\s*:?-+:?\s*\|?\s*$/;

const isBlank = (line: string) => line.trim() === '';

/** Parses Markdown (CommonMark subset with GFM tables, strikethrough and task lists) into blocks */
export function parseMarkdown(source: string, options: MarkdownOptions = {}): MarkdownBlock[] {
    const lines = source.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
    return parseBlocks(lines, options, 0);
}

function parseBlocks(lines: string[], options: MarkdownOptions, depth: number): MarkdownBlock[] {
    const blocks: MarkdownBlock[] = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index]!;
        if (isBlank(line)) {
            index++;
            continue;
        }
        const fence = FENCE.exec(line);
        if (fence) {
            const marker = fence[1]!;
            const body: string[] = [];
            index++;
            while (index < lines.length && !lines[index]!.trimStart().startsWith(marker)) body.push(lines[index++]!);
            index++;
            blocks.push({ type: 'code', language: fence[2] || undefined, text: body.join('\n') });
            continue;
        }
        const heading = HEADING.exec(line);
        if (heading) {
            blocks.push({
                type: 'heading',
                level: heading[1]!.length,
                children: parseInline(heading[2] ?? '', options, depth),
            });
            index++;
            continue;
        }
        if (RULE.test(line)) {
            blocks.push({ type: 'rule' });
            index++;
            continue;
        }
        if (QUOTE.test(line)) {
            const body: string[] = [];
            while (index < lines.length && !isBlank(lines[index]!)) {
                const quoted = QUOTE.exec(lines[index]!);
                body.push(quoted ? quoted[1]! : lines[index]!);
                index++;
            }
            blocks.push(
                depth >= MAX_DEPTH
                    ? { type: 'paragraph', children: [{ type: 'text', text: body.join(' ') }] }
                    : { type: 'quote', children: parseBlocks(body, options, depth + 1) }
            );
            continue;
        }
        if (LIST_ITEM.test(line)) {
            const [list, next] = parseList(lines, index, options, depth);
            blocks.push(list);
            index = next;
            continue;
        }
        if (line.includes('|') && index + 1 < lines.length && TABLE_SEPARATOR.test(lines[index + 1]!)) {
            const [table, next] = parseTable(lines, index, options, depth);
            if (table) {
                blocks.push(table);
                index = next;
                continue;
            }
        }
        // Paragraph: until a blank line or the start of another block
        const body: string[] = [];
        while (index < lines.length) {
            const current = lines[index]!;
            if (isBlank(current)) break;
            if (body.length && (FENCE.test(current) || HEADING.test(current) || QUOTE.test(current))) break;
            if (body.length && (RULE.test(current) || LIST_ITEM.test(current))) break;
            body.push(current.trim());
            index++;
        }
        blocks.push({ type: 'paragraph', children: parseInline(joinLines(body, options), options, depth) });
    }
    return blocks;
}

/** Lines of a paragraph: "  " or "\" at the end is a break, otherwise a space (or a break with `breaks`) */
function joinLines(lines: string[], options: MarkdownOptions): string {
    return lines.reduce((text, line, index) => {
        if (index === 0) return line;
        const previous = lines[index - 1]!;
        return `${text.replace(/\\$/, '')}${options.breaks || /\\$/.test(previous) ? '\n' : ' '}${line}`;
    }, '');
}

function parseList(lines: string[], start: number, options: MarkdownOptions, depth: number): [MarkdownBlock, number] {
    const first = LIST_ITEM.exec(lines[start]!)!;
    const ordered = first[3] !== undefined;
    const indent = first[1]!.length;
    const items: MarkdownListItem[] = [];
    let index = start;
    while (index < lines.length) {
        const match = LIST_ITEM.exec(lines[index]!);
        if (!match || match[1]!.length !== indent || (match[3] !== undefined) !== ordered) break;
        const contentIndent = match[1]!.length + match[2]!.length + 1;
        const body = [match[5] ?? ''];
        index++;
        // Continuation: indented lines (nested lists, more paragraphs) and lazy lines of the same paragraph
        while (index < lines.length) {
            const current = lines[index]!;
            if (isBlank(current)) {
                const following = lines[index + 1];
                if (following !== undefined && /^\s+/.test(following) && leading(following) >= contentIndent) {
                    body.push('');
                    index++;
                    continue;
                }
                break;
            }
            if (leading(current) >= Math.min(contentIndent, indent + 2)) {
                body.push(current.slice(Math.min(leading(current), contentIndent)));
                index++;
                continue;
            }
            if (LIST_ITEM.test(current) || QUOTE.test(current) || HEADING.test(current) || FENCE.test(current)) break;
            body.push(current.trim());
            index++;
        }
        const task = /^\[([ xX])\][ \t]+/.exec(body[0]!);
        if (task) body[0] = body[0]!.slice(task[0].length);
        items.push({
            ...(task ? { checked: task[1] !== ' ' } : {}),
            children:
                depth >= MAX_DEPTH
                    ? [{ type: 'paragraph', children: [{ type: 'text', text: body.join(' ') }] }]
                    : parseBlocks(body, options, depth + 1),
        });
    }
    return [
        { type: 'list', ordered, ...(ordered && Number(first[3]) !== 1 ? { start: Number(first[3]) } : {}), items },
        index,
    ];
}

const leading = (line: string) => line.length - line.trimStart().length;

function splitRow(line: string): string[] {
    let row = line.trim();
    if (row.startsWith('|')) row = row.slice(1);
    if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
    const cells: string[] = [];
    let current = '';
    for (let index = 0; index < row.length; index++) {
        const char = row[index]!;
        if (char === '\\' && row[index + 1] === '|') {
            current += '|';
            index++;
        } else if (char === '|') {
            cells.push(current.trim());
            current = '';
        } else current += char;
    }
    cells.push(current.trim());
    return cells;
}

function parseTable(
    lines: string[],
    start: number,
    options: MarkdownOptions,
    depth: number
): [MarkdownBlock | undefined, number] {
    const head = splitRow(lines[start]!);
    const separators = splitRow(lines[start + 1]!);
    if (head.length !== separators.length) return [undefined, start];
    const align: MarkdownAlign[] = separators.map((cell) => {
        const left = cell.startsWith(':');
        const right = cell.endsWith(':');
        return left && right ? 'center' : right ? 'end' : left ? 'start' : undefined;
    });
    const rows: MarkdownInline[][][] = [];
    let index = start + 2;
    while (index < lines.length && !isBlank(lines[index]!) && lines[index]!.includes('|')) {
        const cells = splitRow(lines[index]!);
        rows.push(head.map((_, column) => parseInline(cells[column] ?? '', options, depth)));
        index++;
    }
    return [{ type: 'table', align, head: head.map((cell) => parseInline(cell, options, depth)), rows }, index];
}

const PUNCTUATION_ESCAPE = /^\\([!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~-])/;
const AUTOLINK = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i;
const BARE_URL = /^https?:\/\/[^\s<>]+[^\s<>.,;:!?"')\]]/i;

/** Parses inline Markdown: code, links, autolinks, strong, emphasis, strikethrough, escapes and breaks */
export function parseInline(text: string, options: MarkdownOptions = {}, depth = 0): MarkdownInline[] {
    const nodes: MarkdownInline[] = [];
    let buffer = '';
    const flush = () => {
        if (buffer) nodes.push({ type: 'text', text: buffer });
        buffer = '';
    };
    let index = 0;
    while (index < text.length) {
        const rest = text.slice(index);
        const char = text[index]!;
        const escape = PUNCTUATION_ESCAPE.exec(rest);
        if (escape) {
            buffer += escape[1];
            index += 2;
            continue;
        }
        if (char === '\n') {
            flush();
            nodes.push({ type: 'break' });
            index++;
            continue;
        }
        if (char === '`') {
            const ticks = /^`+/.exec(rest)![0];
            const end = text.indexOf(ticks, index + ticks.length);
            if (end > 0) {
                flush();
                const code = text.slice(index + ticks.length, end);
                nodes.push({ type: 'code', text: /^ .* $/.test(code) ? code.slice(1, -1) : code });
                index = end + ticks.length;
                continue;
            }
            buffer += ticks;
            index += ticks.length;
            continue;
        }
        const autolink = AUTOLINK.exec(rest);
        if (autolink) {
            flush();
            nodes.push(...linkNode(autolink[1]!, [{ type: 'text', text: autolink[1]!.replace(/^mailto:/i, '') }]));
            index += autolink[0].length;
            continue;
        }
        if ((char === 'h' || char === 'H') && /[^\w]$|^$/.test(text.slice(Math.max(0, index - 1), index))) {
            const url = BARE_URL.exec(rest);
            if (url) {
                flush();
                nodes.push(...linkNode(url[0], [{ type: 'text', text: url[0] }]));
                index += url[0].length;
                continue;
            }
        }
        if (char === '[' || (char === '!' && text[index + 1] === '[')) {
            const image = char === '!';
            const link = parseLink(text, index + (image ? 1 : 0));
            if (link) {
                flush();
                const children =
                    depth >= MAX_DEPTH
                        ? [{ type: 'text' as const, text: link.label }]
                        : parseInline(link.label, options, depth + 1);
                // Images are not loaded (no requests from user content) – they become a link with their text
                nodes.push(
                    ...linkNode(link.href, children.length ? children : [{ type: 'text', text: link.href }], link.title)
                );
                index = link.end;
                continue;
            }
        }
        const emphasis = parseEmphasis(text, index, options, depth);
        if (emphasis) {
            flush();
            nodes.push(emphasis.node);
            index = emphasis.end;
            continue;
        }
        buffer += char;
        index++;
    }
    flush();
    return nodes;
}

/** A link with a safe address; with an unsafe address only its text */
function linkNode(href: string, children: MarkdownInline[], title?: string): MarkdownInline[] {
    const safe = safeUrl(href);
    if (safe === undefined) return children;
    return [{ type: 'link', href: safe, ...(title ? { title } : {}), children }];
}

function parseLink(text: string, start: number): { label: string; href: string; title?: string; end: number } | null {
    // [label](href "title") – the label may contain brackets in pairs
    let level = 0;
    let close = -1;
    for (let index = start; index < text.length; index++) {
        const char = text[index];
        if (char === '\\') {
            index++;
            continue;
        }
        if (char === '[') level++;
        else if (char === ']' && --level === 0) {
            close = index;
            break;
        }
    }
    if (close < 0 || text[close + 1] !== '(') return null;
    const target = /^\(\s*(<[^>]*>|[^\s()]*(?:\([^\s()]*\)[^\s()]*)*)(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*\)/.exec(
        text.slice(close + 1)
    );
    if (!target) return null;
    const href = target[1]!.replace(/^<|>$/g, '');
    return {
        label: text.slice(start + 1, close),
        href,
        title: target[2] ?? target[3],
        end: close + 1 + target[0].length,
    };
}

const EMPHASIS: [string, 'strong' | 'em' | 'del'][] = [
    ['**', 'strong'],
    ['__', 'strong'],
    ['~~', 'del'],
    ['*', 'em'],
    ['_', 'em'],
];

function parseEmphasis(
    text: string,
    start: number,
    options: MarkdownOptions,
    depth: number
): { node: MarkdownInline; end: number } | null {
    if (depth >= MAX_DEPTH) return null;
    for (const [marker, type] of EMPHASIS) {
        if (!text.startsWith(marker, start)) continue;
        const after = text[start + marker.length];
        if (after === undefined || /\s/.test(after)) continue;
        // "_" only at word boundaries (snake_case stays text)
        if (marker[0] === '_' && start > 0 && /\w/.test(text[start - 1]!)) continue;
        let search = start + marker.length + 1;
        while (search <= text.length) {
            const end = text.indexOf(marker, search);
            if (end < 0) break;
            const before = text[end - 1]!;
            const next = text[end + marker.length];
            const boundary = marker[0] !== '_' || next === undefined || !/\w/.test(next);
            // "*" must not be the start of a "**" pair inside
            const single = marker.length > 1 || text[end + 1] !== marker || text[end - 1] === marker;
            if (!/\s/.test(before) && before !== '\\' && boundary && single) {
                const inner = text.slice(start + marker.length, end);
                return {
                    node: { type, children: parseInline(inner, options, depth + 1) },
                    end: end + marker.length,
                };
            }
            search = end + 1;
        }
    }
    return null;
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * The address if it is safe to link: http(s), mailto, tel or relative (`/`, `./`, `#`, `?`, a path). Undefined for
 * `javascript:`, `data:`, `vbscript:` and every other scheme – also when hidden with spaces, control characters or
 * entities.
 */
export function safeUrl(href: string): string | undefined {
    const trimmed = href.trim();
    // eslint-disable-next-line no-control-regex
    const probe = trimmed.replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase();
    if (/&#|&[a-z]+;/i.test(probe)) return undefined;
    const scheme = /^([a-z][a-z\d+.-]*):/.exec(probe);
    if (scheme) return SAFE_PROTOCOLS.has(`${scheme[1]}:`) ? trimmed : undefined;
    if (probe.startsWith('//')) return trimmed;
    // A colon before the first slash would be a scheme in the browser's eyes
    const firstSlash = probe.search(/[/?#]/);
    const colon = probe.indexOf(':');
    if (colon >= 0 && (firstSlash < 0 || colon < firstSlash)) return undefined;
    return trimmed;
}

/** Element description for the renderers: an allowed tag with attributes and children */
export interface MarkdownElement {
    tag: string;
    attrs: Record<string, string | boolean>;
    children: (MarkdownElement | string)[];
    /** Code blocks: the language and text (renderers may hand them to a slot / render prop) */
    code?: { language?: string; text: string };
}

export interface MarkdownRenderOptions extends MarkdownOptions {
    /** Heading level of `#` – the others follow, up to h6 (default 2, so `#` fits under the page's h1) */
    headingLevel?: number;
    /** target of links (e.g. "_blank"); rel always contains noopener and noreferrer */
    linkTarget?: string;
    /** Value of `rel` on links (default "noopener noreferrer nofollow") */
    linkRel?: string;
}

const element = (
    tag: string,
    attrs: MarkdownElement['attrs'] = {},
    children: MarkdownElement['children'] = []
): MarkdownElement => ({ tag, attrs, children });

/** Parses Markdown and turns it into element descriptions (the only tags: p, h2–h6, ul, ol, li, … – no raw HTML) */
export function markdownElements(source: string, options: MarkdownRenderOptions = {}): MarkdownElement[] {
    const offset = Math.min(6, Math.max(1, options.headingLevel ?? 2)) - 1;
    const rel = options.linkRel ?? 'noopener noreferrer nofollow';
    const inline = (nodes: MarkdownInline[]): (MarkdownElement | string)[] =>
        nodes.map((node) => {
            switch (node.type) {
                case 'text':
                    return node.text;
                case 'break':
                    return element('br');
                case 'code':
                    return element('code', {}, [node.text]);
                case 'link':
                    return element(
                        'a',
                        {
                            href: node.href,
                            rel,
                            ...(node.title ? { title: node.title } : {}),
                            ...(options.linkTarget ? { target: options.linkTarget } : {}),
                        },
                        inline(node.children)
                    );
                default:
                    return element({ strong: 'strong', em: 'em', del: 'del' }[node.type], {}, inline(node.children));
            }
        });
    const block = (node: MarkdownBlock): MarkdownElement => {
        switch (node.type) {
            case 'heading':
                return element(`h${Math.min(6, node.level + offset)}`, {}, inline(node.children));
            case 'paragraph':
                return element('p', {}, inline(node.children));
            case 'rule':
                return element('hr');
            case 'quote':
                return element('blockquote', {}, node.children.map(block));
            case 'code': {
                const code = element('code', node.language ? { 'data-language': node.language } : {}, [node.text]);
                return { ...element('pre', {}, [code]), code: { language: node.language, text: node.text } };
            }
            case 'list': {
                const task = node.items.some((item) => item.checked !== undefined);
                const attrs: MarkdownElement['attrs'] = {
                    ...(node.start !== undefined ? { start: String(node.start) } : {}),
                    ...(task ? { 'data-type': 'taskList' } : {}),
                };
                return element(
                    node.ordered ? 'ol' : 'ul',
                    attrs,
                    node.items.map((item) => {
                        // A single paragraph stays inline (tight list)
                        const content =
                            item.children.length === 1 && item.children[0]!.type === 'paragraph'
                                ? inline(item.children[0]!.children)
                                : item.children.map(block);
                        if (item.checked === undefined) return element('li', {}, content);
                        return element('li', { 'data-type': 'taskItem', 'data-checked': String(item.checked) }, [
                            element('label', {}, [
                                element('input', {
                                    type: 'checkbox',
                                    checked: item.checked,
                                    disabled: true,
                                    'aria-label': plainText(content),
                                }),
                            ]),
                            element('div', {}, content),
                        ]);
                    })
                );
            }
            case 'table': {
                const alignAttr = (column: number): MarkdownElement['attrs'] =>
                    node.align[column] ? { 'data-align': node.align[column]! } : {};
                return element('table', {}, [
                    element('thead', {}, [
                        element(
                            'tr',
                            {},
                            node.head.map((cell, column) =>
                                element('th', { scope: 'col', ...alignAttr(column) }, inline(cell))
                            )
                        ),
                    ]),
                    element(
                        'tbody',
                        {},
                        node.rows.map((row) =>
                            element(
                                'tr',
                                {},
                                row.map((cell, column) => element('td', alignAttr(column), inline(cell)))
                            )
                        )
                    ),
                ]);
            }
        }
    };
    return parseMarkdown(source, options).map(block);
}

const plainText = (nodes: (MarkdownElement | string)[]): string =>
    nodes
        .map((node) =>
            typeof node === 'string'
                ? node
                : node.tag === 'br'
                  ? ' '
                  : `${plainText(node.children)}${/^(p|h\d|li|pre|blockquote|tr|th|td)$/.test(node.tag) ? ' ' : ''}`
        )
        .join('')
        .replace(/\s+/g, ' ')
        .trim();

/** Plain text of Markdown (for announcements and previews): no markers, blocks separated by spaces */
export function markdownToText(source: string): string {
    return plainText(markdownElements(source));
}
