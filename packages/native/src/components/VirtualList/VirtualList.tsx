import { virtualList, type DataQuery, type DataSource, type ItemAccessor } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useImperativeHandle, useMemo, useRef, type ReactNode, type Ref } from 'react';
import {
    FlatList,
    Platform,
    SectionList,
    Text,
    View,
    type DimensionValue,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Loader } from '../../utils/Loader.js';
import { Button } from '../Button/Button.js';
import { useDataList } from './useDataList.js';

export interface VirtualListProps<T> {
    /** The items (with `dataSource` the list loads them itself) */
    items?: readonly T[];
    /** Accessible name of the list */
    label: string;
    /**
     * Fixed height of every item in pt: the list knows all positions without measuring (getItemLayout) – faster
     * scrolling and `scrollToIndex` to any item. Leave it out when the items differ in height.
     */
    itemHeight?: number;
    /** Height of the scroll area, e.g. 320 or "100%" (default 320) */
    height?: DimensionValue;
    /** Group heading of an item (property name or function): a SectionList whose headings stick to the top */
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    /** More items can be loaded: the end of the list (or "Load more") calls onLoadMore */
    hasMore?: boolean;
    /** The next items are loading: a loading row at the end (aria-busy) */
    loading?: boolean;
    /** @deprecated Same as `loading` (the name of the other lists) */
    loadingMore?: boolean;
    /** How many items before the end onLoadMore is called (default 5) */
    endThreshold?: number;
    /** The end of the list came near (hasMore) or "Load more" was pressed – load the next items */
    onLoadMore?: () => void;
    /** @deprecated Same as `onLoadMore` (the name of the other lists) */
    onEndReached?: () => void;
    /** Loads the items page by page while scrolling (instead of `items`); errors show "Try again" */
    dataSource?: DataSource<T>;
    /** Sorting, filters and search for the data source; a change starts over */
    query?: Omit<DataQuery, 'page' | 'pageSize' | 'cursor'>;
    /** Items per request of the data source (default 50) */
    pageSize?: number;
    /** Shown when there is no item (default "No entries") */
    emptyText?: string;
    /** Renders one item */
    children: (item: T, index: number) => ReactNode;
    className?: string;
    style?: StyleProp<ViewStyle>;
    /** Methods: scrollToIndex, refresh */
    ref?: Ref<VirtualListHandle>;
}

/** Methods of a VirtualList (ref) */
export interface VirtualListHandle {
    /** Scrolls an item into view (index in the items) */
    scrollToIndex(index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }): void;
    /** Loads the data source again from the start */
    refresh(): void;
}

interface Section<T> {
    title: string;
    /** Position of the section's first item among all items */
    start: number;
    data: T[];
}

const viewPosition = { start: 0, center: 0.5, end: 1, auto: 0 } as const;
const NO_ITEMS: never[] = [];

/**
 * A long list that renders only what is in view (FlatList; with `itemGroup` a SectionList with sticky headings).
 * The end loads more (`hasMore` + `onLoadMore`, or a data source) – "Load more" does the same for screen reader
 * and keyboard users; loading, empty and error rows at the end, the data source's state announced.
 */
export function VirtualList<T>({
    items = NO_ITEMS,
    label,
    itemHeight,
    height = 320,
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
    emptyText,
    children,
    className,
    style,
    ref,
}: VirtualListProps<T>) {
    const { translations } = useLocale();
    const styles = virtualList();
    const web = Platform.OS === 'web';
    const flat = useRef<FlatList<T>>(null);
    const sectioned = useRef<SectionList<T, Section<T>>>(null);
    const source = useDataList<T>({ source: dataSource, pageSize, query });
    const { announce, region } = useAnnouncer();
    useEffect(() => {
        if (source.announcement) announce(source.announcement);
    }, [source.announcement, announce]);

    const list: readonly T[] = dataSource ? source.state.items : items;
    const more = dataSource ? source.state.hasMore : hasMore;
    const busy = dataSource ? source.state.status === 'loading' : loading || loadingMore;
    const failed = !!dataSource && source.state.status === 'error';
    const extended = !!dataSource || hasMore || loading || loadingMore;

    // Groups: consecutive items with the same heading
    const sections = useMemo<Section<T>[] | null>(() => {
        if (!itemGroup) return null;
        const groupOf = (item: T) => {
            const group =
                typeof itemGroup === 'function'
                    ? itemGroup(item)
                    : (item as Record<string, unknown> | null)?.[itemGroup];
            return group === null || group === undefined ? '' : String(group);
        };
        const result: Section<T>[] = [];
        list.forEach((item, index) => {
            const title = groupOf(item);
            const last = result.at(-1);
            if (last && last.title === title) last.data.push(item);
            else result.push({ title, start: index, data: [item] });
        });
        return result;
    }, [list, itemGroup]);

    // Near the end: ask for more, once per length of the list
    const asked = useRef(-1);
    const loadMore = () => {
        if (!more || busy || failed || asked.current === list.length) return;
        asked.current = list.length;
        if (dataSource) source.loadMore();
        else {
            onLoadMore?.();
            onEndReached?.();
        }
    };
    const pressMore = () => {
        asked.current = -1;
        loadMore();
    };

    useImperativeHandle(ref, () => ({
        scrollToIndex(index, options = {}) {
            const position = viewPosition[options.align ?? 'auto'];
            if (!sections) {
                flat.current?.scrollToIndex({ index, viewPosition: position, animated: true });
                return;
            }
            const sectionIndex = sections.findLastIndex((section) => section.start <= index);
            if (sectionIndex < 0) return;
            sectioned.current?.scrollToLocation({
                sectionIndex,
                // Item 0 of a section is its heading
                itemIndex: index - sections[sectionIndex]!.start + 1,
                viewPosition: position,
            });
        },
        refresh: () => source.refresh(),
    }));

    const t = translations.dataSource;
    const footer = (
        <>
            {failed ? (
                <View role="alert" className={styles.error()}>
                    <Text className={styles.errorText()}>{t.error}</Text>
                    <Button variant="outline" size="sm" onPress={() => source.retry()}>
                        {t.retry}
                    </Button>
                </View>
            ) : busy ? (
                <View className={styles.status()}>
                    <Loader className={styles.spinner()} />
                    <Text className={styles.statusText()}>
                        {list.length ? t.loadingMore : translations.common.loading}
                    </Text>
                </View>
            ) : more ? (
                <View className={styles.more()}>
                    <Button variant="outline" size="sm" onPress={pressMore}>
                        {t.loadMore}
                    </Button>
                </View>
            ) : (
                !list.length && (
                    <View className={styles.status()}>
                        <Text className={styles.statusText()}>
                            {emptyText ?? (dataSource ? t.empty : translations.common.empty)}
                        </Text>
                    </View>
                )
            )}
        </>
    );

    const renderItem = (item: T, index: number) => (
        <View
            role="listitem"
            {...(web && !sections ? { 'aria-posinset': index + 1, 'aria-setsize': list.length } : {})}
            className={styles.item()}
        >
            {children(item, index)}
        </View>
    );
    const common = {
        // An empty list is no list (axe: a list needs items); the web can reach the scrolling box with the keyboard
        ...(list.length ? { role: 'list' as const, 'aria-label': label } : {}),
        ...(web ? { tabIndex: 0 as const } : {}),
        'aria-busy': (extended && busy) || undefined,
        className: styles.base({ class: className }),
        style: [{ height }, style],
        keyExtractor: (_: T, index: number) => String(index),
        onEndReached: loadMore,
        // endThreshold items before the end, measured in heights of the visible area
        onEndReachedThreshold: Math.max(
            0.1,
            (endThreshold * (itemHeight ?? 48)) / (typeof height === 'number' && height > 0 ? height : 320)
        ),
    };

    return (
        <>
            {sections ? (
                <SectionList<T, Section<T>>
                    ref={sectioned}
                    {...common}
                    sections={sections}
                    stickySectionHeadersEnabled
                    renderSectionHeader={({ section }) =>
                        section.title ? (
                            // A heading among list items – wrapped in an item, so the list keeps only items
                            <View role="listitem" className={styles.groupHeader()}>
                                <Text role="heading" className={styles.groupHeaderText()}>
                                    {section.title}
                                </Text>
                            </View>
                        ) : null
                    }
                    renderItem={({ item, index, section }) => renderItem(item, section.start + index)}
                />
            ) : (
                <FlatList<T>
                    ref={flat}
                    {...common}
                    data={list}
                    renderItem={({ item, index }) => renderItem(item, index)}
                    {...(itemHeight
                        ? {
                              getItemLayout: (_: ArrayLike<T> | null | undefined, index: number) => ({
                                  length: itemHeight,
                                  offset: itemHeight * index,
                                  index,
                              }),
                          }
                        : {})}
                    onScrollToIndexFailed={(info) => {
                        // Not measured yet: scroll near it, then exactly
                        flat.current?.scrollToOffset({ offset: info.averageItemLength * info.index });
                        setTimeout(() => flat.current?.scrollToIndex({ index: info.index, animated: true }), 100);
                    }}
                />
            )}
            {/* Below the scrolling box: loading, "Load more" and empty are not items of the list */}
            {footer}
            {region}
        </>
    );
}
