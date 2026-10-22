import { chatPrompt, chatPromptAction, promptHeight } from '@wirecore/wirelayer-recipes/native';
import { ArrowUp, Paperclip, Square } from 'lucide-react-native';
import { useLayoutEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Text, TextInput, View, type ViewProps } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useLocale } from '../../locale.js';
import { useControllable } from '../../utils/useControllable.js';
import { Chip } from '../Chip/Chip.js';
import type { FilePicker, NativeFile } from '../FileUpload/types.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Menu } from '../Menu/Menu.js';

export interface ChatPromptProps extends Omit<ViewProps, 'children'> {
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
    /** A button to attach files from the `pickers` */
    attachments?: boolean;
    /**
     * Sources of attachments: documentPicker() from `@wirecore/wirelayer-native/expo-document-picker`, imageLibraryPicker() …
     * or own – several open a choice
     */
    pickers?: FilePicker[];
    /** Attached files (controlled) */
    files?: NativeFile[];
    onFilesChange?: (files: NativeFile[]) => void;
    /** Accepted file types for attachments, passed to the pickers, e.g. ["image/*", "application/pdf"] */
    accept?: string | string[];
    /** Lines the field grows to before it scrolls (default 8) */
    maxRows?: number;
    /**
     * Web with a hardware keyboard: `enter` (default) sends with Enter, Shift+Enter adds a line; `mod-enter` sends with
     * Ctrl/Cmd+Enter. On iOS and Android only the send button sends (Enter adds a line).
     */
    sendOn?: 'enter' | 'mod-enter';
    /** Web: shows how to send and add a line (default true) */
    hint?: boolean;
    /** Send: the text (trimmed) and the attached files; the field is cleared afterwards */
    onSubmit?: (message: { text: string; files: NativeFile[] }) => void;
    /** Stop the reply that is being written */
    onStop?: () => void;
    className?: string;
}

const LINE = 24;
const PADDING = 16;
const NO_FILES: NativeFile[] = [];

/**
 * Prompt of a chat: a text field that grows up to `maxRows` lines, attached files with a remove button each, a send
 * button – and a stop button instead while a reply is written.
 */
export function ChatPrompt({
    value,
    defaultValue = '',
    onValueChange,
    label,
    placeholder,
    disabled = false,
    responding = false,
    attachments = false,
    pickers = [],
    files,
    onFilesChange,
    accept,
    maxRows = 8,
    sendOn = 'enter',
    hint = true,
    onSubmit,
    onStop,
    className,
    ...props
}: ChatPromptProps) {
    const { translations } = useLocale();
    const t = translations.chatPrompt;
    const web = Platform.OS === 'web';
    const [text, setText] = useControllable(value, defaultValue, onValueChange);
    const [attached, setFiles] = useControllable(files, NO_FILES, onFilesChange);
    const [focused, setFocused] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);
    const field = useRef<ComponentRef<typeof TextInput>>(null);
    const muted = useResolveClassNames('text-muted');
    const styles = chatPrompt({ focused, disabled });
    const canSend = !disabled && (!!text.trim() || attached.length > 0);
    const height = promptHeight(contentHeight + PADDING, LINE, PADDING, maxRows);
    const accepted = typeof accept === 'string' ? accept.split(',').map((entry) => entry.trim()) : accept;
    // Web: the textarea measures itself (auto, then its scroll height) – a measured content size would never shrink
    useLayoutEffect(() => {
        if (!web) return;
        const node = field.current as unknown as HTMLTextAreaElement | null;
        if (!node?.style) return;
        node.style.height = 'auto';
        node.style.height = `${promptHeight(node.scrollHeight, LINE, PADDING, maxRows)}px`;
    }, [web, text, maxRows]);

    const send = () => {
        if (!canSend || responding) return;
        onSubmit?.({ text: text.trim(), files: attached });
        setText('');
        if (attached.length) setFiles([]);
    };
    const pick = async (picker: FilePicker | undefined) => {
        if (!picker || disabled) return;
        const picked = await picker.pick({ multiple: true, accept: accepted });
        if (picked.length) setFiles([...attached, ...picked]);
    };
    const attachButton = (
        <IconButton
            icon={Paperclip}
            label={t.attach}
            variant="text"
            disabled={disabled}
            onPress={pickers.length === 1 ? () => void pick(pickers[0]) : undefined}
        />
    );

    return (
        <View {...props} className={styles.base({ class: className })}>
            {attached.length > 0 && (
                <View role="list" aria-label={translations.chatMessage.attachments} className={styles.files()}>
                    {attached.map((file, index) => (
                        <View key={`${file.uri}-${index}`} role="listitem">
                            <Chip
                                label={file.name}
                                removable
                                removeLabel={t.removeFile(file.name)}
                                size="sm"
                                disabled={disabled}
                                onRemove={() => {
                                    setFiles(attached.filter((_, position) => position !== index));
                                    field.current?.focus();
                                }}
                            />
                        </View>
                    ))}
                </View>
            )}
            <TextInput
                ref={field}
                value={text}
                multiline
                textAlignVertical="top"
                aria-label={label ?? t.label}
                placeholder={placeholder ?? t.placeholder}
                placeholderTextColor={typeof muted.color === 'string' ? muted.color : undefined}
                editable={!disabled}
                aria-disabled={disabled || undefined}
                className={styles.textarea()}
                {...(web
                    ? { numberOfLines: 1 }
                    : {
                          style: { height },
                          scrollEnabled: height >= LINE * maxRows + PADDING,
                          onContentSizeChange: (event: { nativeEvent: { contentSize: { height: number } } }) =>
                              setContentHeight(event.nativeEvent.contentSize.height),
                      })}
                onChangeText={setText}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                // Web with a hardware keyboard: Enter (or Ctrl/Cmd+Enter) sends – the DOM event carries the modifiers
                onKeyPress={(event) => {
                    if (!web) return;
                    const key = event as unknown as {
                        nativeEvent: KeyboardEvent;
                        preventDefault(): void;
                    };
                    if (chatPromptAction(key.nativeEvent, sendOn) !== 'send') return;
                    key.preventDefault();
                    send();
                }}
            />
            <View className={styles.footer()}>
                {attachments &&
                    pickers.length > 0 &&
                    (pickers.length > 1 ? (
                        <Menu
                            title={t.attach}
                            items={pickers.map((picker, index) => ({
                                value: String(index),
                                label:
                                    picker.label ??
                                    (picker.kind ? translations.fileUpload.sources[picker.kind] : t.attach),
                                icon: picker.icon,
                            }))}
                            onSelect={(index) => void pick(pickers[Number(index)])}
                        >
                            {attachButton}
                        </Menu>
                    ) : (
                        attachButton
                    ))}
                {web && hint && <Text className={styles.hint()}>{sendOn === 'enter' ? t.hint : t.hintModEnter}</Text>}
                {responding ? (
                    <IconButton
                        icon={Square}
                        label={t.stop}
                        variant="secondary"
                        className={styles.submit()}
                        onPress={() => onStop?.()}
                    />
                ) : (
                    <IconButton
                        icon={ArrowUp}
                        label={t.send}
                        disabled={!canSend}
                        aria-disabled={!canSend || undefined}
                        className={styles.submit()}
                        onPress={send}
                    />
                )}
            </View>
        </View>
    );
}
