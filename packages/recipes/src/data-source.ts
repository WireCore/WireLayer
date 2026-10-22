// Server data for lists, tables, trees and selects: a data source answers queries (page or cursor, sorting, filters,
// search) with items, and a controller asks it – it cancels outdated requests (AbortController and a sequence
// number, so a late answer never overwrites a newer one), caches answers per query for a while, waits for a pause
// while typing a search and words the announcements. Framework-neutral; the components keep the state it reports.

import type { ConditionGroup } from './conditions.js';
import { pluralText, type Translations } from './i18n.js';

/** What a component asks for – every part optional, a source uses what it supports */
export interface DataQuery {
    /** Page, 1-based (paginated sources) */
    page?: number;
    pageSize?: number;
    /** Where to continue (cursor-based sources: the `nextCursor` of the last answer) */
    cursor?: string;
    sorting?: { id: string; desc: boolean }[];
    /** Filters by field id – the values as the component holds them (text, rules, lists) */
    filters?: Record<string, unknown>;
    /** Search text */
    search?: string;
    groupBy?: string[];
    /** Condition tree of an advanced filter (DataTable `advancedFilter`: nested and/or rules, see matchesCondition) */
    condition?: ConditionGroup;
    /** Range of dates (calendars): start inclusive, end exclusive ("2026-10-19" to "2026-10-26") */
    range?: { start: string; end: string };
}

/** A query as the source gets it: with the signal that aborts it when a newer query starts */
export interface DataRequest extends DataQuery {
    signal: AbortSignal;
}

/** The answer of a source */
export interface DataResult<T> {
    items: T[];
    /** Number of all items of the query (all pages) – for the pagination and announcements */
    totalCount?: number;
    /** More items after these (load more, infinite scrolling) */
    hasMore?: boolean;
    /** Cursor for the next items */
    nextCursor?: string;
}

/**
 * Where the items come from. `getItems` answers queries; `getChildren` loads the children of an item (trees);
 * `getItemsByKeys` finds items by key (labels of selected values that are not loaded).
 */
export interface DataSource<T> {
    getItems: (request: DataRequest) => Promise<DataResult<T>>;
    getChildren?: (parent: T, request: DataRequest) => Promise<DataResult<T>>;
    getItemsByKeys?: (keys: string[], request: { signal: AbortSignal }) => Promise<T[]>;
}

export type DataStatus = 'idle' | 'loading' | 'success' | 'error';

/** What the controller knows: the last answer stays while the next one loads */
export interface DataState<T> {
    status: DataStatus;
    items: T[];
    totalCount?: number;
    hasMore?: boolean;
    nextCursor?: string;
    error?: unknown;
    /** The query of the items (or of the failed request) */
    query?: DataQuery;
}

export interface DataControllerOptions<T> {
    source: DataSource<T>;
    /** How long an answer is reused for the same query, in ms (default 0: always ask) */
    ttl?: number;
    /** Pause while typing a search before asking, in ms (default 300) */
    debounce?: number;
    /** Every change of the state */
    onChange?: (state: DataState<T>) => void;
    /** Clock for the cache (tests) */
    now?: () => number;
}

/** A stable text of a query – the same for equal queries, whatever the order of their fields */
export function queryKey(query: DataQuery): string {
    const sort = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map(sort);
        if (value && typeof value === 'object' && !(value instanceof Date))
            return Object.fromEntries(
                Object.keys(value)
                    .sort()
                    .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
                    .map((key) => [key, sort((value as Record<string, unknown>)[key])])
            );
        return value;
    };
    return JSON.stringify(sort(query));
}

const isAbort = (error: unknown) => (error as { name?: string } | null)?.name === 'AbortError';

/**
 * Asks a data source and keeps one state: `load(query)` (with `debounce` for typed searches), `refresh()` (asks
 * again, past the cache), `abort()`, `dispose()`. Only the answer of the newest request is taken.
 */
export class DataController<T> {
    private state: DataState<T> = { status: 'idle', items: [] };
    private sequence = 0;
    private abortController: AbortController | undefined;
    private timer: ReturnType<typeof setTimeout> | undefined;
    /** Resolves the promise of a waiting (debounced) load when a newer one replaces it */
    private release: (() => void) | undefined;
    private cache = new Map<string, { result: DataResult<T>; time: number }>();
    private last: DataQuery | undefined;

    private options: DataControllerOptions<T>;

    constructor(options: DataControllerOptions<T>) {
        this.options = options;
    }

    get current(): DataState<T> {
        return this.state;
    }

    /** Changes source, cache time or pause; a new source empties the cache */
    configure(options: Partial<DataControllerOptions<T>>) {
        if (options.source && options.source !== this.options.source) this.cache.clear();
        this.options = { ...this.options, ...options };
    }

    private set(next: Partial<DataState<T>>) {
        this.state = { ...this.state, ...next };
        this.options.onChange?.(this.state);
    }

    /**
     * Loads the items of the query – from the cache when an answer is fresh enough. `debounce: true` waits for the
     * pause first (typing). Resolves with the state after this query (or the newer one that replaced it).
     */
    load(query: DataQuery, settings: { debounce?: boolean; force?: boolean } = {}): Promise<DataState<T>> {
        this.last = query;
        const sequence = ++this.sequence;
        this.stop();
        const key = queryKey(query);
        const now = this.options.now?.() ?? Date.now();
        const cached = this.cache.get(key);
        if (!settings.force && cached && now - cached.time < (this.options.ttl ?? 0)) {
            this.set({ status: 'success', ...cached.result, error: undefined, query });
            return Promise.resolve(this.state);
        }
        this.set({ status: 'loading', error: undefined });
        const run = async (): Promise<DataState<T>> => {
            if (sequence !== this.sequence) return this.state;
            const controller = new AbortController();
            this.abortController = controller;
            try {
                const result = await this.options.source.getItems({ ...query, signal: controller.signal });
                if (sequence !== this.sequence || controller.signal.aborted) return this.state;
                this.cache.set(key, { result, time: this.options.now?.() ?? Date.now() });
                this.set({
                    status: 'success',
                    items: result.items,
                    totalCount: result.totalCount,
                    hasMore: result.hasMore,
                    nextCursor: result.nextCursor,
                    error: undefined,
                    query,
                });
            } catch (error) {
                if (sequence !== this.sequence || isAbort(error)) return this.state;
                this.set({ status: 'error', error, query });
            } finally {
                if (this.abortController === controller) this.abortController = undefined;
            }
            return this.state;
        };
        const wait = settings.debounce ? (this.options.debounce ?? 300) : 0;
        if (!wait) return run();
        return new Promise((done) => {
            this.release = () => done(this.state);
            this.timer = setTimeout(() => {
                this.release = undefined;
                void run().then(done);
            }, wait);
        });
    }

    /** Stops the waiting and the running request */
    private stop() {
        clearTimeout(this.timer);
        this.release?.();
        this.release = undefined;
        this.abortController?.abort();
        this.abortController = undefined;
    }

    /** Asks again for the last query, past the cache (a button "Try again", `refresh()` of a component) */
    refresh(): Promise<DataState<T>> {
        if (!this.last) return Promise.resolve(this.state);
        return this.load(this.last, { force: true });
    }

    /** Forgets the cached answers (all, or those of one query) */
    invalidate(query?: DataQuery) {
        if (query) this.cache.delete(queryKey(query));
        else this.cache.clear();
    }

    /** Cancels a running or waiting request; the state keeps the last items */
    abort() {
        this.sequence++;
        this.stop();
        if (this.state.status === 'loading') this.set({ status: this.state.query ? 'success' : 'idle' });
    }

    /** Stops for good (unmounting) */
    dispose() {
        this.abort();
        this.options = { ...this.options, onChange: undefined };
    }
}

/** A controller for a source – see DataController */
export const createDataController = <T>(options: DataControllerOptions<T>) => new DataController(options);

/**
 * The announcement of a state for a live region: "Loading", "12 items loaded" (plural rules of the
 * locale), the error text – empty while idle.
 */
export function dataAnnouncement(state: DataState<unknown>, translations: Translations, locale: string): string {
    const t = translations.dataSource;
    if (state.status === 'loading') return t.loading;
    if (state.status === 'error') return t.error;
    if (state.status !== 'success') return '';
    const count = state.totalCount ?? state.items.length;
    return count ? pluralText(t.loaded, count, locale) : t.empty;
}

/** What the DataTable asks a row source (`dataSource.getRows`) */
export interface RowsRequest {
    /** Page, 1-based */
    page: number;
    pageSize: number;
    sorting: { id: string; desc: boolean }[];
    filters: Record<string, unknown>;
    search: string;
    groupBy: string[];
    /** Condition tree of the advanced filter, while it has rules (`advancedFilter`) */
    condition?: ConditionGroup;
    signal: AbortSignal;
}

/** The answer of a row source: the rows of the page and the number of all rows */
export interface RowsResult<T> {
    rows: T[];
    rowCount: number;
}

/** A DataTable row source as a general data source (`getRows` → `getItems`) */
export function rowsToDataSource<T>(getRows: (request: RowsRequest) => Promise<RowsResult<T>>): DataSource<T> {
    return {
        getItems: async (request) => {
            const result = await getRows({
                page: request.page ?? 1,
                pageSize: request.pageSize ?? 0,
                sorting: request.sorting ?? [],
                filters: request.filters ?? {},
                search: request.search ?? '',
                groupBy: request.groupBy ?? [],
                ...(request.condition ? { condition: request.condition } : {}),
                signal: request.signal,
            });
            return { items: result.rows, totalCount: result.rowCount };
        },
    };
}

/** A general data source as a DataTable row source (`getItems` → `getRows`) */
export function dataSourceToRows<T>(source: DataSource<T>) {
    return async (request: RowsRequest): Promise<RowsResult<T>> => {
        const result = await source.getItems(request);
        return { rows: result.items, rowCount: result.totalCount ?? result.items.length };
    };
}

/** State of a growing list from a data source (option lists, VirtualList, DataView with `loadMode: 'infinite'`) */
export interface DataListState<T> {
    status: DataStatus;
    /** All loaded items – the pages so far */
    items: T[];
    /** The next page is loading (the items stay) */
    loadingMore: boolean;
    hasMore: boolean;
    totalCount?: number;
    error?: unknown;
    /** The search of the items */
    search: string;
    /** The search is shorter than `minSearchLength`: nothing is asked */
    tooShort: boolean;
}

export interface DataListOptions<T> {
    source: DataSource<T>;
    /** Items per request (default 50) */
    pageSize?: number;
    /** Pause while typing a search, in ms (default 300) */
    debounce?: number;
    /** Fewest characters a search needs before the source is asked (default 0) */
    minSearchLength?: number;
    /** How long an answer is reused for the same query, in ms (default 0) */
    ttl?: number;
    /** Further parts of every query (sorting, filters) */
    query?: Omit<DataQuery, 'page' | 'pageSize' | 'cursor' | 'search'>;
    onChange?: (state: DataListState<T>) => void;
}

/**
 * A list that grows page by page from a data source: `search(text)` starts over (after the typing pause),
 * `loadMore()` appends the next page (by page number, or by cursor when the source gives one), `retry()` asks
 * again after an error, `dispose()`. Outdated answers are dropped (DataController).
 */
export class DataList<T> {
    private controller: DataController<T>;
    private options: DataListOptions<T>;
    /** Items before the page that is loading (append) */
    private base: T[] = [];
    private appending = false;
    private page = 1;
    /** Where the next page starts (cursor-based sources) */
    private cursor: string | undefined;
    private cursorBased = false;
    private state: DataListState<T> = {
        status: 'idle',
        items: [],
        loadingMore: false,
        hasMore: false,
        search: '',
        tooShort: false,
    };

    constructor(options: DataListOptions<T>) {
        this.options = options;
        this.controller = new DataController<T>({
            source: options.source,
            debounce: options.debounce,
            ttl: options.ttl,
            onChange: (state) => this.sync(state),
        });
    }

    get current(): DataListState<T> {
        return this.state;
    }

    /** Changes source, page size, pause or the further query; a new source or query starts over when loaded */
    configure(options: Partial<DataListOptions<T>>) {
        const restart =
            (options.source && options.source !== this.options.source) ||
            (options.query && queryKey(options.query) !== queryKey(this.options.query ?? {}));
        this.options = { ...this.options, ...options };
        this.controller.configure({
            source: this.options.source,
            debounce: this.options.debounce,
            ttl: this.options.ttl,
        });
        if (restart && this.state.status !== 'idle') void this.search(this.state.search, { debounce: false });
    }

    private set(next: Partial<DataListState<T>>) {
        this.state = { ...this.state, ...next };
        this.options.onChange?.(this.state);
    }

    private sync(state: DataState<T>) {
        if (state.status === 'loading')
            return this.set({ status: 'loading', loadingMore: this.appending, error: undefined });
        if (state.status === 'error') return this.set({ status: 'error', loadingMore: false, error: state.error });
        if (state.status !== 'success') return this.set({ status: state.status, loadingMore: false });
        const items = this.appending ? [...this.base, ...state.items] : state.items;
        const pageSize = this.options.pageSize ?? 50;
        // A source that gave a cursor once is cursor-based: no cursor, no more
        if (state.nextCursor !== undefined) this.cursorBased = true;
        const hasMore =
            state.hasMore ??
            (this.cursorBased
                ? state.nextCursor !== undefined
                : state.totalCount !== undefined
                  ? items.length < state.totalCount
                  : state.items.length >= pageSize);
        this.cursor = state.nextCursor;
        this.set({
            status: 'success',
            items,
            loadingMore: false,
            hasMore,
            totalCount: state.totalCount,
            error: undefined,
        });
    }

    private query(page: number): DataQuery {
        return {
            ...this.options.query,
            search: this.state.search || undefined,
            page,
            pageSize: this.options.pageSize ?? 50,
            cursor: page > 1 ? this.cursor : undefined,
        };
    }

    /** Starts over with this search (first page); waits for the typing pause unless `debounce: false` */
    async search(text: string, settings: { debounce?: boolean } = {}): Promise<DataListState<T>> {
        const min = this.options.minSearchLength ?? 0;
        this.appending = false;
        this.page = 1;
        this.cursor = undefined;
        if (text.trim().length < min) {
            this.controller.abort();
            this.set({ status: 'idle', items: [], search: text, tooShort: true, hasMore: false, loadingMore: false });
            return this.state;
        }
        this.set({ search: text, tooShort: false });
        await this.controller.load(this.query(1), { debounce: settings.debounce ?? true });
        return this.state;
    }

    /** Loads the first page once (opening a list); nothing when already loaded or loading */
    async open(): Promise<DataListState<T>> {
        if (this.state.status !== 'idle' || this.state.tooShort) return this.state;
        return this.search(this.state.search, { debounce: false });
    }

    /** Appends the next page – only when there is more and nothing is loading */
    async loadMore(): Promise<DataListState<T>> {
        if (!this.state.hasMore || this.state.status === 'loading') return this.state;
        this.appending = true;
        this.base = this.state.items;
        this.page += 1;
        await this.controller.load(this.query(this.page));
        return this.state;
    }

    /** Asks again for the last request (after an error), past the cache */
    async retry(): Promise<DataListState<T>> {
        await this.controller.refresh();
        return this.state;
    }

    /** Starts over with the current search, past the cache (data changed) */
    async refresh(): Promise<DataListState<T>> {
        this.controller.invalidate();
        return this.search(this.state.search, { debounce: false });
    }

    dispose() {
        this.controller.dispose();
        this.options = { ...this.options, onChange: undefined };
    }
}

/** A growing list for a source – see DataList */
export const createDataList = <T>(options: DataListOptions<T>) => new DataList(options);

/**
 * Finds the items of keys that are not loaded (`getItemsByKeys`) – e.g. the labels of preselected values. Asks
 * once per key; the found items are reported with `onChange` (all found so far).
 */
export class DataKeyResolver<T> {
    private found: T[] = [];
    private asked = new Set<string>();
    private controller = new AbortController();
    private options: { source: DataSource<T>; onChange?: (items: T[]) => void };

    constructor(options: { source: DataSource<T>; onChange?: (items: T[]) => void }) {
        this.options = options;
    }

    get items(): T[] {
        return this.found;
    }

    configure(options: Partial<{ source: DataSource<T>; onChange?: (items: T[]) => void }>) {
        this.options = { ...this.options, ...options };
    }

    /** Asks the source for the keys not asked before; resolves with all items found so far */
    async resolve(keys: readonly string[]): Promise<T[]> {
        const getItemsByKeys = this.options.source.getItemsByKeys;
        const missing = keys.filter((key) => !this.asked.has(key));
        if (!getItemsByKeys || !missing.length) return this.found;
        missing.forEach((key) => this.asked.add(key));
        try {
            const items = await getItemsByKeys(missing, { signal: this.controller.signal });
            if (this.controller.signal.aborted) return this.found;
            this.found = [...this.found, ...items];
            this.options.onChange?.(this.found);
        } catch (error) {
            // Asked again next time; an abort (unmounting) stays quiet
            missing.forEach((key) => this.asked.delete(key));
            if (!isAbort(error) && !this.controller.signal.aborted) throw error;
        }
        return this.found;
    }

    dispose() {
        this.controller.abort();
        this.options = { ...this.options, onChange: undefined };
    }
}

/** The announcement of a growing list: like dataAnnouncement, plus "Please enter at least 2 characters" */
export function dataListAnnouncement(
    state: DataListState<unknown>,
    translations: Translations,
    locale: string,
    minSearchLength = 0
): string {
    if (state.tooShort) return translations.dataSource.minSearch(minSearchLength);
    return dataAnnouncement(state, translations, locale);
}
