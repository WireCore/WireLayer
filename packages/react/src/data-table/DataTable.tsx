/* eslint-disable react-hooks/refs, react-hooks/immutability, react-hooks/set-state-in-effect --
   Not for the React Compiler (it skips the component): TanStack Table and Virtual keep their state in mutable objects.
   Until the virtualizer moved into the feature virtualRows, its import made the compiler skip the component as well */
import { Menu as ArkMenu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import {
    useTable,
    type Column,
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnOrderState,
    type ColumnPinningState,
    type ColumnSizingState,
    type ColumnVisibilityState,
    type ExpandedState,
    type Header,
    type PaginationState,
    type Row,
    type RowSelectionState,
    type SortingState,
    type Updater,
} from '@tanstack/react-table';
import {
    aggregateValues,
    applyPending,
    changesByRow,
    autoRowSpans,
    conditionFieldsFromColumns,
    csvSeparator,
    emptyConditionGroup,
    isActiveCondition,
    matchesCondition,
    type ConditionField,
    type ConditionGroup,
    clearTableState,
    collectErrors,
    createDataController,
    createXlsx,
    dataAnnouncement,
    dataTable as dataTableRecipe,
    dataTableMatchModes,
    downloadBytes,
    downloadText,
    EditHistory,
    extendRange,
    findMatches,
    fitColumnWidth,
    gridFocusIn,
    gridKeydown,
    groupedRowMove,
    historyKey,
    idRange,
    inlineArrowStep,
    isActiveFilter,
    isRangeMatchMode,
    listValueKey,
    loadTableState,
    locateTreeNode,
    matchesColumnFilter,
    matchesRowKeywords,
    matchesSearch,
    matchModeDefinition,
    menu as menuRecipe,
    moveColumnBlock,
    nextSorting,
    numberSummary,
    omitTableState,
    parseCellText,
    parseTsv,
    pasteTargets,
    pendingValue,
    pivotTable,
    pivotView,
    printHtml,
    printTableHtml,
    queryKey,
    rangeAround,
    rangeBounds,
    rowColumnSpans,
    rowsToDataSource,
    sameCellValue,
    sameTableValue,
    saveTableState,
    syncGrid,
    treeGridKeyAction,
    toCsv,
    toTsv,
    treeDropMove,
    treeKeyboardMove,
    type CellChange,
    type CellRange,
    type DataSource,
    type DataState,
    type DataTableFilterValue,
    type DataTableSort,
    type DataTableState,
    type DataTableStateKey,
    type PendingChanges,
    type PrintCell,
    type RecipeClasses,
    type TreeMove,
    type XlsxRow,
    type XlsxValue,
    warnInDevelopment,
} from '@wirecore/wirelayer-recipes';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Check,
    ChevronDown,
    ChevronRight,
    ChevronsDownUp,
    ChevronsUpDown,
    ChevronUp,
    Columns3,
    Download,
    EllipsisVertical,
    Filter,
    FilterX,
    GripVertical,
    ListFilter,
    Maximize2,
    Minimize2,
    Pencil,
    Redo2,
    Rows3,
    Search,
    TextSearch,
    Undo2,
    X,
} from 'lucide-react';
import {
    Fragment,
    useEffect,
    useId,
    useImperativeHandle,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
    type DragEvent,
    type FocusEvent,
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
    type ReactNode,
    type Ref,
    type UIEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../components/Button/Button.js';
import { Checkbox } from '../components/Checkbox/Checkbox.js';
import { ContextMenu } from '../components/ContextMenu/ContextMenu.js';
import { CopyButton } from '../components/CopyButton/CopyButton.js';
import { Highlight } from '../components/Highlight/Highlight.js';
import { IconButton } from '../components/IconButton/IconButton.js';
import { Input } from '../components/Input/Input.js';
import { Menu, type MenuEntry } from '../components/Menu/Menu.js';
import { Pagination } from '../components/Pagination/Pagination.js';
import { Select } from '../components/Select/Select.js';
import { Skeleton } from '../components/Skeleton/Skeleton.js';
import { Spinner } from '../components/Spinner/Spinner.js';
import { useLocale, useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { FeatureContext, features as tableFeatures } from './features.js';
import { FilterMenu } from './FilterMenu.js';
import type {
    DataTableAdvancedFilterProps,
    DataTableAllSelection,
    DataTableBatchSave,
    DataTableCellChange,
    DataTableCellEdit,
    DataTableCellPaste,
    DataTableCellSelection,
    DataTableColumn,
    DataTableCsvOptions,
    DataTableDataSource,
    DataTableEditorProps,
    DataTableFeature,
    DataTablePivot,
    DataTablePrintOptions,
    DataTableRowAction,
    DataTableRowClick,
    DataTableRowEdit,
    DataTableRowReorder,
    DataTableVirtualizer,
    DataTableVirtualOptions,
    DataTableXlsxOptions,
} from './types.js';
import { ValueInput } from './ValueInput.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';

/** Methods of the table (`ref`) */
export interface DataTableHandle {
    /** Downloads the filtered and sorted rows of all pages – or only the selected rows – as CSV */
    exportCsv: (options?: boolean | DataTableCsvOptions) => void;
    /** The CSV of the filtered and sorted rows of all pages (or of the selection) as text */
    generateCsv: (options?: DataTableCsvOptions) => string;
    /** Forgets the saved state (`stateKey`) */
    clearState: () => void;
    /** Clears the column filters, the search and the advanced filter – back to page 1 */
    resetFilters: () => void;
    /** `resetFilters()`, the sorting back to `defaultSorting`, no selection – and forgets the saved state */
    resetState: () => void;
    /** Downloads the rows as an Excel file (.xlsx): numbers as numbers, dates as dates, bold header and totals */
    exportXlsx: (options?: DataTableXlsxOptions) => void;
    /** The Excel file (.xlsx) of the rows as bytes */
    generateXlsx: (options?: DataTableXlsxOptions) => Uint8Array;
    /** Prints all filtered and sorted rows (all pages) as plain text, the header on every page, without controls */
    print: (options?: DataTablePrintOptions) => void;
    /** Asks the data source (`dataSource`) again for the current page, past the cache */
    refresh: () => Promise<void>;
    /** Undoes the last cell change (edit, paste, batch) – like Ctrl+Z */
    undo: () => void;
    /** Redoes the last undone cell change – like Ctrl+Y */
    redo: () => void;
}

type Density = 'sm' | 'md' | 'lg';

export interface DataTableProps<TData> extends Omit<
    ComponentProps<'div'>,
    'children' | 'ref' | 'contextMenu' | 'onScrollEnd' | 'onRowClick'
> {
    /** The rows (with `dataSource` the table loads them itself) */
    data?: readonly TData[];
    /**
     * Rows from a server instead of `data` and `manual`: the table asks `getRows` (page, sorting, filters, search,
     * grouping, abort signal) whenever they change, cancels outdated requests, goes back to page 1 when filters,
     * sorting or the search change, shows errors with "Try again" – `refresh()` asks again
     */
    dataSource?: DataTableDataSource<TData>;
    /** How long answers of `dataSource` are reused for the same query, in ms (default 0: always ask) */
    cacheTime?: number;
    /** Pause after typing in the search before `dataSource` is asked, in ms (default 300) */
    searchDebounce?: number;
    /**
     * Cross table of `data`: rows grouped by the values of `rows`, a column per value combination of `columns`, the
     * `values` aggregated in the cells, totals per row and column (ids are column ids of `columns`)
     */
    pivot?: DataTablePivot;
    columns: readonly DataTableColumn<TData>[];
    /** Accessible name of the table (visually hidden caption) */
    caption: string;
    getRowId?: (row: TData, index: number) => string;
    /** Rows per page – enables pagination (changeable with `pageSizeOptions`) */
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    /** Choices for the rows per page, shown next to the pagination */
    pageSizeOptions?: readonly number[];
    /** Current page (1-based); controlled together with onPageChange */
    page?: number;
    onPageChange?: (page: number) => void;
    /** Index of the first row of the current page (0-based) – instead of `page`; controlled with onFirstChange */
    first?: number;
    onFirstChange?: (first: number) => void;
    /** Pagination below (default) or above the table */
    paginatorPosition?: 'top' | 'bottom';
    /** Current sorting; controlled together with onSortingChange – an array in the multiple mode */
    sorting?: DataTableSort | DataTableSort[] | null;
    onSortingChange?: (sorting: DataTableSort | DataTableSort[] | null) => void;
    /** Sorting at the start (uncontrolled) */
    defaultSorting?: DataTableSort | DataTableSort[] | null;
    /** `multiple`: Shift+click (or the column menu) sorts by further columns */
    sortMode?: 'single' | 'multiple';
    /** Server mode: `data` is the current page, already sorted and filtered; requires `rowCount` */
    manual?: boolean;
    rowCount?: number;
    /** Selection column */
    selectable?: boolean;
    /** `multiple` (checkboxes, default) or `single` (radio buttons) */
    selectionMode?: 'multiple' | 'single';
    selection?: string[];
    onSelectionChange?: (selection: string[]) => void;
    /**
     * The selected rows as objects – controlled with onSelectedRowsChange (instead of or next to `selection`); rows
     * are found by `getRowId`
     */
    selectedRows?: readonly TData[];
    /** The selected rows as objects (rows of other pages are remembered) */
    onSelectedRowsChange?: (rows: TData[]) => void;
    /** A click on the row (not on its controls) selects it; Shift+click selects a range */
    selectOnRowClick?: boolean;
    /** Rows that cannot be selected get a disabled checkbox */
    isRowSelectable?: (row: TData) => boolean;
    /**
     * `all` with `manual`: "select all" means every row on every page – `allSelection` then holds
     * `{ mode: 'all', except }` (the rows unchecked since); without `manual` all rows of `data` are selected
     */
    selectAllMode?: 'page' | 'all';
    /** "Select all" across the pages of a server table (`selectAllMode="all"`); controlled with onAllSelectionChange */
    allSelection?: DataTableAllSelection | null;
    onAllSelectionChange?: (selection: DataTableAllSelection | null) => void;
    /** Names a row for its controls ("Select <label>") */
    rowLabel?: (row: TData, index: number) => string;
    loading?: boolean;
    /** While loading: the table fades (`overlay`, default) or shows placeholder rows (`skeleton`) */
    loadingVariant?: 'overlay' | 'skeleton';
    emptyText?: string;
    /** Shown when the filters or the search leave no row (default: `emptyText`) */
    noResultsText?: string;
    loadingText?: string;
    selectAllLabel?: string;
    /** TreeTable: child rows of a row – they appear indented below it and can be expanded */
    getSubRows?: (row: TData) => TData[] | undefined;
    /** TreeTable filters: `strict` (default) – a row must match itself; `lenient` – a match in a child keeps its parents */
    treeFilterMode?: 'lenient' | 'strict';
    /** Expanded rows (ids); controlled together with onExpandedChange – also the rows with open details */
    expanded?: string[];
    defaultExpanded?: string[];
    onExpandedChange?: (expanded: string[]) => void;
    /** Names the expand button of a row */
    expandLabel?: (row: TData, index: number) => string;
    /** Details below an expanded row – adds the expand column */
    expansion?: (row: TData, rowId: string) => ReactNode;
    /**
     * Advanced filter: the rows pass a condition tree (nested and/or rules). `true` offers every column with a filter
     * type; or pass the fields. A toolbar button opens the editor from `renderAdvancedFilter` above the table – usually
     * `ConditionBuilder` from `@wirecore/wirelayer-blocks-react`; without it there is no button (the tree still filters). A server
     * filters instead: `dataSource` gets the tree as `condition`, with `manual` the parent applies `advancedFilterValue`
     */
    advancedFilter?: boolean | ConditionField[];
    /** The condition tree of the advanced filter (controlled together with onAdvancedFilterValueChange) */
    advancedFilterValue?: ConditionGroup;
    onAdvancedFilterValueChange?: (value: ConditionGroup) => void;
    /**
     * The editor of the advanced filter, e.g. `(props) => <ConditionBuilder {...props} />` with ConditionBuilder from
     * `@wirecore/wirelayer-blocks-react`: gets the fields, the tree, the setter and the label of the panel
     */
    renderAdvancedFilter?: (props: DataTableAdvancedFilterProps) => ReactNode;
    /** Search field above the table: filters over all columns */
    search?: boolean;
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    /**
     * More text the search finds a row by, besides its columns – e.g. fields without a column of their own (not in
     * server mode: there the server searches)
     */
    rowKeywords?: (row: TData) => string | readonly string[] | null | undefined;
    /** Marks the search hits in the cells */
    highlightSearch?: boolean;
    /** Column filters by column id; controlled together with onFiltersChange */
    filters?: Record<string, DataTableFilterValue>;
    onFiltersChange?: (filters: Record<string, DataTableFilterValue>) => void;
    /** Filters in a row below the headers, as a menu per column with match modes and conditions, or none */
    filterDisplay?: 'row' | 'menu' | 'none';
    /** Shows the filter row or menus (`filterToggle`); controlled with onShowFiltersChange – the filters keep working */
    showFilters?: boolean;
    onShowFiltersChange?: (show: boolean) => void;
    /** Button in the toolbar that shows and hides the filters */
    filterToggle?: boolean;
    /** Button in the toolbar that clears the column filters, the search and the advanced filter (`resetFilters()`) */
    filterReset?: boolean;
    /** Conditions per column in the filter menu */
    maxConstraints?: number;
    /** Column widths can be changed by dragging the header edge or with the arrow keys */
    resizable?: boolean;
    /** Menu above the table to show and hide columns */
    columnToggle?: boolean;
    hiddenColumns?: string[];
    onHiddenColumnsChange?: (ids: string[]) => void;
    /** Menu per column header: sort, pin, move, hide, group */
    columnMenu?: boolean;
    /** Columns can be moved by drag and drop or the column menu */
    reorderableColumns?: boolean;
    columnOrder?: string[];
    onColumnOrderChange?: (ids: string[]) => void;
    /** Pinned columns (default: `pinned` of the columns) */
    pinnedColumns?: { start: string[]; end: string[] };
    onPinnedColumnsChange?: (pinned: { start: string[]; end: string[] }) => void;
    /** Shows an export button; the CSV has the filtered and sorted rows of all pages (or the selection) */
    exportFilename?: string;
    /** Separator of the CSV export, also of the export button – default: from the locale (";" where numbers have a
     * decimal comma, e.g. de-DE, as a spreadsheet there expects it; "," otherwise) */
    csvSeparator?: string;
    /** Formats of the export button: CSV (default), Excel (.xlsx) or both */
    exportFormats?: ('csv' | 'xlsx')[];
    /** Groups the rows by the values of these columns (expandable group rows) */
    groupBy?: string | string[];
    onGroupByChange?: (ids: string[]) => void;
    /** Rows (ids) that stay at the top, also while scrolling and paging */
    frozenRows?: readonly string[];
    /** Rows can be moved with the drag handle (mouse or arrow keys) */
    reorderableRows?: boolean;
    onRowReorder?: (move: DataTableRowReorder<TData>) => void;
    /** Column with the row number */
    rowNumbers?: boolean;
    /** Menu per row (last column) */
    rowActions?: MenuEntry[] | ((row: TData) => MenuEntry[]);
    onRowAction?: (action: DataTableRowAction<TData>) => void;
    /** The row actions also open on right click (and Shift+F10) */
    contextMenu?: boolean;
    /** Extra classes of a row */
    rowClass?: (row: TData) => string | undefined;
    /**
     * Rows as links: the first cell holds a real link (Ctrl+click and middle click open a new tab), a click anywhere
     * on the row follows it – `onRowClick` can take over the navigation (router)
     */
    rowHref?: (row: TData) => string | undefined;
    /** A click on a row (not on its controls) – with `rowHref`, `event.preventDefault()` stops the navigation */
    onRowClick?: (click: DataTableRowClick<TData>) => void;
    /**
     * `grid`: keyboard like a spreadsheet (ARIA grid) – one Tab stop, arrow keys from cell to cell, Home/End,
     * Ctrl+Home/End, Page Up/Down, Enter/F2 into a cell or edit it, Escape back, Space selects the row
     */
    navigation?: 'tab' | 'grid';
    /** Bar below the table: rows, filtered and selected rows, sum and average of the selected numbers */
    statusBar?: boolean;
    /**
     * Cells can be selected as a range: drag with the mouse, Shift+click, Shift+arrow keys (`navigation="grid"`).
     * Ctrl+C copies the range (or the selected rows) as tab-separated text, Ctrl+V pastes text from Excel into
     * editable cells from the active cell on (a single value fills the range), Ctrl+Z/Ctrl+Y undo and redo
     */
    cellSelection?: boolean;
    /** The selected range changed (null: none) */
    onCellSelectionChange?: (selection: DataTableCellSelection<TData> | null) => void;
    /** Cells were pasted – call `preventDefault()` to keep them out of the table (cell edit events follow otherwise) */
    onCellPaste?: (paste: DataTableCellPaste<TData>) => void;
    /** "Save" in the batch mode (`editMode="batch"`): the collected changes */
    onSave?: (save: DataTableBatchSave<TData>) => void;
    /** Button "Find in table": finds text in the cells, match x of y, previous/next, marks the matches */
    find?: boolean;
    /** Long header texts wrap instead of being shortened */
    wrapHeaders?: boolean;
    /** Header texts read from bottom to top (narrow columns) */
    verticalHeaders?: boolean;
    /**
     * `cell`: one cell at a time (Tab moves on); `row`: a whole row with save and cancel; `batch`: like `cell`, but
     * the changes are collected (marked) until "Save" (`onSave`) or "Discard", with undo and redo
     */
    editMode?: 'cell' | 'row' | 'batch';
    /** An editable cell was changed (`editMode="cell"`) */
    onCellEdit?: (edit: DataTableCellEdit<TData>) => void;
    /** A row was saved (`editMode="row"`) */
    onRowEdit?: (edit: DataTableRowEdit<TData>) => void;
    /** Row height (`densityToggle`) */
    size?: Density;
    onSizeChange?: (size: Density) => void;
    /** Menu above the table to change the row height */
    densityToggle?: boolean;
    /** Lines between the columns */
    gridlines?: boolean;
    /** Every other row tinted */
    striped?: boolean;
    /** Button above the table to show it on the whole screen */
    fullscreenToggle?: boolean;
    /** Fixed height (CSS length): the table scrolls inside, header and footer stay visible */
    scrollHeight?: string;
    /**
     * Feature modules, imported on their own so apps only bundle what they use (fixed for the life of the table):
     * `virtualRows` from `/virtual` for `virtual`, `dateInput` and `numberInput` for date and number filters and
     * editors (without them the browser's inputs)
     */
    features?: readonly DataTableFeature[];
    /** Only the visible rows are rendered (requires `scrollHeight` and the feature `virtualRows`) */
    virtual?: boolean;
    /** Estimated row height in px for `virtual` */
    rowHeight?: number;
    /** Scrolled near the end (`scrollHeight`) – load more rows (infinite scrolling) */
    onLoadMore?: () => void;
    /** @deprecated Same as `onLoadMore` (the name of the other lists) */
    onScrollEnd?: () => void;
    /** Keeps sorting, filters, page, widths, order and the other settings in the browser under this key */
    stateKey?: string;
    stateStorage?: 'local' | 'session';
    /** Parts of the state that `stateKey` does not keep – default: the selection (`[]` keeps it, too) */
    stateExclude?: readonly DataTableStateKey[];
    /** Own controls in the toolbar, after the search */
    toolbar?: ReactNode;
    /** Own controls at the start of the toolbar, before the search */
    toolbarStart?: ReactNode;
    /** Own controls at the end of the toolbar, before the built-in buttons */
    toolbarEnd?: ReactNode;
    /** Shown when there are no rows */
    empty?: ReactNode;
    /** Shown when the filters or the search leave no row (default: `empty`) */
    noResults?: ReactNode;
    /** Shown while loading without rows (default: spinner and "Loading") */
    loadingContent?: ReactNode;
    ref?: Ref<DataTableHandle>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dataTableRecipe>;
}

type Features = typeof tableFeatures;

const resolve = <T,>(updater: Updater<T>, current: T) =>
    typeof updater === 'function' ? (updater as (old: T) => T)(current) : updater;
const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));
const toArray = (value: string | string[] | undefined) =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];
const toSorting = (value: DataTableSort | DataTableSort[] | null | undefined): SortingState =>
    !value ? [] : Array.isArray(value) ? value : [value];
const toFilters = (state: ColumnFiltersState) =>
    Object.fromEntries(
        state
            .filter((filter) => isActiveFilter(filter.value as DataTableFilterValue))
            .map((filter) => [filter.id, filter.value as DataTableFilterValue])
    );
const fromFilters = (filters: Record<string, DataTableFilterValue>): ColumnFiltersState =>
    Object.entries(filters)
        .filter(([, value]) => isActiveFilter(value))
        .map(([columnId, value]) => ({ id: columnId, value }));
const toIds = (ids: string[], value = true) => Object.fromEntries(ids.map((key) => [key, value]));
/** Selection state: TanStack keeps selected ids only (value true) */
const toSelection = (ids: string[]): RowSelectionState => Object.fromEntries(ids.map((key) => [key, true as const]));
const withSelected = (state: RowSelectionState, ids: string[], checked: boolean): RowSelectionState => {
    const next = { ...state };
    for (const key of ids) {
        if (checked) next[key] = true;
        else delete next[key];
    }
    return next;
};
/** Choices with values of their own (objects, numbers): select filters compare the cell value, not the text */
const byValue = (column: { filterOptions?: readonly unknown[] }) =>
    (column.filterOptions ?? []).some((option) => typeof option !== 'string');
/** Editors whose choice is taken at once in the cell mode */
const INSTANT = new Set(['select', 'date', 'checkbox']);
const MIN_WIDTH = 60;
const RESIZE_STEP = 16;
const NO_ROWS: never[] = [];
/** Default of `stateExclude`: the selection is not kept */
const SELECTION_ONLY: readonly DataTableStateKey[] = ['selection'];

/** The value kept while its content stays the same – a new but equal prop (inline object, a copy) is no change */
function useSameValue<T>(value: T): T {
    const [kept, setKept] = useState(value);
    if (kept === value || sameTableValue(kept, value)) return kept;
    setKept(value);
    return value;
}
/** A row source (`getRows`) or a general data source (`getItems`) as a data source */
const toDataSource = <T,>(source: DataTableDataSource<T>): DataSource<T> =>
    'getRows' in source ? rowsToDataSource(source.getRows) : source;
/** Where typing, pasting and undoing belong to the control itself, not to the table */
const TEXT_CONTROLS = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-editor]';
/** Widths of the utility columns when columns have fixed widths */
const UTILITY_WIDTH = { drag: 40, select: 48, expand: 40, number: 56, actions: 88 } as const;
type Utility = keyof typeof UTILITY_WIDTH;
/** Without the feature virtualRows: no virtualizer, all rows are rendered */
const noVirtualizer = () => undefined;

/** Data table on TanStack Table: sorting (also by several columns), search, filter row or filter menus with match modes, pagination, selection, column menu (pin, move, hide, group), resizing, column groups, totals, row details, row actions, row reordering, editing (cell or row), virtual scrolling, full screen, CSV export and saved state */
export function DataTable<TData extends object>({
    classes,
    data: dataProp,
    dataSource,
    cacheTime = 0,
    searchDebounce = 300,
    pivot,
    columns: columnsProp,
    caption,
    getRowId,
    pageSize,
    onPageSizeChange,
    pageSizeOptions,
    page,
    onPageChange,
    first,
    onFirstChange,
    paginatorPosition = 'bottom',
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
    selectedRows,
    onSelectedRowsChange,
    selectOnRowClick = false,
    isRowSelectable,
    selectAllMode = 'page',
    allSelection: allSelectionProp,
    onAllSelectionChange,
    rowLabel: rowLabelProp,
    loading = false,
    loadingVariant = 'overlay',
    emptyText,
    noResultsText,
    loadingText,
    selectAllLabel,
    getSubRows,
    treeFilterMode,
    expanded: expandedProp,
    defaultExpanded,
    onExpandedChange,
    expandLabel: expandLabelProp,
    expansion,
    advancedFilter,
    advancedFilterValue,
    onAdvancedFilterValueChange,
    renderAdvancedFilter,
    search = false,
    globalFilter: globalFilterProp,
    onGlobalFilterChange,
    rowKeywords,
    highlightSearch = false,
    filters,
    onFiltersChange,
    filterDisplay = 'row',
    showFilters: showFiltersProp,
    onShowFiltersChange,
    filterToggle = false,
    filterReset = false,
    maxConstraints = 2,
    resizable = false,
    columnToggle = false,
    hiddenColumns,
    onHiddenColumnsChange,
    columnMenu = false,
    reorderableColumns = false,
    columnOrder: columnOrderProp,
    onColumnOrderChange,
    pinnedColumns,
    onPinnedColumnsChange,
    exportFilename,
    csvSeparator: csvSeparatorProp,
    exportFormats,
    groupBy,
    onGroupByChange,
    frozenRows,
    reorderableRows = false,
    onRowReorder,
    rowNumbers: showRowNumbers = false,
    rowActions,
    onRowAction,
    contextMenu = false,
    rowClass,
    rowHref,
    onRowClick: onRowClickProp,
    navigation = 'tab',
    statusBar = false,
    cellSelection = false,
    onCellSelectionChange,
    onCellPaste,
    onSave,
    find = false,
    wrapHeaders = false,
    verticalHeaders = false,
    editMode = 'cell',
    onCellEdit,
    onRowEdit,
    size,
    onSizeChange,
    densityToggle = false,
    gridlines = false,
    striped = false,
    fullscreenToggle = false,
    scrollHeight,
    features,
    virtual = false,
    rowHeight = 41,
    onLoadMore,
    onScrollEnd,
    stateKey,
    stateStorage = 'session',
    stateExclude = SELECTION_ONLY,
    toolbar,
    toolbarStart,
    toolbarEnd,
    empty,
    noResults: noResultsContent,
    loadingContent,
    ref,
    className,
    ...props
}: DataTableProps<TData>) {
    const dataTable = useRecipe('dataTable', dataTableRecipe, classes);
    const menu = useRecipe('menu', menuRecipe);
    const menuStyles = menu();
    type TableRow = Row<Features, TData>;
    type TableColumn = Column<Features, TData, unknown>;
    const translations = useTranslations();
    const { locale } = useLocale();
    const t = translations.dataTable;
    const id = useId();
    const root = useRef<HTMLDivElement>(null);
    // Read once: the virtualizer of `virtualRows` is a hook of this component
    const [feature] = useState<DataTableFeature>(() => Object.assign({}, ...(features ?? [])));
    const labelFor = (row: TData, index: number) => rowLabelProp?.(row, index) ?? t.row(index);
    const expandLabelFor = (row: TData, index: number) =>
        expandLabelProp?.(row, index) ?? t.subRows(labelFor(row, index));

    // Rows from a data source: the controller asks, cancels outdated requests and caches; the table shows its state
    const [sourceState, setSourceState] = useState<DataState<TData>>({ status: 'idle', items: [] });
    const sourceRef = useRef(dataSource);
    const [controller] = useState(() =>
        createDataController<TData>({
            source: { getItems: (request) => toDataSource(sourceRef.current!).getItems(request) },
        })
    );
    useEffect(() => {
        sourceRef.current = dataSource;
        controller.configure({ ttl: cacheTime, debounce: searchDebounce });
    });
    useEffect(() => {
        controller.configure({ onChange: setSourceState });
        return () => controller.dispose();
    }, [controller]);

    // Pivot: the cross table of `data` becomes the rows and columns of the table
    const pivotModel = useMemo(() => {
        if (!pivot) return null;
        const byId = new Map<string, DataTableColumn<TData>>();
        const walk = (list: readonly DataTableColumn<TData>[]) =>
            list.forEach((column) => (column.columns ? walk(column.columns) : byId.set(column.id, column)));
        walk(columnsProp);
        const columnValue = (row: TData, columnId: string) => {
            const column = byId.get(columnId);
            if (!column) return (row as Record<string, unknown>)[columnId];
            return typeof column.accessor === 'function'
                ? column.accessor(row)
                : row[(column.accessor ?? column.id) as keyof TData];
        };
        const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
        return pivotView(
            pivotTable(dataProp ?? NO_ROWS, pivot, columnValue, (row, columnId, value) => {
                const format = byId.get(columnId)?.format;
                return format ? format(value, row) : text(value);
            }),
            pivot,
            {
                header: (columnId) => byId.get(columnId)?.header ?? columnId,
                totalLabel: t.total,
                format: (value) => (typeof value === 'number' ? numbers.format(value) : text(value)),
            }
        );
    }, [pivot, dataProp, columnsProp, locale, t]);
    // Advanced filter: the condition tree filters `data` before the table sees it
    const [ownAdvancedTree, setOwnAdvancedTree] = useState<ConditionGroup>(() => emptyConditionGroup('and', 'root'));
    const advancedTree = advancedFilterValue ?? ownAdvancedTree;
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const advancedFields = useMemo(
        () =>
            Array.isArray(advancedFilter)
                ? advancedFilter
                : advancedFilter
                  ? conditionFieldsFromColumns(columnsProp, dataProp ?? NO_ROWS)
                  : [],
        [advancedFilter, columnsProp, dataProp]
    );
    const advancedActive = !!advancedFilter && isActiveCondition(advancedTree, advancedFields);
    const setAdvancedTree = (tree: ConditionGroup) => {
        setOwnAdvancedTree(tree);
        onAdvancedFilterValueChange?.(tree);
    };
    // The editor comes from outside (ConditionBuilder lives in @wirecore/wirelayer-blocks-react) – without one, no button
    const advancedEditor = !!advancedFilter && !!renderAdvancedFilter;
    useEffect(() => {
        if (advancedFilter && !renderAdvancedFilter)
            warnInDevelopment(
                'DataTable: `advancedFilter` has no editor, so the toolbar button is hidden – pass ' +
                    '`renderAdvancedFilter={(props) => <ConditionBuilder {...props} />}` with ConditionBuilder from ' +
                    '@wirecore/wirelayer-blocks-react'
            );
    }, [advancedFilter, renderAdvancedFilter]);
    // A server (manual, dataSource) gets the tree with the query instead (`condition`)
    const filteredDataProp = useMemo(
        () =>
            advancedActive && !manual
                ? (dataProp ?? NO_ROWS).filter((row) => matchesCondition(row, advancedTree, advancedFields, locale))
                : dataProp,
        [advancedActive, manual, dataProp, advancedTree, advancedFields, locale]
    );
    const data = (
        pivotModel ? pivotModel.rows : dataSource ? sourceState.items : (filteredDataProp ?? NO_ROWS)
    ) as TData[];
    const columnDefs = (pivotModel ? pivotModel.columns : columnsProp) as DataTableColumn<TData>[];
    /** Server mode: `manual` or a data source – sorting, filters and pages come from the server */
    const serverMode = manual || !!dataSource;
    const serverRowCount = dataSource ? (sourceState.totalCount ?? sourceState.items.length) : rowCount;
    const sourceError = !!dataSource && sourceState.status === 'error';
    const busy = loading || (!!dataSource && sourceState.status === 'loading');

    // Leaf columns (columns inside groups) by id
    const { leafDefs, columnById } = useMemo(() => {
        const map = new Map<string, DataTableColumn<TData>>();
        const leaves: DataTableColumn<TData>[] = [];
        const walk = (list: DataTableColumn<TData>[]) =>
            list.forEach((column) => {
                map.set(column.id, column);
                if (column.columns) walk(column.columns);
                else leaves.push(column);
            });
        walk(columnDefs);
        return { leafDefs: leaves, columnById: map };
    }, [columnDefs]);
    const rawValue = (column: DataTableColumn<TData>, row: TData) =>
        typeof column.accessor === 'function'
            ? column.accessor(row)
            : row[(column.accessor ?? column.id) as keyof TData];
    /** Text of a value as shown, exported and searched */
    const display = (column: DataTableColumn<TData> | undefined, value: unknown, row: TData) =>
        column?.format ? column.format(value, row) : text(value);

    // Controlled when the prop is set, internal otherwise. An equal copy of a prop (inline object) is no change
    const sortingValue = useSameValue(sortingProp);
    const [internalSorting, setInternalSorting] = useState<SortingState>(() => toSorting(defaultSorting));
    const sorting = useMemo(
        () => (sortingValue === undefined ? internalSorting : toSorting(sortingValue)),
        [sortingValue, internalSorting]
    );
    const [internalPageIndex, setInternalPageIndex] = useState(0);
    // Page size, groups and row height follow their props and change inside the table, too
    const [internalPageSize, setInternalPageSize] = useState(pageSize ?? 10);
    const [seenPageSize, setSeenPageSize] = useState(pageSize);
    if (pageSize !== seenPageSize) {
        setSeenPageSize(pageSize);
        setInternalPageSize(pageSize ?? 10);
    }
    // A row offset (`first`) or a page
    const pageIndex =
        first !== undefined ? Math.floor(first / internalPageSize) : page === undefined ? internalPageIndex : page - 1;
    const currentPageSize = internalPageSize;
    const pagination: PaginationState = useMemo(
        () => ({ pageIndex, pageSize: currentPageSize }),
        [pageIndex, currentPageSize]
    );
    /** The id of a row object (`selectedRows`): `getRowId`, otherwise its position in `data` */
    const rowIdOf = (row: TData) => {
        const index = (dataProp ?? NO_ROWS).indexOf(row as never);
        return getRowId ? getRowId(row, index) : index >= 0 ? String(index) : undefined;
    };
    const selectionValue = useSameValue(selection);
    const selectedRowsValue = useSameValue(selectedRows);
    const selectedIds = useMemo(
        () => selectedRowsValue?.map(rowIdOf).filter((rowId) => rowId !== undefined),
        // rowIdOf reads data and getRowId – the selected rows decide
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selectedRowsValue]
    );
    const [internalSelection, setInternalSelection] = useState<RowSelectionState>({});
    const rowSelection = useMemo(
        () =>
            selectionValue !== undefined
                ? toSelection(selectionValue)
                : selectedIds !== undefined
                  ? toSelection(selectedIds)
                  : internalSelection,
        [selectionValue, selectedIds, internalSelection]
    );
    // "Select all" across the pages of a server table
    const [internalAllSelection, setInternalAllSelection] = useState<DataTableAllSelection | null>(null);
    const allSelectionValue = useSameValue(allSelectionProp);
    const allSelection = allSelectionValue === undefined ? internalAllSelection : allSelectionValue;
    const [internalShowFilters, setInternalShowFilters] = useState(true);
    const showFilters = showFiltersProp ?? internalShowFilters;
    const [grouping, setInternalGrouping] = useState<string[]>(() => toArray(groupBy));
    const groupKey = toArray(groupBy).join('\u0000');
    const [seenGroupKey, setSeenGroupKey] = useState(groupKey);
    if (groupKey !== seenGroupKey) {
        setSeenGroupKey(groupKey);
        setInternalGrouping(toArray(groupBy));
    }
    // Groups start open – unless rows have details (they share the expanded state)
    const [internalExpanded, setInternalExpanded] = useState<ExpandedState>(() =>
        defaultExpanded ? toIds(defaultExpanded) : groupBy && !expansion ? true : {}
    );
    const expandedValue = useSameValue(expandedProp);
    const expanded = useMemo(
        () => (expandedValue === undefined ? internalExpanded : toIds(expandedValue)),
        [expandedValue, internalExpanded]
    );
    const [internalGlobalFilter, setInternalGlobalFilter] = useState('');
    const globalFilter = globalFilterProp ?? internalGlobalFilter;
    const [internalFilters, setInternalFilters] = useState<ColumnFiltersState>([]);
    // Derived states keep their identity between renders – TanStack treats a new array as a change
    const filtersValue = useSameValue(filters);
    const columnFilters = useMemo(
        () => (filtersValue === undefined ? internalFilters : fromFilters(filtersValue)),
        [filtersValue, internalFilters]
    );
    const [internalHidden, setInternalHidden] = useState<ColumnVisibilityState>({});
    const hiddenValue = useSameValue(hiddenColumns);
    const columnVisibility = useMemo(
        () => (hiddenValue === undefined ? internalHidden : toIds(hiddenValue, false)),
        [hiddenValue, internalHidden]
    );
    const [internalOrder, setInternalOrder] = useState<ColumnOrderState>([]);
    const columnOrder = useSameValue(columnOrderProp) ?? internalOrder;
    const [internalPinning, setInternalPinning] = useState<ColumnPinningState | null>(null);
    const pinnedValue = useSameValue(pinnedColumns);
    const columnPinning = useMemo<ColumnPinningState>(
        () =>
            pinnedValue ??
            internalPinning ?? {
                start: leafDefs.filter((column) => column.pinned === 'start').map((column) => column.id),
                end: leafDefs.filter((column) => column.pinned === 'end').map((column) => column.id),
            },
        [pinnedValue, internalPinning, leafDefs]
    );
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
    const [density, setInternalDensity] = useState<Density>(size ?? 'md');
    const [seenSize, setSeenSize] = useState(size);
    if (size !== seenSize) {
        setSeenSize(size);
        if (size) setInternalDensity(size);
    }
    const rowPinning = useMemo(() => ({ top: [...(frozenRows ?? [])], bottom: [] }), [frozenRows]);

    const setSorting = (next: SortingState) => {
        setInternalSorting(next);
        onSortingChange?.(sortMode === 'multiple' ? [...next] : (next[0] ?? null));
    };
    const setPagination = (next: PaginationState) => {
        if (next.pageSize !== pagination.pageSize) {
            setInternalPageSize(next.pageSize);
            onPageSizeChange?.(next.pageSize);
        }
        setInternalPageIndex(next.pageIndex);
        onPageChange?.(next.pageIndex + 1);
        onFirstChange?.(next.pageIndex * next.pageSize);
    };
    // Rows of other pages (server mode) stay known for onSelectedRowsChange
    const remembered = useRef(new Map<string, TData>());
    const setSelection = (next: RowSelectionState) => {
        setInternalSelection(next);
        const ids = Object.keys(next).filter((key) => next[key]);
        onSelectionChange?.(ids);
        const known = table.getCoreRowModel().rowsById;
        for (const key of [...remembered.current.keys()]) if (!next[key]) remembered.current.delete(key);
        for (const key of ids) if (known[key]) remembered.current.set(key, known[key].original);
        // Rows chosen by the parent (`selectedRows`) are known, too – also from other pages
        for (const row of selectedRows ?? []) {
            const rowId = rowIdOf(row);
            if (rowId !== undefined && next[rowId] && !remembered.current.has(rowId))
                remembered.current.set(rowId, row);
        }
        onSelectedRowsChange?.(
            ids.flatMap((key) => (remembered.current.has(key) ? [remembered.current.get(key)!] : []))
        );
    };
    const setAllSelection = (next: DataTableAllSelection | null) => {
        setInternalAllSelection(next);
        onAllSelectionChange?.(next);
    };
    const setShowFilters = (next: boolean) => {
        setInternalShowFilters(next);
        onShowFiltersChange?.(next);
    };
    const toggleFilters = () => setShowFilters(!showFilters);
    const setExpanded = (next: ExpandedState) => {
        setInternalExpanded(next);
        onExpandedChange?.(next === true ? [] : Object.keys(next).filter((key) => next[key]));
    };
    const setDensity = (next: Density) => {
        setInternalDensity(next);
        onSizeChange?.(next);
    };

    // rowKeywords: more text for the search (not in the pivot, whose rows are not the data)
    const keywordSearch = !!rowKeywords && !pivotModel;
    const columns = useMemo(() => {
        // Text filters compare the shown text, numbers and dates the value
        const textFilter = (column: DataTableColumn<TData>) =>
            !column.filter || column.filter === 'text' || column.filter === 'select' || column.filter === 'multiSelect';
        const shown = (column: DataTableColumn<TData>, value: unknown, row: TData) =>
            column.format ? column.format(value, row) : text(value);
        const toDef = (column: DataTableColumn<TData>): ColumnDef<Features, TData> => {
            if (column.columns) return { id: column.id, header: column.header, columns: column.columns.map(toDef) };
            return {
                id: column.id,
                header: column.header,
                accessorFn: (row: TData) =>
                    typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : row[(column.accessor ?? column.id) as keyof TData],
                enableSorting: !!column.sortable,
                // Always ascending first – TanStack would start numeric columns descending
                sortDescFirst: false,
                sortUndefined: 'last',
                ...(column.sortFn
                    ? { sortFn: (a: TableRow, b: TableRow) => column.sortFn!(a.original, b.original) }
                    : {}),
                filterFn: (row: TableRow, columnId: string, value: DataTableFilterValue) =>
                    matchesColumnFilter(
                        {
                            value: row.getValue(columnId),
                            text: textFilter(column) ? shown(column, row.getValue(columnId), row.original) : '',
                            row: row.original,
                            type: column.filter,
                            locale,
                            filterFn: column.filterFn as ((...args: unknown[]) => boolean) | undefined,
                            byValue: byValue(column),
                        },
                        value
                    ),
                // With rowKeywords every column takes part (globalFilterFn tests the keywords, then the searchable columns)
                enableGlobalFilter: keywordSearch || column.searchable !== false,
                enableHiding: column.hideable !== false,
                enableGrouping: true,
                ...(column.width ? { size: column.width } : {}),
                minSize: MIN_WIDTH,
            };
        };
        return columnDefs.map(toDef);
    }, [columnDefs, locale, keywordSearch]);

    const table = useTable({
        features: tableFeatures,
        columns,
        data,
        getRowId: (row: TData, index: number) =>
            pivotModel ? (row as { id: string }).id : (getRowId?.(row, index) ?? String(index)),
        state: {
            sorting,
            pagination,
            rowSelection,
            expanded,
            globalFilter,
            columnFilters,
            columnVisibility,
            columnOrder,
            columnPinning,
            columnSizing,
            grouping,
            rowPinning,
        },
        getSubRows,
        // Lenient tree filter: a match in a child keeps its parents
        filterFromLeafRows: treeFilterMode === 'lenient',
        // Details (`expansion`) can be opened on every row
        getRowCanExpand: (row: TableRow) => !!expansion || !!row.subRows?.length,
        // Moved or pasted rows change `data`: groups and tree rows stay open (TanStack would close them all)
        ...(reorderableRows || cellSelection ? { autoResetExpanded: false } : {}),
        onExpandedChange: (updater: Updater<ExpandedState>) => setExpanded(resolve(updater, expanded)),
        onSortingChange: (updater: Updater<SortingState>) => setSorting(resolve(updater, sorting)),
        onPaginationChange: (updater: Updater<PaginationState>) => setPagination(resolve(updater, pagination)),
        onRowSelectionChange: (updater: Updater<RowSelectionState>) => setSelection(resolve(updater, rowSelection)),
        onGlobalFilterChange: (updater: Updater<string>) => {
            const next = resolve(updater, globalFilter) ?? '';
            setInternalGlobalFilter(next);
            onGlobalFilterChange?.(next);
        },
        onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
            const next = resolve(updater, columnFilters);
            setInternalFilters(next);
            onFiltersChange?.(toFilters(next));
        },
        onColumnVisibilityChange: (updater: Updater<ColumnVisibilityState>) => {
            const next = resolve(updater, columnVisibility);
            setInternalHidden(next);
            onHiddenColumnsChange?.(Object.keys(next).filter((key) => next[key] === false));
        },
        onColumnOrderChange: (updater: Updater<ColumnOrderState>) => {
            const next = resolve(updater, columnOrder);
            setInternalOrder(next);
            onColumnOrderChange?.(next);
        },
        onColumnPinningChange: (updater: Updater<ColumnPinningState>) => {
            const next = resolve(updater, columnPinning);
            setInternalPinning(next);
            onPinnedColumnsChange?.({ start: [...next.start], end: [...next.end] });
        },
        onColumnSizingChange: (updater: Updater<ColumnSizingState>) => setColumnSizing((old) => resolve(updater, old)),
        onGroupingChange: (updater: Updater<string[]>) => {
            const next = resolve(updater, grouping);
            setInternalGrouping(next);
            onGroupByChange?.(next);
        },
        globalFilterFn: (row: TableRow, columnId: string, value: string) => {
            if (keywordSearch && matchesRowKeywords(rowKeywords!(row.original), value, locale)) return true;
            const column = columnById.get(columnId);
            return (
                column?.searchable !== false &&
                matchesSearch([display(column, row.getValue(columnId), row.original)], value, locale)
            );
        },
        getColumnCanGlobalFilter: (column) => keywordSearch || columnById.get(column.id)?.searchable !== false,
        enableColumnResizing: resizable,
        columnResizeMode: 'onChange',
        groupedColumnMode: false,
        keepPinnedRows: true,
        enableRowSelection: (row: TableRow) =>
            selectable && !row.getIsGrouped() && (isRowSelectable?.(row.original) ?? true),
        enableMultiRowSelection: selectionMode !== 'single',
        manualSorting: serverMode,
        manualFiltering: serverMode,
        // Without pageSize every row is shown; in server mode `data` already is the page
        manualPagination: serverMode || !pageSize,
        rowCount: serverMode ? serverRowCount : undefined,
    });

    // Styles
    const [fullscreen, setFullscreen] = useState(false);
    const look = { size: density, gridlines, striped, scrollable: !!scrollHeight, wrapHeaders, verticalHeaders };
    const grid = navigation === 'grid';
    // A tree table with grid keys is a treegrid: rows with level and open state, left/right close and open them
    const treeGrid = grid && !!getSubRows;
    const virtualOn = virtual && !!scrollHeight && !!feature.useVirtualizer;
    const paged = !!pageSize;
    const styles = dataTable({ ...look, fullscreen, grid });
    const styleFor = (columnId: string) => {
        const column = columnById.get(columnId);
        return dataTable({
            ...look,
            align: column?.align,
            hideBelow: column?.hideBelow ? (`hide-${column.hideBelow}` as const) : undefined,
        });
    };
    /** Own classes of a column's cells (`cellClass`): a function gets the row – not group rows and the footer */
    const cellClassOf = (columnId: string, row?: TableRow) => {
        const cellClass = columnById.get(columnId)?.cellClass;
        if (typeof cellClass !== 'function') return cellClass;
        return row && !row.getIsGrouped() ? cellClass(row.original) : undefined;
    };

    // Utility columns before and after the data columns
    const editable = leafDefs.some((column) => column.editable);
    /** One cell at a time – saved at once (`cell`) or collected (`batch`) */
    const cellEditing = editMode !== 'row';
    const leading: Utility[] = [
        ...(reorderableRows ? (['drag'] as const) : []),
        ...(selectable ? (['select'] as const) : []),
        ...(expansion ? (['expand'] as const) : []),
        ...(showRowNumbers ? (['number'] as const) : []),
    ];
    const trailing: Utility[] = rowActions || (editMode === 'row' && editable) ? ['actions'] : [];
    const leafColumns = table.getVisibleLeafColumns();
    const columnCount = leafColumns.length + leading.length + trailing.length;

    // Fixed widths: needed for resizing and pinning (sticky offsets)
    const sized =
        resizable ||
        leafDefs.some((column) => column.width) ||
        columnPinning.start.length > 0 ||
        columnPinning.end.length > 0;
    const pinsStart = columnPinning.start.length > 0;
    const pinsEnd = columnPinning.end.length > 0;
    const leadingWidth = leading.reduce((sum, utility) => sum + UTILITY_WIDTH[utility], 0);
    const trailingWidth = trailing.reduce((sum, utility) => sum + UTILITY_WIDTH[utility], 0);

    const pinClass = (columnId: string, head: boolean) => {
        const column = table.getColumn(columnId);
        const pinned = column?.getIsPinned();
        if (!column || !pinned) return '';
        // A line where the pinned columns meet the scrolling ones
        const edge =
            pinned === 'start'
                ? table.getStartVisibleLeafColumns().at(-1)?.id === columnId && styles.pinnedStartEdge()
                : table.getEndVisibleLeafColumns()[0]?.id === columnId && styles.pinnedEndEdge();
        return [head ? styles.pinnedHead() : styles.pinned(), edge].filter(Boolean).join(' ');
    };
    const cellStyle = (columnId: string, head: boolean) => {
        const column = table.getColumn(columnId);
        if (!column || !sized) return undefined;
        const pinned = column.getIsPinned();
        return {
            ...(head ? { width: column.getSize() } : {}),
            ...(pinned === 'start' ? { insetInlineStart: leadingWidth + column.getStart('start') } : {}),
            ...(pinned === 'end' ? { insetInlineEnd: trailingWidth + column.getAfter('end') } : {}),
        };
    };
    const utilityPinned = (utility: Utility) => (trailing.includes(utility) ? pinsEnd : pinsStart);
    const utilityClass = (utility: Utility, head: boolean) => {
        const base = utility === 'select' ? styles.selectCell() : styles.utilityCell();
        const pin = utilityPinned(utility) ? (head ? styles.pinnedHead() : styles.pinned()) : '';
        return [base, pin].filter(Boolean).join(' ');
    };
    const utilityStyle = (utility: Utility) => {
        if (!sized) return undefined;
        const width = { width: UTILITY_WIDTH[utility] };
        if (!utilityPinned(utility)) return width;
        if (trailing.includes(utility)) return { ...width, insetInlineEnd: 0 };
        const before = leading.slice(0, leading.indexOf(utility));
        return { ...width, insetInlineStart: before.reduce((sum, item) => sum + UTILITY_WIDTH[item], 0) };
    };

    // Header rows: a column appears once, spanning the rows down to its own header (TanStack repeats it as placeholder)
    const headerGroups = table.getHeaderGroups();
    const headerRows = (() => {
        const realRow = new Map<string, number>();
        const real = new Map<string, Header<Features, TData, unknown>>();
        headerGroups.forEach((group, index) =>
            group.headers.forEach((header) => {
                if (header.isPlaceholder) return;
                realRow.set(header.column.id, index);
                real.set(header.column.id, header);
            })
        );
        const placed = new Set<string>();
        return headerGroups.map((group, index) =>
            group.headers.flatMap((header) => {
                const columnId = header.column.id;
                if (placed.has(columnId)) return [];
                placed.add(columnId);
                const own = real.get(columnId)!;
                return [
                    {
                        header: own,
                        rowSpan: (realRow.get(columnId) ?? index) - index + 1,
                        group: own.subHeaders.length > 0,
                    },
                ];
            })
        );
    })();
    const label = (column: TableColumn) => columnById.get(column.id)?.header ?? column.id;
    /** `headerHidden`: the header text for screen readers only */
    const headLabelClass = (column: TableColumn) =>
        columnById.get(column.id)?.headerHidden ? styles.srOnly() : styles.headLabel();

    // Sorting
    const ariaSort = (columnId: string) => {
        const first = sorting[0];
        if (first?.id === columnId) return first.desc ? 'descending' : 'ascending';
        return table.getColumn(columnId)?.getCanSort() ? 'none' : undefined;
    };
    const sortPosition = (columnId: string) => sorting.findIndex((sort) => sort.id === columnId) + 1;

    // Announcements: moved rows and columns, the number of rows after filtering
    const [statusText, setStatusText] = useState('');
    const announce = (message: string) => {
        // Cleared first so the same text is announced again
        setStatusText('');
        setTimeout(() => setStatusText(message));
    };

    // Focus after a render: the element matching this selector
    const focusAfter = useRef<string | null>(null);
    /** Focus the cell of the element instead (grid navigation, back from editing) */
    const focusCellAfter = useRef(false);
    // A layout effect: a passive one could still be pending from an earlier render when an event sets the target,
    // run first and miss the element (an editor opened with F2 right after the virtual rows re-rendered)
    useLayoutEffect(() => {
        if (!focusAfter.current) return;
        const element = root.current?.querySelector<HTMLElement>(focusAfter.current);
        (focusCellAfter.current ? (element?.closest<HTMLElement>('td') ?? element) : element)?.focus();
        focusAfter.current = null;
        focusCellAfter.current = false;
    });

    // Column menu: sort, pin, move, hide, group
    const showColumnMenu = columnMenu || reorderableColumns;
    const canMove = (columnId: string) => reorderableColumns && columnById.get(columnId)?.reorderable !== false;
    const columnMenuItems = (column: TableColumn): MenuEntry[] => {
        const def = columnById.get(column.id);
        const sorted = column.getIsSorted();
        const pinned = column.getIsPinned();
        const visible = leafColumns.map((item) => item.id);
        const position = visible.indexOf(column.id);
        const sections: MenuEntry[][] = [
            column.getCanSort()
                ? [
                      { value: 'sort-asc', label: t.sortAscending, icon: ArrowUp, disabled: sorted === 'asc' },
                      { value: 'sort-desc', label: t.sortDescending, icon: ArrowDown, disabled: sorted === 'desc' },
                      ...(sorted ? [{ value: 'sort-clear', label: t.clearSort }] : []),
                  ]
                : [],
            [
                ...(pinned !== 'start' ? [{ value: 'pin-start', label: t.pinStart }] : []),
                ...(pinned !== 'end' ? [{ value: 'pin-end', label: t.pinEnd }] : []),
                ...(pinned ? [{ value: 'unpin', label: t.unpin }] : []),
            ],
            canMove(column.id)
                ? [
                      { value: 'move-earlier', label: t.moveEarlier, disabled: position <= 0 },
                      { value: 'move-later', label: t.moveLater, disabled: position >= visible.length - 1 },
                  ]
                : [],
            [
                ...(def?.groupable
                    ? [
                          grouping.includes(column.id)
                              ? { value: 'ungroup', label: t.ungroup }
                              : { value: 'group', label: t.groupBy },
                      ]
                    : []),
                ...(column.getCanHide() ? [{ value: 'hide', label: t.hideColumn }] : []),
            ],
        ];
        return sections
            .filter((section) => section.length)
            .flatMap((section, index) => (index ? [{ type: 'separator' as const }, ...section] : section));
    };
    const moveColumn = (columnId: string, targetId: string, after: boolean) => {
        const order = table
            .getAllLeafColumns()
            .map((column) => column.id)
            .filter((key) => key !== columnId);
        order.splice(order.indexOf(targetId) + (after ? 1 : 0), 0, columnId);
        table.setColumnOrder(order);
        const visible = leafColumns.map((column) => column.id).filter((key) => key !== columnId);
        visible.splice(visible.indexOf(targetId) + (after ? 1 : 0), 0, columnId);
        announce(
            t.columnMoved(columnById.get(columnId)?.header ?? columnId, visible.indexOf(columnId) + 1, visible.length)
        );
    };
    const onColumnMenu = (column: TableColumn, value: string) => {
        const visible = leafColumns.map((item) => item.id);
        const position = visible.indexOf(column.id);
        // Moved, pinned or regrouped columns render anew – keep the focus on this column's menu button
        focusAfter.current = `[data-column-menu="${CSS.escape(column.id)}"]`;
        switch (value) {
            case 'sort-asc':
            case 'sort-desc': {
                const sort = { id: column.id, desc: value === 'sort-desc' };
                if (sortMode !== 'multiple') setSorting([sort]);
                else if (sortPosition(column.id))
                    setSorting(sorting.map((item) => (item.id === column.id ? sort : item)));
                else setSorting([...sorting, sort]);
                break;
            }
            case 'sort-clear':
                setSorting(sorting.filter((item) => item.id !== column.id));
                break;
            case 'pin-start':
            case 'pin-end':
            case 'unpin':
                column.pin(value === 'unpin' ? false : value === 'pin-start' ? 'start' : 'end');
                break;
            case 'move-earlier':
                moveColumn(column.id, visible[position - 1]!, false);
                break;
            case 'move-later':
                moveColumn(column.id, visible[position + 1]!, true);
                break;
            case 'group':
                table.setGrouping([...grouping, column.id]);
                break;
            case 'ungroup':
                table.setGrouping(grouping.filter((key) => key !== column.id));
                break;
            case 'hide': {
                column.toggleVisibility(false);
                // The menu button is gone with the column – focus the one of the next column
                const next = visible.filter((key) => key !== column.id)[Math.min(position, visible.length - 2)];
                focusAfter.current = next ? `[data-column-menu="${CSS.escape(next)}"]` : null;
                break;
            }
        }
    };

    // Column drag and drop
    const [dragColumn, setDragColumn] = useState<string | null>(null);
    const [dropColumn, setDropColumn] = useState<{ id: string; after: boolean } | null>(null);
    const onColumnDragStart = (columnId: string, event: DragEvent) => {
        setDragColumn(columnId);
        event.dataTransfer.setData('text/plain', columnId);
        event.dataTransfer.effectAllowed = 'move';
    };
    const onColumnDragOver = (columnId: string, event: DragEvent<HTMLElement>) => {
        if (!dragColumn || dragColumn === columnId || !canMove(columnId)) return;
        event.preventDefault();
        const cell = event.currentTarget;
        const box = cell.getBoundingClientRect();
        const rtl = getComputedStyle(cell).direction === 'rtl';
        const past = event.clientX > box.left + box.width / 2;
        setDropColumn({ id: columnId, after: rtl ? !past : past });
    };
    const onColumnDragEnd = () => {
        setDragColumn(null);
        setDropColumn(null);
    };
    const onColumnDrop = (event: DragEvent) => {
        event.preventDefault();
        if (dragColumn && dropColumn) moveColumn(dragColumn, dropColumn.id, dropColumn.after);
        onColumnDragEnd();
    };
    const columnDrop = (columnId: string) =>
        dropColumn?.id === columnId ? (dropColumn.after ? 'after' : 'before') : undefined;

    /** Width to fit the content (double click or Enter on the resize handle) */
    const autoSize = (columnId: string, event: { currentTarget: EventTarget }) => {
        const header = (event.currentTarget as HTMLElement).closest('th');
        const element = header?.closest('table');
        if (!header || !element) return;
        // Virtual scrolling renders only some rows: the values of every row are measured as text as well
        const def = columnById.get(columnId);
        const texts =
            virtualOn && def
                ? table.getRowModel().rows.map((row) => display(def, row.getValue(columnId), row.original))
                : undefined;
        const width = fitColumnWidth(element, header, texts);
        if (width) table.setColumnSizing((old) => ({ ...old, [columnId]: Math.min(1200, Math.max(MIN_WIDTH, width)) }));
    };
    // Resizing with the keyboard
    const onResizeKey = (columnId: string, event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            return autoSize(columnId, event);
        }
        const step = inlineArrowStep(event.key, event.currentTarget as HTMLElement) * RESIZE_STEP;
        if (!step) return;
        event.preventDefault();
        const column = table.getColumn(columnId)!;
        table.setColumnSizing((old) => ({ ...old, [columnId]: Math.max(MIN_WIDTH, column.getSize() + step) }));
    };

    // Filters
    /** A filter type or an own filter input (renderFilter) */
    const filterable = (column: DataTableColumn<TData> | undefined) =>
        !!column && (!!column.filter || !!column.renderFilter);
    const hasRowFilters = filterDisplay === 'row' && showFilters && leafDefs.some((column) => filterable(column));
    const menuFilters = filterDisplay === 'menu' && showFilters;
    const filtering = !!globalFilter || columnFilters.length > 0 || advancedActive;
    const filterValue = (columnId: string) =>
        columnFilters.find((filter) => filter.id === columnId)?.value as DataTableFilterValue | undefined;
    const filterOptions = (column: DataTableColumn<TData>) =>
        column.filterOptions ??
        [...new Set(data.map((row) => display(column, rawValue(column, row), row)))].filter(Boolean).sort();
    /** Value in the filter row: the text, or the value of the first condition */
    const rowFilterValue = (column: DataTableColumn<TData>) => {
        const value = filterValue(column.id);
        if (value === undefined) return column.filter === 'multiSelect' ? [] : null;
        if (typeof value === 'string') return value;
        return value.constraints[0]?.value ?? null;
    };
    const setFilter = (columnId: string, value: DataTableFilterValue | undefined) =>
        table.getColumn(columnId)?.setFilterValue(value !== undefined && isActiveFilter(value) ? value : undefined);
    /** Match mode of the filter row */
    const rowMode = (column: DataTableColumn<TData>) =>
        column.filterMatchMode ??
        (byValue(column) && column.filter === 'multiSelect' ? 'in' : dataTableMatchModes[column.filter ?? 'text'][0]!);
    /** Input of the filter row: the one of an own match mode, or of the filter type */
    const rowInput = (column: DataTableColumn<TData>) =>
        matchModeDefinition(rowMode(column))?.input ?? column.filter ?? 'text';
    const setRowFilter = (column: DataTableColumn<TData>, value: unknown) => {
        const type = column.filter ?? 'text';
        // Text and select keep the plain text (as before match modes); the others a rule with the match mode of the row
        if (
            (type === 'text' || type === 'select') &&
            !column.filterMatchMode &&
            !byValue(column) &&
            !column.renderFilter
        )
            return setFilter(column.id, text(value));
        setFilter(column.id, { operator: 'and', constraints: [{ matchMode: rowMode(column), value }] });
    };
    /** From (0) or to (1) of a range in the filter row */
    const rangePart = (column: DataTableColumn<TData>, part: 0 | 1) => {
        const current = rowFilterValue(column);
        return Array.isArray(current) ? current[part] : null;
    };
    const setRowRange = (column: DataTableColumn<TData>, part: 0 | 1, value: unknown) => {
        const current = rowFilterValue(column);
        const range = Array.isArray(current) ? [...current] : [null, null];
        range[part] = value;
        setRowFilter(column, range);
    };

    // Selection
    const multiple = selectionMode !== 'single';
    /** "Select all" means all rows of all pages of the server (allSelection) */
    const acrossPages = selectAllMode === 'all' && serverMode;
    const isSelected = (row: TableRow) =>
        acrossPages && allSelection ? row.getCanSelect() && !allSelection.except.includes(row.id) : row.getIsSelected();
    const selectedCount =
        acrossPages && allSelection
            ? Math.max(0, (serverRowCount ?? data.length) - allSelection.except.length)
            : Object.values(rowSelection).filter(Boolean).length;
    const allSelected = acrossPages
        ? allSelection
            ? allSelection.except.length
                ? 'indeterminate'
                : true
            : selectedCount
              ? 'indeterminate'
              : false
        : table.getIsAllPageRowsSelected()
          ? true
          : table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : false;
    const onSelectAll = (checked: boolean) => {
        if (acrossPages) {
            setSelection({});
            setAllSelection(allSelection || !checked ? null : { mode: 'all', except: [] });
        } else if (selectAllMode === 'all') table.toggleAllRowsSelected(checked);
        else table.toggleAllPageRowsSelected(checked);
    };
    const radioName = `${id}-select`;
    const anchor = useRef<string | null>(null);
    const rangeIntent = useRef(false);
    const selectRow = (row: TableRow, checked: boolean, range = false) => {
        const visibleIds = table
            .getRowModel()
            .rows.filter((item) => item.getCanSelect())
            .map((item) => item.id);
        if (acrossPages && allSelection) {
            const except = new Set(allSelection.except);
            for (const key of range && anchor.current ? idRange(visibleIds, anchor.current, row.id) : [row.id])
                if (checked) except.delete(key);
                else except.add(key);
            setAllSelection({ mode: 'all', except: [...except] });
        } else if (!multiple) setSelection(checked ? toSelection([row.id]) : {});
        else
            setSelection(
                withSelected(
                    rowSelection,
                    range && anchor.current ? idRange(visibleIds, anchor.current, row.id) : [row.id],
                    checked
                )
            );
        anchor.current = row.id;
    };
    // Shift+click or Shift+Space on a checkbox selects the range from the last one
    const onSelectCellIntent = (event: MouseEvent | KeyboardEvent) => (rangeIntent.current = event.shiftKey);
    const controls = 'button, a, input, select, textarea, label, [role=checkbox], [role=combobox], [contenteditable]';
    const onRowClick = (row: TableRow, event: MouseEvent) => {
        const target = event.target as HTMLElement;
        // The link of the row (rowHref) counts as a click on the row, other controls do not
        const onLink = !!target.closest('[data-row-link]');
        if (!onLink && target.closest(controls)) return;
        const href = rowHref?.(row.original);
        onRowClickProp?.({ row: row.original, rowId: row.id, href, event: event.nativeEvent });
        if (href) {
            if (onLink || event.nativeEvent.defaultPrevented) return;
            if (event.ctrlKey || event.metaKey || event.shiftKey) window.open(href, '_blank', 'noopener');
            else window.location.assign(href);
            return;
        }
        if (!selectOnRowClick || !row.getCanSelect()) return;
        selectRow(row, multiple ? !isSelected(row) : true, multiple && event.shiftKey);
    };
    /** Middle click on a row with a link: a new tab */
    const onRowAuxClick = (row: TableRow, event: MouseEvent) => {
        const href = rowHref?.(row.original);
        if (event.button !== 1 || !href || (event.target as HTMLElement).closest(controls)) return;
        window.open(href, '_blank', 'noopener');
    };

    // Rows: groups, data rows and their details – one flat list, so it can be virtualised
    interface Item {
        kind: 'group' | 'row' | 'expansion';
        row: TableRow;
        key: string;
    }
    const centerRows: TableRow[] = frozenRows?.length ? table.getCenterRows() : table.getRowModel().rows;
    const frozen: TableRow[] = frozenRows?.length ? table.getTopRows() : [];
    // A failed request of the data source shows the error instead of the rows
    const items = (sourceError ? NO_ROWS : centerRows).flatMap((row): Item[] =>
        row.getIsGrouped()
            ? [{ kind: 'group', row, key: row.id }]
            : [
                  { kind: 'row', row, key: row.id },
                  ...(expansion && row.getIsExpanded()
                      ? [{ kind: 'expansion' as const, row, key: `${row.id}:details` }]
                      : []),
              ]
    );
    const pageOffset = pageSize && !serverMode ? pagination.pageIndex * pagination.pageSize : 0;
    const rowNumbers = new Map(
        items.filter((item) => item.kind === 'row').map((item, index) => [item.row.id, pageOffset + index + 1])
    );
    const detailsId = (row: TableRow) => `${id}-details-${row.id}`;
    const allExpanded = table.getIsAllRowsExpanded();
    const treeIndent = !!getSubRows || grouping.length > 0;

    // Aggregates in group rows and the footer
    const aggregated = leafDefs.some((column) => column.aggregate);
    const hasFooter = leafDefs.some((column) => column.aggregate || column.footer);
    const formatAggregate = (column: DataTableColumn<TData>, value: unknown, row?: TData) => {
        if (value === null || value === undefined) return '';
        if (column.format && row) return column.format(value, row);
        return typeof value === 'number'
            ? new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
            : text(value);
    };
    const aggregateOf = (column: DataTableColumn<TData>, rows: TableRow[]) => {
        if (!column.aggregate) return '';
        const leaves = rows.filter((row) => !row.getIsGrouped());
        const value = aggregateValues(
            leaves.map((row) => rawValue(column, row.original)),
            column.aggregate
        );
        return formatAggregate(column, value, column.aggregate === 'count' ? undefined : leaves[0]?.original);
    };
    const footerText = (column: DataTableColumn<TData>) => {
        if (column.footer !== undefined) return column.footer;
        if (!column.aggregate) return '';
        const value = aggregateOf(column, table.getFilteredRowModel().flatRows as TableRow[]);
        return typeof column.aggregate === 'string' ? (t.aggregates[column.aggregate]?.(value) ?? value) : value;
    };

    // Row actions and context menu
    const actionsFor = (row: TableRow): MenuEntry[] =>
        typeof rowActions === 'function' ? rowActions(row.original) : (rowActions ?? []);
    const [contextRow, setContextRow] = useState<TableRow | null>(null);
    const onContextTarget = (event: MouseEvent) => {
        const element = (event.target as HTMLElement).closest<HTMLElement>('[data-row-id]');
        setContextRow(element ? (table.getRow(element.dataset.rowId!, true) ?? null) : null);
    };
    const runRowAction = (row: TableRow | null, value: string) => {
        if (row) onRowAction?.({ value, row: row.original, rowId: row.id });
    };

    /** A row by id, also of another page or a group row – undefined when there is none (any more) */
    const findRow = (rowId: string): TableRow | undefined => {
        try {
            return table.getRow(rowId, true) ?? undefined;
        } catch {
            return undefined;
        }
    };

    // Row reorder: drag handle (mouse) or arrow keys on the handle – within the list, between groups (the row takes
    // the values of the target group) and in tree tables (before, after or into a row, like the Tree)
    const [dragRow, setDragRow] = useState<string | null>(null);
    const [armedRow, setArmedRow] = useState<string | null>(null);
    const [dropRow, setDropRow] = useState<{ id: string; position: 'before' | 'after' | 'inside' } | null>(null);
    const focusHandle = useRef<string | null>(null);
    useEffect(() => {
        if (!focusHandle.current) return;
        root.current?.querySelector<HTMLElement>(`[data-drag-handle="${CSS.escape(focusHandle.current)}"]`)?.focus();
        focusHandle.current = null;
    }, [data]);
    const treeRows = !!getSubRows;
    const grouped = grouping.length > 0;
    /** Key of the group of a row (grouped tables) */
    const rowGroupKey = (row: TableRow) =>
        grouping.map((columnId) => listValueKey(row.getValue(columnId))).join('\u0000');
    /** Name of the group of a row: "Location: Nuremberg" */
    const groupName = (row: TableRow) =>
        grouping
            .map((columnId) => {
                const column = columnById.get(columnId);
                return `${column?.header ?? columnId}: ${display(column, row.getValue(columnId), row.original)}`;
            })
            .join(', ');
    const dataRows = () =>
        items.filter((item) => item.kind === 'row' && (grouped || item.row.depth === 0)).map((item) => item.row);
    /** The rows as a tree of ids (tree tables) */
    const treeOf = () => {
        interface Node {
            id: string;
            children?: Node[];
        }
        const walk = (rows: TableRow[]): Node[] =>
            rows.map((row) => ({
                id: row.id,
                ...(getSubRows?.(row.original) ? { children: walk(row.subRows as TableRow[]) } : {}),
            }));
        return walk(table.getCoreRowModel().rows as TableRow[]);
    };
    const reorder = (row: TableRow, target: TableRow, after: boolean) => {
        // Positions as moveItem() takes them: the target position counts without the moved row
        const shift = (from: number, to: number) => (from < to ? to - 1 : to);
        const from = row.index;
        const to = shift(from, target.index + (after ? 1 : 0));
        const intoGroup = grouped && rowGroupKey(row) !== rowGroupKey(target);
        if (from === to && !intoGroup) return;
        const group = intoGroup
            ? Object.fromEntries(grouping.map((columnId) => [columnId, target.getValue(columnId)]))
            : undefined;
        onRowReorder?.({ row: row.original, rowId: row.id, from, to, ...(group ? { group } : {}) });
        const peers = dataRows()
            .filter((item) => item.id !== row.id && (!grouped || rowGroupKey(item) === rowGroupKey(target)))
            .map((item) => item.id);
        const position = peers.indexOf(target.id) + (after ? 1 : 0) + 1;
        const name = labelFor(row.original, row.index);
        announce(
            intoGroup
                ? t.rowMovedToGroup(name, groupName(target), position, peers.length + 1)
                : t.rowMoved(name, position, peers.length + 1)
        );
    };
    /** A move in a tree table: reported with the new parent and position; the parent opens */
    const moveInTree = (row: TableRow, move: TreeMove | undefined) => {
        if (!move) return;
        const tree = treeOf();
        const parent = move.parentId ? findRow(move.parentId) : undefined;
        const siblings = move.parentId ? (locateTreeNode(tree, move.parentId)?.node.children ?? []) : tree;
        onRowReorder?.({
            row: row.original,
            rowId: row.id,
            from: row.index,
            to: move.index,
            parentId: move.parentId,
            index: move.index,
        });
        if (parent && !parent.getIsExpanded()) parent.toggleExpanded(true);
        announce(
            t.rowMovedInTree(
                labelFor(row.original, row.index),
                parent ? labelFor(parent.original, parent.index) : null,
                move.index + 1,
                siblings.filter((node) => node.id !== row.id).length + 1
            )
        );
    };
    const onHandleKey = (row: TableRow, event: KeyboardEvent) => {
        if (treeRows) {
            const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
            const direction =
                event.key === 'ArrowUp'
                    ? 'up'
                    : event.key === 'ArrowDown'
                      ? 'down'
                      : event.key === 'ArrowRight'
                        ? rtl
                            ? 'out'
                            : 'in'
                        : event.key === 'ArrowLeft'
                          ? rtl
                              ? 'in'
                              : 'out'
                          : undefined;
            if (!direction) return;
            event.preventDefault();
            focusHandle.current = row.id;
            moveInTree(row, treeKeyboardMove(treeOf(), row.id, direction));
            return;
        }
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        const list = dataRows();
        if (grouped) {
            // Past the edge of a group into the neighbouring one
            const move = groupedRowMove(
                list.map((item) => ({ id: item.id, group: rowGroupKey(item) })),
                row.id,
                event.key === 'ArrowUp' ? 'up' : 'down'
            );
            const target = move && findRow(move.targetId);
            if (!move || !target) return;
            focusHandle.current = row.id;
            reorder(row, target, move.after);
            return;
        }
        const target = list[list.indexOf(row) + (event.key === 'ArrowUp' ? -1 : 1)];
        if (!target) return;
        focusHandle.current = row.id;
        reorder(row, target, event.key === 'ArrowDown');
    };
    const onRowDragStart = (row: TableRow, event: DragEvent) => {
        if (armedRow !== row.id) return event.preventDefault();
        setDragRow(row.id);
        event.dataTransfer.setData('text/plain', row.id);
        event.dataTransfer.effectAllowed = 'move';
    };
    const onRowDragOver = (row: TableRow, event: DragEvent<HTMLElement>) => {
        if (!dragRow || dragRow === row.id) return;
        const box = event.currentTarget.getBoundingClientRect();
        const share = (event.clientY - box.top) / box.height;
        if (treeRows) {
            // Rows with children take a drop into them in the middle
            const position = getSubRows?.(row.original)
                ? share < 0.25
                    ? 'before'
                    : share > 0.75
                      ? 'after'
                      : 'inside'
                : share < 0.5
                  ? 'before'
                  : 'after';
            if (!treeDropMove(treeOf(), dragRow, row.id, position)) return setDropRow(null);
            event.preventDefault();
            setDropRow({ id: row.id, position });
            return;
        }
        event.preventDefault();
        setDropRow({ id: row.id, position: share > 0.5 ? 'after' : 'before' });
    };
    /** Dragging over a group row: into that group, after its last row */
    const onGroupDragOver = (row: TableRow, event: DragEvent<HTMLElement>) => {
        if (!dragRow) return;
        event.preventDefault();
        setDropRow({ id: row.id, position: 'inside' });
    };
    const onRowDragEnd = () => {
        setDragRow(null);
        setDropRow(null);
        setArmedRow(null);
    };
    const onRowDrop = (event: DragEvent) => {
        event.preventDefault();
        const row = dragRow ? findRow(dragRow) : undefined;
        const target = dropRow ? findRow(dropRow.id) : undefined;
        if (row && target && dropRow) {
            if (treeRows) moveInTree(row, treeDropMove(treeOf(), row.id, target.id, dropRow.position));
            else if (target.getIsGrouped()) {
                const last = target
                    .getLeafRows()
                    .filter((leaf) => !leaf.getIsGrouped() && leaf.id !== row.id)
                    .at(-1);
                if (last) reorder(row, last as TableRow, true);
            } else reorder(row, target, dropRow.position === 'after');
        }
        onRowDragEnd();
    };
    const rowDrop = (rowId: string) => (dropRow?.id === rowId ? dropRow.position : undefined);

    // Batch mode: changed cells are collected (with their original value) until saved or discarded
    const [pending, setPendingState] = useState<PendingChanges>({});
    const pendingRef = useRef(pending);
    const setPending = (next: PendingChanges) => {
        pendingRef.current = next;
        setPendingState(next);
    };
    /** Value of a cell as shown: the collected change of the batch mode, or the value of the row */
    const shownValue = (row: TableRow, columnId: string) => {
        const changed = pendingValue(pending, row.id, columnId);
        return changed ? changed.value : row.getValue(columnId);
    };
    // Undo and redo of cell changes (edits, pastes, the batch mode)
    const historyOn = cellSelection || editMode === 'batch';
    const [history] = useState(() => new EditHistory());
    const [, setHistoryVersion] = useState(0);
    const historyChanged = () => setHistoryVersion((version) => version + 1);
    /** Changes take effect: collected in the batch mode, otherwise reported as cell edits; undoable */
    const applyChanges = (changes: CellChange[], record = true, undo = false) => {
        if (!changes.length) return;
        if (editMode === 'batch') setPending(applyPending(pendingRef.current, changes, undo));
        else
            for (const change of undo ? [...changes].reverse() : changes) {
                const row = findRow(change.rowId);
                if (row)
                    onCellEdit?.({
                        row: row.original,
                        rowId: row.id,
                        columnId: change.columnId,
                        value: undo ? change.before : change.after,
                    });
            }
        // Row editing: the changed rows as row edits, with every editable value of the row
        if (editMode === 'row')
            for (const { rowId, values } of changesByRow(changes, undo)) {
                const row = findRow(rowId);
                if (!row) continue;
                const current = leafDefs
                    .filter((column) => column.editable)
                    .map((column) => [column.id, shownValue(row, column.id)]);
                onRowEdit?.({ row: row.original, rowId, values: { ...Object.fromEntries(current), ...values } });
            }
        if (record && historyOn) {
            history.push(changes);
            historyChanged();
        }
    };
    const undo = () => {
        const step = history.undo();
        if (!step) return;
        applyChanges(step, false, true);
        historyChanged();
        announce(t.undone(step.length));
    };
    const redo = () => {
        const step = history.redo();
        if (!step) return;
        applyChanges(step, false);
        historyChanged();
        announce(t.redone(step.length));
    };
    const pendingCount = Object.keys(pending).length;
    /** After saving or discarding: back into the table (the bar's buttons are disabled now) */
    const focusTable = () => {
        const element = tableElement.current;
        (element?.querySelector<HTMLElement>('[tabindex="0"]') ?? element)?.focus();
    };
    const saveChanges = () => {
        const changes = Object.values(pendingRef.current);
        if (!changes.length) return;
        const cellChanges: DataTableCellChange<TData>[] = [];
        const byRow = new Map<string, { row: TData; rowId: string; values: Record<string, unknown> }>();
        for (const change of changes) {
            const row = findRow(change.rowId);
            if (!row) continue;
            cellChanges.push({
                row: row.original,
                rowId: row.id,
                columnId: change.columnId,
                value: change.after,
                oldValue: change.before,
            });
            const entry = byRow.get(row.id) ?? { row: row.original, rowId: row.id, values: {} };
            entry.values[change.columnId] = change.after;
            byRow.set(row.id, entry);
        }
        onSave?.({ changes: cellChanges, rows: [...byRow.values()] });
        setPending({});
        history.clear();
        historyChanged();
        announce(t.changesSaved(cellChanges.length));
        focusTable();
    };
    const discardChanges = () => {
        if (!Object.keys(pendingRef.current).length) return;
        setPending({});
        history.clear();
        historyChanged();
        announce(t.changesDiscarded);
        focusTable();
    };

    // Editing: one cell (Enter or leaving saves, Escape cancels, Tab moves on) or one row (save/cancel buttons)
    const [editing, setEditing] = useState<{ rowId: string; columnId: string } | null>(null);
    const [editingRow, setEditingRow] = useState<string | null>(null);
    const [draft, setDraft] = useState<Record<string, unknown>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    // The draft as last set – an own editor may set a value and commit at once
    const draftRef = useRef(draft);
    const updateDraft = (next: Record<string, unknown>) => {
        draftRef.current = next;
        setDraft(next);
    };
    /** A check may answer later (a promise): the editor is busy until then */
    const [validating, setValidating] = useState(false);
    const validatingRef = useRef(false);
    /** Back to the edited cell – in grid navigation the cell itself, otherwise its edit button */
    const focusEditTarget = (selector: string) => {
        focusAfter.current = selector;
        focusCellAfter.current = grid;
    };
    const editorType = (column: DataTableColumn<TData>) => column.editor ?? 'text';
    const editKey = (rowId: string, columnId: string) => `${rowId}:${columnId}`;
    const errorId = (rowId: string, columnId: string) => `${id}-error-${rowId}-${columnId}`;
    const editorSelector = '[data-editor] :is(input, button, [role=combobox], [tabindex="0"])';
    /** Editable cells in reading order – Tab moves through them */
    const editableCells = () =>
        items
            .filter((item) => item.kind === 'row')
            .flatMap((item) =>
                leafColumns
                    .filter((column) => columnById.get(column.id)?.editable)
                    .map((column) => ({ rowId: item.row.id, columnId: column.id }))
            );
    const startEdit = (row: TableRow, columnId: string) => {
        updateEditing({ rowId: row.id, columnId });
        updateDraft({ [columnId]: shownValue(row, columnId) });
        setErrors({});
        focusAfter.current = editorSelector;
    };
    const validate = (
        row: TableRow,
        columnIds: string[],
        values: Record<string, unknown>
    ): boolean | Promise<boolean> => {
        const result = collectErrors(
            columnIds.map((columnId) => [
                columnId,
                () => columnById.get(columnId)?.validate?.(values[columnId], row.original),
            ])
        );
        const done = (next: Record<string, string>) => {
            setErrors(next);
            return Object.keys(next).length === 0;
        };
        if (!(result instanceof Promise)) return done(result);
        validatingRef.current = true;
        setValidating(true);
        return result.then(done).finally(() => {
            validatingRef.current = false;
            setValidating(false);
        });
    };
    // The cell being edited – also after an asynchronous check
    const editingRef = useRef(editing);
    const updateEditing = (next: { rowId: string; columnId: string } | null) => {
        editingRef.current = next;
        setEditing(next);
    };
    const commitCell = (row: TableRow, columnId: string, move?: 1 | -1, values = draftRef.current) => {
        if (!editing || validatingRef.current) return;
        const valid = validate(row, [columnId], values);
        if (valid instanceof Promise) {
            void valid.then((ok) => {
                // Still the same cell (the editor may have been left meanwhile)
                const current = editingRef.current;
                if (current?.rowId !== row.id || current.columnId !== columnId) return;
                if (ok) saveCell(row, columnId, move, values);
                else focusAfter.current = editorSelector;
            });
            return;
        }
        if (valid) saveCell(row, columnId, move, values);
        else focusAfter.current = editorSelector;
    };
    const saveCell = (row: TableRow, columnId: string, move: 1 | -1 | undefined, values: Record<string, unknown>) => {
        const value = values[columnId];
        updateEditing(null);
        const before = shownValue(row, columnId);
        const changed = editMode === 'batch' ? !sameCellValue(value, before) : value !== row.getValue(columnId);
        if (changed) applyChanges([{ rowId: row.id, columnId, before, after: value }]);
        if (move) {
            const cells = editableCells();
            const next = cells[cells.findIndex((cell) => cell.rowId === row.id && cell.columnId === columnId) + move];
            const nextRow = next && table.getRow(next.rowId, true);
            if (next && nextRow) return startEdit(nextRow, next.columnId);
        }
        focusEditTarget(`[data-edit="${CSS.escape(editKey(row.id, columnId))}"]`);
    };
    const cancelCell = (row: TableRow, columnId: string) => {
        updateEditing(null);
        setErrors({});
        focusEditTarget(`[data-edit="${CSS.escape(editKey(row.id, columnId))}"]`);
    };
    const onCellEditorKey = (row: TableRow, columnId: string, event: KeyboardEvent) => {
        if (event.defaultPrevented) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            cancelCell(row, columnId);
        } else if (
            event.key === 'Enter' &&
            // Several lines: Ctrl+Enter saves
            ((event.target as HTMLElement).matches('textarea')
                ? event.ctrlKey || event.metaKey
                : !(event.target as HTMLElement).matches('button, [role=combobox]'))
        ) {
            event.preventDefault();
            commitCell(row, columnId);
        } else if (event.key === 'Tab') {
            event.preventDefault();
            commitCell(row, columnId, event.shiftKey ? -1 : 1);
        }
    };
    const onCellEditorFocusOut = (row: TableRow, columnId: string, event: FocusEvent<HTMLElement>) => {
        const next = event.relatedTarget as HTMLElement | null;
        const editor = event.currentTarget;
        // Still inside the editor, or in its popup (select list, calendar) at the end of the body
        if (next && (editor.contains(next) || (!root.current?.contains(next) && next.closest('[data-scope]')))) return;
        commitCell(row, columnId);
    };
    const onDraft = (row: TableRow, column: DataTableColumn<TData>, value: unknown) => {
        const next = { ...draftRef.current, [column.id]: value };
        updateDraft(next);
        // Choices are taken at once in the cell mode
        if (cellEditing && INSTANT.has(editorType(column)) && !column.renderEditor)
            commitCell(row, column.id, undefined, next);
    };
    /** What an own editor (renderEditor) gets */
    const editorProps = (row: TableRow, column: DataTableColumn<TData>): DataTableEditorProps<TData> => ({
        value: draft[column.id],
        setValue: (value: unknown) => updateDraft({ ...draftRef.current, [column.id]: value }),
        row: row.original,
        commit: () => (cellEditing ? commitCell(row, column.id) : finishRowEdit(row, true)),
        cancel: () => (cellEditing ? cancelCell(row, column.id) : finishRowEdit(row, false)),
        invalid: !!errors[column.id],
    });
    const startRowEdit = (row: TableRow) => {
        setEditingRow(row.id);
        setErrors({});
        updateDraft(
            Object.fromEntries(
                leafDefs.filter((column) => column.editable).map((column) => [column.id, row.getValue(column.id)])
            )
        );
        focusAfter.current = editorSelector;
    };
    const finishRowEdit = (row: TableRow, save: boolean) => {
        if (validatingRef.current) return;
        const values = draftRef.current;
        const close = () => {
            setEditingRow(null);
            setErrors({});
            focusEditTarget(`[data-row-edit="${CSS.escape(row.id)}"]`);
        };
        if (!save) return close();
        const columnIds = leafDefs.filter((column) => column.editable).map((column) => column.id);
        const finish = (ok: boolean) => {
            if (!ok) {
                focusAfter.current = editorSelector;
                return;
            }
            onRowEdit?.({ row: row.original, rowId: row.id, values: { ...values } });
            close();
        };
        const valid = validate(row, columnIds, values);
        if (valid instanceof Promise) void valid.then(finish);
        else finish(valid);
    };
    const onRowEditorKey = (row: TableRow, event: KeyboardEvent) => {
        if (event.defaultPrevented) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            finishRowEdit(row, false);
        } else if (event.key === 'Enter' && (event.target as HTMLElement).matches('input')) {
            event.preventDefault();
            finishRowEdit(row, true);
        }
    };

    // Range of cells (cellSelection): mouse, Shift+click, Shift+arrow keys; copy, paste, undo
    const [cellRange, setCellRange] = useState<CellRange | null>(null);
    const rangeRowIds = items.filter((item) => item.kind === 'row').map((item) => item.row.id);
    const rangeColumnIds = leafColumns.map((column) => column.id);
    const bounds = cellSelection ? rangeBounds(cellRange, rangeRowIds, rangeColumnIds) : null;
    const rangeRowIndex = new Map(rangeRowIds.map((key, index) => [key, index]));
    const rangeColumnIndex = new Map(rangeColumnIds.map((key, index) => [key, index]));
    const isCellSelected = (rowId: string, columnId: string) => {
        if (!bounds) return false;
        const row = rangeRowIndex.get(rowId) ?? -1;
        const column = rangeColumnIndex.get(columnId) ?? -1;
        return row >= bounds.top && row <= bounds.bottom && column >= bounds.left && column <= bounds.right;
    };
    const rangeSelection = (range: CellRange | null): DataTableCellSelection<TData> | null => {
        const box = rangeBounds(range, rangeRowIds, rangeColumnIds);
        if (!box) return null;
        const rowIds = rangeRowIds.slice(box.top, box.bottom + 1);
        const columnIds = rangeColumnIds.slice(box.left, box.right + 1);
        const rows = rowIds.flatMap((key) => findRow(key) ?? []);
        return {
            rowIds,
            columnIds,
            rows: rows.map((row) => row.original),
            values: rows.map((row) => columnIds.map((columnId) => shownValue(row, columnId))),
        };
    };
    const updateRange = (next: CellRange | null) => {
        const same =
            next &&
            cellRange &&
            next.anchor.rowId === cellRange.anchor.rowId &&
            next.anchor.columnId === cellRange.anchor.columnId &&
            next.focus.rowId === cellRange.focus.rowId &&
            next.focus.columnId === cellRange.focus.columnId;
        if (same || (!next && !cellRange)) return;
        setCellRange(next);
        onCellSelectionChange?.(rangeSelection(next));
    };
    /** Mouse button held on a cell: entering other cells extends the range */
    const draggingRange = useRef(false);
    /** The range is extended from the keyboard: the focus moving along does not collapse it */
    const extendingRange = useRef(false);
    /** A Shift+click extended the range – the click must not start editing or follow a link */
    const swallowClick = useRef(false);
    useEffect(() => {
        if (!cellSelection) return;
        const stop = () => (draggingRange.current = false);
        window.addEventListener('pointerup', stop);
        return () => window.removeEventListener('pointerup', stop);
    }, [cellSelection]);
    const onCellPointerDown = (rowId: string, columnId: string, event: PointerEvent<HTMLElement>) => {
        if (!cellSelection || event.button !== 0 || (event.target as HTMLElement).closest('[data-editor]')) return;
        const position = { rowId, columnId };
        const extend = event.shiftKey && cellRange;
        updateRange(extend ? { anchor: cellRange.anchor, focus: position } : { anchor: position, focus: position });
        draggingRange.current = true;
        swallowClick.current = !!extend;
        if (extend) window.getSelection()?.removeAllRanges();
    };
    const onCellPointerEnter = (rowId: string, columnId: string, event: PointerEvent<HTMLElement>) => {
        if (!draggingRange.current || !cellRange || !(event.buttons & 1)) return;
        updateRange({ anchor: cellRange.anchor, focus: { rowId, columnId } });
        // No text selection while dragging over cells
        window.getSelection()?.removeAllRanges();
    };
    const onCellClickCapture = (event: MouseEvent) => {
        if (!swallowClick.current) return;
        swallowClick.current = false;
        event.preventDefault();
        event.stopPropagation();
    };
    /** The cell element of a position, if it is rendered */
    const cellElement = (rowId: string, columnId: string) =>
        tableElement.current?.querySelector<HTMLElement>(
            `tr[data-row-id="${CSS.escape(rowId)}"] > [data-column-id="${CSS.escape(columnId)}"]`
        ) ?? null;
    /** Shift+arrow keys, Shift+Home/End (Ctrl: to the edge) on a cell extend the range – grid navigation only */
    const extendRangeByKey = (event: KeyboardEvent<HTMLTableElement>) => {
        const target = event.target as HTMLElement;
        const key = event.key;
        if (!cellSelection || !grid || !event.shiftKey || event.altKey) return false;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return false;
        const rowId = target.closest<HTMLElement>('tr')?.dataset.rowId;
        const columnId = target.dataset.columnId;
        if (!rowId || !columnId || !target.matches('td')) return false;
        const rtl = getComputedStyle(target).direction === 'rtl';
        const direction =
            key === 'ArrowUp'
                ? 'up'
                : key === 'ArrowDown'
                  ? 'down'
                  : key === 'Home'
                    ? 'home'
                    : key === 'End'
                      ? 'end'
                      : (key === 'ArrowRight') !== rtl
                        ? 'next'
                        : 'previous';
        // From the range around the cell (Excel: the far corner moves), otherwise from the cell
        const current =
            cellRange && isCellSelected(rowId, columnId)
                ? cellRange
                : { anchor: { rowId, columnId }, focus: { rowId, columnId } };
        const next = extendRange(current, rangeRowIds, rangeColumnIds, direction, event.ctrlKey || event.metaKey);
        event.preventDefault();
        updateRange(next);
        const reveal = () => {
            const element = cellElement(next.focus.rowId, next.focus.columnId);
            if (!element) return false;
            extendingRange.current = true;
            element.focus();
            extendingRange.current = false;
            element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
            return true;
        };
        if (!reveal() && virtualOn) {
            virtualizer?.scrollToIndex(
                items.findIndex((item) => item.kind === 'row' && item.row.id === next.focus.rowId)
            );
            requestAnimationFrame(() => requestAnimationFrame(() => void reveal()));
        }
        return true;
    };
    /** Text of a cell as copied: the shown text (format), changed values of the batch mode included */
    const cellText = (row: TableRow, columnId: string) =>
        display(columnById.get(columnId), shownValue(row, columnId), row.original);
    /** Tab-separated text of the range – or of the selected rows (all shown columns) without a range */
    const copyText = () => {
        const selection = rangeSelection(cellRange);
        if (selection) {
            const rows = selection.rowIds.flatMap((key) => findRow(key) ?? []);
            return {
                text: toTsv(rows.map((row) => selection.columnIds.map((columnId) => cellText(row, columnId)))),
                count: rows.length * selection.columnIds.length,
            };
        }
        const rows = items.filter((item) => item.kind === 'row' && isSelected(item.row)).map((item) => item.row);
        if (!rows.length) return null;
        return {
            text: toTsv(rows.map((row) => rangeColumnIds.map((columnId) => cellText(row, columnId)))),
            count: rows.length * rangeColumnIds.length,
        };
    };
    /**
     * Whether Ctrl+C/Ctrl+V belong to the table: the focus is in it (a cell, the table), not in an input. The
     * browser sends clipboard events to the selection, not the focus – so they are heard on the document.
     */
    const clipboardTarget = () => {
        const active = document.activeElement;
        return !!active && !!tableElement.current?.contains(active) && !active.closest(TEXT_CONTROLS);
    };
    const onTableCopy = (event: ClipboardEvent) => {
        if (!clipboardTarget() || !event.clipboardData) return;
        // Text selected with the mouse: the browser copies it
        if (window.getSelection()?.toString()) return;
        const copied = copyText();
        if (!copied) return;
        event.clipboardData.setData('text/plain', copied.text);
        event.preventDefault();
        announce(t.cellsCopied(copied.count));
    };
    /** Pastes tab-separated text from the active cell (or the range) on: values read per column, checked, undoable */
    const pasteText = async (text: string) => {
        const cells = parseTsv(text);
        const box = rangeBounds(cellRange, rangeRowIds, rangeColumnIds);
        if (!cells.length || !box || !cellRange) return;
        const targets = pasteTargets(cells, { row: box.top, column: box.left }, rangeRowIds, rangeColumnIds, box);
        const errors: DataTableCellPaste<TData>['errors'] = [];
        const candidates: { change: CellChange; row: TableRow; def: DataTableColumn<TData> }[] = [];
        for (const target of targets) {
            const def = columnById.get(target.columnId);
            const row = findRow(target.rowId);
            if (!def || !row) continue;
            if (!def.editable) {
                errors.push({ ...target, message: t.pasteErrors.readonly! });
                continue;
            }
            const parsed = parseCellText(target.text, editorType(def), { locale, choices: def.editOptions });
            if ('error' in parsed) {
                errors.push({ ...target, message: t.pasteErrors[parsed.error] ?? parsed.error });
                continue;
            }
            const before = shownValue(row, target.columnId);
            if (sameCellValue(parsed.value, before)) continue;
            candidates.push({ change: { rowId: row.id, columnId: def.id, before, after: parsed.value }, row, def });
        }
        const checked = await collectErrors(
            candidates.map(({ change, row, def }, index) => [
                String(index),
                () => def.validate?.(change.after, row.original),
            ])
        );
        const valid = candidates.filter((candidate, index) => {
            const message = checked[String(index)];
            if (message)
                errors.push({
                    rowId: candidate.change.rowId,
                    columnId: candidate.change.columnId,
                    text:
                        targets.find(
                            (item) =>
                                item.rowId === candidate.change.rowId && item.columnId === candidate.change.columnId
                        )?.text ?? '',
                    message,
                });
            return !message;
        });
        const paste: DataTableCellPaste<TData> = {
            changes: valid.map(({ change, row }) => ({
                row: row.original,
                rowId: row.id,
                columnId: change.columnId,
                value: change.after,
                oldValue: change.before,
            })),
            errors,
            defaultPrevented: false,
            preventDefault() {
                paste.defaultPrevented = true;
            },
        };
        onCellPaste?.(paste);
        if (paste.defaultPrevented) return;
        applyChanges(valid.map(({ change }) => change));
        // The pasted cells become the range
        updateRange(rangeAround(targets, rangeRowIds, rangeColumnIds));
        announce(t.cellsPasted(valid.length, errors.length));
    };
    const onTablePaste = (event: ClipboardEvent) => {
        if (!clipboardTarget()) return;
        const text = event.clipboardData?.getData('text/plain');
        if (!text) return;
        event.preventDefault();
        void pasteText(text);
    };
    useEffect(() => {
        if (!cellSelection) return;
        document.addEventListener('copy', onTableCopy);
        document.addEventListener('paste', onTablePaste);
        return () => {
            document.removeEventListener('copy', onTableCopy);
            document.removeEventListener('paste', onTablePaste);
        };
    });
    /** Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z outside of inputs */
    const onHistoryKey = (event: KeyboardEvent<HTMLElement>) => {
        if (!historyOn || (event.target as HTMLElement).closest(TEXT_CONTROLS)) return false;
        const action = historyKey(event);
        if (!action) return false;
        event.preventDefault();
        if (action === 'undo') undo();
        else redo();
        return true;
    };

    // Find in the table: matches in the shown text of the filtered rows (all pages), previous/next, marked
    const [findOpen, setFindOpen] = useState(false);
    const [findQuery, setFindQuery] = useState('');
    const [findIndex, setFindIndex] = useState(0);
    const findActive = find && findOpen && !!findQuery.trim();
    const findRows: TableRow[] = !findActive
        ? []
        : (paged && !serverMode ? table.getPrePaginatedRowModel().rows : table.getRowModel().rows).filter(
              (row) => !row.getIsGrouped()
          );
    const matches = findActive
        ? findMatches(
              findRows.map((row) => ({
                  id: row.id,
                  cells: leafColumns.map((column) => ({ columnId: column.id, text: cellText(row, column.id) })),
              })),
              findQuery,
              locale
          )
        : [];
    const currentMatch = matches.length ? matches[Math.min(findIndex, matches.length - 1)] : undefined;
    const matchKeys = new Set(matches.map((match) => `${match.rowId}\u0000${match.columnId}`));
    const findClass = (rowId: string, columnId: string) =>
        !findActive
            ? ''
            : currentMatch?.rowId === rowId && currentMatch.columnId === columnId
              ? styles.findCurrent()
              : matchKeys.has(`${rowId}\u0000${columnId}`)
                ? styles.findMatch()
                : '';
    /** Brings the current match into view: its page, its virtual row, the cell */
    const revealMatch = useRef(false);
    const goToMatch = (index: number) => {
        if (!matches.length) return;
        const next = (index + matches.length) % matches.length;
        setFindIndex(next);
        const match = matches[next]!;
        if (paged && !serverMode) {
            const position = findRows.findIndex((row) => row.id === match.rowId);
            const targetPage = Math.floor(position / pagination.pageSize);
            if (position >= 0 && targetPage !== pagination.pageIndex) table.setPageIndex(targetPage);
        }
        revealMatch.current = true;
    };
    useEffect(() => {
        if (!revealMatch.current || !currentMatch) return;
        revealMatch.current = false;
        const show = () =>
            cellElement(currentMatch.rowId, currentMatch.columnId)?.scrollIntoView?.({
                block: 'nearest',
                inline: 'nearest',
            });
        const index = items.findIndex((item) => item.kind === 'row' && item.row.id === currentMatch.rowId);
        if (virtualOn && index >= 0) {
            virtualizer?.scrollToIndex(index, { align: 'center' });
            requestAnimationFrame(() => requestAnimationFrame(show));
        } else show();
    });
    const toggleFind = () => {
        const open = !findOpen;
        setFindOpen(open);
        focusAfter.current = open ? '[data-find-input] input, input[data-find-input]' : '[data-find-toggle]';
    };
    const onFindKey = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            goToMatch(findIndex + (event.shiftKey ? -1 : 1));
        } else if (event.key === 'Escape') {
            event.preventDefault();
            toggleFind();
        }
    };
    const onFindChange = (value: string) => {
        setFindQuery(value);
        setFindIndex(0);
        revealMatch.current = true;
    };

    // Merged cells: equal values one below the other (rowSpan 'auto'), cells over several columns (colSpan)
    const spanning = !virtualOn && leafDefs.some((column) => column.rowSpan === 'auto' || column.colSpan);
    const headerId = (columnId: string) => `${id}-head-${columnId}`;
    const spans = (() => {
        if (!spanning) return undefined;
        const columnSpans = items.map((item) =>
            item.kind === 'row'
                ? rowColumnSpans(
                      leafColumns.map((column) => columnById.get(column.id)?.colSpan?.(item.row.original) ?? 1)
                  )
                : leafColumns.map(() => 1)
        );
        const breaks = items.map((item, index) => item.kind !== 'row' || items[index - 1]?.kind !== 'row');
        const merged = leafColumns.map((column) => columnById.get(column.id)?.rowSpan === 'auto');
        // Cells over several columns take no part in merging down
        const texts = (columnId: string, columnIndex: number) =>
            items.map((item, index) =>
                item.kind === 'row' && columnSpans[index]![columnIndex] === 1 ? cellText(item.row, columnId) : null
            );
        // Nested: a merged column merges only inside the merged cells of the merged columns before it
        const nested = autoRowSpans(
            leafColumns.flatMap((column, columnIndex) => (merged[columnIndex] ? [texts(column.id, columnIndex)] : [])),
            breaks
        );
        let position = 0;
        const rowSpans = merged.map((isMerged) => (isMerged ? nested[position++] : undefined));
        return { columnSpans, rowSpans };
    })();
    /** rowSpan and colSpan of a data cell – 0 when another cell covers it */
    const spanOf = (itemIndex: number, columnIndex: number) => ({
        rowSpan: spans?.rowSpans[columnIndex]?.[itemIndex] ?? 1,
        colSpan: spans?.columnSpans[itemIndex]?.[columnIndex] ?? 1,
    });
    /** Attributes of a merged cell: its spans and the headers of the columns it covers */
    const spanAttributes = (itemIndex: number, columnIndex: number) => {
        if (!spanning) return {};
        const { rowSpan, colSpan } = spanOf(itemIndex, columnIndex);
        return {
            ...(rowSpan > 1 ? { rowSpan } : {}),
            ...(colSpan > 1 ? { colSpan } : {}),
            headers: leafColumns
                .slice(columnIndex, columnIndex + colSpan)
                .map((column) => headerId(column.id))
                .join(' '),
        };
    };

    // Export
    const generateCsv = (options: DataTableCsvOptions = {}) => {
        const visible = table
            .getVisibleLeafColumns()
            .map((column) => columnById.get(column.id)!)
            .filter((column) => column.exportable !== false);
        const rows = (
            options.selectionOnly ? table.getSelectedRowModel().flatRows : table.getSortedRowModel().flatRows
        ).filter((row) => !row.getIsGrouped());
        const records = rows.map((row) =>
            visible.map((column) =>
                column.exportValue
                    ? column.exportValue(row.original)
                    : display(column, row.getValue(column.id), row.original)
            )
        );
        const separator = options.separator ?? csvSeparatorProp ?? csvSeparator(locale);
        const csv = toCsv([visible.map((column) => column.exportHeader ?? column.header), ...records], separator);
        return options.bom === false ? csv.slice(1) : csv;
    };
    const exportCsv = (options: boolean | DataTableCsvOptions = false) => {
        const settings = typeof options === 'boolean' ? { selectionOnly: options } : options;
        downloadText(`${settings.filename ?? exportFilename ?? 'export'}.csv`, generateCsv(settings));
    };
    /** A row with its sub rows (groups, tree), depth first */
    const walkRows = (row: TableRow): { row: TableRow; group: boolean; depth: number }[] => [
        { row, group: row.getIsGrouped(), depth: row.depth },
        ...(row.subRows as TableRow[]).flatMap(walkRows),
    ];
    /** Rows of an export or print: the selection, or the sorted rows with their group rows (tree of groups) */
    const exportRows = (selectionOnly = false) =>
        selectionOnly
            ? table
                  .getSelectedRowModel()
                  .flatRows.filter((row) => !row.getIsGrouped())
                  .map((row) => ({ row, group: false, depth: 0 }))
            : table.getSortedRowModel().rows.flatMap(walkRows);
    /** Label of a group row: "Location: Frankfurt (3)" */
    const groupLabel = (row: TableRow) => {
        const column = columnById.get(row.groupingColumnId!);
        return `${column?.header ?? ''}: ${display(column, row.groupingValue, row.original)} (${row.getLeafRows().filter((leaf) => !leaf.getIsGrouped()).length})`;
    };
    /** Kind of value of a column for Excel: dates by the filter or editor type */
    const dateKind = (column: DataTableColumn<TData>) =>
        column.editor === 'datetime'
            ? 'datetime'
            : column.filter === 'date' || column.editor === 'date'
              ? 'date'
              : undefined;
    const xlsxValue = (value: unknown, column: DataTableColumn<TData>, row?: TData): XlsxValue => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        if (value instanceof Date) return { date: value, time: dateKind(column) === 'datetime' };
        const kind = dateKind(column);
        if (kind && (typeof value === 'string' || typeof value === 'number'))
            return { date: value, time: kind === 'datetime' };
        if (typeof value === 'boolean' && !column.format) return value;
        return row ? display(column, value, row) : text(value);
    };
    const generateXlsx = (options: DataTableXlsxOptions = {}) => {
        const visible = table
            .getVisibleLeafColumns()
            .map((column) => columnById.get(column.id)!)
            .filter((column) => column.exportable !== false);
        const rows: XlsxRow[] = exportRows(options.selectionOnly)
            .filter((entry) => !entry.group || options.groups !== false)
            .map(({ row, group, depth }) => {
                if (group) {
                    const leaves = row.getLeafRows().filter((leaf) => !leaf.getIsGrouped());
                    return {
                        kind: 'group',
                        level: depth,
                        cells: visible.map((column, index) => {
                            if (index === 0) return groupLabel(row);
                            if (!column.aggregate) return null;
                            const value = aggregateValues(
                                leaves.map((leaf) => rawValue(column, leaf.original)),
                                column.aggregate
                            );
                            return typeof value === 'number' ? value : text(value);
                        }),
                    };
                }
                return {
                    level: options.groups === false ? 0 : depth,
                    cells: visible.map((column) => {
                        if (column.exportValue) {
                            const value = column.exportValue(row.original);
                            return typeof value === 'number' || typeof value === 'boolean'
                                ? value
                                : value instanceof Date
                                  ? { date: value }
                                  : text(value);
                        }
                        return xlsxValue(row.getValue(column.id), column, row.original);
                    }),
                };
            });
        if (options.totals !== false && visible.some((column) => column.aggregate || column.footer)) {
            const leaves = table.getFilteredRowModel().flatRows.filter((row) => !row.getIsGrouped());
            const cells = visible.map((column): XlsxValue => {
                if (column.footer !== undefined) return column.footer;
                if (!column.aggregate) return null;
                const value = aggregateValues(
                    leaves.map((row) => rawValue(column, row.original)),
                    column.aggregate
                );
                return typeof value === 'number' ? value : text(value);
            });
            if (cells[0] === null) cells[0] = t.total;
            rows.push({ kind: 'total', cells });
        }
        return createXlsx({
            name: options.sheetName ?? caption,
            columns: visible.map((column) => ({ header: column.exportHeader ?? column.header })),
            rows,
        });
    };
    const exportXlsx = (options: DataTableXlsxOptions = {}) =>
        downloadBytes(`${options.filename ?? exportFilename ?? 'export'}.xlsx`, generateXlsx(options));
    const exportAs = (format: 'csv' | 'xlsx', selectionOnly: boolean) =>
        format === 'xlsx' ? exportXlsx({ selectionOnly }) : exportCsv(selectionOnly);

    /** Prints all filtered and sorted rows (all pages) as plain text, the header on every page, no controls */
    const print = (options: DataTablePrintOptions = {}) => {
        const visible = leafColumns.map((column) => columnById.get(column.id)!);
        const head: PrintCell[][] = headerRows.map((cells) =>
            cells.map((cell) => ({
                text: label(cell.header.column),
                colSpan: cell.group ? cell.header.colSpan : 1,
                rowSpan: cell.rowSpan,
                align: cell.group ? undefined : columnById.get(cell.header.column.id)?.align,
            }))
        );
        const body = exportRows(options.selectionOnly).map(({ row, group }) =>
            group
                ? { kind: 'group' as const, cells: [{ text: groupLabel(row), colSpan: visible.length }] }
                : {
                      cells: visible.map((column) => ({
                          text: cellText(row, column.id),
                          align: column.align,
                      })),
                  }
        );
        const foot = hasFooter
            ? visible.map((column) => ({ text: footerText(column), align: column.align }))
            : undefined;
        printHtml(
            printTableHtml({
                title: options.title ?? caption,
                caption,
                lang: locale,
                dir: getComputedStyle(root.current ?? document.body).direction === 'rtl' ? 'rtl' : 'ltr',
                head,
                body,
                foot,
            })
        );
    };
    const clearState = () => {
        if (stateKey) clearTableState(stateKey, stateStorage);
    };
    const resetFilters = () => {
        if (columnFilters.length) table.setColumnFilters([]);
        if (globalFilter) table.setGlobalFilter('');
        if (advancedActive) setAdvancedTree(emptyConditionGroup('and', 'root'));
        if (pagination.pageIndex) setPagination({ ...pagination, pageIndex: 0 });
    };
    const resetState = () => {
        resetFilters();
        setSorting(toSorting(defaultSorting));
        if (Object.keys(rowSelection).length) setSelection({});
        if (allSelection) setAllSelection(null);
        setForgotten((count) => count + 1);
    };
    const refresh = async () => {
        if (dataSource) await controller.refresh();
    };
    useImperativeHandle(ref, () => ({
        exportCsv,
        generateCsv,
        clearState,
        resetFilters,
        resetState,
        exportXlsx,
        generateXlsx,
        print,
        refresh,
        undo,
        redo,
    }));

    // Full screen: the table moves to the end of the body, everything else is inert (a layout effect like the focus
    // after a render, so leaving it lifts inert before the toggle gets the focus back)
    useLayoutEffect(() => {
        if (!fullscreen) return;
        const restore: HTMLElement[] = [];
        for (const element of document.body.children) {
            if (element === root.current || !(element instanceof HTMLElement) || element.inert) continue;
            element.inert = true;
            restore.push(element);
        }
        return () => restore.forEach((element) => (element.inert = false));
    }, [fullscreen]);
    const toggleFullscreen = () => {
        setFullscreen(!fullscreen);
        focusAfter.current = '[data-fullscreen-toggle]';
    };
    const onRootKey = (event: KeyboardEvent) => {
        if (fullscreen && event.key === 'Escape' && !event.defaultPrevented) {
            event.preventDefault();
            toggleFullscreen();
        }
    };

    // Scrolling: virtual rows and the end of the list
    const scrollElement = useRef<HTMLDivElement>(null);
    const useRows: (options: DataTableVirtualOptions) => DataTableVirtualizer | undefined =
        feature.useVirtualizer ?? noVirtualizer;
    const virtualizer = useRows({
        count: virtualOn ? items.length : 0,
        getScrollElement: () => scrollElement.current,
        estimateSize: () => rowHeight,
        overscan: 8,
        getItemKey: (index: number) => items[index]?.key ?? index,
        // Rows of the first screen before the table is measured (no empty flash, SSR)
        initialRect: { width: 0, height: Number.parseInt(scrollHeight ?? '', 10) || 400 },
    });
    useEffect(() => {
        if (virtual && !feature.useVirtualizer)
            warnInDevelopment(
                'DataTable: `virtual` needs the feature virtualRows, so all rows are rendered – pass ' +
                    '`features={[virtualRows]}` with virtualRows from @wirecore/wirelayer-react/virtual'
            );
    }, [virtual, feature]);
    const virtualItems = virtualOn ? (virtualizer?.getVirtualItems() ?? []) : [];
    const shownItems = virtualOn
        ? virtualItems.map((item) => ({ ...items[item.index]!, index: item.index }))
        : items.map((item, index) => ({ ...item, index }));
    const paddingTop = virtualOn ? (virtualItems[0]?.start ?? 0) : 0;
    const paddingBottom = virtualOn ? (virtualizer?.getTotalSize() ?? 0) - (virtualItems.at(-1)?.end ?? 0) : 0;
    const measure = (element: HTMLTableRowElement | null) => {
        if (virtualOn && element) virtualizer?.measureElement(element);
    };
    const endReported = useRef(false);
    useEffect(() => {
        endReported.current = false;
    }, [data.length]);
    const onScroll = (event: UIEvent<HTMLDivElement>) => {
        const element = event.currentTarget;
        if (endReported.current || element.scrollTop + element.clientHeight < element.scrollHeight - 80) return;
        endReported.current = true;
        onLoadMore?.();
        onScrollEnd?.();
    };
    // Frozen rows stick below the header – its height is measured
    const head = useRef<HTMLTableSectionElement>(null);
    const [headHeight, setHeadHeight] = useState(0);
    useEffect(() => {
        if (!head.current || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver(() => setHeadHeight(head.current?.offsetHeight ?? 0));
        observer.observe(head.current);
        return () => observer.disconnect();
    }, []);

    // Keyboard navigation as a grid: one Tab stop, kept in sync after every render
    const tableElement = useRef<HTMLTableElement>(null);
    useEffect(() => {
        if (grid && tableElement.current) syncGrid(tableElement.current);
    });
    /** Treegrid: ArrowRight/ArrowLeft on the tree cell open and close the row or go to its parent */
    const onTreeGridKey = (event: KeyboardEvent<HTMLTableElement>) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return false;
        const target = event.target as HTMLElement;
        const cell = target.closest('td');
        const rowId = cell?.parentElement?.dataset.rowId;
        if (!cell || !rowId || cell.cellIndex !== leading.length || target.closest(TEXT_CONTROLS)) return false;
        const row = table.getRow(rowId, true);
        if (!row) return false;
        const rtl = getComputedStyle(tableElement.current!).direction === 'rtl';
        const level = { expandable: row.getCanExpand(), expanded: row.getIsExpanded(), level: row.depth + 1 };
        const action = treeGridKeyAction(event.key, level, rtl);
        if (!action) return false;
        event.preventDefault();
        if (action === 'parent') {
            const parent = row.getParentRow();
            tableElement.current
                ?.querySelector<HTMLElement>(
                    `tr[data-row-id="${CSS.escape(parent?.id ?? '')}"] > td:nth-child(${leading.length + 1})`
                )
                ?.focus();
        } else row.toggleExpanded(action === 'expand');
        return true;
    };
    const onGridKey = (event: KeyboardEvent<HTMLTableElement>) => {
        if (!grid || !tableElement.current) return;
        if (treeGrid && onTreeGridKey(event)) return;
        gridKeydown(event.nativeEvent, tableElement.current, {
            itemCount: items.length,
            scrollToItem: virtualOn ? (index) => virtualizer?.scrollToIndex(index) : undefined,
            pageRows:
                scrollElement.current && scrollHeight
                    ? Math.max(1, Math.floor(scrollElement.current.clientHeight / rowHeight) - 1)
                    : 10,
            onSelectRow: (rowId) => {
                const row = table.getRow(rowId, true);
                if (row?.getCanSelect()) selectRow(row, multiple ? !isSelected(row) : true);
            },
        });
    };
    const onGridFocus = (event: FocusEvent<HTMLTableElement>) => {
        if (grid && tableElement.current) gridFocusIn(tableElement.current, event.target);
        // Moving with the arrow keys (not extending, not the mouse): the range is the focused cell
        const target = event.target as HTMLElement;
        const rowId = target.closest<HTMLElement>('tr')?.dataset.rowId;
        const columnId = target.dataset.columnId;
        if (!cellSelection || !grid || draggingRange.current || extendingRange.current) return;
        if (rowId && columnId && target.matches('td'))
            updateRange({ anchor: { rowId, columnId }, focus: { rowId, columnId } });
    };
    /** Undo/redo, extending the range, then the grid keys */
    const onTableKey = (event: KeyboardEvent<HTMLTableElement>) => {
        if (onHistoryKey(event) || extendRangeByKey(event)) return;
        onGridKey(event);
    };

    // Saved state (stateKey): restored after mounting (the server has no storage), saved on every change
    const restored = useRef(false);
    useEffect(() => {
        if (!stateKey) return;
        const loaded = loadTableState(stateKey, stateStorage);
        const saved = loaded && omitTableState(loaded, stateExclude);
        restored.current = true;
        if (!saved) return;
        // Restoring browser storage after hydration: the first render must match the server
        if (saved.sorting) setSorting(saved.sorting);
        if (saved.filters) table.setColumnFilters(fromFilters(saved.filters));
        if (saved.globalFilter !== undefined) table.setGlobalFilter(saved.globalFilter);
        if (saved.columnSizing) setColumnSizing(saved.columnSizing);
        if (saved.columnOrder) table.setColumnOrder(saved.columnOrder);
        if (saved.hiddenColumns) table.setColumnVisibility(toIds(saved.hiddenColumns, false));
        if (saved.pinnedColumns) table.setColumnPinning(saved.pinnedColumns);
        if (saved.expanded && saved.expanded.length) setExpanded(toIds(saved.expanded));
        if (saved.selection) setSelection(toSelection(saved.selection));
        if (saved.density) setDensity(saved.density);
        if (saved.showFilters !== undefined && saved.showFilters !== showFilters) setShowFilters(saved.showFilters);
        if (saved.page || saved.pageSize)
            setPagination({ pageIndex: (saved.page ?? 1) - 1, pageSize: saved.pageSize ?? pagination.pageSize });
        // Once after mounting
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const tableState: DataTableState = {
        sorting,
        filters: toFilters(columnFilters),
        globalFilter,
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        columnSizing,
        columnOrder,
        hiddenColumns: Object.keys(columnVisibility).filter((key) => columnVisibility[key] === false),
        pinnedColumns: columnPinning,
        expanded: expanded === true ? [] : Object.keys(expanded).filter((key) => expanded[key]),
        selection: Object.keys(rowSelection).filter((key) => rowSelection[key]),
        density,
        showFilters,
    };
    const serialized = JSON.stringify(omitTableState(tableState, stateExclude));
    // resetState(): the saved state is removed after the reset, instead of saving the reset state
    const [forgotten, setForgotten] = useState(0);
    const cleared = useRef(0);
    useEffect(() => {
        if (!stateKey || !restored.current) return;
        if (forgotten !== cleared.current) {
            cleared.current = forgotten;
            clearTableState(stateKey, stateStorage);
        } else saveTableState(stateKey, JSON.parse(serialized), stateStorage);
    }, [stateKey, stateStorage, serialized, forgotten]);

    // Data source: asks for the page whenever page, sorting, filters, search or grouping change; back to page 1
    // when the sorting, the filters or the search change; the search waits for a pause in typing
    const sourceQuery = {
        page: pagination.pageIndex + 1,
        pageSize: pageSize ? pagination.pageSize : 0,
        sorting: sorting.map((sort) => ({ id: sort.id, desc: sort.desc })),
        filters: toFilters(columnFilters) as Record<string, unknown>,
        search: globalFilter,
        groupBy: grouping,
        ...(advancedActive ? { condition: advancedTree } : {}),
    };
    const sourceKey = queryKey(sourceQuery);
    const shapeKey = queryKey({ ...sourceQuery, page: undefined, pageSize: undefined });
    const lastShape = useRef<string | undefined>(undefined);
    const lastSearch = useRef(globalFilter);
    useEffect(() => {
        if (!dataSource) return;
        const shapeChanged = lastShape.current !== undefined && lastShape.current !== shapeKey;
        lastShape.current = shapeKey;
        if (shapeChanged && pagination.pageIndex !== 0) {
            setPagination({ ...pagination, pageIndex: 0 });
            return;
        }
        const typed = lastSearch.current !== globalFilter;
        lastSearch.current = globalFilter;
        void controller.load(JSON.parse(sourceKey), { debounce: typed });
        // The query is compared as text – a new object with the same content asks nothing
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceKey, !!dataSource]);

    const total = serverMode ? (serverRowCount ?? data.length) : table.getPrePaginatedRowModel().rows.length;
    const pageSizeItems = (pageSizeOptions ?? []).map((option) => ({ value: String(option), label: String(option) }));
    const showToolbar =
        find ||
        search ||
        columnToggle ||
        !!exportFilename ||
        densityToggle ||
        fullscreenToggle ||
        filterToggle ||
        filterReset ||
        advancedEditor ||
        !!toolbar ||
        !!toolbarStart ||
        !!toolbarEnd;
    const searchQuery = highlightSearch ? globalFilter : '';

    // Loading: placeholder rows instead of the rows; messages without rows
    const skeleton = busy && loadingVariant === 'skeleton';
    const skeletonRows = Math.min(items.length || pageSize || 5, 50);
    /** No row left by the filters or the search (not: no data) – only with noResults/noResultsText */
    const showNoResults =
        filtering && (serverMode || data.length > 0) && (noResultsContent !== undefined || noResultsText !== undefined);

    // Status bar: rows, filtered, selected and the totals of the selected numbers
    const statusTotals = (() => {
        if (!statusBar) return [];
        const rows = table.getSelectedRowModel().flatRows.filter((row) => !row.getIsGrouped());
        if (!rows.length) return [];
        return leafColumns.flatMap((column) => {
            const def = columnById.get(column.id)!;
            const summary = numberSummary(rows.map((row) => rawValue(def, row.original)));
            if (!summary) return [];
            const firstRow = rows[0]!.original;
            return [
                {
                    id: column.id,
                    text: `${def.header}: ${t.aggregates.sum!(formatAggregate(def, summary.sum, firstRow))} · ${t
                        .aggregates.avg!(formatAggregate(def, summary.avg, firstRow))}`,
                },
            ];
        });
    })();
    const allRowCount = serverMode ? (serverRowCount ?? data.length) : table.getCoreRowModel().rows.length;

    /** The column with the row link: the first one that is neither edited in place nor copyable */
    const linkColumn = rowHref
        ? leafColumns.find((column) => {
              const def = columnById.get(column.id);
              return !def?.copyable && !(cellEditing && def?.editable);
          })?.id
        : undefined;
    const linkFor = (row: TableRow, columnId: string) =>
        columnId === linkColumn ? rowHref?.(row.original) : undefined;

    // Column groups in the column menu: the top level columns in their current order with their leaf columns
    const leavesOf = (def: DataTableColumn<TData>): string[] =>
        def.columns ? def.columns.flatMap(leavesOf) : [def.id];
    const columnGroups = columnDefs.some((def) => def.columns)
        ? (() => {
              const order = table.getAllLeafColumns();
              const position = (columnId: string) => order.findIndex((column) => column.id === columnId);
              return columnDefs
                  .map((def) => ({
                      def,
                      leaves: leavesOf(def)
                          .map((columnId) => order[position(columnId)]!)
                          .filter(Boolean)
                          .sort((a, b) => position(a.id) - position(b.id)),
                  }))
                  .sort((a, b) => position(a.leaves[0]?.id ?? '') - position(b.leaves[0]?.id ?? ''));
          })()
        : undefined;
    const moveColumnGroup = (groupId: string, direction: -1 | 1) => {
        const blocks = columnDefs.map((def) => ({ id: def.id, leaves: leavesOf(def) }));
        const next = moveColumnBlock(
            table.getAllLeafColumns().map((column) => column.id),
            blocks,
            groupId,
            direction
        );
        if (!next) return;
        table.setColumnOrder(next);
        const order = blocks
            .map((block) => block.id)
            .sort(
                (a, b) =>
                    next.indexOf(blocks.find((block) => block.id === a)!.leaves[0]!) -
                    next.indexOf(blocks.find((block) => block.id === b)!.leaves[0]!)
            );
        announce(t.columnMoved(columnById.get(groupId)?.header ?? groupId, order.indexOf(groupId) + 1, order.length));
    };

    // Export button: one format and no selection – a button; otherwise a menu of formats (and the selection)
    const formats = exportFormats?.length ? exportFormats : (['csv'] as const);
    const withSelection = selectable && selectedCount > 0;
    const exportItems: MenuEntry[] =
        formats.length === 1 && formats[0] === 'csv'
            ? withSelection
                ? [
                      { value: 'all', label: t.exportAll },
                      { value: 'selection', label: t.exportSelection },
                  ]
                : []
            : formats.flatMap((format) =>
                  withSelection
                      ? [
                            { value: `${format}:all`, label: t.exportAs(format, false) },
                            { value: `${format}:selection`, label: t.exportAs(format, true) },
                        ]
                      : formats.length > 1
                        ? [{ value: `${format}:all`, label: t.exportAs(format, false) }]
                        : []
              );
    const exportLabel = formats.length > 1 ? t.exportMenu : formats[0] === 'xlsx' ? t.exportXlsx : t.export;

    const pager = (
        <div className={styles.footer()}>
            {pageSizeItems.length > 0 && (
                <div className={styles.pageSize()}>
                    <span aria-hidden="true">{t.rowsPerPage}</span>
                    <Select
                        className={styles.pageSizeSelect()}
                        aria-label={t.rowsPerPage}
                        items={pageSizeItems}
                        value={String(pagination.pageSize)}
                        onValueChange={(next) => table.setPageSize(Number(next))}
                    />
                </div>
            )}
            <Pagination
                count={total}
                pageSize={pagination.pageSize}
                page={pagination.pageIndex + 1}
                translations={{ rootLabel: `${caption}: ${translations.pagination.rootLabel}` }}
                onPageChange={(next) => table.setPageIndex(next - 1)}
            />
        </div>
    );

    /** Attributes and classes of a data cell for the range, the batch mode, find and merged cells */
    const cellExtras = (row: TableRow, columnId: string, itemIndex: number, columnIndex: number) => {
        const selected = cellSelection && isCellSelected(row.id, columnId);
        const changed = editMode === 'batch' && !!pendingValue(pending, row.id, columnId);
        return {
            className: [
                selected ? styles.cellSelected() : '',
                changed ? styles.cellChanged() : '',
                findClass(row.id, columnId),
            ],
            attributes: {
                ...(cellSelection || find ? { 'data-column-id': columnId } : {}),
                ...(cellSelection && grid ? { 'aria-selected': selected } : {}),
                ...(changed ? { 'data-changed': '' } : {}),
                ...spanAttributes(itemIndex, columnIndex),
                ...(cellSelection
                    ? {
                          onPointerDown: (event: PointerEvent<HTMLElement>) =>
                              onCellPointerDown(row.id, columnId, event),
                          onPointerEnter: (event: PointerEvent<HTMLElement>) =>
                              onCellPointerEnter(row.id, columnId, event),
                          onClickCapture: onCellClickCapture,
                      }
                    : {}),
            },
        };
    };

    /** Row editing: the edit button, or save and cancel while the row is edited */
    const rowEditButtons = (row: TableRow, rowName: string) =>
        editingRow === row.id ? (
            <>
                <IconButton
                    icon={Check}
                    label={t.saveRow(rowName)}
                    variant="text"
                    size="sm"
                    onClick={() => finishRowEdit(row, true)}
                />
                <IconButton
                    icon={X}
                    label={t.cancelEdit(rowName)}
                    variant="text"
                    size="sm"
                    onClick={() => finishRowEdit(row, false)}
                />
            </>
        ) : (
            <IconButton
                data-row-edit={row.id}
                icon={Pencil}
                label={t.editRow(rowName)}
                variant="text"
                size="sm"
                onClick={() => startRowEdit(row)}
            />
        );

    /** Content of a data cell: editor, edit button, copyable value or the value */
    const cellContent = (row: TableRow, column: TableColumn, value: unknown) => {
        const def = columnById.get(column.id);
        const shown = display(def, value, row.original);
        const changed = editMode === 'batch' && !!pendingValue(pending, row.id, column.id);
        const custom = def?.cell ? def.cell(row.original, value) : undefined;
        if (
            def?.editable &&
            ((cellEditing && editing?.rowId === row.id && editing.columnId === column.id) ||
                (editMode === 'row' && editingRow === row.id))
        )
            return (
                <div
                    data-editor=""
                    className={styles.editor()}
                    aria-busy={validating || undefined}
                    onKeyDown={(event) =>
                        cellEditing ? onCellEditorKey(row, column.id, event) : onRowEditorKey(row, event)
                    }
                    onBlur={cellEditing ? (event) => onCellEditorFocusOut(row, column.id, event) : undefined}
                >
                    {def.renderEditor ? (
                        def.renderEditor(editorProps(row, def))
                    ) : (
                        <ValueInput
                            type={editorType(def)}
                            label={label(column)}
                            options={def.editOptions}
                            renderOption={def.renderOption}
                            invalid={!!errors[column.id]}
                            value={draft[column.id]}
                            onChange={(next) => onDraft(row, def, next)}
                        />
                    )}
                    {errors[column.id] && (
                        <span id={errorId(row.id, column.id)} role="alert" className={styles.editError()}>
                            {errors[column.id]}
                        </span>
                    )}
                </div>
            );
        if (cellEditing && def?.editable)
            return (
                <button
                    type="button"
                    className={styleFor(column.id).editButton()}
                    data-edit={editKey(row.id, column.id)}
                    aria-label={
                        changed ? `${t.edit(label(column), shown)}, ${t.changed}` : t.edit(label(column), shown)
                    }
                    onClick={() => startEdit(row, column.id)}
                >
                    {custom ?? shown}
                </button>
            );
        if (def?.copyable)
            return (
                <span className={styles.copyCell()}>
                    {custom ?? shown}
                    <CopyButton value={shown} label={t.copy(label(column), shown)} />
                </span>
            );
        // Hits of the search or of "find in the table" are marked
        const mark = findActive ? findQuery.trim() : searchQuery;
        const plain = custom !== undefined ? custom : mark ? <Highlight text={shown} query={mark} /> : shown;
        // Rows as links: a real link in the first cell
        const href = linkFor(row, column.id);
        return href ? (
            <a href={href} className={styles.rowLink()} data-row-link="">
                {plain}
            </a>
        ) : (
            plain
        );
    };

    const body = (
        <tbody onContextMenuCapture={onContextTarget}>
            {items.length === 0 && !skeleton && (
                <tr>
                    <td colSpan={columnCount} className={styles.message()}>
                        {sourceError ? (
                            <span className={styles.errorContent()}>
                                <span role="alert">{translations.dataSource.error}</span>
                                <Button variant="outline" size="sm" onClick={() => void refresh()}>
                                    {translations.dataSource.retry}
                                </Button>
                            </span>
                        ) : busy ? (
                            (loadingContent ?? (
                                <span className={styles.messageContent()}>
                                    <Spinner size="sm" label={loadingText ?? translations.common.loading} />
                                    {loadingText ?? translations.common.loading}
                                </span>
                            ))
                        ) : showNoResults ? (
                            (noResultsContent ?? noResultsText ?? emptyText ?? translations.common.empty)
                        ) : (
                            (empty ?? emptyText ?? translations.common.empty)
                        )}
                    </td>
                </tr>
            )}
            {/* Loading with placeholder rows (loadingVariant="skeleton") */}
            {skeleton &&
                Array.from({ length: skeletonRows }, (_, index) => (
                    <tr key={`skeleton-${index + 1}`} className={styles.row()}>
                        {leading.map((utility) => (
                            <td
                                key={utility}
                                className={styles.td({ class: utilityClass(utility, false) })}
                                style={utilityStyle(utility)}
                            />
                        ))}
                        {leafColumns.map((column) => (
                            <td
                                key={column.id}
                                className={styleFor(column.id).td({ class: pinClass(column.id, false) })}
                                style={cellStyle(column.id, false)}
                            >
                                <Skeleton />
                            </td>
                        ))}
                        {trailing.length > 0 && (
                            <td
                                className={styles.td({ class: utilityClass('actions', false) })}
                                style={utilityStyle('actions')}
                            />
                        )}
                    </tr>
                ))}
            {paddingTop > 0 && !skeleton && (
                <tr className={styles.spacer()} aria-hidden="true">
                    <td colSpan={columnCount} className={styles.spacerCell()} style={{ height: paddingTop }} />
                </tr>
            )}
            {(skeleton ? [] : shownItems).map((item) => {
                const row = item.row;
                const rowIndex = virtualOn ? item.index + headerRows.length + 1 : undefined;
                if (item.kind === 'group') {
                    const groupColumn = columnById.get(row.groupingColumnId!);
                    const groupText = display(groupColumn, row.groupingValue, row.original);
                    const count = row.getLeafRows().length;
                    // Group header: open/close the rows of one value, aggregates per column
                    return (
                        <tr
                            key={item.key}
                            ref={measure}
                            className={styles.groupRow({
                                class: dragRow ? [styles.dropTarget(), styles.dropInside()] : undefined,
                            })}
                            data-index={item.index}
                            aria-rowindex={rowIndex}
                            data-drop={dragRow ? rowDrop(row.id) : undefined}
                            onDragOver={reorderableRows ? (event) => onGroupDragOver(row, event) : undefined}
                            onDragLeave={reorderableRows ? () => setDropRow(null) : undefined}
                            onDrop={reorderableRows ? onRowDrop : undefined}
                        >
                            <td colSpan={aggregated ? leading.length + 1 : columnCount} className={styles.groupCell()}>
                                <div className={styles.treeCell()} style={{ paddingInlineStart: row.depth * 20 }}>
                                    <button
                                        type="button"
                                        className={styles.expander()}
                                        aria-expanded={row.getIsExpanded()}
                                        aria-label={t.group(groupColumn?.header ?? '', groupText, count)}
                                        onClick={row.getToggleExpandedHandler()}
                                    >
                                        <ChevronRight
                                            className={styles.expanderIcon()}
                                            data-state={row.getIsExpanded() ? 'open' : 'closed'}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    <span className={styles.groupLabel()}>{groupText}</span>
                                    <span className={styles.groupCount()}>{`(${count})`}</span>
                                </div>
                            </td>
                            {aggregated && (
                                <>
                                    {leafColumns.slice(1).map((column) => (
                                        <td key={column.id} className={styleFor(column.id).groupAggregate()}>
                                            {aggregateOf(columnById.get(column.id)!, row.getLeafRows() as TableRow[])}
                                        </td>
                                    ))}
                                    {trailing.length > 0 && <td className={styles.groupAggregate()} />}
                                </>
                            )}
                        </tr>
                    );
                }
                if (item.kind === 'expansion')
                    // Details of an expanded row
                    return (
                        <tr
                            key={item.key}
                            id={detailsId(row)}
                            ref={measure}
                            className={styles.expansionRow()}
                            data-index={item.index}
                            aria-rowindex={rowIndex}
                        >
                            <td colSpan={columnCount} className={styles.expansionCell()}>
                                {expansion?.(row.original, row.id)}
                            </td>
                        </tr>
                    );
                const rowName = labelFor(row.original, row.index);
                return (
                    <tr
                        key={item.key}
                        ref={measure}
                        className={styles.row({
                            class: [
                                reorderableRows ? styles.dropTarget() : '',
                                reorderableRows && treeRows && dragRow ? styles.dropInside() : '',
                                rowHref?.(row.original) ? styles.linkRow() : '',
                                rowClass?.(row.original),
                            ],
                        })}
                        data-state={isSelected(row) ? 'selected' : undefined}
                        aria-selected={grid && selectable ? isSelected(row) : undefined}
                        data-row-id={row.id}
                        data-index={item.index}
                        aria-rowindex={rowIndex}
                        aria-level={treeGrid ? row.depth + 1 : undefined}
                        aria-expanded={treeGrid && row.getCanExpand() ? row.getIsExpanded() : undefined}
                        draggable={armedRow === row.id ? 'true' : undefined}
                        data-drop={rowDrop(row.id)}
                        data-dragging={dragRow === row.id || undefined}
                        onClick={(event) => onRowClick(row, event)}
                        onAuxClick={(event) => onRowAuxClick(row, event)}
                        onDragStart={(event) => onRowDragStart(row, event)}
                        onDragOver={(event) => onRowDragOver(row, event)}
                        onDragLeave={() => setDropRow(null)}
                        onDrop={onRowDrop}
                        onDragEnd={onRowDragEnd}
                    >
                        {leading.map((utility) => (
                            <td
                                key={utility}
                                className={styles.td({ class: utilityClass(utility, false) })}
                                style={utilityStyle(utility)}
                            >
                                {utility === 'drag' ? (
                                    <button
                                        type="button"
                                        className={styles.dragHandle()}
                                        data-drag-handle={row.id}
                                        aria-label={t.moveRow(rowName)}
                                        aria-keyshortcuts={
                                            treeRows ? 'ArrowUp ArrowDown ArrowLeft ArrowRight' : 'ArrowUp ArrowDown'
                                        }
                                        onKeyDown={(event) => onHandleKey(row, event)}
                                        onPointerDown={() => setArmedRow(row.id)}
                                        onPointerUp={() => setArmedRow(dragRow ? armedRow : null)}
                                    >
                                        <GripVertical className={styles.dragIcon()} aria-hidden="true" />
                                    </button>
                                ) : utility === 'select' && multiple ? (
                                    <span onClickCapture={onSelectCellIntent} onKeyDownCapture={onSelectCellIntent}>
                                        <Checkbox
                                            checked={isSelected(row)}
                                            disabled={!row.getCanSelect()}
                                            aria-label={t.selectRow(rowName)}
                                            onCheckedChange={(checked) =>
                                                selectRow(row, checked === true, rangeIntent.current)
                                            }
                                        />
                                    </span>
                                ) : utility === 'select' ? (
                                    <input
                                        type="radio"
                                        name={radioName}
                                        className={styles.radio()}
                                        checked={isSelected(row)}
                                        disabled={!row.getCanSelect()}
                                        aria-label={t.selectRow(rowName)}
                                        onChange={() => selectRow(row, true)}
                                    />
                                ) : utility === 'expand' ? (
                                    <button
                                        type="button"
                                        className={styles.expander()}
                                        aria-expanded={row.getIsExpanded()}
                                        aria-controls={row.getIsExpanded() ? detailsId(row) : undefined}
                                        aria-label={t.details(rowName)}
                                        onClick={() => row.toggleExpanded()}
                                    >
                                        <ChevronRight
                                            className={styles.expanderIcon()}
                                            data-state={row.getIsExpanded() ? 'open' : 'closed'}
                                            aria-hidden="true"
                                        />
                                    </button>
                                ) : (
                                    <span className={styles.rowNumber()}>{rowNumbers.get(row.id)}</span>
                                )}
                            </td>
                        ))}
                        {row.getVisibleCells().map((cell, cellIndex) => {
                            // Covered by a merged cell
                            if (spanning) {
                                const span = spanOf(item.index, cellIndex);
                                if (!span.rowSpan || !span.colSpan) return null;
                            }
                            const content = cellContent(row, cell.column, shownValue(row, cell.column.id));
                            const extras = cellExtras(row, cell.column.id, item.index, cellIndex);
                            return (
                                <td
                                    key={cell.id}
                                    className={styleFor(cell.column.id).td({
                                        class: [
                                            pinClass(cell.column.id, false),
                                            cellClassOf(cell.column.id, row),
                                            ...extras.className,
                                        ],
                                    })}
                                    style={cellStyle(cell.column.id, false)}
                                    {...extras.attributes}
                                >
                                    {treeIndent && cellIndex === 0 ? (
                                        // TreeTable and groups: indented by depth, expand button for rows with children
                                        <div
                                            className={styles.treeCell()}
                                            style={{ paddingInlineStart: row.depth * 20 }}
                                        >
                                            {getSubRows && row.getCanExpand() ? (
                                                <button
                                                    type="button"
                                                    className={styles.expander()}
                                                    aria-expanded={row.getIsExpanded()}
                                                    aria-label={expandLabelFor(row.original, row.index)}
                                                    onClick={row.getToggleExpandedHandler()}
                                                >
                                                    <ChevronRight
                                                        className={styles.expanderIcon()}
                                                        data-state={row.getIsExpanded() ? 'open' : 'closed'}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            ) : (
                                                <span className={styles.expanderSpacer()} />
                                            )}
                                            {content}
                                        </div>
                                    ) : (
                                        content
                                    )}
                                </td>
                            );
                        })}
                        {trailing.length > 0 && (
                            <td
                                className={styles.td({ class: utilityClass('actions', false) })}
                                style={utilityStyle('actions')}
                            >
                                <div className={styles.editActions()}>
                                    {editMode === 'row' && editable && rowEditButtons(row, rowName)}
                                    {rowActions && editingRow !== row.id && (
                                        <Menu items={actionsFor(row)} onSelect={(value) => runRowAction(row, value)}>
                                            <IconButton
                                                icon={EllipsisVertical}
                                                label={t.rowActions(rowName)}
                                                variant="text"
                                                size="sm"
                                            />
                                        </Menu>
                                    )}
                                </div>
                            </td>
                        )}
                    </tr>
                );
            })}
            {paddingBottom > 0 && !skeleton && (
                <tr className={styles.spacer()} aria-hidden="true">
                    <td colSpan={columnCount} className={styles.spacerCell()} style={{ height: paddingBottom }} />
                </tr>
            )}
        </tbody>
    );

    const content = (
        <div
            {...props}
            ref={root}
            className={styles.base({ class: className })}
            role={fullscreen ? 'dialog' : undefined}
            aria-modal={fullscreen || undefined}
            aria-label={fullscreen ? caption : undefined}
            onKeyDown={onRootKey}
        >
            {showToolbar && (
                <div className={styles.toolbar()}>
                    {toolbarStart}
                    {search && (
                        <Input
                            type="search"
                            size="sm"
                            leadingIcon={Search}
                            className={styles.search()}
                            placeholder={t.searchPlaceholder}
                            aria-label={t.search(caption)}
                            value={globalFilter}
                            onChange={(event) => table.setGlobalFilter(event.target.value)}
                        />
                    )}
                    {toolbar}
                    <div className={styles.toolbarEnd()}>
                        {toolbarEnd}
                        {find && (
                            <IconButton
                                data-find-toggle=""
                                icon={TextSearch}
                                label={t.find}
                                variant="outline"
                                size="sm"
                                aria-expanded={findOpen}
                                onClick={toggleFind}
                            />
                        )}
                        {advancedEditor && (
                            <Button
                                variant="outline"
                                size="sm"
                                leadingIcon={ListFilter}
                                aria-expanded={advancedOpen}
                                aria-controls={`${id}-advanced`}
                                onClick={() => setAdvancedOpen(!advancedOpen)}
                            >
                                {translations.conditionBuilder.advanced}
                            </Button>
                        )}
                        {filterToggle && (
                            <IconButton
                                icon={Filter}
                                label={t.filterToggle}
                                variant="outline"
                                size="sm"
                                aria-pressed={showFilters}
                                onClick={toggleFilters}
                            />
                        )}
                        {filterReset && (
                            <IconButton
                                icon={FilterX}
                                label={t.resetFilters}
                                variant="outline"
                                size="sm"
                                disabled={!filtering}
                                onClick={resetFilters}
                            />
                        )}
                        {densityToggle && (
                            <ArkMenu.Root positioning={{ placement: 'bottom-end', gutter: 4 }} lazyMount unmountOnExit>
                                <ArkMenu.Trigger asChild>
                                    <IconButton icon={Rows3} label={t.density} variant="outline" size="sm" />
                                </ArkMenu.Trigger>
                                <Portal>
                                    <ArkMenu.Positioner>
                                        <ArkMenu.Content className={menuStyles.content()}>
                                            <ArkMenu.RadioItemGroup
                                                value={density}
                                                onValueChange={(details) => setDensity(details.value as Density)}
                                            >
                                                {(['sm', 'md', 'lg'] as const).map((option) => (
                                                    <ArkMenu.RadioItem
                                                        key={option}
                                                        value={option}
                                                        className={menuStyles.item()}
                                                    >
                                                        <ArkMenu.ItemIndicator>
                                                            <Check className={styles.menuCheck()} aria-hidden="true" />
                                                        </ArkMenu.ItemIndicator>
                                                        <ArkMenu.ItemText className={menuStyles.label()}>
                                                            {t.densities[option]}
                                                        </ArkMenu.ItemText>
                                                    </ArkMenu.RadioItem>
                                                ))}
                                            </ArkMenu.RadioItemGroup>
                                        </ArkMenu.Content>
                                    </ArkMenu.Positioner>
                                </Portal>
                            </ArkMenu.Root>
                        )}
                        {columnToggle && (
                            <ArkMenu.Root positioning={{ placement: 'bottom-end', gutter: 4 }} lazyMount unmountOnExit>
                                <ArkMenu.Trigger asChild>
                                    <Button variant="outline" size="sm" leadingIcon={Columns3}>
                                        {t.columns}
                                    </Button>
                                </ArkMenu.Trigger>
                                <Portal>
                                    <ArkMenu.Positioner>
                                        <ArkMenu.Content className={menuStyles.content()}>
                                            {(columnGroups
                                                ? columnGroups
                                                : [{ def: undefined, leaves: table.getAllLeafColumns() }]
                                            ).map(({ def, leaves }, blockIndex) => {
                                                const hideable = leaves.filter((column) => column.getCanHide());
                                                const toggle = (column: TableColumn, indent: boolean) => (
                                                    <ArkMenu.CheckboxItem
                                                        key={column.id}
                                                        value={column.id}
                                                        checked={column.getIsVisible()}
                                                        onCheckedChange={(checked) => column.toggleVisibility(checked)}
                                                        closeOnSelect={false}
                                                        className={menuStyles.item({
                                                            class: indent ? styles.columnGroupItem() : undefined,
                                                        })}
                                                    >
                                                        <ArkMenu.ItemIndicator>
                                                            <Check className={styles.menuCheck()} aria-hidden="true" />
                                                        </ArkMenu.ItemIndicator>
                                                        <ArkMenu.ItemText className={menuStyles.label()}>
                                                            {label(column)}
                                                        </ArkMenu.ItemText>
                                                    </ArkMenu.CheckboxItem>
                                                );
                                                if (!def?.columns)
                                                    return (
                                                        <Fragment key={def?.id ?? 'columns'}>
                                                            {hideable.map((column) => toggle(column, false))}
                                                        </Fragment>
                                                    );
                                                // A column group: shows or hides all its columns, moves as a whole
                                                return (
                                                    <Fragment key={`group:${def.id}`}>
                                                        <ArkMenu.CheckboxItem
                                                            value={`group:${def.id}`}
                                                            checked={hideable.every((column) => column.getIsVisible())}
                                                            disabled={!hideable.length}
                                                            onCheckedChange={(checked) =>
                                                                table.setColumnVisibility({
                                                                    ...columnVisibility,
                                                                    ...Object.fromEntries(
                                                                        hideable.map((column) => [column.id, checked])
                                                                    ),
                                                                })
                                                            }
                                                            closeOnSelect={false}
                                                            className={menuStyles.item()}
                                                        >
                                                            <ArkMenu.ItemIndicator>
                                                                <Check
                                                                    className={styles.menuCheck()}
                                                                    aria-hidden="true"
                                                                />
                                                            </ArkMenu.ItemIndicator>
                                                            <ArkMenu.ItemText className={menuStyles.label()}>
                                                                {def.header}
                                                            </ArkMenu.ItemText>
                                                        </ArkMenu.CheckboxItem>
                                                        {hideable.map((column) => toggle(column, true))}
                                                        {reorderableColumns &&
                                                            ([-1, 1] as const).map((direction) => (
                                                                <ArkMenu.Item
                                                                    key={direction}
                                                                    value={`group-${direction < 0 ? 'earlier' : 'later'}:${def.id}`}
                                                                    disabled={
                                                                        direction < 0
                                                                            ? blockIndex === 0
                                                                            : blockIndex === columnGroups!.length - 1
                                                                    }
                                                                    closeOnSelect={false}
                                                                    className={menuStyles.item({
                                                                        class: styles.columnGroupItem(),
                                                                    })}
                                                                    onSelect={() => moveColumnGroup(def.id, direction)}
                                                                >
                                                                    <ArkMenu.ItemText className={menuStyles.label()}>
                                                                        {direction < 0
                                                                            ? t.columnGroupEarlier(def.header)
                                                                            : t.columnGroupLater(def.header)}
                                                                    </ArkMenu.ItemText>
                                                                </ArkMenu.Item>
                                                            ))}
                                                    </Fragment>
                                                );
                                            })}
                                        </ArkMenu.Content>
                                    </ArkMenu.Positioner>
                                </Portal>
                            </ArkMenu.Root>
                        )}
                        {exportFilename &&
                            (exportItems.length > 1 ? (
                                <Menu
                                    items={exportItems}
                                    onSelect={(value) => {
                                        // "all"/"selection" (CSV only) or "<format>:all"/"<format>:selection"
                                        const [format, which] = value.includes(':')
                                            ? (value.split(':') as ['csv' | 'xlsx', string])
                                            : (['csv', value] as const);
                                        exportAs(format, which === 'selection');
                                    }}
                                >
                                    <Button variant="outline" size="sm" leadingIcon={Download}>
                                        {exportLabel}
                                    </Button>
                                </Menu>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    leadingIcon={Download}
                                    onClick={() => exportAs(formats[0]!, false)}
                                >
                                    {exportLabel}
                                </Button>
                            ))}
                        {fullscreenToggle && (
                            <IconButton
                                data-fullscreen-toggle=""
                                icon={fullscreen ? Minimize2 : Maximize2}
                                label={fullscreen ? t.exitFullscreen : t.fullscreen}
                                variant="outline"
                                size="sm"
                                onClick={toggleFullscreen}
                            />
                        )}
                    </div>
                </div>
            )}
            {advancedEditor && advancedOpen && (
                <div id={`${id}-advanced`} className={styles.advancedFilter()}>
                    {renderAdvancedFilter({
                        fields: advancedFields,
                        value: advancedTree,
                        onValueChange: setAdvancedTree,
                        label: translations.conditionBuilder.advanced,
                    })}
                </div>
            )}
            {find && findOpen && (
                <div className={styles.findBar()} role="search" aria-label={t.find}>
                    <Input
                        type="search"
                        size="sm"
                        data-find-input=""
                        leadingIcon={TextSearch}
                        className={styles.findInput()}
                        placeholder={t.searchPlaceholder}
                        aria-label={t.find}
                        value={findQuery}
                        onChange={(event) => onFindChange(event.target.value)}
                        onKeyDown={onFindKey}
                    />
                    <span className={styles.findCount()} aria-live="polite">
                        {findQuery.trim()
                            ? t.findMatches(
                                  matches.length ? Math.min(findIndex, matches.length - 1) + 1 : 0,
                                  matches.length
                              )
                            : ''}
                    </span>
                    <IconButton
                        icon={ChevronUp}
                        label={t.findPrevious}
                        variant="text"
                        size="sm"
                        disabled={!matches.length}
                        onClick={() => goToMatch(findIndex - 1)}
                    />
                    <IconButton
                        icon={ChevronDown}
                        label={t.findNext}
                        variant="text"
                        size="sm"
                        disabled={!matches.length}
                        onClick={() => goToMatch(findIndex + 1)}
                    />
                    <IconButton icon={X} label={t.findClose} variant="text" size="sm" onClick={toggleFind} />
                </div>
            )}
            {editMode === 'batch' && (
                <div className={styles.batchBar()}>
                    <span className={styles.batchCount()}>{t.changes(pendingCount)}</span>
                    <Button variant="text" size="sm" leadingIcon={Undo2} disabled={!history.canUndo} onClick={undo}>
                        {t.undo}
                    </Button>
                    <Button variant="text" size="sm" leadingIcon={Redo2} disabled={!history.canRedo} onClick={redo}>
                        {t.redo}
                    </Button>
                    <Button variant="outline" size="sm" disabled={!pendingCount} onClick={discardChanges}>
                        {t.discardChanges}
                    </Button>
                    <Button size="sm" disabled={!pendingCount} onClick={saveChanges}>
                        {t.saveChanges}
                    </Button>
                </div>
            )}
            <p role="status" className={styles.status()}>
                {statusText ||
                    (dataSource
                        ? sourceError
                            ? ''
                            : dataAnnouncement(sourceState, translations, locale)
                        : filtering
                          ? t.results(table.getFilteredRowModel().rows.length)
                          : '')}
            </p>
            {paged && paginatorPosition === 'top' && pager}
            <div
                ref={scrollElement}
                className={styles.scroll()}
                style={scrollHeight ? { maxHeight: scrollHeight } : undefined}
                onScroll={scrollHeight ? onScroll : undefined}
            >
                <table
                    ref={tableElement}
                    className={styles.table({ class: sized ? styles.fixedLayout() : undefined })}
                    style={sized ? { minWidth: table.getTotalSize() + leadingWidth + trailingWidth } : undefined}
                    aria-busy={busy || undefined}
                    aria-rowcount={virtualOn ? items.length + headerRows.length : undefined}
                    role={grid ? (treeGrid ? 'treegrid' : 'grid') : undefined}
                    aria-multiselectable={grid && ((selectable && multiple) || cellSelection) ? 'true' : undefined}
                    tabIndex={(cellSelection || editMode === 'batch') && !grid ? -1 : undefined}
                    onKeyDown={onTableKey}
                    onFocus={onGridFocus}
                >
                    <caption className={styles.caption()}>{caption}</caption>
                    <thead ref={head} className={styles.head()}>
                        {headerRows.map((cells, rowIndex) => (
                            <tr key={rowIndex} className={styles.headRow()}>
                                {rowIndex === 0 &&
                                    leading.map((utility) => (
                                        <th
                                            key={utility}
                                            scope="col"
                                            rowSpan={headerRows.length}
                                            className={styles.th({ class: utilityClass(utility, true) })}
                                            style={utilityStyle(utility)}
                                        >
                                            {utility === 'select' && multiple ? (
                                                <Checkbox
                                                    checked={allSelected}
                                                    aria-label={
                                                        selectAllLabel ??
                                                        (selectAllMode === 'all' ? t.selectAllRows : t.selectAll)
                                                    }
                                                    onCheckedChange={(checked) => onSelectAll(checked === true)}
                                                />
                                            ) : utility === 'select' ? (
                                                <span className={styles.srOnly()}>{t.select}</span>
                                            ) : utility === 'expand' ? (
                                                <button
                                                    type="button"
                                                    className={styles.expander()}
                                                    aria-label={allExpanded ? t.collapseAll : t.expandAll}
                                                    onClick={() => table.toggleAllRowsExpanded(!allExpanded)}
                                                >
                                                    {allExpanded ? (
                                                        <ChevronsDownUp
                                                            className={styles.expanderIcon()}
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <ChevronsUpDown
                                                            className={styles.expanderIcon()}
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                </button>
                                            ) : utility === 'number' ? (
                                                t.rowNumber
                                            ) : (
                                                <span className={styles.srOnly()}>{t.reorder}</span>
                                            )}
                                        </th>
                                    ))}
                                {cells.map((cell) => {
                                    const column = cell.header.column;
                                    const def = columnById.get(column.id);
                                    if (cell.group)
                                        return (
                                            <th
                                                key={cell.header.id}
                                                scope="colgroup"
                                                colSpan={cell.header.colSpan}
                                                rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                                                className={styles.th({ class: styles.groupTh() })}
                                            >
                                                {label(column)}
                                            </th>
                                        );
                                    const sorted = column.getIsSorted();
                                    const position = sortPosition(column.id);
                                    return (
                                        <th
                                            key={cell.header.id}
                                            id={spanning ? headerId(column.id) : undefined}
                                            scope="col"
                                            rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                                            className={styleFor(column.id).th({
                                                class: [
                                                    pinClass(column.id, true),
                                                    reorderableColumns ? styles.dropTargetColumn() : '',
                                                    columnById.get(column.id)?.headerClass,
                                                ],
                                            })}
                                            style={cellStyle(column.id, true)}
                                            aria-sort={ariaSort(column.id)}
                                            draggable={canMove(column.id) && !column.getIsPinned() ? 'true' : undefined}
                                            data-drop={columnDrop(column.id)}
                                            data-dragging={dragColumn === column.id || undefined}
                                            onDragStart={(event) => onColumnDragStart(column.id, event)}
                                            onDragOver={(event) => onColumnDragOver(column.id, event)}
                                            onDragLeave={() => setDropColumn(null)}
                                            onDrop={onColumnDrop}
                                            onDragEnd={onColumnDragEnd}
                                        >
                                            <div className={styleFor(column.id).headContent()}>
                                                {column.getCanSort() ? (
                                                    <button
                                                        type="button"
                                                        className={styles.sortButton()}
                                                        onClick={(event) =>
                                                            setSorting(
                                                                nextSorting(
                                                                    sorting,
                                                                    column.id,
                                                                    sortMode === 'multiple' && event.shiftKey
                                                                )
                                                            )
                                                        }
                                                    >
                                                        <span className={headLabelClass(column)}>{label(column)}</span>
                                                        {sorted === 'asc' ? (
                                                            <ArrowUp className={styles.sortIcon()} aria-hidden="true" />
                                                        ) : sorted === 'desc' ? (
                                                            <ArrowDown
                                                                className={styles.sortIcon()}
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <ArrowUpDown
                                                                className={styles.sortIcon()}
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                        {sorting.length > 1 && position > 0 && (
                                                            <>
                                                                <span className={styles.sortBadge()} aria-hidden="true">
                                                                    {position}
                                                                </span>
                                                                <span className={styles.srOnly()}>
                                                                    {t.sortPriority(position, sorted === 'desc')}
                                                                </span>
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className={headLabelClass(column)}>{label(column)}</span>
                                                )}
                                                {menuFilters && def && filterable(def) && (
                                                    <FilterMenu
                                                        header={label(column)}
                                                        type={def.filter ?? 'text'}
                                                        value={filterValue(column.id)}
                                                        onChange={(next) => setFilter(column.id, next)}
                                                        options={filterOptions(def)}
                                                        inputProps={def.filterInputProps}
                                                        renderOption={def.renderOption}
                                                        matchModes={def.matchModes}
                                                        maxConstraints={maxConstraints}
                                                        renderValue={
                                                            def.renderFilter
                                                                ? (input) =>
                                                                      def.renderFilter!({ ...input, column: def })
                                                                : undefined
                                                        }
                                                    />
                                                )}
                                                {showColumnMenu && (
                                                    <Menu
                                                        items={columnMenuItems(column)}
                                                        onSelect={(value) => onColumnMenu(column, value)}
                                                    >
                                                        <button
                                                            type="button"
                                                            className={styles.headButton()}
                                                            data-column-menu={column.id}
                                                            aria-label={t.columnMenu(label(column))}
                                                        >
                                                            <EllipsisVertical
                                                                className={styles.headButtonIcon()}
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                    </Menu>
                                                )}
                                            </div>
                                            {resizable && (
                                                <div
                                                    role="separator"
                                                    aria-orientation="vertical"
                                                    aria-label={t.resize(label(column))}
                                                    aria-valuenow={column.getSize()}
                                                    aria-valuemin={MIN_WIDTH}
                                                    aria-valuemax={1200}
                                                    tabIndex={0}
                                                    className={styles.resizer()}
                                                    data-resizing={column.getIsResizing() || undefined}
                                                    onMouseDown={cell.header.getResizeHandler()}
                                                    onTouchStart={cell.header.getResizeHandler()}
                                                    onKeyDown={(event) => onResizeKey(column.id, event)}
                                                    onDoubleClick={(event) => autoSize(column.id, event)}
                                                />
                                            )}
                                        </th>
                                    );
                                })}
                                {rowIndex === 0 && trailing.length > 0 && (
                                    <th
                                        scope="col"
                                        rowSpan={headerRows.length}
                                        className={styles.th({ class: utilityClass('actions', true) })}
                                        style={utilityStyle('actions')}
                                    >
                                        <span className={styles.srOnly()}>{t.actions}</span>
                                    </th>
                                )}
                            </tr>
                        ))}
                        {hasRowFilters && (
                            <tr className={styles.filterRow()}>
                                {leading.map((utility) => (
                                    <td
                                        key={utility}
                                        className={utilityClass(utility, true)}
                                        style={utilityStyle(utility)}
                                    />
                                ))}
                                {leafColumns.map((column) => {
                                    const def = columnById.get(column.id);
                                    return (
                                        <td
                                            key={column.id}
                                            className={styleFor(column.id).filterCell({
                                                class: pinClass(column.id, true),
                                            })}
                                            style={cellStyle(column.id, true)}
                                        >
                                            {def && filterable(def) ? (
                                                def.renderFilter ? (
                                                    def.renderFilter({
                                                        value: rowFilterValue(def),
                                                        setValue: (next) => setRowFilter(def, next),
                                                        column: def,
                                                    })
                                                ) : isRangeMatchMode(rowMode(def)) ? (
                                                    <div className={styles.filterRowRange()}>
                                                        {([0, 1] as const).map((part) => (
                                                            <ValueInput
                                                                key={part}
                                                                type={rowInput(def)}
                                                                label={`${t.filter(label(column))}, ${part ? t.to : t.from}`}
                                                                options={filterOptions(def)}
                                                                inputProps={def.filterInputProps}
                                                                value={rangePart(def, part)}
                                                                onChange={(next) => setRowRange(def, part, next)}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <ValueInput
                                                        type={rowInput(def)}
                                                        label={t.filter(label(column))}
                                                        options={filterOptions(def)}
                                                        inputProps={def.filterInputProps}
                                                        renderOption={def.renderOption}
                                                        any
                                                        value={rowFilterValue(def)}
                                                        onChange={(next) => setRowFilter(def, next)}
                                                    />
                                                )
                                            ) : null}
                                        </td>
                                    );
                                })}
                                {trailing.length > 0 && (
                                    <td className={utilityClass('actions', true)} style={utilityStyle('actions')} />
                                )}
                            </tr>
                        )}
                    </thead>
                    {frozen.length > 0 && (
                        <tbody className={styles.frozenBody()} style={scrollHeight ? { top: headHeight } : undefined}>
                            {frozen.map((row) => (
                                <tr
                                    key={row.id}
                                    className={styles.row({ class: rowClass?.(row.original) })}
                                    data-state={isSelected(row) ? 'selected' : undefined}
                                    aria-selected={grid && selectable ? isSelected(row) : undefined}
                                    data-row-id={row.id}
                                >
                                    {leading.map((utility) => (
                                        <td
                                            key={utility}
                                            className={styles.td({ class: utilityClass(utility, false) })}
                                            style={utilityStyle(utility)}
                                        />
                                    ))}
                                    {row.getVisibleCells().map((cell) => {
                                        const def = columnById.get(cell.column.id);
                                        return (
                                            <td
                                                key={cell.id}
                                                className={styleFor(cell.column.id).td({
                                                    class: [
                                                        pinClass(cell.column.id, false),
                                                        cellClassOf(cell.column.id, row),
                                                    ],
                                                })}
                                                style={cellStyle(cell.column.id, false)}
                                            >
                                                {/* Editable like the other rows: editor, edit button */}
                                                {def?.editable && (cellEditing || editingRow === row.id) ? (
                                                    cellContent(row, cell.column, shownValue(row, cell.column.id))
                                                ) : def?.copyable ? (
                                                    <span className={styles.copyCell()}>
                                                        {def.cell
                                                            ? def.cell(row.original, cell.getValue())
                                                            : display(def, cell.getValue(), row.original)}
                                                        <CopyButton
                                                            value={display(def, cell.getValue(), row.original)}
                                                            label={t.copy(
                                                                label(cell.column),
                                                                display(def, cell.getValue(), row.original)
                                                            )}
                                                        />
                                                    </span>
                                                ) : def?.cell ? (
                                                    def.cell(row.original, cell.getValue())
                                                ) : (
                                                    display(def, cell.getValue(), row.original)
                                                )}
                                            </td>
                                        );
                                    })}
                                    {trailing.length > 0 && (
                                        <td
                                            className={styles.td({ class: utilityClass('actions', false) })}
                                            style={utilityStyle('actions')}
                                        >
                                            {editMode === 'row' && editable && (
                                                <div className={styles.editActions()}>
                                                    {rowEditButtons(row, labelFor(row.original, row.index))}
                                                </div>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    )}
                    {contextMenu && rowActions ? (
                        <ContextMenu
                            items={contextRow ? actionsFor(contextRow) : []}
                            label={
                                contextRow ? t.rowActions(labelFor(contextRow.original, contextRow.index)) : undefined
                            }
                            onSelect={(value) => runRowAction(contextRow, value)}
                        >
                            {body}
                        </ContextMenu>
                    ) : (
                        body
                    )}
                    {hasFooter && (
                        <tfoot className={styles.foot()}>
                            <tr>
                                {leading.map((utility) => (
                                    <td
                                        key={utility}
                                        className={styles.footCell({ class: utilityClass(utility, false) })}
                                        style={utilityStyle(utility)}
                                    />
                                ))}
                                {leafColumns.map((column) => (
                                    <td
                                        key={column.id}
                                        className={styleFor(column.id).footCell({
                                            class: [pinClass(column.id, false), cellClassOf(column.id)],
                                        })}
                                        style={cellStyle(column.id, false)}
                                    >
                                        {footerText(columnById.get(column.id)!)}
                                    </td>
                                ))}
                                {trailing.length > 0 && (
                                    <td
                                        className={styles.footCell({ class: utilityClass('actions', false) })}
                                        style={utilityStyle('actions')}
                                    />
                                )}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
            {statusBar && (
                <div className={styles.statusBar()}>
                    <span>{t.rowCount(allRowCount)}</span>
                    {filtering && <span>{t.filteredCount(table.getFilteredRowModel().rows.length)}</span>}
                    {selectable && <span>{translations.common.selectedCount(selectedCount)}</span>}
                    {statusTotals.map((total) => (
                        <span key={total.id}>{total.text}</span>
                    ))}
                </div>
            )}
            {paged && paginatorPosition === 'bottom' && pager}
        </div>
    );

    return (
        <FeatureContext.Provider value={feature}>
            {fullscreen ? createPortal(content, document.body) : <Fragment>{content}</Fragment>}
        </FeatureContext.Provider>
    );
}
