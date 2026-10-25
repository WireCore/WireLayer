import { createTreeCollection } from '@ark-ui/react/tree-view';
import {
    ChildrenLoader,
    filterTree,
    isLazyNode,
    moveTreeNode,
    locateTreeNode,
    pluralText,
    pruneTree,
    toggleTreeChecked,
    treeBranchIds,
    treeCheckedValue,
    treeCheckStates,
    treeDropMove,
    treeInsertPosition,
    treeKeyboardMove,
    treeMoveAnchor,
    treeRetryId,
    treeRetryParent,
    walkTree,
    withLoadedChildren,
    type ChildrenLoaderState,
    type DataSource,
    type TreeCheckedStrategy,
    type TreeDropPosition,
    type TreeMove,
} from '@wirecore/wirelayer-recipes';
import {
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
    type DragEvent,
    type KeyboardEvent,
    type RefObject,
} from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { treeCarry, type TreeDropAllowed, type TreeNode, type TreeTransfer } from './types.js';

/** The props the tree logic reads – shared by Tree and VirtualTree */
export interface TreeModelProps {
    items: readonly TreeNode[];
    selectedValue?: string[];
    defaultSelectedValue?: string[];
    onSelectionChange?: (ids: string[]) => void;
    expandedValue?: string[];
    defaultExpandedValue?: string[];
    onExpandedChange?: (ids: string[]) => void;
    checkable?: boolean;
    checkedValue?: string[];
    defaultCheckedValue?: string[];
    onCheckedChange?: (ids: string[]) => void;
    checkStrictly?: boolean;
    checkedStrategy?: TreeCheckedStrategy;
    reorderable?: boolean;
    onMove?: (move: TreeMove) => void;
    loadChildren?: (node: TreeNode, request: { signal: AbortSignal }) => Promise<TreeNode[]>;
    onLoadChildren?: (node: TreeNode) => void;
    dataSource?: DataSource<TreeNode>;
    filterValue?: string;
    onFilterValueChange?: (text: string) => void;
    filterMode?: 'filter' | 'highlight';
    allowDrop?: TreeDropAllowed;
    group?: string;
    name?: string;
    onTransfer?: (transfer: TreeTransfer) => void;
}

/** Drag and drop state of a tree, shared with the nodes */
export interface TreeDragContext {
    reorderable: boolean;
    dragging: string | null;
    drop: { id: string; position: TreeDropPosition } | null;
    onDragStart: (id: string, event: DragEvent<HTMLElement>) => void;
    onDragOver: (id: string, branch: boolean, event: DragEvent<HTMLElement>) => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
    onDragEnd: () => void;
}

const find = (items: TreeNode[], id: string) => locateTreeNode(items, id)?.node;
const hasLazyNodes = (items: readonly TreeNode[]) => {
    let found = false;
    walkTree(items, (node) => {
        if (isLazyNode(node)) found = true;
    });
    return found;
};
const empty: ChildrenLoaderState<TreeNode> = { status: {}, children: {}, errors: {} };

/**
 * State and behaviour of a tree – children loaded on demand, search, check boxes, moves within and between trees;
 * the rendering (nested in Tree, flat in VirtualTree) reads it.
 */
export function useTree(props: TreeModelProps, root: RefObject<HTMLElement | null>) {
    const { translations, locale, dir } = useLocale();
    const t = translations.tree;
    const [status, setStatus] = useState('');
    const [self] = useState(() => Symbol('tree'));
    // Callbacks that run later (loader, effects) read the props and items of the last render
    const latest = useRef(props);
    useEffect(() => {
        latest.current = props;
    });

    // Children on demand: from loadChildren/dataSource (own loader) or the parent (onLoadChildren)
    const [loaded, setLoaded] = useState(empty);
    const loadedRef = useRef(empty);
    const [manual, setManual] = useState<Set<string>>(() => new Set());
    const resolved = useMemo(() => withLoadedChildren(props.items, loaded.children), [props.items, loaded.children]);
    const resolvedRef = useRef(resolved);
    useEffect(() => {
        resolvedRef.current = resolved;
    }, [resolved]);
    const label = (id: string) => find(resolvedRef.current, id)?.label ?? id;
    const loader = useRef<ChildrenLoader<TreeNode> | undefined>(undefined);
    const getLoader = () =>
        (loader.current ??= new ChildrenLoader<TreeNode>({
            load: (node, request) =>
                latest.current.loadChildren
                    ? latest.current.loadChildren(node, request)
                    : latest.current.dataSource!.getChildren!(node, request).then((result) => result.items),
            onChange: (state) => {
                const before = loadedRef.current;
                loadedRef.current = state;
                for (const [id, value] of Object.entries(state.status)) {
                    if (before.status[id] === value) continue;
                    if (value === 'loading') setStatus(t.loadingNode(label(id)));
                    else if (value === 'error') setStatus(t.loadError(label(id)));
                    else
                        setStatus(
                            pluralText(t.loadedNode, state.children[id]?.length ?? 0, locale).replace(
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
    const ownLoader = !!props.loadChildren || !!props.dataSource?.getChildren;
    const loadingOf = (node: TreeNode) =>
        isLazyNode(node) && (loaded.status[node.id] === 'loading' || (!ownLoader && manual.has(node.id)));
    // Once lazy nodes were seen the tree keeps its own check logic (the parent may fill in children later)
    const [lazySeen, setLazySeen] = useState(false);
    const itemsLazy = hasLazyNodes(props.items);
    if (itemsLazy && !lazySeen) setLazySeen(true);
    const lazy = ownLoader || lazySeen || itemsLazy;

    const manualRef = useRef(manual);
    useEffect(() => {
        manualRef.current = manual;
    }, [manual]);
    function requestChildren(ids: string[]) {
        for (const id of ids) {
            const node = find(resolvedRef.current, id);
            if (!node || !isLazyNode(node)) continue;
            if (latest.current.loadChildren || latest.current.dataSource?.getChildren) void getLoader().load(node);
            else if (!manualRef.current.has(id)) {
                manualRef.current = new Set([...manualRef.current, id]);
                setManual(manualRef.current);
                setStatus(t.loadingNode(node.label));
                latest.current.onLoadChildren?.(node);
            }
        }
    }
    function retry(id: string) {
        const node = find(resolvedRef.current, id);
        if (!node) return;
        focusNode(id);
        if (ownLoader) void getLoader().load(node, { force: true });
        else {
            manualRef.current = new Set([...manualRef.current, id]);
            setManual(manualRef.current);
            props.onLoadChildren?.(node);
        }
    }

    // Expanded nodes: own state (or controlled), so search, "expand all" and loading can change them
    const [expandedInternal, setExpandedInternal] = useState<string[]>(props.defaultExpandedValue ?? []);
    const expanded = props.expandedValue ?? expandedInternal;
    const setExpanded = (ids: string[]) => {
        setExpandedInternal(ids);
        latest.current.onExpandedChange?.(ids);
    };
    const previousExpanded = useRef<string[]>([]);
    useEffect(() => {
        const previous = previousExpanded.current;
        previousExpanded.current = expanded;
        requestChildren(expanded.filter((id) => !previous.includes(id)));
    }, [expanded]);
    const expandAll = () => setExpanded(treeBranchIds(resolvedRef.current));
    const collapseAll = () => setExpanded([]);
    /** Forgets loaded children (of one node or all); open nodes load them again */
    function invalidate(id?: string) {
        loader.current?.invalidate(id);
        manualRef.current = id === undefined ? new Set() : new Set([...manualRef.current].filter((key) => key !== id));
        setManual(manualRef.current);
        // Once the loader dropped the children, the open nodes are lazy again and load anew
        reloadAfter.current = id === undefined ? expanded : expanded.filter((key) => key === id);
    }
    const reloadAfter = useRef<string[]>([]);
    useEffect(() => {
        if (!reloadAfter.current.length) return;
        const ids = reloadAfter.current;
        reloadAfter.current = [];
        requestChildren(ids);
    }, [resolved]);

    // Selection: a click on a retry row loads again instead of selecting it
    const [selectedInternal, setSelectedInternal] = useState<string[]>(props.defaultSelectedValue ?? []);
    const selected = props.selectedValue ?? selectedInternal;
    function onSelectionChange(ids: string[]) {
        const retryId = ids.find((id) => treeRetryParent(id) !== undefined);
        if (retryId) return retry(treeRetryParent(retryId)!);
        setSelectedInternal(ids);
        props.onSelectionChange?.(ids);
    }

    // Check boxes: Ark's cascade by default; own logic for checkStrictly, checkedStrategy and lazy children
    const ownChecks = !!props.checkable && (!!props.checkStrictly || props.checkedStrategy !== undefined || lazy);
    const [checkedInternal, setCheckedInternal] = useState<string[]>(props.defaultCheckedValue ?? []);
    const checkedIds = props.checkedValue ?? checkedInternal;
    const checkStates = useMemo(
        () => (ownChecks ? treeCheckStates(resolved, checkedIds, props.checkStrictly) : undefined),
        [ownChecks, resolved, checkedIds, props.checkStrictly]
    );
    function toggleCheck(id: string) {
        const next = toggleTreeChecked(resolved, checkedIds, id, props.checkStrictly);
        const value = treeCheckedValue(resolved, next, props.checkedStrategy ?? 'all', props.checkStrictly);
        setCheckedInternal(value);
        props.onCheckedChange?.(value);
    }
    function onArkCheckedChange(ids: string[]) {
        setCheckedInternal(ids);
        props.onCheckedChange?.(ids);
    }

    // Search: hits with their ancestors (opened); leaving the search restores the open nodes from before
    const [queryInternal, setQueryInternal] = useState('');
    const query = props.filterValue ?? queryInternal;
    const setQuery = (text: string) => {
        setQueryInternal(text);
        props.onFilterValueChange?.(text);
    };
    const filtered = useMemo(
        () => filterTree(resolved, query, (node) => node.label, props.filterMode ?? 'filter'),
        [resolved, query, props.filterMode]
    );
    const matches = useMemo(() => new Set(filtered.matches), [filtered]);
    const beforeSearch = useRef<string[] | null>(null);
    const appliedQuery = useRef('');
    useEffect(() => {
        if (query === appliedQuery.current) return;
        appliedQuery.current = query;
        jumped.current = -1;
        if (!query.trim()) {
            if (beforeSearch.current) setExpanded(beforeSearch.current);
            beforeSearch.current = null;
            return;
        }
        beforeSearch.current ??= expanded;
        setExpanded([...new Set([...beforeSearch.current, ...filtered.expand])]);
        const count = filtered.matches.length;
        setStatus(count ? pluralText(t.matches, count, locale) : t.noMatches);
    }, [query]);
    const jumped = useRef(-1);
    /** Highlight mode: focuses the next (or previous) hit */
    function jump(direction: 1 | -1 = 1) {
        const list = filtered.matches;
        if (!list.length) return;
        jumped.current = (jumped.current + direction + list.length) % list.length;
        focusNode(list[jumped.current]!);
    }

    // What is rendered: loaded children, a retry row below failed nodes, only the hits while filtering
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
    const collection = useMemo(
        () =>
            createTreeCollection<TreeNode>({
                nodeToValue: (node) => node.id,
                nodeToString: (node) => node.label,
                isNodeDisabled: (node) => !!node.disabled,
                // A lazy node is a branch before its children are known
                nodeToChildrenCount: (node) => (isLazyNode(node) ? 1 : undefined),
                rootNode: { id: 'ROOT', label: '', children: view },
            }),
        [view]
    );

    function focusNode(id: string) {
        const element = root.current?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`);
        const target = element?.matches('[data-part=branch]')
            ? element.querySelector<HTMLElement>(':scope > [data-part=branch-control]')
            : element;
        target?.focus();
    }

    // Moving nodes: the parent applies the move to `items`; then the moved node gets the focus back
    const focusAfterMove = useRef<string | null>(null);
    useEffect(() => {
        if (!focusAfterMove.current) return;
        focusNode(focusAfterMove.current);
        focusAfterMove.current = null;
    }, [props.items]);
    const siblingsCount = (parentId: string | null, without: string) =>
        (parentId ? (find(resolved, parentId)?.children ?? []) : resolved).filter((item) => item.id !== without)
            .length + 1;
    function emitMove(move: TreeMove | undefined) {
        if (!move) return;
        const source = find(resolved, move.id);
        if (source && props.allowDrop) {
            const anchor = treeMoveAnchor(resolved, move);
            if (!props.allowDrop(source, anchor.target, anchor.position)) return setStatus(t.dropDenied);
        }
        const parent = move.parentId ? label(move.parentId) : null;
        setStatus(t.moved(label(move.id), parent, move.index + 1, siblingsCount(move.parentId, move.id)));
        focusAfterMove.current = move.id;
        // Loaded children are not in the parent's items: the move carries the whole tree after it
        props.onMove?.(Object.keys(loaded.children).length ? { ...move, items: moveTreeNode(resolved, move) } : move);
    }
    function emitTransfer(
        node: TreeNode,
        sourceTree: string | undefined,
        target: { parentId: string | null; index: number }
    ) {
        const parent = target.parentId ? label(target.parentId) : null;
        setStatus(t.moved(node.label, parent, target.index + 1, siblingsCount(target.parentId, node.id)));
        focusAfterMove.current = node.id;
        props.onTransfer?.({ node, sourceTree, targetTree: props.name, ...target });
    }

    // Another tree of the same group carries a node (drag or cut)
    const carry = useSyncExternalStore(treeCarry.subscribe, treeCarry.get, () => null);
    const foreign = (mode: 'drag' | 'cut') => {
        const current = treeCarry.get();
        return current &&
            current.mode === mode &&
            current.tree !== self &&
            props.group !== undefined &&
            current.group === props.group
            ? current
            : null;
    };
    const cutId = carry?.mode === 'cut' && carry.tree === self ? carry.node.id : null;
    function paste(targetId: string) {
        const current = treeCarry.get();
        if (!current || current.mode !== 'cut') return false;
        const target = find(resolved, targetId);
        if (!target) return false;
        const position: TreeDropPosition = target.children ? 'inside' : 'after';
        if (props.allowDrop && !props.allowDrop(current.node, target, position)) {
            setStatus(t.dropDenied);
            return true;
        }
        if (current.tree === self) {
            if (!props.reorderable) return false;
            const move = treeDropMove(resolved, current.node.id, targetId, position);
            if (!move) setStatus(t.dropDenied);
            else emitMove(move);
        } else {
            if (!foreign('cut')) return false;
            const at = treeInsertPosition(resolved, targetId, position);
            if (at) emitTransfer(current.node, current.name, at);
        }
        treeCarry.set(null);
        return true;
    }

    const movable = props.reorderable || props.group !== undefined;
    function onKeyDown(event: KeyboardEvent<HTMLElement>) {
        if (props.checkable) toggleCheckedOnSpace(event);
        const id = (event.target as HTMLElement).closest<HTMLElement>('[data-node-id]')?.dataset.nodeId;
        if (!id || treeRetryParent(id) !== undefined) return;
        const command = event.ctrlKey || event.metaKey;
        if (movable && command && !event.altKey && (event.key === 'x' || event.key === 'X')) {
            const node = find(resolved, id);
            if (!node || node.disabled) return;
            event.preventDefault();
            treeCarry.set({ mode: 'cut', node, tree: self, group: props.group, name: props.name });
            setStatus(t.cut(node.label));
            return;
        }
        if (command && !event.altKey && (event.key === 'v' || event.key === 'V')) {
            if (paste(id)) event.preventDefault();
            return;
        }
        if (event.key === 'Escape' && cutId) {
            event.preventDefault();
            event.stopPropagation();
            treeCarry.set(null);
            setStatus(t.cutCancelled);
            return;
        }
        if (!props.reorderable || !event.altKey) return;
        const rtl = dir === 'rtl';
        const direction =
            event.key === 'ArrowUp'
                ? 'up'
                : event.key === 'ArrowDown'
                  ? 'down'
                  : event.key === 'ArrowRight'
                    ? rtl
                        ? 'out'
                        : 'in'
                    : event.key === 'ArrowLeft'
                      ? rtl
                          ? 'in'
                          : 'out'
                      : undefined;
        if (!direction) return;
        event.preventDefault();
        event.stopPropagation();
        emitMove(treeKeyboardMove(resolved, id, direction));
    }

    // Drag and drop: within the tree (reorderable) and between trees of the same group
    const [dragging, setDragging] = useState<string | null>(null);
    const [drop, setDrop] = useState<{ id: string; position: TreeDropPosition } | null>(null);
    const dropPosition = (event: DragEvent<HTMLElement>, branch: boolean): TreeDropPosition => {
        const box = event.currentTarget.getBoundingClientRect();
        const share = (event.clientY - box.top) / box.height;
        if (!branch) return share < 0.5 ? 'before' : 'after';
        return share < 0.25 ? 'before' : share > 0.75 ? 'after' : 'inside';
    };
    const drag: TreeDragContext = {
        reorderable: movable,
        dragging,
        drop,
        onDragStart: (id, event) => {
            const node = find(resolved, id);
            if (!node) return;
            setDragging(id);
            treeCarry.set({ mode: 'drag', node, tree: self, group: props.group, name: props.name });
            event.dataTransfer.setData('text/plain', node.label);
            event.dataTransfer.effectAllowed = 'move';
        },
        onDragOver: (id, branch, event) => {
            const other = foreign('drag');
            if ((!dragging || !props.reorderable) && !other) return;
            if (dragging === id) return;
            // A closed folder whose children are not loaded yet: they load while the node hovers over it
            const hovered = find(resolved, id);
            if (hovered && isLazyNode(hovered)) requestChildren([id]);
            const position = dropPosition(event, branch);
            const source = other ? other.node : find(resolved, dragging!);
            const possible = other
                ? treeInsertPosition(resolved, id, position)
                : treeDropMove(resolved, dragging!, id, position);
            const target = find(resolved, id) ?? null;
            if (!possible || !source || (props.allowDrop && !props.allowDrop(source, target, position))) {
                setDrop(null);
                return;
            }
            event.preventDefault();
            setDrop({ id, position });
        },
        onDrop: (event) => {
            event.preventDefault();
            const other = foreign('drag');
            if (drop && dragging && props.reorderable)
                emitMove(treeDropMove(resolved, dragging, drop.id, drop.position));
            else if (drop && other) {
                const at = treeInsertPosition(resolved, drop.id, drop.position);
                if (at) emitTransfer(other.node, other.name, at);
            }
            setDragging(null);
            setDrop(null);
        },
        onDragEnd: () => {
            setDragging(null);
            setDrop(null);
            if (treeCarry.get()?.mode === 'drag') treeCarry.set(null);
        },
    };
    /** Dropping on an empty tree: to the top level */
    function onEmptyDragOver(event: DragEvent<HTMLElement>) {
        const other = foreign('drag');
        if (!other || (props.allowDrop && !props.allowDrop(other.node, null, 'inside'))) return;
        event.preventDefault();
    }
    function onEmptyDrop(event: DragEvent<HTMLElement>) {
        const other = foreign('drag');
        if (!other) return;
        event.preventDefault();
        emitTransfer(other.node, other.name, { parentId: null, index: 0 });
    }

    return {
        status,
        resolved,
        view,
        collection,
        expanded,
        setExpanded,
        expandAll,
        collapseAll,
        selected,
        onSelectionChange,
        ownChecks,
        checkStates,
        toggleCheck,
        onArkCheckedChange,
        query,
        setQuery,
        matches,
        jump,
        loadingOf,
        lazy,
        invalidate,
        onKeyDown,
        drag,
        cutId,
        onEmptyDragOver,
        onEmptyDrop,
        focusNode,
    };
}

export type TreeModel = ReturnType<typeof useTree>;

/** Space on a focused node clicks its checkbox – Ark's tree only selects with Space */
function toggleCheckedOnSpace(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== ' ' || event.altKey) return;
    const checkbox = (event.target as HTMLElement).querySelector<HTMLElement>(':scope > [data-part="node-checkbox"]');
    if (!checkbox) return;
    event.preventDefault();
    event.stopPropagation();
    checkbox.click();
}
