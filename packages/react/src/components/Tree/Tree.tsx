import { TreeView as ArkTreeView } from '@ark-ui/react/tree-view';
import {
    isLazyNode,
    tree as treeRecipe,
    treeRetryParent,
    type DataSource,
    type RecipeClasses,
    type TreeCheckedStrategy,
    type TreeCheckState,
    type TreeMove,
} from '@wirecore/wirelayer-recipes';
import { Check, ChevronRight, LoaderCircle, Minus, RotateCw } from 'lucide-react';
import {
    createContext,
    useContext,
    useImperativeHandle,
    useRef,
    type CSSProperties,
    type DragEvent,
    type KeyboardEvent,
    type ReactNode,
    type Ref,
} from 'react';
import { Button } from '../Button/Button.js';
import { Highlight } from '../Highlight/Highlight.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import type { TreeDropAllowed, TreeNode, TreeNodeState, TreeTransfer } from './types.js';
import { useTree, type TreeModel } from './useTree.js';

export type { TreeDropAllowed, TreeNode, TreeNodeState, TreeTransfer } from './types.js';

export interface TreeProps {
    items: readonly TreeNode[];
    /** Visible label, also the tree's accessible name */
    label?: string;
    /** Accessible name without a visible label */
    'aria-label'?: string;
    selectionMode?: 'single' | 'multiple';
    selectedValue?: string[];
    defaultSelectedValue?: string[];
    onSelectionChange?: (ids: string[]) => void;
    expandedValue?: string[];
    defaultExpandedValue?: string[];
    onExpandedChange?: (ids: string[]) => void;
    /** A checkbox per node; checking a branch checks its children */
    checkable?: boolean;
    checkedValue?: string[];
    defaultCheckedValue?: string[];
    onCheckedChange?: (ids: string[]) => void;
    /** Check boxes of parents and children are independent (no cascade) */
    checkStrictly?: boolean;
    /**
     * Which checked ids are reported: `all` – every checked node, `parent` – a fully checked branch instead of its
     * children, `child` – only nodes without children. Without it the ids are reported as Ark keeps them.
     */
    checkedStrategy?: TreeCheckedStrategy;
    /**
     * Nodes can be moved: drag and drop (before, after or into a branch), Alt+arrow keys on the focused node
     * (up/down among the siblings, right into the branch above, left out of the branch), or Ctrl+X and Ctrl+V.
     * Reported via `onMove`.
     */
    reorderable?: boolean;
    /** A node was moved – apply it with moveTreeNode(items, move) */
    onMove?: (move: TreeMove) => void;
    /** Decides whether a node may go before, after or into another one (drag and drop, keyboard, paste) */
    allowDrop?: TreeDropAllowed;
    /**
     * Trees with the same group exchange nodes: drag and drop, or Ctrl+X in one tree and Ctrl+V in the other.
     * The receiving tree reports `onTransfer`; the parent moves the node between the items.
     */
    group?: string;
    /** Identifies this tree in `onTransfer` events (sourceTree/targetTree) */
    name?: string;
    /** A node of another tree (same group) was dropped or pasted here – move it between the items */
    onTransfer?: (transfer: TreeTransfer) => void;
    /**
     * Loads the children of a node with `hasChildren: true` (or `leaf: false`) when it opens; the signal aborts
     * it. Without it (and without `dataSource`) the tree calls `onLoadChildren` and the parent adds the children.
     */
    loadChildren?: (node: TreeNode, request: { signal: AbortSignal }) => Promise<TreeNode[]>;
    /** A lazy node opened and there is no loadChildren/dataSource: add its children to the items */
    onLoadChildren?: (node: TreeNode) => void;
    /** Source of the children of lazy nodes (`getChildren`) */
    dataSource?: DataSource<TreeNode>;
    /** Search field above the tree; hits stay with their ancestors (opened), hits are marked */
    filter?: boolean;
    /** Search text – controlled, or set it from a search field of your own */
    filterValue?: string;
    onFilterValueChange?: (text: string) => void;
    /** `filter`: only the hits and their ancestors stay; `highlight`: all nodes stay, Enter jumps to the next hit */
    filterMode?: 'filter' | 'highlight';
    /** Buttons "Expand all" and "Collapse all" above the tree */
    expandControls?: boolean;
    /** Guide lines along the children of open branches */
    showLines?: boolean;
    /** Content of a node (instead of icon and label); chevron and check box stay */
    renderNode?: (node: TreeNode, state: TreeNodeState) => ReactNode;
    /** Shown without nodes (or without hits) */
    emptyText?: string;
    /** Replaces the text shown without nodes or hits */
    empty?: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof treeRecipe>;
    /** Methods: expandAll, collapseAll, invalidate, focusNode */
    ref?: Ref<TreeHandle>;
}

/** Methods of a Tree (ref) */
export interface TreeHandle {
    /** Opens every branch whose children are known */
    expandAll(): void;
    collapseAll(): void;
    /** Forgets loaded children (of one node or all); open nodes load them again */
    invalidate(id?: string): void;
    /** Moves the focus to a node */
    focusNode(id: string): void;
}

interface NodeContext {
    model: TreeModel;
    checkable: boolean;
    showLines: boolean;
    renderNode?: TreeProps['renderNode'];
}
const TreeNodes = createContext<NodeContext | null>(null);

/**
 * Tree (role="tree"): arrow keys move and open/close, Enter/Space select, typing jumps to a node.
 * With `checkable`, Space checks the focused node instead (aria-checked on the treeitem).
 */
export function Tree({
    classes,
    items,
    label,
    'aria-label': ariaLabel,
    selectionMode = 'single',
    checkable = false,
    checkStrictly = false,
    checkedValue,
    defaultCheckedValue,
    reorderable = false,
    filter = false,
    filterMode = 'filter',
    expandControls = false,
    showLines = false,
    renderNode,
    emptyText,
    empty,
    className,
    style,
    ref,
    ...rest
}: TreeProps) {
    const tree = useRecipe('tree', treeRecipe, classes);
    const styles = tree();
    const translations = useTranslations();
    const t = translations.tree;
    const root = useRef<HTMLDivElement>(null);
    const model = useTree(
        { ...rest, items, checkable, checkStrictly, checkedValue, defaultCheckedValue, reorderable, filterMode },
        root
    );
    useImperativeHandle(ref, () => ({
        expandAll: model.expandAll,
        collapseAll: model.collapseAll,
        invalidate: model.invalidate,
        focusNode: model.focusNode,
    }));
    const searching = filter || rest.filterValue !== undefined;
    const emptyTextShown =
        emptyText ??
        (model.query.trim() ? t.noMatches : rest.group !== undefined ? translations.common.empty : undefined);
    const showEmpty = !model.view.length && (emptyTextShown !== undefined || !!empty || rest.group !== undefined);
    const announces = reorderable || model.lazy || searching || rest.group !== undefined;

    return (
        <ArkTreeView.Root
            ref={root}
            className={styles.base({ class: className })}
            style={style}
            collection={model.collection}
            selectionMode={selectionMode}
            selectedValue={model.selected}
            onSelectionChange={(details) => model.onSelectionChange(details.selectedValue)}
            expandedValue={model.expanded}
            onExpandedChange={(details) => model.setExpanded(details.expandedValue)}
            {...(model.ownChecks ? {} : { checkedValue, defaultCheckedValue })}
            onCheckedChange={(details) => model.ownChecks || model.onArkCheckedChange(details.checkedValue)}
            translations={{ treeLabel: label ?? ariaLabel ?? translations.tree.treeLabel }}
            onKeyDownCapture={model.onKeyDown}
        >
            {label && <ArkTreeView.Label className={styles.label()}>{label}</ArkTreeView.Label>}
            <TreeToolbar
                model={model}
                filter={filter}
                filterMode={filterMode}
                expandControls={expandControls}
                classes={classes}
            />
            <TreeNodes value={{ model, checkable, showLines, renderNode }}>
                <ArkTreeView.Tree className={styles.tree()} hidden={showEmpty || undefined}>
                    {model.view.map((node, index) => (
                        <TreeNodeView key={node.id} node={node} indexPath={[index]} />
                    ))}
                </ArkTreeView.Tree>
            </TreeNodes>
            {showEmpty && (
                <div className={styles.empty()} onDragOver={model.onEmptyDragOver} onDrop={model.onEmptyDrop}>
                    {empty ?? emptyTextShown}
                </div>
            )}
            {announces && (
                <p role="status" className={styles.status()}>
                    {model.status}
                </p>
            )}
        </ArkTreeView.Root>
    );
}

/** Search field and expand/collapse buttons above a tree (Tree, VirtualTree) */
export function TreeToolbar({
    model,
    filter,
    filterMode,
    expandControls,
    classes,
}: {
    model: TreeModel;
    filter: boolean;
    filterMode: 'filter' | 'highlight';
    expandControls: boolean;
    classes?: RecipeClasses<typeof treeRecipe>;
}) {
    const tree = useRecipe('tree', treeRecipe, classes);
    const styles = tree();
    const translations = useTranslations();
    const t = translations.tree;
    if (!filter && !expandControls) return null;
    const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter' || filterMode !== 'highlight') return;
        event.preventDefault();
        model.jump(event.shiftKey ? -1 : 1);
    };
    return (
        <div className={styles.toolbar()}>
            {filter && (
                <input
                    type="search"
                    autoComplete="off"
                    className={styles.search()}
                    aria-label={t.filter}
                    placeholder={translations.combobox.search}
                    value={model.query}
                    onChange={(event) => model.setQuery(event.target.value)}
                    onKeyDown={onSearchKeyDown}
                />
            )}
            {expandControls && (
                <>
                    <Button variant="text" size="sm" onClick={model.expandAll}>
                        {t.expandAll}
                    </Button>
                    <Button variant="text" size="sm" onClick={model.collapseAll}>
                        {t.collapseAll}
                    </Button>
                </>
            )}
        </div>
    );
}

const moveKeys = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight';
const ariaChecked = (checked: TreeCheckState) => (checked === 'indeterminate' ? 'mixed' : checked);

/** Only visual: the treeitem carries the state (aria-checked), a checkbox inside it would be a nested control */
function NodeCheckbox({ own, checked, onToggle }: { own: boolean; checked: TreeCheckState; onToggle: () => void }) {
    const tree = useRecipe('tree', treeRecipe);
    const styles = tree();
    if (own)
        return (
            <span
                data-part="node-checkbox"
                data-state={checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
                role="presentation"
                aria-hidden="true"
                className={styles.checkbox()}
                onClick={(event) => {
                    event.stopPropagation();
                    onToggle();
                }}
            >
                {checked === 'indeterminate' ? (
                    <Minus className={styles.checkboxIcon()} />
                ) : checked ? (
                    <Check className={styles.checkboxIcon()} />
                ) : null}
            </span>
        );
    return (
        <ArkTreeView.NodeCheckbox className={styles.checkbox()} role="presentation" aria-hidden="true">
            <ArkTreeView.NodeCheckboxIndicator
                indeterminate={<Minus className={styles.checkboxIcon()} aria-hidden="true" />}
            >
                <Check className={styles.checkboxIcon()} aria-hidden="true" />
            </ArkTreeView.NodeCheckboxIndicator>
        </ArkTreeView.NodeCheckbox>
    );
}

/**
 * One node: a branch with its children (nested) or a leaf. `flat` (VirtualTree) renders a branch without its
 * children and gives the position among the siblings (aria-posinset/setsize).
 */
export function TreeNodeView({
    node,
    indexPath,
    flat = false,
    posinset,
    setsize,
}: {
    node: TreeNode;
    indexPath: number[];
    flat?: boolean;
    posinset?: number;
    setsize?: number;
}) {
    const tree = useRecipe('tree', treeRecipe);
    const styles = tree();
    const t = useTranslations().tree;
    const { model, checkable, showLines, renderNode } = useContext(TreeNodes)!;
    const drag = model.drag;
    const Icon = node.icon;
    const branch = !!node.children || isLazyNode(node);
    const retry = treeRetryParent(node.id) !== undefined;
    const loading = model.loadingOf(node);
    const match = model.matches.has(node.id);
    const own = model.ownChecks;
    const ownChecked = model.checkStates?.get(node.id) ?? false;
    const checkedOf = (state: { checked: TreeCheckState }) => (own ? ownChecked : state.checked);
    const dragProps = (isBranch: boolean) =>
        drag.reorderable
            ? {
                  draggable: node.disabled ? undefined : ('true' as const),
                  'data-drop': drag.drop?.id === node.id ? drag.drop.position : undefined,
                  'data-dragging': drag.dragging === node.id || undefined,
                  'data-cut': model.cutId === node.id || undefined,
                  onDragStart: (event: DragEvent<HTMLElement>) => drag.onDragStart(node.id, event),
                  onDragOver: (event: DragEvent<HTMLElement>) => drag.onDragOver(node.id, isBranch, event),
                  onDrop: drag.onDrop,
                  onDragEnd: drag.onDragEnd,
              }
            : {};
    const content = (
        state: { depth: number; selected: boolean; expanded: boolean; checked: TreeCheckState },
        Text: typeof ArkTreeView.BranchText
    ) =>
        renderNode ? (
            renderNode(node, {
                level: state.depth,
                selected: state.selected,
                expanded: state.expanded,
                branch,
                checked: checkedOf(state),
                loading,
                match,
                query: model.query,
            })
        ) : (
            <>
                {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
                <Text className={styles.text()}>
                    {match ? <Highlight text={node.label} query={model.query} ignoreAccents /> : node.label}
                </Text>
            </>
        );
    return (
        <ArkTreeView.NodeProvider node={node} indexPath={indexPath}>
            <ArkTreeView.NodeContext>
                {(state) =>
                    branch ? (
                        <ArkTreeView.Branch
                            data-node-id={node.id}
                            aria-keyshortcuts={drag.reorderable ? moveKeys : undefined}
                            aria-checked={checkable ? ariaChecked(checkedOf(state)) : undefined}
                            aria-busy={loading || undefined}
                            aria-posinset={posinset}
                            aria-setsize={setsize}
                            data-match={match || undefined}
                        >
                            <ArkTreeView.BranchControl
                                className={styles.branch({ class: drag.reorderable ? styles.dropTarget() : undefined })}
                                {...dragProps(true)}
                            >
                                <ArkTreeView.BranchIndicator className={styles.indicator()}>
                                    <ChevronRight className={styles.indicatorIcon()} aria-hidden="true" />
                                </ArkTreeView.BranchIndicator>
                                {checkable && (
                                    <NodeCheckbox
                                        own={own}
                                        checked={ownChecked}
                                        onToggle={() => model.toggleCheck(node.id)}
                                    />
                                )}
                                {content(state, ArkTreeView.BranchText)}
                            </ArkTreeView.BranchControl>
                            {!flat && (
                                <ArkTreeView.BranchContent {...(showLines ? { className: styles.lines() } : {})}>
                                    {loading && (
                                        <div className={styles.loadingRow()} aria-hidden="true">
                                            <LoaderCircle className={styles.loadingIcon()} />
                                            {t.loadingRow}
                                        </div>
                                    )}
                                    {(node.children ?? []).map((child, index) => (
                                        <TreeNodeView key={child.id} node={child} indexPath={[...indexPath, index]} />
                                    ))}
                                </ArkTreeView.BranchContent>
                            )}
                        </ArkTreeView.Branch>
                    ) : retry ? (
                        // Children failed to load: Enter or a click loads them again
                        <ArkTreeView.Item
                            className={styles.item({ class: styles.retry() })}
                            data-node-id={node.id}
                            aria-posinset={posinset}
                            aria-setsize={setsize}
                        >
                            <RotateCw className={styles.retryIcon()} aria-hidden="true" />
                            <ArkTreeView.ItemText className={styles.text()}>{node.label}</ArkTreeView.ItemText>
                        </ArkTreeView.Item>
                    ) : (
                        <ArkTreeView.Item
                            className={styles.item({ class: drag.reorderable ? styles.dropTarget() : undefined })}
                            data-node-id={node.id}
                            aria-keyshortcuts={drag.reorderable ? moveKeys : undefined}
                            aria-checked={checkable ? ariaChecked(checkedOf(state)) : undefined}
                            aria-posinset={posinset}
                            aria-setsize={setsize}
                            data-match={match || undefined}
                            {...dragProps(false)}
                        >
                            {checkable && (
                                <NodeCheckbox
                                    own={own}
                                    checked={ownChecked}
                                    onToggle={() => model.toggleCheck(node.id)}
                                />
                            )}
                            {content(state, ArkTreeView.ItemText)}
                        </ArkTreeView.Item>
                    )
                }
            </ArkTreeView.NodeContext>
        </ArkTreeView.NodeProvider>
    );
}

/** Context of the nodes, for trees that render them themselves (VirtualTree) */
export const TreeNodesProvider = TreeNodes;

/** The node with this id, searched depth-first */
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
