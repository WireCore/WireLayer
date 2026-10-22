import {
    createDataController,
    dataAnnouncement,
    dataView,
    type DataQuery,
    type DataSource,
    type DataState,
} from '@wirecore/wirelayer-recipes/native';
import { LayoutGrid, List } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FlatList, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { Pagination } from '../Pagination/Pagination.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { Skeleton } from '../Skeleton/Skeleton.js';
import { useDataList } from '../VirtualList/useDataList.js';

export interface DataViewProps<T> {
    items?: readonly T[];
    /** Accessible name of the list, e.g. "Server" */
    label: string;
    layout?: 'list' | 'grid';
    defaultLayout?: 'list' | 'grid';
    onLayoutChange?: (layout: 'list' | 'grid') => void;
    /** Switch between list and grid above the items (default true) */
    layoutToggle?: boolean;
    /** Items side by side in the grid (default: 2, more on wide screens – one per 220 pt) */
    gridColumns?: number;
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
    /** Classes of the view – e.g. `flex-1` in a screen: the items scroll between toolbar and pagination */
    className?: string;
    style?: StyleProp<ViewStyle>;
}

const chunk = <T,>(items: readonly T[], size: number): T[][] => {
    const rows: T[][] = [];
    for (let index = 0; index < items.length; index += size) rows.push(items.slice(index, index + size));
    return rows;
};

/**
 * Items as a list or grid (a list either way, the switch is a radio group "View"), with pages or growing
 * ("Load more", optionally at the end of the scrolling), loading placeholders, empty and error states – from
 * `items` or a data source. The items scroll in a FlatList.
 */
export function DataView<T>({
    items = [],
    label,
    layout,
    defaultLayout = 'list',
    onLayoutChange,
    layoutToggle = true,
    gridColumns,
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
    const { translations, locale } = useLocale();
    const t = translations.dataView;
    const [current, setLayout] = useControllable(layout, defaultLayout, onLayoutChange);
    const [width, setWidth] = useState(0);
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

    // Data source, pages: one page per request (the controller answers only the newest request)
    const [paged, setPaged] = useState<DataState<T>>({ status: 'idle', items: [] });
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
    const growing = useDataList<T>({ source: infinite ? dataSource : undefined, pageSize: size, query });

    const sourceState: DataState<T> | undefined = !dataSource ? undefined : infinite ? growing.state : paged;
    const all: readonly T[] = sourceState?.items ?? items;
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
    const announcement = !announces
        ? ''
        : sourceState
          ? dataAnnouncement(sourceState, translations, locale)
          : loading
            ? translations.common.loading
            : '';
    const { announce, region } = useAnnouncer();
    useEffect(() => {
        if (announcement) announce(announcement);
    }, [announcement, announce]);
    const retry = () => {
        if (infinite) growing.retry();
        else void controller.refresh();
    };
    const asked = useRef(-1);
    const loadMore = () => {
        if (!more || busy) return;
        if (dataSource) growing.loadMore();
        else onLoadMore?.();
    };
    // The end of the list (autoLoad): once per length
    const onEnd = () => {
        if (asked.current === all.length) return;
        asked.current = all.length;
        loadMore();
    };
    const styles = dataView({ layout: current });
    const columns = current === 'grid' ? (gridColumns ?? Math.max(2, Math.floor(width / 220))) : 1;

    let body: ReactNode;
    if (failed)
        body = (
            <View role="alert" className={styles.error()}>
                {renderError ? (
                    renderError(failed, retry)
                ) : (
                    <>
                        <Text className={styles.errorText()}>{translations.dataSource.error}</Text>
                        {!!dataSource && (
                            <Button variant="outline" size="sm" onPress={retry}>
                                {translations.dataSource.retry}
                            </Button>
                        )}
                    </>
                )}
            </View>
        );
    else if (firstLoad || all.length) {
        const placeholders = Array.from({ length: skeletons }, (_, index) => index);
        body = (
            <FlatList<(T | number)[]>
                data={firstLoad ? chunk(placeholders, columns) : chunk(visible, columns)}
                keyExtractor={(_, index) => String(index)}
                role="list"
                aria-label={label}
                aria-busy={firstLoad || (announces && busy) || undefined}
                contentContainerClassName={styles.content()}
                onEndReached={infinite && autoLoad && !firstLoad ? onEnd : undefined}
                onEndReachedThreshold={0.5}
                renderItem={({ item: row }) => {
                    const cells = row.map((entry, index) => (
                        <View key={index} role="listitem" className={columns > 1 ? styles.cell() : styles.item()}>
                            {firstLoad ? (
                                <View className={styles.skeleton()}>
                                    <Skeleton width="60%" />
                                    <Skeleton width="85%" />
                                </View>
                            ) : (
                                children(entry as T, current)
                            )}
                        </View>
                    ));
                    if (columns === 1) return <>{cells}</>;
                    // A short last line keeps the width of the others
                    const fill = Array.from({ length: columns - row.length }, (_, index) => (
                        <View key={`fill${index}`} className={styles.cell()} />
                    ));
                    return (
                        <View className={styles.row()}>
                            {cells}
                            {fill}
                        </View>
                    );
                }}
            />
        );
    } else if (isFiltered && noResults) body = <View className={styles.status()}>{noResults}</View>;
    else
        body = (
            <View className={styles.status()}>
                {empty ?? (
                    <Text className={styles.empty()}>
                        {emptyText ?? (isFiltered ? translations.common.noResults : translations.common.empty)}
                    </Text>
                )}
            </View>
        );

    return (
        <View
            className={styles.base({ class: className })}
            style={style}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        >
            {(layoutToggle || !!header) && (
                <View className={styles.header()}>
                    {header}
                    {layoutToggle && (
                        <SegmentedControl
                            label={t.layout}
                            size="sm"
                            value={current}
                            onValueChange={(next) => {
                                if (next === 'list' || next === 'grid') setLayout(next);
                            }}
                            items={[
                                { value: 'list', label: t.list, icon: List },
                                { value: 'grid', label: t.grid, icon: LayoutGrid },
                            ]}
                        />
                    )}
                </View>
            )}
            {!!toolbar && <View className={styles.toolbar()}>{toolbar}</View>}
            {body}
            {infinite && !failed && all.length > 0 && (more || total > all.length) && (
                <View className={styles.footer()}>
                    {total > all.length && <Text className={styles.summary()}>{t.shown(all.length, total)}</Text>}
                    {more && (
                        <Button variant="outline" size="sm" loading={busy} onPress={loadMore}>
                            {busy ? translations.dataSource.loadingMore : t.loadMore}
                        </Button>
                    )}
                </View>
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
            {region}
        </View>
    );
}
