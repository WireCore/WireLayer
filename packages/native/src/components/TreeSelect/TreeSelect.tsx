import {
    isBranchNode,
    treeSelect,
    withLoadedChildren,
    type DataSource,
    type TreeCheckedStrategy,
} from '@wirecore/wirelayer-recipes/native';
import { useMemo, useRef, useState } from 'react';
import { useTranslations } from '../../locale.js';
import { PickerTrigger } from '../../utils/PickerTrigger.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldControl } from '../Field/Field.js';
import { findTreePath, TreeView, type TreeHandle, type TreeNode } from '../Tree/Tree.js';

/** One node id, or several with `multiple` */
export type TreeSelectValue = string | string[] | null;

export interface TreeSelectProps<T extends TreeSelectValue = string | null> {
    items: TreeNode[];
    /** Chosen node id (an array of ids with `multiple`) */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    placeholder?: string;
    /** Title of the sheet – default: the Field label or the placeholder */
    title?: string;
    /** Only nodes without children can be chosen; pressing a branch opens it */
    leavesOnly?: boolean;
    /** Open nodes when the sheet opens – default: the path of the chosen node(s) */
    defaultExpandedValue?: string[];
    disabled?: boolean;
    invalid?: boolean;
    /** Several nodes, chosen with check boxes; shown as chips in the field */
    multiple?: boolean;
    /**
     * Which checked ids make up the value (`multiple`): `parent` (default) – a fully checked branch instead of its
     * children, `all`, or `child` – only leaves
     */
    checkedStrategy?: TreeCheckedStrategy;
    /** Check boxes of parents and children are independent (`multiple`) */
    checkStrictly?: boolean;
    /** Chips shown before "+N" (`multiple`) */
    maxShown?: number;
    /** Search field above the tree */
    filter?: boolean;
    /** Button next to the field that clears the value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear selection") */
    clearLabel?: string;
    /** Shows a spinner in the field (busy) */
    loading?: boolean;
    /** Height of the field: 32, 40 (default) or 48 pt */
    size?: 'sm' | 'md' | 'lg';
    /** Loads the children of lazy nodes (`hasChildren: true`) when they open; they are kept while the field lives */
    loadChildren?: (node: TreeNode, request: { signal: AbortSignal }) => Promise<TreeNode[]>;
    /** A lazy node opened and there is no loadChildren/dataSource: add its children to the items */
    onLoadChildren?: (node: TreeNode) => void;
    /** Source of the children of lazy nodes (`getChildren`) */
    dataSource?: DataSource<TreeNode>;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    /** Accessible name of the sheet's close button */
    closeLabel?: string;
    className?: string;
}

/**
 * Select whose options are a tree: the trigger opens a sheet with the tree. One node is a radio button – choosing
 * it closes the sheet; with `multiple` the nodes are check boxes with cascade and the field shows chips.
 */
export function TreeSelect<T extends TreeSelectValue = string | null>({
    items: itemsProp,
    value,
    defaultValue,
    onValueChange,
    placeholder: placeholderProp,
    title,
    leavesOnly = false,
    defaultExpandedValue,
    disabled,
    invalid,
    multiple = false,
    checkedStrategy = 'parent',
    checkStrictly = false,
    maxShown,
    filter = false,
    clearable = false,
    clearLabel,
    loading = false,
    size,
    loadChildren: loadChildrenProp,
    onLoadChildren,
    dataSource,
    'aria-label': ariaLabel,
    closeLabel,
    className,
}: TreeSelectProps<T>) {
    const translations = useTranslations();
    const t = translations.treeSelect;
    const placeholder = placeholderProp ?? translations.common.placeholder;
    const control = useFieldControl({ invalid, disabled });
    const [open, setOpen] = useState(false);
    const [current, setCurrent] = useControllable<TreeSelectValue>(
        value,
        defaultValue ?? (multiple ? [] : null),
        onValueChange as ((next: TreeSelectValue) => void) | undefined
    );
    // null, undefined and "" (an empty form field) are no choice
    const ids = Array.isArray(current)
        ? current
        : current === null || current === undefined || current === ''
          ? []
          : [current];
    const treeRef = useRef<TreeHandle>(null);

    // Children loaded in the tree stay known when the sheet closes (labels of chosen nodes, no second request)
    const [loaded, setLoaded] = useState<Record<string, TreeNode[]>>({});
    const items = useMemo(() => withLoadedChildren(itemsProp, loaded), [itemsProp, loaded]);
    const loadChildren = useMemo(() => {
        const remember = (node: TreeNode) => (children: TreeNode[]) => {
            setLoaded((before) => ({ ...before, [node.id]: children }));
            return children;
        };
        if (loadChildrenProp)
            return (node: TreeNode, request: { signal: AbortSignal }) =>
                loadChildrenProp(node, request).then(remember(node));
        if (dataSource?.getChildren)
            return (node: TreeNode, request: { signal: AbortSignal }) =>
                dataSource.getChildren!(node, request).then((result) => remember(node)(result.items));
        return undefined;
    }, [loadChildrenProp, dataSource]);

    const chosen = ids.map((key) => findTreePath(items, key)?.at(-1) ?? { id: key, label: key });
    const shown = maxShown === undefined ? chosen : chosen.slice(0, maxShown);
    const hidden = chosen.length - shown.length;
    const label = control.label ?? ariaLabel;
    const sheetTitle = title ?? label ?? placeholder;
    // The name lists the chosen nodes ("+N" as "N more selected"); the chips show them
    const text = chosen.length
        ? [...shown.map((node) => node.label), ...(hidden > 0 ? [t.moreLabel(hidden)] : [])].join(', ')
        : undefined;
    const chips =
        multiple && chosen.length
            ? [...shown.map((node) => node.label), ...(hidden > 0 ? [t.more(hidden)] : [])]
            : undefined;
    // The path of the chosen node(s) is open when the sheet opens
    const expanded = defaultExpandedValue ?? [
        ...new Set(
            ids.flatMap(
                (key) =>
                    findTreePath(items, key)
                        ?.slice(0, -1)
                        .map((node) => node.id) ?? []
            )
        ),
    ];
    const styles = treeSelect();

    return (
        <>
            <PickerTrigger
                label={label}
                text={text}
                chips={chips}
                placeholder={placeholder}
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={() => setOpen(true)}
                size={size}
                loading={loading && !open}
                onClear={clearable ? () => setCurrent(multiple ? [] : null) : undefined}
                clearLabel={clearLabel ?? translations.select.clear}
                className={className}
            />
            <Sheet
                open={open}
                onClose={() => setOpen(false)}
                title={sheetTitle}
                closeLabel={closeLabel ?? translations.common.close}
                scroll={false}
                // The chosen node gets the focus (the screen reader focus on iOS/Android)
                onShow={() => {
                    if (ids[0]) treeRef.current?.focusNode(ids[0]);
                }}
            >
                {multiple ? (
                    <TreeView
                        ref={treeRef}
                        className={styles.tree()}
                        items={items}
                        aria-label={sheetTitle}
                        checkable
                        checkedStrategy={checkedStrategy}
                        checkStrictly={checkStrictly}
                        checkedValue={ids}
                        onCheckedChange={setCurrent}
                        defaultExpandedValue={expanded}
                        filter={filter}
                        loadChildren={loadChildren}
                        onLoadChildren={onLoadChildren}
                    />
                ) : (
                    <TreeView
                        ref={treeRef}
                        className={styles.tree()}
                        items={items}
                        aria-label={sheetTitle}
                        selectedValue={ids}
                        onSelectionChange={(next) => {
                            const key = next[0];
                            if (!key) return;
                            setCurrent(key);
                            setOpen(false);
                        }}
                        selectable={leavesOnly ? (node) => !isBranchNode(node) : undefined}
                        defaultExpandedValue={expanded}
                        filter={filter}
                        loadChildren={loadChildren}
                        onLoadChildren={onLoadChildren}
                    />
                )}
            </Sheet>
        </>
    );
}
