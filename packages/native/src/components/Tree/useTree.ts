import {
    ChildrenLoader,
    filterTree,
    flattenTree,
    isLazyNode,
    pluralText,
    pruneTree,
    toggleTreeChecked,
    treeBranchIds,
    treeCheckedValue,
    treeCheckStates,
    treeRetryId,
    withLoadedChildren,
    type ChildrenLoaderState,
    type DataSource,
    type TreeCheckedStrategy,
    type TreeRow,
} from '@wirecore/wirelayer-recipes/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { findTreePath, type TreeNode } from './types.js';

/** The props the tree logic reads – shared by Tree and TreeSelect */
export interface TreeModelProps {
    items: TreeNode[];
    /** One node (radio buttons) or several (checkboxes) can be selected */
    selectionMode?: 'single' | 'multiple';
    selectedValue?: string[];
    defaultSelectedValue?: string[];
    onSelectionChange?: (ids: string[]) => void;
    expandedValue?: string[];
    defaultExpandedValue?: string[];
    onExpandedChange?: (ids: string[]) => void;
    /** A checkbox per node; checking a branch checks its children (pressing a node checks it, no selection) */
    checkable?: boolean;
    checkedValue?: string[];
    defaultCheckedValue?: string[];
    onCheckedChange?: (ids: string[]) => void;
    /** Check boxes of parents and children are independent (no cascade) */
    checkStrictly?: boolean;
    /**
     * Which checked ids are reported: `all` (default) – every checked node, `parent` – a fully checked branch
     * instead of its children, `child` – only nodes without children
     */
    checkedStrategy?: TreeCheckedStrategy;
    /**
     * Loads the children of a node with `hasChildren: true` (or `leaf: false`) when it opens; the signal aborts
     * it. Without it (and without `dataSource`) the tree calls `onLoadChildren` and the parent adds the children.
     */
    loadChildren?: (node: TreeNode, request: { signal: AbortSignal }) => Promise<TreeNode[]>;
    /** A lazy node opened and there is no loadChildren/dataSource: add its children to the items */
    onLoadChildren?: (node: TreeNode) => void;
    /** Source of the children of lazy nodes (`getChildren`) */
    dataSource?: DataSource<TreeNode>;
    /** Search text – controlled, or set it from a search field of your own */
    filterValue?: string;
    onFilterValueChange?: (text: string) => void;
    /** `filter`: only the hits and their ancestors stay; `highlight`: all nodes stay, the hits are marked */
    filterMode?: 'filter' | 'highlight';
}

/** A row of the flat list: a node (also a retry row), or the loading row below an opening branch */
export type TreeListRow =
    { type: 'node'; key: string; row: TreeRow<TreeNode> } | { type: 'loading'; key: string; level: number };

const empty: ChildrenLoaderState<TreeNode> = { status: {}, children: {}, errors: {} };
const findNode = (items: TreeNode[], id: string) => findTreePath(items, id)?.at(-1);

/**
 * State and behaviour of a tree: open nodes, selection, check boxes with cascade, children loaded on demand
 * (with a loading row, a retry row and announcements), search. The rows are flat – the tree renders them in a
 * FlatList.
 */
export function useTree(props: TreeModelProps) {
    const { translations, locale } = useLocale();
    const t = translations.tree;
    const { announce, region } = useAnnouncer();

    // Children on demand: from loadChildren/dataSource (own loader) or the parent (onLoadChildren)
    const [loaded, setLoaded] = useState(empty);
    const resolved = useMemo(() => withLoadedChildren(props.items, loaded.children), [props.items, loaded.children]);
    const ownLoader = !!props.loadChildren || !!props.dataSource?.getChildren;

    // Callbacks that run later (loader, effects) read the props of the last render
    const latest = useRef({ props, resolved, t, locale, announce });
    useEffect(() => {
        latest.current = { props, resolved, t, locale, announce };
    });
    const loadedRef = useRef(empty);
    const loader = useRef<ChildrenLoader<TreeNode> | undefined>(undefined);
    const getLoader = () =>
        (loader.current ??= new ChildrenLoader<TreeNode>({
            load: (node, request) => {
                const current = latest.current.props;
                return current.loadChildren
                    ? current.loadChildren(node, request)
                    : current.dataSource!.getChildren!(node, request).then((result) => result.items);
            },
            onChange: (state) => {
                const before = loadedRef.current;
                loadedRef.current = state;
                const { t: texts, locale: lang, resolved: nodes } = latest.current;
                const label = (id: string) => findNode(nodes, id)?.label ?? id;
                for (const [id, value] of Object.entries(state.status)) {
                    if (before.status[id] === value) continue;
                    latest.current.announce(
                        value === 'loading'
                            ? texts.loadingNode(label(id))
                            : value === 'error'
                              ? texts.loadError(label(id))
                              : pluralText(texts.loadedNode, state.children[id]?.length ?? 0, lang).replace(
                                    '{label}',
                                    label(id)
                                )
                    );
                }
                setLoaded(state);
            },
        }));
    useEffect(
        () => () => {
            loader.current?.dispose();
            loader.current = undefined;
        },
        []
    );
    // Lazy nodes the parent was asked for (onLoadChildren) – asked once until it answers
    const asked = useRef(new Set<string>());
    const requestChildren = (ids: string[]) => {
        const { props: current, resolved: nodes } = latest.current;
        for (const id of ids) {
            const node = findNode(nodes, id);
            if (!node || !isLazyNode(node)) continue;
            if (current.loadChildren || current.dataSource?.getChildren) void getLoader().load(node);
            else if (!asked.current.has(id)) {
                asked.current.add(id);
                latest.current.announce(latest.current.t.loadingNode(node.label));
                current.onLoadChildren?.(node);
            }
        }
    };
    const retry = (id: string) => {
        const node = findNode(resolved, id);
        if (!node) return;
        if (ownLoader) void getLoader().load(node, { force: true });
        else {
            asked.current.add(id);
            announce(t.loadingNode(node.label));
            props.onLoadChildren?.(node);
        }
    };

    // Search: the hits with their ancestors. While searching, the open nodes are a state of their own (the ancestors
    // of the hits open); the open nodes from before come back when the search ends.
    const [queryInternal, setQueryInternal] = useState('');
    const query = props.filterValue ?? queryInternal;
    const text = query.trim();
    const filterMode = props.filterMode ?? 'filter';
    const filtered = useMemo(
        () => filterTree(resolved, text, (node) => node.label, filterMode),
        [resolved, text, filterMode]
    );
    const matches = useMemo(() => new Set(filtered.matches), [filtered]);
    const setQuery = (next: string) => {
        setQueryInternal(next);
        props.onFilterValueChange?.(next);
    };

    // Expanded nodes: controlled or own state
    const [expandedInternal, setExpandedInternal] = useState<string[]>(props.defaultExpandedValue ?? []);
    const expandedOutside = props.expandedValue ?? expandedInternal;
    const [search, setSearch] = useState<{ query: string; expanded: string[] } | null>(null);
    const searchState = text
        ? search?.query === text
            ? search
            : { query: text, expanded: [...new Set([...(search?.expanded ?? expandedOutside), ...filtered.expand])] }
        : null;
    if (searchState !== search) setSearch(searchState);
    const expanded = searchState?.expanded ?? expandedOutside;
    const setExpanded = (ids: string[]) => {
        if (searchState) {
            setSearch({ ...searchState, expanded: ids });
            return;
        }
        setExpandedInternal(ids);
        props.onExpandedChange?.(ids);
    };
    const toggleExpanded = (id: string) =>
        setExpanded(expanded.includes(id) ? expanded.filter((key) => key !== id) : [...expanded, id]);
    const expandAll = () => setExpanded(treeBranchIds(resolved));
    const collapseAll = () => setExpanded([]);

    // Nodes that open load their children (also nodes opened from outside, or open from the start)
    const previousExpanded = useRef<string[]>([]);
    useEffect(() => {
        const previous = previousExpanded.current;
        previousExpanded.current = expanded;
        requestChildren(expanded.filter((id) => !previous.includes(id)));
    }, [expanded, requestChildren]);

    // Forgetting loaded children: once the loader dropped them, the open nodes are lazy again and load anew
    const reloadAfter = useRef<string[]>([]);
    const invalidate = (id?: string) => {
        loader.current?.invalidate(id);
        if (id === undefined) asked.current.clear();
        else asked.current.delete(id);
        reloadAfter.current = id === undefined ? expanded : expanded.filter((key) => key === id);
    };
    useEffect(() => {
        if (!reloadAfter.current.length) return;
        const ids = reloadAfter.current;
        reloadAfter.current = [];
        requestChildren(ids);
    }, [resolved, requestChildren]);

    // Selection
    const [selectedInternal, setSelectedInternal] = useState<string[]>(props.defaultSelectedValue ?? []);
    const selected = props.selectedValue ?? selectedInternal;
    const select = (id: string) => {
        const next =
            props.selectionMode === 'multiple'
                ? selected.includes(id)
                    ? selected.filter((key) => key !== id)
                    : [...selected, id]
                : [id];
        setSelectedInternal(next);
        props.onSelectionChange?.(next);
    };

    // Check boxes: the cascade is computed by tree-data (also for children loaded on demand)
    const [checkedInternal, setCheckedInternal] = useState<string[]>(props.defaultCheckedValue ?? []);
    const checkedIds = props.checkedValue ?? checkedInternal;
    const checkStates = useMemo(
        () => (props.checkable ? treeCheckStates(resolved, checkedIds, props.checkStrictly) : undefined),
        [props.checkable, resolved, checkedIds, props.checkStrictly]
    );
    const toggleCheck = (id: string) => {
        const next = toggleTreeChecked(resolved, checkedIds, id, props.checkStrictly);
        const value = treeCheckedValue(resolved, next, props.checkedStrategy ?? 'all', props.checkStrictly);
        setCheckedInternal(value);
        props.onCheckedChange?.(value);
    };

    // Number of hits, announced while typing
    const matchesText = text
        ? filtered.matches.length
            ? pluralText(t.matches, filtered.matches.length, locale)
            : t.noMatches
        : '';
    useEffect(() => {
        if (matchesText) announce(matchesText);
    }, [text, matchesText, announce]);

    // What is shown: loaded children, a retry row below failed nodes, only the hits while filtering
    const view = useMemo(() => {
        const failed = (node: TreeNode) => isLazyNode(node) && loaded.status[node.id] === 'error';
        const withRetry = (list: TreeNode[]): TreeNode[] =>
            list.map((node) =>
                failed(node)
                    ? { ...node, children: [{ id: treeRetryId(node.id), label: t.retry }] }
                    : node.children
                      ? { ...node, children: withRetry(node.children) }
                      : node
            );
        const items = Object.keys(loaded.errors).length ? withRetry(resolved) : resolved;
        return pruneTree(items, filtered.visible);
    }, [resolved, loaded, filtered.visible, t.retry]);

    /** The children of the node are loading (own loader, or asked from the parent while it is open) */
    const loadingOf = (node: TreeNode) =>
        isLazyNode(node) && (loaded.status[node.id] === 'loading' || (!ownLoader && expanded.includes(node.id)));
    const rows: TreeListRow[] = [];
    for (const row of flattenTree(view, expanded)) {
        rows.push({ type: 'node', key: row.node.id, row });
        if (row.expanded && loadingOf(row.node))
            rows.push({ type: 'loading', key: `${row.node.id}\u0000loading`, level: row.level + 1 });
    }

    return {
        region,
        announce,
        resolved,
        rows,
        expanded,
        toggleExpanded,
        expandAll,
        collapseAll,
        selected,
        select,
        checkStates,
        toggleCheck,
        query,
        setQuery,
        matches,
        matchList: filtered.matches,
        loadingOf,
        retry,
        invalidate,
    };
}

export type TreeModel = ReturnType<typeof useTree>;
