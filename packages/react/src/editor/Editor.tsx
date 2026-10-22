import { useFieldContext } from '@ark-ui/react/field';
import type { AnyExtension } from '@tiptap/core';
import { Details, DetailsContent, DetailsSummary } from '@tiptap/extension-details';
import Image from '@tiptap/extension-image';
import { InvisibleCharacters } from '@tiptap/extension-invisible-characters';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Mention } from '@tiptap/extension-mention';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { BackgroundColor, Color, TextStyle } from '@tiptap/extension-text-style';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor, useEditorState, type Editor as TiptapEditor } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import {
    announce,
    countText,
    editor as editorRecipe,
    editorColorToken,
    editorColorTokens,
    editorColorValue,
    type EditorColorToken,
    type RecipeClasses,
    input as inputRecipe,
    prose as proseRecipe,
    sanitizeEditorHtml,
    toolbarIndexForKey,
} from '@wirecore/wirelayer-recipes';
import {
    Baseline,
    Bold,
    Code,
    CodeXml,
    Heading2,
    Heading3,
    Highlighter,
    Image as ImageIcon,
    Italic,
    Link,
    List,
    ListChecks,
    ListCollapse,
    ListOrdered,
    Minus,
    Pilcrow,
    Redo2,
    SquareCode,
    Strikethrough,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Table,
    TextAlignCenter,
    TextAlignEnd,
    TextAlignJustify,
    TextAlignStart,
    TextQuote,
    Underline,
    Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Button } from '../components/Button/Button.js';
import { Checkbox } from '../components/Checkbox/Checkbox.js';
import {
    closedMentions,
    editorHeadings,
    goToHeading,
    imageDropProps,
    mentionSuggestion,
    UploadPreview,
    type EditorMention,
    type MentionState,
} from './features.js';
import {
    defaultBubbleTools,
    defaultFloatingTools,
    defaultTools,
    insertImage,
    selectedImage,
    updateImage,
    isBarTool,
    setLink,
    tableActions,
    tools,
    type BarTool,
    type EditorTool,
    type TableAction,
} from './tools.js';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';

const icons = {
    bold: Bold,
    italic: Italic,
    underline: Underline,
    strike: Strikethrough,
    heading2: Heading2,
    heading3: Heading3,
    bulletList: List,
    orderedList: ListOrdered,
    taskList: ListChecks,
    blockquote: TextQuote,
    code: Code,
    codeBlock: SquareCode,
    horizontalRule: Minus,
    link: Link,
    image: ImageIcon,
    table: Table,
    undo: Undo2,
    redo: Redo2,
    alignLeft: TextAlignStart,
    alignCenter: TextAlignCenter,
    alignRight: TextAlignEnd,
    alignJustify: TextAlignJustify,
    textColor: Baseline,
    backgroundColor: Highlighter,
    subscript: SubscriptIcon,
    superscript: SuperscriptIcon,
    details: ListCollapse,
    invisibleCharacters: Pilcrow,
    source: CodeXml,
};

export interface EditorProps {
    /** HTML; an empty editor gives '' */
    value?: string;
    defaultValue?: string;
    onValueChange?: (html: string) => void;
    /** Toolbar buttons in order, '|' for a separator */
    toolbar?: (EditorTool | '|')[];
    disabled?: boolean;
    invalid?: boolean;
    /** Read only: the content can be read and selected, not changed (no toolbar) */
    readonly?: boolean;
    /**
     * Uploads an image file and gives its address – adds "Choose file" to the image bar and uploads pasted or dropped
     * images (with a preview meanwhile)
     */
    uploadImage?: (file: File) => Promise<string>;
    /** Text of the empty editor */
    placeholder?: string;
    /** The toolbar stays at the top while the page scrolls (offset: CSS variable --wc-editor-top) */
    stickyToolbar?: boolean;
    /** Characters and words below the editor */
    counter?: boolean;
    /** Maximum number of characters (shown in the counter) */
    maxLength?: number;
    /** Menu at selected text – true for the default tools or a list of tools; Alt+F10 moves into it */
    bubbleMenu?: boolean | EditorTool[];
    /** Menu in an empty line – true for the default tools or a list of tools; Alt+F10 moves into it */
    floatingMenu?: boolean | EditorTool[];
    /** The headings as links above the text */
    tableOfContents?: boolean;
    /** Suggestions after "@" (people, documents …) – inserted as a mention */
    mentions?: (query: string) => EditorMention[] | Promise<EditorMention[]>;
    /** Accessible name without a Field */
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof editorRecipe>;
}

/**
 * Rich-text editor (Tiptap): a toolbar (role="toolbar", one tab stop, arrow keys inside; toggle buttons with
 * aria-pressed) above a multi-line textbox. Shortcuts as usual (Strg+B …). Gives HTML.
 */
export function Editor({
    classes,
    value,
    defaultValue = '',
    onValueChange,
    toolbar = defaultTools,
    disabled,
    invalid,
    readonly,
    uploadImage,
    placeholder,
    stickyToolbar,
    counter,
    maxLength,
    bubbleMenu = false,
    floatingMenu = false,
    tableOfContents,
    mentions,
    'aria-label': ariaLabel,
    className,
    style,
}: EditorProps) {
    const styles = useRecipe('editor', editorRecipe, classes)({ sticky: stickyToolbar });
    const input = useRecipe('input', inputRecipe);
    const prose = useRecipe('prose', proseRecipe);
    const linkInput = input({ size: 'sm' });
    const translations = useTranslations();
    const t = translations.editor;
    const field = useFieldContext();
    const id = useId();
    const isDisabled = !!(disabled ?? field?.disabled);
    const isInvalid = !!(invalid ?? field?.invalid);

    const bubbleTools = bubbleMenu === true ? defaultBubbleTools : bubbleMenu || [];
    const floatingTools = floatingMenu === true ? defaultFloatingTools : floatingMenu || [];
    const menus = bubbleTools.length > 0 || floatingTools.length > 0;
    const allTools = [
        ...new Set([...toolbar.filter((item): item is EditorTool => item !== '|'), ...bubbleTools, ...floatingTools]),
    ];
    const [mention, setMention] = useState<MentionState>(closedMentions);
    const contentClasses = [styles.content(), prose()];
    if (placeholder) contentClasses.push(styles.placeholder());
    if (allTools.includes('invisibleCharacters')) contentClasses.push(styles.invisible());
    const attributes: Record<string, string> = {
        id: `${id}content`,
        role: 'textbox',
        'aria-multiline': 'true',
        class: contentClasses.join(' '),
    };
    if (field) attributes['aria-labelledby'] = field.ids.label;
    else if (ariaLabel) attributes['aria-label'] = ariaLabel;
    if (field?.ariaDescribedby) attributes['aria-describedby'] = field.ariaDescribedby;
    if (isInvalid) attributes['aria-invalid'] = 'true';
    if (field?.required) attributes['aria-required'] = 'true';
    if (isDisabled) {
        attributes['aria-disabled'] = 'true';
        attributes['data-disabled'] = '';
    }
    if (readonly) {
        attributes['aria-readonly'] = 'true';
        attributes.tabindex = '0';
    }
    if (menus) attributes['aria-keyshortcuts'] = 'Alt+F10';
    if (mentions) {
        attributes['aria-autocomplete'] = 'list';
        if (mention.open) {
            attributes['aria-controls'] = `${id}mentions`;
            if (mention.items.length) attributes['aria-activedescendant'] = `${id}mention${mention.active}`;
        }
    }
    const attributesKey = JSON.stringify(attributes);

    // The latest callback for Tiptap's onUpdate, which is set once
    const onChange = useRef(onValueChange);
    // The texts of the task checkboxes follow a language switch; the latest props for Tiptap's callbacks
    const texts = useRef(t);
    const latest = useRef({ placeholder, uploadImage, mentions });
    useEffect(() => {
        onChange.current = onValueChange;
        texts.current = t;
        latest.current = { placeholder, uploadImage, mentions };
    });
    const checkboxLabel = useCallback(
        (node: { textContent: string }, checked: boolean) => texts.current.taskItem(node.textContent, checked),
        []
    );
    // Alt+F10 moves into the bubble menu (text selected) or the floating menu (empty line)
    const bubble = useRef<HTMLDivElement>(null);
    const floating = useRef<HTMLDivElement>(null);
    const focusMenu = useCallback((current: TiptapEditor) => {
        const menu = current.state.selection.empty ? floating.current : bubble.current;
        const parent = menu?.parentElement;
        if (!menu || !parent?.isConnected || parent.style.visibility === 'hidden') return false;
        menu.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
        return true;
    }, []);
    const editorRef = useRef<TiptapEditor | null>(null);
    // Created once (like Tiptap's options); Tiptap calls the callbacks while editing, never during render – they
    // read the latest props
    // eslint-disable-next-line react-hooks/refs
    const [extensions] = useState(() => {
        const list: AnyExtension[] = [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                link: { openOnClick: false, defaultProtocol: 'https' },
                // Would append an empty paragraph on load and report a change before the user typed
                trailingNode: false,
            }),
            // Checkboxes named by their text and state
            TaskList,
            TaskItem.configure({ nested: true, a11y: { checkboxLabel } }),
            TableKit.configure({ table: { resizable: false } }),
            Image,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            BackgroundColor,
            Subscript,
            Superscript,
            Details.configure({
                persist: true,
                renderToggleButton: ({ element, isOpen }) => {
                    element.setAttribute('aria-label', texts.current.detailsToggle(isOpen));
                    element.setAttribute('aria-expanded', String(isOpen));
                },
            }),
            DetailsSummary,
            DetailsContent,
            InvisibleCharacters.configure({ visible: false, injectCSS: false }),
            UploadPreview.configure({ className: styles.uploading() }),
        ];
        if (placeholder) list.push(Placeholder.configure({ placeholder: () => latest.current.placeholder ?? '' }));
        if (counter || maxLength) list.push(CharacterCount.configure({ limit: maxLength }));
        if (mentions)
            list.push(Mention.configure({ suggestion: mentionSuggestion(() => latest.current.mentions, setMention) }));
        return list;
    });
    // Paste and drop of images: uploaded with uploadImage (read when it happens)
    // eslint-disable-next-line react-hooks/refs
    const [dropProps] = useState(() =>
        imageDropProps(
            () => latest.current.uploadImage,
            ({ inserted, failed }) =>
                announce(failed ? texts.current.imageFailed : inserted ? texts.current.imageUploaded : '')
        )
    );
    const editor = useEditor({
        // Created after mounting, so server and client render the same
        immediatelyRender: false,
        content: value ?? defaultValue,
        editable: !isDisabled && !readonly,
        extensions,
        editorProps: {
            attributes,
            handleKeyDown: (_view, event) =>
                event.altKey && event.key === 'F10' && !!editorRef.current && focusMenu(editorRef.current),
            ...dropProps,
        },
        onUpdate: ({ editor }) => onChange.current?.(editor.isEmpty ? '' : editor.getHTML()),
    });
    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    useEffect(() => {
        editor?.setOptions({ editorProps: { attributes: JSON.parse(attributesKey) as Record<string, string> } });
    }, [editor, attributesKey]);
    useEffect(() => {
        editor?.setEditable(!isDisabled && !readonly);
    }, [editor, isDisabled, readonly]);
    useEffect(() => {
        if (!editor || value === undefined || value === (editor.isEmpty ? '' : editor.getHTML())) return;
        editor.commands.setContent(value, { emitUpdate: false });
    }, [editor, value]);

    // HTML source mode: a text field with the HTML; leaving it cleans the HTML and puts it back into the editor
    const [sourceMode, setSourceMode] = useState(false);
    const [source, setSource] = useState('');
    const sourceField = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (sourceMode) sourceField.current?.focus();
    }, [sourceMode]);
    const toggleSource = () => {
        if (!editor) return;
        if (!sourceMode) {
            setSource(editor.isEmpty ? '' : editor.getHTML());
            setSourceMode(true);
            return;
        }
        setSourceMode(false);
        editor.commands.setContent(sanitizeEditorHtml(source), { emitUpdate: true });
        editor.commands.focus();
    };

    const buttons = toolbar.filter((item): item is EditorTool => item !== '|');
    const read = (current: TiptapEditor | null) =>
        Object.fromEntries(
            allTools.map((tool) => [
                tool,
                {
                    active: tool === 'source' ? sourceMode : !!current && !!tools[tool].isActive?.(current),
                    disabled:
                        !current ||
                        isDisabled ||
                        !!readonly ||
                        (sourceMode && tool !== 'source') ||
                        !tools[tool].can(current),
                },
            ])
        ) as Record<EditorTool, { active: boolean; disabled: boolean }>;
    // Re-read the toolbar state after every transaction (selection or content changed); null before mounting
    const state = useEditorState({ editor, selector: ({ editor: current }) => read(current) }) ?? read(null);
    // Colours, counter and headings after every transaction
    const extra = useEditorState({
        editor,
        selector: ({ editor: current }) => {
            if (!current) return null;
            const textStyle = current.getAttributes('textStyle');
            const storage = current.storage.characterCount;
            return {
                textColor: editorColorToken(textStyle.color as string | undefined),
                backgroundColor: editorColorToken(textStyle.backgroundColor as string | undefined),
                counts: storage
                    ? { characters: storage.characters(), words: storage.words() }
                    : countText(current.state.doc.textContent),
                headings: tableOfContents ? editorHeadings(current) : [],
            };
        },
    });
    const counts = extra?.counts ?? { characters: 0, words: 0 };
    const atLimit = maxLength !== undefined && counts.characters >= maxLength;

    // Roving tabindex: the toolbar is one tab stop, arrow keys move inside it
    const [focused, setFocused] = useState<EditorTool>();
    const tabStop = focused && !state[focused]?.disabled ? focused : buttons.find((tool) => !state[tool].disabled);
    const onToolbarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const enabled = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled)')];
        const next = toolbarIndexForKey(
            event.key,
            enabled.indexOf(event.target as HTMLElement),
            enabled.length,
            event.currentTarget as HTMLElement
        );
        if (next === undefined) return;
        event.preventDefault();
        enabled[next]?.focus();
    };

    // Link, image and table open a bar below the toolbar; Escape closes it and returns to the button
    const [bar, setBar] = useState<BarTool | null>(null);
    const barButton = useRef<HTMLButtonElement | null>(null);
    const [linkUrl, setLinkUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [imageDecorative, setImageDecorative] = useState(false);
    // An image is selected: the bar edits its address and alternative text instead of inserting a new one
    const [imageEditing, setImageEditing] = useState(false);
    const imageAltField = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const linkField = useRef<HTMLInputElement>(null);
    const imageField = useRef<HTMLInputElement>(null);
    const fileInput = useRef<HTMLInputElement>(null);
    const tableBar = useRef<HTMLDivElement>(null);
    const colorBar = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (bar === 'link') linkField.current?.focus();
        else if (bar === 'image') (imageEditing ? imageAltField : imageField).current?.focus();
        else if (bar === 'table') tableBar.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
        else if (bar) colorBar.current?.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus();
    }, [bar, imageEditing]);
    const closeBar = () => {
        setBar(null);
        barButton.current?.focus();
    };
    const onBarKey = (event: KeyboardEvent) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        event.preventDefault();
        event.stopPropagation();
        closeBar();
    };
    const toggleBar = (tool: BarTool, button: HTMLButtonElement) => {
        barButton.current = button;
        if (bar === tool) return closeBar();
        setLinkUrl((editor?.getAttributes('link').href as string | undefined) ?? '');
        const image = editor ? selectedImage(editor) : null;
        setImageEditing(!!image);
        setImageUrl(image?.src ?? '');
        setImageAlt(image?.alt ?? '');
        setImageDecorative(!!image && !image.alt);
        setBar(tool);
    };
    const applyLink = (href: string) => {
        if (editor) setLink(editor, href);
        setBar(null);
    };
    const canInsertImage = !!imageUrl.trim() && (!!imageAlt.trim() || imageDecorative);
    const applyImage = () => {
        if (!editor || !canInsertImage) return;
        (imageEditing ? updateImage : insertImage)(editor, imageUrl, imageDecorative ? '' : imageAlt.trim());
        setBar(null);
    };
    const onFile = async (file: File | undefined) => {
        if (!file || !uploadImage) return;
        setUploading(true);
        try {
            setImageUrl(await uploadImage(file));
        } finally {
            setUploading(false);
        }
    };
    const readTable = (current: TiptapEditor | null) =>
        Object.fromEntries(
            (Object.keys(tableActions) as TableAction[]).map((action) => [
                action,
                !current || isDisabled || !tableActions[action].can(current),
            ])
        ) as Record<TableAction, boolean>;
    const tableState =
        useEditorState({ editor, selector: ({ editor: current }) => readTable(current) }) ?? readTable(null);
    const onToolClick = (tool: EditorTool, button: HTMLButtonElement) => {
        if (tool === 'source') return toggleSource();
        if (isBarTool(tool)) return toggleBar(tool, button);
        if (editor) tools[tool].run(editor);
    };
    // Colours from the token palette (text in the colour, background as a tint)
    const applyColor = (kind: 'textColor' | 'backgroundColor', token: EditorColorToken | undefined) => {
        if (!editor) return;
        const chain = editor.chain().focus();
        if (kind === 'textColor') (token ? chain.setColor(editorColorValue(token, 'text')) : chain.unsetColor()).run();
        else
            (token
                ? chain.setBackgroundColor(editorColorValue(token, 'background'))
                : chain.unsetBackgroundColor()
            ).run();
        setBar(null);
    };
    const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            editor?.commands.focus();
            return;
        }
        onToolbarKeyDown(event);
    };
    const menuButtons = (items: EditorTool[]) =>
        items.map((item, index) => {
            const tool = tools[item];
            const Icon = icons[item];
            return (
                <button
                    key={item}
                    type="button"
                    className={styles.tool()}
                    aria-label={t[item]}
                    title={
                        tool.shortcut
                            ? `${t[item]} (${t.shortcut(tool.shortcut.letter, tool.shortcut.shift)})`
                            : t[item]
                    }
                    aria-pressed={tool.isActive && !isBarTool(item) ? state[item].active : undefined}
                    disabled={state[item].disabled}
                    tabIndex={index === 0 ? 0 : -1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => onToolClick(item, event.currentTarget)}
                >
                    <Icon className={styles.toolIcon()} aria-hidden="true" />
                </button>
            );
        });
    const enterKey = (action: () => void) => (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        action();
    };

    return (
        <div
            className={styles.base({ class: className })}
            style={style}
            data-invalid={isInvalid || undefined}
            data-disabled={isDisabled || undefined}
        >
            {!readonly && (
                <div role="toolbar" aria-label={t.toolbar} className={styles.toolbar()} onKeyDown={onToolbarKeyDown}>
                    {toolbar.map((item, index) => {
                        if (item === '|')
                            return (
                                <span
                                    key={index}
                                    role="separator"
                                    aria-orientation="vertical"
                                    className={styles.separator()}
                                />
                            );
                        const tool = tools[item];
                        const Icon = icons[item];
                        return (
                            <button
                                key={index}
                                type="button"
                                className={styles.tool()}
                                aria-label={t[item]}
                                title={
                                    tool.shortcut
                                        ? `${t[item]} (${t.shortcut(tool.shortcut.letter, tool.shortcut.shift)})`
                                        : t[item]
                                }
                                aria-keyshortcuts={tool.shortcut?.aria}
                                aria-pressed={tool.isActive && !isBarTool(item) ? state[item].active : undefined}
                                aria-expanded={isBarTool(item) ? bar === item : undefined}
                                aria-controls={isBarTool(item) && bar === item ? `${id}${item}` : undefined}
                                disabled={state[item].disabled}
                                tabIndex={item === tabStop ? 0 : -1}
                                onFocus={() => setFocused(item)}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={(event) => onToolClick(item, event.currentTarget)}
                            >
                                <Icon className={styles.toolIcon()} aria-hidden="true" />
                            </button>
                        );
                    })}
                </div>
            )}
            {bar === 'link' && (
                <div id={`${id}link`} className={styles.linkBar()} onKeyDown={onBarKey}>
                    <div className={linkInput.base({ class: styles.linkField() })}>
                        <input
                            ref={linkField}
                            value={linkUrl}
                            type="url"
                            placeholder="https://"
                            aria-label={t.linkUrl}
                            className={linkInput.control()}
                            onChange={(event) => setLinkUrl(event.target.value)}
                            onKeyDown={enterKey(() => applyLink(linkUrl))}
                        />
                    </div>
                    <Button size="sm" onClick={() => applyLink(linkUrl)}>
                        {t.linkApply}
                    </Button>
                    {state.link?.active && (
                        <Button size="sm" variant="outline" onClick={() => applyLink('')}>
                            {t.linkRemove}
                        </Button>
                    )}
                    <Button size="sm" variant="text" onClick={closeBar}>
                        {t.linkCancel}
                    </Button>
                </div>
            )}
            {bar === 'image' && (
                <div id={`${id}image`} className={styles.linkBar()} onKeyDown={onBarKey}>
                    <div className={linkInput.base({ class: styles.linkField() })}>
                        <input
                            ref={imageField}
                            value={imageUrl}
                            type="url"
                            placeholder="https://"
                            aria-label={t.imageUrl}
                            className={linkInput.control()}
                            onChange={(event) => setImageUrl(event.target.value)}
                            onKeyDown={enterKey(applyImage)}
                        />
                    </div>
                    <div className={linkInput.base({ class: styles.imageAlt() })}>
                        <input
                            ref={imageAltField}
                            value={imageAlt}
                            type="text"
                            placeholder={t.imageAlt}
                            aria-label={t.imageAlt}
                            disabled={imageDecorative}
                            className={linkInput.control()}
                            onChange={(event) => setImageAlt(event.target.value)}
                            onKeyDown={enterKey(applyImage)}
                        />
                    </div>
                    <Checkbox
                        checked={imageDecorative}
                        onCheckedChange={(checked) => setImageDecorative(checked === true)}
                    >
                        {t.imageDecorative}
                    </Checkbox>
                    {uploadImage && (
                        <>
                            <input
                                ref={fileInput}
                                type="file"
                                accept="image/*"
                                tabIndex={-1}
                                aria-hidden="true"
                                className={styles.fileInput()}
                                onChange={(event) => void onFile(event.target.files?.[0])}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                loading={uploading}
                                onClick={() => fileInput.current?.click()}
                            >
                                {t.imageUpload}
                            </Button>
                        </>
                    )}
                    <Button size="sm" disabled={!canInsertImage} onClick={applyImage}>
                        {imageEditing ? t.imageUpdate : t.imageInsert}
                    </Button>
                    <Button size="sm" variant="text" onClick={closeBar}>
                        {t.linkCancel}
                    </Button>
                </div>
            )}
            {bar === 'table' && (
                <div
                    id={`${id}table`}
                    ref={tableBar}
                    role="group"
                    aria-label={t.tableBar}
                    className={styles.linkBar()}
                    onKeyDown={onBarKey}
                >
                    {(Object.keys(tableActions) as TableAction[]).map((action) => (
                        <Button
                            key={action}
                            size="sm"
                            variant={
                                action === 'insertTable' ? 'primary' : action === 'deleteTable' ? 'outline' : 'text'
                            }
                            disabled={tableState[action]}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => tableActions[action].run(editor!)}
                        >
                            {t.tableActions[action]}
                        </Button>
                    ))}
                </div>
            )}
            {(bar === 'textColor' || bar === 'backgroundColor') && (
                <div
                    id={`${id}${bar}`}
                    ref={colorBar}
                    role="group"
                    aria-label={t[bar]}
                    className={styles.palette()}
                    onKeyDown={onBarKey}
                >
                    <span className={styles.paletteLabel()} aria-hidden="true">
                        {t[bar]}
                    </span>
                    <button
                        type="button"
                        className={styles.swatch()}
                        aria-label={t.colorDefault}
                        title={t.colorDefault}
                        aria-pressed={!extra?.[bar]}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => applyColor(bar, undefined)}
                    >
                        A
                    </button>
                    {editorColorTokens.map((token) => (
                        <button
                            key={token}
                            type="button"
                            className={styles.swatch()}
                            style={
                                bar === 'textColor'
                                    ? { color: editorColorValue(token, 'text') }
                                    : { backgroundColor: editorColorValue(token, 'background') }
                            }
                            aria-label={t.colors[token]}
                            title={t.colors[token]}
                            aria-pressed={extra?.[bar] === token}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => applyColor(bar, token)}
                        >
                            A
                        </button>
                    ))}
                </div>
            )}
            {tableOfContents && !!extra?.headings.length && (
                <nav aria-label={t.tableOfContents} className={styles.toc()}>
                    <span className={styles.tocTitle()} aria-hidden="true">
                        {t.tableOfContents}
                    </span>
                    <ul className={styles.tocList()}>
                        {extra.headings.map((heading) => (
                            <li key={heading.pos}>
                                <button
                                    type="button"
                                    className={styles.tocLink()}
                                    data-level={heading.level}
                                    onClick={() => editor && goToHeading(editor, heading)}
                                >
                                    {heading.text}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
            {sourceMode && (
                <textarea
                    ref={sourceField}
                    value={source}
                    className={styles.source()}
                    aria-label={t.sourceField}
                    spellCheck={false}
                    onChange={(event) => setSource(event.target.value)}
                />
            )}
            <EditorContent editor={editor} hidden={sourceMode || undefined} />
            {editor && bubbleTools.length > 0 && (
                <BubbleMenu editor={editor}>
                    <div
                        ref={bubble}
                        role="toolbar"
                        aria-label={t.bubbleMenu}
                        className={styles.menu()}
                        onKeyDown={onMenuKeyDown}
                    >
                        {menuButtons(bubbleTools)}
                    </div>
                </BubbleMenu>
            )}
            {editor && floatingTools.length > 0 && (
                <FloatingMenu editor={editor}>
                    <div
                        ref={floating}
                        role="toolbar"
                        aria-label={t.floatingMenu}
                        className={styles.menu()}
                        onKeyDown={onMenuKeyDown}
                    >
                        {menuButtons(floatingTools)}
                    </div>
                </FloatingMenu>
            )}
            {mentions && (
                <>
                    {mention.open && (
                        <ul
                            id={`${id}mentions`}
                            role="listbox"
                            aria-label={t.suggestions}
                            className={styles.suggestions()}
                            style={
                                mention.rect
                                    ? { left: `${mention.rect.left}px`, top: `${mention.rect.top}px` }
                                    : undefined
                            }
                        >
                            {mention.items.map((item, index) => (
                                <li
                                    key={item.id}
                                    id={`${id}mention${index}`}
                                    role="option"
                                    aria-selected={index === mention.active}
                                    data-highlighted={index === mention.active || undefined}
                                    className={styles.suggestion()}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => mention.choose?.(item)}
                                >
                                    {item.label}
                                </li>
                            ))}
                            {!mention.items.length && (
                                <li role="option" aria-disabled="true" className={styles.suggestion()}>
                                    {t.noSuggestions}
                                </li>
                            )}
                        </ul>
                    )}
                    <span role="status" className={styles.status()}>
                        {mention.open ? t.suggestionCount(mention.items.length) : ''}
                    </span>
                </>
            )}
            {(counter || maxLength !== undefined) && (
                <div className={styles.footer()}>
                    <span className={styles.limit()} data-over={atLimit}>
                        {t.characters(counts.characters, maxLength)}
                    </span>
                    <span>{t.words(counts.words)}</span>
                    {maxLength !== undefined && (
                        <span role="status" className={styles.status()}>
                            {atLimit ? t.limitReached : ''}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
