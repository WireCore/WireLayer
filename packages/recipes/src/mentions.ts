// Mentions in a text field: "@" or "#" opens suggestions, a chosen entry becomes a mention. The value is text with
// markup – "Hello @[Anna Berg](anna)" – the field shows the plain text ("Hello @Anna Berg") with the mentions marked.

export interface Mention {
    /** Character that started it, e.g. "@" */
    trigger: string;
    /** Id of the mentioned entry */
    id: string;
    /** Text shown after the trigger */
    label: string;
    /** Position in the plain text: the trigger character … the end of the label */
    start: number;
    end: number;
}

export interface MentionText {
    /** What the field shows */
    text: string;
    mentions: Mention[];
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "Hello @[Anna Berg](anna)" → text "Hello @Anna Berg" with one mention */
export function parseMentionMarkup(markup: string, triggers: readonly string[]): MentionText {
    if (!triggers.length) return { text: markup, mentions: [] };
    const pattern = new RegExp(`(${triggers.map(escapeRegExp).join('|')})\\[([^\\]]+)\\]\\(([^)]+)\\)`, 'g');
    const mentions: Mention[] = [];
    let text = '';
    let last = 0;
    for (const match of markup.matchAll(pattern)) {
        text += markup.slice(last, match.index);
        const [, trigger, label, id] = match as unknown as [string, string, string, string];
        const start = text.length;
        text += trigger + label;
        mentions.push({ trigger, id, label, start, end: text.length });
        last = match.index + match[0].length;
    }
    return { text: text + markup.slice(last), mentions };
}

/** Plain text and mentions → markup ("@[Anna Berg](anna)") */
export function toMentionMarkup(text: string, mentions: readonly Mention[]): string {
    let result = '';
    let last = 0;
    for (const mention of [...mentions].sort((a, b) => a.start - b.start)) {
        result += text.slice(last, mention.start) + `${mention.trigger}[${mention.label}](${mention.id})`;
        last = mention.end;
    }
    return result + text.slice(last);
}

/**
 * Keeps the mentions in step with an edit: those after the changed part move, those touched by it are dropped
 * (the user edits a mention's text → it becomes plain text).
 */
export function updateMentions(previous: string, next: string, mentions: readonly Mention[]): Mention[] {
    let prefix = 0;
    const shortest = Math.min(previous.length, next.length);
    while (prefix < shortest && previous[prefix] === next[prefix]) prefix++;
    let suffix = 0;
    while (suffix < shortest - prefix && previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix])
        suffix++;
    const changedEnd = previous.length - suffix;
    const shift = next.length - previous.length;
    return mentions.flatMap((mention) => {
        if (mention.end <= prefix) return [mention];
        if (mention.start >= changedEnd)
            return [{ ...mention, start: mention.start + shift, end: mention.end + shift }];
        return [];
    });
}

/** The trigger and the text typed after it, if the caret is in a mention being typed */
export interface MentionQuery {
    trigger: string;
    query: string;
    /** Position of the trigger character */
    start: number;
}

/**
 * The mention being typed before the caret: a trigger at the start or after a space, followed by at most
 * `maxLength` characters without a line break (single spaces allowed, for "Anna B"). Not inside a mention.
 */
export function mentionQuery(
    text: string,
    caret: number,
    triggers: readonly string[],
    mentions: readonly Mention[] = [],
    maxLength = 30
): MentionQuery | null {
    const before = text.slice(0, caret);
    for (let index = before.length - 1; index >= 0 && before.length - index <= maxLength + 1; index--) {
        const char = before[index]!;
        if (char === '\n') return null;
        if (!triggers.includes(char)) continue;
        if (index > 0 && !/\s/.test(before[index - 1]!)) continue;
        const query = before.slice(index + 1);
        if (/\s\s/.test(query) || query.startsWith(' ')) return null;
        if (mentions.some((mention) => index >= mention.start && index < mention.end)) return null;
        return { trigger: char, query, start: index };
    }
    return null;
}

/** Replaces the typed query by the mention and a space; the new text, mentions and caret position */
export function insertMention(
    current: MentionText,
    query: MentionQuery,
    caret: number,
    entry: { id: string; label: string }
): MentionText & { caret: number } {
    const inserted = `${query.trigger}${entry.label}`;
    const after = current.text.slice(caret);
    const spacer = after.startsWith(' ') ? '' : ' ';
    const text = current.text.slice(0, query.start) + inserted + spacer + after;
    const shift = inserted.length + spacer.length - (caret - query.start);
    const mentions = current.mentions
        .map((mention) =>
            mention.start >= caret ? { ...mention, start: mention.start + shift, end: mention.end + shift } : mention
        )
        .concat({
            trigger: query.trigger,
            id: entry.id,
            label: entry.label,
            start: query.start,
            end: query.start + inserted.length,
        })
        .sort((a, b) => a.start - b.start);
    return { text, mentions, caret: query.start + inserted.length + 1 };
}

/** Text cut into plain parts and mentions, for the highlighting layer behind the field */
export function mentionSegments(text: string, mentions: readonly Mention[]): { text: string; mention?: Mention }[] {
    const segments: { text: string; mention?: Mention }[] = [];
    let last = 0;
    for (const mention of [...mentions].sort((a, b) => a.start - b.start)) {
        if (mention.start > last) segments.push({ text: text.slice(last, mention.start) });
        segments.push({ text: text.slice(mention.start, mention.end), mention });
        last = mention.end;
    }
    if (last < text.length) segments.push({ text: text.slice(last) });
    return segments;
}
