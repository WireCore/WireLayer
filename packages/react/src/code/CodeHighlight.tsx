import {
    codeDiffLine,
    codeFileKind,
    codeHighlight as codeHighlightRecipe,
    diffLines,
    languageFromFileName,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { WrapText } from 'lucide-react';
import { useEffect, useId, useState, type ComponentProps } from 'react';
import { Button } from '../components/Button/Button.js';
import { CopyButton } from '../components/CopyButton/CopyButton.js';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import { fileIcons } from './file-icons.js';
import { plainLines, tokenize, tokenStyle, type CodeLanguageInput, type CodeToken } from './highlight.js';

export interface CodeHighlightProps extends Omit<ComponentProps<'figure'>, 'children' | 'title'> {
    code: string;
    /** Language id or alias, e.g. "ts", "vue", "json", "bash" (default: from `fileName`, else plain text) */
    language?: string;
    /** File name or title above the code */
    title?: string;
    /** File name in the header with an icon by its type; also sets the language when `language` is not given */
    fileName?: string;
    lineNumbers?: boolean;
    /** Lines to mark (1-based) */
    highlightLines?: number[];
    /** Copy button in the header */
    copyable?: boolean;
    /** The header with title, language and buttons (default true) */
    header?: boolean;
    /** Height limit (CSS length); longer code scrolls – or, with `expandable`, opens with "Show all code" */
    maxHeight?: string;
    /** With `maxHeight`: the code is cut off there and a button shows all of it */
    expandable?: boolean;
    /** Long lines wrap instead of scrolling (controlled) */
    wrap?: boolean;
    onWrapChange?: (wrap: boolean) => void;
    /** A button in the header switches line wrapping */
    wrapToggle?: boolean;
    /** Marks lines starting with "+" as added and "-" as removed (e.g. a patch) */
    diff?: boolean;
    /** Added lines (1-based) – shown with "+" in front */
    addedLines?: number[];
    /** Removed lines (1-based) – shown with "−" in front */
    removedLines?: number[];
    /**
     * More grammars than the built-in ones (Shiki registrations or loaders, e.g. `() => import('shiki/langs/ruby.mjs')`)
     * – their licence is the responsibility of the app
     */
    languages?: CodeLanguageInput[];
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof codeHighlightRecipe>;
}

const noLanguages: CodeLanguageInput[] = [];

/** Code block with syntax colours; the scroll area is focusable, the copy button copies the plain code */
export function CodeHighlight({
    code,
    language,
    title,
    fileName,
    lineNumbers = false,
    highlightLines,
    copyable = true,
    header = true,
    maxHeight,
    expandable,
    wrap,
    onWrapChange,
    wrapToggle,
    diff,
    addedLines,
    removedLines,
    languages = noLanguages,
    classes,
    className,
    ...props
}: CodeHighlightProps) {
    const codeHighlight = useRecipe('codeHighlight', codeHighlightRecipe, classes);
    const t = useTranslations().codeHighlight;
    const id = useId();
    const lang = language ?? (fileName ? languageFromFileName(fileName) : 'text');
    const [internalWrap, setInternalWrap] = useState(false);
    const wrapped = wrap ?? internalWrap;
    const [expanded, setExpanded] = useState(false);
    const collapsed = !!expandable && !!maxHeight && !expanded;
    const styles = codeHighlight({ wrap: wrapped, collapsed });
    const caption = title ?? fileName;
    const FileIcon = fileName ? fileIcons[codeFileKind(fileName)] : undefined;
    // Plain on the server and in the first render; coloured as soon as Shiki has the tokens
    const [tokens, setTokens] = useState<{ key: string; lines: CodeToken[][] } | null>(null);
    const key = `${lang}\u0000${code}`;
    useEffect(() => {
        let cancelled = false;
        void tokenize(code, lang, languages).then((lines) => {
            if (!cancelled) setTokens({ key: `${lang}\u0000${code}`, lines });
        });
        return () => {
            cancelled = true;
        };
    }, [code, lang, languages]);
    const lines = tokens?.key === key ? tokens.lines : plainLines(code);
    const marked = new Set(highlightLines ?? []);
    const kinds =
        diff || addedLines?.length || removedLines?.length
            ? diffLines(code.split('\n'), { added: addedLines, removed: removedLines, fromMarkers: diff })
            : [];
    const markers = !!(addedLines?.length || removedLines?.length);
    const showHeader = header && (!!caption || lang !== 'text' || copyable || wrapToggle);
    return (
        <figure {...props} className={styles.base({ class: className })}>
            {showHeader && (
                <figcaption className={styles.header()}>
                    {FileIcon && <FileIcon className={styles.fileIcon()} aria-hidden="true" />}
                    {caption && <span className={styles.title()}>{caption}</span>}
                    {lang !== 'text' && <span className={styles.language()}>{lang}</span>}
                    {wrapToggle && (
                        <button
                            type="button"
                            className={styles.tool()}
                            aria-pressed={wrapped}
                            aria-label={t.wrap}
                            title={t.wrap}
                            onClick={() => {
                                setInternalWrap(!wrapped);
                                onWrapChange?.(!wrapped);
                            }}
                        >
                            <WrapText className={styles.toolIcon()} aria-hidden="true" />
                        </button>
                    )}
                    {copyable && <CopyButton value={code} label={caption ? `${t.copy}: ${caption}` : t.copy} />}
                </figcaption>
            )}
            <pre
                id={expandable ? `${id}code` : undefined}
                className={styles.pre()}
                style={maxHeight && !expanded ? { maxHeight } : undefined}
                tabIndex={0}
            >
                <code className={styles.code()}>
                    {lines.map((line, index) => {
                        const kind = kinds[index];
                        return (
                            <span
                                key={index}
                                className={kind ? styles.line({ class: codeDiffLine({ diff: kind }) }) : styles.line()}
                                data-highlighted={marked.has(index + 1) || undefined}
                                data-diff={kind}
                            >
                                {lineNumbers && (
                                    <span className={styles.lineNumber()} aria-hidden="true">
                                        {index + 1}
                                    </span>
                                )}
                                {markers && (
                                    <span className={styles.diffMarker()} aria-hidden="true">
                                        {kind === 'add' ? '+' : kind === 'remove' ? '−' : ''}
                                    </span>
                                )}
                                {kind && (
                                    <span
                                        className={styles.srOnly()}
                                    >{`${kind === 'add' ? t.added : t.removed}: `}</span>
                                )}
                                <span className={styles.lineContent()}>
                                    {line.map((token, position) => (
                                        <span key={position} style={tokenStyle(token)}>
                                            {token.content}
                                        </span>
                                    ))}
                                </span>
                            </span>
                        );
                    })}
                </code>
            </pre>
            {expandable && maxHeight && (
                <div className={styles.expand()}>
                    <Button
                        size="sm"
                        variant="text"
                        aria-expanded={expanded}
                        aria-controls={`${id}code`}
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? t.showLess : t.showMore}
                    </Button>
                </div>
            )}
        </figure>
    );
}
