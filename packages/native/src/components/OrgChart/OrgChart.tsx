import {
    ChildrenLoader,
    isLazyNode,
    orgChart,
    pluralText,
    withLoadedChildren,
    type ChildrenLoaderState,
    type DataSource,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronDown, RotateCw } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { pressedProps } from '../../utils/keyboard.js';
import { Loader } from '../../utils/Loader.js';
import { useControllable } from '../../utils/useControllable.js';
import { Avatar } from '../Avatar/Avatar.js';

/** A person or unit of the hierarchy – the same shape as in @wirecore/wirelayer-react */
export interface OrgChartNode {
    /** Identifies the node (collapsedKeys, selectedKeys, loadChildren) – default: its position, e.g. "0-1" */
    id?: string;
    label: string;
    /** Second line, e.g. the role */
    title?: string;
    children?: OrgChartNode[];
    /** Has a team that is loaded when it is shown (`loadChildren`, `dataSource` or `onLoadChildren`) */
    hasChildren?: boolean;
    /** false: like `hasChildren: true` */
    leaf?: boolean;
}

/** State of a node, passed to `renderContent` */
export interface OrgChartNodeState {
    key: string;
    selected: boolean;
    expanded: boolean;
    loading: boolean;
}

export interface OrgChartProps {
    /** The top of the hierarchy */
    node: OrgChartNode;
    /** Accessible name, e.g. "Org chart" */
    label: string;
    /** A button beside each node with a team shows or hides it */
    collapsible?: boolean;
    /** Keys of the nodes whose team is hidden */
    collapsedKeys?: string[];
    defaultCollapsedKeys?: string[];
    onCollapsedKeysChange?: (keys: string[]) => void;
    /** Nodes can be chosen (toggle buttons): one or several */
    selectionMode?: 'none' | 'single' | 'multiple';
    selectedKeys?: string[];
    defaultSelectedKeys?: string[];
    onSelectedKeysChange?: (keys: string[]) => void;
    /** Loads the team of a node with `hasChildren: true` when it is shown; the signal aborts it */
    loadChildren?: (node: OrgChartNode, request: { signal: AbortSignal }) => Promise<OrgChartNode[]>;
    /** A lazy node opened and there is no loadChildren/dataSource: add its team to the node */
    onLoadChildren?: (node: OrgChartNode) => void;
    /** Source of the teams of lazy nodes (`getChildren`) */
    dataSource?: DataSource<OrgChartNode>;
    /** Content of a node card (instead of avatar, label and title) */
    renderContent?: (node: OrgChartNode, state: OrgChartNodeState) => ReactNode;
    className?: string;
}

const empty: ChildrenLoaderState<OrgChartNode> = { status: {}, children: {}, errors: {} };
// Lazy nodes need an id: it names them for the loader
const keyOfNode = (node: OrgChartNode) => node.id ?? node.label;

/**
 * Hierarchy of people as a vertical, indented list (nested lists – screen readers read the structure): a card per
 * person (avatar, name, role), a button beside each team that shows or hides it, teams loaded on demand.
 */
export function OrgChart({
    node,
    label,
    collapsible = false,
    collapsedKeys,
    defaultCollapsedKeys = [],
    onCollapsedKeysChange,
    selectionMode = 'none',
    selectedKeys,
    defaultSelectedKeys = [],
    onSelectedKeysChange,
    loadChildren,
    onLoadChildren,
    dataSource,
    renderContent,
    className,
}: OrgChartProps) {
    const { translations, locale } = useLocale();
    const t = translations.orgChart;
    const { announce, region } = useAnnouncer();
    const styles = orgChart();

    // Teams on demand: from loadChildren/dataSource, or the parent (onLoadChildren)
    const [loaded, setLoaded] = useState(empty);
    const [asked, setAsked] = useState<Set<string>>(() => new Set());
    const labels = useRef(new Map<string, string>());
    // The loader's callbacks run later: they read the props and texts of the last render
    const latest = useRef({ loadChildren, dataSource, translations, locale, announce });
    useEffect(() => {
        latest.current = { loadChildren, dataSource, translations, locale, announce };
    });
    const loadedRef = useRef(empty);
    const loader = useRef<ChildrenLoader<OrgChartNode> | undefined>(undefined);
    const getLoader = () =>
        (loader.current ??= new ChildrenLoader<OrgChartNode>({
            key: keyOfNode,
            load: (target, request) =>
                latest.current.loadChildren
                    ? latest.current.loadChildren(target, request)
                    : latest.current.dataSource!.getChildren!(target, request).then((result) => result.items),
            onChange: (state) => {
                const before = loadedRef.current.status;
                loadedRef.current = state;
                const { translations: texts, locale: lang } = latest.current;
                for (const [key, value] of Object.entries(state.status)) {
                    if (before[key] === value) continue;
                    const name = labels.current.get(key) ?? key;
                    latest.current.announce(
                        value === 'loading'
                            ? texts.orgChart.loading(name)
                            : value === 'error'
                              ? texts.tree.loadError(name)
                              : pluralText(texts.tree.loadedNode, state.children[key]?.length ?? 0, lang).replace(
                                    '{label}',
                                    name
                                )
                    );
                }
                setLoaded(state);
            },
        }));
    useEffect(
        () => () => {
            loader.current?.dispose();
            loader.current = undefined;
        },
        []
    );
    const ownLoader = !!loadChildren || !!dataSource?.getChildren;
    const root = useMemo(() => withLoadedChildren([node], loaded.children, keyOfNode)[0]!, [node, loaded.children]);

    const [collapsedList, setCollapsed] = useControllable(collapsedKeys, defaultCollapsedKeys, onCollapsedKeysChange);
    const collapsed = new Set(collapsedList);
    const [selected, setSelected] = useControllable(selectedKeys, defaultSelectedKeys, onSelectedKeysChange);

    const toggle = (target: OrgChartNode, key: string) => {
        if (isLazyNode(target)) {
            labels.current.set(keyOfNode(target), target.label);
            if (collapsed.has(key)) setCollapsed(collapsedList.filter((other) => other !== key));
            if (ownLoader) void getLoader().load(target, { force: loaded.status[keyOfNode(target)] === 'error' });
            else if (!asked.has(key)) {
                setAsked((before) => new Set([...before, key]));
                announce(t.loading(target.label));
                onLoadChildren?.(target);
            }
            return;
        }
        setCollapsed(collapsed.has(key) ? collapsedList.filter((other) => other !== key) : [...collapsedList, key]);
    };
    const select = (key: string) =>
        setSelected(
            selectionMode === 'multiple'
                ? selected.includes(key)
                    ? selected.filter((other) => other !== key)
                    : [...selected, key]
                : selected.includes(key)
                  ? []
                  : [key]
        );

    const box = (current: OrgChartNode, path: string): ReactNode => {
        const key = current.id ?? path;
        const lazy = isLazyNode(current);
        // A lazy node stays closed until its team is there
        const expanded = !collapsed.has(key) && !lazy;
        const status = loaded.status[keyOfNode(current)];
        const loading = lazy && (status === 'loading' || (!ownLoader && asked.has(key)));
        const failed = lazy && status === 'error';
        const isSelected = selected.includes(key);
        const state: OrgChartNodeState = { key, selected: isSelected, expanded, loading };
        const nodeStyles = orgChart({ selected: isSelected, expanded, error: failed });
        const content = renderContent ? (
            renderContent(current, state)
        ) : (
            <>
                <View aria-hidden className={nodeStyles.avatar()}>
                    <Avatar name={current.label} size="sm" color="auto" />
                </View>
                <View className={nodeStyles.text()}>
                    <Text className={nodeStyles.label()}>{current.label}</Text>
                    {!!current.title && <Text className={nodeStyles.title()}>{current.title}</Text>}
                </View>
            </>
        );
        const branch = !!current.children?.length || lazy;
        return (
            <>
                <View className={nodeStyles.row()}>
                    {selectionMode !== 'none' ? (
                        // A node that can be chosen is a toggle button (pressed on the web, selected on iOS/Android)
                        <Pressable
                            role="button"
                            {...pressedProps(isSelected)}
                            className={nodeStyles.node({ class: nodeStyles.selectable() })}
                            onPress={() => select(key)}
                        >
                            {content}
                        </Pressable>
                    ) : (
                        <View className={nodeStyles.node()}>{content}</View>
                    )}
                    {collapsible && branch && (
                        <Pressable
                            role="button"
                            aria-expanded={expanded}
                            aria-busy={loading || undefined}
                            aria-label={
                                failed
                                    ? t.retry(current.label)
                                    : expanded
                                      ? t.collapse(current.label)
                                      : t.expand(current.label)
                            }
                            className={nodeStyles.toggle()}
                            onPress={() => toggle(current, key)}
                        >
                            <View className={nodeStyles.toggleCircle()}>
                                {loading ? (
                                    <Loader className={nodeStyles.spinner()} />
                                ) : (
                                    <Icon icon={failed ? RotateCw : ChevronDown} className={nodeStyles.toggleIcon()} />
                                )}
                            </View>
                        </Pressable>
                    )}
                </View>
                {!!current.children?.length && expanded && (
                    <View role="list" className={nodeStyles.team()}>
                        {current.children.map((child, index) => (
                            <View key={index} role="listitem">
                                {box(child, `${path}-${index}`)}
                            </View>
                        ))}
                    </View>
                )}
            </>
        );
    };

    return (
        <View className={styles.base({ class: className })}>
            <View role="list" aria-label={label} className={styles.list()}>
                <View role="listitem">{box(root, '0')}</View>
            </View>
            {region}
        </View>
    );
}
