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
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue';
import { useLocale } from '../locale.js';

export interface UseDataSourceOptions<T> {
    /** The source; undefined: the component works with its `items` */
    source: () => DataSource<T> | undefined;
    /** Items per request (default 50) */
    pageSize?: () => number | undefined;
    /** Fewest characters a search needs (default 0) */
    minSearchLength?: () => number | undefined;
    /** Pause while typing, in ms (default 300) */
    debounce?: () => number | undefined;
    /** Further parts of every query (sorting, filters); a change starts over */
    query?: () => Omit<DataQuery, 'page' | 'pageSize' | 'cursor' | 'search'> | undefined;
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
export function useDataSource<T>(options: UseDataSourceOptions<T>) {
    const locale = useLocale();
    const state = shallowRef<DataListState<T>>(idle);
    /** Items found by key (selected values that are not loaded) */
    const resolved = shallowRef<T[]>([]);
    let list: DataList<T> | undefined;
    let resolver: DataKeyResolver<T> | undefined;
    const settings = () => ({
        pageSize: options.pageSize?.(),
        minSearchLength: options.minSearchLength?.(),
        debounce: options.debounce?.(),
        query: options.query?.(),
    });

    function ensure(): DataList<T> | undefined {
        const source = options.source();
        if (!source) return undefined;
        list ??= createDataList<T>({ source, ...settings(), onChange: (next) => (state.value = next) });
        resolver ??= new DataKeyResolver<T>({ source, onChange: (items) => (resolved.value = items) });
        return list;
    }
    watch(
        () =>
            [
                options.source(),
                options.pageSize?.(),
                options.minSearchLength?.(),
                options.debounce?.(),
                options.query?.(),
            ] as const,
        ([source]) => {
            if (!source) return;
            list?.configure({ source, ...settings() });
            resolver?.configure({ source });
        }
    );
    onBeforeUnmount(() => {
        list?.dispose();
        resolver?.dispose();
    });

    return {
        /** A source is set */
        active: computed(() => !!options.source()),
        state,
        resolved,
        /** Loads the first page once */
        open: () => void ensure()?.open(),
        /** Starts over with this search (after the typing pause) */
        search: (text: string, debounce = true) => void ensure()?.search(text, { debounce }),
        loadMore: () => void list?.loadMore(),
        retry: () => void list?.retry(),
        refresh: () => void ensure()?.refresh(),
        /** Finds the items of these keys (once each); errors stay quiet – the value is shown as it is */
        resolveKeys: (keys: string[]) => {
            if (!ensure() || !keys.length) return;
            resolver!.resolve(keys).catch(() => undefined);
        },
        /** "Loading", "12 items loaded", "Please enter at least 2 characters" … for a live region */
        announcement: computed(() =>
            options.source()
                ? dataListAnnouncement(
                      state.value,
                      locale.value.translations,
                      locale.value.locale,
                      options.minSearchLength?.() ?? 0
                  )
                : ''
        ),
    };
}

/**
 * A data source for an option list (Select, MultiSelect, Combobox, Autocomplete, Listbox): the items come from the
 * source instead of `items`; selected values that are not loaded get their labels from `getItemsByKeys`
 * (`resolve`). `emptyText` says why the list is empty (search too short, error).
 */
export function useOptionSource<T>(config: {
    items: () => readonly T[];
    source: () => DataSource<T> | undefined;
    accessors: () => ListItemAccessors<T>;
    pageSize?: () => number | undefined;
    minSearchLength?: () => number | undefined;
}) {
    const locale = useLocale();
    const data = useDataSource<T>({
        source: config.source,
        pageSize: config.pageSize,
        minSearchLength: config.minSearchLength,
    });
    const items = computed(() => (data.active.value ? data.state.value.items : config.items()));
    /** Options of the values found by key */
    const resolvedOptions = computed(() => toListOptions(data.resolved.value, config.accessors()));
    return {
        ...data,
        items,
        resolvedOptions,
        /** Asks the source for the labels of these keys, unless they are among the known options */
        resolve(keys: string[], known: readonly ListOption<T>[]) {
            if (!data.active.value) return;
            const have = new Set(known.map((option) => option.key));
            data.resolveKeys(keys.filter((key) => !have.has(key)));
        },
        loading: computed(() => data.active.value && data.state.value.status === 'loading'),
        hasMore: computed(() => data.active.value && data.state.value.hasMore),
        /** Why the list is empty: the search is too short, or the source failed */
        emptyText: computed(() => {
            if (!data.active.value) return undefined;
            const t = locale.value.translations.dataSource;
            if (data.state.value.tooShort) return t.minSearch(config.minSearchLength?.() ?? 0);
            return data.state.value.status === 'error' ? t.error : undefined;
        }),
    };
}
