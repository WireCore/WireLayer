import {
    cellText,
    cellValue,
    createDataController,
    createXlsx,
    dataAnnouncement,
    dataTable,
    filterTableRows,
    groupTableRows,
    isActiveFilter,
    nextSorting,
    pageTableRows,
    rowsToDataSource,
    sortTableRows,
    tableAggregateText,
    tableCsv,
    tableXlsxSheet,
    visuallyHidden,
    XLSX_TYPE,
    type DataQuery,
    type DataSource,
    type DataState,
    type DataTableFilterValue,
    type DataTableSort,
    type TableRowGroup,
} from '@wirecore/wirelayer-recipes/native';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, EllipsisVertical, ListFilter } from 'lucide-react-native';
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode, type Ref } from 'react';
import {
    FlatList,
    Platform,
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { Button } from '../components/Button/Button.js';
import { Checkbox, type CheckedState } from '../components/Checkbox/Checkbox.js';
import { Highlight } from '../components/Highlight/Highlight.js';
import { IconButton } from '../components/IconButton/IconButton.js';
import { Menu, type MenuEntry } from '../components/Menu/Menu.js';
import { Pagination } from '../components/Pagination/Pagination.js';
import { SearchField } from '../components/SearchField/SearchField.js';
import { useLocale } from '../locale.js';
import { useAnnouncer } from '../utils/announce.js';
import { Icon } from '../utils/Icon.js';
import { toggleOnSpace } from '../utils/keyboard.js';
import { Loader } from '../utils/Loader.js';
import { FilterSheet } from './FilterSheet.js';
import { SortSheet } from './SortSheet.js';
import type {
    DataTableColumn,
    DataTableCsvOptions,
    DataTableDataSource,
    DataTableExportFile,
    DataTableRowAction,
    DataTableRowClick,
    DataTableXlsxOptions,
} from './types.js';

/** Methods of the table (`ref`) */
export interface DataTableHandle {
    /** The CSV of the filtered and sorted rows of all pages (or of the selection) as text */
    generateCsv: (options?: DataTableCsvOptions) => string;
    /** The Excel file (.xlsx) of the rows as bytes: numbers as numbers, dates as dates, bold header and totals */
    generateXlsx: (options?: DataTableXlsxOptions) => Uint8Array;
    /** Asks the data source (`dataSource`) again for the current page, past the cache */
    refresh: () => Promise<void>;
}

export interface DataTableProps<TData> {
    /** The rows (with `dataSource` the table loads them itself) */
    data?: TData[];
    /**
     * Rows from a server instead of `data` and `manual`: the table asks `getRows` (page, sorting, filters, search,
     * grouping, abort signal) whenever they change, cancels outdated requests, shows errors with "Try
     * again" – `refresh()` asks again
     */
    dataSource?: DataTableDataSource<TData>;
    /** How long answers of `dataSource` are reused for the same query, in ms (default 0: always ask) */
    cacheTime?: number;
    /** Pause after typing in the search before `dataSource` is asked, in ms (default 300) */
    searchDebounce?: number;
    columns: DataTableColumn<TData>[];
    /** Accessible name of the table (and of the card list) */
    caption: string;
    getRowId?: (row: TData, index: number) => string;
    /** Names a row: its card, its controls ("Select <label>") – default "Row 1" … */
    rowLabel?: (row: TData, index: number) => string;
    /**
     * `table`: columns side by side, scrolling sideways; `cards`: one card per row with "header: value" lines;
     * `auto` (default): cards while the table is narrower than `cardsBelow`
     */
    layout?: 'table' | 'cards' | 'auto';
    /** Width in pt below which `layout="auto"` shows cards (default 640) */
    cardsBelow?: number;
    /** Rows per page – enables pagination (changeable with `pageSizeOptions`) */
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    /** Choices for the rows per page, shown next to the pagination */
    pageSizeOptions?: number[];
    /** Current page (1-based); controlled together with onPageChange */
    page?: number;
    onPageChange?: (page: number) => void;
    /** Current sorting; controlled together with onSortingChange – an array in the multiple mode */
    sorting?: DataTableSort | DataTableSort[] | null;
    onSortingChange?: (sorting: DataTableSort | DataTableSort[] | null) => void;
    /** Sorting at the start (uncontrolled) */
    defaultSorting?: DataTableSort | DataTableSort[] | null;
    /** `multiple`: tapping further headers (or the sort sheet) sorts by several columns */
    sortMode?: 'single' | 'multiple';
    /** Server mode: `data` is the current page, already sorted and filtered; requires `rowCount` */
    manual?: boolean;
    rowCount?: number;
    /** Selection: a checkbox (or radio button) per row and card */
    selectable?: boolean;
    /** `multiple` (checkboxes and "Select all", default) or `single` (radio buttons) */
    selectionMode?: 'multiple' | 'single';
    selection?: string[];
    onSelectionChange?: (selection: string[]) => void;
    /** The selected rows as objects (rows of other pages are remembered) */
    onSelectedRowsChange?: (rows: TData[]) => void;
    /** Rows that cannot be selected get a disabled checkbox */
    isRowSelectable?: (row: TData) => boolean;
    /** Name of "select all" (default "Select all rows on this page" / "Select all rows") */
    selectAllLabel?: string;
    loading?: boolean;
    emptyText?: string;
    /** Shown when the filters or the search leave no row (default: `emptyText`) */
    noResultsText?: string;
    loadingText?: string;
    /** Search field above the table: filters over all searchable columns */
    search?: boolean;
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    /** Marks the search hits in the cells */
    highlightSearch?: boolean;
    /** Column filters by column id (the "Filter" sheet); controlled together with onFiltersChange */
    filters?: Record<string, DataTableFilterValue>;
    onFiltersChange?: (filters: Record<string, DataTableFilterValue>) => void;
    /** Groups the rows of the page by the values of this column (a heading per group) */
    groupBy?: string;
    /** Actions per row: a button "Actions for …" opens them in a sheet (items like Menu) */
    rowActions?: MenuEntry[] | ((row: TData) => MenuEntry[]);
    onRowAction?: (action: DataTableRowAction<TData>) => void;
    /**
     * A tap on a row or card (not on its controls); the first value (or the card title) becomes a button that does
     * the same for screen reader and keyboard users
     */
    onRowClick?: (click: DataTableRowClick<TData>) => void;
    /** Name of the exported file without extension (default "export") */
    exportFilename?: string;
    /** Formats of the export: CSV (default), Excel (.xlsx) or both */
    exportFormats?: ('csv' | 'xlsx')[];
    /**
     * Shows the export button: the file of the filtered and sorted rows of all pages (or of the selection) – e.g.
     * `shareFile` of `@wirecore/wirelayer-native/expo-sharing` opens the share sheet with it
     */
    onExport?: (file: DataTableExportFile) => void;
    /** More rows can be loaded (`onLoadMore`): "Load more" below the rows; false stops loading at the end */
    hasMore?: boolean;
    /** The end of the rows was reached (or "Load more" pressed) – append rows to `data` (infinite scrolling) */
    onLoadMore?: () => void;
    /** Own controls in the toolbar, after the built-in buttons */
    toolbar?: ReactNode;
    /** Shown when there are no rows */
    empty?: ReactNode;
    /** Shown when the filters or the search leave no row (default: `empty`) */
    noResults?: ReactNode;
    /** Classes of the table – e.g. `flex-1` in a screen: the rows scroll below the toolbar */
    className?: string;
    style?: StyleProp<ViewStyle>;
    ref?: Ref<DataTableHandle>;
}

type Item<TData> =
    { kind: 'row'; key: string; row: TData } | { kind: 'group'; key: string; group: TableRowGroup<TData> };

const MIN_WIDTH = 60;
const DEFAULT_WIDTH = 160;
const SELECT_WIDTH = 48;
const ACTIONS_WIDTH = 56;
const NO_ROWS: never[] = [];
const toSorting = (value: DataTableSort | DataTableSort[] | null | undefined): DataTableSort[] =>
    !value ? [] : Array.isArray(value) ? value : [value];
/** A row source (`getRows`) or a general data source (`getItems`) as a data source */
const toDataSource = <T,>(source: DataTableDataSource<T>): DataSource<T> =>
    'getRows' in source ? rowsToDataSource(source.getRows) : source;
const widthOf = (column: { width?: number }) => Math.max(MIN_WIDTH, column.width ?? DEFAULT_WIDTH);

/**
 * Data table for phones and tablets, without a table library: a table that scrolls sideways (sort by tapping a
 * header) or one card per row (`layout`, automatic below `cardsBelow`). Search, a sort sheet and a filter sheet,
 * selection, pages or infinite loading, server data (`dataSource`, `manual`), groups, totals, row actions in a sheet
 * and the export as CSV or Excel (`onExport`, `generateCsv`, `generateXlsx`). In the web build the table is a
 * complete ARIA table; on iOS and Android every row is a named group and every cell is read with its header.
 */
export function DataTable<TData extends object>({
    data: dataProp,
    dataSource,
    cacheTime = 0,
    searchDebounce = 300,
    columns,
    caption,
    getRowId,
    rowLabel,
    layout = 'auto',
    cardsBelow = 640,
    pageSize,
    onPageSizeChange,
    pageSizeOptions,
    page,
    onPageChange,
    sorting: sortingProp,
    onSortingChange,
    defaultSorting,
    sortMode = 'single',
    manual = false,
    rowCount,
    selectable = false,
    selectionMode = 'multiple',
    selection,
    onSelectionChange,
    onSelectedRowsChange,
    isRowSelectable,
    selectAllLabel,
    loading = false,
    emptyText,
    noResultsText,
    loadingText,
    search = false,
    globalFilter,
    onGlobalFilterChange,
    highlightSearch = false,
    filters,
    onFiltersChange,
    groupBy,
    rowActions,
    onRowAction,
    onRowClick,
    exportFilename,
    exportFormats,
    onExport,
    hasMore,
    onLoadMore,
    toolbar,
    empty,
    noResults,
    className,
    style,
    ref,
}: DataTableProps<TData>) {
    const { translations, locale } = useLocale();
    const t = translations.dataTable;
    const styles = dataTable();
    const web = Platform.OS === 'web';
    const screen = useWindowDimensions();
    const [width, setWidth] = useState(0);
    const measured = width || screen.width;
    const cards = layout === 'cards' || (layout === 'auto' && measured < cardsBelow);

    // Rows from a data source: the controller asks, cancels outdated requests and caches; the table shows its state
    const [sourceState, setSourceState] = useState<DataState<TData>>({ status: 'idle', items: [] });
    const sourceRef = useRef(dataSource);
    const [controller] = useState(() =>
        // The source is set once mounted: it reads the latest `dataSource` prop at request time
        createDataController<TData>({ source: { getItems: async () => ({ items: [] }) } })
    );
    useEffect(() => {
        sourceRef.current = dataSource;
        controller.configure({ ttl: cacheTime, debounce: searchDebounce });
    });
    useEffect(() => {
        controller.configure({
            onChange: setSourceState,
            source: { getItems: (request) => toDataSource(sourceRef.current!).getItems(request) },
        });
        return () => controller.dispose();
    }, [controller]);

    // Controlled when the prop is set, internal otherwise
    const [ownSorting, setOwnSorting] = useState<DataTableSort[]>(() => toSorting(defaultSorting));
    const sorting = useMemo(
        () => (sortingProp === undefined ? ownSorting : toSorting(sortingProp)),
        [sortingProp, ownSorting]
    );
    const [ownSearch, setOwnSearch] = useState('');
    const searchText = globalFilter ?? ownSearch;
    const [ownFilters, setOwnFilters] = useState<Record<string, DataTableFilterValue>>({});
    const activeFilters = useMemo(
        () => Object.fromEntries(Object.entries(filters ?? ownFilters).filter(([, value]) => isActiveFilter(value))),
        [filters, ownFilters]
    );
    const [ownPage, setOwnPage] = useState(1);
    const pageNumber = page ?? ownPage;
    const [ownPageSize, setOwnPageSize] = useState(pageSize ?? 10);
    const [seenPageSize, setSeenPageSize] = useState(pageSize);
    if (pageSize !== seenPageSize) {
        setSeenPageSize(pageSize);
        setOwnPageSize(pageSize ?? 10);
    }
    const size = pageSize ? ownPageSize : 0;
    const [ownSelection, setOwnSelection] = useState<string[]>([]);
    const selected = selection ?? ownSelection;
    const selectedSet = useMemo(() => new Set(selected), [selected]);
    const [sortOpen, setSortOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [actionRow, setActionRow] = useState<TData | null>(null);

    const setPage = (next: number) => {
        setOwnPage(next);
        onPageChange?.(next);
    };
    // Sorting, search and filters start at page 1
    const firstPage = () => {
        if (pageNumber !== 1) setPage(1);
    };
    const setSorting = (next: DataTableSort[]) => {
        setOwnSorting(next);
        onSortingChange?.(sortMode === 'multiple' ? next : (next[0] ?? null));
        firstPage();
    };
    const setSearch = (next: string) => {
        setOwnSearch(next);
        onGlobalFilterChange?.(next);
        firstPage();
    };
    const setFilters = (next: Record<string, DataTableFilterValue>) => {
        setOwnFilters(next);
        onFiltersChange?.(next);
        firstPage();
    };

    // The rows: filtered, sorted and paged here – or by the server (`manual`, `dataSource`)
    const serverMode = manual || !!dataSource;
    const data: readonly TData[] = dataSource ? sourceState.items : (dataProp ?? NO_ROWS);
    const meta = useMemo(
        () => new Map(data.map((row, index) => [row, { id: getRowId?.(row, index) ?? String(index), index }])),
        [data, getRowId]
    );
    const idOf = (row: TData) => meta.get(row)?.id ?? '';
    const labelOf = (row: TData) => {
        const index = meta.get(row)?.index ?? 0;
        return rowLabel?.(row, index) ?? t.row(index);
    };
    const sorted = useMemo(() => {
        if (serverMode) return [...data];
        const found = filterTableRows(data, columns, { search: searchText, filters: activeFilters, locale });
        return sortTableRows(found, columns, sorting, locale);
    }, [serverMode, data, columns, searchText, activeFilters, sorting, locale]);
    const total = !serverMode
        ? sorted.length
        : dataSource
          ? (sourceState.totalCount ?? data.length)
          : (rowCount ?? data.length);
    const pageRows = size && !serverMode ? pageTableRows(sorted, pageNumber, size) : sorted;
    const groupColumn = groupBy ? columns.find((column) => column.id === groupBy) : undefined;
    const items: Item<TData>[] = groupColumn
        ? groupTableRows(pageRows, groupColumn).flatMap((group) => [
              { kind: 'group' as const, key: `group:${group.text}`, group },
              ...group.rows.map((row) => ({ kind: 'row' as const, key: idOf(row), row })),
          ])
        : pageRows.map((row) => ({ kind: 'row' as const, key: idOf(row), row }));

    // Data source: asks for the page whenever page, sorting, filters, search or grouping change; the search waits
    // for a pause in typing
    const sourceKey = JSON.stringify({
        page: pageNumber,
        pageSize: size,
        sorting: sorting.map((sort) => ({ id: sort.id, desc: sort.desc })),
        filters: activeFilters,
        search: searchText,
        groupBy: groupBy ? [groupBy] : [],
    });
    const hasSource = !!dataSource;
    const lastSearch = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (!hasSource) return;
        const query = JSON.parse(sourceKey) as DataQuery;
        const typed = lastSearch.current !== undefined && lastSearch.current !== query.search;
        lastSearch.current = query.search;
        void controller.load(query, { debounce: typed });
    }, [sourceKey, hasSource, controller]);

    const busy = loading || (hasSource && sourceState.status === 'loading');
    const failed = hasSource && sourceState.status === 'error';
    const filtering = !!searchText || Object.keys(activeFilters).length > 0;

    // Announcements: the state of the data source; the number of rows after a search or filter change
    const { announce, region } = useAnnouncer();
    const sourceAnnouncement = hasSource ? dataAnnouncement(sourceState, translations, locale) : '';
    useEffect(() => {
        if (sourceAnnouncement) announce(sourceAnnouncement);
    }, [sourceAnnouncement, announce]);
    const filterKey = JSON.stringify([searchText, activeFilters]);
    const resultText = serverMode ? '' : t.results(total);
    const announcedFilter = useRef(filterKey);
    useEffect(() => {
        if (announcedFilter.current === filterKey) return;
        announcedFilter.current = filterKey;
        if (resultText) announce(resultText);
    }, [filterKey, resultText, announce]);

    // Selection – rows of other pages stay known for onSelectedRowsChange and the export
    const multiple = selectionMode !== 'single';
    const remembered = useRef(new Map<string, TData>());
    const canSelect = (row: TData) => isRowSelectable?.(row) ?? true;
    const setSelection = (ids: string[]) => {
        setOwnSelection(ids);
        onSelectionChange?.(ids);
        const known = remembered.current;
        const chosen = new Set(ids);
        for (const row of data) if (chosen.has(idOf(row))) known.set(idOf(row), row);
        for (const key of [...known.keys()]) if (!chosen.has(key)) known.delete(key);
        onSelectedRowsChange?.(ids.flatMap((id) => (known.has(id) ? [known.get(id)!] : [])));
    };
    const toggleRow = (row: TData) => {
        const id = idOf(row);
        if (!multiple) setSelection([id]);
        else setSelection(selectedSet.has(id) ? selected.filter((key) => key !== id) : [...selected, id]);
    };
    const pageSelectable = pageRows.filter(canSelect).map(idOf);
    const pageSelected = pageSelectable.filter((id) => selectedSet.has(id)).length;
    const allState: CheckedState =
        pageSelectable.length > 0 && pageSelected === pageSelectable.length
            ? true
            : pageSelected
              ? 'indeterminate'
              : false;
    const selectAll = (checked: boolean) => {
        const others = selected.filter((id) => !pageSelectable.includes(id));
        setSelection(checked ? [...others, ...pageSelectable] : others);
    };
    const selectAllText = selectAllLabel ?? (size ? t.selectAll : t.selectAllRows);

    // Export: the filtered and sorted rows of all pages (server: the loaded rows) or the selection
    const exportRows = (selectionOnly = false): TData[] => {
        if (!selectionOnly) return [...sorted];
        if (!serverMode) return sorted.filter((row) => selectedSet.has(idOf(row)));
        return selected.flatMap((id) => {
            const row = data.find((entry) => idOf(entry) === id) ?? remembered.current.get(id);
            return row ? [row] : [];
        });
    };
    const generateCsv = (options: DataTableCsvOptions = {}) =>
        tableCsv(exportRows(options.selectionOnly), columns, { separator: options.separator, bom: options.bom });
    const generateXlsx = (options: DataTableXlsxOptions = {}) =>
        createXlsx(
            tableXlsxSheet(exportRows(options.selectionOnly), columns, {
                name: options.sheetName ?? caption,
                groupBy: options.groups !== false && !options.selectionOnly ? groupColumn : undefined,
                groupLabel: (group) => t.group(groupColumn?.header ?? '', group.text, group.rows.length),
                totals: options.totals,
                totalLabel: t.total,
            })
        );
    useImperativeHandle(ref, () => ({
        generateCsv,
        generateXlsx,
        refresh: async () => {
            if (hasSource) await controller.refresh();
        },
    }));
    const exportFile = (format: 'csv' | 'xlsx', selectionOnly: boolean) => {
        const filename = `${exportFilename ?? 'export'}.${format}`;
        onExport?.(
            format === 'xlsx'
                ? { format, filename, mimeType: XLSX_TYPE, data: generateXlsx({ selectionOnly }) }
                : { format, filename, mimeType: 'text/csv', data: generateCsv({ selectionOnly }) }
        );
    };
    const formats: ('csv' | 'xlsx')[] = exportFormats ?? ['csv'];
    const exportEntries: MenuEntry[] = formats.flatMap((format) => [
        { value: `${format}:all`, label: t.exportAs(format, false), icon: Download },
        ...(selected.length ? [{ value: `${format}:selection`, label: t.exportAs(format, true), icon: Download }] : []),
    ]);

    // Totals of the filtered rows (all pages)
    const hasFooter = columns.some((column) => column.aggregate || column.footer !== undefined);
    const footerText = (column: DataTableColumn<TData>) => {
        if (column.footer !== undefined) return column.footer;
        if (!column.aggregate) return '';
        const value = tableAggregateText(sorted, column, locale);
        return typeof column.aggregate === 'string' ? (t.aggregates[column.aggregate]?.(value) ?? value) : value;
    };

    // Infinite loading: the end of the list asks once per number of rows
    const asked = useRef(-1);
    const endReached = () => {
        if (!onLoadMore || hasMore === false || busy || asked.current === data.length) return;
        asked.current = data.length;
        onLoadMore();
    };

    const sortable = columns.filter((column) => column.sortable);
    const filterable = columns.filter((column) => !!column.filter);
    const sortState = (column: DataTableColumn<TData>) => {
        const position = sorting.findIndex((sort) => sort.id === column.id);
        return position < 0 ? null : { position: position + 1, desc: sorting[position]!.desc };
    };
    const sortBy = (column: DataTableColumn<TData>) =>
        setSorting(nextSorting(sorting, column.id, sortMode === 'multiple'));
    const actionsFor = (row: TData) => (typeof rowActions === 'function' ? rowActions(row) : (rowActions ?? []));
    const open = (row: TData) => onRowClick?.({ row, rowId: idOf(row) });
    /** Press props of a row or card: the whole surface opens it, without hiding its controls from screen readers */
    const pressProps = (row: TData) => ({
        onPress: () => open(row),
        ...(web ? { focusable: false } : { accessible: false }),
    });

    /** The value of a cell; `spoken` (iOS/Android table): read with its header */
    const content = (column: DataTableColumn<TData>, row: TData, textClass: string, spoken = false) => {
        const value = cellValue(column, row);
        if (column.cell)
            return spoken ? (
                <>
                    <Text className={visuallyHidden()}>{column.header}</Text>
                    {column.cell(row, value)}
                </>
            ) : (
                column.cell(row, value)
            );
        const text = cellText(column, row);
        return (
            <Text className={textClass} {...(spoken ? { 'aria-label': `${column.header}: ${text}` } : {})}>
                {highlightSearch && searchText ? <Highlight text={text} query={searchText} /> : text}
            </Text>
        );
    };
    /** The first value (or card title) as a button when the row opens something */
    const openButton = (row: TData, text: string, name?: string) => (
        <Pressable
            role="button"
            {...(name ? { 'aria-label': name } : {})}
            className={styles.rowLink()}
            onPress={() => open(row)}
        >
            <Text className={styles.rowLinkText()}>{text}</Text>
        </Pressable>
    );
    const selectControl = (row: TData) => {
        const checked = selectedSet.has(idOf(row));
        const disabled = !canSelect(row);
        const name = t.selectRow(labelOf(row));
        if (multiple)
            return (
                <Checkbox
                    aria-label={name}
                    checked={checked}
                    disabled={disabled}
                    hitSlop={13}
                    onCheckedChange={() => toggleRow(row)}
                />
            );
        const radio = dataTable({ checked });
        const choose = () => toggleRow(row);
        return (
            <Pressable
                role="radio"
                aria-label={name}
                aria-checked={checked}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                className={radio.radio()}
                onPress={choose}
                {...(disabled ? {} : toggleOnSpace(choose))}
            >
                <View className={radio.radioControl()}>{checked && <View className={radio.radioDot()} />}</View>
            </Pressable>
        );
    };
    const actionsButton = (row: TData) => (
        <IconButton
            icon={EllipsisVertical}
            variant="text"
            label={t.rowActions(labelOf(row))}
            hitSlop={4}
            onPress={() => setActionRow(row)}
        />
    );
    const groupText = (group: TableRowGroup<TData>) =>
        t.group(groupColumn?.header ?? '', group.text, group.rows.length);

    // Table: header row, rows (a FlatList), footer row – scrolls sideways
    const tableWidth =
        (selectable ? SELECT_WIDTH : 0) +
        columns.reduce((sum, column) => sum + widthOf(column), 0) +
        (rowActions ? ACTIONS_WIDTH : 0);
    const cellStyle = (column: DataTableColumn<TData>) => ({ flexBasis: widthOf(column), flexGrow: 1, flexShrink: 0 });
    const role = (name: 'table' | 'row' | 'columnheader' | 'cell') => (web ? { role: name } : {});
    const renderTableRow = (row: TData) => {
        const name = labelOf(row);
        const rowStyles = dataTable({ selected: selectedSet.has(idOf(row)) });
        const cells = (
            <>
                {selectable && (
                    <View {...role('cell')} className={styles.utilityCell()}>
                        {selectControl(row)}
                    </View>
                )}
                {columns.map((column, index) => {
                    const cellStyles = dataTable({ align: column.align });
                    return (
                        <View key={column.id} {...role('cell')} className={cellStyles.cell()} style={cellStyle(column)}>
                            {index === 0 && onRowClick && !column.cell
                                ? openButton(
                                      row,
                                      cellText(column, row),
                                      web ? undefined : `${column.header}: ${cellText(column, row)}`
                                  )
                                : content(column, row, cellStyles.cellText(), !web)}
                        </View>
                    );
                })}
                {!!rowActions && (
                    <View {...role('cell')} className={styles.utilityCell()} style={{ width: ACTIONS_WIDTH }}>
                        {actionsButton(row)}
                    </View>
                )}
            </>
        );
        // The web reads a table row; iOS and Android a named group
        const rowProps = web ? { role: 'row' as const } : { role: 'group' as const, 'aria-label': name };
        return onRowClick ? (
            <Pressable {...rowProps} {...pressProps(row)} className={rowStyles.row()}>
                {cells}
            </Pressable>
        ) : (
            <View {...rowProps} className={rowStyles.row()}>
                {cells}
            </View>
        );
    };
    const renderTableItem = (item: Item<TData>) =>
        item.kind === 'row' ? (
            renderTableRow(item.row)
        ) : (
            <View {...role('row')} className={styles.groupRow()}>
                <View {...role('cell')}>
                    <Text role="heading" className={styles.groupText()}>
                        {groupText(item.group)}
                    </Text>
                </View>
            </View>
        );
    const scrollable = web ? { tabIndex: 0 as const } : {};
    const table = (
        <View className={styles.frame()}>
            <ScrollView horizontal {...scrollable}>
                <View
                    {...role('table')}
                    {...(web ? { 'aria-label': caption } : {})}
                    aria-busy={busy || undefined}
                    style={{ width: Math.max(tableWidth, measured - 2) }}
                >
                    <View {...role('row')} className={styles.headerRow()}>
                        {selectable && (
                            <View {...role('columnheader')} className={styles.utilityCell()}>
                                {multiple ? (
                                    <Checkbox
                                        aria-label={selectAllText}
                                        checked={allState}
                                        hitSlop={13}
                                        onCheckedChange={(checked) => selectAll(checked === true)}
                                    />
                                ) : (
                                    web && <Text className={visuallyHidden()}>{t.select}</Text>
                                )}
                            </View>
                        )}
                        {columns.map((column) => {
                            const state = sortState(column);
                            const headStyles = dataTable({ align: column.align, sorted: !!state });
                            return (
                                <View
                                    key={column.id}
                                    {...role('columnheader')}
                                    className={headStyles.headerCell()}
                                    style={cellStyle(column)}
                                >
                                    {column.sortable ? (
                                        <Pressable
                                            role="button"
                                            aria-label={
                                                state
                                                    ? `${column.header}, ${t.sortPriority(state.position, state.desc)}`
                                                    : column.header
                                            }
                                            className={headStyles.headerButton()}
                                            onPress={() => sortBy(column)}
                                        >
                                            <Text className={headStyles.headerText()}>{column.header}</Text>
                                            <Icon
                                                icon={state ? (state.desc ? ArrowDown : ArrowUp) : ArrowUpDown}
                                                className={headStyles.sortIcon()}
                                            />
                                        </Pressable>
                                    ) : (
                                        // iOS and Android read the header with every cell
                                        <View
                                            className={headStyles.headerLabel()}
                                            {...(web ? {} : { 'aria-hidden': true })}
                                        >
                                            <Text className={headStyles.headerText()}>{column.header}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                        {!!rowActions && (
                            <View
                                {...role('columnheader')}
                                className={styles.utilityCell()}
                                style={{ width: ACTIONS_WIDTH }}
                            >
                                {web && <Text className={visuallyHidden()}>{t.actions}</Text>}
                            </View>
                        )}
                    </View>
                    <FlatList
                        data={items}
                        keyExtractor={(item) => item.key}
                        renderItem={({ item }) => renderTableItem(item)}
                        onEndReached={onLoadMore ? endReached : undefined}
                        onEndReachedThreshold={0.5}
                    />
                    {hasFooter && (
                        <View {...role('row')} className={styles.footerRow()}>
                            {selectable && <View {...role('cell')} className={styles.utilityCell()} />}
                            {columns.map((column, index) => {
                                const text = footerText(column) || (index === 0 ? t.total : '');
                                return (
                                    <View
                                        key={column.id}
                                        {...role('cell')}
                                        className={dataTable({ align: column.align }).cell()}
                                        style={cellStyle(column)}
                                    >
                                        <Text
                                            className={dataTable({ align: column.align }).footerText()}
                                            {...(!web && text ? { 'aria-label': `${column.header}: ${text}` } : {})}
                                        >
                                            {text}
                                        </Text>
                                    </View>
                                );
                            })}
                            {!!rowActions && (
                                <View
                                    {...role('cell')}
                                    className={styles.utilityCell()}
                                    style={{ width: ACTIONS_WIDTH }}
                                />
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );

    // Cards: one per row – a named group with "header: value" lines
    const titleColumn = !rowLabel && columns[0] && !columns[0].cell ? columns[0] : undefined;
    const renderCard = (row: TData) => {
        const name = labelOf(row);
        const cardStyles = dataTable({ selected: selectedSet.has(idOf(row)) });
        const titleText = rowLabel ? name : titleColumn ? cellText(titleColumn, row) : '';
        const titleName = titleColumn && !web ? `${titleColumn.header}: ${titleText}` : undefined;
        const lines = titleColumn ? columns.slice(1) : columns;
        const body = (
            <>
                {(selectable || !!rowActions || !!titleText) && (
                    <View className={styles.cardHeader()}>
                        {selectable && selectControl(row)}
                        <View className={styles.cardHeading()}>
                            {!!titleText &&
                                (onRowClick ? (
                                    openButton(row, titleText, titleName)
                                ) : (
                                    <Text
                                        className={styles.cardTitle()}
                                        {...(titleName ? { 'aria-label': titleName } : {})}
                                    >
                                        {titleText}
                                    </Text>
                                ))}
                        </View>
                        {!!rowActions && actionsButton(row)}
                    </View>
                )}
                {lines.map((column) => {
                    const text = cellText(column, row);
                    // iOS and Android: one element "header: value" (own cell content stays reachable)
                    const spoken =
                        !web && !column.cell ? { accessible: true, 'aria-label': `${column.header}: ${text}` } : {};
                    return (
                        <View key={column.id} className={styles.pair()} {...spoken}>
                            <Text className={styles.pairLabel()}>{column.header}</Text>
                            <View className={styles.pairContent()}>{content(column, row, styles.pairValue())}</View>
                        </View>
                    );
                })}
            </>
        );
        return onRowClick ? (
            <Pressable role="group" aria-label={name} {...pressProps(row)} className={cardStyles.card()}>
                {body}
            </Pressable>
        ) : (
            <View role="group" aria-label={name} className={cardStyles.card()}>
                {body}
            </View>
        );
    };
    const totalLines = columns.filter((column) => !!footerText(column));
    const cardList = (
        <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            role="group"
            aria-label={caption}
            aria-busy={busy || undefined}
            contentContainerClassName={styles.cards()}
            renderItem={({ item }) =>
                item.kind === 'row' ? (
                    renderCard(item.row)
                ) : (
                    <Text role="heading" className={styles.groupHeading()}>
                        {groupText(item.group)}
                    </Text>
                )
            }
            onEndReached={onLoadMore ? endReached : undefined}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
                hasFooter && totalLines.length > 0 ? (
                    <View role="group" aria-label={t.total} className={styles.card()}>
                        {totalLines.map((column) => (
                            <View
                                key={column.id}
                                className={styles.pair()}
                                {...(web
                                    ? {}
                                    : { accessible: true, 'aria-label': `${column.header}: ${footerText(column)}` })}
                            >
                                <Text className={styles.pairLabel()}>{column.header}</Text>
                                <View className={styles.pairContent()}>
                                    <Text className={styles.footerText()}>{footerText(column)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : undefined
            }
        />
    );

    let body: ReactNode;
    if (failed)
        body = (
            <View role="alert" className={styles.error()}>
                <Text className={styles.errorText()}>{translations.dataSource.error}</Text>
                <Button variant="outline" size="sm" onPress={() => void controller.refresh()}>
                    {translations.dataSource.retry}
                </Button>
            </View>
        );
    else if (items.length) body = cards ? cardList : table;
    else if (busy) body = null;
    else
        body = (
            <View className={styles.status()}>
                {filtering
                    ? (noResults ?? (
                          <Text className={styles.statusText()}>
                              {noResultsText ?? emptyText ?? translations.common.noResults}
                          </Text>
                      ))
                    : (empty ?? <Text className={styles.statusText()}>{emptyText ?? translations.common.empty}</Text>)}
            </View>
        );

    const activeFilterCount = Object.keys(activeFilters).length;
    const showToolbar = search || sortable.length > 0 || filterable.length > 0 || !!onExport || !!toolbar;

    return (
        <View
            className={styles.base({ class: className })}
            style={style}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        >
            {showToolbar && (
                <View className={styles.toolbar()}>
                    {search && (
                        <View className={styles.search()}>
                            <SearchField
                                label={t.search(caption)}
                                placeholder={t.searchPlaceholder}
                                value={searchText}
                                onValueChange={setSearch}
                                loading={hasSource && busy && !!searchText}
                            />
                        </View>
                    )}
                    <View className={styles.tools()}>
                        {sortable.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                leadingIcon={ArrowUpDown}
                                onPress={() => setSortOpen(true)}
                            >
                                {t.sortBy}
                            </Button>
                        )}
                        {filterable.length > 0 && (
                            <Button
                                variant={activeFilterCount ? 'soft' : 'outline'}
                                size="sm"
                                leadingIcon={ListFilter}
                                onPress={() => setFilterOpen(true)}
                            >
                                {activeFilterCount ? `${t.filters} (${activeFilterCount})` : t.filters}
                            </Button>
                        )}
                        {!!onExport && (
                            <Menu
                                items={exportEntries}
                                title={t.exportMenu}
                                onSelect={(value) => {
                                    const [format, part] = value.split(':');
                                    exportFile(format === 'xlsx' ? 'xlsx' : 'csv', part === 'selection');
                                }}
                            >
                                <Button variant="outline" size="sm" leadingIcon={Download}>
                                    {t.exportMenu}
                                </Button>
                            </Menu>
                        )}
                        {toolbar}
                    </View>
                </View>
            )}
            {cards && selectable && multiple && items.length > 0 && (
                <View className={styles.selectAll()}>
                    <Checkbox checked={allState} onCheckedChange={(checked) => selectAll(checked === true)}>
                        {selectAllText}
                    </Checkbox>
                </View>
            )}
            {busy && (
                <View className={styles.status()}>
                    <Loader className={styles.spinner()} />
                    <Text className={styles.statusText()}>{loadingText ?? translations.common.loading}</Text>
                </View>
            )}
            {body}
            {!!onLoadMore && !!hasMore && !failed && (
                <View className={styles.more()}>
                    <Button variant="outline" size="sm" loading={busy} onPress={() => onLoadMore()}>
                        {busy ? translations.dataSource.loadingMore : translations.dataSource.loadMore}
                    </Button>
                </View>
            )}
            {!!size && total > 0 && !failed && (
                <Pagination
                    count={total}
                    pageSize={size}
                    pageSizes={pageSizeOptions}
                    page={pageNumber}
                    variant="auto"
                    translations={{ rootLabel: `${caption}: ${translations.pagination.rootLabel}` }}
                    onPageChange={setPage}
                    onPageSizeChange={(next) => {
                        setOwnPageSize(next);
                        onPageSizeChange?.(next);
                    }}
                />
            )}
            {sortable.length > 0 && (
                <SortSheet
                    open={sortOpen}
                    onClose={() => setSortOpen(false)}
                    columns={sortable}
                    sorting={sorting}
                    multiple={sortMode === 'multiple'}
                    onSortingChange={setSorting}
                />
            )}
            {filterable.length > 0 && (
                <FilterSheet
                    open={filterOpen}
                    onClose={() => setFilterOpen(false)}
                    columns={filterable}
                    rows={data}
                    filters={activeFilters}
                    onApply={setFilters}
                />
            )}
            {!!rowActions && (
                <Menu
                    items={actionRow ? actionsFor(actionRow) : []}
                    open={!!actionRow}
                    onOpenChange={(next) => {
                        if (!next) setActionRow(null);
                    }}
                    title={actionRow ? t.rowActions(labelOf(actionRow)) : t.actions}
                    onSelect={(value) => {
                        if (actionRow) onRowAction?.({ value, row: actionRow, rowId: idOf(actionRow) });
                    }}
                />
            )}
            {region}
        </View>
    );
}
