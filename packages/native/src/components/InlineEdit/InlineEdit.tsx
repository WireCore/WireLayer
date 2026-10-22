import { inlineEdit } from '@wirecore/wirelayer-recipes/native';
import { Pencil } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { focusElement } from '../../utils/focus-registry.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { Input } from '../Input/Input.js';

/** What renderEditor gets: the draft and how to change, save or cancel it */
export interface InlineEditEditorProps<T> {
    value: T | undefined;
    setValue: (value: T | undefined) => void;
    save: () => void;
    cancel: () => void;
    /** Accessible name of the editor ("Project name") */
    label: string;
    invalid: boolean;
}

export interface InlineEditProps<T = string> {
    /** The value (controlled); it changes only when a valid edit is saved */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T | undefined) => void;
    /** What is edited, e.g. "Project name" – names the editor and the button */
    label: string;
    /** Text while the value is empty (default "Empty") */
    placeholder?: string;
    /** Text of the value (default: the value as text) */
    format?: (value: T | undefined) => string;
    /** Checks the value before saving: a message keeps the editor open and is shown (and announced); may be async */
    validate?: (value: T | undefined) => string | null | undefined | Promise<string | null | undefined>;
    /** Editing state (controlled) */
    editing?: boolean;
    onEditingChange?: (editing: boolean) => void;
    /** A valid edit was saved */
    onSave?: (value: T | undefined) => void;
    onCancel?: () => void;
    disabled?: boolean;
    saveLabel?: string;
    cancelLabel?: string;
    /** The editor: Input (default), Textarea, Select, NumberInput, DatePicker … bound to `value`/`setValue` */
    renderEditor?: (props: InlineEditEditorProps<T>) => ReactNode;
    /** Own rendering of the value */
    renderDisplay?: (value: T | undefined) => ReactNode;
    className?: string;
}

/**
 * The value as a button ("Project name: Relaunch, edit"); pressing it shows an editor with save and cancel. The
 * return key saves; a failed check keeps the editor open with the message.
 */
export function InlineEdit<T = string>({
    value,
    defaultValue,
    onValueChange,
    label,
    placeholder,
    format = (current) => (current === undefined || current === null ? '' : String(current)),
    validate,
    editing: editingProp,
    onEditingChange,
    onSave,
    onCancel,
    disabled = false,
    saveLabel,
    cancelLabel,
    renderEditor,
    renderDisplay,
    className,
}: InlineEditProps<T>) {
    const translations = useTranslations();
    const t = translations.inlineEdit;
    const [current, setCurrent] = useControllable<T | undefined>(value, defaultValue, onValueChange);
    const [editing, setEditing] = useControllable(editingProp, false, onEditingChange);
    const [draft, setDraft] = useState<T | undefined>(current);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const display = useRef<ComponentRef<typeof Pressable>>(null);
    const { announce, region } = useAnnouncer();
    const styles = inlineEdit();
    const text = format(current);
    // Back on the button after saving or cancelling (counted, so every return focuses again)
    const [returnFocus, setReturnFocus] = useState(0);
    useEffect(() => {
        if (!editing && returnFocus) focusElement(display.current);
    }, [editing, returnFocus]);

    const start = () => {
        setDraft(current);
        setError(null);
        setEditing(true);
    };
    const cancel = () => {
        setEditing(false);
        setError(null);
        setReturnFocus((count) => count + 1);
        onCancel?.();
    };
    const save = async () => {
        if (saving) return;
        setSaving(true);
        const message = validate ? await validate(draft) : null;
        setSaving(false);
        if (message) {
            setError(message);
            announce(message);
            return;
        }
        setCurrent(draft);
        onSave?.(draft);
        setEditing(false);
        setReturnFocus((count) => count + 1);
    };

    if (!editing)
        return (
            <View className={className}>
                <Pressable
                    ref={display}
                    role="button"
                    aria-label={`${label}: ${text || (placeholder ?? t.empty)}, ${t.edit}`}
                    disabled={disabled}
                    className={styles.display()}
                    onPress={start}
                >
                    {renderDisplay ? (
                        renderDisplay(current)
                    ) : (
                        <Text className={text ? styles.value() : styles.placeholder()}>
                            {text || (placeholder ?? t.empty)}
                        </Text>
                    )}
                    <Icon icon={Pencil} className={styles.icon()} />
                </Pressable>
                {region}
            </View>
        );

    const editorProps: InlineEditEditorProps<T> = {
        value: draft,
        setValue: setDraft,
        save: () => void save(),
        cancel,
        label,
        invalid: !!error,
    };
    return (
        <View className={styles.editor({ class: className })}>
            {renderEditor ? (
                renderEditor(editorProps)
            ) : (
                <Input
                    autoFocus
                    aria-label={label}
                    value={(draft as string | undefined) ?? ''}
                    invalid={!!error}
                    onChangeText={(next) => setDraft(next as T)}
                    returnKeyType="done"
                    onSubmitEditing={() => void save()}
                    accessibilityHint={error ?? undefined}
                />
            )}
            {!!error && (
                <Text role="alert" className={styles.error()}>
                    {error}
                </Text>
            )}
            <View className={styles.actions()}>
                <Button variant="outline" size="sm" onPress={cancel}>
                    {cancelLabel ?? t.cancel}
                </Button>
                <Button size="sm" loading={saving} onPress={() => void save()}>
                    {saving ? t.saving : (saveLabel ?? t.save)}
                </Button>
            </View>
            {region}
        </View>
    );
}
