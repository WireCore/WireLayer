<script setup lang="ts" generic="TData extends object">
import { Menu } from '@ark-ui/vue/menu';
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
} from '@lucide/vue';
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
} from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import {
    aggregateValues,
    applyPending,
    changesByRow,
    conditionFieldsFromColumns,
    csvSeparator,
    emptyConditionGroup,
    isActiveCondition,
    matchesCondition,
    type ConditionField,
    type ConditionGroup,
    autoRowSpans,
    type CellChange,
    type CellRange,
    clearTableState,
    collectErrors,
    createDataController,
    createXlsx,
    dataAnnouncement,
    type DataController,
    type DataSource,
    type DataState,
    dataTable as dataTableRecipe,
    type DataTableFilterValue,
    dataTableMatchModes,
    type DataTableSort,
    type DataTableState,
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
    matchesSearch,
    matchModeDefinition,
    menu as menuRecipe,
    moveColumnBlock,
    nextSorting,
    numberSummary,
    parseCellText,
    parseTsv,
    pasteTargets,
    type PendingChanges,
    pendingValue,
    pivotTable,
    pivotView,
    type PrintCell,
    printHtml,
    printTableHtml,
    queryKey,
    rangeAround,
    rangeBounds,
    type RecipeClasses,
    rowColumnSpans,
    rowsToDataSource,
    sameCellValue,
    saveTableState,
    syncGrid,
    treeGridKeyAction,
    toCsv,
    toTsv,
    treeDropMove,
    treeKeyboardMove,
    type TreeMove,
    type XlsxRow,
    type XlsxValue,
    warnInDevelopment,
} from '@wirecore/wirelayer-recipes';
import {
    computed,
    h,
    nextTick,
    normalizeClass,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    ref,
    shallowRef,
    useAttrs,
    useId,
    useSlots,
    useTemplateRef,
    watch,
    type FunctionalComponent,
} from 'vue';
import Button from '../components/Button/Button.vue';
import Checkbox from '../components/Checkbox/Checkbox.vue';
import ContextMenu from '../components/ContextMenu/ContextMenu.vue';
import CopyButton from '../components/CopyButton/CopyButton.vue';
import Highlight from '../components/Highlight/Highlight.vue';
import IconButton from '../components/IconButton/IconButton.vue';
import Input from '../components/Input/Input.vue';
import MenuComponent from '../components/Menu/Menu.vue';
import type { MenuEntry } from '../components/Menu/types.js';
import Pagination from '../components/Pagination/Pagination.vue';
import Select from '../components/Select/Select.vue';
import Skeleton from '../components/Skeleton/Skeleton.vue';
import Spinner from '../components/Spinner/Spinner.vue';
import { useLocale, useTranslations } from '../locale.js';
import { features } from './features.js';
import FilterMenu from './FilterMenu.vue';
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
    DataTableFilterInputProps,
    DataTablePivot,
    DataTablePrintOptions,
    DataTableRowAction,
    DataTableRowClick,
    DataTableRowEdit,
    DataTableRowReorder,
    DataTableXlsxOptions,
} from './types.js';
import ValueInput from './ValueInput.vue';
import { useRecipe } from '../recipes.js';

export interface DataTableProps<T> {
    /** The rows (with `dataSource` the table loads them itself) */
    data?: T[];
    /**
     * Rows from a server instead of `data` and `manual`: the table asks `getRows` (page, sorting, filters, search,
     * grouping, abort signal) whenever they change, cancels outdated requests, goes back to page 1 when filters,
     * sorting or the search change, shows errors with "Try again" – `refresh()` asks again
     */
    dataSource?: DataTableDataSource<T>;
    /** How long answers of `dataSource` are reused for the same query, in ms (default 0: always ask) */
    cacheTime?: number;
    /** Pause after typing in the search before `dataSource` is asked, in ms (default 300) */
    searchDebounce?: number;
    /**
     * Cross table of `data`: rows grouped by the values of `rows`, a column per value combination of `columns`, the
     * `values` aggregated in the cells, totals per row and column (ids are column ids of `columns`)
     */
    pivot?: DataTablePivot;
    columns: DataTableColumn<T>[];
    /** Accessible name of the table (visually hidden caption) */
    caption: string;
    getRowId?: (row: T, index: number) => string;
    /** Rows per page – enables pagination (v-model:page-size with `pageSizeOptions`) */
    pageSize?: number;
    /** Choices for the rows per page, shown next to the pagination */
    pageSizeOptions?: number[];
    /** Current page (1-based) – use with v-model:page */
    page?: number;
    /** Index of the first row of the current page (0-based) – instead of `page`, use with v-model:first */
    first?: number;
    /** Pagination below (default) or above the table */
    paginatorPosition?: 'top' | 'bottom';
    /** Current sorting – use with v-model:sorting; an array in the multiple mode */
    sorting?: DataTableSort | DataTableSort[] | null;
    /** Sorting at the start, without v-model */
    defaultSorting?: DataTableSort | DataTableSort[] | null;
    /** `multiple`: Shift+click (or the column menu) sorts by further columns */
    sortMode?: 'single' | 'multiple';
    /** Server mode: `data` is the current page, already sorted and filtered; requires `rowCount` */
    manual?: boolean;
    rowCount?: number;
    /** Selection column – selected row ids via v-model:selection */
    selectable?: boolean;
    /** `multiple` (checkboxes, default) or `single` (radio buttons) */
    selectionMode?: 'multiple' | 'single';
    selection?: string[];
    /** A click on the row (not on its controls) selects it; Shift+click selects a range */
    selectOnRowClick?: boolean;
    /** Rows that cannot be selected get a disabled checkbox */
    isRowSelectable?: (row: T) => boolean;
    /**
     * `all` with `manual`: "select all" means every row on every page – v-model:all-selection then holds
     * `{ mode: 'all', except }` (the rows unchecked since); without `manual` all rows of `data` are selected
     */
    selectAllMode?: 'page' | 'all';
    /** "Select all" across the pages of a server table (`selectAllMode="all"`) – use with v-model:all-selection */
    allSelection?: DataTableAllSelection | null;
    /** Names a row for its controls ("Select <label>") */
    rowLabel?: (row: T, index: number) => string;
    loading?: boolean;
    /** While loading: the table fades (`overlay`, default) or shows placeholder rows (`skeleton`) */
    loadingVariant?: 'overlay' | 'skeleton';
    emptyText?: string;
    /** Shown when the filters or the search leave no row (default: `emptyText`) */
    noResultsText?: string;
    loadingText?: string;
    selectAllLabel?: string;
    /** TreeTable: child rows of a row – they appear indented below it and can be expanded */
    getSubRows?: (row: T) => T[] | undefined;
    /** TreeTable filters: `strict` (default) – a row must match itself; `lenient` – a match in a child keeps its parents */
    treeFilterMode?: 'lenient' | 'strict';
    /** Expanded rows (ids) – use with v-model:expanded; also the rows with open details (#expansion) */
    expanded?: string[];
    defaultExpanded?: string[];
    /** Names the expand button of a row */
    expandLabel?: (row: T, index: number) => string;
    /**
     * Advanced filter: the rows pass a condition tree (nested and/or rules; v-model:advanced-filter-value). `true`
     * offers every column with a filter type; or pass the fields. A toolbar button opens the editor from the
     * `#advancedFilter` slot above the table – usually `ConditionBuilder` from `@wirecore/wirelayer-blocks-vue`; without it
     * there is no button (the tree still filters). A server filters instead: `dataSource` gets the tree as
     * `condition`, with `manual` the parent applies it
     */
    advancedFilter?: boolean | ConditionField[];
    advancedFilterValue?: ConditionGroup;
    /** Search field above the table: filters over all columns (v-model:global-filter) */
    search?: boolean;
    globalFilter?: string;
    /** Marks the search hits in the cells */
    highlightSearch?: boolean;
    /** Column filters by column id – use with v-model:filters */
    filters?: Record<string, DataTableFilterValue>;
    /** Filters in a row below the headers, as a menu per column with match modes and conditions, or none */
    filterDisplay?: 'row' | 'menu' | 'none';
    /** Shows the filter row or menus – use with v-model:show-filters (`filterToggle`); the filters keep working */
    showFilters?: boolean;
    /** Button in the toolbar that shows and hides the filters */
    filterToggle?: boolean;
    /** Conditions per column in the filter menu */
    maxConstraints?: number;
    /** Column widths can be changed by dragging the header edge or with the arrow keys */
    resizable?: boolean;
    /** Menu above the table to show and hide columns (v-model:hidden-columns) */
    columnToggle?: boolean;
    hiddenColumns?: string[];
    /** Menu per column header: sort, pin, move, hide, group */
    columnMenu?: boolean;
    /** Columns can be moved by drag and drop or the column menu (v-model:column-order) */
    reorderableColumns?: boolean;
    columnOrder?: string[];
    /** Pinned columns – use with v-model:pinned-columns (default: `pinned` of the columns) */
    pinnedColumns?: { start: string[]; end: string[] };
    /** Shows an export button; the CSV has the filtered and sorted rows of all pages (or the selection) */
    exportFilename?: string;
    /** Separator of the CSV export, also of the export button – default: from the locale (";" where numbers have a
     * decimal comma, e.g. de-DE, as a spreadsheet there expects it; "," otherwise) */
    csvSeparator?: string;
    /** Formats of the export button: CSV (default), Excel (.xlsx) or both */
    exportFormats?: ('csv' | 'xlsx')[];
    /** Groups the rows by the values of these columns (expandable group rows) – v-model:group-by */
    groupBy?: string | string[];
    /** Rows (ids) that stay at the top, also while scrolling and paging */
    frozenRows?: string[];
    /** Rows can be moved with the drag handle (mouse or arrow keys) – reported via row-reorder */
    reorderableRows?: boolean;
    /** Column with the row number */
    rowNumbers?: boolean;
    /** Menu per row (last column) – reported via row-action */
    rowActions?: MenuEntry[] | ((row: T) => MenuEntry[]);
    /** The row actions also open on right click (and Shift+F10) */
    contextMenu?: boolean;
    /** Extra classes of a row */
    rowClass?: (row: T) => string | undefined;
    /**
     * Rows as links: the first cell holds a real link (Ctrl+click and middle click open a new tab), a click anywhere
     * on the row follows it – `row-click` can take over the navigation (router)
     */
    rowHref?: (row: T) => string | undefined;
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
    /** Button "Find in table": finds text in the cells, match x of y, previous/next, marks the matches */
    find?: boolean;
    /** Long header texts wrap instead of being shortened */
    wrapHeaders?: boolean;
    /** Header texts read from bottom to top (narrow columns) */
    verticalHeaders?: boolean;
    /**
     * `cell`: one cell at a time (Tab moves on); `row`: a whole row with save and cancel; `batch`: like `cell`, but
     * the changes are collected (marked) until "Save" (`save`) or "Discard", with undo and redo
     */
    editMode?: 'cell' | 'row' | 'batch';
    /** Row height – use with v-model:size (`densityToggle`) */
    size?: 'sm' | 'md' | 'lg';
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
    /** Only the visible rows are rendered (requires `scrollHeight`) */
    virtual?: boolean;
    /** Estimated row height in px for `virtual` */
    rowHeight?: number;
    /** Keeps sorting, filters, page, widths, order and the other settings in the browser under this key */
    stateKey?: string;
    stateStorage?: 'local' | 'session';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dataTableRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const localeContext = useLocale();
const props = withDefaults(defineProps<DataTableProps<TData>>(), {
    data: undefined,
    dataSource: undefined,
    pivot: undefined,
    exportFormats: undefined,
    cacheTime: 0,
    searchDebounce: 300,
    sorting: undefined,
    defaultSorting: undefined,
    first: undefined,
    selection: undefined,
    allSelection: undefined,
    showFilters: undefined,
    rowHref: undefined,
    isRowSelectable: undefined,
    getSubRows: undefined,
    expanded: undefined,
    defaultExpanded: undefined,
    expandLabel: undefined,
    globalFilter: undefined,
    filters: undefined,
    hiddenColumns: undefined,
    columnOrder: undefined,
    pinnedColumns: undefined,
    exportFilename: undefined,
    csvSeparator: undefined,
    groupBy: undefined,
    frozenRows: undefined,
    rowActions: undefined,
    rowClass: undefined,
    size: undefined,
    sortMode: 'single',
    selectionMode: 'multiple',
    filterDisplay: 'row',
    maxConstraints: 2,
    paginatorPosition: 'bottom',
    editMode: 'cell',
    rowHeight: 41,
    stateStorage: 'session',
    selectAllMode: 'page',
    loadingVariant: 'overlay',
    navigation: 'tab',
});
const dataTable = useRecipe('dataTable', dataTableRecipe, () => props.classes);
const menu = useRecipe('menu', menuRecipe);
const emit = defineEmits<{
    'update:page': [page: number];
    'update:first': [first: number];
    'update:showFilters': [show: boolean];
    'update:allSelection': [selection: DataTableAllSelection | null];
    /** The selected rows as objects (with `selection`; rows of other pages are remembered) */
    selectedRowsChange: [rows: TData[]];
    /** A click on a row (not on its controls) – with `rowHref`, `event.preventDefault()` stops the navigation */
    rowClick: [click: DataTableRowClick<TData>];
    'update:pageSize': [pageSize: number];
    'update:sorting': [sorting: DataTableSort | DataTableSort[] | null];
    'update:selection': [selection: string[]];
    'update:expanded': [expanded: string[]];
    'update:globalFilter': [value: string];
    'update:advancedFilterValue': [value: ConditionGroup];
    'update:filters': [filters: Record<string, DataTableFilterValue>];
    'update:hiddenColumns': [ids: string[]];
    'update:columnOrder': [ids: string[]];
    'update:pinnedColumns': [pinned: { start: string[]; end: string[] }];
    'update:groupBy': [ids: string[]];
    'update:size': [size: 'sm' | 'md' | 'lg'];
    cellEdit: [edit: DataTableCellEdit<TData>];
    rowEdit: [edit: DataTableRowEdit<TData>];
    rowReorder: [move: DataTableRowReorder<TData>];
    rowAction: [action: DataTableRowAction<TData>];
    /** Scrolled near the end (`scrollHeight`) – load more rows (infinite scrolling) */
    loadMore: [];
    /** @deprecated Same as `loadMore` (the name of the other lists) */
    scrollEnd: [];
    /** The selected range of cells changed (`cellSelection`; null: none) */
    cellSelectionChange: [selection: DataTableCellSelection<TData> | null];
    /** Cells were pasted – call `preventDefault()` to keep them out of the table (cell-edit events follow otherwise) */
    cellPaste: [paste: DataTableCellPaste<TData>];
    /** "Save" in the batch mode (`editMode="batch"`): the collected changes */
    save: [save: DataTableBatchSave<TData>];
}>();
defineSlots<
    {
        /** Content of a cell, by column id */
        [cell: `cell-${string}`]: (props: { row: TData; value: unknown }) => unknown;
    } & {
        /** Own filter input of a column (filter row and filter menu), by column id */
        [filter: `filter-${string}`]: (props: DataTableFilterInputProps<TData>) => unknown;
    } & {
        /** Own editor of a column, by column id */
        [editor: `editor-${string}`]: (props: DataTableEditorProps<TData>) => unknown;
    } & {
        /** Details below an expanded row – adds the expand column */
        expansion?: (props: { row: TData; rowId: string }) => unknown;
        /**
         * The editor of the advanced filter, e.g. ConditionBuilder from `@wirecore/wirelayer-blocks-vue`:
         * `<template #advancedFilter="{ fields, value, setValue, label }">`
         */
        advancedFilter?: (props: DataTableAdvancedFilterProps) => unknown;
        /** Own controls in the toolbar, after the search */
        toolbar?: () => unknown;
        /** Own controls at the start of the toolbar, before the search */
        toolbarStart?: () => unknown;
        /** Own controls at the end of the toolbar, before the built-in buttons */
        toolbarEnd?: () => unknown;
        /** Shown when there are no rows */
        empty?: () => unknown;
        /** Shown when the filters or the search leave no row (default: `empty`) */
        noResults?: () => unknown;
        /** Shown while loading without rows (default: spinner and "Loading") */
        loadingContent?: () => unknown;
    }
>();
const attrs = useAttrs();
const slots = useSlots();
const id = useId();
const t = translations.dataTable;

type Features = typeof features;
type TableRow = Row<Features, TData>;
type TableColumn = Column<Features, TData, unknown>;
type Density = 'sm' | 'md' | 'lg';

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
const MIN_WIDTH = 60;
const RESIZE_STEP = 16;
/** Widths of the utility columns when columns have fixed widths */
const UTILITY_WIDTH = { drag: 40, select: 48, expand: 40, number: 56, actions: 88 } as const;
type Utility = keyof typeof UTILITY_WIDTH;
const NO_ROWS: never[] = [];
/** A row source (`getRows`) or a general data source (`getItems`) as a data source */
const toDataSource = <T,>(source: DataTableDataSource<T>): DataSource<T> =>
    'getRows' in source ? rowsToDataSource(source.getRows) : source;
/** Where typing, pasting and undoing belong to the control itself, not to the table */
const TEXT_CONTROLS = 'input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-editor]';

// Rows from a data source: the controller asks, cancels outdated requests and caches; the table shows its state
const sourceState = shallowRef<DataState<TData>>({ status: 'idle', items: [] });
let controller: DataController<TData> | null = null;
const sourceController = () => {
    if (!props.dataSource) return null;
    controller ??= createDataController<TData>({
        source: { getItems: (request) => toDataSource(props.dataSource!).getItems(request) },
        onChange: (state) => (sourceState.value = state),
    });
    controller.configure({ ttl: props.cacheTime, debounce: props.searchDebounce });
    return controller;
};
onBeforeUnmount(() => controller?.dispose());

// Pivot: the cross table of `data` becomes the rows and columns of the table
const pivotModel = computed(() => {
    const pivot = props.pivot;
    if (!pivot) return null;
    const byId = new Map<string, DataTableColumn<TData>>();
    const walk = (list: DataTableColumn<TData>[]) =>
        list.forEach((column) => (column.columns ? walk(column.columns) : byId.set(column.id, column)));
    walk(props.columns);
    const columnValue = (row: TData, columnId: string) => {
        const column = byId.get(columnId);
        return column ? rawValue(column, row) : (row as Record<string, unknown>)[columnId];
    };
    const numbers = new Intl.NumberFormat(localeContext.value.locale, { maximumFractionDigits: 2 });
    return pivotView(
        pivotTable(props.data ?? NO_ROWS, pivot, columnValue, (row, columnId, value) => {
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
});
// Advanced filter: the condition tree filters `data` before the table sees it
const advancedTree = ref<ConditionGroup>(props.advancedFilterValue ?? emptyConditionGroup('and', 'root'));
watch(
    () => props.advancedFilterValue,
    (value) => value && (advancedTree.value = value)
);
const advancedOpen = ref(false);
const advancedFields = computed(() =>
    Array.isArray(props.advancedFilter)
        ? props.advancedFilter
        : props.advancedFilter
          ? conditionFieldsFromColumns(props.columns, props.data ?? NO_ROWS)
          : []
);
const advancedActive = computed(
    () => !!props.advancedFilter && isActiveCondition(advancedTree.value, advancedFields.value)
);
function setAdvancedTree(tree: ConditionGroup) {
    advancedTree.value = tree;
    emit('update:advancedFilterValue', tree);
}
// The editor comes from outside (ConditionBuilder lives in @wirecore/wirelayer-blocks-vue) – without one, no button
const advancedEditor = computed(() => !!props.advancedFilter && !!slots.advancedFilter);
onMounted(() => {
    if (props.advancedFilter && !slots.advancedFilter)
        warnInDevelopment(
            'DataTable: `advancedFilter` has no editor, so the toolbar button is hidden – fill the `#advancedFilter` ' +
                'slot with ConditionBuilder from @wirecore/wirelayer-blocks-vue'
        );
});
/** The rows shown: of the pivot, of the data source or `data` (after the advanced filter) */
const tableData = computed(
    () =>
        (pivotModel.value
            ? pivotModel.value.rows
            : props.dataSource
              ? sourceState.value.items
              : advancedActive.value && !props.manual
                ? (props.data ?? NO_ROWS).filter((row) =>
                      matchesCondition(row, advancedTree.value, advancedFields.value, localeContext.value.locale)
                  )
                : (props.data ?? NO_ROWS)) as TData[]
);
const columnDefs = computed(
    () => (pivotModel.value ? pivotModel.value.columns : props.columns) as DataTableColumn<TData>[]
);
/** Server mode: `manual` or a data source – sorting, filters and pages come from the server */
const serverMode = computed(() => !!props.manual || !!props.dataSource);
const serverRowCount = computed(() =>
    props.dataSource ? (sourceState.value.totalCount ?? sourceState.value.items.length) : props.rowCount
);
const sourceError = computed(() => !!props.dataSource && sourceState.value.status === 'error');
const busy = computed(() => !!props.loading || (!!props.dataSource && sourceState.value.status === 'loading'));

// Leaf columns (columns inside groups) by id
const leafDefs = computed(() => {
    const flatten = (columns: DataTableColumn<TData>[]): DataTableColumn<TData>[] =>
        columns.flatMap((column) => (column.columns ? flatten(column.columns) : [column]));
    return flatten(columnDefs.value);
});
const columnById = computed(() => {
    const map = new Map<string, DataTableColumn<TData>>();
    const walk = (columns: DataTableColumn<TData>[]) =>
        columns.forEach((column) => {
            map.set(column.id, column);
            if (column.columns) walk(column.columns);
        });
    walk(columnDefs.value);
    return map;
});
const rawValue = (column: DataTableColumn<TData>, row: TData) =>
    typeof column.accessor === 'function' ? column.accessor(row) : row[(column.accessor ?? column.id) as keyof TData];
/** Text of a value as shown, exported and searched */
const display = (column: DataTableColumn<TData> | undefined, value: unknown, row: TData) =>
    column?.format ? column.format(value, row) : text(value);
/** Choices with values of their own (objects, numbers): select filters compare the cell value, not the text */
const byValue = (column: DataTableColumn<TData>) =>
    (column.filterOptions ?? []).some((option) => typeof option !== 'string');
// Text filters compare the shown text, numbers and dates the value
const textFilter = (column: DataTableColumn<TData>) =>
    !column.filter || column.filter === 'text' || column.filter === 'select' || column.filter === 'multiSelect';

// Controlled when the prop is set, internal otherwise
const sorting = ref<SortingState>(toSorting(props.sorting !== undefined ? props.sorting : props.defaultSorting));
watch(
    () => props.sorting,
    (value) => value !== undefined && (sorting.value = toSorting(value))
);
/** Page from `first` (row offset) or `page` */
const pageIndexOf = (page: number | undefined, first: number | undefined, size: number) =>
    first !== undefined ? Math.floor(first / size) : page ? page - 1 : undefined;
const pagination = ref<PaginationState>({
    pageIndex: pageIndexOf(props.page, props.first, props.pageSize ?? 10) ?? 0,
    pageSize: props.pageSize ?? 10,
});
watch(
    () => [props.page, props.pageSize, props.first] as const,
    ([page, pageSize, first]) => {
        const size = pageSize ?? pagination.value.pageSize;
        pagination.value = { pageIndex: pageIndexOf(page, first, size) ?? pagination.value.pageIndex, pageSize: size };
    }
);
const rowSelection = ref<RowSelectionState>(toSelection(props.selection ?? []));
watch(
    () => props.selection,
    (ids) => ids && (rowSelection.value = toSelection(ids))
);
// "Select all" across the pages of a server table
const allSelection = ref<DataTableAllSelection | null>(props.allSelection ?? null);
watch(
    () => props.allSelection,
    (value) => value !== undefined && (allSelection.value = value)
);
const showFilters = ref(props.showFilters ?? true);
watch(
    () => props.showFilters,
    (value) => value !== undefined && (showFilters.value = value)
);
const grouping = ref<string[]>(toArray(props.groupBy));
watch(
    () => props.groupBy,
    (value) => (grouping.value = toArray(value))
);
// Groups start open – unless rows have details (they share the expanded state)
const expanded = ref<ExpandedState>(
    props.expanded || props.defaultExpanded
        ? toIds(props.expanded ?? props.defaultExpanded!)
        : grouping.value.length && !slots.expansion
          ? true
          : {}
);
watch(
    () => props.expanded,
    (ids) => ids && (expanded.value = toIds(ids))
);
const globalFilter = ref(props.globalFilter ?? '');
watch(
    () => props.globalFilter,
    (value) => value !== undefined && (globalFilter.value = value)
);
const columnFilters = ref<ColumnFiltersState>(fromFilters(props.filters ?? {}));
watch(
    () => props.filters,
    (value) => value && (columnFilters.value = fromFilters(value))
);
const columnVisibility = ref<ColumnVisibilityState>(toIds(props.hiddenColumns ?? [], false));
watch(
    () => props.hiddenColumns,
    (ids) => ids && (columnVisibility.value = toIds(ids, false))
);
const columnOrder = ref<ColumnOrderState>(props.columnOrder ?? []);
watch(
    () => props.columnOrder,
    (ids) => ids && (columnOrder.value = ids)
);
const pinnedFromColumns = () => ({
    start: leafDefs.value.filter((column) => column.pinned === 'start').map((column) => column.id),
    end: leafDefs.value.filter((column) => column.pinned === 'end').map((column) => column.id),
});
const columnPinning = ref<ColumnPinningState>(props.pinnedColumns ?? pinnedFromColumns());
watch(
    () => props.pinnedColumns,
    (value) => value && (columnPinning.value = value)
);
const columnSizing = ref<ColumnSizingState>({});
const density = ref<Density>(props.size ?? 'md');
watch(
    () => props.size,
    (value) => value && (density.value = value)
);
// Own computed: a new object on every render would count as a change for TanStack
const rowPinning = computed(() => ({ top: props.frozenRows ?? [], bottom: [] }));

const labelFor = (row: TData, index: number) => props.rowLabel?.(row, index) ?? t.row(index);
const expandLabelFor = (row: TData, index: number) =>
    props.expandLabel?.(row, index) ?? t.subRows(labelFor(row, index));

function toDef(column: DataTableColumn<TData>): ColumnDef<Features, TData> {
    if (column.columns) return { id: column.id, header: column.header, columns: column.columns.map(toDef) };
    return {
        id: column.id,
        header: column.header,
        accessorFn: (row: TData) => rawValue(column, row),
        enableSorting: !!column.sortable,
        // Always ascending first – TanStack would start numeric columns descending
        sortDescFirst: false,
        sortUndefined: 'last',
        ...(column.sortFn ? { sortFn: (a: TableRow, b: TableRow) => column.sortFn!(a.original, b.original) } : {}),
        filterFn: (row: TableRow, columnId: string, value: DataTableFilterValue) =>
            matchesColumnFilter(
                {
                    value: row.getValue(columnId),
                    text: textFilter(column) ? display(column, row.getValue(columnId), row.original) : '',
                    row: row.original,
                    type: column.filter,
                    locale: localeContext.value.locale,
                    filterFn: column.filterFn as ((...args: unknown[]) => boolean) | undefined,
                    byValue: byValue(column),
                },
                value
            ),
        enableGlobalFilter: column.searchable !== false,
        enableHiding: column.hideable !== false,
        enableGrouping: true,
        ...(column.width ? { size: column.width } : {}),
        minSize: MIN_WIDTH,
    };
}
const tableColumns = computed(() => columnDefs.value.map(toDef));

const table = useTable({
    features,
    columns: tableColumns,
    data: tableData,
    getRowId: (row: TData, index: number) =>
        pivotModel.value ? (row as { id: string }).id : (props.getRowId?.(row, index) ?? String(index)),
    state: computed(() => ({
        sorting: sorting.value,
        pagination: pagination.value,
        rowSelection: rowSelection.value,
        expanded: expanded.value,
        globalFilter: globalFilter.value,
        columnFilters: columnFilters.value,
        columnVisibility: columnVisibility.value,
        columnOrder: columnOrder.value,
        columnPinning: columnPinning.value,
        columnSizing: columnSizing.value,
        grouping: grouping.value,
        rowPinning: rowPinning.value,
    })),
    getSubRows: props.getSubRows,
    // Lenient tree filter: a match in a child keeps its parents
    filterFromLeafRows: computed(() => props.treeFilterMode === 'lenient'),
    // Details (#expansion) can be opened on every row
    getRowCanExpand: (row: TableRow) => !!slots.expansion || !!row.subRows?.length,
    // Moved or pasted rows change `data`: groups and tree rows stay open (TanStack would close them all)
    autoResetExpanded: computed(() => (props.reorderableRows || props.cellSelection ? false : undefined)),
    onExpandedChange: (updater: Updater<ExpandedState>) => setExpanded(resolve(updater, expanded.value)),
    onSortingChange: (updater: Updater<SortingState>) => setSorting(resolve(updater, sorting.value)),
    onPaginationChange: (updater: Updater<PaginationState>) => setPagination(resolve(updater, pagination.value)),
    onRowSelectionChange: (updater: Updater<RowSelectionState>) => setSelection(resolve(updater, rowSelection.value)),
    onGlobalFilterChange: (updater: Updater<string>) => {
        globalFilter.value = resolve(updater, globalFilter.value) ?? '';
        emit('update:globalFilter', globalFilter.value);
    },
    onColumnFiltersChange: (updater: Updater<ColumnFiltersState>) => {
        columnFilters.value = resolve(updater, columnFilters.value);
        emit('update:filters', toFilters(columnFilters.value));
    },
    onColumnVisibilityChange: (updater: Updater<ColumnVisibilityState>) => {
        columnVisibility.value = resolve(updater, columnVisibility.value);
        emit(
            'update:hiddenColumns',
            Object.keys(columnVisibility.value).filter((key) => columnVisibility.value[key] === false)
        );
    },
    onColumnOrderChange: (updater: Updater<ColumnOrderState>) => {
        columnOrder.value = resolve(updater, columnOrder.value);
        emit('update:columnOrder', columnOrder.value);
    },
    onColumnPinningChange: (updater: Updater<ColumnPinningState>) => {
        columnPinning.value = resolve(updater, columnPinning.value);
        emit('update:pinnedColumns', { start: [...columnPinning.value.start], end: [...columnPinning.value.end] });
    },
    onColumnSizingChange: (updater: Updater<ColumnSizingState>) => {
        columnSizing.value = resolve(updater, columnSizing.value);
    },
    onGroupingChange: (updater: Updater<string[]>) => {
        grouping.value = resolve(updater, grouping.value);
        emit('update:groupBy', grouping.value);
    },
    globalFilterFn: (row: TableRow, columnId: string, value: string) => {
        const column = columnById.value.get(columnId);
        return matchesSearch(
            [display(column, row.getValue(columnId), row.original)],
            value,
            localeContext.value.locale
        );
    },
    getColumnCanGlobalFilter: (column) => columnById.value.get(column.id)?.searchable !== false,
    enableColumnResizing: computed(() => !!props.resizable),
    columnResizeMode: 'onChange',
    groupedColumnMode: false,
    keepPinnedRows: true,
    enableRowSelection: (row: TableRow) =>
        !!props.selectable && !row.getIsGrouped() && (props.isRowSelectable?.(row.original) ?? true),
    enableMultiRowSelection: computed(() => props.selectionMode !== 'single'),
    manualSorting: serverMode,
    manualFiltering: serverMode,
    // Without pageSize every row is shown; in server mode `data` already is the page
    manualPagination: computed(() => serverMode.value || !props.pageSize),
    rowCount: computed(() => (serverMode.value ? serverRowCount.value : undefined)),
});

function setSorting(next: SortingState) {
    sorting.value = next;
    emit('update:sorting', props.sortMode === 'multiple' ? [...next] : (next[0] ?? null));
}
function setPagination(next: PaginationState) {
    const sizeChanged = next.pageSize !== pagination.value.pageSize;
    pagination.value = next;
    if (sizeChanged) emit('update:pageSize', next.pageSize);
    emit('update:page', next.pageIndex + 1);
    emit('update:first', next.pageIndex * next.pageSize);
}
// Rows of other pages (server mode) stay known for selectedRowsChange
const remembered = new Map<string, TData>();
function setSelection(next: RowSelectionState) {
    rowSelection.value = next;
    const ids = Object.keys(next).filter((key) => next[key]);
    emit('update:selection', ids);
    const known = table.getCoreRowModel().rowsById;
    for (const key of [...remembered.keys()]) if (!next[key]) remembered.delete(key);
    for (const key of ids) if (known[key]) remembered.set(key, known[key].original);
    emit(
        'selectedRowsChange',
        ids.flatMap((key) => (remembered.has(key) ? [remembered.get(key)!] : []))
    );
}
function setAllSelection(next: DataTableAllSelection | null) {
    allSelection.value = next;
    emit('update:allSelection', next);
}
function toggleFilters() {
    showFilters.value = !showFilters.value;
    emit('update:showFilters', showFilters.value);
}
function setExpanded(next: ExpandedState) {
    expanded.value = next;
    emit('update:expanded', next === true ? [] : Object.keys(next).filter((key) => next[key]));
}
function setDensity(next: Density) {
    density.value = next;
    emit('update:size', next);
}

// Styles
const look = computed(() => ({
    size: density.value,
    gridlines: !!props.gridlines,
    striped: !!props.striped,
    scrollable: !!props.scrollHeight,
    wrapHeaders: !!props.wrapHeaders,
    verticalHeaders: !!props.verticalHeaders,
}));
const fullscreen = ref(false);
const grid = computed(() => props.navigation === 'grid');
// A tree table with grid keys is a treegrid: rows with level and open state, left/right close and open them
const treeGrid = computed(() => grid.value && !!props.getSubRows);
const styles = computed(() => dataTable({ ...look.value, fullscreen: fullscreen.value, grid: grid.value }));
const menuStyles = menu();
const styleFor = (columnId: string) => {
    const column = columnById.value.get(columnId);
    return dataTable({
        ...look.value,
        align: column?.align,
        hideBelow: column?.hideBelow ? (`hide-${column.hideBelow}` as const) : undefined,
    });
};

// Utility columns before and after the data columns
const editable = computed(() => leafDefs.value.some((column) => column.editable));
/** One cell at a time – saved at once (`cell`) or collected (`batch`) */
const cellEditing = computed(() => props.editMode !== 'row');
const hasActions = computed(() => !!props.rowActions || (props.editMode === 'row' && editable.value));
const leading = computed(() => {
    const list: Utility[] = [];
    if (props.reorderableRows) list.push('drag');
    if (props.selectable) list.push('select');
    if (slots.expansion) list.push('expand');
    if (props.rowNumbers) list.push('number');
    return list;
});
const trailing = computed<Utility[]>(() => (hasActions.value ? ['actions'] : []));
const leafColumns = computed(() => table.getVisibleLeafColumns());
const columnCount = computed(() => leafColumns.value.length + leading.value.length + trailing.value.length);

// Fixed widths: needed for resizing and pinning (sticky offsets)
const sized = computed(
    () =>
        !!props.resizable ||
        leafDefs.value.some((column) => column.width) ||
        columnPinning.value.start.length > 0 ||
        columnPinning.value.end.length > 0
);
const pinsStart = computed(() => columnPinning.value.start.length > 0);
const pinsEnd = computed(() => columnPinning.value.end.length > 0);
const leadingWidth = computed(() => leading.value.reduce((sum, utility) => sum + UTILITY_WIDTH[utility], 0));
const trailingWidth = computed(() => trailing.value.reduce((sum, utility) => sum + UTILITY_WIDTH[utility], 0));

function pinClass(columnId: string, head: boolean) {
    const column = table.getColumn(columnId);
    const pinned = column?.getIsPinned();
    if (!column || !pinned) return '';
    // A line where the pinned columns meet the scrolling ones
    const edge =
        pinned === 'start'
            ? table.getStartVisibleLeafColumns().at(-1)?.id === columnId && styles.value.pinnedStartEdge()
            : table.getEndVisibleLeafColumns()[0]?.id === columnId && styles.value.pinnedEndEdge();
    return [head ? styles.value.pinnedHead() : styles.value.pinned(), edge].filter(Boolean).join(' ');
}
function cellStyle(columnId: string, head: boolean) {
    const column = table.getColumn(columnId);
    if (!column || !sized.value) return undefined;
    const pinned = column.getIsPinned();
    return {
        ...(head ? { width: `${column.getSize()}px` } : {}),
        ...(pinned === 'start' ? { insetInlineStart: `${leadingWidth.value + column.getStart('start')}px` } : {}),
        ...(pinned === 'end' ? { insetInlineEnd: `${trailingWidth.value + column.getAfter('end')}px` } : {}),
    };
}
const utilityPinned = (utility: Utility) => (trailing.value.includes(utility) ? pinsEnd.value : pinsStart.value);
function utilityClass(utility: Utility, head: boolean) {
    const base = utility === 'select' ? styles.value.selectCell() : styles.value.utilityCell();
    const pin = utilityPinned(utility) ? (head ? styles.value.pinnedHead() : styles.value.pinned()) : '';
    return [base, pin].filter(Boolean).join(' ');
}
function utilityStyle(utility: Utility) {
    if (!sized.value) return undefined;
    const width = { width: `${UTILITY_WIDTH[utility]}px` };
    if (!utilityPinned(utility)) return width;
    if (trailing.value.includes(utility)) return { ...width, insetInlineEnd: '0px' };
    const before = leading.value.slice(0, leading.value.indexOf(utility));
    return { ...width, insetInlineStart: `${before.reduce((sum, item) => sum + UTILITY_WIDTH[item], 0)}px` };
}

// Header rows: a column appears once, spanning the rows down to its own header (TanStack repeats it as placeholder)
interface HeaderCell {
    header: Header<Features, TData, unknown>;
    rowSpan: number;
    group: boolean;
}
const headerRows = computed(() => {
    const groups = table.getHeaderGroups();
    const realRow = new Map<string, number>();
    groups.forEach((group, index) =>
        group.headers.forEach((header) => {
            if (!header.isPlaceholder) realRow.set(header.column.id, index);
        })
    );
    const real = new Map<string, Header<Features, TData, unknown>>();
    groups.forEach((group) =>
        group.headers.forEach((header) => !header.isPlaceholder && real.set(header.column.id, header))
    );
    const placed = new Set<string>();
    return groups.map((group, index) =>
        group.headers.flatMap((header): HeaderCell[] => {
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
});
const label = (column: TableColumn) => columnById.value.get(column.id)?.header ?? column.id;

// Sorting
const ariaSort = (columnId: string) => {
    const first = sorting.value[0];
    if (first?.id === columnId) return first.desc ? 'descending' : 'ascending';
    return table.getColumn(columnId)?.getCanSort() ? 'none' : undefined;
};
const sortPosition = (columnId: string) => sorting.value.findIndex((sort) => sort.id === columnId) + 1;
function onSort(columnId: string, event: MouseEvent) {
    setSorting(nextSorting(sorting.value, columnId, props.sortMode === 'multiple' && event.shiftKey));
}

// Column menu: sort, pin, move, hide, group
const showColumnMenu = computed(() => !!props.columnMenu || !!props.reorderableColumns);
const statusText = ref('');
const announce = (message: string) => {
    // Cleared first so the same text is announced again
    statusText.value = '';
    void nextTick(() => (statusText.value = message));
};
const leafOrder = () => table.getAllLeafColumns().map((column) => column.id);
function canMove(columnId: string) {
    return !!props.reorderableColumns && columnById.value.get(columnId)?.reorderable !== false;
}
function columnMenuItems(column: TableColumn): MenuEntry[] {
    const def = columnById.value.get(column.id);
    const sorted = column.getIsSorted();
    const pinned = column.getIsPinned();
    const visible = leafColumns.value.map((item) => item.id);
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
                      grouping.value.includes(column.id)
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
}
function moveColumn(columnId: string, targetId: string, after: boolean) {
    const order = leafOrder().filter((key) => key !== columnId);
    order.splice(order.indexOf(targetId) + (after ? 1 : 0), 0, columnId);
    table.setColumnOrder(order);
    const visible = leafColumns.value.map((column) => column.id).filter((key) => key !== columnId);
    visible.splice(visible.indexOf(targetId) + (after ? 1 : 0), 0, columnId);
    announce(
        t.columnMoved(columnById.value.get(columnId)?.header ?? columnId, visible.indexOf(columnId) + 1, visible.length)
    );
}
async function onColumnMenu(column: TableColumn, value: string) {
    const visible = leafColumns.value.map((item) => item.id);
    const position = visible.indexOf(column.id);
    switch (value) {
        case 'sort-asc':
        case 'sort-desc': {
            const sort = { id: column.id, desc: value === 'sort-desc' };
            if (props.sortMode !== 'multiple') setSorting([sort]);
            else if (sortPosition(column.id))
                setSorting(sorting.value.map((item) => (item.id === column.id ? sort : item)));
            else setSorting([...sorting.value, sort]);
            break;
        }
        case 'sort-clear':
            setSorting(sorting.value.filter((item) => item.id !== column.id));
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
            table.setGrouping([...grouping.value, column.id]);
            break;
        case 'ungroup':
            table.setGrouping(grouping.value.filter((key) => key !== column.id));
            break;
        case 'hide': {
            column.toggleVisibility(false);
            // The menu button is gone with the column – focus the one of the next column
            await nextTick();
            const buttons = root.value?.querySelectorAll<HTMLElement>('[data-column-menu]');
            buttons?.[Math.min(position, buttons.length - 1)]?.focus();
            return;
        }
    }
    // Moved, pinned or regrouped columns render anew – keep the focus on this column's menu button
    await nextTick();
    root.value?.querySelector<HTMLElement>(`[data-column-menu="${column.id}"]`)?.focus();
}

// Column drag and drop
const dragColumn = ref<string | null>(null);
const dropColumn = ref<{ id: string; after: boolean } | null>(null);
function onColumnDragStart(columnId: string, event: DragEvent) {
    dragColumn.value = columnId;
    event.dataTransfer?.setData('text/plain', columnId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
function onColumnDragOver(columnId: string, event: DragEvent) {
    if (!dragColumn.value || dragColumn.value === columnId || !canMove(columnId)) return;
    event.preventDefault();
    const cell = event.currentTarget as HTMLElement;
    const box = cell.getBoundingClientRect();
    const rtl = getComputedStyle(cell).direction === 'rtl';
    const past = event.clientX > box.left + box.width / 2;
    dropColumn.value = { id: columnId, after: rtl ? !past : past };
}
function onColumnDrop(event: DragEvent) {
    event.preventDefault();
    if (dragColumn.value && dropColumn.value) moveColumn(dragColumn.value, dropColumn.value.id, dropColumn.value.after);
    onColumnDragEnd();
}
function onColumnDragEnd() {
    dragColumn.value = null;
    dropColumn.value = null;
}
const columnDrop = (columnId: string) =>
    dropColumn.value?.id === columnId ? (dropColumn.value.after ? 'after' : 'before') : undefined;

/** Width to fit the content (double click or Enter on the resize handle) */
function autoSize(columnId: string, event: Event) {
    const header = (event.currentTarget as HTMLElement).closest('th');
    const element = header?.closest('table');
    if (!header || !element) return;
    // Virtual scrolling renders only some rows: the values of every row are measured as text as well
    const def = columnById.value.get(columnId);
    const texts =
        virtualOn.value && def
            ? table.getRowModel().rows.map((row) => display(def, row.getValue(columnId), row.original))
            : undefined;
    const width = fitColumnWidth(element, header, texts);
    if (width) table.setColumnSizing((old) => ({ ...old, [columnId]: Math.min(1200, Math.max(MIN_WIDTH, width)) }));
}
// Resizing with the keyboard
function onResizeKey(columnId: string, event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault();
        return autoSize(columnId, event);
    }
    const step = inlineArrowStep(event.key, event.currentTarget as HTMLElement) * RESIZE_STEP;
    if (!step) return;
    event.preventDefault();
    const column = table.getColumn(columnId)!;
    table.setColumnSizing((old) => ({ ...old, [columnId]: Math.max(MIN_WIDTH, column.getSize() + step) }));
}

// Filters
const hasFilterSlot = (columnId: string) => !!slots[`filter-${columnId}`];
/** A filter type or an own filter input (slot) */
const filterable = (column: DataTableColumn<TData> | undefined) =>
    !!column && (!!column.filter || hasFilterSlot(column.id));
const hasRowFilters = computed(
    () => props.filterDisplay === 'row' && showFilters.value && leafDefs.value.some((column) => filterable(column))
);
const menuFilters = computed(() => props.filterDisplay === 'menu' && showFilters.value);
const filtering = computed(() => !!globalFilter.value || columnFilters.value.length > 0 || advancedActive.value);
const filterValue = (columnId: string) =>
    columnFilters.value.find((filter) => filter.id === columnId)?.value as DataTableFilterValue | undefined;
function filterOptions(column: DataTableColumn<TData>) {
    return (
        column.filterOptions ??
        [...new Set(tableData.value.map((row) => display(column, rawValue(column, row), row)))].filter(Boolean).sort()
    );
}
/** Value in the filter row: the text, or the value of the first condition */
function rowFilterValue(column: DataTableColumn<TData>) {
    const value = filterValue(column.id);
    if (value === undefined) return column.filter === 'multiSelect' ? [] : null;
    if (typeof value === 'string') return value;
    return value.constraints[0]?.value ?? null;
}
function setFilter(columnId: string, value: DataTableFilterValue | undefined) {
    table.getColumn(columnId)?.setFilterValue(value !== undefined && isActiveFilter(value) ? value : undefined);
}
/** Match mode of the filter row */
const rowMode = (column: DataTableColumn<TData>) =>
    column.filterMatchMode ??
    (byValue(column) && column.filter === 'multiSelect' ? 'in' : dataTableMatchModes[column.filter ?? 'text'][0]!);
/** Input of the filter row: the one of an own match mode, or of the filter type */
const rowInput = (column: DataTableColumn<TData>) =>
    matchModeDefinition(rowMode(column))?.input ?? column.filter ?? 'text';
function setRowFilter(column: DataTableColumn<TData>, value: unknown) {
    const type = column.filter ?? 'text';
    // Text and select keep the plain text (as before match modes); the others a rule with the match mode of the row
    if (
        (type === 'text' || type === 'select') &&
        !column.filterMatchMode &&
        !byValue(column) &&
        !hasFilterSlot(column.id)
    )
        return setFilter(column.id, text(value));
    setFilter(column.id, { operator: 'and', constraints: [{ matchMode: rowMode(column), value }] });
}
/** From (0) or to (1) of a range in the filter row */
function setRowRange(column: DataTableColumn<TData>, part: 0 | 1, value: unknown) {
    const current = rowFilterValue(column);
    const range = Array.isArray(current) ? [...current] : [null, null];
    range[part] = value;
    setRowFilter(column, range);
}
const rangePart = (column: DataTableColumn<TData>, part: 0 | 1) => {
    const current = rowFilterValue(column);
    return Array.isArray(current) ? current[part] : null;
};

// Selection
const multiple = computed(() => props.selectionMode !== 'single');
/** "Select all" means all rows of all pages of the server (allSelection) */
const acrossPages = computed(() => props.selectAllMode === 'all' && serverMode.value);
const isSelected = (row: TableRow) =>
    acrossPages.value && allSelection.value
        ? row.getCanSelect() && !allSelection.value.except.includes(row.id)
        : row.getIsSelected();
const allSelected = computed<boolean | 'indeterminate'>(() => {
    if (acrossPages.value)
        return allSelection.value
            ? allSelection.value.except.length
                ? 'indeterminate'
                : true
            : selectedCount.value
              ? 'indeterminate'
              : false;
    return table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? 'indeterminate' : false;
});
function onSelectAll(checked: boolean) {
    if (acrossPages.value) {
        setSelection({});
        setAllSelection(allSelection.value || !checked ? null : { mode: 'all', except: [] });
    } else if (props.selectAllMode === 'all') table.toggleAllRowsSelected(checked);
    else table.toggleAllPageRowsSelected(checked);
}
const radioName = `${id}-select`;
let anchor: string | null = null;
let rangeIntent = false;
const visibleRowIds = () =>
    table
        .getRowModel()
        .rows.filter((row) => row.getCanSelect())
        .map((row) => row.id);
function selectRow(row: TableRow, checked: boolean, range = false) {
    if (acrossPages.value && allSelection.value) {
        const except = new Set(allSelection.value.except);
        for (const key of range && anchor ? idRange(visibleRowIds(), anchor, row.id) : [row.id])
            if (checked) except.delete(key);
            else except.add(key);
        setAllSelection({ mode: 'all', except: [...except] });
    } else if (!multiple.value) setSelection(checked ? toSelection([row.id]) : {});
    else
        setSelection(
            withSelected(
                rowSelection.value,
                range && anchor ? idRange(visibleRowIds(), anchor, row.id) : [row.id],
                checked
            )
        );
    anchor = row.id;
}
function onSelectCellIntent(event: MouseEvent | KeyboardEvent) {
    // Shift+click or Shift+Space on a checkbox selects the range from the last one
    rangeIntent = event.shiftKey;
}
const CONTROLS = 'button, a, input, select, textarea, label, [role=checkbox], [role=combobox], [contenteditable]';
function onRowClick(row: TableRow, event: MouseEvent) {
    const target = event.target as HTMLElement;
    // The link of the row (rowHref) counts as a click on the row, other controls do not
    const onLink = !!target.closest('[data-row-link]');
    if (!onLink && target.closest(CONTROLS)) return;
    const href = props.rowHref?.(row.original);
    emit('rowClick', { row: row.original, rowId: row.id, href, event });
    if (href) {
        if (onLink || event.defaultPrevented) return;
        if (event.ctrlKey || event.metaKey || event.shiftKey) window.open(href, '_blank', 'noopener');
        else window.location.assign(href);
        return;
    }
    if (!props.selectOnRowClick || !row.getCanSelect()) return;
    selectRow(row, multiple.value ? !isSelected(row) : true, multiple.value && event.shiftKey);
}
/** Middle click on a row with a link: a new tab */
function onRowAuxClick(row: TableRow, event: MouseEvent) {
    const href = props.rowHref?.(row.original);
    const target = event.target as HTMLElement;
    if (event.button !== 1 || !href || target.closest(CONTROLS)) return;
    window.open(href, '_blank', 'noopener');
}
/** The column with the row link: the first one that is neither edited in place nor copyable */
const linkColumn = computed(() =>
    props.rowHref
        ? leafColumns.value.find((column) => {
              const def = columnById.value.get(column.id);
              return !def?.copyable && !(cellEditing.value && def?.editable);
          })?.id
        : undefined
);
const linkFor = (row: TableRow, columnId: string) =>
    columnId === linkColumn.value ? props.rowHref?.(row.original) : undefined;

// Rows: groups, data rows and their details – one flat list, so it can be virtualised
interface Item {
    kind: 'group' | 'row' | 'expansion';
    row: TableRow;
    key: string;
}
const centerRows = computed(() => (props.frozenRows?.length ? table.getCenterRows() : table.getRowModel().rows));
const frozen = computed(() => (props.frozenRows?.length ? table.getTopRows() : []));
// A failed request of the data source shows the error instead of the rows
const items = computed(() =>
    (sourceError.value ? (NO_ROWS as TableRow[]) : centerRows.value).flatMap((row): Item[] =>
        row.getIsGrouped()
            ? [{ kind: 'group', row, key: row.id }]
            : [
                  { kind: 'row', row, key: row.id },
                  ...(slots.expansion && row.getIsExpanded()
                      ? [{ kind: 'expansion' as const, row, key: `${row.id}:details` }]
                      : []),
              ]
    )
);
const pageOffset = computed(() =>
    props.pageSize && !serverMode.value ? pagination.value.pageIndex * pagination.value.pageSize : 0
);
const rowNumberById = computed(() => {
    const numbers = new Map<string, number>();
    items.value
        .filter((item) => item.kind === 'row')
        .forEach((item, index) => numbers.set(item.row.id, pageOffset.value + index + 1));
    return numbers;
});
const detailsId = (row: TableRow) => `${id}-details-${row.id}`;
const allExpanded = computed(() => table.getIsAllRowsExpanded());

// Aggregates in group rows and the footer
const aggregated = computed(() => leafDefs.value.some((column) => column.aggregate));
const hasFooter = computed(() => leafDefs.value.some((column) => column.aggregate || column.footer));
function formatAggregate(column: DataTableColumn<TData>, value: unknown, row?: TData) {
    if (value === null || value === undefined) return '';
    if (column.format && row) return column.format(value, row);
    return typeof value === 'number'
        ? new Intl.NumberFormat(localeContext.value.locale, { maximumFractionDigits: 2 }).format(value)
        : text(value);
}
function aggregateOf(column: DataTableColumn<TData>, rows: TableRow[]) {
    if (!column.aggregate) return '';
    const leaves = rows.filter((row) => !row.getIsGrouped());
    const value = aggregateValues(
        leaves.map((row) => rawValue(column, row.original)),
        column.aggregate
    );
    return formatAggregate(column, value, column.aggregate === 'count' ? undefined : leaves[0]?.original);
}
function footerText(column: DataTableColumn<TData>) {
    if (column.footer !== undefined) return column.footer;
    if (!column.aggregate) return '';
    const value = aggregateOf(column, table.getFilteredRowModel().flatRows as TableRow[]);
    return typeof column.aggregate === 'string' ? (t.aggregates[column.aggregate]?.(value) ?? value) : value;
}

// Row actions and context menu
const actionsFor = (row: TableRow): MenuEntry[] =>
    typeof props.rowActions === 'function' ? props.rowActions(row.original) : (props.rowActions ?? []);
const contextRow = shallowRef<TableRow | null>(null);
function onContextTarget(event: Event) {
    const element = (event.target as HTMLElement).closest<HTMLElement>('[data-row-id]');
    contextRow.value = element ? (table.getRow(element.dataset.rowId!, true) ?? null) : null;
}
function onRowAction(row: TableRow | null, value: string) {
    if (row) emit('rowAction', { value, row: row.original, rowId: row.id });
}
/** The body inside a ContextMenu when `contextMenu` is set */
const BodyWrap: FunctionalComponent<
    { enabled: boolean; items: MenuEntry[]; label?: string },
    { select: (value: string) => void }
> = (wrapProps, { slots: wrapSlots, emit: wrapEmit }) =>
    wrapProps.enabled
        ? h(
              ContextMenu,
              {
                  items: wrapProps.items,
                  label: wrapProps.label,
                  onSelect: (value: string) => wrapEmit('select', value),
              },
              wrapSlots
          )
        : wrapSlots.default?.();
BodyWrap.props = ['enabled', 'items', 'label'];
BodyWrap.emits = ['select'];
/** Renders its content without an element – a cell holds it directly or inside the tree indent */
const Plain: FunctionalComponent = (_, { slots: plainSlots }) => plainSlots.default?.();

/** A row by id, also of another page or a group row – undefined when there is none (any more) */
function findRow(rowId: string): TableRow | undefined {
    try {
        return table.getRow(rowId, true) ?? undefined;
    } catch {
        return undefined;
    }
}

// Row reorder: drag handle (mouse) or arrow keys on the handle – within the list, between groups (the row takes
// the values of the target group) and in tree tables (before, after or into a row, like the Tree)
const dragRow = ref<string | null>(null);
const armedRow = ref<string | null>(null);
const dropRow = ref<{ id: string; position: 'before' | 'after' | 'inside' } | null>(null);
let focusHandle: string | null = null;
const treeRows = computed(() => !!props.getSubRows);
const grouped = computed(() => grouping.value.length > 0);
/** Key of the group of a row (grouped tables) */
const rowGroupKey = (row: TableRow) =>
    grouping.value.map((columnId) => listValueKey(row.getValue(columnId))).join('\u0000');
/** Name of the group of a row: "Location: Nuremberg" */
const groupName = (row: TableRow) =>
    grouping.value
        .map((columnId) => {
            const column = columnById.value.get(columnId);
            return `${column?.header ?? columnId}: ${display(column, row.getValue(columnId), row.original)}`;
        })
        .join(', ');
const dataRows = () =>
    items.value
        .filter((item) => item.kind === 'row' && (grouped.value || item.row.depth === 0))
        .map((item) => item.row);
/** The rows as a tree of ids (tree tables) */
function treeOf() {
    interface Node {
        id: string;
        children?: Node[];
    }
    const walk = (rows: TableRow[]): Node[] =>
        rows.map((row) => ({
            id: row.id,
            ...(props.getSubRows?.(row.original) ? { children: walk(row.subRows as TableRow[]) } : {}),
        }));
    return walk(table.getCoreRowModel().rows as TableRow[]);
}
function reorder(row: TableRow, target: TableRow, after: boolean) {
    // Positions as moveItem() takes them: the target position counts without the moved row
    const shift = (from: number, to: number) => (from < to ? to - 1 : to);
    const from = row.index;
    const to = shift(from, target.index + (after ? 1 : 0));
    const intoGroup = grouped.value && rowGroupKey(row) !== rowGroupKey(target);
    if (from === to && !intoGroup) return;
    const group = intoGroup
        ? Object.fromEntries(grouping.value.map((columnId) => [columnId, target.getValue(columnId)]))
        : undefined;
    emit('rowReorder', { row: row.original, rowId: row.id, from, to, ...(group ? { group } : {}) });
    const peers = dataRows()
        .filter((item) => item.id !== row.id && (!grouped.value || rowGroupKey(item) === rowGroupKey(target)))
        .map((item) => item.id);
    const position = peers.indexOf(target.id) + (after ? 1 : 0) + 1;
    const name = labelFor(row.original, row.index);
    announce(
        intoGroup
            ? t.rowMovedToGroup(name, groupName(target), position, peers.length + 1)
            : t.rowMoved(name, position, peers.length + 1)
    );
}
/** A move in a tree table: reported with the new parent and position; the parent opens */
function moveInTree(row: TableRow, move: TreeMove | undefined) {
    if (!move) return;
    const tree = treeOf();
    const parent = move.parentId ? findRow(move.parentId) : undefined;
    const siblings = move.parentId ? (locateTreeNode(tree, move.parentId)?.node.children ?? []) : tree;
    emit('rowReorder', {
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
}
function onHandleKey(row: TableRow, event: KeyboardEvent) {
    if (treeRows.value) {
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
        focusHandle = row.id;
        moveInTree(row, treeKeyboardMove(treeOf(), row.id, direction));
        return;
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const list = dataRows();
    if (grouped.value) {
        // Past the edge of a group into the neighbouring one
        const move = groupedRowMove(
            list.map((item) => ({ id: item.id, group: rowGroupKey(item) })),
            row.id,
            event.key === 'ArrowUp' ? 'up' : 'down'
        );
        const target = move && findRow(move.targetId);
        if (!move || !target) return;
        focusHandle = row.id;
        reorder(row, target, move.after);
        return;
    }
    const position = list.indexOf(row);
    const target = list[position + (event.key === 'ArrowUp' ? -1 : 1)];
    if (!target) return;
    focusHandle = row.id;
    reorder(row, target, event.key === 'ArrowDown');
}
watch(tableData, async () => {
    if (!focusHandle) return;
    const key = focusHandle;
    focusHandle = null;
    await nextTick();
    root.value?.querySelector<HTMLElement>(`[data-drag-handle="${CSS.escape(key)}"]`)?.focus();
});
function onRowDragStart(row: TableRow, event: DragEvent) {
    if (armedRow.value !== row.id) return event.preventDefault();
    dragRow.value = row.id;
    event.dataTransfer?.setData('text/plain', row.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
function onRowDragOver(row: TableRow, event: DragEvent) {
    if (!dragRow.value || dragRow.value === row.id) return;
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const share = (event.clientY - box.top) / box.height;
    if (treeRows.value) {
        // Rows with children take a drop into them in the middle
        const position = props.getSubRows?.(row.original)
            ? share < 0.25
                ? 'before'
                : share > 0.75
                  ? 'after'
                  : 'inside'
            : share < 0.5
              ? 'before'
              : 'after';
        if (!treeDropMove(treeOf(), dragRow.value, row.id, position)) {
            dropRow.value = null;
            return;
        }
        event.preventDefault();
        dropRow.value = { id: row.id, position };
        return;
    }
    event.preventDefault();
    dropRow.value = { id: row.id, position: share > 0.5 ? 'after' : 'before' };
}
/** Dragging over a group row: into that group, after its last row */
function onGroupDragOver(row: TableRow, event: DragEvent) {
    if (!dragRow.value) return;
    event.preventDefault();
    dropRow.value = { id: row.id, position: 'inside' };
}
function onRowDrop(event: DragEvent) {
    event.preventDefault();
    const row = dragRow.value ? findRow(dragRow.value) : undefined;
    const target = dropRow.value ? findRow(dropRow.value.id) : undefined;
    const position = dropRow.value?.position;
    if (row && target && position) {
        if (treeRows.value) moveInTree(row, treeDropMove(treeOf(), row.id, target.id, position));
        else if (target.getIsGrouped()) {
            const last = target
                .getLeafRows()
                .filter((leaf) => !leaf.getIsGrouped() && leaf.id !== row.id)
                .at(-1);
            if (last) reorder(row, last as TableRow, true);
        } else reorder(row, target, position === 'after');
    }
    onRowDragEnd();
}
function onRowDragEnd() {
    dragRow.value = null;
    dropRow.value = null;
    armedRow.value = null;
}
const rowDrop = (rowId: string) => (dropRow.value?.id === rowId ? dropRow.value.position : undefined);

// Batch mode: changed cells are collected (with their original value) until saved or discarded
const pending = shallowRef<PendingChanges>({});
/** Value of a cell as shown: the collected change of the batch mode, or the value of the row */
function shownValue(row: TableRow, columnId: string) {
    const changed = pendingValue(pending.value, row.id, columnId);
    return changed ? changed.value : row.getValue(columnId);
}
// Undo and redo of cell changes (edits, pastes, the batch mode)
const historyOn = computed(() => !!props.cellSelection || props.editMode === 'batch');
const history = new EditHistory();
const historyVersion = ref(0);
const canUndo = computed(() => historyVersion.value >= 0 && history.canUndo);
const canRedo = computed(() => historyVersion.value >= 0 && history.canRedo);
/** Changes take effect: collected in the batch mode, otherwise reported as cell edits; undoable */
function applyChanges(changes: CellChange[], record = true, undo = false) {
    if (!changes.length) return;
    if (props.editMode === 'batch') pending.value = applyPending(pending.value, changes, undo);
    else
        for (const change of undo ? [...changes].reverse() : changes) {
            const row = findRow(change.rowId);
            if (row)
                emit('cellEdit', {
                    row: row.original,
                    rowId: row.id,
                    columnId: change.columnId,
                    value: undo ? change.before : change.after,
                });
        }
    // Row editing: the changed rows as row edits, with every editable value of the row
    if (props.editMode === 'row')
        for (const { rowId, values } of changesByRow(changes, undo)) {
            const row = findRow(rowId);
            if (!row) continue;
            const current = leafDefs.value
                .filter((column) => column.editable)
                .map((column) => [column.id, shownValue(row, column.id)]);
            emit('rowEdit', { row: row.original, rowId, values: { ...Object.fromEntries(current), ...values } });
        }
    if (record && historyOn.value) {
        history.push(changes);
        historyVersion.value++;
    }
}
function undo() {
    const step = history.undo();
    if (!step) return;
    applyChanges(step, false, true);
    historyVersion.value++;
    announce(t.undone(step.length));
}
function redo() {
    const step = history.redo();
    if (!step) return;
    applyChanges(step, false);
    historyVersion.value++;
    announce(t.redone(step.length));
}
const pendingCount = computed(() => Object.keys(pending.value).length);
/** After saving or discarding: back into the table (the bar's buttons are disabled now) */
async function focusTable() {
    await nextTick();
    const element = tableElement.value;
    (element?.querySelector<HTMLElement>('[tabindex="0"]') ?? element)?.focus();
}
function saveChanges() {
    const changes = Object.values(pending.value);
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
    emit('save', { changes: cellChanges, rows: [...byRow.values()] });
    pending.value = {};
    history.clear();
    historyVersion.value++;
    announce(t.changesSaved(cellChanges.length));
    void focusTable();
}
function discardChanges() {
    if (!Object.keys(pending.value).length) return;
    pending.value = {};
    history.clear();
    historyVersion.value++;
    announce(t.changesDiscarded);
    void focusTable();
}

// Editing: one cell (Enter or leaving saves, Escape cancels, Tab moves on) or one row (save/cancel buttons)
const editing = ref<{ rowId: string; columnId: string } | null>(null);
const editingRow = ref<string | null>(null);
const draft = ref<Record<string, unknown>>({});
const errors = ref<Record<string, string>>({});
const root = useTemplateRef<HTMLDivElement>('root');
const editorType = (column: DataTableColumn<TData>) => column.editor ?? 'text';
const editKey = (rowId: string, columnId: string) => `${rowId}:${columnId}`;
const errorId = (rowId: string, columnId: string) => `${id}-error-${rowId}-${columnId}`;
/** Editable cells in reading order – Tab moves through them */
const editableCells = () =>
    items.value
        .filter((item) => item.kind === 'row')
        .flatMap((item) =>
            leafColumns.value
                .filter((column) => columnById.value.get(column.id)?.editable)
                .map((column) => ({ rowId: item.row.id, columnId: column.id }))
        );
/** Back to the edited cell – in grid navigation the cell itself, otherwise its edit button */
function focusEditTarget(selector: string) {
    const element = root.value?.querySelector<HTMLElement>(selector);
    (grid.value ? (element?.closest<HTMLElement>('td') ?? element) : element)?.focus();
}
async function focusEditor() {
    await nextTick();
    root.value
        ?.querySelector<HTMLElement>('[data-editor] :is(input, button, [role=combobox], [tabindex="0"])')
        ?.focus();
}
function startEdit(row: TableRow, columnId: string) {
    editing.value = { rowId: row.id, columnId };
    draft.value = { [columnId]: shownValue(row, columnId) };
    errors.value = {};
    void focusEditor();
}
/** A check may answer later (a promise): the editor is busy until then */
const validating = ref(false);
function validate(row: TableRow, columnIds: string[]): boolean | Promise<boolean> {
    const result = collectErrors(
        columnIds.map((columnId) => [
            columnId,
            () => columnById.value.get(columnId)?.validate?.(draft.value[columnId], row.original),
        ])
    );
    const done = (next: Record<string, string>) => {
        errors.value = next;
        return Object.keys(next).length === 0;
    };
    if (!(result instanceof Promise)) return done(result);
    validating.value = true;
    return result.then(done).finally(() => (validating.value = false));
}
function commitCell(row: TableRow, columnId: string, move?: 1 | -1) {
    if (!editing.value || validating.value) return;
    const valid = validate(row, [columnId]);
    if (valid instanceof Promise)
        return valid.then((ok) => {
            // Still the same cell (the editor may have been left meanwhile)
            if (editing.value?.rowId !== row.id || editing.value.columnId !== columnId) return;
            return ok ? saveCell(row, columnId, move) : focusEditor();
        });
    return valid ? saveCell(row, columnId, move) : focusEditor();
}
async function saveCell(row: TableRow, columnId: string, move?: 1 | -1) {
    const value = draft.value[columnId];
    editing.value = null;
    const before = shownValue(row, columnId);
    const changed = props.editMode === 'batch' ? !sameCellValue(value, before) : value !== row.getValue(columnId);
    if (changed) applyChanges([{ rowId: row.id, columnId, before, after: value }]);
    if (move) {
        const cells = editableCells();
        const next = cells[cells.findIndex((cell) => cell.rowId === row.id && cell.columnId === columnId) + move];
        const nextRow = next && table.getRow(next.rowId, true);
        if (next && nextRow) return startEdit(nextRow, next.columnId);
    }
    await nextTick();
    focusEditTarget(`[data-edit="${CSS.escape(editKey(row.id, columnId))}"]`);
}
async function cancelCell(row: TableRow, columnId: string) {
    editing.value = null;
    errors.value = {};
    await nextTick();
    focusEditTarget(`[data-edit="${CSS.escape(editKey(row.id, columnId))}"]`);
}
function onCellEditorKey(row: TableRow, columnId: string, event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        void cancelCell(row, columnId);
    } else if (
        event.key === 'Enter' &&
        // Several lines: Ctrl+Enter saves
        ((event.target as HTMLElement).matches('textarea')
            ? event.ctrlKey || event.metaKey
            : !(event.target as HTMLElement).matches('button, [role=combobox]'))
    ) {
        event.preventDefault();
        void commitCell(row, columnId);
    } else if (event.key === 'Tab') {
        event.preventDefault();
        void commitCell(row, columnId, event.shiftKey ? -1 : 1);
    }
}
function onCellEditorFocusOut(row: TableRow, columnId: string, event: FocusEvent) {
    const next = event.relatedTarget as HTMLElement | null;
    const editor = event.currentTarget as HTMLElement;
    // Still inside the editor, or in its popup (select list, calendar) at the end of the body
    if (next && (editor.contains(next) || (!root.value?.contains(next) && next.closest('[data-scope]')))) return;
    void commitCell(row, columnId);
}
/** Editors whose choice is taken at once in the cell mode */
const INSTANT = new Set(['select', 'date', 'checkbox']);
function onDraft(row: TableRow, column: DataTableColumn<TData>, value: unknown) {
    draft.value = { ...draft.value, [column.id]: value };
    if (cellEditing.value && INSTANT.has(editorType(column)) && !slots[`editor-${column.id}`])
        void commitCell(row, column.id);
}
/** What an own editor (slot) gets */
function editorProps(row: TableRow, column: DataTableColumn<TData>): DataTableEditorProps<TData> {
    return {
        value: draft.value[column.id],
        setValue: (value: unknown) => (draft.value = { ...draft.value, [column.id]: value }),
        row: row.original,
        commit: () => void (cellEditing.value ? commitCell(row, column.id) : finishRowEdit(row, true)),
        cancel: () => void (cellEditing.value ? cancelCell(row, column.id) : finishRowEdit(row, false)),
        invalid: !!errors.value[column.id],
    };
}
function startRowEdit(row: TableRow) {
    editingRow.value = row.id;
    errors.value = {};
    draft.value = Object.fromEntries(
        leafDefs.value.filter((column) => column.editable).map((column) => [column.id, row.getValue(column.id)])
    );
    void focusEditor();
}
async function finishRowEdit(row: TableRow, save: boolean) {
    if (validating.value) return;
    if (save) {
        const columnIds = leafDefs.value.filter((column) => column.editable).map((column) => column.id);
        if (!(await validate(row, columnIds))) return focusEditor();
        if (editingRow.value !== row.id) return;
        emit('rowEdit', { row: row.original, rowId: row.id, values: { ...draft.value } });
    }
    editingRow.value = null;
    errors.value = {};
    await nextTick();
    focusEditTarget(`[data-row-edit="${CSS.escape(row.id)}"]`);
}
function onRowEditorKey(row: TableRow, event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        void finishRowEdit(row, false);
    } else if (event.key === 'Enter' && (event.target as HTMLElement).matches('input')) {
        event.preventDefault();
        void finishRowEdit(row, true);
    }
}

// Range of cells (cellSelection): mouse, Shift+click, Shift+arrow keys; copy, paste, undo
const cellRange = shallowRef<CellRange | null>(null);
const rangeRowIds = computed(() => items.value.filter((item) => item.kind === 'row').map((item) => item.row.id));
const rangeColumnIds = computed(() => leafColumns.value.map((column) => column.id));
const bounds = computed(() =>
    props.cellSelection ? rangeBounds(cellRange.value, rangeRowIds.value, rangeColumnIds.value) : null
);
const rangeRowIndex = computed(() => new Map(rangeRowIds.value.map((key, index) => [key, index])));
const rangeColumnIndex = computed(() => new Map(rangeColumnIds.value.map((key, index) => [key, index])));
function isCellSelected(rowId: string, columnId: string) {
    const box = bounds.value;
    if (!box) return false;
    const row = rangeRowIndex.value.get(rowId) ?? -1;
    const column = rangeColumnIndex.value.get(columnId) ?? -1;
    return row >= box.top && row <= box.bottom && column >= box.left && column <= box.right;
}
function rangeSelection(range: CellRange | null): DataTableCellSelection<TData> | null {
    const box = rangeBounds(range, rangeRowIds.value, rangeColumnIds.value);
    if (!box) return null;
    const rowIds = rangeRowIds.value.slice(box.top, box.bottom + 1);
    const columnIds = rangeColumnIds.value.slice(box.left, box.right + 1);
    const rows = rowIds.flatMap((key) => findRow(key) ?? []);
    return {
        rowIds,
        columnIds,
        rows: rows.map((row) => row.original),
        values: rows.map((row) => columnIds.map((columnId) => shownValue(row, columnId))),
    };
}
function updateRange(next: CellRange | null) {
    const current = cellRange.value;
    const same =
        next &&
        current &&
        next.anchor.rowId === current.anchor.rowId &&
        next.anchor.columnId === current.anchor.columnId &&
        next.focus.rowId === current.focus.rowId &&
        next.focus.columnId === current.focus.columnId;
    if (same || (!next && !current)) return;
    cellRange.value = next;
    emit('cellSelectionChange', rangeSelection(next));
}
/** Mouse button held on a cell: entering other cells extends the range */
let draggingRange = false;
/** The range is extended from the keyboard: the focus moving along does not collapse it */
let extendingRange = false;
/** A Shift+click extended the range – the click must not start editing or follow a link */
let swallowClick = false;
const stopDragging = () => (draggingRange = false);
onMounted(() => window.addEventListener('pointerup', stopDragging));
onBeforeUnmount(() => window.removeEventListener('pointerup', stopDragging));
function onCellPointerDown(rowId: string, columnId: string, event: PointerEvent) {
    if (!props.cellSelection || event.button !== 0 || (event.target as HTMLElement).closest('[data-editor]')) return;
    const position = { rowId, columnId };
    const current = cellRange.value;
    const extend = event.shiftKey && current;
    updateRange(extend ? { anchor: current.anchor, focus: position } : { anchor: position, focus: position });
    draggingRange = true;
    swallowClick = !!extend;
    if (extend) window.getSelection()?.removeAllRanges();
}
function onCellPointerEnter(rowId: string, columnId: string, event: PointerEvent) {
    if (!draggingRange || !cellRange.value || !(event.buttons & 1)) return;
    updateRange({ anchor: cellRange.value.anchor, focus: { rowId, columnId } });
    // No text selection while dragging over cells
    window.getSelection()?.removeAllRanges();
}
function onCellClickCapture(event: MouseEvent) {
    if (!swallowClick) return;
    swallowClick = false;
    event.preventDefault();
    event.stopPropagation();
}
/** The cell element of a position, if it is rendered */
const cellElement = (rowId: string, columnId: string) =>
    tableElement.value?.querySelector<HTMLElement>(
        `tr[data-row-id="${CSS.escape(rowId)}"] > [data-column-id="${CSS.escape(columnId)}"]`
    ) ?? null;
/** Shift+arrow keys, Shift+Home/End (Ctrl: to the edge) on a cell extend the range – grid navigation only */
function extendRangeByKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const key = event.key;
    if (!props.cellSelection || !grid.value || !event.shiftKey || event.altKey) return false;
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
        cellRange.value && isCellSelected(rowId, columnId)
            ? cellRange.value
            : { anchor: { rowId, columnId }, focus: { rowId, columnId } };
    const next = extendRange(
        current,
        rangeRowIds.value,
        rangeColumnIds.value,
        direction,
        event.ctrlKey || event.metaKey
    );
    event.preventDefault();
    updateRange(next);
    const reveal = () => {
        const element = cellElement(next.focus.rowId, next.focus.columnId);
        if (!element) return false;
        extendingRange = true;
        element.focus();
        extendingRange = false;
        element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        return true;
    };
    void nextTick(() => {
        if (reveal() || !virtualOn.value) return;
        virtualizer.value.scrollToIndex(
            items.value.findIndex((item) => item.kind === 'row' && item.row.id === next.focus.rowId)
        );
        requestAnimationFrame(() => requestAnimationFrame(() => void reveal()));
    });
    return true;
}
/** Text of a cell as copied: the shown text (format), changed values of the batch mode included */
const cellText = (row: TableRow, columnId: string) =>
    display(columnById.value.get(columnId), shownValue(row, columnId), row.original);
/** Tab-separated text of the range – or of the selected rows (all shown columns) without a range */
function copyText() {
    const selection = rangeSelection(cellRange.value);
    if (selection) {
        const rows = selection.rowIds.flatMap((key) => findRow(key) ?? []);
        return {
            text: toTsv(rows.map((row) => selection.columnIds.map((columnId) => cellText(row, columnId)))),
            count: rows.length * selection.columnIds.length,
        };
    }
    const rows = items.value.filter((item) => item.kind === 'row' && isSelected(item.row)).map((item) => item.row);
    if (!rows.length) return null;
    return {
        text: toTsv(rows.map((row) => rangeColumnIds.value.map((columnId) => cellText(row, columnId)))),
        count: rows.length * rangeColumnIds.value.length,
    };
}
/**
 * Whether Ctrl+C/Ctrl+V belong to the table: the focus is in it (a cell, the table), not in an input. The browser
 * sends clipboard events to the selection, not the focus – so they are heard on the document.
 */
function clipboardTarget() {
    const active = document.activeElement;
    return (
        !!props.cellSelection && !!active && !!tableElement.value?.contains(active) && !active.closest(TEXT_CONTROLS)
    );
}
function onTableCopy(event: ClipboardEvent) {
    if (!clipboardTarget()) return;
    // Text selected with the mouse: the browser copies it
    if (window.getSelection()?.toString()) return;
    const copied = copyText();
    if (!copied || !event.clipboardData) return;
    event.clipboardData.setData('text/plain', copied.text);
    event.preventDefault();
    announce(t.cellsCopied(copied.count));
}
/** Pastes tab-separated text from the active cell (or the range) on: values read per column, checked, undoable */
async function pasteText(text: string) {
    const cells = parseTsv(text);
    const box = rangeBounds(cellRange.value, rangeRowIds.value, rangeColumnIds.value);
    if (!cells.length || !box) return;
    const targets = pasteTargets(
        cells,
        { row: box.top, column: box.left },
        rangeRowIds.value,
        rangeColumnIds.value,
        box
    );
    const errors: DataTableCellPaste<TData>['errors'] = [];
    const candidates: { change: CellChange; row: TableRow; def: DataTableColumn<TData>; text: string }[] = [];
    for (const target of targets) {
        const def = columnById.value.get(target.columnId);
        const row = findRow(target.rowId);
        if (!def || !row) continue;
        if (!def.editable) {
            errors.push({ ...target, message: t.pasteErrors.readonly! });
            continue;
        }
        const parsed = parseCellText(target.text, editorType(def), {
            locale: localeContext.value.locale,
            choices: def.editOptions,
        });
        if ('error' in parsed) {
            errors.push({ ...target, message: t.pasteErrors[parsed.error] ?? parsed.error });
            continue;
        }
        const before = shownValue(row, target.columnId);
        if (sameCellValue(parsed.value, before)) continue;
        candidates.push({
            change: { rowId: row.id, columnId: def.id, before, after: parsed.value },
            row,
            def,
            text: target.text,
        });
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
                text: candidate.text,
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
    emit('cellPaste', paste);
    if (paste.defaultPrevented) return;
    applyChanges(valid.map(({ change }) => change));
    // The pasted cells become the range
    updateRange(rangeAround(targets, rangeRowIds.value, rangeColumnIds.value));
    announce(t.cellsPasted(valid.length, errors.length));
}
function onTablePaste(event: ClipboardEvent) {
    if (!clipboardTarget()) return;
    const text = event.clipboardData?.getData('text/plain');
    if (!text) return;
    event.preventDefault();
    void pasteText(text);
}
onMounted(() => {
    document.addEventListener('copy', onTableCopy);
    document.addEventListener('paste', onTablePaste);
});
onBeforeUnmount(() => {
    document.removeEventListener('copy', onTableCopy);
    document.removeEventListener('paste', onTablePaste);
});
/** Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z outside of inputs */
function onHistoryKey(event: KeyboardEvent) {
    if (!historyOn.value || (event.target as HTMLElement).closest(TEXT_CONTROLS)) return false;
    const action = historyKey(event);
    if (!action) return false;
    event.preventDefault();
    if (action === 'undo') undo();
    else redo();
    return true;
}

// Find in the table: matches in the shown text of the filtered rows (all pages), previous/next, marked
const findOpen = ref(false);
const findQuery = ref('');
const findIndex = ref(0);
const findActive = computed(() => !!props.find && findOpen.value && !!findQuery.value.trim());
const findRows = computed<TableRow[]>(() =>
    !findActive.value
        ? []
        : (paged.value && !serverMode.value ? table.getPrePaginatedRowModel().rows : table.getRowModel().rows).filter(
              (row) => !row.getIsGrouped()
          )
);
const matches = computed(() =>
    findActive.value
        ? findMatches(
              findRows.value.map((row) => ({
                  id: row.id,
                  cells: leafColumns.value.map((column) => ({ columnId: column.id, text: cellText(row, column.id) })),
              })),
              findQuery.value,
              localeContext.value.locale
          )
        : []
);
const currentMatch = computed(() =>
    matches.value.length ? matches.value[Math.min(findIndex.value, matches.value.length - 1)] : undefined
);
const matchKeys = computed(() => new Set(matches.value.map((match) => `${match.rowId}\u0000${match.columnId}`)));
function findClass(rowId: string, columnId: string) {
    if (!findActive.value) return '';
    if (currentMatch.value?.rowId === rowId && currentMatch.value.columnId === columnId)
        return styles.value.findCurrent();
    return matchKeys.value.has(`${rowId}\u0000${columnId}`) ? styles.value.findMatch() : '';
}
/** Brings the current match into view: its page, its virtual row, the cell */
async function revealMatch() {
    await nextTick();
    const match = currentMatch.value;
    if (!match) return;
    const show = () =>
        cellElement(match.rowId, match.columnId)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    const index = items.value.findIndex((item) => item.kind === 'row' && item.row.id === match.rowId);
    if (virtualOn.value && index >= 0) {
        virtualizer.value.scrollToIndex(index, { align: 'center' });
        requestAnimationFrame(() => requestAnimationFrame(show));
    } else show();
}
function goToMatch(index: number) {
    const list = matches.value;
    if (!list.length) return;
    const next = (index + list.length) % list.length;
    findIndex.value = next;
    const match = list[next]!;
    if (paged.value && !serverMode.value) {
        const position = findRows.value.findIndex((row) => row.id === match.rowId);
        const targetPage = Math.floor(position / pagination.value.pageSize);
        if (position >= 0 && targetPage !== pagination.value.pageIndex) table.setPageIndex(targetPage);
    }
    void revealMatch();
}
async function toggleFind() {
    findOpen.value = !findOpen.value;
    await nextTick();
    root.value
        ?.querySelector<HTMLElement>(
            findOpen.value ? '[data-find-input] input, input[data-find-input]' : '[data-find-toggle]'
        )
        ?.focus();
}
function onFindKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault();
        goToMatch(findIndex.value + (event.shiftKey ? -1 : 1));
    } else if (event.key === 'Escape') {
        event.preventDefault();
        void toggleFind();
    }
}
function onFindChange(value: string) {
    findQuery.value = value;
    findIndex.value = 0;
    void revealMatch();
}

// Merged cells: equal values one below the other (rowSpan 'auto'), cells over several columns (colSpan)
const spanning = computed(
    () => !virtualOn.value && leafDefs.value.some((column) => column.rowSpan === 'auto' || column.colSpan)
);
const headerId = (columnId: string) => `${id}-head-${columnId}`;
const spans = computed(() => {
    if (!spanning.value) return undefined;
    const list = items.value;
    const columnsShown = leafColumns.value;
    const columnSpans = list.map((item) =>
        item.kind === 'row'
            ? rowColumnSpans(
                  columnsShown.map((column) => columnById.value.get(column.id)?.colSpan?.(item.row.original) ?? 1)
              )
            : columnsShown.map(() => 1)
    );
    const breaks = list.map((item, index) => item.kind !== 'row' || list[index - 1]?.kind !== 'row');
    const merged = columnsShown.map((column) => columnById.value.get(column.id)?.rowSpan === 'auto');
    // Cells over several columns take no part in merging down
    const texts = (columnId: string, columnIndex: number) =>
        list.map((item, index) =>
            item.kind === 'row' && columnSpans[index]![columnIndex] === 1 ? cellText(item.row, columnId) : null
        );
    // Nested: a merged column merges only inside the merged cells of the merged columns before it
    const nested = autoRowSpans(
        columnsShown.flatMap((column, columnIndex) => (merged[columnIndex] ? [texts(column.id, columnIndex)] : [])),
        breaks
    );
    let position = 0;
    const rowSpans = merged.map((isMerged) => (isMerged ? nested[position++] : undefined));
    return { columnSpans, rowSpans };
});
/** rowSpan and colSpan of a data cell – 0 when another cell covers it */
const spanOf = (itemIndex: number, columnIndex: number) => ({
    rowSpan: spans.value?.rowSpans[columnIndex]?.[itemIndex] ?? 1,
    colSpan: spans.value?.columnSpans[itemIndex]?.[columnIndex] ?? 1,
});
/** Whether a data cell is drawn (not covered by a merged cell) */
const cellShown = (itemIndex: number, columnIndex: number) => {
    if (!spanning.value) return true;
    const span = spanOf(itemIndex, columnIndex);
    return span.rowSpan > 0 && span.colSpan > 0;
};
/** Attributes and classes of a data cell for the range, the batch mode, find and merged cells */
function cellExtras(row: TableRow, columnId: string, itemIndex: number, columnIndex: number) {
    const selected = !!props.cellSelection && isCellSelected(row.id, columnId);
    const changed = props.editMode === 'batch' && !!pendingValue(pending.value, row.id, columnId);
    const span = spanning.value ? spanOf(itemIndex, columnIndex) : { rowSpan: 1, colSpan: 1 };
    return {
        className: [
            selected ? styles.value.cellSelected() : '',
            changed ? styles.value.cellChanged() : '',
            findClass(row.id, columnId),
        ],
        attributes: {
            ...(props.cellSelection || props.find ? { 'data-column-id': columnId } : {}),
            ...(props.cellSelection && grid.value ? { 'aria-selected': selected } : {}),
            ...(changed ? { 'data-changed': '' } : {}),
            ...(spanning.value
                ? {
                      ...(span.rowSpan > 1 ? { rowspan: span.rowSpan } : {}),
                      ...(span.colSpan > 1 ? { colspan: span.colSpan } : {}),
                      headers: leafColumns.value
                          .slice(columnIndex, columnIndex + span.colSpan)
                          .map((column) => headerId(column.id))
                          .join(' '),
                  }
                : {}),
            ...(props.cellSelection
                ? {
                      onPointerdown: (event: PointerEvent) => onCellPointerDown(row.id, columnId, event),
                      onPointerenter: (event: PointerEvent) => onCellPointerEnter(row.id, columnId, event),
                      onClickCapture: onCellClickCapture,
                  }
                : {}),
        },
    };
}
/** The shown value of a cell is a changed one of the batch mode */
const isChanged = (row: TableRow, columnId: string) =>
    props.editMode === 'batch' && !!pendingValue(pending.value, row.id, columnId);

// Export
/** The CSV of the filtered and sorted rows of all pages (or of the selection) as text */
function generateCsv(options: DataTableCsvOptions = {}) {
    const visible = table
        .getVisibleLeafColumns()
        .map((column) => columnById.value.get(column.id)!)
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
    const separator = options.separator ?? props.csvSeparator ?? localeCsvSeparator(localeContext.value.locale);
    const csv = toCsv([visible.map((column) => column.exportHeader ?? column.header), ...records], separator);
    return options.bom === false ? csv.slice(1) : csv;
}
/** Downloads the CSV – `true` (or `{ selectionOnly: true }`) only the selected rows */
function exportCsv(options: boolean | DataTableCsvOptions = false) {
    const settings = typeof options === 'boolean' ? { selectionOnly: options } : options;
    downloadText(`${settings.filename ?? props.exportFilename ?? 'export'}.csv`, generateCsv(settings));
}
/** Rows of an export or print: the selection, or the sorted rows with their group rows (tree of groups) */
function exportRows(selectionOnly = false): { row: TableRow; group: boolean; depth: number }[] {
    if (selectionOnly)
        return table
            .getSelectedRowModel()
            .flatRows.filter((row) => !row.getIsGrouped())
            .map((row) => ({ row, group: false, depth: 0 }));
    const walk = (row: TableRow): { row: TableRow; group: boolean; depth: number }[] => [
        { row, group: row.getIsGrouped(), depth: row.depth },
        ...(row.subRows as TableRow[]).flatMap(walk),
    ];
    return (table.getSortedRowModel().rows as TableRow[]).flatMap(walk);
}
/** Label of a group row: "Location: Frankfurt (3)" */
function groupLabel(row: TableRow) {
    const column = columnById.value.get(row.groupingColumnId!);
    const count = row.getLeafRows().filter((leaf) => !leaf.getIsGrouped()).length;
    return `${column?.header ?? ''}: ${display(column, row.groupingValue, row.original)} (${count})`;
}
/** Kind of value of a column for Excel: dates by the filter or editor type */
const dateKind = (column: DataTableColumn<TData>) =>
    column.editor === 'datetime'
        ? 'datetime'
        : column.filter === 'date' || column.editor === 'date'
          ? 'date'
          : undefined;
function xlsxValue(value: unknown, column: DataTableColumn<TData>, row?: TData): XlsxValue {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (value instanceof Date) return { date: value, time: dateKind(column) === 'datetime' };
    const kind = dateKind(column);
    if (kind && typeof value === 'string') return { date: value, time: kind === 'datetime' };
    if (typeof value === 'boolean' && !column.format) return value;
    return row ? display(column, value, row) : text(value);
}
/** The Excel file (.xlsx) of the rows as bytes: numbers as numbers, dates as dates, bold header and totals */
function generateXlsx(options: DataTableXlsxOptions = {}) {
    const visible = table
        .getVisibleLeafColumns()
        .map((column) => columnById.value.get(column.id)!)
        .filter((column) => column.exportable !== false);
    const rows: XlsxRow[] = exportRows(options.selectionOnly)
        .filter((entry) => !entry.group || options.groups !== false)
        .map(({ row, group, depth }): XlsxRow => {
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
        name: options.sheetName ?? props.caption,
        columns: visible.map((column) => ({ header: column.exportHeader ?? column.header })),
        rows,
    });
}
/** Downloads the rows as an Excel file (.xlsx) */
function exportXlsx(options: DataTableXlsxOptions = {}) {
    downloadBytes(`${options.filename ?? props.exportFilename ?? 'export'}.xlsx`, generateXlsx(options));
}
function exportAs(format: 'csv' | 'xlsx', selectionOnly: boolean) {
    if (format === 'xlsx') exportXlsx({ selectionOnly });
    else exportCsv(selectionOnly);
}
/** Prints all filtered and sorted rows (all pages) as plain text, the header on every page, without controls */
function print(options: DataTablePrintOptions = {}) {
    const visible = leafColumns.value.map((column) => columnById.value.get(column.id)!);
    const head: PrintCell[][] = headerRows.value.map((cells) =>
        cells.map((cell) => ({
            text: label(cell.header.column),
            colSpan: cell.group ? cell.header.colSpan : 1,
            rowSpan: cell.rowSpan,
            align: cell.group ? undefined : columnById.value.get(cell.header.column.id)?.align,
        }))
    );
    const body = exportRows(options.selectionOnly).map(({ row, group }) =>
        group
            ? { kind: 'group' as const, cells: [{ text: groupLabel(row), colSpan: visible.length }] }
            : { cells: visible.map((column) => ({ text: cellText(row, column.id), align: column.align })) }
    );
    const foot = hasFooter.value
        ? visible.map((column) => ({ text: footerText(column), align: column.align }))
        : undefined;
    printHtml(
        printTableHtml({
            title: options.title ?? props.caption,
            caption: props.caption,
            lang: localeContext.value.locale,
            dir: getComputedStyle(root.value ?? document.body).direction === 'rtl' ? 'rtl' : 'ltr',
            head,
            body,
            foot,
        })
    );
}
/** Asks the data source (`dataSource`) again for the current page, past the cache */
async function refresh() {
    await controller?.refresh();
}

// Export button: one format and no selection – a button; otherwise a menu of formats (and the selection)
const formats = computed(() => (props.exportFormats?.length ? props.exportFormats : (['csv'] as const)));
const exportItems = computed<MenuEntry[]>(() => {
    const withSelection = !!props.selectable && selectedCount.value > 0;
    const list = formats.value;
    if (list.length === 1 && list[0] === 'csv')
        return withSelection
            ? [
                  { value: 'all', label: t.exportAll },
                  { value: 'selection', label: t.exportSelection },
              ]
            : [];
    return list.flatMap((format) =>
        withSelection
            ? [
                  { value: `${format}:all`, label: t.exportAs(format, false) },
                  { value: `${format}:selection`, label: t.exportAs(format, true) },
              ]
            : list.length > 1
              ? [{ value: `${format}:all`, label: t.exportAs(format, false) }]
              : []
    );
});
const exportLabel = computed(() =>
    formats.value.length > 1 ? t.exportMenu : formats.value[0] === 'xlsx' ? t.exportXlsx : t.export
);
function onExportSelect(value: string) {
    // "all"/"selection" (CSV only) or "<format>:all"/"<format>:selection"
    const [format, which] = value.includes(':')
        ? (value.split(':') as ['csv' | 'xlsx', string])
        : (['csv', value] as const);
    exportAs(format, which === 'selection');
}

// Column groups in the column menu: the top level columns in their current order with their leaf columns
const leavesOf = (def: DataTableColumn<TData>): string[] => (def.columns ? def.columns.flatMap(leavesOf) : [def.id]);
const columnGroups = computed(() => {
    if (!columnDefs.value.some((def) => def.columns)) return undefined;
    const order = table.getAllLeafColumns();
    const position = (columnId: string) => order.findIndex((column) => column.id === columnId);
    return columnDefs.value
        .map((def) => ({
            def,
            leaves: leavesOf(def)
                .map((columnId) => order[position(columnId)]!)
                .filter(Boolean)
                .sort((a, b) => position(a.id) - position(b.id)),
        }))
        .sort((a, b) => position(a.leaves[0]?.id ?? '') - position(b.leaves[0]?.id ?? ''));
});
/** The blocks of the column menu: column groups, or all columns as one block */
const columnBlocks = computed(
    () =>
        columnGroups.value ?? [
            { def: undefined as DataTableColumn<TData> | undefined, leaves: table.getAllLeafColumns() },
        ]
);
/** Shows or hides all hideable columns of a column group at once */
function setBlockVisible(leaves: TableColumn[], visible: boolean) {
    table.setColumnVisibility({
        ...columnVisibility.value,
        ...Object.fromEntries(leaves.filter((column) => column.getCanHide()).map((column) => [column.id, visible])),
    });
}
function moveColumnGroup(groupId: string, direction: -1 | 1) {
    const blocks = columnDefs.value.map((def) => ({ id: def.id, leaves: leavesOf(def) }));
    const next = moveColumnBlock(
        table.getAllLeafColumns().map((column) => column.id),
        blocks,
        groupId,
        direction
    );
    if (!next) return;
    table.setColumnOrder(next);
    const firstOf = (blockId: string) => next.indexOf(blocks.find((block) => block.id === blockId)!.leaves[0]!);
    const order = blocks.map((block) => block.id).sort((a, b) => firstOf(a) - firstOf(b));
    announce(t.columnMoved(columnById.value.get(groupId)?.header ?? groupId, order.indexOf(groupId) + 1, order.length));
}

const selectedCount = computed(() =>
    acrossPages.value && allSelection.value
        ? Math.max(0, (serverRowCount.value ?? tableData.value.length) - allSelection.value.except.length)
        : Object.values(rowSelection.value).filter(Boolean).length
);

// Full screen: the table moves to the end of the body, everything else is inert
const restoreInert: HTMLElement[] = [];
async function toggleFullscreen() {
    fullscreen.value = !fullscreen.value;
    await nextTick();
    if (fullscreen.value) {
        for (const element of document.body.children) {
            if (element === root.value || !(element instanceof HTMLElement) || element.inert) continue;
            element.inert = true;
            restoreInert.push(element);
        }
    } else {
        restoreInert.splice(0).forEach((element) => (element.inert = false));
    }
    root.value?.querySelector<HTMLElement>('[data-fullscreen-toggle]')?.focus();
}
function onRootKey(event: KeyboardEvent) {
    if (fullscreen.value && event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        void toggleFullscreen();
    }
}
onBeforeUnmount(() => restoreInert.splice(0).forEach((element) => (element.inert = false)));

// Scrolling: virtual rows and the end of the list
const scrollElement = useTemplateRef<HTMLDivElement>('scroll');
const virtualOn = computed(() => !!props.virtual && !!props.scrollHeight);
const virtualizer = useVirtualizer(
    computed(() => ({
        count: virtualOn.value ? items.value.length : 0,
        getScrollElement: () => scrollElement.value,
        estimateSize: () => props.rowHeight,
        overscan: 8,
        getItemKey: (index: number) => items.value[index]?.key ?? index,
        // Rows of the first screen before the table is measured (no empty flash, SSR)
        initialRect: { width: 0, height: Number.parseInt(props.scrollHeight ?? '', 10) || 400 },
    }))
);
const virtualItems = computed(() => (virtualOn.value ? virtualizer.value.getVirtualItems() : []));
const shownItems = computed(() =>
    virtualOn.value
        ? virtualItems.value.map((virtual) => ({ ...items.value[virtual.index]!, index: virtual.index }))
        : items.value.map((item, index) => ({ ...item, index }))
);
const paddingTop = computed(() => (virtualOn.value ? (virtualItems.value[0]?.start ?? 0) : 0));
const paddingBottom = computed(() =>
    virtualOn.value ? virtualizer.value.getTotalSize() - (virtualItems.value.at(-1)?.end ?? 0) : 0
);
const measure = (element: unknown) => {
    if (virtualOn.value && element instanceof Element) virtualizer.value.measureElement(element);
};
let endReported = false;
watch(
    () => tableData.value.length,
    () => (endReported = false)
);
function onScroll(event: Event) {
    const element = event.currentTarget as HTMLElement;
    if (endReported || element.scrollTop + element.clientHeight < element.scrollHeight - 80) return;
    endReported = true;
    emit('loadMore');
    emit('scrollEnd');
}
// Frozen rows stick below the header – its height is measured
const headHeight = ref(0);
let headObserver: ResizeObserver | undefined;
const head = useTemplateRef<HTMLElement>('head');
onMounted(() => {
    if (!head.value || typeof ResizeObserver === 'undefined') return;
    headObserver = new ResizeObserver(() => (headHeight.value = head.value?.offsetHeight ?? 0));
    headObserver.observe(head.value);
});
onBeforeUnmount(() => headObserver?.disconnect());

// Keyboard navigation as a grid: one Tab stop, kept in sync after every render
const tableElement = useTemplateRef<HTMLTableElement>('tableElement');
const updateGrid = () => grid.value && tableElement.value && syncGrid(tableElement.value);
onMounted(updateGrid);
onUpdated(updateGrid);
/** Treegrid: ArrowRight/ArrowLeft on the tree cell open and close the row or go to its parent */
function onTreeGridKey(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return false;
    const target = event.target as HTMLElement;
    const cell = target.closest('td');
    const rowId = cell?.parentElement?.dataset.rowId;
    if (!cell || !rowId || cell.cellIndex !== leading.value.length || target.closest(TEXT_CONTROLS)) return false;
    const row = table.getRow(rowId, true);
    if (!row) return false;
    const rtl = getComputedStyle(tableElement.value!).direction === 'rtl';
    const level = { expandable: row.getCanExpand(), expanded: row.getIsExpanded(), level: row.depth + 1 };
    const action = treeGridKeyAction(event.key, level, rtl);
    if (!action) return false;
    event.preventDefault();
    if (action === 'parent') {
        const parent = row.getParentRow();
        tableElement.value
            ?.querySelector<HTMLElement>(
                `tr[data-row-id="${CSS.escape(parent?.id ?? '')}"] > td:nth-child(${leading.value.length + 1})`
            )
            ?.focus();
    } else row.toggleExpanded(action === 'expand');
    return true;
}
function onGridKey(event: KeyboardEvent) {
    if (!grid.value || !tableElement.value) return;
    if (treeGrid.value && onTreeGridKey(event)) return;
    gridKeydown(event, tableElement.value, {
        itemCount: items.value.length,
        scrollToItem: virtualOn.value ? (index) => virtualizer.value.scrollToIndex(index) : undefined,
        pageRows:
            scrollElement.value && props.scrollHeight
                ? Math.max(1, Math.floor(scrollElement.value.clientHeight / props.rowHeight) - 1)
                : 10,
        onSelectRow: (rowId) => {
            const row = table.getRow(rowId, true);
            if (row?.getCanSelect()) selectRow(row, multiple.value ? !isSelected(row) : true);
        },
    });
}
function onGridFocus(event: FocusEvent) {
    if (grid.value && tableElement.value) gridFocusIn(tableElement.value, event.target as Element);
    // Moving with the arrow keys (not extending, not the mouse): the range is the focused cell
    const target = event.target as HTMLElement;
    const rowId = target.closest<HTMLElement>('tr')?.dataset.rowId;
    const columnId = target.dataset.columnId;
    if (!props.cellSelection || !grid.value || draggingRange || extendingRange) return;
    if (rowId && columnId && target.matches('td'))
        updateRange({ anchor: { rowId, columnId }, focus: { rowId, columnId } });
}
/** Undo/redo, extending the range, then the grid keys */
function onTableKey(event: KeyboardEvent) {
    if (onHistoryKey(event) || extendRangeByKey(event)) return;
    onGridKey(event);
}

// Saved state (stateKey): restored after mounting, saved on every change
const tableState = computed<DataTableState>(() => ({
    sorting: sorting.value,
    filters: toFilters(columnFilters.value),
    globalFilter: globalFilter.value,
    page: pagination.value.pageIndex + 1,
    pageSize: pagination.value.pageSize,
    columnSizing: columnSizing.value,
    columnOrder: columnOrder.value,
    hiddenColumns: Object.keys(columnVisibility.value).filter((key) => columnVisibility.value[key] === false),
    pinnedColumns: columnPinning.value,
    expanded:
        expanded.value === true
            ? []
            : Object.keys(expanded.value).filter((key) => (expanded.value as Record<string, boolean>)[key]),
    selection: Object.keys(rowSelection.value).filter((key) => rowSelection.value[key]),
    density: density.value,
}));
onMounted(() => {
    if (!props.stateKey) return;
    const saved = loadTableState(props.stateKey, props.stateStorage);
    if (saved) {
        if (saved.sorting) setSorting(saved.sorting);
        if (saved.filters) table.setColumnFilters(fromFilters(saved.filters));
        if (saved.globalFilter !== undefined) table.setGlobalFilter(saved.globalFilter);
        if (saved.columnSizing) columnSizing.value = saved.columnSizing;
        if (saved.columnOrder) table.setColumnOrder(saved.columnOrder);
        if (saved.hiddenColumns) table.setColumnVisibility(toIds(saved.hiddenColumns, false));
        if (saved.pinnedColumns) table.setColumnPinning(saved.pinnedColumns);
        if (saved.expanded && saved.expanded.length) setExpanded(toIds(saved.expanded));
        if (saved.selection) setSelection(toSelection(saved.selection));
        if (saved.density) setDensity(saved.density);
        if (saved.page || saved.pageSize)
            setPagination({ pageIndex: (saved.page ?? 1) - 1, pageSize: saved.pageSize ?? pagination.value.pageSize });
    }
    watch(tableState, (state) => saveTableState(props.stateKey!, state, props.stateStorage), { deep: true });
});
/** Forgets the saved state (`stateKey`) */
function clearState() {
    if (props.stateKey) clearTableState(props.stateKey, props.stateStorage);
}

const paged = computed(() => !!props.pageSize);
const total = computed(() =>
    serverMode.value ? (serverRowCount.value ?? tableData.value.length) : table.getPrePaginatedRowModel().rows.length
);
const pageSizeItems = computed(() =>
    (props.pageSizeOptions ?? []).map((option) => ({ value: String(option), label: String(option) }))
);
const showToolbar = computed(
    () =>
        !!props.find ||
        !!props.search ||
        !!props.columnToggle ||
        !!props.exportFilename ||
        !!props.densityToggle ||
        !!props.fullscreenToggle ||
        !!props.filterToggle ||
        advancedEditor.value ||
        !!slots.toolbar ||
        !!slots.toolbarStart ||
        !!slots.toolbarEnd
);
const searchQuery = computed(() => (props.highlightSearch ? globalFilter.value : ''));
/** Hits of the search or of "find in the table" are marked */
const markQuery = computed(() => (findActive.value ? findQuery.value.trim() : searchQuery.value));
/** Text of the status region: moved rows and columns, rows after filtering, the state of a data source */
const statusMessage = computed(() => {
    if (statusText.value) return statusText.value;
    if (props.dataSource)
        return sourceError.value ? '' : dataAnnouncement(sourceState.value, translations, localeContext.value.locale);
    return filtering.value ? t.results(table.getFilteredRowModel().rows.length) : '';
});

// Loading: placeholder rows instead of the rows; messages without rows
const skeleton = computed(() => busy.value && props.loadingVariant === 'skeleton');
const skeletonRows = computed(() => Math.min(items.value.length || props.pageSize || 5, 50));
/** No row left by the filters or the search (not: no data) – only with noResults/noResultsText */
const noResults = computed(
    () =>
        filtering.value &&
        (serverMode.value || tableData.value.length > 0) &&
        (!!slots.noResults || props.noResultsText !== undefined)
);

// Status bar: rows, filtered, selected and the totals of the selected numbers
const statusTotals = computed(() => {
    if (!props.statusBar) return [];
    const rows = table.getSelectedRowModel().flatRows.filter((row) => !row.getIsGrouped());
    if (!rows.length) return [];
    return leafColumns.value.flatMap((column) => {
        const def = columnById.value.get(column.id)!;
        const summary = numberSummary(rows.map((row) => rawValue(def, row.original)));
        if (!summary) return [];
        const first = rows[0]!.original;
        return [
            {
                id: column.id,
                text: `${def.header}: ${t.aggregates.sum!(formatAggregate(def, summary.sum, first))} · ${t.aggregates
                    .avg!(formatAggregate(def, summary.avg, first))}`,
            },
        ];
    });
});
const allRowCount = computed(() =>
    serverMode.value ? (serverRowCount.value ?? tableData.value.length) : table.getCoreRowModel().rows.length
);

// Data source: asks for the page whenever page, sorting, filters, search or grouping change; back to page 1 when
// the sorting, the filters or the search change; the search waits for a pause in typing
const sourceQuery = computed(() => ({
    page: pagination.value.pageIndex + 1,
    pageSize: props.pageSize ? pagination.value.pageSize : 0,
    sorting: sorting.value.map((sort) => ({ id: sort.id, desc: sort.desc })),
    filters: toFilters(columnFilters.value) as Record<string, unknown>,
    search: globalFilter.value,
    groupBy: grouping.value,
    // The advanced filter goes to the server (it does not filter the page locally)
    ...(advancedActive.value ? { condition: advancedTree.value } : {}),
}));
const sourceKey = computed(() => queryKey(sourceQuery.value));
const shapeKey = computed(() => queryKey({ ...sourceQuery.value, page: undefined, pageSize: undefined }));
let lastSearch = globalFilter.value;
function loadSource(key: string, shape: string, previousShape: string | undefined) {
    const source = sourceController();
    if (!source) return;
    if (previousShape !== undefined && previousShape !== shape && pagination.value.pageIndex !== 0) {
        setPagination({ ...pagination.value, pageIndex: 0 });
        return;
    }
    const typed = lastSearch !== globalFilter.value;
    lastSearch = globalFilter.value;
    void source.load(JSON.parse(key), { debounce: typed });
}
// After mounting – the server renders without asking
onMounted(() => loadSource(sourceKey.value, shapeKey.value, undefined));
watch([sourceKey, shapeKey, () => !!props.dataSource] as const, ([key, shape], [, previousShape]) =>
    loadSource(key, shape, previousShape)
);

defineExpose({
    exportCsv,
    generateCsv,
    clearState,
    /** Downloads the rows as an Excel file (.xlsx) */
    exportXlsx,
    /** The Excel file (.xlsx) of the rows as bytes */
    generateXlsx,
    /** Prints all filtered and sorted rows, the header on every page, without controls */
    print,
    /** Asks the data source again, past the cache */
    refresh,
    /** Undoes the last cell change – like Ctrl+Z */
    undo,
    /** Redoes the last undone cell change – like Ctrl+Y */
    redo,
});
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const bottomEndPositioning = { placement: 'bottom-end', gutter: 4 } as const;
</script>

<template>
    <Teleport to="body" :disabled="!fullscreen">
        <div
            ref="root"
            v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
            :role="fullscreen ? 'dialog' : undefined"
            :aria-modal="fullscreen || undefined"
            :aria-label="fullscreen ? caption : undefined"
            @keydown="onRootKey"
        >
            <div v-if="showToolbar" :class="styles.toolbar()">
                <slot name="toolbarStart" />
                <Input
                    v-if="search"
                    type="search"
                    size="sm"
                    :leading-icon="Search"
                    :class="styles.search()"
                    :placeholder="t.searchPlaceholder"
                    :aria-label="t.search(caption)"
                    :model-value="globalFilter"
                    @update:model-value="table.setGlobalFilter($event ?? '')"
                />
                <slot name="toolbar" />
                <div :class="styles.toolbarEnd()">
                    <slot name="toolbarEnd" />
                    <IconButton
                        v-if="find"
                        data-find-toggle=""
                        :icon="TextSearch"
                        :label="t.find"
                        variant="outline"
                        size="sm"
                        :aria-expanded="findOpen"
                        @click="toggleFind"
                    />
                    <Button
                        v-if="advancedEditor"
                        variant="outline"
                        size="sm"
                        :leading-icon="ListFilter"
                        :aria-expanded="advancedOpen"
                        :aria-controls="`${id}-advanced`"
                        @click="advancedOpen = !advancedOpen"
                        >{{ translations.conditionBuilder.advanced }}</Button
                    >
                    <IconButton
                        v-if="filterToggle"
                        :icon="Filter"
                        :label="t.filterToggle"
                        variant="outline"
                        size="sm"
                        :aria-pressed="showFilters"
                        @click="toggleFilters"
                    />
                    <Menu.Root v-if="densityToggle" :positioning="bottomEndPositioning" lazy-mount unmount-on-exit>
                        <Menu.Trigger as-child>
                            <IconButton :icon="Rows3" :label="t.density" variant="outline" size="sm" />
                        </Menu.Trigger>
                        <Teleport to="body">
                            <Menu.Positioner>
                                <Menu.Content :class="menuStyles.content()">
                                    <Menu.RadioItemGroup
                                        :model-value="density"
                                        @update:model-value="setDensity($event as Density)"
                                    >
                                        <Menu.RadioItem
                                            v-for="option in ['sm', 'md', 'lg'] as const"
                                            :key="option"
                                            :value="option"
                                            :class="menuStyles.item()"
                                        >
                                            <Menu.ItemIndicator>
                                                <Check :class="styles.menuCheck()" aria-hidden="true" />
                                            </Menu.ItemIndicator>
                                            <Menu.ItemText :class="menuStyles.label()">{{
                                                t.densities[option]
                                            }}</Menu.ItemText>
                                        </Menu.RadioItem>
                                    </Menu.RadioItemGroup>
                                </Menu.Content>
                            </Menu.Positioner>
                        </Teleport>
                    </Menu.Root>
                    <Menu.Root v-if="columnToggle" :positioning="bottomEndPositioning" lazy-mount unmount-on-exit>
                        <Menu.Trigger as-child>
                            <Button variant="outline" size="sm" :leading-icon="Columns3">{{ t.columns }}</Button>
                        </Menu.Trigger>
                        <Teleport to="body">
                            <Menu.Positioner>
                                <Menu.Content :class="menuStyles.content()">
                                    <template
                                        v-for="(block, blockIndex) in columnBlocks"
                                        :key="block.def ? `group:${block.def.id}` : 'columns'"
                                    >
                                        <!-- A column group: shows or hides all its columns, moves as a whole -->
                                        <Menu.CheckboxItem
                                            v-if="block.def?.columns"
                                            :value="`group:${block.def.id}`"
                                            :checked="
                                                block.leaves
                                                    .filter((item) => item.getCanHide())
                                                    .every((item) => item.getIsVisible())
                                            "
                                            :disabled="!block.leaves.some((item) => item.getCanHide())"
                                            :close-on-select="false"
                                            :class="menuStyles.item()"
                                            @update:checked="setBlockVisible(block.leaves, $event)"
                                        >
                                            <Menu.ItemIndicator>
                                                <Check :class="styles.menuCheck()" aria-hidden="true" />
                                            </Menu.ItemIndicator>
                                            <Menu.ItemText :class="menuStyles.label()">{{
                                                block.def.header
                                            }}</Menu.ItemText>
                                        </Menu.CheckboxItem>
                                        <Menu.CheckboxItem
                                            v-for="column in block.leaves.filter((item) => item.getCanHide())"
                                            :key="column.id"
                                            :value="column.id"
                                            :checked="column.getIsVisible()"
                                            :close-on-select="false"
                                            :class="
                                                menuStyles.item(
                                                    block.def?.columns ? { class: styles.columnGroupItem() } : {}
                                                )
                                            "
                                            @update:checked="column.toggleVisibility($event)"
                                        >
                                            <Menu.ItemIndicator>
                                                <Check :class="styles.menuCheck()" aria-hidden="true" />
                                            </Menu.ItemIndicator>
                                            <Menu.ItemText :class="menuStyles.label()">{{
                                                label(column)
                                            }}</Menu.ItemText>
                                        </Menu.CheckboxItem>
                                        <template v-if="block.def?.columns && reorderableColumns">
                                            <Menu.Item
                                                v-for="direction in [-1, 1] as const"
                                                :key="direction"
                                                :value="`group-${direction < 0 ? 'earlier' : 'later'}:${block.def.id}`"
                                                :disabled="
                                                    direction < 0
                                                        ? blockIndex === 0
                                                        : blockIndex === columnBlocks.length - 1
                                                "
                                                :close-on-select="false"
                                                :class="menuStyles.item({ class: styles.columnGroupItem() })"
                                                @select="moveColumnGroup(block.def.id, direction)"
                                            >
                                                <Menu.ItemText :class="menuStyles.label()">{{
                                                    direction < 0
                                                        ? t.columnGroupEarlier(block.def.header)
                                                        : t.columnGroupLater(block.def.header)
                                                }}</Menu.ItemText>
                                            </Menu.Item>
                                        </template>
                                    </template>
                                </Menu.Content>
                            </Menu.Positioner>
                        </Teleport>
                    </Menu.Root>
                    <template v-if="exportFilename">
                        <MenuComponent v-if="exportItems.length > 1" :items="exportItems" @select="onExportSelect">
                            <Button variant="outline" size="sm" :leading-icon="Download">{{ exportLabel }}</Button>
                        </MenuComponent>
                        <Button
                            v-else
                            variant="outline"
                            size="sm"
                            :leading-icon="Download"
                            @click="exportAs(formats[0]!, false)"
                        >
                            {{ exportLabel }}
                        </Button>
                    </template>
                    <IconButton
                        v-if="fullscreenToggle"
                        data-fullscreen-toggle=""
                        :icon="fullscreen ? Minimize2 : Maximize2"
                        :label="fullscreen ? t.exitFullscreen : t.fullscreen"
                        variant="outline"
                        size="sm"
                        @click="toggleFullscreen"
                    />
                </div>
            </div>
            <div v-if="advancedEditor && advancedOpen" :id="`${id}-advanced`" :class="styles.advancedFilter()">
                <slot
                    name="advancedFilter"
                    :fields="advancedFields"
                    :value="advancedTree"
                    :set-value="setAdvancedTree"
                    :label="translations.conditionBuilder.advanced"
                />
            </div>
            <div v-if="find && findOpen" :class="styles.findBar()" role="search" :aria-label="t.find">
                <Input
                    type="search"
                    size="sm"
                    data-find-input=""
                    :leading-icon="TextSearch"
                    :class="styles.findInput()"
                    :placeholder="t.searchPlaceholder"
                    :aria-label="t.find"
                    :model-value="findQuery"
                    @update:model-value="onFindChange($event ?? '')"
                    @keydown="onFindKey"
                />
                <span :class="styles.findCount()" aria-live="polite">{{
                    findQuery.trim()
                        ? t.findMatches(
                              matches.length ? Math.min(findIndex, matches.length - 1) + 1 : 0,
                              matches.length
                          )
                        : ''
                }}</span>
                <IconButton
                    :icon="ChevronUp"
                    :label="t.findPrevious"
                    variant="text"
                    size="sm"
                    :disabled="!matches.length"
                    @click="goToMatch(findIndex - 1)"
                />
                <IconButton
                    :icon="ChevronDown"
                    :label="t.findNext"
                    variant="text"
                    size="sm"
                    :disabled="!matches.length"
                    @click="goToMatch(findIndex + 1)"
                />
                <IconButton :icon="X" :label="t.findClose" variant="text" size="sm" @click="toggleFind" />
            </div>
            <div v-if="editMode === 'batch'" :class="styles.batchBar()">
                <span :class="styles.batchCount()">{{ t.changes(pendingCount) }}</span>
                <Button variant="text" size="sm" :leading-icon="Undo2" :disabled="!canUndo" @click="undo">
                    {{ t.undo }}
                </Button>
                <Button variant="text" size="sm" :leading-icon="Redo2" :disabled="!canRedo" @click="redo">
                    {{ t.redo }}
                </Button>
                <Button variant="outline" size="sm" :disabled="!pendingCount" @click="discardChanges">
                    {{ t.discardChanges }}
                </Button>
                <Button size="sm" :disabled="!pendingCount" @click="saveChanges">{{ t.saveChanges }}</Button>
            </div>
            <p role="status" :class="styles.status()">
                {{ statusMessage }}
            </p>
            <div v-if="paged && paginatorPosition === 'top'" :class="styles.footer()">
                <div v-if="pageSizeItems.length" :class="styles.pageSize()">
                    <span aria-hidden="true">{{ t.rowsPerPage }}</span>
                    <Select
                        :class="styles.pageSizeSelect()"
                        :aria-label="t.rowsPerPage"
                        :items="pageSizeItems"
                        :model-value="String(pagination.pageSize)"
                        @update:model-value="table.setPageSize(Number($event))"
                    />
                </div>
                <Pagination
                    :count="total"
                    :page-size="pagination.pageSize"
                    :page="pagination.pageIndex + 1"
                    :translations="{ rootLabel: `${caption}: ${translations.pagination.rootLabel}` }"
                    @update:page="table.setPageIndex($event - 1)"
                />
            </div>
            <div
                ref="scroll"
                :class="styles.scroll()"
                :style="scrollHeight ? { maxHeight: scrollHeight } : undefined"
                @scroll="scrollHeight ? onScroll($event) : undefined"
            >
                <table
                    ref="tableElement"
                    :class="styles.table({ class: sized ? styles.fixedLayout() : undefined })"
                    :style="
                        sized ? { minWidth: `${table.getTotalSize() + leadingWidth + trailingWidth}px` } : undefined
                    "
                    :aria-busy="busy || undefined"
                    :aria-rowcount="virtualOn ? items.length + headerRows.length : undefined"
                    :role="grid ? (treeGrid ? 'treegrid' : 'grid') : undefined"
                    :aria-multiselectable="grid && ((selectable && multiple) || cellSelection) ? 'true' : undefined"
                    :tabindex="(cellSelection || editMode === 'batch') && !grid ? -1 : undefined"
                    @keydown="onTableKey"
                    @focusin="onGridFocus"
                >
                    <caption :class="styles.caption()">
                        {{
                            caption
                        }}
                    </caption>
                    <thead ref="head" :class="styles.head()">
                        <tr v-for="(cells, rowIndex) in headerRows" :key="rowIndex" :class="styles.headRow()">
                            <template v-if="rowIndex === 0">
                                <th
                                    v-for="utility in leading"
                                    :key="utility"
                                    scope="col"
                                    :rowspan="headerRows.length"
                                    :class="styles.th({ class: utilityClass(utility, true) })"
                                    :style="utilityStyle(utility)"
                                >
                                    <Checkbox
                                        v-if="utility === 'select' && multiple"
                                        :checked="allSelected"
                                        :aria-label="
                                            selectAllLabel ?? (selectAllMode === 'all' ? t.selectAllRows : t.selectAll)
                                        "
                                        @update:checked="onSelectAll($event === true)"
                                    />
                                    <span v-else-if="utility === 'select'" :class="styles.srOnly()">{{
                                        t.select
                                    }}</span>
                                    <button
                                        v-else-if="utility === 'expand'"
                                        type="button"
                                        :class="styles.expander()"
                                        :aria-label="allExpanded ? t.collapseAll : t.expandAll"
                                        @click="table.toggleAllRowsExpanded(!allExpanded)"
                                    >
                                        <ChevronsDownUp
                                            v-if="allExpanded"
                                            :class="styles.expanderIcon()"
                                            aria-hidden="true"
                                        />
                                        <ChevronsUpDown v-else :class="styles.expanderIcon()" aria-hidden="true" />
                                    </button>
                                    <template v-else-if="utility === 'number'">{{ t.rowNumber }}</template>
                                    <span v-else :class="styles.srOnly()">{{ t.reorder }}</span>
                                </th>
                            </template>
                            <template v-for="cell in cells" :key="cell.header.id">
                                <th
                                    v-if="cell.group"
                                    scope="colgroup"
                                    :colspan="cell.header.colSpan"
                                    :rowspan="cell.rowSpan > 1 ? cell.rowSpan : undefined"
                                    :class="styles.th({ class: styles.groupTh() })"
                                >
                                    {{ label(cell.header.column) }}
                                </th>
                                <th
                                    v-else
                                    :id="spanning ? headerId(cell.header.column.id) : undefined"
                                    scope="col"
                                    :rowspan="cell.rowSpan > 1 ? cell.rowSpan : undefined"
                                    :class="
                                        styleFor(cell.header.column.id).th({
                                            class: [
                                                pinClass(cell.header.column.id, true),
                                                reorderableColumns ? styles.dropTargetColumn() : '',
                                            ],
                                        })
                                    "
                                    :style="cellStyle(cell.header.column.id, true)"
                                    :aria-sort="ariaSort(cell.header.column.id)"
                                    :draggable="
                                        canMove(cell.header.column.id) && !cell.header.column.getIsPinned()
                                            ? 'true'
                                            : undefined
                                    "
                                    :data-drop="columnDrop(cell.header.column.id)"
                                    :data-dragging="dragColumn === cell.header.column.id || undefined"
                                    @dragstart="onColumnDragStart(cell.header.column.id, $event)"
                                    @dragover="onColumnDragOver(cell.header.column.id, $event)"
                                    @dragleave="dropColumn = null"
                                    @drop="onColumnDrop"
                                    @dragend="onColumnDragEnd"
                                >
                                    <div :class="styleFor(cell.header.column.id).headContent()">
                                        <button
                                            v-if="cell.header.column.getCanSort()"
                                            type="button"
                                            :class="styles.sortButton()"
                                            @click="onSort(cell.header.column.id, $event)"
                                        >
                                            <span :class="styles.headLabel()">{{ label(cell.header.column) }}</span>
                                            <ArrowUp
                                                v-if="cell.header.column.getIsSorted() === 'asc'"
                                                :class="styles.sortIcon()"
                                                aria-hidden="true"
                                            />
                                            <ArrowDown
                                                v-else-if="cell.header.column.getIsSorted() === 'desc'"
                                                :class="styles.sortIcon()"
                                                aria-hidden="true"
                                            />
                                            <ArrowUpDown v-else :class="styles.sortIcon()" aria-hidden="true" />
                                            <template v-if="sorting.length > 1 && sortPosition(cell.header.column.id)">
                                                <span :class="styles.sortBadge()" aria-hidden="true">{{
                                                    sortPosition(cell.header.column.id)
                                                }}</span>
                                                <span :class="styles.srOnly()">{{
                                                    t.sortPriority(
                                                        sortPosition(cell.header.column.id),
                                                        cell.header.column.getIsSorted() === 'desc'
                                                    )
                                                }}</span>
                                            </template>
                                        </button>
                                        <span v-else :class="styles.headLabel()">{{ label(cell.header.column) }}</span>
                                        <FilterMenu
                                            v-if="menuFilters && filterable(columnById.get(cell.header.column.id))"
                                            :header="label(cell.header.column)"
                                            :type="columnById.get(cell.header.column.id)!.filter ?? 'text'"
                                            :model-value="filterValue(cell.header.column.id)"
                                            :options="filterOptions(columnById.get(cell.header.column.id)!)"
                                            :match-modes="columnById.get(cell.header.column.id)!.matchModes"
                                            :max-constraints="maxConstraints"
                                            @update:model-value="setFilter(cell.header.column.id, $event)"
                                        >
                                            <template v-if="hasFilterSlot(cell.header.column.id)" #value="input">
                                                <slot
                                                    :name="`filter-${cell.header.column.id}`"
                                                    v-bind="{
                                                        ...input,
                                                        column: columnById.get(cell.header.column.id)!,
                                                    }"
                                                />
                                            </template>
                                        </FilterMenu>
                                        <MenuComponent
                                            v-if="showColumnMenu"
                                            :items="columnMenuItems(cell.header.column)"
                                            @select="onColumnMenu(cell.header.column, $event)"
                                        >
                                            <button
                                                type="button"
                                                :class="styles.headButton()"
                                                :data-column-menu="cell.header.column.id"
                                                :aria-label="t.columnMenu(label(cell.header.column))"
                                            >
                                                <EllipsisVertical :class="styles.headButtonIcon()" aria-hidden="true" />
                                            </button>
                                        </MenuComponent>
                                    </div>
                                    <div
                                        v-if="resizable"
                                        role="separator"
                                        aria-orientation="vertical"
                                        :aria-label="t.resize(label(cell.header.column))"
                                        :aria-valuenow="cell.header.column.getSize()"
                                        :aria-valuemin="MIN_WIDTH"
                                        :aria-valuemax="1200"
                                        tabindex="0"
                                        :class="styles.resizer()"
                                        :data-resizing="cell.header.column.getIsResizing() || undefined"
                                        @mousedown="cell.header.getResizeHandler()($event)"
                                        @touchstart="cell.header.getResizeHandler()($event)"
                                        @keydown="onResizeKey(cell.header.column.id, $event)"
                                        @dblclick="autoSize(cell.header.column.id, $event)"
                                    />
                                </th>
                            </template>
                            <th
                                v-if="rowIndex === 0 && trailing.length"
                                scope="col"
                                :rowspan="headerRows.length"
                                :class="styles.th({ class: utilityClass('actions', true) })"
                                :style="utilityStyle('actions')"
                            >
                                <span :class="styles.srOnly()">{{ t.actions }}</span>
                            </th>
                        </tr>
                        <tr v-if="hasRowFilters" :class="styles.filterRow()">
                            <td
                                v-for="utility in leading"
                                :key="utility"
                                :class="utilityClass(utility, true)"
                                :style="utilityStyle(utility)"
                            />
                            <td
                                v-for="column in leafColumns"
                                :key="column.id"
                                :class="styleFor(column.id).filterCell({ class: pinClass(column.id, true) })"
                                :style="cellStyle(column.id, true)"
                            >
                                <template v-if="filterable(columnById.get(column.id))">
                                    <slot
                                        v-if="hasFilterSlot(column.id)"
                                        :name="`filter-${column.id}`"
                                        v-bind="{
                                            value: rowFilterValue(columnById.get(column.id)!),
                                            setValue: (value: unknown) =>
                                                setRowFilter(columnById.get(column.id)!, value),
                                            column: columnById.get(column.id)!,
                                        }"
                                    />
                                    <div
                                        v-else-if="isRangeMatchMode(rowMode(columnById.get(column.id)!))"
                                        :class="styles.filterRowRange()"
                                    >
                                        <ValueInput
                                            v-for="part in [0, 1] as const"
                                            :key="part"
                                            :type="rowInput(columnById.get(column.id)!)"
                                            :label="`${t.filter(label(column))}, ${part ? t.to : t.from}`"
                                            :options="filterOptions(columnById.get(column.id)!)"
                                            :model-value="rangePart(columnById.get(column.id)!, part)"
                                            @update:model-value="setRowRange(columnById.get(column.id)!, part, $event)"
                                        />
                                    </div>
                                    <ValueInput
                                        v-else
                                        :type="rowInput(columnById.get(column.id)!)"
                                        :label="t.filter(label(column))"
                                        :options="filterOptions(columnById.get(column.id)!)"
                                        any
                                        :model-value="rowFilterValue(columnById.get(column.id)!)"
                                        @update:model-value="setRowFilter(columnById.get(column.id)!, $event)"
                                    />
                                </template>
                            </td>
                            <td
                                v-if="trailing.length"
                                :class="utilityClass('actions', true)"
                                :style="utilityStyle('actions')"
                            />
                        </tr>
                    </thead>
                    <tbody
                        v-if="frozen.length"
                        :class="styles.frozenBody()"
                        :style="scrollHeight ? { top: `${headHeight}px` } : undefined"
                    >
                        <tr
                            v-for="row in frozen"
                            :key="row.id"
                            :class="styles.row({ class: rowClass?.(row.original) })"
                            :data-state="isSelected(row) ? 'selected' : undefined"
                            :aria-selected="grid && selectable ? isSelected(row) : undefined"
                            :data-row-id="row.id"
                        >
                            <td
                                v-for="utility in leading"
                                :key="utility"
                                :class="styles.td({ class: utilityClass(utility, false) })"
                                :style="utilityStyle(utility)"
                            />
                            <td
                                v-for="cell in row.getVisibleCells()"
                                :key="cell.id"
                                :class="styleFor(cell.column.id).td({ class: pinClass(cell.column.id, false) })"
                                :style="cellStyle(cell.column.id, false)"
                            >
                                <!-- Editable like the other rows: editor, edit button -->
                                <div
                                    v-if="
                                        columnById.get(cell.column.id)?.editable &&
                                        ((cellEditing &&
                                            editing?.rowId === row.id &&
                                            editing.columnId === cell.column.id) ||
                                            (editMode === 'row' && editingRow === row.id))
                                    "
                                    data-editor=""
                                    :class="styles.editor()"
                                    :aria-busy="validating || undefined"
                                    @keydown="
                                        cellEditing
                                            ? onCellEditorKey(row, cell.column.id, $event)
                                            : onRowEditorKey(row, $event)
                                    "
                                    @focusout="
                                        cellEditing ? onCellEditorFocusOut(row, cell.column.id, $event) : undefined
                                    "
                                >
                                    <slot
                                        v-if="slots[`editor-${cell.column.id}`]"
                                        :name="`editor-${cell.column.id}`"
                                        v-bind="editorProps(row, columnById.get(cell.column.id)!)"
                                    />
                                    <ValueInput
                                        v-else
                                        :type="editorType(columnById.get(cell.column.id)!)"
                                        :label="label(cell.column)"
                                        :options="columnById.get(cell.column.id)!.editOptions"
                                        :invalid="!!errors[cell.column.id]"
                                        :model-value="draft[cell.column.id]"
                                        @update:model-value="onDraft(row, columnById.get(cell.column.id)!, $event)"
                                    />
                                    <span
                                        v-if="errors[cell.column.id]"
                                        :id="errorId(row.id, cell.column.id)"
                                        role="alert"
                                        :class="styles.editError()"
                                        >{{ errors[cell.column.id] }}</span
                                    >
                                </div>
                                <button
                                    v-else-if="cellEditing && columnById.get(cell.column.id)?.editable"
                                    type="button"
                                    :class="styleFor(cell.column.id).editButton()"
                                    :data-edit="editKey(row.id, cell.column.id)"
                                    :aria-label="`${t.edit(
                                        label(cell.column),
                                        display(
                                            columnById.get(cell.column.id),
                                            shownValue(row, cell.column.id),
                                            row.original
                                        )
                                    )}${isChanged(row, cell.column.id) ? `, ${t.changed}` : ''}`"
                                    @click="startEdit(row, cell.column.id)"
                                >
                                    <slot
                                        :name="`cell-${cell.column.id}`"
                                        :row="row.original"
                                        :value="shownValue(row, cell.column.id)"
                                    >
                                        {{
                                            display(
                                                columnById.get(cell.column.id),
                                                shownValue(row, cell.column.id),
                                                row.original
                                            )
                                        }}
                                    </slot>
                                </button>
                                <span v-else-if="columnById.get(cell.column.id)?.copyable" :class="styles.copyCell()">
                                    <slot :name="`cell-${cell.column.id}`" :row="row.original" :value="cell.getValue()">
                                        {{ display(columnById.get(cell.column.id), cell.getValue(), row.original) }}
                                    </slot>
                                    <CopyButton
                                        :value="display(columnById.get(cell.column.id), cell.getValue(), row.original)"
                                        :label="
                                            t.copy(
                                                label(cell.column),
                                                display(columnById.get(cell.column.id), cell.getValue(), row.original)
                                            )
                                        "
                                    />
                                </span>
                                <slot
                                    v-else
                                    :name="`cell-${cell.column.id}`"
                                    :row="row.original"
                                    :value="cell.getValue()"
                                >
                                    {{ display(columnById.get(cell.column.id), cell.getValue(), row.original) }}
                                </slot>
                            </td>
                            <td
                                v-if="trailing.length"
                                :class="styles.td({ class: utilityClass('actions', false) })"
                                :style="utilityStyle('actions')"
                            >
                                <div v-if="editMode === 'row' && editable" :class="styles.editActions()">
                                    <template v-if="editingRow === row.id">
                                        <IconButton
                                            :icon="Check"
                                            :label="t.saveRow(labelFor(row.original, row.index))"
                                            variant="text"
                                            size="sm"
                                            @click="finishRowEdit(row, true)"
                                        />
                                        <IconButton
                                            :icon="X"
                                            :label="t.cancelEdit(labelFor(row.original, row.index))"
                                            variant="text"
                                            size="sm"
                                            @click="finishRowEdit(row, false)"
                                        />
                                    </template>
                                    <IconButton
                                        v-else
                                        :data-row-edit="row.id"
                                        :icon="Pencil"
                                        :label="t.editRow(labelFor(row.original, row.index))"
                                        variant="text"
                                        size="sm"
                                        @click="startRowEdit(row)"
                                    />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    <BodyWrap
                        :enabled="!!contextMenu && !!rowActions"
                        :items="contextRow ? actionsFor(contextRow) : []"
                        :label="contextRow ? t.rowActions(labelFor(contextRow.original, contextRow.index)) : undefined"
                        @select="onRowAction(contextRow, $event)"
                    >
                        <tbody @contextmenu.capture="onContextTarget">
                            <tr v-if="items.length === 0 && !skeleton">
                                <td :colspan="columnCount" :class="styles.message()">
                                    <span v-if="sourceError" :class="styles.errorContent()">
                                        <span role="alert">{{ translations.dataSource.error }}</span>
                                        <Button variant="outline" size="sm" @click="refresh">{{
                                            translations.dataSource.retry
                                        }}</Button>
                                    </span>
                                    <slot v-else-if="busy" name="loadingContent">
                                        <span :class="styles.messageContent()">
                                            <Spinner size="sm" :label="loadingText ?? translations.common.loading" />{{
                                                loadingText ?? translations.common.loading
                                            }}
                                        </span>
                                    </slot>
                                    <slot v-else-if="noResults" name="noResults">{{
                                        noResultsText ?? emptyText ?? translations.common.empty
                                    }}</slot>
                                    <slot v-else name="empty">{{ emptyText ?? translations.common.empty }}</slot>
                                </td>
                            </tr>
                            <!-- Loading with placeholder rows (loadingVariant="skeleton") -->
                            <template v-if="skeleton">
                                <tr v-for="index in skeletonRows" :key="`skeleton-${index}`" :class="styles.row()">
                                    <td
                                        v-for="utility in leading"
                                        :key="utility"
                                        :class="styles.td({ class: utilityClass(utility, false) })"
                                        :style="utilityStyle(utility)"
                                    />
                                    <td
                                        v-for="column in leafColumns"
                                        :key="column.id"
                                        :class="styleFor(column.id).td({ class: pinClass(column.id, false) })"
                                        :style="cellStyle(column.id, false)"
                                    >
                                        <Skeleton />
                                    </td>
                                    <td
                                        v-if="trailing.length"
                                        :class="styles.td({ class: utilityClass('actions', false) })"
                                        :style="utilityStyle('actions')"
                                    />
                                </tr>
                            </template>
                            <tr v-if="paddingTop > 0 && !skeleton" :class="styles.spacer()" aria-hidden="true">
                                <td
                                    :colspan="columnCount"
                                    :class="styles.spacerCell()"
                                    :style="{ height: `${paddingTop}px` }"
                                />
                            </tr>
                            <template v-for="item in skeleton ? [] : shownItems" :key="item.key">
                                <!-- Group header: open/close the rows of one value, aggregates per column -->
                                <tr
                                    v-if="item.kind === 'group'"
                                    :ref="measure"
                                    :class="
                                        styles.groupRow(
                                            dragRow ? { class: [styles.dropTarget(), styles.dropInside()] } : {}
                                        )
                                    "
                                    :data-index="item.index"
                                    :aria-rowindex="virtualOn ? item.index + headerRows.length + 1 : undefined"
                                    :data-drop="dragRow ? rowDrop(item.row.id) : undefined"
                                    @dragover="reorderableRows ? onGroupDragOver(item.row, $event) : undefined"
                                    @dragleave="reorderableRows ? (dropRow = null) : undefined"
                                    @drop="reorderableRows ? onRowDrop($event) : undefined"
                                >
                                    <td
                                        :colspan="aggregated ? leading.length + 1 : columnCount"
                                        :class="styles.groupCell()"
                                    >
                                        <div
                                            :class="styles.treeCell()"
                                            :style="{ paddingInlineStart: `${item.row.depth * 20}px` }"
                                        >
                                            <button
                                                type="button"
                                                :class="styles.expander()"
                                                :aria-expanded="item.row.getIsExpanded()"
                                                :aria-label="
                                                    t.group(
                                                        columnById.get(item.row.groupingColumnId!)?.header ?? '',
                                                        display(
                                                            columnById.get(item.row.groupingColumnId!),
                                                            item.row.groupingValue,
                                                            item.row.original
                                                        ),
                                                        item.row.getLeafRows().length
                                                    )
                                                "
                                                @click="item.row.getToggleExpandedHandler()()"
                                            >
                                                <ChevronRight
                                                    :class="styles.expanderIcon()"
                                                    :data-state="item.row.getIsExpanded() ? 'open' : 'closed'"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                            <span :class="styles.groupLabel()">{{
                                                display(
                                                    columnById.get(item.row.groupingColumnId!),
                                                    item.row.groupingValue,
                                                    item.row.original
                                                )
                                            }}</span>
                                            <span :class="styles.groupCount()"
                                                >({{ item.row.getLeafRows().length }})</span
                                            >
                                        </div>
                                    </td>
                                    <template v-if="aggregated">
                                        <td
                                            v-for="column in leafColumns.slice(1)"
                                            :key="column.id"
                                            :class="styleFor(column.id).groupAggregate()"
                                        >
                                            {{
                                                aggregateOf(
                                                    columnById.get(column.id)!,
                                                    item.row.getLeafRows() as TableRow[]
                                                )
                                            }}
                                        </td>
                                        <td v-if="trailing.length" :class="styles.groupAggregate()" />
                                    </template>
                                </tr>
                                <!-- Details of an expanded row -->
                                <tr
                                    v-else-if="item.kind === 'expansion'"
                                    :id="detailsId(item.row)"
                                    :ref="measure"
                                    :class="styles.expansionRow()"
                                    :data-index="item.index"
                                    :aria-rowindex="virtualOn ? item.index + headerRows.length + 1 : undefined"
                                >
                                    <td :colspan="columnCount" :class="styles.expansionCell()">
                                        <slot name="expansion" :row="item.row.original" :row-id="item.row.id" />
                                    </td>
                                </tr>
                                <tr
                                    v-else
                                    :ref="measure"
                                    :class="
                                        styles.row({
                                            class: [
                                                reorderableRows ? styles.dropTarget() : '',
                                                reorderableRows && treeRows && dragRow ? styles.dropInside() : '',
                                                rowHref?.(item.row.original) ? styles.linkRow() : '',
                                                rowClass?.(item.row.original),
                                            ],
                                        })
                                    "
                                    :data-state="isSelected(item.row) ? 'selected' : undefined"
                                    :aria-selected="grid && selectable ? isSelected(item.row) : undefined"
                                    :data-row-id="item.row.id"
                                    :data-index="item.index"
                                    :aria-rowindex="virtualOn ? item.index + headerRows.length + 1 : undefined"
                                    :aria-level="treeGrid ? item.row.depth + 1 : undefined"
                                    :aria-expanded="
                                        treeGrid && item.row.getCanExpand() ? item.row.getIsExpanded() : undefined
                                    "
                                    :draggable="armedRow === item.row.id ? 'true' : undefined"
                                    :data-drop="rowDrop(item.row.id)"
                                    :data-dragging="dragRow === item.row.id || undefined"
                                    @click="onRowClick(item.row, $event)"
                                    @auxclick="onRowAuxClick(item.row, $event)"
                                    @dragstart="onRowDragStart(item.row, $event)"
                                    @dragover="onRowDragOver(item.row, $event)"
                                    @dragleave="dropRow = null"
                                    @drop="onRowDrop"
                                    @dragend="onRowDragEnd"
                                >
                                    <td
                                        v-for="utility in leading"
                                        :key="utility"
                                        :class="styles.td({ class: utilityClass(utility, false) })"
                                        :style="utilityStyle(utility)"
                                    >
                                        <button
                                            v-if="utility === 'drag'"
                                            type="button"
                                            :class="styles.dragHandle()"
                                            :data-drag-handle="item.row.id"
                                            :aria-label="t.moveRow(labelFor(item.row.original, item.row.index))"
                                            :aria-keyshortcuts="
                                                treeRows
                                                    ? 'ArrowUp ArrowDown ArrowLeft ArrowRight'
                                                    : 'ArrowUp ArrowDown'
                                            "
                                            @keydown="onHandleKey(item.row, $event)"
                                            @pointerdown="armedRow = item.row.id"
                                            @pointerup="armedRow = dragRow ? armedRow : null"
                                        >
                                            <GripVertical :class="styles.dragIcon()" aria-hidden="true" />
                                        </button>
                                        <span
                                            v-else-if="utility === 'select' && multiple"
                                            @click.capture="onSelectCellIntent"
                                            @keydown.capture="onSelectCellIntent"
                                        >
                                            <Checkbox
                                                :checked="isSelected(item.row)"
                                                :disabled="!item.row.getCanSelect()"
                                                :aria-label="t.selectRow(labelFor(item.row.original, item.row.index))"
                                                @update:checked="selectRow(item.row, $event === true, rangeIntent)"
                                            />
                                        </span>
                                        <input
                                            v-else-if="utility === 'select'"
                                            type="radio"
                                            :name="radioName"
                                            :class="styles.radio()"
                                            :checked="isSelected(item.row)"
                                            :disabled="!item.row.getCanSelect()"
                                            :aria-label="t.selectRow(labelFor(item.row.original, item.row.index))"
                                            @change="selectRow(item.row, true)"
                                        />
                                        <button
                                            v-else-if="utility === 'expand'"
                                            type="button"
                                            :class="styles.expander()"
                                            :aria-expanded="item.row.getIsExpanded()"
                                            :aria-controls="item.row.getIsExpanded() ? detailsId(item.row) : undefined"
                                            :aria-label="t.details(labelFor(item.row.original, item.row.index))"
                                            @click="item.row.toggleExpanded()"
                                        >
                                            <ChevronRight
                                                :class="styles.expanderIcon()"
                                                :data-state="item.row.getIsExpanded() ? 'open' : 'closed'"
                                                aria-hidden="true"
                                            />
                                        </button>
                                        <span v-else :class="styles.rowNumber()">{{
                                            rowNumberById.get(item.row.id)
                                        }}</span>
                                    </td>
                                    <template v-for="(cell, cellIndex) in item.row.getVisibleCells()" :key="cell.id">
                                        <!-- Not drawn when a merged cell covers it -->
                                        <td
                                            v-if="cellShown(item.index, cellIndex)"
                                            :class="
                                                styleFor(cell.column.id).td({
                                                    class: [
                                                        pinClass(cell.column.id, false),
                                                        ...cellExtras(item.row, cell.column.id, item.index, cellIndex)
                                                            .className,
                                                    ],
                                                })
                                            "
                                            :style="cellStyle(cell.column.id, false)"
                                            v-bind="
                                                cellExtras(item.row, cell.column.id, item.index, cellIndex).attributes
                                            "
                                        >
                                            <component
                                                :is="(getSubRows || grouping.length) && cellIndex === 0 ? 'div' : Plain"
                                                v-bind="
                                                    (getSubRows || grouping.length) && cellIndex === 0
                                                        ? {
                                                              class: styles.treeCell(),
                                                              style: { paddingInlineStart: `${item.row.depth * 20}px` },
                                                          }
                                                        : {}
                                                "
                                            >
                                                <template v-if="(getSubRows || grouping.length) && cellIndex === 0">
                                                    <button
                                                        v-if="getSubRows && item.row.getCanExpand()"
                                                        type="button"
                                                        :class="styles.expander()"
                                                        :aria-expanded="item.row.getIsExpanded()"
                                                        :aria-label="expandLabelFor(item.row.original, item.row.index)"
                                                        @click="item.row.getToggleExpandedHandler()()"
                                                    >
                                                        <ChevronRight
                                                            :class="styles.expanderIcon()"
                                                            :data-state="item.row.getIsExpanded() ? 'open' : 'closed'"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                    <span v-else :class="styles.expanderSpacer()" />
                                                </template>
                                                <!-- Editor: the cell being edited, or every editable cell of the row being edited -->
                                                <div
                                                    v-if="
                                                        columnById.get(cell.column.id)?.editable &&
                                                        ((cellEditing &&
                                                            editing?.rowId === item.row.id &&
                                                            editing.columnId === cell.column.id) ||
                                                            (editMode === 'row' && editingRow === item.row.id))
                                                    "
                                                    data-editor=""
                                                    :class="styles.editor()"
                                                    :aria-busy="validating || undefined"
                                                    @keydown="
                                                        cellEditing
                                                            ? onCellEditorKey(item.row, cell.column.id, $event)
                                                            : onRowEditorKey(item.row, $event)
                                                    "
                                                    @focusout="
                                                        cellEditing
                                                            ? onCellEditorFocusOut(item.row, cell.column.id, $event)
                                                            : undefined
                                                    "
                                                >
                                                    <slot
                                                        v-if="slots[`editor-${cell.column.id}`]"
                                                        :name="`editor-${cell.column.id}`"
                                                        v-bind="editorProps(item.row, columnById.get(cell.column.id)!)"
                                                    />
                                                    <ValueInput
                                                        v-else
                                                        :type="editorType(columnById.get(cell.column.id)!)"
                                                        :label="label(cell.column)"
                                                        :options="columnById.get(cell.column.id)!.editOptions"
                                                        :invalid="!!errors[cell.column.id]"
                                                        :model-value="draft[cell.column.id]"
                                                        @update:model-value="
                                                            onDraft(item.row, columnById.get(cell.column.id)!, $event)
                                                        "
                                                    />
                                                    <span
                                                        v-if="errors[cell.column.id]"
                                                        :id="errorId(item.row.id, cell.column.id)"
                                                        role="alert"
                                                        :class="styles.editError()"
                                                        >{{ errors[cell.column.id] }}</span
                                                    >
                                                </div>
                                                <button
                                                    v-else-if="cellEditing && columnById.get(cell.column.id)?.editable"
                                                    type="button"
                                                    :class="styleFor(cell.column.id).editButton()"
                                                    :data-edit="editKey(item.row.id, cell.column.id)"
                                                    :aria-label="`${t.edit(
                                                        label(cell.column),
                                                        display(
                                                            columnById.get(cell.column.id),
                                                            shownValue(item.row, cell.column.id),
                                                            item.row.original
                                                        )
                                                    )}${isChanged(item.row, cell.column.id) ? `, ${t.changed}` : ''}`"
                                                    @click="startEdit(item.row, cell.column.id)"
                                                >
                                                    <slot
                                                        :name="`cell-${cell.column.id}`"
                                                        :row="item.row.original"
                                                        :value="shownValue(item.row, cell.column.id)"
                                                    >
                                                        {{
                                                            display(
                                                                columnById.get(cell.column.id),
                                                                shownValue(item.row, cell.column.id),
                                                                item.row.original
                                                            )
                                                        }}
                                                    </slot>
                                                </button>
                                                <span
                                                    v-else-if="columnById.get(cell.column.id)?.copyable"
                                                    :class="styles.copyCell()"
                                                >
                                                    <slot
                                                        :name="`cell-${cell.column.id}`"
                                                        :row="item.row.original"
                                                        :value="shownValue(item.row, cell.column.id)"
                                                    >
                                                        {{
                                                            display(
                                                                columnById.get(cell.column.id),
                                                                shownValue(item.row, cell.column.id),
                                                                item.row.original
                                                            )
                                                        }}
                                                    </slot>
                                                    <CopyButton
                                                        :value="
                                                            display(
                                                                columnById.get(cell.column.id),
                                                                shownValue(item.row, cell.column.id),
                                                                item.row.original
                                                            )
                                                        "
                                                        :label="
                                                            t.copy(
                                                                label(cell.column),
                                                                display(
                                                                    columnById.get(cell.column.id),
                                                                    shownValue(item.row, cell.column.id),
                                                                    item.row.original
                                                                )
                                                            )
                                                        "
                                                    />
                                                </span>
                                                <!-- Rows as links: a real link in the first cell -->
                                                <component
                                                    :is="linkFor(item.row, cell.column.id) ? 'a' : Plain"
                                                    v-else
                                                    v-bind="
                                                        linkFor(item.row, cell.column.id)
                                                            ? {
                                                                  href: linkFor(item.row, cell.column.id),
                                                                  class: styles.rowLink(),
                                                                  'data-row-link': '',
                                                              }
                                                            : {}
                                                    "
                                                >
                                                    <slot
                                                        :name="`cell-${cell.column.id}`"
                                                        :row="item.row.original"
                                                        :value="shownValue(item.row, cell.column.id)"
                                                    >
                                                        <Highlight
                                                            v-if="markQuery"
                                                            :text="
                                                                display(
                                                                    columnById.get(cell.column.id),
                                                                    shownValue(item.row, cell.column.id),
                                                                    item.row.original
                                                                )
                                                            "
                                                            :query="markQuery"
                                                        />
                                                        <template v-else>{{
                                                            display(
                                                                columnById.get(cell.column.id),
                                                                shownValue(item.row, cell.column.id),
                                                                item.row.original
                                                            )
                                                        }}</template>
                                                    </slot>
                                                </component>
                                            </component>
                                        </td>
                                    </template>
                                    <td
                                        v-if="trailing.length"
                                        :class="styles.td({ class: utilityClass('actions', false) })"
                                        :style="utilityStyle('actions')"
                                    >
                                        <div :class="styles.editActions()">
                                            <template v-if="editMode === 'row' && editable">
                                                <template v-if="editingRow === item.row.id">
                                                    <IconButton
                                                        :icon="Check"
                                                        :label="t.saveRow(labelFor(item.row.original, item.row.index))"
                                                        variant="text"
                                                        size="sm"
                                                        @click="finishRowEdit(item.row, true)"
                                                    />
                                                    <IconButton
                                                        :icon="X"
                                                        :label="
                                                            t.cancelEdit(labelFor(item.row.original, item.row.index))
                                                        "
                                                        variant="text"
                                                        size="sm"
                                                        @click="finishRowEdit(item.row, false)"
                                                    />
                                                </template>
                                                <IconButton
                                                    v-else
                                                    :data-row-edit="item.row.id"
                                                    :icon="Pencil"
                                                    :label="t.editRow(labelFor(item.row.original, item.row.index))"
                                                    variant="text"
                                                    size="sm"
                                                    @click="startRowEdit(item.row)"
                                                />
                                            </template>
                                            <MenuComponent
                                                v-if="rowActions && editingRow !== item.row.id"
                                                :items="actionsFor(item.row)"
                                                @select="onRowAction(item.row, $event)"
                                            >
                                                <IconButton
                                                    :icon="EllipsisVertical"
                                                    :label="t.rowActions(labelFor(item.row.original, item.row.index))"
                                                    variant="text"
                                                    size="sm"
                                                />
                                            </MenuComponent>
                                        </div>
                                    </td>
                                </tr>
                            </template>
                            <tr v-if="paddingBottom > 0" :class="styles.spacer()" aria-hidden="true">
                                <td
                                    :colspan="columnCount"
                                    :class="styles.spacerCell()"
                                    :style="{ height: `${paddingBottom}px` }"
                                />
                            </tr>
                        </tbody>
                    </BodyWrap>
                    <tfoot v-if="hasFooter" :class="styles.foot()">
                        <tr>
                            <td
                                v-for="utility in leading"
                                :key="utility"
                                :class="styles.footCell({ class: utilityClass(utility, false) })"
                                :style="utilityStyle(utility)"
                            />
                            <td
                                v-for="column in leafColumns"
                                :key="column.id"
                                :class="styleFor(column.id).footCell({ class: pinClass(column.id, false) })"
                                :style="cellStyle(column.id, false)"
                            >
                                {{ footerText(columnById.get(column.id)!) }}
                            </td>
                            <td
                                v-if="trailing.length"
                                :class="styles.footCell({ class: utilityClass('actions', false) })"
                                :style="utilityStyle('actions')"
                            />
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div v-if="statusBar" :class="styles.statusBar()">
                <span>{{ t.rowCount(allRowCount) }}</span>
                <span v-if="filtering">{{ t.filteredCount(table.getFilteredRowModel().rows.length) }}</span>
                <span v-if="selectable">{{ translations.common.selectedCount(selectedCount) }}</span>
                <span v-for="item in statusTotals" :key="item.id">{{ item.text }}</span>
            </div>
            <div v-if="paged && paginatorPosition === 'bottom'" :class="styles.footer()">
                <div v-if="pageSizeItems.length" :class="styles.pageSize()">
                    <span aria-hidden="true">{{ t.rowsPerPage }}</span>
                    <Select
                        :class="styles.pageSizeSelect()"
                        :aria-label="t.rowsPerPage"
                        :items="pageSizeItems"
                        :model-value="String(pagination.pageSize)"
                        @update:model-value="table.setPageSize(Number($event))"
                    />
                </div>
                <Pagination
                    :count="total"
                    :page-size="pagination.pageSize"
                    :page="pagination.pageIndex + 1"
                    :translations="{ rootLabel: `${caption}: ${translations.pagination.rootLabel}` }"
                    @update:page="table.setPageIndex($event - 1)"
                />
            </div>
        </div>
    </Teleport>
</template>
