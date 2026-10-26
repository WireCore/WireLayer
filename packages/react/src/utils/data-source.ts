import {
    createDataList,
    DataKeyResolver,
    dataListAnnouncement,
    toListOptions,
    type DataList,
    type DataListState,
    type DataQuery,
    type DataSource,
    type ListItemAccessors,
    type ListOption,
} from '@wirecore/wirelayer-recipes';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../components/LocaleProvider/LocaleProvider.js';

export interface UseDataSourceOptions<T> {
    /** The source; undefined: the component works with its `items` */
    source: DataSource<T> | undefined;
    /** Items per request (default 50) */
    pageSize?: number;
    /** Fewest characters a search needs (default 0) */
    minSearchLength?: number;
    /** Pause while typing, in ms (default 300) */
    debounce?: number;
    /** Further parts of every query (sorting, filters); a change starts over */
    query?: Omit<DataQuery, 'page' | 'pageSize' | 'cursor' | 'search'>;
}

const idle: DataListState<never> = {
    status: 'idle',
    items: [],
    loadingMore: false,
    hasMore: false,
    search: '',
    tooShort: false,
};

/**
 * Items from a data source for option lists, VirtualList, DataView and Listbox: the first page on `open()`, a
 * search (debounced, outdated answers dropped) with `search(text)`, the next page with `loadMore()`, labels of
 * values that are not loaded with `resolveKeys(keys)` (`getItemsByKeys`). Nothing is asked during server rendering.
 */
export function useDataSource<T>({ source, pageSize, minSearchLength, debounce, query }: UseDataSourceOptions<T>) {
    const { translations, locale } = useLocale();
    const [state, setState] = useState<DataListState<T>>(idle);
    /** Items found by key (selected values that are not loaded) */
    const [resolved, setResolved] = useState<T[]>([]);
    const list = useRef<DataList<T> | undefined>(undefined);
    const resolver = useRef<DataKeyResolver<T> | undefined>(undefined);
    const settings = useRef({ source, pageSize, minSearchLength, debounce, query });
    useEffect(() => {
        settings.current = { source, pageSize, minSearchLength, debounce, query };
    });
    // A new query object with the same content is no change
    const queryText = JSON.stringify(query ?? {});

    useEffect(() => {
        if (!source) return;
        list.current?.configure({ source, pageSize, minSearchLength, debounce, query: settings.current.query });
        resolver.current?.configure({ source });
    }, [source, pageSize, minSearchLength, debounce, queryText]);
    useEffect(
        () => () => {
            list.current?.dispose();
            resolver.current?.dispose();
            list.current = undefined;
            resolver.current = undefined;
        },
        []
    );

    return useMemo(() => {
        const ensure = (): DataList<T> | undefined => {
            const { source: current, ...rest } = settings.current;
            if (!current) return undefined;
            list.current ??= createDataList<T>({ source: current, ...rest, onChange: setState });
            resolver.current ??= new DataKeyResolver<T>({ source: current, onChange: setResolved });
            return list.current;
        };
        return {
            /** A source is set */
            active: !!source,
            state,
            resolved,
            /** Loads the first page once */
            open: () => void ensure()?.open(),
            /** Starts over with this search (after the typing pause) */
            search: (text: string, wait = true) => void ensure()?.search(text, { debounce: wait }),
            loadMore: () => void list.current?.loadMore(),
            retry: () => void list.current?.retry(),
            refresh: () => void ensure()?.refresh(),
            /** Finds the items of these keys (once each); errors stay quiet – the value is shown as it is */
            resolveKeys: (keys: string[]) => {
                if (!ensure() || !keys.length) return;
                resolver.current!.resolve(keys).catch(() => undefined);
            },
            /** "Loading", "12 items loaded", "Please enter at least 2 characters" … for a live region */
            announcement: source ? dataListAnnouncement(state, translations, locale, minSearchLength ?? 0) : '',
        };
    }, [source, state, resolved, translations, locale, minSearchLength]);
}

/**
 * A data source for an option list (Select, MultiSelect, Combobox, Autocomplete, Listbox): the items come from the
 * source instead of `items`; selected values that are not loaded get their labels from `getItemsByKeys`
 * (`resolve`). `emptyText` says why the list is empty (search too short, error).
 */
export function useOptionSource<T>({
    items,
    source,
    accessors,
    pageSize,
    minSearchLength,
}: {
    items: readonly T[];
    source: DataSource<T> | undefined;
    accessors: ListItemAccessors<T>;
    pageSize?: number;
    minSearchLength?: number;
}) {
    const { translations } = useLocale();
    const data = useDataSource<T>({ source, pageSize, minSearchLength });
    const { itemValue, itemLabel, itemDisabled, itemGroup, itemKeywords, valueKey } = accessors;
    const resolvedOptions = useMemo(
        () => toListOptions(data.resolved, { itemValue, itemLabel, itemDisabled, itemGroup, itemKeywords, valueKey }),
        [data.resolved, itemValue, itemLabel, itemDisabled, itemGroup, itemKeywords, valueKey]
    );
    const t = translations.dataSource;
    return {
        ...data,
        items: data.active ? data.state.items : items,
        /** Options of the values found by key */
        resolvedOptions,
        /** Asks the source for the labels of these keys, unless they are among the known options */
        resolve(keys: string[], known: readonly ListOption<T>[]) {
            if (!data.active) return;
            const have = new Set(known.map((option) => option.key));
            data.resolveKeys(keys.filter((key) => !have.has(key)));
        },
        loading: data.active && data.state.status === 'loading',
        hasMore: data.active && data.state.hasMore,
        /** Why the list is empty: the search is too short, or the source failed */
        emptyText: !data.active
            ? undefined
            : data.state.tooShort
              ? t.minSearch(minSearchLength ?? 0)
              : data.state.status === 'error'
                ? t.error
                : undefined,
    };
}
