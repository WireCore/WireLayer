import type { IconComponent } from '../../utils/Icon.js';

/** A node of a Tree or TreeSelect – the same shape as in @wirecore/wirelayer-react */
export interface TreeNode {
    id: string;
    label: string;
    /** Icon component shown before the label */
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
    /** 1 = top level */
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

/** Methods of a Tree (ref) */
export interface TreeHandle {
    /** Opens every branch whose children are known */
    expandAll(): void;
    collapseAll(): void;
    /** Forgets loaded children (of one node or all); open nodes load them again */
    invalidate(id?: string): void;
    /** Scrolls to a visible node and moves the focus (screen reader focus on iOS/Android) to it */
    focusNode(id: string): void;
}

/** The path from the top to the node with this id (the node last) – undefined when it is not in the tree */
export function findTreePath<T extends { id: string; children?: T[] }>(
    nodes: readonly T[],
    id: string | null | undefined,
    path: T[] = []
): T[] | undefined {
    if (id === null || id === undefined) return undefined;
    for (const node of nodes) {
        if (node.id === id) return [...path, node];
        const found = node.children && findTreePath(node.children, id, [...path, node]);
        if (found) return found;
    }
    return undefined;
}
