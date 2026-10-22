import {
    ChildrenLoader,
    isBranchNode,
    isLazyNode,
    orgChart as orgChartRecipe,
    pluralText,
    withLoadedChildren,
    type ChildrenLoaderState,
    type DataSource,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronDown, LoaderCircle, RotateCw } from 'lucide-react';
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

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
    /** A button below each node with a team shows or hides it */
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
    /** Content of a node box (instead of label and title) */
    renderContent?: (node: OrgChartNode, state: OrgChartNodeState) => ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof orgChartRecipe>;
}

interface Chart {
    collapsible: boolean;
    selectable: boolean;
    expanded: (node: OrgChartNode, key: string) => boolean;
    selected: (key: string) => boolean;
    loading: (key: string) => boolean;
    failed: (key: string) => boolean;
    toggle: (node: OrgChartNode, key: string) => void;
    select: (key: string) => void;
    renderContent?: OrgChartProps['renderContent'];
}
const ChartContext = createContext<Chart | null>(null);
const empty: ChildrenLoaderState<OrgChartNode> = { status: {}, children: {}, errors: {} };
// Lazy nodes need an id: it names them for the loader
const keyOfNode = (node: OrgChartNode) => node.id ?? node.label;

/** Hierarchy as nested lists – screen readers read the structure, the lines are drawn with CSS */
export function OrgChart({
    classes,
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
    style,
}: OrgChartProps) {
    const orgChart = useRecipe('orgChart', orgChartRecipe, classes);
    const styles = orgChart();
    const { translations, locale } = useLocale();
    const [status, setStatus] = useState('');

    // Teams on demand: from loadChildren/dataSource, or the parent (onLoadChildren)
    const [loaded, setLoaded] = useState(empty);
    const loadedRef = useRef(empty);
    const [asked, setAsked] = useState<Set<string>>(() => new Set());
    const labels = useRef(new Map<string, string>());
    // The loader's callbacks run later: they read the props of the last render
    const latest = useRef({ loadChildren, dataSource });
    useEffect(() => {
        latest.current = { loadChildren, dataSource };
    });
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
                for (const [key, value] of Object.entries(state.status)) {
                    if (before[key] === value) continue;
                    const name = labels.current.get(key) ?? key;
                    setStatus(
                        value === 'loading'
                            ? translations.tree.loadingNode(name)
                            : value === 'error'
                              ? translations.tree.loadError(name)
                              : pluralText(
                                    translations.tree.loadedNode,
                                    state.children[key]?.length ?? 0,
                                    locale
                                ).replace('{label}', name)
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

    const [collapsedInternal, setCollapsedInternal] = useState(defaultCollapsedKeys);
    const collapsed = new Set(collapsedKeys ?? collapsedInternal);
    const setCollapsed = (keys: string[]) => {
        setCollapsedInternal(keys);
        onCollapsedKeysChange?.(keys);
    };
    const [selectedInternal, setSelectedInternal] = useState(defaultSelectedKeys);
    const selected = selectedKeys ?? selectedInternal;

    const chart: Chart = {
        collapsible,
        selectable: selectionMode !== 'none',
        // A lazy node stays closed until its team is there
        expanded: (target, key) => !collapsed.has(key) && !isLazyNode(target),
        selected: (key) => selected.includes(key),
        loading: (key) => loaded.status[key] === 'loading' || (!ownLoader && asked.has(key)),
        failed: (key) => loaded.status[key] === 'error',
        toggle(target, key) {
            if (isLazyNode(target)) {
                labels.current.set(key, target.label);
                if (collapsed.has(key)) setCollapsed([...collapsed].filter((other) => other !== key));
                if (ownLoader) void getLoader().load(target, { force: loaded.status[key] === 'error' });
                else if (!asked.has(key)) {
                    setAsked((before) => new Set([...before, key]));
                    setStatus(translations.tree.loadingNode(target.label));
                    onLoadChildren?.(target);
                }
                return;
            }
            setCollapsed(collapsed.has(key) ? [...collapsed].filter((other) => other !== key) : [...collapsed, key]);
        },
        select(key) {
            const next =
                selectionMode === 'multiple'
                    ? selected.includes(key)
                        ? selected.filter((other) => other !== key)
                        : [...selected, key]
                    : selected.includes(key)
                      ? []
                      : [key];
            setSelectedInternal(next);
            onSelectedKeysChange?.(next);
        },
        renderContent,
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            <ChartContext value={chart}>
                <ul aria-label={label} className={styles.rootList()}>
                    <li className={styles.rootItem()}>
                        <Box node={root} path="0" />
                    </li>
                </ul>
            </ChartContext>
            {collapsible && (loadChildren || dataSource || asked.size > 0) && (
                <p role="status" className={styles.status()}>
                    {status}
                </p>
            )}
        </div>
    );
}

/** One node: its box (a toggle button when nodes can be chosen), the button that shows or hides its team, the team */
function Box({ node, path }: { node: OrgChartNode; path: string }) {
    const orgChart = useRecipe('orgChart', orgChartRecipe);
    const styles = orgChart();
    const t = useLocale().translations.orgChart;
    const chart = useContext(ChartContext)!;
    const key = node.id ?? path;
    const expanded = chart.expanded(node, key);
    const loading = chart.loading(key);
    const failed = chart.failed(key);
    const state: OrgChartNodeState = { key, selected: chart.selected(key), expanded, loading };
    const content = chart.renderContent ? (
        chart.renderContent(node, state)
    ) : (
        <>
            <span className={styles.label()}>{node.label}</span>
            {node.title && <span className={styles.title()}>{node.title}</span>}
        </>
    );
    const branch = isBranchNode(node) && (!!node.children?.length || isLazyNode(node));
    return (
        <>
            {chart.selectable ? (
                // A node that can be chosen is a toggle button (aria-pressed)
                <button
                    type="button"
                    className={styles.node({ class: styles.selectable() })}
                    aria-pressed={state.selected}
                    onClick={() => chart.select(key)}
                >
                    {content}
                </button>
            ) : (
                <div className={styles.node()}>{content}</div>
            )}
            {chart.collapsible && branch && (
                <button
                    type="button"
                    className={styles.toggle()}
                    aria-expanded={expanded}
                    aria-busy={loading || undefined}
                    data-error={failed || undefined}
                    aria-label={failed ? t.retry(node.label) : expanded ? t.collapse(node.label) : t.expand(node.label)}
                    onClick={() => chart.toggle(node, key)}
                >
                    {loading ? (
                        <LoaderCircle className={styles.toggleSpinner()} aria-hidden="true" />
                    ) : failed ? (
                        <RotateCw className={styles.toggleIcon()} aria-hidden="true" />
                    ) : (
                        <ChevronDown className={styles.toggleIcon()} aria-hidden="true" />
                    )}
                </button>
            )}
            {!!node.children?.length && expanded && (
                <ul className={styles.list()}>
                    {node.children.map((child, index) => (
                        <li key={index} className={styles.item()}>
                            <Box node={child} path={`${path}-${index}`} />
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
