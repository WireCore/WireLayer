import { ref, type InjectionKey, type Ref } from 'vue';
import type { TreeNode } from './types.js';
import type { TreeModel } from './useTree.js';

/** Drag and drop state of a reorderable tree, shared with the nodes */
export interface TreeDragContext {
    reorderable: Ref<boolean>;
    dragging: Ref<string | null>;
    drop: Ref<{ id: string; position: 'before' | 'after' | 'inside' } | null>;
    onDragStart: (id: string, event: DragEvent) => void;
    onDragOver: (id: string, branch: boolean, event: DragEvent) => void;
    onDrop: (event: DragEvent) => void;
    onDragEnd: () => void;
}

export const treeDragKey: InjectionKey<TreeDragContext> = Symbol('TreeDrag');

/** The tree's state for its nodes: check boxes, loading, search hits, cut node */
export const treeModelKey: InjectionKey<TreeModel & { showLines: Ref<boolean> }> = Symbol('TreeModel');

/** A node being dragged or cut (Ctrl+X) – shared by all trees of the page, so it can go to another tree */
export interface TreeCarry {
    mode: 'drag' | 'cut';
    node: TreeNode;
    /** The tree it comes from */
    tree: symbol;
    group: string | undefined;
    name: string | undefined;
}
export const treeCarry = ref<TreeCarry | null>(null) as Ref<TreeCarry | null>;
