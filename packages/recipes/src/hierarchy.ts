import { listboxContent, listboxItem, listboxPanel, listboxParts, selectFieldParts } from './navigation.js';
import { popupMotion, tv } from './tv.js';

// Hierarchical data: tree, tree select and cascade select. Ark sets the depth of a node as --depth (1 = top).

const focusRing = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg';

/** Select-like trigger shared by TreeSelect and CascadeSelect */
const trigger = [
    'flex h-10 w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-line-strong bg-bg pe-2.5 ps-3 text-start text-[15px] text-fg',
    'outline-none transition-colors motion-reduce:transition-none focus-visible:border-primary data-[state=open]:border-primary',
    'data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2 data-disabled:text-muted',
];

export const tree = tv({
    slots: {
        base: 'flex flex-col gap-1.5',
        label: 'text-[13px] font-medium text-fg',
        tree: 'flex flex-col',
        // Branch rows have a chevron; leaves are indented by its width so the texts line up
        branch: [
            'flex h-8 cursor-pointer items-center gap-2 rounded-md pe-2 ps-[calc((var(--depth)-1)*20px+8px)] text-sm text-fg select-none',
            'hover:bg-bg-2 data-selected:bg-line data-disabled:cursor-not-allowed data-disabled:opacity-40',
            focusRing,
            'forced-colors:data-selected:forced-color-adjust-none forced-colors:data-selected:bg-[Highlight] forced-colors:data-selected:text-[HighlightText]',
        ],
        item: [
            'flex h-8 cursor-pointer items-center gap-2 rounded-md pe-2 ps-[calc((var(--depth)-1)*20px+32px)] text-sm text-fg select-none',
            'hover:bg-bg-2 data-selected:bg-line data-disabled:cursor-not-allowed data-disabled:opacity-40',
            focusRing,
            'forced-colors:data-selected:forced-color-adjust-none forced-colors:data-selected:bg-[Highlight] forced-colors:data-selected:text-[HighlightText]',
        ],
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-90 rtl:not-data-[state=open]:-scale-x-100',
        indicatorIcon: 'size-full',
        icon: 'size-4 shrink-0 text-muted',
        text: 'min-w-0 flex-1 truncate',
        checkbox: [
            'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-line-strong text-on-primary',
            'data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
        ],
        checkboxIcon: 'size-3 stroke-3',
        /** Drop position while dragging a node (`reorderable`); dragged node faded */
        dropTarget: [
            'data-[drop=before]:shadow-[inset_0_2px_0_var(--wc-primary)] data-[drop=after]:shadow-[inset_0_-2px_0_var(--wc-primary)]',
            'data-[drop=inside]:bg-primary/10 data-[drop=inside]:shadow-[inset_0_0_0_1px_var(--wc-primary)] data-dragging:opacity-50',
            // Cut with Ctrl+X, waiting to be pasted
            'data-cut:opacity-60 data-cut:outline-1 data-cut:outline-dashed data-cut:-outline-offset-1 data-cut:outline-muted',
        ],
        /** Announces moved nodes, loading and search hits */
        status: 'sr-only',
        /** Search field and expand/collapse buttons above the tree */
        toolbar: 'flex flex-wrap items-center gap-1.5',
        search: [
            'h-8 min-w-0 flex-1 rounded-md border border-line-strong bg-bg px-2.5 text-sm text-fg outline-none',
            'placeholder:text-muted focus:border-primary',
        ],
        /** Row below a branch while its children load (indented like its children) */
        loadingRow: 'flex h-8 items-center gap-2 pe-2 ps-[calc(var(--depth)*20px+32px)] text-sm text-muted',
        loadingIcon: 'size-4 shrink-0 motion-safe:animate-spin',
        /** "Try again" row of a branch whose children failed to load */
        retry: 'text-danger',
        retryIcon: 'size-4 shrink-0',
        /** Nothing to show (no items, or no hits) */
        empty: 'px-2 py-3 text-sm text-muted',
        /** Guide line along the children of an open branch (`showLines`) */
        lines: [
            'relative before:pointer-events-none before:absolute before:inset-y-0 before:w-px before:bg-line-2 before:content-[""]',
            'before:inset-s-[calc((var(--depth)-1)*20px+15.5px)] forced-colors:before:bg-[CanvasText]',
        ],
        /** VirtualTree: the scrolling tree, the full-height spacer and one absolutely placed row */
        viewport: 'overflow-y-auto overscroll-contain rounded-md outline-none',
        // shrink-0: in the flex column of the tree the spacer would shrink to the viewport
        spacer: 'relative w-full shrink-0',
        row: 'absolute top-0 inset-s-0 w-full',
    },
});

/** Where a node goes: its new parent (null: top level) and position among the parent's children */
export interface TreeMove {
    id: string;
    parentId: string | null;
    /** Position in the parent's children, counted without the moved node */
    index: number;
    /**
     * Tree with children loaded by `loadChildren`/`dataSource`: the whole tree after the move, loaded children
     * included (the parent's items do not have them) – moveTreeNode returns it
     */
    items?: { id: string; children?: unknown[] }[];
}

interface TreeLike {
    id: string;
    children?: TreeLike[];
}

/** Parent id, position and siblings of the node with this id */
export function locateTreeNode<T extends TreeLike>(
    items: T[],
    id: string,
    parentId: string | null = null
): { node: T; parentId: string | null; index: number; siblings: T[] } | undefined {
    for (const [index, node] of items.entries()) {
        if (node.id === id) return { node, parentId, index, siblings: items };
        const found = node.children && locateTreeNode(node.children as T[], id, node.id);
        if (found) return found;
    }
    return undefined;
}

const contains = (node: TreeLike, id: string): boolean =>
    node.id === id || !!node.children?.some((child) => contains(child, id));

/**
 * The items with the node moved – a copy, the input stays as it is. Apply it after a `move` event; a move that carries
 * the whole tree (`items`, trees with loaded children) gives that.
 */
export function moveTreeNode<T extends TreeLike>(items: T[], move: TreeMove): T[] {
    if (move.items) return move.items as T[];
    const found = locateTreeNode(items, move.id);
    if (!found) return items;
    const remove = (list: T[]): T[] =>
        list
            .filter((node) => node.id !== move.id)
            .map((node) => (node.children ? { ...node, children: remove(node.children as T[]) } : node));
    const insert = (list: T[], parentId: string | null): T[] => {
        if (parentId === move.parentId) {
            const next = [...list];
            next.splice(Math.max(0, Math.min(move.index, next.length)), 0, found.node);
            return next;
        }
        return list.map((node) =>
            node.children || node.id === move.parentId
                ? { ...node, children: insert((node.children ?? []) as T[], node.id) }
                : node
        );
    };
    return insert(remove(items), null);
}

/**
 * Move by keyboard (Alt+arrow keys on a node): up/down among its siblings, `in` into the branch above it (as last
 * child), `out` behind its parent. Undefined when the node cannot go there.
 */
export function treeKeyboardMove<T extends TreeLike>(
    items: T[],
    id: string,
    direction: 'up' | 'down' | 'in' | 'out'
): TreeMove | undefined {
    const found = locateTreeNode(items, id);
    if (!found) return undefined;
    const { parentId, index, siblings } = found;
    if (direction === 'up') return index > 0 ? { id, parentId, index: index - 1 } : undefined;
    if (direction === 'down') return index < siblings.length - 1 ? { id, parentId, index: index + 1 } : undefined;
    if (direction === 'in') {
        const above = siblings[index - 1];
        return above?.children ? { id, parentId: above.id, index: above.children.length } : undefined;
    }
    if (parentId === null) return undefined;
    const parent = locateTreeNode(items, parentId)!;
    return { id, parentId: parent.parentId, index: parent.index + 1 };
}

/** Move by drag and drop: before, after or inside (branches only) the target. Undefined for a drop into itself. */
export function treeDropMove<T extends TreeLike>(
    items: T[],
    id: string,
    targetId: string,
    position: 'before' | 'after' | 'inside'
): TreeMove | undefined {
    const dragged = locateTreeNode(items, id);
    const target = locateTreeNode(items, targetId);
    if (!dragged || !target || contains(dragged.node, targetId)) return undefined;
    if (position === 'inside') {
        if (!target.node.children) return undefined;
        const children = target.node.children.filter((child) => child.id !== id);
        return { id, parentId: targetId, index: children.length };
    }
    const siblings = target.siblings.filter((node) => node.id !== id);
    const at = siblings.findIndex((node) => node.id === targetId);
    return { id, parentId: target.parentId, index: position === 'before' ? at : at + 1 };
}

/** Chips inside a select field (TreeSelect with several values) – like MultiSelect `display: 'chips'` */
const chipParts = {
    chipsControl: [
        'relative flex min-h-10 w-full flex-wrap items-center gap-1 rounded-lg border border-line-strong bg-bg py-[5px] pe-2.5 ps-1.5 text-fg',
        'transition-colors motion-reduce:transition-none focus-within:border-primary data-[state=open]:border-primary',
        'data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2 data-disabled:text-muted',
    ],
    chipsTrigger: [
        'flex h-7 min-w-16 flex-1 cursor-pointer items-center justify-between gap-2.5 ps-1.5 text-start text-[15px] text-fg outline-none',
        'data-disabled:cursor-not-allowed data-disabled:text-muted',
    ],
    chip: 'inline-flex h-7 max-w-full min-w-0 items-center gap-1 rounded-md bg-line pe-0.5 ps-2 text-sm text-fg',
    chipText: 'truncate',
    chipRemove: [
        'flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-current opacity-70 hover:opacity-100',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
    ],
    chipRemoveIcon: 'size-3.5',
    /** "+3": the selected nodes beyond `maxShown` */
    chipMore: 'inline-flex h-7 items-center rounded-md bg-line px-2 text-sm text-muted tabular-nums',
    chipsClear: [
        'flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted',
        'hover:bg-line hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
    ],
    hiddenValue: 'sr-only',
};

const fieldSizes = {
    sm: { trigger: 'h-8 rounded-md ps-2.5 pe-2 text-[13px]' },
    lg: { trigger: 'h-12 rounded-[10px] ps-4 pe-3 text-base' },
};

/** The items without the node with this id (a copy) – the source side of a `transfer` between trees */
export function removeTreeNode<T extends TreeLike>(items: T[], id: string): T[] {
    return items
        .filter((node) => node.id !== id)
        .map((node) => (node.children ? { ...node, children: removeTreeNode(node.children as T[], id) } : node));
}

/** The items with the node put in at the parent (null: top level) and position (a copy) – the target side */
export function insertTreeNode<T extends TreeLike>(items: T[], node: T, parentId: string | null, index: number): T[] {
    const put = (list: T[]) => [...list.slice(0, index), node, ...list.slice(index)];
    if (parentId === null) return put(items);
    return items.map((item) =>
        item.id === parentId
            ? { ...item, children: put((item.children ?? []) as T[]) }
            : item.children
              ? { ...item, children: insertTreeNode(item.children as T[], node, parentId, index) }
              : item
    );
}

export type TreeDropPosition = 'before' | 'after' | 'inside';

/**
 * Where a node dropped before, after or inside (branches only) a target lands: its new parent and position
 * (counted without `movingId`, the node itself when it comes from the same tree). Undefined for an impossible drop.
 */
export function treeInsertPosition<T extends TreeLike>(
    items: T[],
    targetId: string,
    position: TreeDropPosition,
    movingId?: string
): { parentId: string | null; index: number } | undefined {
    const target = locateTreeNode(items, targetId);
    if (!target) return undefined;
    if (position === 'inside') {
        if (!target.node.children) return undefined;
        return { parentId: targetId, index: target.node.children.filter((child) => child.id !== movingId).length };
    }
    const siblings = target.siblings.filter((node) => node.id !== movingId);
    const at = siblings.findIndex((node) => node.id === targetId);
    return { parentId: target.parentId, index: position === 'before' ? at : at + 1 };
}

/**
 * The node and side a move goes to – for `allowDrop(source, target, position)`: before the node now at the new
 * index, after the last sibling, or inside an empty parent (null target: the top level).
 */
export function treeMoveAnchor<T extends TreeLike>(
    items: T[],
    move: TreeMove
): { target: T | null; position: TreeDropPosition } {
    const parent = move.parentId ? (locateTreeNode(items, move.parentId)?.node ?? null) : null;
    const siblings = ((parent ? parent.children : items) ?? []).filter((node) => node.id !== move.id) as T[];
    const before = siblings[move.index];
    if (before) return { target: before, position: 'before' };
    const last = siblings.at(-1);
    if (last) return { target: last, position: 'after' };
    return { target: parent, position: 'inside' };
}

export const treeSelect = tv({
    slots: {
        base: 'flex w-full flex-col',
        trigger,
        value: 'min-w-0 truncate data-placeholder-shown:text-muted',
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-180',
        content: [
            'max-h-80 w-[var(--reference-width)] overflow-y-auto rounded-[10px] border border-line-2 bg-card p-1 text-fg outline-none',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            ...popupMotion,
        ],
        /** Wraps trigger and clear button (clearable) */
        control: 'relative flex',
        ...selectFieldParts,
        ...chipParts,
        header: listboxPanel.header,
        search: listboxPanel.search,
        loading: listboxParts.loading,
        loadingIcon: listboxParts.loadingIcon,
        status: 'sr-only',
    },
    variants: {
        size: {
            sm: { ...fieldSizes.sm, chipsControl: 'min-h-8 rounded-md py-0.5', chipsTrigger: 'text-[13px]' },
            md: {},
            lg: { ...fieldSizes.lg, chipsControl: 'min-h-12 rounded-[10px] py-[9px]', chipsTrigger: 'text-base' },
        },
        // Room for the clear button between value and arrow
        clearable: {
            true: { indicator: 'ms-7' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const cascadeSelect = tv({
    slots: {
        base: 'flex w-full flex-col',
        trigger,
        value: 'min-w-0 truncate data-placeholder-shown:text-muted',
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-180',
        indicatorIcon: 'size-full',
        // Narrow enough for three or four levels side by side (a level that finds no room beside its parent flips
        // to the left and would cover the level before)
        content: [...listboxContent, 'min-w-44 max-w-72'],
        item: listboxItem,
        icon: 'size-4 shrink-0 text-muted',
        text: 'min-w-0 flex-1 truncate',
        submenuIcon: 'size-4 shrink-0 text-muted rtl:-scale-x-100',
        check: 'size-[15px] shrink-0',
        /** Wraps trigger and clear button (clearable), or search field and levels button (filter) */
        control: 'relative flex',
        ...selectFieldParts,
        /** Search field (filter): the field itself, the levels button at its end */
        searchControl: [
            'flex h-10 w-full items-center gap-1 rounded-lg border border-line-strong bg-bg pe-1 ps-3 text-[15px] text-fg',
            'transition-colors motion-reduce:transition-none focus-within:border-primary',
            'data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2 data-disabled:text-muted',
        ],
        searchInput:
            'h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted disabled:cursor-not-allowed',
        levelsTrigger: [
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-line hover:text-fg',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed',
        ],
        /** Hits of the search: the whole path, the searched words marked */
        results: [...listboxContent, 'w-[var(--reference-width)] min-w-56'],
        path: 'min-w-0 flex-1 truncate',
        empty: listboxParts.empty,
        loadingIcon: listboxParts.loadingIcon,
        /** "Try again" entry of a level that failed to load */
        retry: 'text-danger',
        /** Announces loading levels */
        status: 'sr-only',
    },
    variants: {
        size: {
            sm: { ...fieldSizes.sm, searchControl: 'h-8 rounded-md ps-2.5 text-[13px]', levelsTrigger: 'size-6' },
            md: {},
            lg: { ...fieldSizes.lg, searchControl: 'h-12 rounded-[10px] ps-4 text-base' },
        },
        clearable: {
            true: { indicator: 'ms-7' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});
