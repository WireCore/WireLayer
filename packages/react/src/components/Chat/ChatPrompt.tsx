import {
    chatPrompt as chatPromptRecipe,
    chatPromptAction,
    promptHeight,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ArrowUp, Paperclip, Square } from 'lucide-react';
import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties } from 'react';
import { Chip } from '../ChipGroup/Chip.js';
import { IconButton } from '../IconButton/IconButton.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ChatPromptProps extends Omit<ComponentProps<'form'>, 'children' | 'onSubmit'> {
    /** The text (controlled) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (text: string) => void;
    /** Accessible name of the field (default "Message") */
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    /** A reply is being written: the send button becomes a stop button (calls onStop) */
    responding?: boolean;
    /** A button to attach files */
    attachments?: boolean;
    /** Attached files (controlled) */
    files?: File[];
    onFilesChange?: (files: File[]) => void;
    /** Accepted file types for attachments, e.g. "image/*,.pdf" */
    accept?: string;
    /** Lines the field grows to before it scrolls (default 8) */
    maxRows?: number;
    /** `enter` (default): Enter sends, Shift+Enter adds a line; `mod-enter`: Ctrl/Cmd+Enter sends */
    sendOn?: 'enter' | 'mod-enter';
    /** Shows how to send and add a line (default true) */
    hint?: boolean;
    /** Send: the text (trimmed) and the attached files; the field is cleared afterwards */
    onSubmit?: (message: { text: string; files: File[] }) => void;
    /** Stop the reply that is being written */
    onStop?: () => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatPromptRecipe>;
}

const LINE = 24;
const PADDING = 16;

/** A form with a growing text field: Enter sends, Shift+Enter adds a line; while replying a stop button */
export function ChatPrompt({
    value,
    defaultValue = '',
    onValueChange,
    label,
    placeholder,
    disabled,
    responding,
    attachments,
    files,
    onFilesChange,
    accept,
    maxRows = 8,
    sendOn = 'enter',
    hint = true,
    onSubmit,
    onStop,
    classes,
    className,
    ...props
}: ChatPromptProps) {
    const chatPrompt = useRecipe('chatPrompt', chatPromptRecipe, classes);
    const locale = useLocale();
    const t = locale.translations.chatPrompt;
    const styles = chatPrompt();
    const id = useId();
    const textarea = useRef<HTMLTextAreaElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const [internal, setInternal] = useState(defaultValue);
    const text = value ?? internal;
    const [internalFiles, setInternalFiles] = useState<File[]>([]);
    const attached = files ?? internalFiles;
    const canSend = !disabled && (!!text.trim() || attached.length > 0);

    useLayoutEffect(() => {
        const element = textarea.current;
        if (!element) return;
        element.style.height = 'auto';
        element.style.height = `${promptHeight(element.scrollHeight, LINE, PADDING, maxRows)}px`;
    }, [text, maxRows]);

    const setText = (next: string) => {
        setInternal(next);
        onValueChange?.(next);
    };
    const setFiles = (next: File[]) => {
        setInternalFiles(next);
        onFilesChange?.(next);
    };
    const send = () => {
        if (!canSend || responding) return;
        onSubmit?.({ text: text.trim(), files: attached });
        setText('');
        if (attached.length) setFiles([]);
    };

    return (
        <form
            {...props}
            className={styles.base({ class: className })}
            data-disabled={disabled || undefined}
            onSubmit={(event) => {
                event.preventDefault();
                send();
            }}
        >
            {attached.length > 0 && (
                <ul className={styles.files()} aria-label={locale.translations.chatMessage.attachments}>
                    {attached.map((file, index) => (
                        <li key={`${file.name}-${index}`}>
                            <Chip
                                label={file.name}
                                removable
                                removeLabel={t.removeFile(file.name)}
                                size="sm"
                                onRemove={() => {
                                    setFiles(attached.filter((_, position) => position !== index));
                                    textarea.current?.focus();
                                }}
                            />
                        </li>
                    ))}
                </ul>
            )}
            <textarea
                ref={textarea}
                value={text}
                rows={1}
                className={styles.textarea()}
                style={{ '--wc-prompt-max': `${LINE * maxRows + PADDING}px` } as CSSProperties}
                aria-label={label ?? t.label}
                aria-describedby={hint ? `${id}hint` : undefined}
                placeholder={placeholder ?? t.placeholder}
                disabled={disabled}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                    if (chatPromptAction(event.nativeEvent, sendOn) !== 'send') return;
                    event.preventDefault();
                    send();
                }}
            />
            <div className={styles.footer()}>
                {attachments && (
                    <>
                        <input
                            ref={fileInput}
                            type="file"
                            multiple
                            accept={accept}
                            tabIndex={-1}
                            aria-hidden="true"
                            className={styles.fileInput()}
                            onChange={(event) => {
                                const input = event.target;
                                setFiles([...attached, ...(input.files ? [...input.files] : [])]);
                                input.value = '';
                            }}
                        />
                        <IconButton
                            icon={Paperclip}
                            label={t.attach}
                            variant="text"
                            size="sm"
                            disabled={disabled}
                            onClick={() => fileInput.current?.click()}
                        />
                    </>
                )}
                {hint && (
                    <span id={`${id}hint`} className={styles.hint()}>
                        {sendOn === 'enter' ? t.hint : t.hintModEnter}
                    </span>
                )}
                {responding ? (
                    <IconButton
                        icon={Square}
                        label={t.stop}
                        variant="secondary"
                        size="sm"
                        className={styles.submit()}
                        onClick={() => onStop?.()}
                    />
                ) : (
                    <IconButton
                        type="submit"
                        icon={ArrowUp}
                        label={t.send}
                        size="sm"
                        aria-disabled={canSend ? undefined : 'true'}
                        className={styles.submit()}
                    />
                )}
            </div>
        </form>
    );
}
