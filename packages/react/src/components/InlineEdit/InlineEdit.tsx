import { inlineEdit as inlineEditRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Check, Pencil, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { Input } from '../Input/Input.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface InlineEditEditorProps<T> {
    value: T | undefined;
    setValue: (value: T | undefined) => void;
    save: () => void;
    cancel: () => void;
    invalid: boolean;
    /** Id of the error text – for aria-describedby of the editor */
    errorId: string | undefined;
    label: string;
}

export interface InlineEditProps<T = string> extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
    /** The value (controlled); it changes only when a valid edit is saved */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T | undefined) => void;
    /** What is edited, e.g. "Project name" – names the editor and the button */
    label: string;
    /** `inline` (default): the editor replaces the text; `popover`: it opens in a popover next to the text */
    mode?: 'inline' | 'popover';
    /** Text while the value is empty (default "Empty") */
    placeholder?: string;
    /** Text of the value (default: the value as text) */
    format?: (value: T | undefined) => string;
    /**
     * Checks the value before saving: a message keeps the editor open and is shown (and announced); may be async
     * (the save button is busy meanwhile)
     */
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
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof inlineEditRecipe>;
}

/**
 * The value as a button; activating it shows an editor (inline or in a popover) with save and cancel. Enter saves
 * (Ctrl/⌘+Enter in a textarea), Escape cancels; a failed check keeps the editor open with the message.
 */
export function InlineEdit<T = string>({
    classes,
    value: valueProp,
    defaultValue,
    onValueChange,
    label,
    mode = 'inline',
    placeholder,
    format,
    validate,
    editing,
    onEditingChange,
    onSave,
    onCancel,
    disabled,
    saveLabel,
    cancelLabel,
    renderEditor,
    renderDisplay,
    className,
    ...props
}: InlineEditProps<T>) {
    const inlineEdit = useRecipe('inlineEdit', inlineEditRecipe, classes);
    const t = useTranslations().inlineEdit;
    const styles = inlineEdit();
    const id = useId();
    const [ownValue, setOwnValue] = useState(defaultValue);
    const value = valueProp !== undefined ? valueProp : ownValue;
    const [internal, setInternal] = useState(false);
    const isEditing = editing ?? internal;
    const [draft, setDraft] = useState<T | undefined>(value);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const form = useRef<HTMLFormElement>(null);
    const display = useRef<HTMLButtonElement>(null);
    // Where the focus goes after a change: into the editor, or back to the text (a new object per request)
    const [focusTarget, setFocusTarget] = useState<{ to: 'editor' | 'display' } | null>(null);
    const text = format ? format(value) : value == null ? '' : String(value);
    const errorId = error ? `${id}error` : undefined;

    useEffect(() => {
        if (!focusTarget) return;
        // Back to the text a task later, so the Enter that saved does not open the editor again
        if (focusTarget.to === 'editor')
            form.current
                ?.querySelector<HTMLElement>('input, textarea, select, [contenteditable], button, [tabindex]')
                ?.focus();
        else if (mode === 'inline') setTimeout(() => display.current?.focus());
    }, [focusTarget, mode]);

    const setEditing = (next: boolean) => {
        if (next) {
            setDraft(value);
            setError(null);
        }
        setInternal(next);
        onEditingChange?.(next);
        setFocusTarget({ to: next ? 'editor' : 'display' });
    };
    const save = async () => {
        if (busy) return;
        if (validate) {
            setBusy(true);
            let message: string | null | undefined;
            try {
                message = await validate(draft);
            } finally {
                setBusy(false);
            }
            if (message) {
                setError(message);
                setFocusTarget({ to: 'editor' });
                return;
            }
        }
        setOwnValue(draft);
        onValueChange?.(draft);
        onSave?.(draft);
        setEditing(false);
    };
    const cancel = () => {
        onCancel?.();
        setEditing(false);
    };
    const setValue = (next: T | undefined) => {
        setDraft(next);
        setError(null);
    };
    // Escape cancels; Ctrl/⌘+Enter saves (also from a textarea, where Enter makes a new line)
    const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && mode === 'inline') {
            event.preventDefault();
            event.stopPropagation();
            cancel();
        } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void save();
        }
    };

    const button = (
        <button
            ref={display}
            type="button"
            className={styles.display()}
            disabled={disabled}
            onClick={mode === 'inline' ? () => setEditing(true) : undefined}
        >
            {renderDisplay ? (
                renderDisplay(value)
            ) : (
                <span className={text ? styles.value() : styles.placeholder()}>{text || (placeholder ?? t.empty)}</span>
            )}
            <span className={styles.hint()}>{t.title(label)}</span>
            <Pencil className={styles.editIcon()} aria-hidden="true" />
        </button>
    );
    const editor = (
        <form
            ref={form}
            className={styles.form()}
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                void save();
            }}
            onKeyDown={onKeyDown}
        >
            <div className={styles.row()}>
                <div className={styles.editor()}>
                    {renderEditor ? (
                        renderEditor({
                            value: draft,
                            setValue,
                            save: () => void save(),
                            cancel,
                            invalid: !!error,
                            errorId,
                            label,
                        })
                    ) : (
                        <Input
                            value={(draft as string | undefined) ?? ''}
                            aria-label={label}
                            invalid={!!error}
                            aria-describedby={errorId}
                            size="sm"
                            onChange={(event) => setValue(event.currentTarget.value as T)}
                        />
                    )}
                </div>
                <div className={styles.actions()}>
                    <IconButton
                        icon={Check}
                        label={saveLabel ?? t.save}
                        type="submit"
                        variant="soft"
                        size="sm"
                        aria-busy={busy || undefined}
                    />
                    <IconButton icon={X} label={cancelLabel ?? t.cancel} variant="text" size="sm" onClick={cancel} />
                </div>
            </div>
            {error && (
                <p id={errorId} className={styles.error()} role="alert">
                    {error}
                </p>
            )}
        </form>
    );
    return (
        <div {...props} className={styles.base({ class: className })}>
            {mode === 'popover' ? (
                <Popover
                    open={isEditing}
                    placement="bottom-start"
                    onOpenChange={(open) => {
                        if (open) setEditing(true);
                        else if (isEditing) cancel();
                    }}
                >
                    <PopoverTrigger>{button}</PopoverTrigger>
                    <PopoverContent title={t.title(label)}>{editor}</PopoverContent>
                </Popover>
            ) : isEditing ? (
                editor
            ) : (
                button
            )}
        </div>
    );
}
