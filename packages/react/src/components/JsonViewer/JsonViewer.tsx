import { createTreeCollection, TreeView as ArkTreeView } from '@ark-ui/react/tree-view';
import {
    announce,
    copyText,
    jsonCopyText,
    jsonExpandedIds,
    jsonTree,
    jsonValueText,
    jsonViewer as jsonViewerRecipe,
    searchJson,
    walkTree,
    type JsonNode,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronRight, Copy, Search } from 'lucide-react';
import { createContext, useContext, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Highlight } from '../Highlight/Highlight.js';
import { Input } from '../Input/Input.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface JsonViewerProps {
    /** The data to show (any JSON value) */
    data: unknown;
    /** Accessible name of the tree (default "JSON data") */
    label?: string;
    /** Levels open at first (default 1; 0: all closed, Infinity: all open) */
    defaultExpandedDepth?: number;
    /** Search field above the tree: hits are marked and their branches opened */
    search?: boolean;
    /** Copy button per node (and Ctrl+C on the focused node, default true) */
    copyable?: boolean;
    /** Shows the type of every value as text (otherwise only for screen readers) */
    showTypes?: boolean;
    /** A value was copied: its path and the copied text */
    onCopy?: (path: string, text: string) => void;
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof jsonViewerRecipe>;
}

interface Shared {
    query: string;
    matches: Set<string>;
    copyable: boolean;
    showTypes: boolean;
    copy: (node: JsonNode) => void;
    classes?: RecipeClasses<typeof jsonViewerRecipe>;
}
const JsonViewerContext = createContext<Shared | null>(null);

/**
 * JSON as a tree (role="tree"): arrow keys open and close, typing jumps to a key; values are coloured by type and
 * readable as text (quotes, true/false, null). Ctrl+C copies the focused value.
 */
export function JsonViewer({
    classes,
    data,
    label,
    defaultExpandedDepth = 1,
    search,
    copyable = true,
    showTypes,
    onCopy,
    'aria-label': ariaLabel,
    className,
    style,
}: JsonViewerProps) {
    const jsonViewer = useRecipe('jsonViewer', jsonViewerRecipe, classes);
    const styles = jsonViewer();
    const t = useTranslations().jsonViewer;
    const root = useMemo(() => jsonTree(data), [data]);
    // The root itself is not shown: its children are the top level (a primitive value is shown alone)
    const top = useMemo(() => root.children ?? [root], [root]);
    const collection = useMemo(
        () =>
            createTreeCollection<JsonNode>({
                nodeToValue: (node) => node.id,
                nodeToString: (node) => String(node.key ?? ''),
                rootNode: { id: 'ROOT', key: null, type: 'object', value: null, children: top },
            }),
        [top]
    );
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
    const nodes = useMemo(() => {
        const byId = new Map<string, JsonNode>();
        walkTree([root], (node) => void byId.set(node.id, node));
        return byId;
    }, [root]);

    const changeQuery = (next: string) => {
        setQuery(next);
        const found = searchJson(root, next);
        if (found.expand.length) setExpanded((current) => [...new Set([...current, ...found.expand])]);
    };
    const copy = (node: JsonNode) => {
        const text = jsonCopyText(node.value);
        copyText(text)
            .then(() => {
                announce(t.copied(node.id));
                onCopy?.(node.id, text);
            })
            .catch(() => undefined);
    };
    // Ctrl/Cmd+C on a node copies its value (the copy buttons are no tab stops)
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!copyable || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'c') return;
        const id = (event.target as HTMLElement).closest<HTMLElement>('[data-node-id]')?.dataset.nodeId;
        const node = id ? nodes.get(id) : undefined;
        if (!node || window.getSelection()?.toString()) return;
        event.preventDefault();
        copy(node);
    };
    const shared: Shared = {
        query,
        matches: new Set(result.matches),
        copyable,
        showTypes: !!showTypes,
        copy,
        classes,
    };

    return (
        <ArkTreeView.Root
            className={styles.base({ class: className })}
            style={style}
            collection={collection}
            expandedValue={expanded}
            onExpandedChange={(details) => setExpanded(details.expandedValue)}
            translations={{ treeLabel: label ?? ariaLabel ?? t.label }}
            onKeyDown={onKeyDown}
        >
            {search && (
                <Input
                    value={query}
                    onChange={(event) => changeQuery(event.currentTarget.value)}
                    type="search"
                    size="sm"
                    leadingIcon={Search}
                    clearable
                    placeholder={t.search}
                    aria-label={t.search}
                />
            )}
            <ArkTreeView.Tree className={styles.tree()}>
                <JsonViewerContext.Provider value={shared}>
                    {top.map((node, index) => (
                        <JsonViewerNode key={node.id} node={node} indexPath={[index]} />
                    ))}
                </JsonViewerContext.Provider>
            </ArkTreeView.Tree>
            {search && (
                <span role="status" className={styles.status()}>
                    {query.trim() ? t.matches(result.matches.length) : ''}
                </span>
            )}
        </ArkTreeView.Root>
    );
}

function JsonViewerNode({ node, indexPath }: { node: JsonNode; indexPath: number[] }) {
    const context = useContext(JsonViewerContext)!;
    const jsonViewer = useRecipe('jsonViewer', jsonViewerRecipe, context.classes);
    const t = useTranslations().jsonViewer;
    const type = node.type;
    const valueType =
        type === 'string' || type === 'number' || type === 'boolean'
            ? type
            : type === 'null' || type === 'undefined'
              ? 'nothing'
              : 'nested';
    const styles = jsonViewer({ valueType, showTypes: context.showTypes });
    const keyText = node.key === null ? '' : String(node.key);
    const match = context.matches.has(node.id);
    const count = node.children?.length ?? 0;
    const preview = type === 'array' ? `[ ${t.items(count)} ]` : `{ ${t.keys(count)} }`;
    const marked = (text: string) => (match ? <Highlight text={text} query={context.query} ignoreAccents /> : text);
    const keyPart = keyText && (
        <>
            <span className={styles.key()}>{marked(keyText)}</span>
            <span className={styles.punctuation()}>: </span>
        </>
    );
    // Pointer convenience only: the keyboard copies with Ctrl+C on the node
    const copyButton = context.copyable && (
        <span
            aria-hidden="true"
            className={styles.copy()}
            title={t.copy(node.id)}
            onClick={(event) => {
                event.stopPropagation();
                context.copy(node);
            }}
        >
            <Copy className={styles.copyIcon()} />
        </span>
    );
    const shortcuts = context.copyable ? 'Control+C' : undefined;
    return (
        <ArkTreeView.NodeProvider node={node} indexPath={indexPath}>
            {node.children ? (
                <ArkTreeView.Branch className={styles.branch()} data-node-id={node.id} aria-keyshortcuts={shortcuts}>
                    <ArkTreeView.BranchControl className={styles.row()}>
                        <ArkTreeView.BranchIndicator className={styles.indicator()}>
                            <ChevronRight className={styles.indicatorIcon()} aria-hidden="true" />
                        </ArkTreeView.BranchIndicator>
                        <ArkTreeView.BranchText className={styles.value()}>
                            {keyPart}
                            <span className={styles.preview()}>{preview}</span>
                            <span className={styles.type()}>{t.types[type]}</span>
                        </ArkTreeView.BranchText>
                        {copyButton}
                    </ArkTreeView.BranchControl>
                    <ArkTreeView.BranchContent className={styles.group()}>
                        {node.children.map((child, index) => (
                            <JsonViewerNode key={child.id} node={child} indexPath={[...indexPath, index]} />
                        ))}
                    </ArkTreeView.BranchContent>
                </ArkTreeView.Branch>
            ) : (
                <ArkTreeView.Item className={styles.row()} data-node-id={node.id} aria-keyshortcuts={shortcuts}>
                    <span className={styles.spacer()} aria-hidden="true" />
                    <ArkTreeView.ItemText className={styles.value()}>
                        {keyPart}
                        {marked(jsonValueText(node.value))}
                        <span className={styles.type()}>{t.types[type]}</span>
                    </ArkTreeView.ItemText>
                    {copyButton}
                </ArkTreeView.Item>
            )}
        </ArkTreeView.NodeProvider>
    );
}
