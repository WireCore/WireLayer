import {
    jsonCopyText,
    jsonExpandedIds,
    jsonTree,
    jsonValueText,
    jsonViewer,
    searchJson,
    visuallyHidden,
    type JsonNode,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronRight, Copy, Search } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { Highlight } from '../Highlight/Highlight.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Input } from '../Input/Input.js';

export interface JsonViewerProps extends Omit<ViewProps, 'children'> {
    /** The data to show (any JSON value) */
    data: unknown;
    /** Accessible name of the tree (default "JSON data") */
    label?: string;
    /** Levels open at first (default 1; 0: all closed, Infinity: all open) */
    defaultExpandedDepth?: number;
    /** Search field above the tree: hits are marked and their branches opened, the number of hits is shown */
    search?: boolean;
    /**
     * Copy button per node (default true): calls `onCopy` – without `onCopy` only the web copies (navigator.clipboard),
     * iOS and Android then show no copy buttons
     */
    copyable?: boolean;
    /** Shows the type of every value as text (otherwise only for screen readers) */
    showTypes?: boolean;
    /**
     * Copies a value: its path and the text – e.g. `copy(text)` of `useClipboard()` from
     * `@wirecore/wirelayer-native/expo-clipboard`; the copy is announced
     */
    onCopy?: (path: string, text: string) => void | Promise<void>;
    className?: string;
}

interface Shared {
    query: string;
    matches: Set<string>;
    expanded: Set<string>;
    toggle: (id: string) => void;
    showTypes: boolean;
    copy?: (node: JsonNode) => void;
}

const webClipboard = () =>
    Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard
        ? (_path: string, text: string) => navigator.clipboard.writeText(text)
        : undefined;

/**
 * JSON as nested lists: objects and arrays are buttons that open and close (aria-expanded), values are coloured by
 * type and readable as text (quotes, true/false, null). Search marks the hits and opens their branches.
 */
export function JsonViewer({
    data,
    label,
    defaultExpandedDepth = 1,
    search = false,
    copyable = true,
    showTypes = false,
    onCopy,
    className,
    ...props
}: JsonViewerProps) {
    const t = useTranslations().jsonViewer;
    const styles = jsonViewer();
    const { announce, region } = useAnnouncer();
    const root = useMemo(() => jsonTree(data), [data]);
    // The root itself is not shown: its children are the top level (a primitive value is shown alone)
    const top = root.children ?? [root];
    const initialExpanded = () => jsonExpandedIds(root, defaultExpandedDepth + 1).filter((id) => id !== root.id);
    const [expanded, setExpanded] = useState<string[]>(initialExpanded);
    const [shownRoot, setShownRoot] = useState(root);
    const [query, setQuery] = useState('');
    const result = useMemo(() => searchJson(root, query), [root, query]);
    // New data starts closed again (adjusting state while rendering, as React recommends)
    if (shownRoot !== root) {
        setShownRoot(root);
        setExpanded(initialExpanded());
    }

    // The number of hits once typing pauses
    const searching = !!query.trim();
    const count = result.matches.length;
    useEffect(() => {
        if (!searching) return;
        const timer = setTimeout(() => announce(t.matches(count)), 600);
        return () => clearTimeout(timer);
    }, [searching, query, count, announce, t]);

    const changeQuery = (next: string) => {
        setQuery(next);
        const found = searchJson(root, next);
        if (found.expand.length) setExpanded((current) => [...new Set([...current, ...found.expand])]);
    };
    const copier = copyable ? (onCopy ?? webClipboard()) : undefined;
    const shared: Shared = {
        query: query.trim(),
        matches: new Set(result.matches),
        expanded: new Set(expanded),
        toggle: (id) =>
            setExpanded((current) =>
                current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
            ),
        showTypes,
        copy: copier
            ? (node) => {
                  const text = jsonCopyText(node.value);
                  Promise.resolve(copier(node.id, text))
                      .then(() => announce(t.copied(node.id)))
                      .catch(() => undefined);
              }
            : undefined,
    };

    return (
        <View {...props} className={styles.base({ class: className })}>
            {search && (
                <Input
                    role="searchbox"
                    value={query}
                    onChangeText={changeQuery}
                    leadingIcon={Search}
                    clearable
                    aria-label={t.search}
                    placeholder={t.search}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
            )}
            {search && searching && <Text className={styles.matches()}>{t.matches(count)}</Text>}
            <View
                {...(top.length ? { role: 'list' as const, 'aria-label': label ?? t.label } : {})}
                className={styles.tree()}
            >
                {top.map((node) => (
                    <JsonViewerNode key={node.id} node={node} shared={shared} />
                ))}
            </View>
            {region}
        </View>
    );
}

function JsonViewerNode({ node, shared }: { node: JsonNode; shared: Shared }) {
    const t = useTranslations().jsonViewer;
    const web = Platform.OS === 'web';
    const type = node.type;
    const valueType =
        type === 'string' || type === 'number' || type === 'boolean'
            ? type
            : type === 'null' || type === 'undefined'
              ? 'nothing'
              : 'nested';
    const open = shared.expanded.has(node.id);
    const styles = jsonViewer({ valueType, open });
    const typeName = t.types[type] ?? type;
    const keyText = node.key === null ? '' : String(node.key);
    const match = shared.matches.has(node.id) && !!shared.query;
    const marked = (text: string): ReactNode =>
        match ? <Highlight text={text} query={shared.query} ignoreAccents /> : text;
    const keyPart = !!keyText && (
        <>
            <Text className={styles.key()}>{marked(keyText)}</Text>
            <Text className={styles.punctuation()}>: </Text>
        </>
    );
    // The type: visible with showTypes, otherwise only read (web: hidden text, iOS/Android: in the name)
    const typePart = shared.showTypes ? (
        <Text className={styles.type()}>{`  ${typeName}`}</Text>
    ) : web ? (
        <Text className={visuallyHidden()}>{`, ${typeName}`}</Text>
    ) : null;
    const copyButton = !!shared.copy && (
        <IconButton
            icon={Copy}
            label={t.copy(node.id)}
            variant="text"
            size="sm"
            hitSlop={6}
            onPress={() => shared.copy?.(node)}
        />
    );

    if (node.children) {
        const count = node.children.length;
        const preview = type === 'array' ? `[ ${t.items(count)} ]` : `{ ${t.keys(count)} }`;
        // Without visible types the name carries the type (the visible text stays its start)
        const name = shared.showTypes ? undefined : `${keyText ? `${keyText}: ` : ''}${preview}, ${typeName}`;
        return (
            <View role="listitem">
                <View className={styles.row()}>
                    <Pressable
                        role="button"
                        aria-expanded={open}
                        {...(name ? { 'aria-label': name } : {})}
                        className={styles.toggle()}
                        onPress={() => shared.toggle(node.id)}
                    >
                        <Icon icon={ChevronRight} className={styles.indicator()} />
                        <Text className={styles.text()}>
                            {keyPart}
                            <Text className={styles.preview()}>{preview}</Text>
                            {shared.showTypes && typePart}
                        </Text>
                    </Pressable>
                    {copyButton}
                </View>
                {open && count > 0 && (
                    <View role="list" className={styles.group()}>
                        {node.children.map((child) => (
                            <JsonViewerNode key={child.id} node={child} shared={shared} />
                        ))}
                    </View>
                )}
            </View>
        );
    }
    const value = jsonValueText(node.value);
    const name = `${keyText ? `${keyText}: ` : ''}${value}, ${typeName}`;
    return (
        <View role="listitem" className={styles.row()}>
            <View className={styles.spacer()} />
            <Text selectable className={styles.text()} {...(web || shared.showTypes ? {} : { 'aria-label': name })}>
                {keyPart}
                {marked(value)}
                {typePart}
            </Text>
            {copyButton}
        </View>
    );
}
