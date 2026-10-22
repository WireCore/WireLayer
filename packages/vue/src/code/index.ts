// Code with syntax colours – requires shiki (optional peer dependency), loaded in the browser on first use: only
// shiki/core and the permissively licensed grammars of `codeLanguages`, more via the `languages` prop
export { default as CodeHighlight, type CodeHighlightProps } from './CodeHighlight.vue';
export { default as CodeHighlightTabs, type CodeFile, type CodeHighlightTabsProps } from './CodeHighlightTabs.vue';
export { default as InlineCode, type InlineCodeProps } from './InlineCode.vue';
export type { CodeLanguageInput } from './highlight.js';
export { codeLanguages, type CodeLanguage } from '@wirecore/wirelayer-recipes';
