import { defaultRangeExtractor, useVirtualizer, type Range } from '@tanstack/react-virtual';
import {
    virtualListBox as virtualListBoxRecipe,
    type DataQuery,
    type DataSource,
    type ItemAccessor,
} from '@wirecore/wirelayer-recipes';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useImperativeHandle, useMemo, useRef, type CSSProperties, type ReactNode, type Ref } from 'react';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import { useDataSource } from '../utils/data-source.js';

export interface VirtualListProps<T> {
    items?: readonly T[];
    /** Accessible name of the list */
    label: string;
    /** Estimated row height in px (rows are measured when shown) */
    itemHeight?: number;
    /** Estimated height of one item, when the heights differ a lot (rows are measured when shown) */
    estimateSize?: (item: T, index: number) => number;
    /** Height of the scroll area (CSS length) */
    height?: string;
    /** Group heading of an item (property name or function); the heading of the group in view sticks to the top */
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    /** More items can be loaded: scrolling near the end calls onLoadMore */
    hasMore?: boolean;
    /** The next items are loading: a loading row at the end */
    loading?: boolean;
    /** @deprecated Same as `loading` (the name of the other lists) */
    loadingMore?: boolean;
    /** How many rows before the end onLoadMore is called (default 5) */
    endThreshold?: number;
    /** The end of the list scrolled near (hasMore) – load the next items */
    onLoadMore?: () => void;
    /** @deprecated Same as `onLoadMore` (the name of the other lists) */
    onEndReached?: () => void;
    /** Loads the items page by page while scrolling (instead of `items`) */
    dataSource?: DataSource<T>;
    /** Sorting, filters and search for the data source; a change starts over */
    query?: Omit<DataQuery, 'page' | 'pageSize' | 'cursor'>;
    /** Items per request of the data source (default 50) */
    pageSize?: number;
    /** Renders one row */
    children: (item: T, index: number) => ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Methods: scrollToIndex, refresh */
    ref?: Ref<VirtualListHandle>;
}

/** Methods of a VirtualList (ref) */
export interface VirtualListHandle {
    /** Scrolls an item into view (index in `items`) */
    scrollToIndex(index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }): void;
    /** Loads the data source again from the start */
    refresh(): void;
}

type Row<T> = { kind: 'item'; item: T; index: number } | { kind: 'header'; label: string };

/**
 * Only the visible rows are in the DOM; each row says its position (aria-posinset/setsize), so screen readers
 * still know the length. The area scrolls with the keyboard (tabindex).
 */
export function VirtualList<T>({
    items = [],
    label,
    itemHeight = 40,
    estimateSize,
    height = '20rem',
    itemGroup,
    hasMore = false,
    loading = false,
    loadingMore = false,
    endThreshold = 5,
    onLoadMore,
    onEndReached,
    dataSource,
    query,
    pageSize,
    children,
    className,
    style,
    ref,
}: VirtualListProps<T>) {
    const virtualListBox = useRecipe('virtualListBox', virtualListBoxRecipe);
    const styles = virtualListBox();
    const translations = useTranslations();
    const scrollElement = useRef<HTMLDivElement>(null);

    // A data source fills the list page by page
    const { search, ...rest } = query ?? {};
    const source = useDataSource<T>({ source: dataSource, pageSize, query: query ? rest : undefined });
    const searched = useRef<string | null>(null);
    useEffect(() => {
        if (!dataSource) return;
        const first = searched.current === null;
        searched.current = search ?? '';
        source.search(search ?? '', !first);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the search changes
    }, [dataSource, search]);
    const list = dataSource ? source.state.items : items;
    const more = dataSource ? source.state.hasMore : hasMore;
    const busy = dataSource ? source.state.status === 'loading' : loading || loadingMore;

    // Rows: the items, with a heading row before each group (itemGroup)
    const rows = useMemo<Row<T>[]>(() => {
        if (!itemGroup) return list.map((item, index) => ({ kind: 'item', item, index }));
        const groupOf = (item: T) => {
            const group =
                typeof itemGroup === 'function'
                    ? itemGroup(item)
                    : (item as Record<string, unknown> | null)?.[itemGroup];
            return group === null || group === undefined || group === '' ? undefined : String(group);
        };
        const result: Row<T>[] = [];
        let last: string | undefined;
        list.forEach((item, index) => {
            const group = groupOf(item);
            if (group !== undefined && group !== last) result.push({ kind: 'header', label: group });
            last = group;
            result.push({ kind: 'item', item, index });
        });
        return result;
    }, [list, itemGroup]);
    const headers = useMemo(() => rows.flatMap((row, index) => (row.kind === 'header' ? [index] : [])), [rows]);
    // The heading of the group in view stays rendered (and sticks), wherever the range is
    const headerAt = (start: number) => [...headers].reverse().find((index) => start >= index) ?? -1;
    // TanStack Virtual returns a mutable instance, so the React Compiler skips this component – expected
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => scrollElement.current,
        estimateSize: (index) => {
            const row = rows[index];
            return row?.kind === 'item' && estimateSize ? estimateSize(row.item, row.index) : itemHeight;
        },
        // A hidden list measures 0 px – keep the estimate then
        measureElement: (element) => element.getBoundingClientRect().height || itemHeight,
        overscan: 6,
        rangeExtractor: headers.length
            ? (range: Range) => {
                  const active = headerAt(range.startIndex);
                  const indexes = new Set(defaultRangeExtractor(range));
                  if (active >= 0) indexes.add(active);
                  return [...indexes].sort((a, b) => a - b);
              }
            : defaultRangeExtractor,
        // Render the first rows before the list is measured (SSR, tests)
        initialRect: { width: 0, height: 320 },
    });
    const virtualRows = virtualizer.getVirtualItems();
    const activeHeader = headers.length ? headerAt(virtualizer.range?.startIndex ?? 0) : -1;

    // Near the end: ask for more, once per length of the list
    const asked = useRef(-1);
    const last = virtualRows.at(-1)?.index;
    useEffect(() => {
        if (last === undefined || !more || busy || asked.current === rows.length) return;
        if (last < rows.length - 1 - endThreshold) return;
        asked.current = rows.length;
        if (dataSource) source.loadMore();
        else {
            onLoadMore?.();
            onEndReached?.();
        }
    });
    const extended = !!dataSource || hasMore || loading || loadingMore;
    useImperativeHandle(ref, () => ({
        scrollToIndex(index, options = {}) {
            const row = rows.findIndex((entry) => entry.kind === 'item' && entry.index === index);
            if (row >= 0) virtualizer.scrollToIndex(row, { align: options.align ?? 'auto' });
        },
        refresh: () => source.refresh(),
    }));

    const listElement = (
        <div
            ref={scrollElement}
            role="list"
            aria-label={label}
            aria-busy={(extended && busy) || undefined}
            tabIndex={0}
            className={styles.base({ class: className })}
            style={{ height, ...style }}
        >
            <div className={styles.spacer()} style={{ height: virtualizer.getTotalSize() }}>
                {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    if (!row) return null;
                    if (row.kind === 'header') {
                        const sticky = virtualRow.index === activeHeader;
                        return (
                            <div
                                key={virtualRow.key}
                                ref={virtualizer.measureElement}
                                role="presentation"
                                data-index={virtualRow.index}
                                className={
                                    sticky
                                        ? styles.groupHeader({ class: styles.sticky() })
                                        : styles.item({ class: styles.groupHeader() })
                                }
                                style={sticky ? undefined : { transform: `translateY(${virtualRow.start}px)` }}
                            >
                                {row.label}
                            </div>
                        );
                    }
                    return (
                        <div
                            key={virtualRow.key}
                            ref={virtualizer.measureElement}
                            role="listitem"
                            aria-posinset={row.index + 1}
                            aria-setsize={list.length}
                            data-index={virtualRow.index}
                            className={styles.item()}
                            style={{ transform: `translateY(${virtualRow.start}px)` }}
                        >
                            {children(row.item, row.index)}
                        </div>
                    );
                })}
            </div>
            {extended && busy && list.length > 0 && (
                <div className={styles.loading()} aria-hidden="true">
                    <LoaderCircle className={styles.loadingIcon()} />
                    {translations.dataSource.loadingMore}
                </div>
            )}
        </div>
    );
    if (!dataSource) return listElement;
    return (
        <>
            {listElement}
            <p role="status" className={styles.status()}>
                {source.announcement}
            </p>
        </>
    );
}
