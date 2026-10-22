import { checkbox, input, tree, treeRetryParent, type TreeCheckState } from '@wirecore/wirelayer-recipes/native';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Minus, RotateCw, Search } from 'lucide-react-native';
import { useImperativeHandle, useRef, type ComponentRef, type ReactNode, type Ref } from 'react';
import { FlatList, I18nManager, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useLocale } from '../../locale.js';
import { focusElement } from '../../utils/focus-registry.js';
import { Icon } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { Loader } from '../../utils/Loader.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';
import { Button } from '../Button/Button.js';
import { Highlight } from '../Highlight/Highlight.js';
import type { TreeHandle, TreeNode, TreeNodeState } from './types.js';
import { useTree, type TreeListRow, type TreeModelProps } from './useTree.js';

export { findTreePath, type TreeHandle, type TreeNode, type TreeNodeState } from './types.js';

export interface TreeProps extends TreeModelProps {
    /** Visible label above the tree, also its accessible name */
    label?: string;
    /** Accessible name without a visible label */
    'aria-label'?: string;
    /** Search field above the tree; hits stay with their ancestors (opened), hits are marked */
    filter?: boolean;
    /** Buttons "Expand all" and "Collapse all" above the tree */
    expandControls?: boolean;
    /** Guide lines along the children of open branches */
    showLines?: boolean;
    /** Content of a node (instead of icon and label); chevron and check box stay */
    renderNode?: (node: TreeNode, state: TreeNodeState) => ReactNode;
    /** Shown without nodes (default "No entries") or without hits ("No matches") */
    emptyText?: string;
    /** Replaces the text shown without nodes or hits */
    empty?: ReactNode;
    className?: string;
    /** Methods: expandAll, collapseAll, invalidate, focusNode */
    ref?: Ref<TreeHandle>;
}

/** Tree with a rule which nodes can be chosen (TreeSelect `leavesOnly`) – not exported from the package */
export interface TreeViewProps extends TreeProps {
    /** false: pressing the node opens or closes it instead of selecting it */
    selectable?: (node: TreeNode) => boolean;
}

/** Indentation per level, in pt */
const INDENT = 20;
/** Centre of the chevron column (w-9) – where the guide lines run */
const LINE_OFFSET = 17.5;

const ariaChecked = (checked: TreeCheckState) => (checked === 'indeterminate' ? 'mixed' : checked);

/**
 * Tree: a flat list of rows, indented per level. A branch has a chevron button (aria-expanded) that opens and
 * closes it; the node itself is a radio button (`selectionMode` single), a checkbox (multiple, or `checkable`
 * with a mixed state for partly checked branches). Children load on demand with a loading row, a retry row and
 * announcements; the search keeps the hits with their ancestors.
 */
export function Tree(props: TreeProps) {
    return <TreeView {...props} />;
}

/** The Tree with the internal `selectable` rule (TreeSelect) */
export function TreeView({
    label,
    'aria-label': ariaLabel,
    filter = false,
    expandControls = false,
    showLines = false,
    renderNode,
    emptyText,
    empty,
    className,
    ref,
    selectable,
    ...props
}: TreeViewProps) {
    const { translations } = useLocale();
    const t = translations.tree;
    const model = useTree(props);
    const styles = tree();
    const field = input({ hasIcon: true, class: styles.search() });
    const muted = useResolveClassNames('text-muted');
    const reducedMotion = useReducedMotion();
    const web = Platform.OS === 'web';
    const multiple = props.selectionMode === 'multiple';
    const checkable = !!props.checkable;
    const filterMode = props.filterMode ?? 'filter';
    const ClosedChevron = I18nManager.isRTL ? ChevronLeft : ChevronRight;

    const list = useRef<FlatList<TreeListRow>>(null);
    const rowRefs = useRef(new Map<string, ComponentRef<typeof View>>());
    const jumped = useRef(-1);
    const focusNode = (id: string) => {
        const index = model.rows.findIndex((row) => row.key === id);
        if (index < 0) return;
        list.current?.scrollToIndex({ index, viewPosition: 0.4, animated: !reducedMotion });
        requestAnimationFrame(() => focusElement(rowRefs.current.get(id) ?? null));
    };
    /** Highlight mode: the search key of the keyboard goes to the next hit */
    const jump = () => {
        const hits = model.matchList;
        if (!hits.length) return;
        jumped.current = (jumped.current + 1) % hits.length;
        focusNode(hits[jumped.current]!);
    };
    useImperativeHandle(ref, () => ({
        expandAll: model.expandAll,
        collapseAll: model.collapseAll,
        invalidate: model.invalidate,
        focusNode,
    }));

    // The ancestors of a row, for the hint on iOS/Android ("Europe, Germany")
    const byId = new Map<string, Extract<TreeListRow, { type: 'node' }>>();
    for (const row of model.rows) if (row.type === 'node') byId.set(row.key, row);
    const ancestors = (parentId: string | null) => {
        const labels: string[] = [];
        for (let id = parentId; id !== null; id = byId.get(id)?.row.parentId ?? null) {
            const parent = byId.get(id);
            if (!parent) break;
            labels.unshift(parent.row.node.label);
        }
        return labels.join(', ');
    };

    // Start of a row: the guide lines (absolute, from the row's edge) and the indentation of its level
    const lead = (level: number) => (
        <>
            {showLines &&
                Array.from({ length: level - 1 }, (_, index) => (
                    <View
                        key={index}
                        aria-hidden
                        className={styles.line()}
                        style={{ left: index * INDENT + LINE_OFFSET }}
                    />
                ))}
            {level > 1 && <View style={{ width: (level - 1) * INDENT }} />}
        </>
    );
    const registerRow = (id: string) => (node: ComponentRef<typeof View> | null) => {
        if (node) rowRefs.current.set(id, node);
        else rowRefs.current.delete(id);
    };

    const renderRow = (item: TreeListRow) => {
        if (item.type === 'loading')
            return (
                <View className={styles.loadingRow()}>
                    {lead(item.level)}
                    <View className={styles.toggleSpacer()} />
                    <View className={styles.loadingContent()}>
                        <Loader className={styles.spinner()} />
                        <Text className={styles.loadingText()}>{t.loadingRow}</Text>
                    </View>
                </View>
            );
        const { row } = item;
        const node = row.node;
        const retryOf = treeRetryParent(node.id);
        if (retryOf !== undefined)
            // Children failed to load: pressing the row loads them again
            return (
                <View className={styles.row()}>
                    {lead(row.level)}
                    <View className={styles.toggleSpacer()} />
                    <Pressable
                        ref={registerRow(node.id)}
                        role="button"
                        className={styles.node()}
                        onPress={() => {
                            // The retry row goes away while loading: the focus moves to its node
                            focusElement(rowRefs.current.get(retryOf) ?? null);
                            model.retry(retryOf);
                        }}
                    >
                        <Icon icon={RotateCw} className={styles.retryIcon()} />
                        <Text className={styles.retryText()}>{node.label}</Text>
                    </Pressable>
                </View>
            );

        const loading = model.loadingOf(node);
        const match = model.matches.has(node.id);
        const checked = model.checkStates?.get(node.id) ?? false;
        const isSelected = !checkable && model.selected.includes(node.id);
        const disabled = !!node.disabled;
        const state: TreeNodeState = {
            level: row.level,
            selected: isSelected,
            expanded: row.expanded,
            branch: row.branch,
            checked,
            loading,
            match,
            query: model.query,
        };
        const rowStyles = tree({ selected: isSelected, disabled });
        const chevron = <Icon icon={row.expanded ? ChevronDown : ClosedChevron} className={rowStyles.indicator()} />;
        const content = renderNode ? (
            renderNode(node, state)
        ) : (
            <>
                {node.icon && <Icon icon={node.icon} className={rowStyles.icon()} />}
                <Text className={rowStyles.text()}>
                    {match ? <Highlight text={node.label} query={model.query} ignoreAccents /> : node.label}
                </Text>
            </>
        );
        const hint = !web && row.level > 1 ? ancestors(row.parentId) : undefined;
        const toggle = () => model.toggleExpanded(node.id);

        // A branch that cannot be chosen (TreeSelect leavesOnly): the whole row opens and closes it
        if (!checkable && row.branch && selectable && !selectable(node))
            return (
                <Pressable
                    ref={registerRow(node.id)}
                    role="button"
                    aria-expanded={row.expanded}
                    aria-busy={loading || undefined}
                    disabled={disabled}
                    aria-disabled={disabled || undefined}
                    accessibilityHint={hint}
                    className={rowStyles.row({ class: rowStyles.rowButton() })}
                    onPress={toggle}
                >
                    {lead(row.level)}
                    <View className={rowStyles.toggleSpacer()}>
                        {loading ? <Loader className={rowStyles.spinner()} /> : chevron}
                    </View>
                    <View className={rowStyles.node()}>{content}</View>
                </Pressable>
            );

        const role = checkable || multiple ? 'checkbox' : 'radio';
        const ariaState = checkable ? ariaChecked(checked) : isSelected;
        const press = checkable ? () => model.toggleCheck(node.id) : () => model.select(node.id);
        const box = checkbox({ checked: checked !== false });
        return (
            <View className={rowStyles.row()}>
                {lead(row.level)}
                {row.branch ? (
                    // The chevron opens and closes the branch – named like the node, its state says open or closed
                    <Pressable
                        role="button"
                        aria-label={node.label}
                        aria-expanded={row.expanded}
                        aria-busy={loading || undefined}
                        disabled={disabled}
                        aria-disabled={disabled || undefined}
                        hitSlop={{ left: 4, right: 4 }}
                        className={rowStyles.toggle()}
                        onPress={toggle}
                    >
                        {loading ? <Loader className={rowStyles.spinner()} /> : chevron}
                    </Pressable>
                ) : (
                    <View className={rowStyles.toggleSpacer()} />
                )}
                <Pressable
                    ref={registerRow(node.id)}
                    role={role}
                    aria-checked={ariaState}
                    disabled={disabled}
                    aria-disabled={disabled || undefined}
                    accessibilityHint={hint}
                    // Position among the siblings (web; radio buttons only – axe allows it there)
                    {...(web && role === 'radio' ? { 'aria-posinset': row.posinset, 'aria-setsize': row.setsize } : {})}
                    className={rowStyles.node()}
                    onPress={press}
                    {...(disabled ? {} : toggleOnSpace(press))}
                >
                    {checkable && (
                        <View className={box.control({ class: rowStyles.checkbox() })}>
                            {checked !== false && (
                                <Icon icon={checked === true ? Check : Minus} className={box.icon()} />
                            )}
                        </View>
                    )}
                    {content}
                </Pressable>
            </View>
        );
    };

    const emptyContent = empty ?? emptyText ?? (model.query.trim() ? t.noMatches : translations.common.empty);
    return (
        <View className={styles.base({ class: className })}>
            {!!label && <Text className={styles.label()}>{label}</Text>}
            {(filter || expandControls) && (
                <View className={styles.toolbar()}>
                    {filter && (
                        <View className={field.base()}>
                            <Icon icon={Search} className={field.icon()} />
                            <TextInput
                                value={model.query}
                                onChangeText={model.setQuery}
                                aria-label={t.filter}
                                placeholder={translations.combobox.search}
                                placeholderTextColor={typeof muted.color === 'string' ? muted.color : undefined}
                                autoCorrect={false}
                                autoCapitalize="none"
                                returnKeyType="search"
                                onSubmitEditing={filterMode === 'highlight' ? jump : undefined}
                                className={field.control()}
                            />
                        </View>
                    )}
                    {expandControls && (
                        <>
                            <Button variant="text" size="sm" onPress={model.expandAll}>
                                {t.expandAll}
                            </Button>
                            <Button variant="text" size="sm" onPress={model.collapseAll}>
                                {t.collapseAll}
                            </Button>
                        </>
                    )}
                </View>
            )}
            <FlatList
                ref={list}
                data={model.rows}
                keyExtractor={(row) => row.key}
                // The rows read the model – render them again on every change
                extraData={model}
                role="group"
                aria-label={label ?? ariaLabel ?? t.treeLabel}
                contentContainerClassName={styles.list()}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={30}
                onScrollToIndexFailed={(info) =>
                    list.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false })
                }
                renderItem={({ item }) => renderRow(item)}
                ListEmptyComponent={
                    typeof emptyContent === 'string' ? (
                        <Text className={styles.empty()}>{emptyContent}</Text>
                    ) : (
                        <>{emptyContent}</>
                    )
                }
            />
            {model.region}
        </View>
    );
}
