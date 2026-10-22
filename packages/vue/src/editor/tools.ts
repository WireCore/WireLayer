import type { Editor } from '@tiptap/core';
// Commands and storage of the optional extensions (type augmentation only)
import type {} from '@tiptap/extension-details';
import type {} from '@tiptap/extension-invisible-characters';
import type {} from '@tiptap/extension-subscript';
import type {} from '@tiptap/extension-superscript';
import type {} from '@tiptap/extension-text-align';
import type {} from '@tiptap/extension-text-style';

// Toolbar buttons of the editor – the same in @wirecore/wirelayer-vue and @wirecore/wirelayer-react

export type EditorTool =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'heading2'
    | 'heading3'
    | 'bulletList'
    | 'orderedList'
    | 'taskList'
    | 'blockquote'
    | 'code'
    | 'codeBlock'
    | 'horizontalRule'
    | 'link'
    | 'image'
    | 'table'
    | 'undo'
    | 'redo'
    | 'alignLeft'
    | 'alignCenter'
    | 'alignRight'
    | 'alignJustify'
    | 'textColor'
    | 'backgroundColor'
    | 'subscript'
    | 'superscript'
    | 'details'
    | 'invisibleCharacters'
    | 'source';

/** Tools in order; '|' draws a separator */
export const defaultTools: (EditorTool | '|')[] = [
    'bold',
    'italic',
    'underline',
    'strike',
    '|',
    'heading2',
    'heading3',
    '|',
    'bulletList',
    'orderedList',
    'taskList',
    'blockquote',
    'codeBlock',
    '|',
    'link',
    'image',
    'table',
    '|',
    'undo',
    'redo',
];

// Names and shortcut texts come from translations.editor (key = tool)
interface ToolDefinition {
    /** For aria-keyshortcuts and the tooltip ("Ctrl+B") */
    shortcut?: { aria: string; letter: string; shift: boolean };
    /** Toggle buttons report their state with aria-pressed */
    isActive?: (editor: Editor) => boolean;
    can: (editor: Editor) => boolean;
    /** Not for 'link', 'image' and 'table' – they open a bar below the toolbar */
    run: (editor: Editor) => void;
}

const key = (letter: string, shift = false) => ({ aria: `Control+${shift ? 'Shift+' : ''}${letter}`, letter, shift });

export const tools: Record<EditorTool, ToolDefinition> = {
    bold: {
        shortcut: key('B'),
        isActive: (editor) => editor.isActive('bold'),
        can: (editor) => editor.can().toggleBold(),
        run: (editor) => editor.chain().focus().toggleBold().run(),
    },
    italic: {
        shortcut: key('I'),
        isActive: (editor) => editor.isActive('italic'),
        can: (editor) => editor.can().toggleItalic(),
        run: (editor) => editor.chain().focus().toggleItalic().run(),
    },
    underline: {
        shortcut: key('U'),
        isActive: (editor) => editor.isActive('underline'),
        can: (editor) => editor.can().toggleUnderline(),
        run: (editor) => editor.chain().focus().toggleUnderline().run(),
    },
    strike: {
        shortcut: key('S', true),
        isActive: (editor) => editor.isActive('strike'),
        can: (editor) => editor.can().toggleStrike(),
        run: (editor) => editor.chain().focus().toggleStrike().run(),
    },
    heading2: {
        isActive: (editor) => editor.isActive('heading', { level: 2 }),
        can: (editor) => editor.can().toggleHeading({ level: 2 }),
        run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    heading3: {
        isActive: (editor) => editor.isActive('heading', { level: 3 }),
        can: (editor) => editor.can().toggleHeading({ level: 3 }),
        run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    bulletList: {
        shortcut: key('8', true),
        isActive: (editor) => editor.isActive('bulletList'),
        can: (editor) => editor.can().toggleBulletList(),
        run: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    orderedList: {
        shortcut: key('7', true),
        isActive: (editor) => editor.isActive('orderedList'),
        can: (editor) => editor.can().toggleOrderedList(),
        run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    taskList: {
        shortcut: key('9', true),
        isActive: (editor) => editor.isActive('taskList'),
        can: (editor) => editor.can().toggleTaskList(),
        run: (editor) => editor.chain().focus().toggleTaskList().run(),
    },
    blockquote: {
        shortcut: key('B', true),
        isActive: (editor) => editor.isActive('blockquote'),
        can: (editor) => editor.can().toggleBlockquote(),
        run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    },
    code: {
        shortcut: key('E'),
        isActive: (editor) => editor.isActive('code'),
        can: (editor) => editor.can().toggleCode(),
        run: (editor) => editor.chain().focus().toggleCode().run(),
    },
    codeBlock: {
        isActive: (editor) => editor.isActive('codeBlock'),
        can: (editor) => editor.can().toggleCodeBlock(),
        run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    },
    horizontalRule: {
        can: (editor) => editor.can().setHorizontalRule(),
        run: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
    link: {
        isActive: (editor) => editor.isActive('link'),
        can: (editor) => editor.isEditable,
        run: () => {},
    },
    image: {
        isActive: (editor) => editor.isActive('image'),
        can: (editor) => editor.isEditable,
        run: () => {},
    },
    table: {
        isActive: (editor) => editor.isActive('table'),
        can: (editor) => editor.isEditable,
        run: () => {},
    },
    undo: {
        shortcut: key('Z'),
        can: (editor) => editor.can().undo(),
        run: (editor) => editor.chain().focus().undo().run(),
    },
    redo: {
        shortcut: key('Y'),
        can: (editor) => editor.can().redo(),
        run: (editor) => editor.chain().focus().redo().run(),
    },
    alignLeft: align('left', 'L'),
    alignCenter: align('center', 'E'),
    alignRight: align('right', 'R'),
    alignJustify: align('justify', 'J'),
    textColor: {
        isActive: (editor) => !!editor.getAttributes('textStyle').color,
        can: (editor) => editor.isEditable,
        run: () => {},
    },
    backgroundColor: {
        isActive: (editor) => !!editor.getAttributes('textStyle').backgroundColor,
        can: (editor) => editor.isEditable,
        run: () => {},
    },
    subscript: {
        shortcut: { aria: 'Control+,', letter: ',', shift: false },
        isActive: (editor) => editor.isActive('subscript'),
        can: (editor) => editor.can().toggleSubscript(),
        run: (editor) => editor.chain().focus().toggleSubscript().run(),
    },
    superscript: {
        shortcut: { aria: 'Control+.', letter: '.', shift: false },
        isActive: (editor) => editor.isActive('superscript'),
        can: (editor) => editor.can().toggleSuperscript(),
        run: (editor) => editor.chain().focus().toggleSuperscript().run(),
    },
    details: {
        isActive: (editor) => editor.isActive('details'),
        can: (editor) => editor.can().setDetails() || editor.can().unsetDetails(),
        run: (editor) =>
            editor.isActive('details')
                ? editor.chain().focus().unsetDetails().run()
                : editor.chain().focus().setDetails().run(),
    },
    invisibleCharacters: {
        isActive: (editor) => !!editor.storage.invisibleCharacters?.visibility(),
        can: (editor) => !!editor.storage.invisibleCharacters,
        run: (editor) => editor.chain().focus().toggleInvisibleCharacters().run(),
    },
    // The component switches between the editor and the HTML source
    source: {
        isActive: () => false,
        can: () => true,
        run: () => {},
    },
};

function align(value: 'left' | 'center' | 'right' | 'justify', letter: string): ToolDefinition {
    return {
        shortcut: key(letter, true),
        isActive: (editor) => editor.isActive({ textAlign: value }),
        can: (editor) => editor.can().setTextAlign(value),
        run: (editor) => editor.chain().focus().setTextAlign(value).run(),
    };
}

/** Applies or removes the link at the selection; an empty address removes it */
export function setLink(editor: Editor, href: string) {
    const chain = editor.chain().focus().extendMarkRange('link');
    if (href.trim()) chain.setLink({ href: href.trim() }).run();
    else chain.unsetLink().run();
}

/** Tools that open a bar below the toolbar instead of acting at once */
export const barTools = ['link', 'image', 'table', 'textColor', 'backgroundColor'] as const;
export type BarTool = (typeof barTools)[number];
export const isBarTool = (tool: EditorTool): tool is BarTool => (barTools as readonly string[]).includes(tool);

export type TableAction =
    | 'insertTable'
    | 'addRowBefore'
    | 'addRowAfter'
    | 'addColumnBefore'
    | 'addColumnAfter'
    | 'deleteRow'
    | 'deleteColumn'
    | 'toggleHeaderRow'
    | 'mergeOrSplit'
    | 'deleteTable';

/** Actions in the table bar; names come from translations.editor.tableActions */
export const tableActions: Record<TableAction, { can: (editor: Editor) => boolean; run: (editor: Editor) => void }> = {
    insertTable: {
        can: (editor) =>
            !editor.isActive('table') && editor.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
        run: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    addRowBefore: {
        can: (editor) => editor.can().addRowBefore(),
        run: (editor) => editor.chain().focus().addRowBefore().run(),
    },
    addRowAfter: {
        can: (editor) => editor.can().addRowAfter(),
        run: (editor) => editor.chain().focus().addRowAfter().run(),
    },
    addColumnBefore: {
        can: (editor) => editor.can().addColumnBefore(),
        run: (editor) => editor.chain().focus().addColumnBefore().run(),
    },
    addColumnAfter: {
        can: (editor) => editor.can().addColumnAfter(),
        run: (editor) => editor.chain().focus().addColumnAfter().run(),
    },
    deleteRow: { can: (editor) => editor.can().deleteRow(), run: (editor) => editor.chain().focus().deleteRow().run() },
    deleteColumn: {
        can: (editor) => editor.can().deleteColumn(),
        run: (editor) => editor.chain().focus().deleteColumn().run(),
    },
    toggleHeaderRow: {
        can: (editor) => editor.can().toggleHeaderRow(),
        run: (editor) => editor.chain().focus().toggleHeaderRow().run(),
    },
    mergeOrSplit: {
        can: (editor) => editor.can().mergeOrSplit(),
        run: (editor) => editor.chain().focus().mergeOrSplit().run(),
    },
    deleteTable: {
        can: (editor) => editor.can().deleteTable(),
        run: (editor) => editor.chain().focus().deleteTable().run(),
    },
};

/** Inserts an image at the selection */
export function insertImage(editor: Editor, src: string, alt: string) {
    editor.chain().focus().setImage({ src: src.trim(), alt }).run();
}

/** Address and alternative text of the selected image (null without one) – the image bar then edits it */
export function selectedImage(editor: Editor): { src: string; alt: string } | null {
    if (!editor.isActive('image')) return null;
    const attributes = editor.getAttributes('image') as { src?: string; alt?: string | null };
    return { src: attributes.src ?? '', alt: attributes.alt ?? '' };
}

/** Changes address and alternative text of the selected image */
export function updateImage(editor: Editor, src: string, alt: string) {
    editor.chain().focus().updateAttributes('image', { src: src.trim(), alt }).run();
}

/** Tools of the bubble menu (text selected) by default */
export const defaultBubbleTools: EditorTool[] = ['bold', 'italic', 'underline', 'strike', 'code', 'link'];
/** Tools of the floating menu (empty line) by default */
export const defaultFloatingTools: EditorTool[] = [
    'heading2',
    'heading3',
    'bulletList',
    'orderedList',
    'taskList',
    'blockquote',
    'codeBlock',
    'horizontalRule',
];
