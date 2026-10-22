import {
    createDataList,
    DataKeyResolver,
    dataListAnnouncement,
    toListOptions,
    type DataList,
    type DataListState,
    type DataSource,
    type ListItemAccessors,
    type ListOption,
} from '@wirecore/wirelayer-recipes/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from '../locale.js';

const idle: DataListState<never> = {
    status: 'idle',
    items: [],
    loadingMore: false,
    hasMore: false,
    search: '',
    tooShort: false,
};

/**
 * Items of an option list from a data source (same logic as the web components, @wirecore/wirelayer-recipes DataList): the
 * first page on `open()`, a debounced `search(text)` (outdated answers dropped), the next page with `loadMore()` –
 * called by the FlatList at its end – and the labels of chosen values that are not loaded (`getItemsByKeys`).
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
    const { translations, locale } = useLocale();
    const [state, setState] = useState<DataListState<T>>(idle);
    const [resolved, setResolved] = useState<T[]>([]);
    const list = useRef<DataList<T> | undefined>(undefined);
    const resolver = useRef<DataKeyResolver<T> | undefined>(undefined);
    const settings = useRef({ source, pageSize, minSearchLength });
    useEffect(() => {
        settings.current = { source, pageSize, minSearchLength };
    });
    useEffect(() => {
        if (!source) return;
        list.current?.configure({ source, pageSize, minSearchLength });
        resolver.current?.configure({ source });
    }, [source, pageSize, minSearchLength]);
    useEffect(
        () => () => {
            list.current?.dispose();
            resolver.current?.dispose();
            list.current = undefined;
            resolver.current = undefined;
        },
        []
    );
    const { itemValue, itemLabel, itemDisabled, itemGroup, valueKey } = accessors;
    const resolvedOptions = useMemo(
        () => toListOptions(resolved, { itemValue, itemLabel, itemDisabled, itemGroup, valueKey }),
        [resolved, itemValue, itemLabel, itemDisabled, itemGroup, valueKey]
    );

    return useMemo(() => {
        const ensure = (): DataList<T> | undefined => {
            const { source: current, ...rest } = settings.current;
            if (!current) return undefined;
            list.current ??= createDataList<T>({ source: current, ...rest, onChange: setState });
            resolver.current ??= new DataKeyResolver<T>({ source: current, onChange: setResolved });
            return list.current;
        };
        const active = !!source;
        const t = translations.dataSource;
        return {
            active,
            items: active ? state.items : items,
            resolvedOptions,
            /** Loads the first page once (the sheet opens) */
            open: () => void ensure()?.open(),
            /** Starts over with this search (after the typing pause) */
            search: (text: string) => void ensure()?.search(text),
            loadMore: () => void list.current?.loadMore(),
            /** Asks for the labels of chosen keys that are not among the known options */
            resolve(keys: string[], known: readonly ListOption<T>[]) {
                if (!ensure() || !keys.length) return;
                const have = new Set(known.map((option) => option.key));
                const missing = keys.filter((key) => !have.has(key));
                if (missing.length) resolver.current!.resolve(missing).catch(() => undefined);
            },
            loading: active && state.status === 'loading',
            loadingMore: active && state.loadingMore,
            hasMore: active && state.hasMore,
            emptyText: !active
                ? undefined
                : state.tooShort
                  ? t.minSearch(minSearchLength ?? 0)
                  : state.status === 'error'
                    ? t.error
                    : undefined,
            /** "12 items loaded" … for announcements */
            announcement: active ? dataListAnnouncement(state, translations, locale, minSearchLength ?? 0) : '',
        };
    }, [source, state, items, resolvedOptions, translations, locale, minSearchLength]);
}
