import { useFieldContext } from '@ark-ui/react/field';
import { Popover as ArkPopover } from '@ark-ui/react/popover';
import { Portal } from '@ark-ui/react/portal';
import {
    treeSelect as treeSelectRecipe,
    withLoadedChildren,
    type DataSource,
    type RecipeClasses,
    type TreeCheckedStrategy,
} from '@wirecore/wirelayer-recipes';
import { ChevronDown, LoaderCircle, X } from 'lucide-react';
import { useId, useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { findTreeNode, Tree, type TreeNode } from '../Tree/Tree.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

/** One node id, or several with `multiple` */
export type TreeSelectValue = string | string[] | null;

export interface TreeSelectProps<T extends TreeSelectValue = string | null> {
    items: readonly TreeNode[];
    /** Chosen node id (an array of ids with `multiple`) */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    placeholder?: string;
    /** Only nodes without children can be chosen */
    leavesOnly?: boolean;
    defaultExpandedValue?: string[];
    disabled?: boolean;
    invalid?: boolean;
    /** Several nodes, chosen with check boxes; shown as chips in the field */
    multiple?: boolean;
    /** Which checked ids make up the value (`multiple`): `parent` (default) – a fully checked branch instead of its children, `all`, or `child` – only leaves */
    checkedStrategy?: TreeCheckedStrategy;
    /** Check boxes of parents and children are independent (`multiple`) */
    checkStrictly?: boolean;
    /** Chips shown before "+N" (`multiple`) */
    maxShown?: number;
    /** Search field above the tree */
    filter?: boolean;
    /** Button that clears the value (also Delete on the closed field) */
    clearable?: boolean;
    /** Shows a spinner in the field (aria-busy) */
    loading?: boolean;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: 'sm' | 'md' | 'lg';
    /** Loads the children of lazy nodes (`hasChildren: true`) when they open; they are kept while the field lives */
    loadChildren?: (node: TreeNode, request: { signal: AbortSignal }) => Promise<TreeNode[]>;
    /** A lazy node opened and there is no loadChildren/dataSource: add its children to the items */
    onLoadChildren?: (node: TreeNode) => void;
    /** Source of the children of lazy nodes (`getChildren`) */
    dataSource?: DataSource<TreeNode>;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof treeSelectRecipe>;
}

/** Select whose options are a tree: the button opens the tree in a panel, choosing a node closes it */
export function TreeSelect<T extends TreeSelectValue = string | null>({
    classes,
    items: itemsProp,
    value,
    defaultValue,
    onValueChange,
    placeholder: placeholderProp,
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
    loading = false,
    size,
    loadChildren: loadChildrenProp,
    onLoadChildren,
    dataSource,
    'aria-label': ariaLabel,
    className,
    style,
}: TreeSelectProps<T>) {
    const treeSelect = useRecipe('treeSelect', treeSelectRecipe, classes);
    const styles = treeSelect({ size, clearable: clearable && !multiple });
    const translations = useTranslations();
    const t = translations.treeSelect;
    const placeholder = placeholderProp ?? translations.common.placeholder;
    const field = useFieldContext();
    const id = useId();
    const [open, setOpen] = useState(false);
    const [internal, setInternal] = useState<TreeSelectValue>(defaultValue ?? (multiple ? [] : null));
    const current = value === undefined ? internal : value;
    const ids = Array.isArray(current) ? current : current === null || current === undefined ? [] : [current];

    // Children loaded in the tree stay known when the panel closes (labels of chosen nodes, no second request)
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

    const path = multiple ? undefined : findTreeNode(items, ids[0]);
    const selected = path?.at(-1);
    const chosen = ids.map((key) => findTreeNode(items, key)?.at(-1) ?? { id: key, label: key });
    const shown = maxShown === undefined ? chosen : chosen.slice(0, maxShown);
    const hidden = chosen.length - shown.length;
    const isDisabled = disabled ?? field?.disabled;
    const isInvalid = invalid ?? field?.invalid;
    // The path of the chosen node stays open
    const expanded =
        defaultExpandedValue ??
        (multiple
            ? [
                  ...new Set(
                      ids.flatMap(
                          (key) =>
                              findTreeNode(items, key)
                                  ?.slice(0, -1)
                                  .map((node) => node.id) ?? []
                      )
                  ),
              ]
            : path?.slice(0, -1).map((node) => node.id));
    const [status, setStatus] = useState('');

    const commit = (next: TreeSelectValue) => {
        setInternal(next);
        onValueChange?.(next as T);
    };
    const remove = (node: TreeNode) => {
        commit(ids.filter((key) => key !== node.id));
        setStatus(translations.select.removed(node.label));
    };
    const clear = () => commit(multiple ? [] : null);
    const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (!ids.length || isDisabled) return;
        if (multiple && event.key === 'Backspace') {
            event.preventDefault();
            remove(chosen.at(-1)!);
        } else if (clearable && (event.key === 'Delete' || event.key === 'Backspace')) {
            event.preventDefault();
            clear();
        }
    };
    const valueText = multiple ? chosen.map((node) => node.label).join(', ') : (selected?.label ?? '');
    const triggerLabel = field ? undefined : ariaLabel ? `${ariaLabel}: ${valueText || placeholder}` : undefined;
    const indicator = loading ? (
        <span className={styles.indicator()} aria-hidden="true">
            <LoaderCircle className={styles.spinner()} />
        </span>
    ) : (
        <ChevronDown className={styles.indicator()} data-state={open ? 'open' : 'closed'} aria-hidden="true" />
    );
    const triggerProps = {
        disabled: isDisabled,
        'aria-invalid': isInvalid || undefined,
        'aria-busy': loading || undefined,
        'aria-label': triggerLabel,
        'aria-labelledby': field ? `${field.ids.label} ${id}value` : undefined,
        'aria-describedby': field?.ariaDescribedby,
        onKeyDown: onTriggerKeyDown,
    };
    let control: ReactNode;
    if (multiple) {
        // Several nodes: chips in a box, the trigger fills the rest of the row
        control = (
            <div
                className={styles.chipsControl()}
                data-state={open ? 'open' : 'closed'}
                data-invalid={isInvalid || undefined}
                data-disabled={isDisabled || undefined}
            >
                {shown.map((node) => (
                    <span key={node.id} className={styles.chip()}>
                        <span className={styles.chipText()}>{node.label}</span>
                        {/* Not a tab stop: Backspace on the field removes the last chip */}
                        {!isDisabled && (
                            <button
                                type="button"
                                tabIndex={-1}
                                className={styles.chipRemove()}
                                aria-label={translations.select.removeItem(node.label)}
                                onClick={() => remove(node)}
                            >
                                <X className={styles.chipRemoveIcon()} aria-hidden="true" />
                            </button>
                        )}
                    </span>
                ))}
                {hidden > 0 && (
                    <span className={styles.chipMore()} title={t.moreLabel(hidden)}>
                        {t.more(hidden)}
                    </span>
                )}
                <ArkPopover.Trigger
                    className={styles.chipsTrigger()}
                    data-disabled={isDisabled || undefined}
                    {...triggerProps}
                >
                    <span
                        id={`${id}value`}
                        className={styles.value()}
                        data-placeholder-shown={!chosen.length || undefined}
                    >
                        {chosen.length ? <span className={styles.hiddenValue()}>{valueText}</span> : placeholder}
                    </span>
                    {indicator}
                </ArkPopover.Trigger>
                {clearable && chosen.length > 0 && !isDisabled && (
                    <button
                        type="button"
                        tabIndex={-1}
                        className={styles.chipsClear()}
                        aria-label={translations.select.clear}
                        onClick={clear}
                    >
                        <X className={styles.clearIcon()} aria-hidden="true" />
                    </button>
                )}
                <span role="status" className={styles.status()}>
                    {status}
                </span>
            </div>
        );
    } else {
        const trigger = (
            <ArkPopover.Trigger
                className={styles.trigger()}
                data-invalid={isInvalid || undefined}
                data-disabled={isDisabled || undefined}
                {...triggerProps}
            >
                <span id={`${id}value`} className={styles.value()} data-placeholder-shown={!selected || undefined}>
                    {selected?.label ?? placeholder}
                </span>
                {indicator}
            </ArkPopover.Trigger>
        );
        // No wrapper without a clear button (unchanged DOM)
        control = clearable ? (
            <div className={styles.control()}>
                {trigger}
                {/* Not a tab stop: Backspace/Delete on the field clears, too */}
                {selected && !isDisabled && (
                    <button
                        type="button"
                        tabIndex={-1}
                        className={styles.clear()}
                        aria-label={translations.select.clear}
                        onClick={clear}
                    >
                        <X className={styles.clearIcon()} aria-hidden="true" />
                    </button>
                )}
            </div>
        ) : (
            trigger
        );
    }

    return (
        <ArkPopover.Root
            open={open}
            onOpenChange={(details) => setOpen(details.open)}
            positioning={{ placement: 'bottom-start', gutter: 4, sameWidth: true }}
            lazyMount
            unmountOnExit
        >
            <div className={styles.base({ class: className })} style={style}>
                {control}
            </div>
            <Portal>
                <ArkPopover.Positioner>
                    <ArkPopover.Content className={styles.content()} aria-label={ariaLabel ?? placeholder}>
                        {multiple ? (
                            <Tree
                                items={items}
                                aria-label={ariaLabel ?? placeholder}
                                checkable
                                checkedStrategy={checkedStrategy}
                                checkStrictly={checkStrictly}
                                checkedValue={ids}
                                onCheckedChange={commit}
                                defaultExpandedValue={expanded}
                                filter={filter}
                                loadChildren={loadChildren}
                                onLoadChildren={onLoadChildren}
                            />
                        ) : (
                            <Tree
                                items={items}
                                aria-label={ariaLabel ?? placeholder}
                                selectedValue={current ? [current as string] : []}
                                defaultExpandedValue={expanded}
                                filter={filter}
                                loadChildren={loadChildren}
                                onLoadChildren={onLoadChildren}
                                onSelectionChange={(next) => {
                                    const key = next[0] ?? null;
                                    const node = findTreeNode(items, key)?.at(-1);
                                    if (!key || (leavesOnly && node?.children)) return;
                                    commit(key);
                                    setOpen(false);
                                }}
                            />
                        )}
                    </ArkPopover.Content>
                </ArkPopover.Positioner>
            </Portal>
        </ArkPopover.Root>
    );
}
