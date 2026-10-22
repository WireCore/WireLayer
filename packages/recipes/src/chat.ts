import { markdownToText } from './markdown.js';
import { tv } from './tv.js';

// Chat building blocks (ChatMessages, ChatMessage, ChatPrompt, ChatSources, ChatToolCall, ChatThinking): the message
// list is a log with grouping and date separators, messages render their text as safe Markdown, the prompt sends on
// Enter.

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

/** Message list: a scrollable log; a button leads to new messages while scrolled up */
export const chatMessages = tv({
    slots: {
        base: 'relative flex min-h-0 flex-col',
        viewport: [
            'flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4 outline-none',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        separator: [
            'my-3 flex items-center gap-3 text-xs font-medium text-muted',
            'before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line',
        ],
        message: 'data-[first=true]:mt-3 first:data-[first=true]:mt-0',
        empty: 'm-auto p-6 text-center text-sm text-muted',
        more: 'self-center',
        jump: 'absolute bottom-3 start-1/2 z-[1] -translate-x-1/2 rtl:translate-x-1/2',
    },
});

/** One message: avatar, name and time, the bubble with text and attachments, the delivery status */
export const chatMessage = tv({
    slots: {
        base: 'flex w-full items-end gap-2',
        avatar: 'w-8 shrink-0',
        body: 'flex max-w-[min(80%,42rem)] min-w-0 flex-col gap-1',
        header: 'flex items-baseline gap-2 px-1 text-xs',
        author: 'font-semibold text-fg',
        time: 'text-muted tabular-nums',
        bubble: 'min-w-0 rounded-2xl px-3.5 py-2.5 text-[15px] break-words text-fg forced-colors:border',
        text: 'whitespace-pre-wrap',
        attachments: 'm-0 mt-2 flex list-none flex-col gap-1 p-0',
        attachment: [
            'flex items-center gap-2 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm text-fg',
            '[&_a]:underline [&_a]:underline-offset-2',
        ],
        attachmentIcon: 'size-4 shrink-0 text-muted',
        attachmentSize: 'ms-auto shrink-0 text-xs text-muted tabular-nums',
        meta: 'flex items-center gap-1 px-1 text-xs text-muted',
        statusIcon: 'size-3.5 shrink-0',
        typing: 'inline-flex h-5 items-center gap-1',
        dot: 'size-1.5 rounded-full bg-muted motion-safe:animate-pulse',
        cursor: 'ms-0.5 inline-block h-4 w-0.5 translate-y-0.5 bg-fg motion-safe:animate-pulse',
        actions: 'flex items-center gap-1 px-1',
        srOnly: 'sr-only',
    },
    variants: {
        align: {
            start: { bubble: 'rounded-es-md border border-line bg-bg-2' },
            end: {
                base: 'flex-row-reverse',
                body: 'items-end',
                header: 'flex-row-reverse',
                bubble: 'rounded-ee-md bg-line',
                meta: 'flex-row-reverse',
            },
            /** System notes: centred, without bubble */
            center: { base: 'justify-center', body: 'items-center', bubble: 'bg-transparent py-1 text-sm text-muted' },
        },
        /** Follows a message of the same author: no avatar and name */
        grouped: {
            true: { header: 'sr-only' },
        },
        status: {
            none: {},
            sending: { meta: 'text-muted' },
            sent: { meta: 'text-muted' },
            read: { statusIcon: 'text-primary' },
            error: { meta: 'text-danger' },
        },
    },
    defaultVariants: {
        align: 'start',
        status: 'none',
    },
});

/** Prompt: a growing text field with attachments, send and stop */
export const chatPrompt = tv({
    slots: {
        base: [
            'flex w-full flex-col gap-2 rounded-xl border border-line-strong bg-bg p-2 transition-colors motion-reduce:transition-none',
            'focus-within:border-primary data-disabled:bg-bg-2',
        ],
        textarea: [
            'block max-h-[var(--wc-prompt-max)] min-h-10 w-full resize-none overflow-y-auto bg-transparent px-2 py-2 text-[15px] leading-6 text-fg outline-none',
            'placeholder:text-muted disabled:cursor-not-allowed',
        ],
        footer: 'flex items-center gap-2',
        files: 'm-0 flex list-none flex-wrap gap-1.5 p-0 px-1',
        hint: 'ms-auto text-xs text-muted max-sm:hidden',
        fileInput: 'sr-only',
        submit: 'ms-auto',
    },
});

/** Collapsible extras of an answer: sources, tool calls, "thinking" */
export const chatDetails = tv({
    slots: {
        base: 'w-full max-w-xl rounded-lg border border-line bg-bg text-sm text-fg',
        summary: [
            'flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-1.5 select-none [&::-webkit-details-marker]:hidden',
            'hover:bg-bg-2',
            focusRing,
        ],
        chevron:
            'size-4 shrink-0 text-muted transition-transform in-open:rotate-90 motion-reduce:transition-none rtl:-scale-x-100',
        icon: 'size-4 shrink-0 text-muted',
        title: 'min-w-0 flex-1 truncate font-medium',
        badge: 'shrink-0 text-xs text-muted',
        content: 'border-t border-line px-3 py-2.5',
        list: 'm-0 flex list-none flex-col gap-2 p-0',
        link: ['font-medium text-fg underline underline-offset-2 hover:text-muted', focusRing, 'rounded-sm'],
        description: 'mt-0.5 text-xs text-muted',
        host: 'text-xs text-muted',
        label: 'mb-1 font-mono text-[10px] tracking-label text-muted uppercase',
        pre: 'm-0 mb-2 max-h-48 overflow-auto rounded-md bg-bg-2 p-2 font-mono text-xs whitespace-pre-wrap last:mb-0',
        text: 'text-muted whitespace-pre-wrap',
    },
    variants: {
        status: {
            none: {},
            running: { icon: 'text-info motion-safe:animate-spin' },
            done: { icon: 'text-success' },
            error: { icon: 'text-danger', badge: 'text-danger' },
        },
    },
    defaultVariants: {
        status: 'none',
    },
});

export type ChatStatus = 'sending' | 'sent' | 'read' | 'error';

/** A file attached to a message */
export interface ChatAttachment {
    name: string;
    /** Download or preview address */
    href?: string;
    /** Size in bytes (shown formatted) */
    size?: number;
    type?: string;
}

/** A message of the list (ChatMessages) */
export interface ChatMessageData {
    id: string | number;
    /** Text (Markdown unless `markdown: false` on the list) */
    text: string;
    /** Name shown above the message */
    author?: string;
    /** Groups messages of the same author (default: the name) */
    authorId?: string;
    avatar?: string;
    /** Time sent: ISO text, timestamp or Date */
    time?: string | number | Date;
    /** Own message: on the end side, with the delivery status */
    own?: boolean;
    /** A system note in the middle (e.g. "Anna joined") */
    system?: boolean;
    status?: ChatStatus;
    attachments?: ChatAttachment[];
    /** The text is still being written (streamed): aria-busy, announced only when it is complete */
    streaming?: boolean;
}

const toDate = (time: ChatMessageData['time']) => (time === undefined ? undefined : new Date(time));

/** Day of a time in the local time zone as "YYYY-MM-DD" */
export function chatDayKey(time: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}`;
}

export type ChatEntry<T extends ChatMessageData = ChatMessageData> =
    | { type: 'separator'; key: string; date: Date }
    | { type: 'message'; key: string; message: T; grouped: boolean; first: boolean };

/**
 * Entries of the list: a date separator before the first message of each day, messages marked as `grouped` when they
 * follow a message of the same author within `withinMinutes` (no avatar and name again).
 */
export function chatEntries<T extends ChatMessageData>(
    messages: readonly T[],
    options: { withinMinutes?: number; separators?: boolean } = {}
): ChatEntry<T>[] {
    const within = (options.withinMinutes ?? 5) * 60_000;
    const entries: ChatEntry<T>[] = [];
    let previous: T | undefined;
    let day: string | undefined;
    for (const message of messages) {
        const time = toDate(message.time);
        const valid = time && !Number.isNaN(time.getTime()) ? time : undefined;
        const key = valid ? chatDayKey(valid) : day;
        const newDay = !!valid && key !== day;
        if (newDay && options.separators !== false) entries.push({ type: 'separator', key: `day-${key}`, date: valid });
        if (key) day = key;
        const before = previous && toDate(previous.time);
        const author = (entry: T) => entry.authorId ?? entry.author ?? (entry.own ? 'own' : 'other');
        const grouped =
            !!previous &&
            !newDay &&
            !message.system &&
            !previous.system &&
            author(previous) === author(message) &&
            !!previous.own === !!message.own &&
            (!valid || !before || valid.getTime() - before.getTime() <= within);
        entries.push({ type: 'message', key: `message-${message.id}`, message, grouped, first: !grouped });
        previous = message;
    }
    return entries;
}

/**
 * What a key does in the prompt: Enter sends, Shift+Enter (and Enter while an input method composes) adds a line.
 * `sendOn: 'mod-enter'` sends with Ctrl/Cmd+Enter only.
 */
export function chatPromptAction(
    event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey' | 'isComposing'>,
    sendOn: 'enter' | 'mod-enter' = 'enter'
): 'send' | undefined {
    if (event.key !== 'Enter' || event.isComposing || event.shiftKey || event.altKey) return undefined;
    if (sendOn === 'mod-enter') return event.ctrlKey || event.metaKey ? 'send' : undefined;
    return 'send';
}

/** Height of the growing text field: its content, between one line and `maxRows` lines */
export function promptHeight(scrollHeight: number, lineHeight: number, padding: number, maxRows: number): number {
    return Math.min(Math.max(scrollHeight, lineHeight + padding), lineHeight * maxRows + padding);
}

/** Host name of a source address for display ("docs.wirecore.de") */
export function sourceHost(href: string): string {
    try {
        return new URL(href).hostname.replace(/^www\./, '');
    } catch {
        return href;
    }
}

/** Text of a date line: "Today" or "Yesterday" when `now` is known, otherwise the full date in the locale */
export function chatDayText(
    date: Date,
    options: { locale: string; today: string; yesterday: string; now?: string | number | Date }
): string {
    if (options.now !== undefined) {
        const today = new Date(options.now);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (chatDayKey(date) === chatDayKey(today)) return options.today;
        if (chatDayKey(date) === chatDayKey(yesterday)) return options.yesterday;
    }
    return new Intl.DateTimeFormat(options.locale, { dateStyle: 'full' }).format(date);
}

/**
 * How the list changed: older messages came in at the top (`prepended`) – or `added` new messages (at the end) that
 * a list scrolled up counts for its "Jump to new messages" button.
 */
export function chatListChange<T extends ChatMessageData>(
    previous: readonly T[],
    messages: readonly T[]
): { prepended: boolean; added: number } {
    const prepended = previous.length > 0 && messages.length > 0 && messages[0]!.id !== previous[0]!.id;
    if (prepended) return { prepended, added: 0 };
    const known = new Set(previous.map((message) => message.id));
    return { prepended, added: messages.filter((message) => !known.has(message.id)).length };
}

/**
 * Messages to announce after a change: new messages of others, streamed ones once they are complete. `before` is the
 * streaming state per id of the previous list (`chatStreamingState`).
 */
export function chatAnnouncements<T extends ChatMessageData>(
    before: ReadonlyMap<T['id'], boolean>,
    messages: readonly T[]
): T[] {
    return messages.filter((message) => {
        if (message.own || message.streaming) return false;
        const was = before.get(message.id);
        return was === undefined || was;
    });
}

/** Streaming state per message id – what `chatAnnouncements` compares with */
export function chatStreamingState<T extends ChatMessageData>(messages: readonly T[]): Map<T['id'], boolean> {
    return new Map(messages.map((message) => [message.id, !!message.streaming]));
}

/** Text of a message for an announcement: plain text of the Markdown, cut after `max` characters */
export function chatAnnouncementText(text: string, markdown = true, max = 300): string {
    const plain = markdown ? markdownToText(text) : text;
    return plain.length > max ? `${plain.slice(0, max)} …` : plain;
}
