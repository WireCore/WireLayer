import { pressable, tv } from './tv.js';

// Chat building blocks for React Native: the message list (an inverted FlatList, newest at the bottom), a message
// with its bubble, the prompt with send and stop, and the collapsible extras of an answer (sources, tool calls,
// thinking).

/** Message list: date lines, grouped messages, a button to the new messages while scrolled up */
export const chatMessages = tv({
    slots: {
        base: 'relative min-h-0 flex-1',
        list: 'flex-1',
        content: 'px-4 py-3',
        separator: 'my-3 flex-row items-center gap-3',
        separatorLine: 'h-px flex-1 bg-line',
        separatorText: 'font-sans-medium text-xs text-muted',
        /** Wrapper of a message: space above the first of a group */
        message: 'pt-1',
        empty: 'flex-1 items-center justify-center p-6',
        emptyText: 'text-center font-sans text-sm text-muted',
        /** "Load older messages" at the top */
        more: 'items-center py-2',
        jump: 'absolute bottom-3 self-center',
    },
    variants: {
        first: {
            true: { message: 'pt-3' },
        },
    },
});

/** One message: avatar, name and time, the bubble with text and attachments, the delivery status */
export const chatMessage = tv({
    slots: {
        base: 'w-full flex-row items-end gap-2',
        avatar: 'w-8 shrink-0',
        body: 'min-w-0 max-w-[80%] shrink gap-1',
        header: 'flex-row items-baseline gap-2 px-1',
        author: 'font-sans-semibold text-xs text-fg',
        time: 'font-sans text-xs text-muted',
        bubble: 'min-w-0 rounded-2xl px-3.5 py-2.5',
        text: 'font-sans text-[15px] leading-6 text-fg',
        attachments: 'mt-2 gap-1',
        attachment: [
            'min-h-11 flex-row items-center gap-2 rounded-lg border border-line bg-bg px-2.5 py-1.5',
            pressable,
        ],
        attachmentIcon: 'size-4 shrink-0 text-muted',
        attachmentName: 'min-w-0 flex-1 font-sans text-sm text-fg',
        attachmentSize: 'shrink-0 font-sans text-xs text-muted',
        meta: 'flex-row items-center gap-1 px-1',
        metaText: 'font-sans text-xs text-muted',
        statusIcon: 'size-3.5 shrink-0 text-muted',
        /** Three dots while an empty reply is being written */
        typing: 'h-6 flex-row items-center gap-1',
        dot: 'size-1.5 rounded-full bg-muted',
        /** Cursor below a growing reply */
        cursor: 'mt-0.5 h-4 w-0.5 bg-fg',
        actions: 'flex-row items-center gap-1 px-1',
    },
    variants: {
        align: {
            start: { bubble: 'rounded-bl-md border border-line bg-bg-2' },
            end: {
                base: 'flex-row-reverse',
                body: 'items-end',
                header: 'flex-row-reverse',
                bubble: 'rounded-br-md bg-line',
                meta: 'flex-row-reverse',
            },
            /** System notes: centred, without bubble */
            center: {
                base: 'justify-center',
                body: 'items-center',
                bubble: 'bg-transparent py-1',
                text: 'text-center text-sm text-muted',
            },
        },
        /** Linked attachment: underlined name */
        linked: {
            true: { attachmentName: 'underline' },
        },
        status: {
            none: {},
            sending: {},
            sent: {},
            read: { statusIcon: 'text-primary' },
            error: { metaText: 'text-danger', statusIcon: 'text-danger' },
        },
    },
    defaultVariants: {
        align: 'start',
        status: 'none',
    },
});

/** Prompt: a growing text field, attached files, attach, send and stop */
export const chatPrompt = tv({
    slots: {
        base: 'w-full gap-2 rounded-xl border border-line-strong bg-bg p-2',
        textarea: 'w-full px-2 py-2 font-sans text-[15px] leading-6 text-fg web:outline-none',
        footer: 'flex-row items-center gap-2',
        files: 'flex-row flex-wrap gap-1.5 px-1',
        hint: 'flex-1 font-sans text-xs text-muted',
        submit: 'ml-auto',
    },
    variants: {
        focused: {
            true: { base: 'border-primary' },
        },
        disabled: {
            true: { base: 'border-line bg-bg-2', textarea: 'text-muted' },
        },
    },
});

/** Collapsible extras of an answer: sources, tool calls, "thinking" */
export const chatDetails = tv({
    slots: {
        base: 'w-full rounded-lg border border-line bg-bg',
        summary: ['min-h-11 flex-row items-center gap-2 rounded-lg px-3 py-1.5', pressable],
        chevron: 'size-4 shrink-0 text-muted',
        icon: 'size-4 shrink-0 text-muted',
        title: 'min-w-0 flex-1 font-sans-medium text-sm text-fg',
        badge: 'shrink-0 font-sans text-xs text-muted',
        content: 'border-t border-line px-3 py-2.5',
        list: 'gap-1',
        link: ['min-h-11 justify-center rounded-sm', pressable],
        linkText: 'font-sans-medium text-sm text-fg underline',
        description: 'font-sans text-xs text-muted',
        host: 'font-sans text-xs text-muted',
        label: 'mb-1 font-mono text-[10px] tracking-[0.9px] text-muted uppercase',
        pre: 'mb-2 rounded-md bg-bg-2 p-2',
        preText: 'font-mono text-xs leading-[18px] text-fg',
        text: 'font-sans text-sm leading-5 text-muted',
    },
    variants: {
        open: {
            true: { chevron: 'rotate-90' },
        },
        status: {
            none: {},
            running: { icon: 'text-info' },
            done: { icon: 'text-success' },
            error: { icon: 'text-danger', badge: 'text-danger' },
        },
    },
    defaultVariants: {
        status: 'none',
    },
});
