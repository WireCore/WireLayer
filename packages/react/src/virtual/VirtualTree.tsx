import { TreeView as ArkTreeView } from '@ark-ui/react/tree-view';
import { useVirtualizer } from '@tanstack/react-virtual';
import { flattenTree, tree as treeRecipe, type TreeRow } from '@wirecore/wirelayer-recipes';
import { LoaderCircle } from 'lucide-react';
import { useImperativeHandle, useMemo, useRef, type CSSProperties } from 'react';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import {
    TreeNodesProvider,
    TreeNodeView,
    TreeToolbar,
    type TreeNode,
    type TreeProps,
} from '../components/Tree/Tree.js';
import { useTree } from '../components/Tree/useTree.js';

export interface VirtualTreeProps extends Omit<TreeProps, 'showLines'> {
    /** Height of the scrolling tree (CSS length) */
    height?: string;
    /** Estimated row height in px (rows are measured when shown) */
    itemHeight?: number;
}

/** A row of the flat list: a node, or the loading row below an opening branch */
type Row = (TreeRow<TreeNode> & { kind: 'node' }) | { kind: 'loading'; parentId: string; level: number };

/** Focuses the element once it is rendered (a few frames at most) */
function focusWhenRendered(getElement: () => HTMLElement | null, frames = 6) {
    requestAnimationFrame(() => {
        const element = getElement();
        if (element) {
            if (element.ownerDocument.activeElement !== element) element.focus();
        } else if (frames > 0) focusWhenRendered(getElement, frames - 1);
    });
}

/**
 * Tree for many nodes: the open part of the tree as a flat, virtualised list of treeitems (aria-level,
 * aria-posinset, aria-setsize) – only the rows in view are in the DOM. Same props and keyboard as Tree.
 */
export function VirtualTree({
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
    renderNode,
    emptyText,
    empty,
    height = '20rem',
    itemHeight = 32,
    className,
    style,
    ref,
    ...rest
}: VirtualTreeProps) {
    const tree = useRecipe('tree', treeRecipe, classes);
    const styles = tree();
    const translations = useTranslations();
    const t = translations.tree;
    const root = useRef<HTMLDivElement>(null);
    const viewport = useRef<HTMLDivElement>(null);
    const model = useTree(
        { ...rest, items, checkable, checkStrictly, checkedValue, defaultCheckedValue, reorderable, filterMode },
        root
    );
    const rows = useMemo(() => {
        const list: Row[] = [];
        for (const row of flattenTree(model.view, model.expanded)) {
            list.push({ ...row, kind: 'node' });
            if (row.expanded && model.loadingOf(row.node))
                list.push({ kind: 'loading', parentId: row.node.id, level: row.level });
        }
        return list;
        // loadingOf reads the loading state of the model
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model.view, model.expanded, model.loadingOf]);
    // TanStack Virtual returns a mutable instance, so the React Compiler skips this component – expected
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => viewport.current,
        estimateSize: () => itemHeight,
        measureElement: (element) => element.getBoundingClientRect().height || itemHeight,
        overscan: 8,
        getItemKey: (index) => {
            const row = rows[index]!;
            return row.kind === 'node' ? row.node.id : `${row.parentId}\u0000loading`;
        },
        // Render the first rows before the tree is measured (SSR, tests)
        initialRect: { width: 0, height: 320 },
    });
    useImperativeHandle(ref, () => ({
        expandAll: model.expandAll,
        collapseAll: model.collapseAll,
        invalidate: model.invalidate,
        focusNode: (id: string) => {
            const index = rows.findIndex((row) => row.kind === 'node' && row.node.id === id);
            if (index >= 0) virtualizer.scrollToIndex(index, { align: 'auto' });
            requestAnimationFrame(() => model.focusNode(id));
        },
    }));
    const emptyTextShown =
        emptyText ??
        (model.query.trim() ? t.noMatches : rest.group !== undefined ? translations.common.empty : undefined);
    const showEmpty = !model.view.length && (emptyTextShown !== undefined || !!empty || rest.group !== undefined);

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
            // Ark asks to scroll a node into view before it focuses it (arrow keys, Home/End, typeahead); the row
            // may render a frame later than Ark focuses, so the focus is tried until it is there
            scrollToIndexFn={({ node, getElement }) => {
                const index = rows.findIndex((row) => row.kind === 'node' && row.node.id === node.id);
                if (index < 0) return;
                virtualizer.scrollToIndex(index, { align: 'auto' });
                focusWhenRendered(getElement);
            }}
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
            <TreeNodesProvider value={{ model, checkable, showLines: false, renderNode }}>
                <ArkTreeView.Tree
                    ref={viewport}
                    className={styles.tree({ class: styles.viewport() })}
                    style={{ height }}
                    hidden={showEmpty || undefined}
                >
                    <div className={styles.spacer()} style={{ height: virtualizer.getTotalSize() }}>
                        {virtualizer.getVirtualItems().map((item) => {
                            const row = rows[item.index]!;
                            return (
                                <div
                                    key={item.key}
                                    ref={virtualizer.measureElement}
                                    data-index={item.index}
                                    className={styles.row()}
                                    style={{ transform: `translateY(${item.start}px)` }}
                                >
                                    {row.kind === 'node' ? (
                                        <TreeNodeView
                                            node={row.node}
                                            indexPath={row.indexPath}
                                            flat
                                            posinset={row.posinset}
                                            setsize={row.setsize}
                                        />
                                    ) : (
                                        <div
                                            className={styles.loadingRow()}
                                            style={{ '--depth': row.level } as CSSProperties}
                                            aria-hidden="true"
                                        >
                                            <LoaderCircle className={styles.loadingIcon()} />
                                            {t.loadingRow}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ArkTreeView.Tree>
            </TreeNodesProvider>
            {showEmpty && (
                <div className={styles.empty()} onDragOver={model.onEmptyDragOver} onDrop={model.onEmptyDrop}>
                    {empty ?? emptyTextShown}
                </div>
            )}
            <p role="status" className={styles.status()}>
                {model.status}
            </p>
        </ArkTreeView.Root>
    );
}
