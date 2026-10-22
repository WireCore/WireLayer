import {
    createDataController,
    dataAnnouncement,
    dataView as dataViewRecipe,
    type DataQuery,
    type DataSource,
    type DataState,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { LayoutGrid, List } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useDataSource } from '../../utils/data-source.js';
import { Button } from '../Button/Button.js';
import { Pagination } from '../Pagination/Pagination.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { SegmentedControlItem } from '../SegmentedControl/SegmentedControlItem.js';
import { LoadMore } from '../Select/list.js';
import { Skeleton } from '../Skeleton/Skeleton.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface DataViewProps<T> {
    items?: T[];
    /** Accessible name of the list, e.g. "Server" */
    label: string;
    layout?: 'list' | 'grid';
    defaultLayout?: 'list' | 'grid';
    onLayoutChange?: (layout: 'list' | 'grid') => void;
    /** Switch between list and grid above the items */
    layoutToggle?: boolean;
    /** Items per page – enables pagination (onPageSizeChange with `pageSizes`) */
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    /** Page sizes to choose from below the items */
    pageSizes?: number[];
    /** Current page, 1-based */
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    /** The items are the current page only (server); `totalCount` is the number of all items */
    manual?: boolean;
    /** Number of all items (`manual`) */
    totalCount?: number;
    /** Loads the items (pages, or growing with `loadMode: 'infinite'`); `query` adds sorting, filters, search */
    dataSource?: DataSource<T>;
    /** Sorting, filters and search for the data source (e.g. from the toolbar); a change starts at page 1 */
    query?: Omit<DataQuery, 'page' | 'pageSize' | 'cursor'>;
    /** `pages` (default): pagination below the items; `infinite`: the list grows with "Load more" */
    loadMode?: 'pages' | 'infinite';
    /** `infinite`: loads the next page when the end of the list scrolls into view (the button stays as fallback) */
    autoLoad?: boolean;
    /** More items can be loaded (`infinite` without a data source): the button calls onLoadMore */
    hasMore?: boolean;
    /** "Load more" (`infinite` without a data source) */
    onLoadMore?: () => void;
    /** Placeholder items while there are none yet, "Loading" on the button otherwise (aria-busy) */
    loading?: boolean;
    /** Placeholder items while loading (default: the page size, at most 6) */
    skeletonCount?: number;
    /** The items are filtered: shows the no-results text (`noResults`) instead of the empty text */
    filtered?: boolean;
    /** An error to show instead of the items (`renderError`); a data source sets it itself */
    error?: unknown;
    emptyText?: string;
    /** Content before the switch, e.g. a search field */
    header?: ReactNode;
    /** Sorting and filters above the items */
    toolbar?: ReactNode;
    /** Shown without items */
    empty?: ReactNode;
    /** Shown without items while filtered */
    noResults?: ReactNode;
    /** Shown instead of the items after an error */
    renderError?: (error: unknown, retry: () => void) => ReactNode;
    /** Renders one item */
    children: (item: T, layout: 'list' | 'grid') => ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dataViewRecipe>;
}

/** Items as a list or grid (a list either way); the switch is a radio group "View" */
export function DataView<T>({
    classes,
    items = [],
    label,
    layout,
    defaultLayout = 'list',
    onLayoutChange,
    layoutToggle = true,
    pageSize,
    onPageSizeChange,
    pageSizes,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    manual = false,
    totalCount,
    dataSource,
    query,
    loadMode = 'pages',
    autoLoad = false,
    hasMore = false,
    onLoadMore,
    loading = false,
    skeletonCount,
    filtered = false,
    error,
    emptyText,
    header,
    toolbar,
    empty,
    noResults,
    renderError,
    children,
    className,
    style,
}: DataViewProps<T>) {
    const dataView = useRecipe('dataView', dataViewRecipe, classes);
    const { translations, locale } = useLocale();
    const t = translations.dataView;
    const [internal, setInternal] = useState(defaultLayout);
    const current = layout ?? internal;
    const [pageInternal, setPageInternal] = useState(defaultPage);
    const page = pageProp ?? pageInternal;
    const setPage = (next: number) => {
        setPageInternal(next);
        onPageChange?.(next);
    };
    const [sizeInternal, setSizeInternal] = useState(pageSize);
    const [lastSize, setLastSize] = useState(pageSize);
    if (pageSize !== lastSize) {
        setLastSize(pageSize);
        setSizeInternal(pageSize);
    }
    const size = sizeInternal;
    const setSize = (next: number) => {
        setSizeInternal(next);
        onPageSizeChange?.(next);
        setPage(1);
    };
    const infinite = loadMode === 'infinite';
    const queryText = JSON.stringify(query ?? {});

    // Data source, pages: one page per request
    const [paged, setPaged] = useState<DataState<T>>({ status: 'idle', items: [] });
    // One controller for the life of the view (it answers only the newest request)
    const [controller] = useState(() =>
        createDataController<T>({ source: { getItems: async () => ({ items: [] }) }, onChange: setPaged })
    );
    const pagedSource = dataSource && !infinite ? dataSource : undefined;
    // A new query starts at page 1
    const [pageQuery, setPageQuery] = useState(queryText);
    if (pageQuery !== queryText) {
        setPageQuery(queryText);
        setPageInternal(1);
    }
    const lastQuery = useRef(queryText);
    useEffect(() => {
        if (!pagedSource) return;
        if (pageProp !== undefined && pageProp !== 1 && lastQuery.current !== queryText) {
            lastQuery.current = queryText;
            onPageChange?.(1);
            return;
        }
        lastQuery.current = queryText;
        controller.configure({ source: pagedSource });
        void controller.load({ ...query, page, pageSize: size });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the query counts by content (queryText)
    }, [pagedSource, page, size, queryText]);
    useEffect(() => () => controller.abort(), [controller]);

    // Data source, infinite: the list grows page by page
    const { search, ...rest } = query ?? {};
    const growing = useDataSource<T>({
        source: infinite ? dataSource : undefined,
        pageSize: size,
        query: query ? rest : undefined,
    });
    const growingSearch = useRef<string | null>(null);
    useEffect(() => {
        if (!infinite || !dataSource) return;
        const first = growingSearch.current === null;
        growingSearch.current = search ?? '';
        growing.search(search ?? '', !first);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the search changes
    }, [infinite, dataSource, search]);

    const sourceState: DataState<T> | undefined = !dataSource ? undefined : infinite ? growing.state : paged;
    const all = sourceState?.items ?? items;
    const total = sourceState ? (sourceState.totalCount ?? all.length) : (totalCount ?? items.length);
    const serverPaged = manual || !!pagedSource;
    const visible = size && !infinite && !serverPaged ? all.slice((page - 1) * size, page * size) : all;
    const failed = sourceState?.status === 'error' ? sourceState.error : error;
    const busy = loading || sourceState?.status === 'loading';
    const firstLoad = busy && !all.length;
    const skeletons = skeletonCount ?? Math.min(size ?? 6, 6);
    const more = dataSource ? !!growing.state.hasMore : hasMore;
    const isFiltered = filtered || !!query?.search || !!Object.keys(query?.filters ?? {}).length;
    const announces = !!dataSource || loading || manual;
    const announcement = sourceState
        ? dataAnnouncement(sourceState, translations, locale)
        : loading
          ? translations.common.loading
          : '';
    const retry = () => {
        if (infinite) growing.retry();
        else void controller.refresh();
    };
    const loadMore = () => {
        if (dataSource) growing.loadMore();
        else onLoadMore?.();
    };
    const styles = dataView({ layout: current });

    let body: ReactNode;
    if (failed)
        body = (
            <div role="alert" className={styles.error()}>
                {renderError ? (
                    renderError(failed, retry)
                ) : (
                    <>
                        {translations.dataSource.error}
                        {dataSource && (
                            <Button variant="outline" size="sm" onClick={retry}>
                                {translations.dataSource.retry}
                            </Button>
                        )}
                    </>
                )}
            </div>
        );
    else if (firstLoad)
        body = (
            <ul className={styles.items()} aria-label={label} aria-busy="true">
                {Array.from({ length: skeletons }, (_, index) => (
                    <li key={index} className={styles.item()}>
                        <div className={styles.skeleton()}>
                            <Skeleton width="60%" />
                            <Skeleton width="85%" />
                        </div>
                    </li>
                ))}
            </ul>
        );
    else if (all.length)
        body = (
            <ul className={styles.items()} aria-label={label} aria-busy={(announces && busy) || undefined}>
                {visible.map((item, index) => (
                    <li key={index} className={styles.item()}>
                        {children(item, current)}
                    </li>
                ))}
            </ul>
        );
    else if (isFiltered && noResults) body = <p className={styles.empty()}>{noResults}</p>;
    else
        body = (
            <p className={styles.empty()}>
                {empty ?? emptyText ?? (isFiltered ? translations.common.noResults : translations.common.empty)}
            </p>
        );

    return (
        <div className={styles.base({ class: className })} style={style}>
            {(layoutToggle || header) && (
                <div className={styles.header()}>
                    {header}
                    {layoutToggle && (
                        <SegmentedControl
                            value={current}
                            label={t.layout}
                            onValueChange={(next) => {
                                if (next !== 'list' && next !== 'grid') return;
                                setInternal(next);
                                onLayoutChange?.(next);
                            }}
                        >
                            <SegmentedControlItem value="list" icon={List}>
                                {t.list}
                            </SegmentedControlItem>
                            <SegmentedControlItem value="grid" icon={LayoutGrid}>
                                {t.grid}
                            </SegmentedControlItem>
                        </SegmentedControl>
                    )}
                </div>
            )}
            {toolbar && <div className={styles.header()}>{toolbar}</div>}
            {body}
            {infinite && !failed && all.length > 0 && (more || total > all.length) && (
                <div className={styles.footer()}>
                    {total > all.length && <span className={styles.summary()}>{t.shown(all.length, total)}</span>}
                    {more && (
                        <Button variant="outline" size="sm" loading={busy} onClick={loadMore}>
                            {busy ? translations.dataSource.loadingMore : t.loadMore}
                        </Button>
                    )}
                    {autoLoad && more && (
                        <LoadMore className={styles.sentinel()} active={!busy} count={all.length} onLoad={loadMore} />
                    )}
                </div>
            )}
            {!infinite && !!size && total > size && (
                <Pagination
                    count={total}
                    pageSize={size}
                    pageSizes={pageSizes}
                    page={page}
                    translations={{ rootLabel: `${label}: ${translations.pagination.rootLabel}` }}
                    onPageChange={setPage}
                    onPageSizeChange={setSize}
                />
            )}
            {announces && (
                <p role="status" className={styles.status()}>
                    {announcement}
                </p>
            )}
        </div>
    );
}
