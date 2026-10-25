import {
    announce,
    chatDayKey,
    chatEntries,
    chatMessages as chatMessagesRecipe,
    isAtBottom,
    markdownToText,
    type ChatMessageData,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ArrowDown } from 'lucide-react';
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { ChatMessage } from './ChatMessage.js';

export interface ChatMessagesProps<T extends ChatMessageData = ChatMessageData> extends Omit<
    ComponentProps<'div'>,
    'children'
> {
    /** The messages, oldest first */
    messages: readonly T[];
    /** Accessible name of the list (default "Messages") */
    label?: string;
    /** Messages of the same author within this many minutes are grouped (default 5) */
    groupWithin?: number;
    /** A date line before the first message of each day (default true) */
    separators?: boolean;
    /** Today's date – the date lines then say "Today" and "Yesterday" (pass it from the server for hydration) */
    now?: string | number | Date;
    /** Message texts are Markdown (default true) */
    markdown?: boolean;
    /** Announces new messages of others – streamed ones once they are complete (default true) */
    announce?: boolean;
    /** Older messages can be loaded: a button at the top calls onLoadMore */
    hasMore?: boolean;
    loading?: boolean;
    /** Load older messages (they are added at the top, the view stays where it is) */
    onLoadMore?: () => void;
    /** Text without messages */
    emptyText?: string;
    /** A message (default: ChatMessage) */
    renderMessage?: (message: T, state: { grouped: boolean }) => ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatMessagesRecipe>;
}

/**
 * Message list: role="log" (announcements of new messages come from the live announcer, streamed ones once
 * complete); aria-busy while a reply is being written. Scrolled up, a button leads to the new messages.
 */
export function ChatMessages<T extends ChatMessageData = ChatMessageData>({
    messages,
    label,
    groupWithin = 5,
    separators = true,
    now,
    markdown = true,
    announce: announceMessages = true,
    hasMore,
    loading,
    onLoadMore,
    emptyText,
    renderMessage,
    classes,
    className,
    ...props
}: ChatMessagesProps<T>) {
    const chatMessages = useRecipe('chatMessages', chatMessagesRecipe, classes);
    const locale = useLocale();
    const t = locale.translations.chatMessages;
    const styles = chatMessages();
    const viewport = useRef<HTMLDivElement>(null);
    const entries = chatEntries(messages, { withinMinutes: groupWithin, separators });
    const streaming = messages.some((message) => message.streaming);
    const dayText = (date: Date) => {
        if (now !== undefined) {
            const today = new Date(now);
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if (chatDayKey(date) === chatDayKey(today)) return t.today;
            if (chatDayKey(date) === chatDayKey(yesterday)) return t.yesterday;
        }
        return new Intl.DateTimeFormat(locale.locale, { dateStyle: 'full' }).format(date);
    };

    // Following: at the end, new messages scroll into view; scrolled up, they are counted for the jump button
    const [atBottom, setAtBottom] = useState(true);
    const [unread, setUnread] = useState(0);
    const [previous, setPrevious] = useState(messages);
    const [plan, setPlan] = useState<{ scroll: 'end' | 'restore' } | null>(null);
    if (previous !== messages) {
        setPrevious(messages);
        const known = new Set(previous.map((message) => message.id));
        const prepended = previous.length > 0 && messages.length > 0 && messages[0]!.id !== previous[0]!.id;
        const added = prepended ? 0 : messages.filter((message) => !known.has(message.id)).length;
        if (prepended) setPlan({ scroll: 'restore' });
        else if (atBottom) setPlan({ scroll: 'end' });
        else if (added) setUnread(unread + added);
    }
    const restore = useRef<number | null>(null);
    useLayoutEffect(() => {
        const element = viewport.current;
        if (!element || !plan) return;
        if (plan.scroll === 'restore' && restore.current !== null) {
            element.scrollTop = element.scrollHeight - restore.current;
            restore.current = null;
        } else if (plan.scroll === 'end') element.scrollTop = element.scrollHeight;
    }, [plan]);
    useLayoutEffect(() => {
        const element = viewport.current;
        if (element) element.scrollTop = element.scrollHeight;
    }, []);

    // Announcements: new messages of others, streamed ones when they are complete (not the first render)
    const seen = useRef<Map<T['id'], boolean> | null>(null);
    useEffect(() => {
        const before = seen.current;
        seen.current = new Map(messages.map((message) => [message.id, !!message.streaming]));
        if (!before || !announceMessages) return;
        for (const message of messages) {
            const was = before.get(message.id);
            const completed = was === true && !message.streaming;
            if (message.own || !((was === undefined && !message.streaming) || completed)) continue;
            const text = markdownToText(message.text);
            announce(
                t.announce(
                    message.author ?? locale.translations.chatMessage.assistant,
                    text.length > 300 ? `${text.slice(0, 300)} …` : text
                )
            );
        }
    }, [messages, announceMessages, t, locale]);

    const onScroll = () => {
        const element = viewport.current;
        if (!element) return;
        const bottom = isAtBottom(element);
        setAtBottom(bottom);
        if (bottom) setUnread(0);
    };
    const jump = () => {
        const element = viewport.current;
        if (element) element.scrollTop = element.scrollHeight;
        setUnread(0);
        setAtBottom(true);
        // The button disappears – the focus stays in the list
        element?.focus();
    };
    const loadMore = () => {
        const element = viewport.current;
        restore.current = element ? element.scrollHeight - element.scrollTop : null;
        onLoadMore?.();
    };

    return (
        <div {...props} className={styles.base({ class: className })}>
            <div
                ref={viewport}
                role="log"
                aria-live="off"
                aria-label={label ?? t.label}
                aria-busy={streaming || undefined}
                tabIndex={0}
                className={styles.viewport()}
                onScroll={onScroll}
            >
                {hasMore && (
                    <Button size="sm" variant="text" loading={loading} className={styles.more()} onClick={loadMore}>
                        {t.loadMore}
                    </Button>
                )}
                {!messages.length && <p className={styles.empty()}>{emptyText ?? t.empty}</p>}
                {entries.map((entry) =>
                    entry.type === 'separator' ? (
                        <div key={entry.key} className={styles.separator()}>
                            <span>{dayText(entry.date)}</span>
                        </div>
                    ) : (
                        <div key={entry.key} className={styles.message()} data-first={entry.first}>
                            {renderMessage ? (
                                <Fragment>{renderMessage(entry.message, { grouped: entry.grouped })}</Fragment>
                            ) : (
                                <ChatMessage
                                    text={entry.message.text}
                                    markdown={markdown}
                                    author={entry.message.author}
                                    avatar={entry.message.avatar}
                                    time={entry.message.time}
                                    status={entry.message.status}
                                    attachments={entry.message.attachments}
                                    align={entry.message.system ? 'center' : entry.message.own ? 'end' : 'start'}
                                    grouped={entry.grouped}
                                    streaming={entry.message.streaming}
                                />
                            )}
                        </div>
                    )
                )}
            </div>
            {unread > 0 && (
                <Button size="sm" variant="secondary" leadingIcon={ArrowDown} className={styles.jump()} onClick={jump}>
                    {`${t.jump} (${t.newCount(unread)})`}
                </Button>
            )}
        </div>
    );
}
