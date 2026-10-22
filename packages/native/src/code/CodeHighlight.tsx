import { codeHighlight, diffLines, languageFromFileName, visuallyHidden } from '@wirecore/wirelayer-recipes/native';
import { Check, Copy, WrapText } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type ViewProps } from 'react-native';
import { IconButton } from '../components/IconButton/IconButton.js';
import { useLocale } from '../locale.js';
import { useAnnouncer } from '../utils/announce.js';
import { pressedProps } from '../utils/keyboard.js';
import { useControllable } from '../utils/useControllable.js';
import { plainLines, tokenize, type CodeLanguageInput, type CodeToken } from './highlight.js';

export interface CodeHighlightProps extends Omit<ViewProps, 'children'> {
    code: string;
    /** Language id or alias, e.g. "ts", "vue", "json", "bash" (default: from `fileName`, else plain text) */
    language?: string;
    /** Title above the code */
    title?: string;
    /** File name in the header; also sets the language when `language` is not given */
    fileName?: string;
    /** Line numbers before the lines (not read by screen readers) */
    lineNumbers?: boolean;
    /** Lines to mark (1-based) */
    highlightLines?: number[];
    /**
     * Copy button in the header (default true): calls `onCopy` – e.g. `copy` of `useClipboard()` from
     * `@wirecore/wirelayer-native/expo-clipboard`; without `onCopy` only the web copies (navigator.clipboard)
     */
    copyable?: boolean;
    /** Copies the code (the app's clipboard) – the button announces "Copied to clipboard" */
    onCopy?: (code: string) => void | Promise<void>;
    /** The header with title and buttons (default true) */
    header?: boolean;
    /** Height limit in dp; longer code scrolls – or, with `expandable`, opens with "Show all code" */
    maxHeight?: number;
    /** With `maxHeight`: the code is cut off there and a button shows all of it */
    expandable?: boolean;
    /** Long lines wrap instead of scrolling sideways (controlled) */
    wrap?: boolean;
    /** Wrapping at the start (uncontrolled) */
    defaultWrap?: boolean;
    onWrapChange?: (wrap: boolean) => void;
    /** A button in the header switches line wrapping */
    wrapToggle?: boolean;
    /** Marks lines starting with "+" as added and "-" as removed (e.g. a patch) */
    diff?: boolean;
    /** Added lines (1-based) */
    addedLines?: number[];
    /** Removed lines (1-based) */
    removedLines?: number[];
    /**
     * More grammars than the built-in ones (Shiki registrations or loaders, e.g. `() => import('shiki/langs/ruby.mjs')`)
     * – their licence is the responsibility of the app
     */
    languages?: CodeLanguageInput[];
    className?: string;
}

const focusableOnWeb = Platform.OS === 'web' ? { tabIndex: 0 as const } : {};

const webClipboard = () =>
    Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard
        ? (text: string) => navigator.clipboard.writeText(text)
        : undefined;

/**
 * Code in monospace with line numbers, marked and diff lines, wrapping and a copy button. Colours come from Shiki
 * (`shiki` is an optional peer dependency of `@wirecore/wirelayer-native/code`: shiki/core with the JavaScript RegExp engine – no
 * WebAssembly, no native module); until it has loaded, or when a grammar cannot run, the code shows uncoloured.
 */
export function CodeHighlight({
    code,
    language,
    title,
    fileName,
    lineNumbers = false,
    highlightLines = [],
    copyable = true,
    onCopy,
    header = true,
    maxHeight,
    expandable = false,
    wrap: wrapProp,
    defaultWrap = false,
    onWrapChange,
    wrapToggle = false,
    diff = false,
    addedLines,
    removedLines,
    languages,
    className,
    ...props
}: CodeHighlightProps) {
    const { translations } = useLocale();
    const t = translations.codeHighlight;
    const styles = codeHighlight();
    const { announce, region } = useAnnouncer();
    const [wrap, setWrap] = useControllable(wrapProp, defaultWrap, onWrapChange);
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const lang = language ?? (fileName ? languageFromFileName(fileName) : 'text');
    const [tokens, setTokens] = useState<{ key: string; lines: CodeToken[][] } | null>(null);
    const key = `${lang}\u0000${code}`;

    useEffect(() => {
        let current = true;
        tokenize(code, lang, languages)
            .then((lines) => current && setTokens({ key, lines }))
            .catch(() => undefined);
        return () => {
            current = false;
        };
    }, [code, lang, languages, key]);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer);
    }, [copied]);

    const lines = tokens?.key === key ? tokens.lines : plainLines(code);
    const kinds = useMemo(
        () =>
            diff || addedLines || removedLines
                ? diffLines(code.split('\n'), { added: addedLines, removed: removedLines, fromMarkers: diff })
                : [],
        [code, diff, addedLines, removedLines]
    );
    const marked = new Set(highlightLines);
    const copy = onCopy ?? webClipboard();
    const name = title ?? fileName;
    const limited = maxHeight !== undefined && !expanded;
    const tokenClass: Record<NonNullable<CodeToken['kind']>, string> = {
        keyword: styles.tokenKeyword(),
        string: styles.tokenString(),
        constant: styles.tokenConstant(),
        parameter: styles.tokenParameter(),
        comment: styles.tokenComment(),
    };
    // Shiki's font style bits: 1 italic (there is no bold monospace font)
    const tokenStyles = (token: CodeToken) =>
        [token.kind ? tokenClass[token.kind] : '', token.fontStyle && token.fontStyle & 1 ? styles.tokenItalic() : '']
            .filter(Boolean)
            .join(' ') || undefined;

    const body = (
        <View className={styles.body()}>
            {lines.map((line, index) => {
                const kind = kinds[index];
                const lineStyles = codeHighlight({
                    highlighted: marked.has(index + 1),
                    added: kind === 'add',
                    removed: kind === 'remove',
                    wrap,
                });
                return (
                    <View key={index} className={lineStyles.line()}>
                        {lineNumbers && (
                            <Text aria-hidden className={lineStyles.number()}>
                                {index + 1}
                            </Text>
                        )}
                        <Text className={lineStyles.code()}>
                            {kind === 'add' && <Text className={visuallyHidden()}>{`${t.added}: `}</Text>}
                            {kind === 'remove' && <Text className={visuallyHidden()}>{`${t.removed}: `}</Text>}
                            {line.length === 0 || (line.length === 1 && !line[0]!.content)
                                ? ' '
                                : line.map((token, part) =>
                                      token.kind || token.fontStyle ? (
                                          <Text key={part} className={tokenStyles(token)}>
                                              {token.content}
                                          </Text>
                                      ) : (
                                          token.content
                                      )
                                  )}
                        </Text>
                    </View>
                );
            })}
        </View>
    );

    return (
        <View {...props} role="group" aria-label={name ?? lang} className={styles.base({ class: className })}>
            {region}
            {header && (
                <View className={styles.header()}>
                    <Text numberOfLines={1} className={styles.title()}>
                        {name ?? lang}
                    </Text>
                    <View className={styles.actions()}>
                        {wrapToggle && (
                            <IconButton
                                icon={WrapText}
                                label={t.wrap}
                                variant={wrap ? 'soft' : 'text'}
                                size="sm"
                                {...pressedProps(wrap)}
                                onPress={() => setWrap(!wrap)}
                            />
                        )}
                        {copyable && !!copy && (
                            <IconButton
                                icon={copied ? Check : Copy}
                                label={t.copy}
                                variant="text"
                                size="sm"
                                onPress={async () => {
                                    await copy(code);
                                    setCopied(true);
                                    announce(translations.copyButton.copied);
                                }}
                            />
                        )}
                    </View>
                </View>
            )}
            <ScrollView
                style={limited ? { maxHeight } : undefined}
                scrollEnabled={!expandable || expanded}
                nestedScrollEnabled
                {...(limited && !expandable ? focusableOnWeb : {})}
            >
                {wrap ? (
                    body
                ) : (
                    <ScrollView
                        horizontal
                        className={styles.scroll()}
                        contentContainerClassName={styles.scrollContent()}
                        // Long lines scroll sideways – the web reaches them with the keyboard
                        {...focusableOnWeb}
                    >
                        {body}
                    </ScrollView>
                )}
            </ScrollView>
            {expandable && maxHeight !== undefined && (
                <Pressable
                    role="button"
                    aria-expanded={expanded}
                    className={styles.more()}
                    onPress={() => setExpanded(!expanded)}
                >
                    <Text className={styles.moreText()}>{expanded ? t.showLess : t.showMore}</Text>
                </Pressable>
            )}
        </View>
    );
}
