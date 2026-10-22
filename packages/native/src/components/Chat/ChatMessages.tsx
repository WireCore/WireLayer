import {
    chatAnnouncements,
    chatAnnouncementText,
    chatDayText,
    chatEntries,
    chatListChange,
    chatMessages,
    chatStreamingState,
    type ChatAttachment,
    type ChatEntry,
    type ChatMessageData,
} from '@wirecore/wirelayer-recipes/native';
import { ArrowDown } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
    FlatList,
    Platform,
    Text,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    type ViewProps,
} from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';
import { Button } from '../Button/Button.js';
import { ChatMessage } from './ChatMessage.js';

export interface ChatMessagesProps<T extends ChatMessageData = ChatMessageData> extends Omit<ViewProps, 'children'> {
    /** The messages, oldest first */
    messages: T[];
    /** Accessible name of the list (default "Messages") */
    label?: string;
    /** Messages of the same author within this many minutes are grouped (default 5) */
    groupWithin?: number;
    /** A date line before the first message of each day (default true) */
    separators?: boolean;
    /** Today's date – the date lines then say "Today" and "Yesterday" */
    now?: string | number | Date;
    /** Message texts are Markdown (default true) */
    markdown?: boolean;
    /** Announces new messages of others – streamed ones once they are complete (default true) */
    announce?: boolean;
    /** Older messages can be loaded: reaching the top (or the button there) calls onLoadMore */
    hasMore?: boolean;
    /** Older messages are loading */
    loading?: boolean;
    /** Load older messages (they are added at the top, the view stays where it is) */
    onLoadMore?: () => void;
    /** Text without messages */
    emptyText?: string;
    /** A message (default: ChatMessage) */
    renderMessage?: (message: T, state: { grouped: boolean }) => ReactNode;
    /** A tap on an attachment of a message (default: opens its `href` with Linking) */
    onAttachmentPress?: (attachment: ChatAttachment, message: T) => void;
    className?: string;
}

/**
 * Message list: an inverted FlatList (newest at the bottom) with date lines and grouped messages. It is no live
 * region – new messages of others are announced, streamed ones once complete; aria-busy while a reply is written.
 * Scrolled up, a button leads to the new messages; the top loads older ones.
 */
export function ChatMessages<T extends ChatMessageData = ChatMessageData>({
    messages,
    label,
    groupWithin = 5,
    separators = true,
    now,
    markdown = true,
    announce: announceMessages = true,
    hasMore = false,
    loading = false,
    onLoadMore,
    emptyText,
    renderMessage,
    onAttachmentPress,
    className,
    ...props
}: ChatMessagesProps<T>) {
    const { locale, translations } = useLocale();
    const t = translations.chatMessages;
    const styles = chatMessages();
    const reducedMotion = useReducedMotion();
    const list = useRef<FlatList<ChatEntry<T>>>(null);
    const { announce, region } = useAnnouncer();
    // Newest first: the inverted list starts at the bottom
    const entries = useMemo(
        () => chatEntries(messages, { withinMinutes: groupWithin, separators }).reverse(),
        [messages, groupWithin, separators]
    );
    const streaming = messages.some((message) => message.streaming);

    // At the end the list stays there; scrolled up, new messages are counted for the jump button
    const [atBottom, setAtBottom] = useState(true);
    const [unread, setUnread] = useState(0);
    const [previous, setPrevious] = useState(messages);
    if (previous !== messages) {
        setPrevious(messages);
        const { added } = chatListChange(previous, messages);
        if (added && !atBottom) setUnread(unread + added);
    }

    // Announcements: new messages of others, streamed ones when they are complete (not the first render)
    const seen = useRef<Map<T['id'], boolean> | null>(null);
    useEffect(() => {
        const before = seen.current;
        seen.current = chatStreamingState(messages);
        if (!before || !announceMessages) return;
        const texts = chatAnnouncements(before, messages).map((message) =>
            t.announce(
                message.author ?? translations.chatMessage.assistant,
                chatAnnouncementText(message.text, markdown)
            )
        );
        if (texts.length) announce(texts.join('. '));
    }, [messages, announceMessages, markdown, announce, t, translations]);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // Inverted: offset 0 is the newest message
        const bottom = event.nativeEvent.contentOffset.y <= 8;
        if (bottom !== atBottom) setAtBottom(bottom);
        if (bottom && unread) setUnread(0);
    };
    const jump = () => {
        list.current?.scrollToOffset({ offset: 0, animated: !reducedMotion });
        setUnread(0);
        setAtBottom(true);
    };
    const loadMore = () => {
        if (hasMore && !loading) onLoadMore?.();
    };
    const more = hasMore ? (
        <View className={styles.more()}>
            <Button size="sm" variant="text" loading={loading} onPress={loadMore}>
                {t.loadMore}
            </Button>
        </View>
    ) : null;

    const renderEntry = (entry: ChatEntry<T>) => {
        if (entry.type === 'separator')
            return (
                <View className={styles.separator()}>
                    <View className={styles.separatorLine()} />
                    <Text className={styles.separatorText()}>
                        {chatDayText(entry.date, { locale, now, today: t.today, yesterday: t.yesterday })}
                    </Text>
                    <View className={styles.separatorLine()} />
                </View>
            );
        const { message, grouped } = entry;
        return (
            <View className={chatMessages({ first: entry.first }).message()}>
                {renderMessage ? (
                    renderMessage(message, { grouped })
                ) : (
                    <ChatMessage
                        text={message.text}
                        markdown={markdown}
                        author={message.author}
                        avatar={message.avatar}
                        time={message.time}
                        status={message.status}
                        attachments={message.attachments}
                        onAttachmentPress={
                            onAttachmentPress ? (attachment) => onAttachmentPress(attachment, message) : undefined
                        }
                        align={message.system ? 'center' : message.own ? 'end' : 'start'}
                        grouped={grouped}
                        streaming={message.streaming}
                    />
                )}
            </View>
        );
    };

    return (
        <View {...props} className={styles.base({ class: className })}>
            {messages.length ? (
                <FlatList
                    ref={list}
                    data={entries}
                    inverted
                    keyExtractor={(entry) => entry.key}
                    renderItem={({ item }) => renderEntry(item)}
                    // A log without live announcements of its own (a streamed reply would be read token by token)
                    role="log"
                    aria-label={label ?? t.label}
                    aria-live="off"
                    aria-busy={streaming || loading || undefined}
                    // Web: the scrolling list must be reachable with the keyboard (axe)
                    {...(Platform.OS === 'web' ? { tabIndex: 0 as const } : {})}
                    className={styles.list()}
                    contentContainerClassName={styles.content()}
                    // iOS/Android: new messages keep the view where it is while scrolled up – at the end it follows them
                    maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 24 }}
                    keyboardShouldPersistTaps="handled"
                    onScroll={onScroll}
                    scrollEventThrottle={100}
                    // Inverted: the end of the list is its top – older messages
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={more ?? undefined}
                />
            ) : (
                <View className={styles.empty()}>
                    {more}
                    <Text className={styles.emptyText()}>{emptyText ?? t.empty}</Text>
                </View>
            )}
            {unread > 0 && (
                <Button size="sm" variant="secondary" leadingIcon={ArrowDown} className={styles.jump()} onPress={jump}>
                    {`${t.jump} (${t.newCount(unread)})`}
                </Button>
            )}
            {region}
        </View>
    );
}
