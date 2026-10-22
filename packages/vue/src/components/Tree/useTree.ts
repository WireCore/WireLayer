import { createTreeCollection } from '@ark-ui/vue/tree-view';
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, type Ref } from 'vue';
import { useLocale, useTranslations } from '../../locale.js';
import { treeCarry, type TreeDragContext } from './context.js';
import type { TreeDropAllowed, TreeNode, TreeTransfer } from './types.js';

/** The props the tree logic reads – shared by Tree and VirtualTree */
export interface TreeModelProps {
    items: TreeNode[];
    selectionMode?: 'single' | 'multiple';
    selectedValue?: string[];
    defaultSelectedValue?: string[];
    expandedValue?: string[];
    defaultExpandedValue?: string[];
    checkable?: boolean;
    checkedValue?: string[];
    defaultCheckedValue?: string[];
    checkStrictly?: boolean;
    checkedStrategy?: TreeCheckedStrategy;
    reorderable?: boolean;
    loadChildren?: (node: TreeNode, request: { signal: AbortSignal }) => Promise<TreeNode[]>;
    dataSource?: DataSource<TreeNode>;
    filter?: boolean;
    filterValue?: string;
    filterMode?: 'filter' | 'highlight';
    allowDrop?: TreeDropAllowed;
    group?: string;
    name?: string;
}

/** The events of the tree logic */
export interface TreeModelEmit {
    (event: 'update:selectedValue', ids: string[]): void;
    (event: 'update:expandedValue', ids: string[]): void;
    (event: 'update:checkedValue', ids: string[]): void;
    (event: 'update:filterValue', text: string): void;
    (event: 'move', move: TreeMove): void;
    (event: 'transfer', transfer: TreeTransfer): void;
    (event: 'loadChildren', node: TreeNode): void;
}

const find = (items: TreeNode[], id: string) => locateTreeNode(items, id)?.node;
const hasLazyNodes = (items: TreeNode[]) => {
    let found = false;
    walkTree(items, (node) => {
        if (isLazyNode(node)) found = true;
    });
    return found;
};

/**
 * State and behaviour of a tree – children loaded on demand, search, check boxes, moves within and between trees;
 * the rendering (nested in Tree, flat in VirtualTree) reads it.
 */
export function useTree(props: TreeModelProps, emit: TreeModelEmit, root: Ref<HTMLElement | null>) {
    const translations = useTranslations();
    const locale = useLocale();
    const t = translations.tree;
    const status = ref('');
    /** Identifies this tree in the shared drag/cut state */
    const self = Symbol('tree');

    // Children on demand: from loadChildren/dataSource (own loader) or the parent (loadChildren event)
    const loaded = shallowRef<ChildrenLoaderState<TreeNode>>({ status: {}, children: {}, errors: {} });
    const manual = ref(new Set<string>());
    const resolved = computed(() => withLoadedChildren(props.items, loaded.value.children));
    const label = (id: string) => find(resolved.value, id)?.label ?? id;
    const loader = new ChildrenLoader<TreeNode>({
        load: (node, request) =>
            props.loadChildren
                ? props.loadChildren(node, request)
                : props.dataSource!.getChildren!(node, request).then((result) => result.items),
        onChange: (state) => {
            const before = loaded.value.status;
            loaded.value = state;
            for (const [id, value] of Object.entries(state.status)) {
                if (before[id] === value) continue;
                if (value === 'loading') status.value = t.loadingNode(label(id));
                else if (value === 'error') status.value = t.loadError(label(id));
                else
                    status.value = pluralText(
                        t.loadedNode,
                        state.children[id]?.length ?? 0,
                        locale.value.locale
                    ).replace('{label}', label(id));
            }
        },
    });
    onBeforeUnmount(() => loader.dispose());
    const ownLoader = () => !!props.loadChildren || !!props.dataSource?.getChildren;
    /** Children of lazy nodes are loading */
    const loadingOf = (node: TreeNode) =>
        isLazyNode(node) && (loaded.value.status[node.id] === 'loading' || (!ownLoader() && manual.value.has(node.id)));
    const failed = (node: TreeNode) => isLazyNode(node) && loaded.value.status[node.id] === 'error';
    // Once lazy nodes were seen the tree keeps its own check logic (the parent may fill in children later)
    const lazySeen = ref(false);
    watch(
        () => hasLazyNodes(props.items),
        (value) => {
            if (value) lazySeen.value = true;
        },
        { immediate: true }
    );
    const lazy = computed(() => ownLoader() || lazySeen.value);

    function requestChildren(ids: string[]) {
        for (const id of ids) {
            const node = find(resolved.value, id);
            if (!node || !isLazyNode(node)) continue;
            if (ownLoader()) void loader.load(node);
            else if (!manual.value.has(id)) {
                manual.value = new Set([...manual.value, id]);
                status.value = t.loadingNode(node.label);
                emit('loadChildren', node);
            }
        }
    }
    function retry(id: string) {
        const node = find(resolved.value, id);
        if (!node) return;
        focusNode(id);
        if (ownLoader()) void loader.load(node, { force: true });
        else {
            manual.value = new Set([...manual.value, id]);
            emit('loadChildren', node);
        }
    }
    /** Forgets loaded children (of one node or all); open nodes load them again */
    function invalidate(id?: string) {
        loader.invalidate(id);
        manual.value = id === undefined ? new Set() : new Set([...manual.value].filter((key) => key !== id));
        requestChildren(id === undefined ? expanded.value : expanded.value.filter((key) => key === id));
    }

    // Expanded nodes: own state (or v-model), so search, "expand all" and loading can change them
    const expandedInternal = ref<string[]>(props.defaultExpandedValue ?? []);
    const expanded = computed(() => props.expandedValue ?? expandedInternal.value);
    function setExpanded(ids: string[]) {
        expandedInternal.value = ids;
        emit('update:expandedValue', ids);
    }
    watch(expanded, (next, previous) => requestChildren(next.filter((id) => !previous.includes(id))));
    onMounted(() => requestChildren(expanded.value));
    const expandAll = () => setExpanded(treeBranchIds(resolved.value));
    const collapseAll = () => setExpanded([]);

    // Selection: a click on a retry row loads again instead of selecting it
    const selectedInternal = ref<string[]>(props.defaultSelectedValue ?? []);
    const selected = computed(() => props.selectedValue ?? selectedInternal.value);
    function onSelectionChange(ids: string[]) {
        const retryId = ids.find((id) => treeRetryParent(id) !== undefined);
        if (retryId) return retry(treeRetryParent(retryId)!);
        selectedInternal.value = ids;
        emit('update:selectedValue', ids);
    }

    // Check boxes: Ark's cascade by default; own logic for checkStrictly, checkedStrategy and lazy children (Ark
    // would show a branch without loaded children as checked)
    const ownChecks = computed(
        () => !!props.checkable && (!!props.checkStrictly || props.checkedStrategy !== undefined || lazy.value)
    );
    const checkedInternal = ref<string[]>(props.defaultCheckedValue ?? []);
    const checkedIds = computed(() => props.checkedValue ?? checkedInternal.value);
    const checkStates = computed(() =>
        ownChecks.value ? treeCheckStates(resolved.value, checkedIds.value, props.checkStrictly) : undefined
    );
    function toggleCheck(id: string) {
        const next = toggleTreeChecked(resolved.value, checkedIds.value, id, props.checkStrictly);
        const value = treeCheckedValue(resolved.value, next, props.checkedStrategy ?? 'all', props.checkStrictly);
        checkedInternal.value = value;
        emit('update:checkedValue', value);
    }
    function onArkCheckedChange(ids: string[]) {
        checkedInternal.value = ids;
        emit('update:checkedValue', ids);
    }

    // Search: hits with their ancestors (opened); leaving the search restores the open nodes from before
    const queryInternal = ref('');
    const query = computed(() => props.filterValue ?? queryInternal.value);
    function setQuery(text: string) {
        queryInternal.value = text;
        emit('update:filterValue', text);
    }
    const filtered = computed(() =>
        filterTree(resolved.value, query.value, (node) => node.label, props.filterMode ?? 'filter')
    );
    const matches = computed(() => new Set(filtered.value.matches));
    let beforeSearch: string[] | null = null;
    function applyQuery() {
        if (!query.value.trim()) {
            if (beforeSearch) setExpanded(beforeSearch);
            beforeSearch = null;
            return;
        }
        beforeSearch ??= expanded.value;
        const open = new Set([...beforeSearch, ...filtered.value.expand]);
        setExpanded([...open]);
        const count = filtered.value.matches.length;
        status.value = count ? pluralText(t.matches, count, locale.value.locale) : t.noMatches;
    }
    watch(query, applyQuery);
    onMounted(() => query.value.trim() && applyQuery());
    let jumped = -1;
    /** Highlight mode: focuses the next (or previous) hit */
    async function jump(direction: 1 | -1 = 1) {
        const list = filtered.value.matches;
        if (!list.length) return;
        jumped = (jumped + direction + list.length) % list.length;
        await nextTick();
        focusNode(list[jumped]!);
    }
    watch(query, () => (jumped = -1));

    // What is rendered: loaded children, a retry row below failed nodes, only the hits while filtering
    const view = computed(() => {
        const withRetry = (list: TreeNode[]): TreeNode[] =>
            list.map((node) =>
                failed(node)
                    ? { ...node, children: [{ id: treeRetryId(node.id), label: t.retry }] }
                    : node.children
                      ? { ...node, children: withRetry(node.children) }
                      : node
            );
        const items = Object.keys(loaded.value.errors).length ? withRetry(resolved.value) : resolved.value;
        return pruneTree(items, filtered.value.visible);
    });
    const collection = computed(() =>
        createTreeCollection<TreeNode>({
            nodeToValue: (node) => node.id,
            nodeToString: (node) => node.label,
            isNodeDisabled: (node) => !!node.disabled,
            // A lazy node is a branch before its children are known
            nodeToChildrenCount: (node) => (isLazyNode(node) ? 1 : undefined),
            rootNode: { id: 'ROOT', label: '', children: view.value },
        })
    );

    function focusNode(id: string) {
        const element = root.value?.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`);
        const target = element?.matches('[data-part=branch]')
            ? element.querySelector<HTMLElement>(':scope > [data-part=branch-control]')
            : element;
        target?.focus();
    }

    // Moving nodes: the parent applies the move to `items`; then the moved node gets the focus back
    let focusAfterMove: string | null = null;
    watch(
        () => props.items,
        async () => {
            if (!focusAfterMove) return;
            const id = focusAfterMove;
            focusAfterMove = null;
            await nextTick();
            focusNode(id);
        }
    );
    const siblingsCount = (parentId: string | null, without: string) =>
        (parentId ? (find(resolved.value, parentId)?.children ?? []) : resolved.value).filter(
            (item) => item.id !== without
        ).length + 1;
    const allowed = (source: TreeNode | undefined, move: { parentId: string | null; index: number; id: string }) => {
        if (!source || !props.allowDrop) return true;
        const anchor = treeMoveAnchor(resolved.value, move);
        return props.allowDrop(source, anchor.target, anchor.position);
    };
    function emitMove(move: TreeMove | undefined) {
        if (!move) return;
        if (!allowed(find(resolved.value, move.id), move)) {
            status.value = t.dropDenied;
            return;
        }
        const parent = move.parentId ? label(move.parentId) : null;
        status.value = t.moved(label(move.id), parent, move.index + 1, siblingsCount(move.parentId, move.id));
        focusAfterMove = move.id;
        // Loaded children are not in the parent's items: the move carries the whole tree after it
        emit(
            'move',
            Object.keys(loaded.value.children).length ? { ...move, items: moveTreeNode(resolved.value, move) } : move
        );
    }
    function emitTransfer(
        node: TreeNode,
        sourceTree: string | undefined,
        target: { parentId: string | null; index: number }
    ) {
        const parent = target.parentId ? label(target.parentId) : null;
        status.value = t.moved(node.label, parent, target.index + 1, siblingsCount(target.parentId, node.id));
        focusAfterMove = node.id;
        emit('transfer', { node, sourceTree, targetTree: props.name, ...target });
    }

    // Another tree of the same group carries a node (drag or cut)
    const foreign = (mode: 'drag' | 'cut') => {
        const carry = treeCarry.value;
        return carry &&
            carry.mode === mode &&
            carry.tree !== self &&
            props.group !== undefined &&
            carry.group === props.group
            ? carry
            : null;
    };
    const cutId = computed(() =>
        treeCarry.value?.mode === 'cut' && treeCarry.value.tree === self ? treeCarry.value.node.id : null
    );
    /** Where a paste on this node puts the carried one: into an open-able branch, otherwise after it */
    const pastePosition = (node: TreeNode): TreeDropPosition => (node.children ? 'inside' : 'after');
    function paste(targetId: string) {
        const carry = treeCarry.value;
        if (!carry || carry.mode !== 'cut') return false;
        const target = find(resolved.value, targetId);
        if (!target) return false;
        const position = pastePosition(target);
        if (props.allowDrop && !props.allowDrop(carry.node, target, position)) {
            status.value = t.dropDenied;
            return true;
        }
        if (carry.tree === self) {
            if (!props.reorderable) return false;
            const move = treeDropMove(resolved.value, carry.node.id, targetId, position);
            if (!move) status.value = t.dropDenied;
            else emitMove(move);
        } else {
            if (!foreign('cut')) return false;
            const at = treeInsertPosition(resolved.value, targetId, position);
            if (at) emitTransfer(carry.node, carry.name, at);
        }
        treeCarry.value = null;
        return true;
    }

    // Space on a focused node clicks its checkbox – Ark's tree only selects with Space
    function toggleCheckedOnSpace(event: KeyboardEvent) {
        if (!props.checkable || event.key !== ' ' || event.altKey) return;
        const checkbox = (event.target as HTMLElement).querySelector<HTMLElement>(
            ':scope > [data-part="node-checkbox"]'
        );
        if (!checkbox) return;
        event.preventDefault();
        event.stopPropagation();
        checkbox.click();
    }
    const moveKeys: Record<string, 'up' | 'down' | 'in' | 'out'> = { ArrowUp: 'up', ArrowDown: 'down' };
    const movable = computed(() => props.reorderable || props.group !== undefined);
    function onKeydown(event: KeyboardEvent) {
        toggleCheckedOnSpace(event);
        const id = (event.target as HTMLElement).closest<HTMLElement>('[data-node-id]')?.dataset.nodeId;
        if (!id || treeRetryParent(id) !== undefined) return;
        const command = event.ctrlKey || event.metaKey;
        if (movable.value && command && !event.altKey && (event.key === 'x' || event.key === 'X')) {
            const node = find(resolved.value, id);
            if (!node || node.disabled) return;
            event.preventDefault();
            treeCarry.value = { mode: 'cut', node, tree: self, group: props.group, name: props.name };
            status.value = t.cut(node.label);
            return;
        }
        if (command && !event.altKey && (event.key === 'v' || event.key === 'V')) {
            if (paste(id)) event.preventDefault();
            return;
        }
        if (event.key === 'Escape' && cutId.value) {
            event.preventDefault();
            event.stopPropagation();
            treeCarry.value = null;
            status.value = t.cutCancelled;
            return;
        }
        if (!props.reorderable || !event.altKey) return;
        const rtl = locale.value.dir === 'rtl';
        const direction =
            moveKeys[event.key] ??
            (event.key === 'ArrowRight'
                ? rtl
                    ? 'out'
                    : 'in'
                : event.key === 'ArrowLeft'
                  ? rtl
                      ? 'in'
                      : 'out'
                  : undefined);
        if (!direction) return;
        event.preventDefault();
        event.stopPropagation();
        emitMove(treeKeyboardMove(resolved.value, id, direction));
    }

    // Drag and drop: within the tree (reorderable) and between trees of the same group
    const dragging = ref<string | null>(null);
    const drop = ref<{ id: string; position: TreeDropPosition } | null>(null);
    function dropPosition(event: DragEvent, branch: boolean): TreeDropPosition {
        const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const share = (event.clientY - box.top) / box.height;
        if (!branch) return share < 0.5 ? 'before' : 'after';
        return share < 0.25 ? 'before' : share > 0.75 ? 'after' : 'inside';
    }
    const drag: TreeDragContext = {
        reorderable: computed(() => props.reorderable || props.group !== undefined),
        dragging,
        drop,
        onDragStart(id, event) {
            const node = find(resolved.value, id);
            if (!node) return;
            dragging.value = id;
            treeCarry.value = { mode: 'drag', node, tree: self, group: props.group, name: props.name };
            event.dataTransfer?.setData('text/plain', node.label);
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        },
        onDragOver(id, branch, event) {
            const carry = foreign('drag');
            if ((!dragging.value || !props.reorderable) && !carry) return;
            if (dragging.value === id) return;
            // A closed folder whose children are not loaded yet: they load while the node hovers over it
            const hovered = find(resolved.value, id);
            if (hovered && isLazyNode(hovered)) requestChildren([id]);
            const position = dropPosition(event, branch);
            const source = carry ? carry.node : find(resolved.value, dragging.value!);
            const possible = carry
                ? treeInsertPosition(resolved.value, id, position)
                : treeDropMove(resolved.value, dragging.value!, id, position);
            const target = find(resolved.value, id) ?? null;
            if (!possible || !source || (props.allowDrop && !props.allowDrop(source, target, position))) {
                drop.value = null;
                return;
            }
            event.preventDefault();
            drop.value = { id, position };
        },
        onDrop(event) {
            event.preventDefault();
            const carry = foreign('drag');
            if (drop.value && dragging.value && props.reorderable)
                emitMove(treeDropMove(resolved.value, dragging.value, drop.value.id, drop.value.position));
            else if (drop.value && carry) {
                const at = treeInsertPosition(resolved.value, drop.value.id, drop.value.position);
                if (at) emitTransfer(carry.node, carry.name, at);
            }
            dragging.value = null;
            drop.value = null;
        },
        onDragEnd() {
            dragging.value = null;
            drop.value = null;
            if (treeCarry.value?.mode === 'drag') treeCarry.value = null;
        },
    };
    /** Dropping on an empty tree: to the top level */
    function onEmptyDragOver(event: DragEvent) {
        const carry = foreign('drag');
        if (!carry || (props.allowDrop && !props.allowDrop(carry.node, null, 'inside'))) return;
        event.preventDefault();
    }
    function onEmptyDrop(event: DragEvent) {
        const carry = foreign('drag');
        if (!carry) return;
        event.preventDefault();
        emitTransfer(carry.node, carry.name, { parentId: null, index: 0 });
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
        checkedIds,
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
        onKeydown,
        drag,
        cutId,
        onEmptyDragOver,
        onEmptyDrop,
        focusNode,
    };
}

export type TreeModel = ReturnType<typeof useTree>;
