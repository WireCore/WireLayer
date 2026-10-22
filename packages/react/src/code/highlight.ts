// Shiki, loaded on first use in the browser: tokens with colours from WireLayer's CSS variables. Only shiki/core and
// the grammars of `codeLanguages` (permissive licences, see @wirecore/wirelayer-recipes code.ts) are loaded – other languages
// come from the `languages` prop.

import { resolveCodeLanguage, type CodeLanguage } from '@wirecore/wirelayer-recipes';
import type { HighlighterCore, LanguageRegistration } from 'shiki/core';

export interface CodeToken {
    content: string;
    color?: string;
    /** Shiki's font style bits: 1 italic, 2 bold, 4 underline */
    fontStyle?: number;
}

/** An extra grammar: a Shiki language registration (e.g. `import cpp from 'shiki/langs/cpp.mjs'`) or a loader */
export type CodeLanguageInput =
    | LanguageRegistration
    | LanguageRegistration[]
    | (() => Promise<{ default: LanguageRegistration[] } | LanguageRegistration[]>);

type Grammar = Promise<{ default: LanguageRegistration[] }>;
const grammars: Record<CodeLanguage, () => Grammar> = {
    typescript: () => import('shiki/langs/typescript.mjs'),
    javascript: () => import('shiki/langs/javascript.mjs'),
    tsx: () => import('shiki/langs/tsx.mjs'),
    jsx: () => import('shiki/langs/jsx.mjs'),
    vue: () => import('shiki/langs/vue.mjs'),
    json: () => import('shiki/langs/json.mjs'),
    jsonc: () => import('shiki/langs/jsonc.mjs'),
    css: () => import('shiki/langs/css.mjs'),
    scss: () => import('shiki/langs/scss.mjs'),
    html: () => import('shiki/langs/html.mjs'),
    shellscript: () => import('shiki/langs/shellscript.mjs'),
    yaml: () => import('shiki/langs/yaml.mjs'),
    sql: () => import('shiki/langs/sql.mjs'),
    php: () => import('shiki/langs/php.mjs'),
    python: () => import('shiki/langs/python.mjs'),
    java: () => import('shiki/langs/java.mjs'),
    kotlin: () => import('shiki/langs/kotlin.mjs'),
    go: () => import('shiki/langs/go.mjs'),
    rust: () => import('shiki/langs/rust.mjs'),
    c: () => import('shiki/langs/c.mjs'),
    csharp: () => import('shiki/langs/csharp.mjs'),
    markdown: () => import('shiki/langs/markdown.mjs'),
    diff: () => import('shiki/langs/diff.mjs'),
    docker: () => import('shiki/langs/docker.mjs'),
    xml: () => import('shiki/langs/xml.mjs'),
    graphql: () => import('shiki/langs/graphql.mjs'),
    ini: () => import('shiki/langs/ini.mjs'),
    toml: () => import('shiki/langs/toml.mjs'),
};

let highlighter: Promise<HighlighterCore> | undefined;
const THEME = 'wirecore';
const extras = new WeakSet<object>();

function load() {
    highlighter ??= (async () => {
        const [{ createHighlighterCore, createCssVariablesTheme }, { createJavaScriptRegexEngine }] = await Promise.all(
            [import('shiki/core'), import('shiki/engine/javascript')]
        );
        return createHighlighterCore({
            themes: [createCssVariablesTheme({ name: THEME, variablePrefix: '--wc-code-' })],
            langs: [],
            // No WebAssembly: works in every bundler
            engine: createJavaScriptRegexEngine(),
        });
    })();
    return highlighter;
}

async function loadExtras(instance: HighlighterCore, languages: readonly CodeLanguageInput[]) {
    for (const language of languages) {
        if (extras.has(language)) continue;
        extras.add(language);
        const loaded = typeof language === 'function' ? await language() : language;
        const registrations = Array.isArray(loaded) ? loaded : 'default' in loaded ? loaded.default : [loaded];
        await instance.loadLanguage(...(registrations as LanguageRegistration[]));
    }
}

/** Lines of tokens; unknown languages come back as plain text */
export async function tokenize(
    code: string,
    language: string,
    languages: readonly CodeLanguageInput[] = []
): Promise<CodeToken[][]> {
    // Plain text needs no Shiki
    if (language === 'text') return plainLines(code);
    const instance = await load();
    if (languages.length) await loadExtras(instance, languages);
    const builtIn = resolveCodeLanguage(language);
    if (builtIn && !instance.getLoadedLanguages().includes(builtIn))
        await instance.loadLanguage(...(await grammars[builtIn]()).default);
    const lang = builtIn ?? (instance.getLoadedLanguages().includes(language) ? language : undefined);
    if (!lang) return plainLines(code);
    return instance.codeToTokensBase(code, { lang, theme: THEME });
}

/** Before Shiki is loaded (and on the server): every line as one plain token */
export const plainLines = (code: string): CodeToken[][] => code.split('\n').map((content) => [{ content }]);

/** Inline style of a token */
export const tokenStyle = (token: CodeToken) => ({
    color: token.color,
    fontStyle: token.fontStyle && token.fontStyle & 1 ? 'italic' : undefined,
    fontWeight: token.fontStyle && token.fontStyle & 2 ? '600' : undefined,
});
