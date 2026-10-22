// Code blocks (CodeHighlight, CodeHighlightTabs, InlineCode): the languages that are loaded, file names, diffs.

/**
 * Languages CodeHighlight loads by itself. Each grammar (and the grammars it embeds) comes from
 * shikijs/textmate-grammars-themes and is MIT licensed, YAML and TOML are under the permissive TextMate bundle
 * licence. Not included: C++ (it embeds GLSL, a grammar without a licence) and the rest of Shiki's bundle – those
 * can be passed with the `languages` prop (the licence is then the user's responsibility).
 */
export const codeLanguages = [
    'typescript',
    'javascript',
    'tsx',
    'jsx',
    'vue',
    'json',
    'jsonc',
    'css',
    'scss',
    'html',
    'shellscript',
    'yaml',
    'sql',
    'php',
    'python',
    'java',
    'kotlin',
    'go',
    'rust',
    'c',
    'csharp',
    'markdown',
    'diff',
    'docker',
    'xml',
    'graphql',
    'ini',
    'toml',
] as const;

export type CodeLanguage = (typeof codeLanguages)[number];

/** Short names and aliases → language */
const aliases: Record<string, CodeLanguage> = {
    ts: 'typescript',
    mts: 'typescript',
    cts: 'typescript',
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    sh: 'shellscript',
    bash: 'shellscript',
    shell: 'shellscript',
    zsh: 'shellscript',
    yml: 'yaml',
    py: 'python',
    kt: 'kotlin',
    kts: 'kotlin',
    rs: 'rust',
    cs: 'csharp',
    'c#': 'csharp',
    md: 'markdown',
    dockerfile: 'docker',
    gql: 'graphql',
    htm: 'html',
    svg: 'xml',
    patch: 'diff',
    h: 'c',
    properties: 'ini',
    env: 'ini',
};

/** The built-in language for a name or alias ("ts" → "typescript"), undefined if it is not built in */
export function resolveCodeLanguage(language: string): CodeLanguage | undefined {
    const name = language.toLowerCase();
    if ((codeLanguages as readonly string[]).includes(name)) return name as CodeLanguage;
    return aliases[name];
}

/** Language from a file name: "server.ts" → "ts", "Dockerfile" → "dockerfile", unknown → "text" */
export function languageFromFileName(fileName: string): string {
    const base = fileName.split(/[\\/]/).pop()!.toLowerCase();
    if (base === 'dockerfile' || base.startsWith('dockerfile.')) return 'dockerfile';
    if (base.startsWith('.env')) return 'env';
    const extension = base.includes('.') ? base.split('.').pop()! : '';
    return extension && (resolveCodeLanguage(extension) || ['tsx', 'jsx', 'vue', 'json'].includes(extension))
        ? extension
        : 'text';
}

/** Kind of file for its icon */
export type CodeFileKind = 'code' | 'json' | 'markup' | 'style' | 'terminal' | 'data' | 'text' | 'image';

/** Icon kind of a file name (by its extension) */
export function codeFileKind(fileName: string): CodeFileKind {
    const language = resolveCodeLanguage(languageFromFileName(fileName));
    const extension = fileName.toLowerCase().split('.').pop() ?? '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico'].includes(extension)) return 'image';
    switch (language) {
        case 'json':
        case 'jsonc':
            return 'json';
        case 'html':
        case 'xml':
        case 'vue':
        case 'markdown':
            return 'markup';
        case 'css':
        case 'scss':
            return 'style';
        case 'shellscript':
        case 'docker':
            return 'terminal';
        case 'yaml':
        case 'toml':
        case 'ini':
        case 'sql':
            return 'data';
        case undefined:
            return 'text';
        default:
            return 'code';
    }
}

/** A line of a diff: added ("+"), removed ("-") or unchanged; file headers ("+++", "---") count as unchanged */
export function diffLineKind(line: string): 'add' | 'remove' | undefined {
    if (line.startsWith('+++') || line.startsWith('---')) return undefined;
    if (line.startsWith('+')) return 'add';
    if (line.startsWith('-')) return 'remove';
    return undefined;
}

/** Kind of each line (1-based numbers in `added`/`removed`, or read from "+"/"-" with `fromMarkers`) */
export function diffLines(
    lines: readonly string[],
    options: { added?: readonly number[]; removed?: readonly number[]; fromMarkers?: boolean }
): ('add' | 'remove' | undefined)[] {
    const added = new Set(options.added ?? []);
    const removed = new Set(options.removed ?? []);
    return lines.map((line, index) =>
        added.has(index + 1)
            ? 'add'
            : removed.has(index + 1)
              ? 'remove'
              : options.fromMarkers
                ? diffLineKind(line)
                : undefined
    );
}
