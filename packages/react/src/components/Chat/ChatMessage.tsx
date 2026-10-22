import {
    chatMessage as chatMessageRecipe,
    formatFileSize,
    type ChatAttachment,
    type ChatStatus,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Check, CheckCheck, CircleAlert, Clock, Paperclip } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Avatar } from '../Avatar/Avatar.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { Markdown } from '../Markdown/Markdown.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ChatMessageProps extends Omit<ComponentProps<'article'>, 'children'> {
    /** Text of the message – Markdown unless `markdown` is false (children replace it) */
    text?: string;
    /** Render the text as Markdown (default true); otherwise plain text with its line breaks */
    markdown?: boolean;
    /** Name of the author, above the message */
    author?: string;
    /** Avatar image (default: the initials of the author) */
    avatar?: string;
    /** Time sent: ISO text, timestamp or Date */
    time?: string | number | Date;
    /** Delivery status of an own message: sending, sent, read, error */
    status?: ChatStatus;
    attachments?: ChatAttachment[];
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
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatMessageRecipe>;
}

const statusIcons = { sending: Clock, sent: Check, read: CheckCheck, error: CircleAlert };

/** A message: author and time (only for screen readers when grouped), the bubble, the delivery status */
export function ChatMessage({
    text,
    markdown = true,
    author,
    avatar,
    time,
    status,
    attachments,
    align = 'start',
    grouped,
    streaming,
    headingLevel = 3,
    children,
    before,
    after,
    actions,
    classes,
    className,
    ...props
}: ChatMessageProps) {
    const chatMessage = useRecipe('chatMessage', chatMessageRecipe, classes);
    const locale = useLocale();
    const t = locale.translations.chatMessage;
    const styles = chatMessage({ align, grouped, status: status ?? 'none' });
    const parsed = time === undefined ? undefined : new Date(time);
    const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
    const timeText = date ? new Intl.DateTimeFormat(locale.locale, { timeStyle: 'short' }).format(date) : '';
    const empty = !text;
    const StatusIcon = status ? statusIcons[status] : undefined;
    return (
        <article
            {...props}
            className={styles.base({ class: className })}
            aria-busy={streaming || undefined}
            data-streaming={streaming || undefined}
        >
            {align !== 'center' && (
                <div className={styles.avatar()} aria-hidden="true">
                    {!grouped && (author || avatar) && <Avatar name={author} src={avatar} size="sm" color="auto" />}
                </div>
            )}
            <div className={styles.body()}>
                {(author || timeText) && (
                    <div className={styles.header()}>
                        {author && <span className={styles.author()}>{author}</span>}
                        {date && (
                            <time dateTime={date.toISOString()} className={styles.time()}>
                                {timeText}
                            </time>
                        )}
                    </div>
                )}
                {before}
                {(children !== undefined || !empty || streaming || !!attachments?.length) && (
                    <div className={styles.bubble()}>
                        {children ??
                            (markdown && !empty ? (
                                <Markdown source={text!} headingLevel={headingLevel} breaks />
                            ) : !empty ? (
                                <p className={styles.text()}>{text}</p>
                            ) : null)}
                        {streaming && (
                            <>
                                {empty ? (
                                    <span className={styles.typing()} aria-hidden="true">
                                        <span className={styles.dot()} />
                                        <span className={styles.dot()} />
                                        <span className={styles.dot()} />
                                    </span>
                                ) : (
                                    <span className={styles.cursor()} aria-hidden="true" />
                                )}
                                <span className={styles.srOnly()}>{t.writing}</span>
                            </>
                        )}
                        {!!attachments?.length && (
                            <ul className={styles.attachments()} aria-label={t.attachments}>
                                {attachments.map((file) => (
                                    <li key={file.name} className={styles.attachment()}>
                                        <Paperclip className={styles.attachmentIcon()} aria-hidden="true" />
                                        {file.href ? (
                                            <a href={file.href} download>
                                                {file.name}
                                            </a>
                                        ) : (
                                            <span>{file.name}</span>
                                        )}
                                        {file.size !== undefined && (
                                            <span className={styles.attachmentSize()}>
                                                {formatFileSize(file.size, locale.locale)}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
                {after}
                {(status || actions) && (
                    <div className={styles.meta()}>
                        {StatusIcon && (
                            <>
                                <StatusIcon className={styles.statusIcon()} aria-hidden="true" />
                                <span>{t.status[status!]}</span>
                            </>
                        )}
                        {actions && <span className={styles.actions()}>{actions}</span>}
                    </div>
                )}
            </div>
        </article>
    );
}
