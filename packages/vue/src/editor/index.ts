// Rich-text editor on Tiptap (MIT extensions only) – requires @tiptap/core, @tiptap/pm, @tiptap/starter-kit,
// @tiptap/vue-3, @tiptap/extensions, @tiptap/extension-image, -list, -table, -text-align, -text-style, -subscript,
// -superscript, -details, -invisible-characters, -mention and @tiptap/suggestion (optional peer dependencies)
export { default as Editor, type EditorProps } from './Editor.vue';
export { defaultBubbleTools, defaultFloatingTools, defaultTools, type EditorTool } from './tools.js';
export type { EditorHeading, EditorMention } from './features.js';
