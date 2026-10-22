import type { Component } from 'vue';

export interface TreeNode {
    id: string;
    label: string;
    icon?: Component;
    disabled?: boolean;
    children?: TreeNode[];
    /** Has children that are loaded when the node opens (`loadChildren`, `dataSource` or the `loadChildren` event) */
    hasChildren?: boolean;
    /** false: a branch whose children are loaded when it opens (like `hasChildren: true`) */
    leaf?: boolean;
}

/** State of a node, passed to the `node` slot */
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

/** The path to the node with this id (depth-first), or undefined */
export function findTreeNode<T extends { id?: string; value?: string; children?: T[] }>(
    nodes: T[],
    id: string | null | undefined,
    path: T[] = []
): T[] | undefined {
    for (const node of nodes) {
        if ((node.id ?? node.value) === id) return [...path, node];
        const found = node.children && findTreeNode(node.children, id, [...path, node]);
        if (found) return found;
    }
    return undefined;
}
