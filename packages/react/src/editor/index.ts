// Rich-text editor on Tiptap (MIT extensions only) – requires @tiptap/core, @tiptap/pm, @tiptap/starter-kit,
// @tiptap/react, @tiptap/extensions, @tiptap/extension-image, -list, -table, -text-align, -text-style, -subscript,
// -superscript, -details, -invisible-characters, -mention and @tiptap/suggestion (optional peer dependencies)
export { Editor, type EditorProps } from './Editor.js';
export { defaultBubbleTools, defaultFloatingTools, defaultTools, type EditorTool } from './tools.js';
export type { EditorHeading, EditorMention } from './features.js';
