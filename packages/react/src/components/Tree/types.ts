import type { IconComponent } from '../../types.js';

export interface TreeNode {
    id: string;
    label: string;
    icon?: IconComponent;
    disabled?: boolean;
    children?: TreeNode[];
    /** Has children that are loaded when the node opens (`loadChildren`, `dataSource` or `onLoadChildren`) */
    hasChildren?: boolean;
    /** false: a branch whose children are loaded when it opens (like `hasChildren: true`) */
    leaf?: boolean;
}

/** State of a node, passed to `renderNode` */
export interface TreeNodeState {
    level: number;
    selected: boolean;
    expanded: boolean;
    branch: boolean;
    checked: boolean | 'indeterminate';
    /** The children are loading */
    loading: boolean;
    /** The node matches the search */
    match: boolean;
    /** The search text (to mark the hit) */
    query: string;
}

/** A node dragged or pasted from another tree of the same `group` */
export interface TreeTransfer {
    node: TreeNode;
    /** `name` of the tree the node comes from */
    sourceTree: string | undefined;
    /** `name` of the tree it goes to */
    targetTree: string | undefined;
    /** Its new parent (null: top level) and position among the parent's children */
    parentId: string | null;
    index: number;
}

export type TreeDropAllowed = (
    source: TreeNode,
    target: TreeNode | null,
    position: 'before' | 'after' | 'inside'
) => boolean;

/** A node being dragged or cut (Ctrl+X) – shared by all trees of the page, so it can go to another tree */
export interface TreeCarry {
    mode: 'drag' | 'cut';
    node: TreeNode;
    /** The tree it comes from */
    tree: symbol;
    group: string | undefined;
    name: string | undefined;
}

let carry: TreeCarry | null = null;
const listeners = new Set<() => void>();
/** The shared drag/cut state (useSyncExternalStore) */
export const treeCarry = {
    get: () => carry,
    set(next: TreeCarry | null) {
        carry = next;
        listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => void listeners.delete(listener);
    },
};
