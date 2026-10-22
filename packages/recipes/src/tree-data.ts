// Logic of hierarchical data (Tree, VirtualTree, TreeSelect, CascadeSelect, OrgChart): children loaded on demand,
// searching with the ancestors of the hits, check boxes with or without cascade, the flat list of visible rows.
// Framework-neutral; the components keep the state it reports.

/** A node whose children may be loaded on demand: its children (undefined: none or not loaded yet) and the markers */
export interface LazyNode {
    children?: readonly LazyNode[];
    /** Has children that are loaded when the node opens (`loadChildren`) */
    hasChildren?: boolean;
    /** false: a branch whose children are loaded when it opens (like `hasChildren: true`) */
    leaf?: boolean;
}

/** A node as the tree logic reads it: an id, its children and the lazy markers */
export interface HierarchyNode extends LazyNode {
    id: string;
    children?: HierarchyNode[];
}

/** The node has children that are not loaded yet */
export const isLazyNode = (node: LazyNode): boolean =>
    node.children === undefined && (node.hasChildren === true || node.leaf === false);

/** The node is a branch: it has children, or children that are loaded on demand */
export const isBranchNode = (node: LazyNode): boolean => node.children !== undefined || isLazyNode(node);

const idOf = (node: unknown) => (node as { id: string }).id;

/** Visits every node depth-first; `children` reads the children (default: `node.children`) */
export function walkTree<T extends HierarchyNode>(
    items: readonly T[],
    visit: (node: T, ancestors: T[]) => void,
    children: (node: T) => readonly T[] | undefined = (node) => node.children as T[] | undefined,
    ancestors: T[] = []
) {
    for (const node of items) {
        visit(node, ancestors);
        const list = children(node);
        if (list?.length) walkTree(list, visit, children, [...ancestors, node]);
    }
}

/**
 * The items with the loaded children put in (copies only along the changed paths). A node that has `children`
 * of its own keeps them – the parent can always take over (manual loading). `key` names a node (default: `id`).
 */
export function withLoadedChildren<T extends LazyNode>(
    items: T[],
    loaded: Readonly<Record<string, T[]>>,
    key: (node: T) => string = idOf
): T[] {
    if (!Object.keys(loaded).length) return items;
    const resolve = (list: T[]): T[] => {
        let changed = false;
        const next = list.map((node) => {
            const own = node.children as T[] | undefined;
            const children = own ?? (isLazyNode(node) ? loaded[key(node)] : undefined);
            if (!children) return node;
            const resolved = resolve(children);
            if (resolved === own) return node;
            changed = true;
            return { ...node, children: resolved };
        });
        return changed ? next : list;
    };
    return resolve(items);
}

export type ChildrenStatus = 'loading' | 'error' | 'loaded';

/** What the loader knows per node id */
export interface ChildrenLoaderState<T> {
    status: Readonly<Record<string, ChildrenStatus>>;
    children: Readonly<Record<string, T[]>>;
    errors: Readonly<Record<string, unknown>>;
}

export interface ChildrenLoaderOptions<T> {
    /** Loads the children of a node; the signal aborts it (node closed again, invalidated, unmounted) */
    load: (node: T, request: { signal: AbortSignal }) => Promise<T[]>;
    /** Every change of the state */
    onChange?: (state: ChildrenLoaderState<T>) => void;
    /** Names a node (default: its `id`) */
    key?: (node: T) => string;
}

const isAbort = (error: unknown) => (error as { name?: string } | null)?.name === 'AbortError';

/**
 * Loads children on demand, one request per node: `load(node)` (nothing when loaded or loading; `force` loads again),
 * `invalidate(id)` forgets loaded children, `abort(id)`, `dispose()`. A late answer of an aborted request is dropped.
 */
export class ChildrenLoader<T extends LazyNode> {
    private state: ChildrenLoaderState<T> = { status: {}, children: {}, errors: {} };
    private requests = new Map<string, AbortController>();
    private options: ChildrenLoaderOptions<T>;

    constructor(options: ChildrenLoaderOptions<T>) {
        this.options = options;
    }

    get current(): ChildrenLoaderState<T> {
        return this.state;
    }

    configure(options: Partial<ChildrenLoaderOptions<T>>) {
        this.options = { ...this.options, ...options };
    }

    private set(id: string, status: ChildrenStatus | undefined, children?: T[], error?: unknown) {
        const omit = <V>(record: Readonly<Record<string, V>>) =>
            Object.fromEntries(Object.entries(record).filter(([key]) => key !== id)) as Record<string, V>;
        this.state = {
            status: status ? { ...this.state.status, [id]: status } : omit(this.state.status),
            children: children ? { ...this.state.children, [id]: children } : omit(this.state.children),
            errors: error !== undefined ? { ...this.state.errors, [id]: error } : omit(this.state.errors),
        };
        this.options.onChange?.(this.state);
    }

    /** Loads the children of the node unless they are loaded or loading (`force`: again, e.g. "Try again") */
    async load(node: T, settings: { force?: boolean } = {}): Promise<void> {
        const id = (this.options.key ?? idOf)(node);
        const status = this.state.status[id];
        if (!settings.force && (status === 'loading' || status === 'loaded')) return;
        this.abort(id, false);
        const controller = new AbortController();
        this.requests.set(id, controller);
        this.set(id, 'loading', this.state.children[id]);
        try {
            const children = await this.options.load(node, { signal: controller.signal });
            if (controller.signal.aborted) return;
            this.set(id, 'loaded', children);
        } catch (error) {
            if (controller.signal.aborted || isAbort(error)) return;
            this.set(id, 'error', undefined, error ?? new Error('load failed'));
        } finally {
            if (this.requests.get(id) === controller) this.requests.delete(id);
        }
    }

    /** Cancels the request of a node; it is loaded again next time */
    abort(id: string, report = true) {
        const request = this.requests.get(id);
        if (!request) return;
        request.abort();
        this.requests.delete(id);
        if (report && this.state.status[id] === 'loading') this.set(id, undefined);
    }

    /** Forgets the loaded children (of one node, or all): the next `load` asks again */
    invalidate(id?: string) {
        const ids = id === undefined ? Object.keys(this.state.status) : [id];
        for (const key of ids) {
            this.abort(key, false);
            this.set(key, undefined);
        }
    }

    /** Stops for good (unmounting) */
    dispose() {
        for (const request of this.requests.values()) request.abort();
        this.requests.clear();
        this.options = { ...this.options, onChange: undefined };
    }
}

/** A loader for a load function – see ChildrenLoader */
export const createChildrenLoader = <T extends LazyNode>(options: ChildrenLoaderOptions<T>) =>
    new ChildrenLoader(options);

/** Id of the "Try again" row shown below a node whose children failed to load */
export const treeRetryId = (parentId: string) => `${parentId}\u0000retry`;
/** The node of a retry row id – undefined for other ids */
export const treeRetryParent = (id: string): string | undefined =>
    id.endsWith('\u0000retry') ? id.slice(0, -'\u0000retry'.length) : undefined;

/** Lower case without accents: "Müller" → "muller" (search ignoring case and accents) */
export const foldText = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();

/** The text contains the query, ignoring case and accents */
export const textMatches = (text: string, query: string) => foldText(text).includes(foldText(query.trim()));

export interface TreeFilterResult {
    /** Ids of the hits, in tree order */
    matches: string[];
    /** Ids shown while filtering (hits, their ancestors and descendants); undefined: all (no query, `highlight`) */
    visible: Set<string> | undefined;
    /** Branches to open so that every hit is visible: the ancestors of the hits */
    expand: string[];
}

/**
 * Searches the tree: a node matches when its label contains the query (ignoring case and accents). In `filter`
 * mode only the hits stay, with their ancestors (opened) and their descendants; in `highlight` mode all nodes stay
 * and the hits are marked.
 */
export function filterTree<T extends HierarchyNode>(
    items: readonly T[],
    query: string,
    label: (node: T) => string,
    mode: 'filter' | 'highlight' = 'filter'
): TreeFilterResult {
    const text = query.trim();
    if (!text) return { matches: [], visible: undefined, expand: [] };
    const matches: string[] = [];
    const visible = new Set<string>();
    const expand = new Set<string>();
    const visitAll = (node: T) => {
        visible.add(node.id);
        (node.children as T[] | undefined)?.forEach(visitAll);
    };
    walkTree(items, (node, ancestors) => {
        if (!textMatches(label(node), text)) return;
        matches.push(node.id);
        for (const ancestor of ancestors) {
            visible.add(ancestor.id);
            expand.add(ancestor.id);
        }
        visitAll(node);
    });
    return { matches, visible: mode === 'filter' ? visible : undefined, expand: [...expand] };
}

/** Only the nodes in `visible` (a copy; branches keep `children` even when none of them is left) */
export function pruneTree<T extends HierarchyNode>(items: T[], visible: Set<string> | undefined): T[] {
    if (!visible) return items;
    return items
        .filter((node) => visible.has(node.id))
        .map((node) => (node.children ? { ...node, children: pruneTree(node.children as T[], visible) } : node));
}

/** Ids of all branches with children (expand all) */
export function treeBranchIds<T extends HierarchyNode>(items: readonly T[]): string[] {
    const ids: string[] = [];
    walkTree(items, (node) => {
        if (node.children?.length) ids.push(node.id);
    });
    return ids;
}

/** A visible row of a tree – what a flat (virtual) tree renders */
export interface TreeRow<T> {
    node: T;
    /** 1 = top level (aria-level) */
    level: number;
    /** Position among the siblings, 1-based (aria-posinset) */
    posinset: number;
    /** Number of siblings including the node (aria-setsize) */
    setsize: number;
    parentId: string | null;
    /** Positions from the top: [2, 0] = first child of the third top node (Ark's index path) */
    indexPath: number[];
    branch: boolean;
    expanded: boolean;
}

/** The rows of the open part of the tree, top to bottom */
export function flattenTree<T extends HierarchyNode>(items: readonly T[], expanded: Iterable<string>): TreeRow<T>[] {
    const open = new Set(expanded);
    const rows: TreeRow<T>[] = [];
    const visit = (list: readonly T[], level: number, parentId: string | null, path: number[]) => {
        list.forEach((node, index) => {
            const branch = isBranchNode(node);
            const isOpen = branch && open.has(node.id);
            const indexPath = [...path, index];
            rows.push({
                node,
                level,
                posinset: index + 1,
                setsize: list.length,
                parentId,
                indexPath,
                branch,
                expanded: isOpen,
            });
            if (isOpen && node.children) visit(node.children as T[], level + 1, node.id, indexPath);
        });
    };
    visit(items, 1, null, []);
    return rows;
}

export type TreeCheckState = boolean | 'indeterminate';
/** Which checked nodes are reported: every one, only the topmost fully checked ones, or only the leaves */
export type TreeCheckedStrategy = 'all' | 'parent' | 'child';

interface NodeIndex<T> {
    node: T;
    parent: T | undefined;
}

function indexTree<T extends HierarchyNode>(items: readonly T[]): Map<string, NodeIndex<T>> {
    const index = new Map<string, NodeIndex<T>>();
    walkTree(items, (node, ancestors) => index.set(node.id, { node, parent: ancestors.at(-1) }));
    return index;
}

const descendantIds = (node: HierarchyNode, into: Set<string>) => {
    for (const child of node.children ?? []) {
        into.add(child.id);
        descendantIds(child, into);
    }
};

/**
 * The full, consistent set of checked ids for a cascade: the descendants of a checked node are checked, a branch is
 * checked when all its (loaded) children are. A branch whose children are not loaded keeps its own state.
 */
export function cascadeTreeChecked<T extends HierarchyNode>(items: readonly T[], ids: Iterable<string>): Set<string> {
    const checked = new Set(ids);
    const index = indexTree(items);
    for (const id of [...checked]) {
        const entry = index.get(id);
        if (entry) descendantIds(entry.node, checked);
    }
    // Bottom-up: a branch with all children checked is checked, with an unchecked child it is not
    const settle = (node: T): boolean => {
        const children = node.children as T[] | undefined;
        if (!children?.length) return checked.has(node.id);
        const all = children.map(settle).every(Boolean);
        if (all) checked.add(node.id);
        else checked.delete(node.id);
        return all;
    };
    items.forEach(settle);
    return checked;
}

/**
 * Toggles the check box of a node. With `strictly` only the node changes; otherwise its descendants follow and its
 * ancestors are checked once all their children are. Returns the new checked ids in tree order.
 */
export function toggleTreeChecked<T extends HierarchyNode>(
    items: readonly T[],
    checked: Iterable<string>,
    id: string,
    strictly = false
): string[] {
    const next = strictly ? new Set(checked) : cascadeTreeChecked(items, checked);
    const on = !next.has(id);
    const entry = indexTree(items).get(id);
    const affected = new Set([id]);
    if (!strictly && entry) descendantIds(entry.node, affected);
    for (const key of affected) {
        if (on) next.add(key);
        else next.delete(key);
    }
    const result = strictly ? next : cascadeTreeChecked(items, on ? next : withoutAncestors(items, next, id));
    return orderedIds(items, result);
}

function withoutAncestors<T extends HierarchyNode>(items: readonly T[], checked: Set<string>, id: string) {
    const index = indexTree(items);
    let parent = index.get(id)?.parent;
    while (parent) {
        checked.delete(parent.id);
        parent = index.get(parent.id)?.parent;
    }
    return checked;
}

/** The ids in tree order (ids that are not in the tree, e.g. of unloaded nodes, at the end) */
function orderedIds<T extends HierarchyNode>(items: readonly T[], ids: Set<string>): string[] {
    const ordered: string[] = [];
    walkTree(items, (node) => {
        if (ids.has(node.id)) ordered.push(node.id);
    });
    const known = new Set(ordered);
    return [...ordered, ...[...ids].filter((id) => !known.has(id))];
}

/**
 * The state of every check box: `strictly` – each node by itself; otherwise a branch is checked when all its
 * children are, mixed when some are (a branch without loaded children shows its own state).
 */
export function treeCheckStates<T extends HierarchyNode>(
    items: readonly T[],
    checked: Iterable<string>,
    strictly = false
): Map<string, TreeCheckState> {
    const set = strictly ? new Set(checked) : cascadeTreeChecked(items, checked);
    const states = new Map<string, TreeCheckState>();
    const visit = (node: T): TreeCheckState => {
        const children = node.children as T[] | undefined;
        let state: TreeCheckState;
        if (strictly || !children?.length) {
            children?.forEach(visit);
            state = set.has(node.id);
        } else {
            const childStates = children.map(visit);
            state = childStates.every((value) => value === true)
                ? true
                : childStates.some((value) => value !== false)
                  ? 'indeterminate'
                  : false;
        }
        states.set(node.id, state);
        return state;
    };
    items.forEach(visit);
    return states;
}

/**
 * The checked ids as reported (`checkedStrategy`): `all` – every checked node; `parent` – a fully checked branch
 * instead of its children; `child` – only nodes without (loaded) children. In tree order.
 */
export function treeCheckedValue<T extends HierarchyNode>(
    items: readonly T[],
    checked: Iterable<string>,
    strategy: TreeCheckedStrategy = 'all',
    strictly = false
): string[] {
    const set = strictly ? new Set(checked) : cascadeTreeChecked(items, checked);
    if (strategy === 'all' || strictly) return orderedIds(items, set);
    const result: string[] = [];
    const visit = (node: T, parentChecked: boolean) => {
        const children = node.children as T[] | undefined;
        const isChecked = set.has(node.id);
        if (strategy === 'parent' && isChecked && !parentChecked) result.push(node.id);
        if (strategy === 'child' && isChecked && !children?.length) result.push(node.id);
        children?.forEach((child) => visit(child, parentChecked || isChecked));
    };
    items.forEach((node) => visit(node, false));
    const known = new Set<string>();
    walkTree(items, (node) => known.add(node.id));
    return [...result, ...[...set].filter((id) => !known.has(id))];
}

/** A selectable entry of a cascade, found by the search: the path from the top and the joined labels */
export interface CascadeMatch<T> {
    node: T;
    path: T[];
    labels: string[];
}

/**
 * Searches a cascade by the labels of the whole path ("bav mun" finds "Germany › Bavaria › Munich"): every
 * word of the query must occur in one of the labels. Only selectable entries are found – leaves, and with
 * `changeOnSelect` the levels in between, too. Disabled entries are left out. In tree order, at most `limit`.
 */
export function searchCascade<T extends { children?: T[]; disabled?: boolean }>(
    items: readonly T[],
    query: string,
    label: (node: T) => string,
    options: { changeOnSelect?: boolean; limit?: number } = {}
): CascadeMatch<T>[] {
    const words = foldText(query).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const limit = options.limit ?? 50;
    const result: CascadeMatch<T>[] = [];
    const visit = (list: readonly T[], path: T[]) => {
        for (const node of list) {
            if (result.length >= limit) return;
            const nextPath = [...path, node];
            const labels = nextPath.map(label);
            const branch = !!node.children?.length;
            const selectable = !node.disabled && (!branch || options.changeOnSelect);
            if (selectable) {
                const text = foldText(labels.join(' '));
                if (words.every((word) => text.includes(word))) result.push({ node, path: nextPath, labels });
            }
            if (node.children && !node.disabled) visit(node.children, nextPath);
        }
    };
    visit(items, []);
    return result;
}
