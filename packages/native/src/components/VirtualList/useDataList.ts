import {
    createDataList,
    dataListAnnouncement,
    type DataList,
    type DataListState,
    type DataQuery,
    type DataSource,
} from '@wirecore/wirelayer-recipes/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../../locale.js';

const idle: DataListState<never> = {
    status: 'idle',
    items: [],
    loadingMore: false,
    hasMore: false,
    search: '',
    tooShort: false,
};

/**
 * A list that grows page by page from a data source (VirtualList, DataView `loadMode="infinite"`, DataTable with
 * `onLoadMore`) – the logic of @wirecore/wirelayer-recipes DataList: the query's search starts over (after the typing pause,
 * the first time at once), `loadMore()` appends the next page, outdated answers are dropped. `query` without the
 * search starts over when its content changes.
 */
export function useDataList<T>({
    source,
    pageSize,
    query,
}: {
    source: DataSource<T> | undefined;
    pageSize?: number;
    query?: Omit<DataQuery, 'page' | 'pageSize' | 'cursor'>;
}) {
    const { translations, locale } = useLocale();
    const [state, setState] = useState<DataListState<T>>(idle);
    const list = useRef<DataList<T> | undefined>(undefined);
    const { search = '', ...rest } = query ?? {};
    const restText = JSON.stringify(rest);
    const settings = useRef({ source, pageSize, rest });
    useEffect(() => {
        settings.current = { source, pageSize, rest };
    });
    useEffect(() => {
        if (!source) return;
        list.current?.configure({ source, pageSize, query: settings.current.rest });
    }, [source, pageSize, restText]);
    useEffect(
        () => () => {
            list.current?.dispose();
            list.current = undefined;
        },
        []
    );
    // The first page at once, a changed search after the typing pause
    const searched = useRef<string | null>(null);
    useEffect(() => {
        const current = settings.current;
        if (!current.source) return;
        list.current ??= createDataList<T>({
            source: current.source,
            pageSize: current.pageSize,
            query: current.rest,
            onChange: setState,
        });
        const first = searched.current === null;
        searched.current = search;
        void list.current.search(search, { debounce: !first });
    }, [source, search]);

    return useMemo(
        () => ({
            /** A source is set */
            active: !!source,
            state,
            loadMore: () => void list.current?.loadMore(),
            retry: () => void list.current?.retry(),
            refresh: () => void list.current?.refresh(),
            /** "Loading", "12 items loaded" … */
            announcement: source ? dataListAnnouncement(state, translations, locale) : '',
        }),
        [source, state, translations, locale]
    );
}
