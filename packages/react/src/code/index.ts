// Code with syntax colours – requires shiki (optional peer dependency), loaded in the browser on first use: only
// shiki/core and the permissively licensed grammars of `codeLanguages`, more via the `languages` prop
export { CodeHighlight, type CodeHighlightProps } from './CodeHighlight.js';
export { CodeHighlightTabs, type CodeFile, type CodeHighlightTabsProps } from './CodeHighlightTabs.js';
export { InlineCode, type InlineCodeProps } from './InlineCode.js';
export type { CodeLanguageInput } from './highlight.js';
export { codeLanguages, type CodeLanguage } from '@wirecore/wirelayer-recipes';
