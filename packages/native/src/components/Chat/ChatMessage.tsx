import {
    chatMessage,
    formatFileSize,
    markdownToText,
    visuallyHidden,
    type ChatAttachment,
    type ChatStatus,
} from '@wirecore/wirelayer-recipes/native';
import { Check, CheckCheck, CircleAlert, Clock, Paperclip } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Linking, Pressable, Text, View, type ViewProps } from 'react-native';
import { useLocale } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { nativeDriver } from '../../utils/motion.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';
import { Avatar } from '../Avatar/Avatar.js';
import { Markdown } from '../Markdown/Markdown.js';

export interface ChatMessageProps extends Omit<ViewProps, 'children'> {
    /** Text of the message – Markdown unless `markdown` is false (children replace it) */
    text?: string;
    /** Render the text as Markdown (default true); otherwise plain text with its line breaks */
    markdown?: boolean;
    /** Name of the author, above the message */
    author?: string;
    /** Avatar image (default: the initials of the author) */
    avatar?: string;
    /** Time sent: ISO text, timestamp or Date (shown as the time of day) */
    time?: string | number | Date;
    /** Delivery status of an own message: sending, sent, read, error (shown as icon and text) */
    status?: ChatStatus;
    /** Files of the message: name and size, a tap opens them */
    attachments?: ChatAttachment[];
    /** A tap on an attachment (default: opens its `href` with Linking) */
    onAttachmentPress?: (attachment: ChatAttachment) => void;
    /** start (others, default), end (own messages) or center (system notes) */
    align?: 'start' | 'end' | 'center';
    /** Follows a message of the same author: avatar and name only for screen readers */
    grouped?: boolean;
    /** The text is still being written: a cursor while it grows, aria-busy until it is complete */
    streaming?: boolean;
    /** Heading level of `#` in the Markdown (default 3) */
    headingLevel?: number;
    /** Own content instead of the text */
    children?: ReactNode;
    /** Above the bubble, e.g. ChatThinking or ChatToolCall */
    before?: ReactNode;
    /** Below the bubble, e.g. ChatSources */
    after?: ReactNode;
    /** Buttons next to the status (copy, retry …) */
    actions?: ReactNode;
    className?: string;
}

const statusIcons = { sending: Clock, sent: Check, read: CheckCheck, error: CircleAlert };

/** A dot or cursor that pulses while a reply is written – still with reduced motion */
function Pulse({ className, delay = 0 }: { className: string; delay?: number }) {
    const reducedMotion = useReducedMotion();
    const [opacity] = useState(() => new Animated.Value(1));
    useEffect(() => {
        if (reducedMotion) {
            opacity.setValue(1);
            return;
        }
        const step = (toValue: number) =>
            Animated.timing(opacity, { toValue, duration: 500, useNativeDriver: nativeDriver });
        const loop = Animated.loop(Animated.sequence([Animated.delay(delay), step(0.3), step(1)]));
        loop.start();
        return () => loop.stop();
    }, [reducedMotion, delay, opacity]);
    return <Animated.View aria-hidden className={className} style={{ opacity }} />;
}

/** A message: author and time (only for screen readers when grouped), the bubble, the delivery status */
export function ChatMessage({
    text,
    markdown = true,
    author,
    avatar,
    time,
    status,
    attachments,
    onAttachmentPress,
    align = 'start',
    grouped = false,
    streaming = false,
    headingLevel = 3,
    children,
    before,
    after,
    actions,
    className,
    ...props
}: ChatMessageProps) {
    const { locale, translations } = useLocale();
    const t = translations.chatMessage;
    const styles = chatMessage({ align, status: status ?? 'none' });
    const parsed = time === undefined ? undefined : new Date(time);
    const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
    const timeText = date ? new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(date) : '';
    const empty = !text;
    const StatusIcon = status ? statusIcons[status] : undefined;
    const openAttachment = (file: ChatAttachment) => {
        if (onAttachmentPress) onAttachmentPress(file);
        else if (file.href) void Linking.openURL(file.href);
    };

    // System notes are short: plain text (centred) – Markdown markers are dropped
    const content =
        children !== undefined ? (
            typeof children === 'string' ? (
                <Text className={styles.text()}>{children}</Text>
            ) : (
                children
            )
        ) : !text ? null : align === 'center' ? (
            <Text className={styles.text()}>{markdown ? markdownToText(text) : text}</Text>
        ) : markdown ? (
            <Markdown source={text} headingLevel={headingLevel} breaks />
        ) : (
            <Text className={styles.text()}>{text}</Text>
        );

    return (
        <View
            {...props}
            role="article"
            aria-busy={streaming || undefined}
            className={styles.base({ class: className })}
        >
            {align !== 'center' && (
                <View className={styles.avatar()} aria-hidden>
                    {!grouped && (!!author || !!avatar) && <Avatar name={author} src={avatar} size="sm" color="auto" />}
                </View>
            )}
            <View className={styles.body()}>
                {(!!author || !!timeText) && (
                    <View className={styles.header({ class: grouped ? visuallyHidden() : undefined })}>
                        {!!author && <Text className={styles.author()}>{author}</Text>}
                        {!!timeText && <Text className={styles.time()}>{timeText}</Text>}
                    </View>
                )}
                {before}
                {(children !== undefined || !empty || streaming || !!attachments?.length) && (
                    <View className={styles.bubble()}>
                        {content}
                        {streaming && (
                            <>
                                {empty ? (
                                    <View className={styles.typing()} aria-hidden>
                                        {[0, 1, 2].map((index) => (
                                            <Pulse key={index} delay={index * 160} className={styles.dot()} />
                                        ))}
                                    </View>
                                ) : (
                                    <Pulse className={styles.cursor()} />
                                )}
                                <Text className={visuallyHidden()}>{t.writing}</Text>
                            </>
                        )}
                        {!!attachments?.length && (
                            <View role="list" aria-label={t.attachments} className={styles.attachments()}>
                                {attachments.map((file, index) => {
                                    const linked = !!onAttachmentPress || !!file.href;
                                    const look = chatMessage({ linked });
                                    const parts = (
                                        <>
                                            <Icon icon={Paperclip} className={look.attachmentIcon()} />
                                            <Text numberOfLines={1} className={look.attachmentName()}>
                                                {file.name}
                                            </Text>
                                            {file.size !== undefined && (
                                                <Text className={look.attachmentSize()}>
                                                    {formatFileSize(file.size, locale)}
                                                </Text>
                                            )}
                                        </>
                                    );
                                    return (
                                        <View key={`${file.name}-${index}`} role="listitem">
                                            {linked ? (
                                                <Pressable
                                                    role={file.href ? 'link' : 'button'}
                                                    className={look.attachment()}
                                                    onPress={() => openAttachment(file)}
                                                >
                                                    {parts}
                                                </Pressable>
                                            ) : (
                                                <View className={look.attachment()}>{parts}</View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                )}
                {after}
                {(!!StatusIcon || !!actions) && (
                    <View className={styles.meta()}>
                        {!!StatusIcon && (
                            <>
                                <Icon icon={StatusIcon} className={styles.statusIcon()} />
                                <Text className={styles.metaText()}>{t.status[status!]}</Text>
                            </>
                        )}
                        {!!actions && <View className={styles.actions()}>{actions}</View>}
                    </View>
                )}
            </View>
        </View>
    );
}
