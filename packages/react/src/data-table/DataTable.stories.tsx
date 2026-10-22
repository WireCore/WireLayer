import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container, Database, EllipsisVertical, HardDrive, Pencil, Server, type LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '../components/Badge/Badge.js';
import { Button } from '../components/Button/Button.js';
import { Checkbox } from '../components/Checkbox/Checkbox.js';
import { Field } from '../components/Field/Field.js';
import { IconButton } from '../components/IconButton/IconButton.js';
import { NumberInput } from '../components/NumberInput/NumberInput.js';
import { Progress } from '../components/Progress/Progress.js';
import { Select } from '../components/Select/Select.js';
import { Switch } from '../components/Switch/Switch.js';
import { DataTable, type DataTableHandle, type DataTableProps } from './DataTable.js';
import { defineMatchMode, moveItem, moveTreeRow } from './index.js';
import type { DataTableColumn, DataTablePivot, RowsRequest } from './types.js';
import type { ConditionGroup } from '@wirecore/wirelayer-recipes';

interface ServerRow {
    id: string;
    name: string;
    ip: string;
    location: string;
    status: 'ONLINE' | 'MAINTENANCE' | 'OUTAGE';
    load: number;
    icon: LucideIcon;
}

const servers: ServerRow[] = [
    { id: 'web-01', name: 'web-01', ip: '10.0.1.11', location: 'Frankfurt', status: 'ONLINE', load: 42, icon: Server },
    {
        id: 'db-primary',
        name: 'db-primary',
        ip: '10.0.2.20',
        location: 'Frankfurt',
        status: 'ONLINE',
        load: 71,
        icon: Database,
    },
    {
        id: 'k8s-node-3',
        name: 'k8s-node-3',
        ip: '10.0.3.33',
        location: 'Nuremberg',
        status: 'MAINTENANCE',
        load: 18,
        icon: Container,
    },
    {
        id: 'backup-02',
        name: 'backup-02',
        ip: '10.0.9.02',
        location: 'Nuremberg',
        status: 'OUTAGE',
        load: 96,
        icon: HardDrive,
    },
    { id: 'web-02', name: 'web-02', ip: '10.0.1.12', location: 'Frankfurt', status: 'ONLINE', load: 37, icon: Server },
    {
        id: 'cache-01',
        name: 'cache-01',
        ip: '10.0.4.10',
        location: 'Nuremberg',
        status: 'ONLINE',
        load: 55,
        icon: Database,
    },
];

const statusVariant = { ONLINE: 'success', MAINTENANCE: 'warn', OUTAGE: 'danger' } as const;

const columns: DataTableColumn<ServerRow>[] = [
    {
        id: 'name',
        header: 'Name',
        sortable: true,
        cell: (row) => (
            <span className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-2">
                    <row.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                    <span className="font-semibold">{row.name}</span>
                    <span className="font-mono text-[11px] text-muted">{row.ip}</span>
                </span>
            </span>
        ),
    },
    {
        id: 'location',
        header: 'Location',
        sortable: true,
        cell: (row) => <span className="text-muted">{row.location}</span>,
    },
    { id: 'status', header: 'Status', cell: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge> },
    {
        id: 'load',
        header: 'Load',
        sortable: true,
        cell: (row) => (
            <span className="flex items-center gap-2.5">
                <Progress value={row.load} showValue={false} aria-label={`Load ${row.name}`} className="flex-1" />
                <span className="w-9 text-right font-mono text-[11px] text-muted">{row.load}%</span>
            </span>
        ),
    },
    {
        id: 'actions',
        header: 'Actions',
        accessor: () => null,
        align: 'end',
        cell: (row) => (
            <span className="flex justify-end gap-0.5">
                <IconButton icon={Pencil} label={`Edit ${row.name}`} variant="text" size="sm" />
                <IconButton icon={EllipsisVertical} label={`More actions for ${row.name}`} variant="text" size="sm" />
            </span>
        ),
    },
];

function ServerTable(props: Partial<DataTableProps<ServerRow>>) {
    const [selection, setSelection] = useState<string[]>([]);
    return (
        <div className="flex max-w-[900px] flex-col gap-2">
            <DataTable<ServerRow>
                data={servers}
                columns={columns}
                caption="Servers"
                getRowId={(row) => row.id}
                rowLabel={(row) => row.name}
                selection={selection}
                onSelectionChange={setSelection}
                className="overflow-hidden rounded-2xl border border-line bg-card"
                {...props}
            />
            <p className="text-xs text-muted" aria-live="polite">
                Selected: {selection.join(', ') || '–'}
            </p>
        </div>
    );
}

const meta = {
    title: 'Data/DataTable',
    component: ServerTable,
    args: { pageSize: 4, selectable: true, loading: false },
    parameters: { layout: 'padded' },
} satisfies Meta<typeof ServerTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = { args: { data: [], pageSize: undefined, selectable: false } };

interface FileRow {
    id: string;
    name: string;
    size: string;
    modified: string;
    children?: FileRow[];
}

const fileRows: FileRow[] = [
    {
        id: 'projects',
        name: 'Projects',
        size: '12.4 MB',
        modified: '10/14/2026',
        children: [
            { id: 'wirecore', name: 'WireLayer', size: '8.1 MB', modified: '10/19/2026' },
            {
                id: 'customers',
                name: 'Customers',
                size: '4.3 MB',
                modified: '10/2/2026',
                children: [{ id: 'quote', name: 'Quote.pdf', size: '220 KB', modified: '10/2/2026' }],
            },
        ],
    },
    { id: 'notes', name: 'Notes.txt', size: '3 KB', modified: '10/18/2026' },
];

const fileColumns: DataTableColumn<FileRow>[] = [
    { id: 'name', header: 'Name' },
    { id: 'size', header: 'Size', align: 'end' },
    { id: 'modified', header: 'Modified' },
];

function FileTable() {
    const [expanded, setExpanded] = useState(['projects']);
    return (
        <DataTable<FileRow>
            data={fileRows}
            columns={fileColumns}
            caption="Files"
            getRowId={(row) => row.id}
            rowLabel={(row) => row.name}
            getSubRows={(row) => row.children}
            expanded={expanded}
            onExpandedChange={setExpanded}
            className="max-w-[640px] overflow-hidden rounded-2xl border border-line bg-card"
        />
    );
}

/** TreeTable: rows with child rows, expanded with the button in the first cell */
export const Tree: Story = { render: () => <FileTable /> };

interface HostRow {
    id: string;
    name: string;
    location: string;
    os: string;
    owner: string;
    load: number;
}

const hosts: HostRow[] = [
    { id: 'web-01', name: 'web-01', location: 'Frankfurt', os: 'Debian 13', owner: 'Team Web', load: 42 },
    { id: 'web-02', name: 'web-02', location: 'Frankfurt', os: 'Debian 13', owner: 'Team Web', load: 37 },
    { id: 'db-primary', name: 'db-primary', location: 'Frankfurt', os: 'Ubuntu 26.04', owner: 'Team Data', load: 71 },
    { id: 'k8s-node-3', name: 'k8s-node-3', location: 'Nuremberg', os: 'Talos 1.12', owner: 'Platform', load: 18 },
    { id: 'backup-02', name: 'backup-02', location: 'Nuremberg', os: 'Debian 12', owner: 'Platform', load: 96 },
    { id: 'cache-01', name: 'cache-01', location: 'Nuremberg', os: 'Alpine 3.22', owner: 'Team Web', load: 55 },
    { id: 'mail-01', name: 'mail-01', location: 'Vienna', os: 'Debian 13', owner: 'IT', load: 12 },
];

const hostColumns: DataTableColumn<HostRow>[] = [
    { id: 'name', header: 'Name', sortable: true, filter: 'text', pinned: 'start', width: 160, editable: true },
    { id: 'location', header: 'Location', sortable: true, filter: 'select', width: 170 },
    { id: 'os', header: 'Operating system', width: 180 },
    { id: 'owner', header: 'Owner', filter: 'select', width: 180, editable: true },
    { id: 'load', header: 'Load', sortable: true, align: 'end', width: 130 },
];

function HostTable() {
    const [rows, setRows] = useState(hosts);
    const [lastEdit, setLastEdit] = useState('–');
    return (
        <div className="flex max-w-[720px] flex-col gap-2">
            <DataTable<HostRow>
                data={rows}
                columns={hostColumns}
                caption="Servers"
                getRowId={(row) => row.id}
                rowLabel={(row) => row.name}
                search
                resizable
                columnToggle
                exportFilename="server"
                selectable
                className="overflow-hidden rounded-2xl border border-line bg-card"
                onCellEdit={({ rowId, columnId, value }) => {
                    setRows((old) => old.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)));
                    setLastEdit(`${rowId}: ${columnId} = ${value}`);
                }}
            />
            <p className="text-xs text-muted">Last changed: {lastEdit}</p>
        </div>
    );
}

/** Search, column filters, pinned first column, resizable widths, column menu, CSV export, editing */
export const Tools: Story = { render: () => <HostTable /> };

/** Rows grouped by location – each group opens and closes */
export const Grouped: Story = {
    render: () => (
        <DataTable<HostRow>
            data={hosts}
            columns={[
                { id: 'name', header: 'Name', sortable: true },
                { id: 'location', header: 'Location' },
                { id: 'owner', header: 'Owner' },
                { id: 'load', header: 'Load', sortable: true, align: 'end' },
            ]}
            caption="Servers by location"
            getRowId={(row) => row.id}
            groupBy="location"
            className="max-w-[720px] overflow-hidden rounded-2xl border border-line bg-card"
        />
    ),
};

interface MachineRow {
    id: string;
    name: string;
    location: string;
    os: string;
    cores: number;
    load: number;
    since: string;
    online: boolean;
}

const locations = ['Frankfurt', 'Nuremberg', 'Vienna', 'Zurich'];
const systems = ['Debian 13', 'Ubuntu 26.04', 'Talos 1.12', 'Alpine 3.22'];
/** Deterministic sample data (no Math.random – screenshots stay the same) */
const machines = (count: number, offset = 0): MachineRow[] =>
    Array.from({ length: count }, (_, position) => {
        const index = position + offset;
        return {
            id: `vm-${String(index + 1).padStart(4, '0')}`,
            name: `vm-${String(index + 1).padStart(4, '0')}`,
            location: locations[index % 4]!,
            os: systems[(index * 7) % 4]!,
            cores: 2 ** ((index % 4) + 1),
            load: (index * 37) % 100,
            since: `202${3 + (index % 3)}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
            online: index % 5 !== 3,
        };
    });

const machineColumns: DataTableColumn<MachineRow>[] = [
    { id: 'name', header: 'Name', width: 170, sortable: true, filter: 'text', copyable: true },
    { id: 'location', header: 'Location', width: 180, sortable: true, filter: 'multiSelect', groupable: true },
    { id: 'os', header: 'System', width: 170, filter: 'select', hideBelow: 'md', groupable: true },
    { id: 'cores', header: 'Cores', width: 130, sortable: true, align: 'end', filter: 'number' },
    {
        id: 'load',
        header: 'Load',
        width: 170,
        sortable: true,
        align: 'end',
        filter: 'number',
        format: (value) => `${value}%`,
    },
    {
        id: 'since',
        header: 'In service since',
        width: 200,
        sortable: true,
        filter: 'date',
        format: (value) => new Date(String(value)).toLocaleDateString('en-US'),
    },
    { id: 'online', header: 'Online', width: 130, filter: 'boolean', format: (value) => (value ? 'Yes' : 'No') },
];
const machineId = (row: MachineRow) => row.id;
const machineName = (row: MachineRow) => row.name;
const card = 'overflow-hidden rounded-2xl border border-line bg-card';
const rowColumns = machineColumns.slice(0, 5).map((column) => ({ ...column, filter: undefined }));
const shortDate = (value: unknown) => new Date(String(value)).toLocaleDateString('en-US');

function FilterMenuTable() {
    const [sorting, setSorting] = useState<DataTableProps<MachineRow>['sorting']>([{ id: 'location', desc: false }]);
    return (
        <DataTable<MachineRow>
            data={machines(40)}
            columns={machineColumns}
            caption="Machines"
            getRowId={machineId}
            rowLabel={machineName}
            sorting={sorting}
            onSortingChange={setSorting}
            filterDisplay="menu"
            sortMode="multiple"
            columnMenu
            reorderableColumns
            resizable
            search
            highlightSearch
            columnToggle
            pageSize={8}
            pageSizeOptions={[8, 20, 50]}
            className={`${card} max-w-[1000px]`}
        />
    );
}

/**
 * Filter menu per column (match modes, several conditions with and/or), sorting by several columns
 * (Shift+click), column menu (sort, pin, move, hide, group), columns by drag and drop, search with marked hits,
 * rows per page
 */
export const FilterMenu: Story = { render: () => <FilterMenuTable /> };

const actions = [
    { value: 'restart', label: 'Restart' },
    { value: 'snapshot', label: 'Create snapshot' },
    { type: 'separator' as const },
    { value: 'delete', label: 'Delete', danger: true },
];

function RowsTable() {
    const [rows, setRows] = useState(() => machines(6));
    const [selection, setSelection] = useState(['vm-0002']);
    const [last, setLast] = useState('–');
    return (
        <div className="flex max-w-[900px] flex-col gap-2">
            <DataTable<MachineRow>
                data={rows}
                columns={rowColumns}
                caption="Machines"
                getRowId={machineId}
                rowLabel={machineName}
                selectable
                selectionMode="single"
                selection={selection}
                onSelectionChange={setSelection}
                reorderableRows
                rowNumbers
                rowActions={actions}
                contextMenu
                defaultExpanded={['vm-0001']}
                className={card}
                onRowReorder={({ from, to }) => setRows((old) => moveItem(old, from, to))}
                onRowAction={({ value, rowId }) => setLast(`${value}: ${rowId}`)}
                expansion={(row) => (
                    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
                        <dt className="text-muted">System</dt>
                        <dd>{row.os}</dd>
                        <dt className="text-muted">In service since</dt>
                        <dd>{row.since}</dd>
                    </dl>
                )}
            />
            <p className="text-xs text-muted">
                Selection: {selection.join(', ') || '–'} · Action: {last}
            </p>
        </div>
    );
}

/** Details per row, row numbers, actions (menu and right click), rows by drag and drop or arrow keys, one choice */
export const Rows: Story = { render: () => <RowsTable /> };

const editColumns: DataTableColumn<MachineRow>[] = [
    {
        id: 'name',
        header: 'Name',
        editable: true,
        validate: (value) => (value ? undefined : 'Please enter a name'),
    },
    { id: 'location', header: 'Location', editable: true, editor: 'select', editOptions: locations },
    {
        id: 'cores',
        header: 'Cores',
        align: 'end',
        editable: true,
        editor: 'number',
        validate: (value) => (Number(value) > 0 ? undefined : 'At least 1 core'),
    },
    { id: 'since', header: 'In service since', editable: true, editor: 'date', format: shortDate },
    {
        id: 'online',
        header: 'Online',
        editable: true,
        editor: 'checkbox',
        format: (value) => (value ? 'Yes' : 'No'),
    },
];

function RowEditingTable() {
    const [rows, setRows] = useState(() => machines(5));
    return (
        <DataTable<MachineRow>
            data={rows}
            columns={editColumns}
            caption="Machines"
            getRowId={machineId}
            rowLabel={machineName}
            editMode="row"
            className={`${card} max-w-[1000px]`}
            onRowEdit={({ rowId, values }) =>
                setRows((old) => old.map((row) => (row.id === rowId ? { ...row, ...values } : row)))
            }
        />
    );
}

/** Editing a whole row: text, number, choice, date and checkbox, with a check per value */
export const RowEditing: Story = { render: () => <RowEditingTable /> };

/** Column groups in the header, totals in the footer and per group */
export const Totals: Story = {
    render: () => (
        <DataTable<MachineRow>
            data={machines(12)}
            columns={[
                { id: 'name', header: 'Name', footer: 'Total' },
                { id: 'location', header: 'Location' },
                {
                    id: 'resources',
                    header: 'Resources',
                    columns: [
                        { id: 'cores', header: 'Cores', align: 'end', aggregate: 'sum' },
                        { id: 'load', header: 'Load', align: 'end', aggregate: 'avg' },
                    ],
                },
                {
                    id: 'online',
                    header: 'Online',
                    format: (value) => (value ? 'Yes' : 'No'),
                    aggregate: (values) => `${values.filter(Boolean).length} online`,
                },
            ]}
            caption="Resources by location"
            getRowId={machineId}
            groupBy="location"
            gridlines
            className={`${card} max-w-[820px]`}
        />
    ),
};

function LargeTable() {
    const [rows, setRows] = useState(() => machines(2000));
    const [loading, setLoading] = useState(false);
    return (
        <div className="flex max-w-[900px] flex-col gap-2">
            <DataTable<MachineRow>
                data={rows}
                columns={machineColumns.slice(0, 5)}
                caption="All machines"
                getRowId={machineId}
                virtual
                scrollHeight="420px"
                frozenRows={['vm-0001']}
                loading={loading}
                densityToggle
                fullscreenToggle
                striped
                className={card}
                onLoadMore={() => {
                    if (rows.length >= 5000) return;
                    setLoading(true);
                    setTimeout(() => {
                        setRows((old) => [...old, ...machines(1000, old.length)]);
                        setLoading(false);
                    }, 400);
                }}
            />
            <p className="text-xs text-muted" aria-live="polite">
                {rows.length} rows loaded
            </p>
        </div>
    );
}

/**
 * 5.000 rows, only the visible ones are rendered. The first row (vm-0001) is frozen on purpose (`frozenRows`) and stays
 * below the header while the rest scrolls. Row height, full screen and more rows when scrolled to the end.
 */
export const Large: Story = { render: () => <LargeTable /> };

// The last of 500 machines has a long name – it is not rendered until scrolled there
const widthRows = machines(500).map((row, index) =>
    index === 499 ? { ...row, name: 'vm-0500-reserve-datacenter-frankfurt' } : row
);

/**
 * Virtual scrolling and fitting widths: a double click (or Enter) on the resize handle measures the values of every
 * row as text, also the ones that are not rendered
 */
export const VirtualWidth: Story = {
    name: 'Virtual: fit width',
    render: () => (
        <DataTable<MachineRow>
            data={widthRows}
            columns={machineColumns.slice(0, 3).map((column) => ({ ...column, filter: undefined, copyable: false }))}
            caption="Machines"
            getRowId={machineId}
            virtual
            scrollHeight="320px"
            resizable
            className={`${card} max-w-[900px]`}
        />
    ),
};

// Own match mode for all tables of the app: a list (tags) contains the chosen entry
defineMatchMode('arrayContains', {
    label: (locale) => (locale.startsWith('de') ? 'Enthält Eintrag' : 'Contains item'),
    types: ['select'],
    test: (value, filter) => Array.isArray(value) && value.includes(filter),
});

interface ServiceRow {
    id: string;
    name: string;
    team: string;
    tags: string[];
    priority: 1 | 2 | 3;
    cost: number;
    since: string;
}
const teams = ['Team Web', 'Team Data', 'Platform'];
const tagSets = [['web', 'external'], ['db'], ['web', 'internal'], ['internal'], ['db', 'external']];
const services: ServiceRow[] = Array.from({ length: 15 }, (_, index) => ({
    id: `svc-${index + 1}`,
    name: `Service ${String(index + 1).padStart(2, '0')}`,
    team: teams[index % 3]!,
    tags: tagSets[index % 5]!,
    priority: ((index % 3) + 1) as 1 | 2 | 3,
    cost: 120 + ((index * 173) % 900),
    since: `2026-0${(index % 9) + 1}-${String((index % 27) + 1).padStart(2, '0')}`,
}));
const priorities = ['', 'Low', 'Medium', 'High'];
const euro = (value: unknown) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
        Number(value)
    );
const serviceColumns: DataTableColumn<ServiceRow>[] = [
    { id: 'name', header: 'Name', sortable: true, filter: 'text' },
    {
        id: 'team',
        header: 'Team',
        // Own filter input with an own comparison
        filterFn: (value, filter) => !filter || value === filter,
        renderFilter: ({ value, setValue }) => (
            <Checkbox
                checked={value === 'Team Web'}
                onCheckedChange={(checked) => setValue(checked === true ? 'Team Web' : null)}
            >
                Only Team Web
            </Checkbox>
        ),
    },
    {
        id: 'tags',
        header: 'Tags',
        format: (value) => (value as string[]).join(', '),
        filter: 'select',
        filterMatchMode: 'arrayContains',
        filterOptions: ['web', 'db', 'internal', 'external'],
    },
    {
        id: 'priority',
        header: 'Priority',
        format: (value) => priorities[Number(value)]!,
        filter: 'multiSelect',
        // Choices with values of their own (numbers), grouped
        filterOptions: [
            { value: 3, label: 'High', group: 'Urgent' },
            { value: 2, label: 'Medium', group: 'Normal' },
            { value: 1, label: 'Low', group: 'Normal' },
        ],
    },
    {
        id: 'cost',
        header: 'Cost',
        align: 'end',
        sortable: true,
        format: euro,
        filter: 'number',
        // From and to in the filter row, either may stay empty
        filterMatchMode: 'between',
    },
    { id: 'since', header: 'Since', format: shortDate, filter: 'date', filterMatchMode: 'between' },
];

/**
 * Own filters: an own input per column (renderFilter), an own comparison (`filterFn`), an own match mode for lists,
 * ranges in the filter row, choices with values of their own (grouped, several). The filter row can be hidden.
 */
export const OwnFilters: Story = {
    name: 'Custom filters',
    render: () => (
        <DataTable<ServiceRow>
            data={services}
            columns={serviceColumns}
            caption="Services"
            getRowId={(row) => row.id}
            filterToggle
            noResultsText="No service matches the filters."
            toolbarStart={<Badge>15 services</Badge>}
            className={`${card} max-w-[1100px]`}
        />
    ),
};

const keyboardColumns: DataTableColumn<MachineRow>[] = [
    { id: 'name', header: 'Name', width: 170, sortable: true, pinned: 'start', editable: true },
    { id: 'location', header: 'Location', width: 170, editable: true, editor: 'select', editOptions: locations },
    { id: 'os', header: 'System', width: 170 },
    { id: 'cores', header: 'Cores', width: 120, align: 'end', editable: true, editor: 'number' },
    { id: 'load', header: 'Load', width: 150, align: 'end' },
    { id: 'since', header: 'In service since', width: 190, format: shortDate },
    { id: 'online', header: 'Online', width: 130, format: (value) => (value ? 'Yes' : 'No') },
];

function KeyboardTable() {
    const [rows, setRows] = useState(() => machines(2000));
    return (
        <DataTable<MachineRow>
            data={rows}
            columns={keyboardColumns}
            caption="Machines"
            getRowId={machineId}
            rowLabel={machineName}
            navigation="grid"
            selectable
            virtual
            scrollHeight="420px"
            frozenRows={['vm-0001']}
            statusBar
            className={`${card} max-w-[900px]`}
            onCellEdit={({ rowId, columnId, value }) =>
                setRows((old) => old.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)))
            }
        />
    );
}

/**
 * Keyboard like a spreadsheet (`navigation="grid"`): one Tab stop, arrow keys from cell to cell, Home/End,
 * Ctrl+Home/End, Page Up/Down, Enter or F2 edits, Escape leaves the editor, Space selects the row. 2.000 rows
 * (only the visible ones rendered), a pinned column and a frozen row.
 */
export const Keyboard: Story = { name: 'Keyboard like a spreadsheet', render: () => <KeyboardTable /> };

/** Keyboard navigation with grouped rows: Enter on a group opens or closes it */
export const KeyboardGrouped: Story = {
    name: 'Keyboard with groups',
    render: () => (
        <DataTable<MachineRow>
            data={machines(12)}
            columns={machineColumns.slice(0, 5).map((column) => ({ ...column, filter: undefined }))}
            caption="Machines by location"
            getRowId={machineId}
            rowLabel={machineName}
            navigation="grid"
            groupBy="location"
            selectable
            className={`${card} max-w-[900px]`}
        />
    ),
};

function StatusBarTable() {
    const table = useRef<DataTableHandle>(null);
    const [selection, setSelection] = useState(['vm-0002', 'vm-0003', 'vm-0005']);
    const [csv, setCsv] = useState('');
    return (
        <div className="flex max-w-[760px] flex-col gap-3">
            <DataTable<MachineRow>
                ref={table}
                data={machines(12)}
                columns={[
                    { id: 'name', header: 'Name', width: 150 },
                    { id: 'location', header: 'Location', width: 150 },
                    { id: 'cores', header: 'Cores per machine', width: 120, align: 'end' },
                    {
                        id: 'load',
                        header: 'Average monthly load',
                        width: 150,
                        align: 'end',
                        exportHeader: 'Load (%)',
                    },
                ]}
                caption="Machines"
                getRowId={machineId}
                rowLabel={machineName}
                selection={selection}
                onSelectionChange={setSelection}
                selectable
                search
                resizable
                wrapHeaders
                statusBar
                className={card}
            />
            <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setCsv(table.current?.generateCsv({ selectionOnly: true, bom: false }) ?? '')}
            >
                Selection as CSV
            </Button>
            {csv && <pre className="overflow-auto rounded-lg bg-bg-2 p-3 text-xs">{csv}</pre>}
        </div>
    );
}

/**
 * Status bar below the table: rows, filtered and selected rows, sum and average of the selected numbers. Long
 * headers wrap, a double click on a column edge fits its width; the selection as CSV text (`generateCsv`).
 */
export const StatusBar: Story = { name: 'Status bar', render: () => <StatusBarTable /> };

function RowLinksTable() {
    const [last, setLast] = useState('–');
    return (
        <div className="flex max-w-[900px] flex-col gap-2">
            <DataTable<MachineRow>
                data={machines(6)}
                columns={rowColumns.map((column) => ({ ...column, copyable: undefined }))}
                caption="Machines"
                getRowId={machineId}
                rowHref={(row) => `#/machines/${row.id}`}
                onRowClick={({ href }) => setLast(href ?? '–')}
                className={card}
            />
            <p className="text-xs text-muted" aria-live="polite">
                Last opened: {last}
            </p>
        </div>
    );
}

/**
 * Rows as links: the name is a real link (Ctrl+click or middle click opens a new tab), a click anywhere on the
 * row follows it. `onRowClick` reports the click – `event.preventDefault()` there navigates with a router instead.
 */
export const RowLinks: Story = { name: 'Rows as links', render: () => <RowLinksTable /> };

function SkeletonTable() {
    const [loading, setLoading] = useState(true);
    return (
        <div className="flex max-w-[900px] flex-col gap-3">
            <Switch checked={loading} onCheckedChange={setLoading}>
                Loading
            </Switch>
            <DataTable<MachineRow>
                data={machines(8)}
                columns={rowColumns}
                caption="Machines"
                getRowId={machineId}
                loading={loading}
                loadingVariant="skeleton"
                pageSize={4}
                selectable
                className={card}
            />
        </div>
    );
}

/** While loading, placeholder rows keep the layout (`loadingVariant="skeleton"`) */
export const SkeletonLoading: Story = { name: 'Loading with skeleton', render: () => <SkeletonTable /> };

interface PlanRow {
    id: string;
    name: string;
    location: string;
    cores: number;
    services: string[];
    maintenance: string;
    notes: string;
}
const plans: PlanRow[] = machines(5).map((machine, index) => ({
    id: machine.id,
    name: machine.name,
    location: machine.location,
    cores: machine.cores,
    services: index % 2 ? ['Web'] : ['Web', 'Database'],
    maintenance: `2026-11-0${index + 2}T${String(index + 6).padStart(2, '0')}:30`,
    notes: index === 1 ? 'Restart after the update' : '',
}));
const planColumns: DataTableColumn<PlanRow>[] = [
    {
        id: 'name',
        header: 'Name',
        editable: true,
        // Asks the "server": vm-0002 is taken
        validate: (value) =>
            new Promise<string | undefined>((done) =>
                setTimeout(() => done(value === 'vm-0002' ? 'This name is already taken' : undefined), 300)
            ),
    },
    {
        id: 'location',
        header: 'Location',
        editable: true,
        editor: 'select',
        editOptions: locations.map((location) => ({
            value: location,
            label: location,
            group: location === 'Vienna' || location === 'Zurich' ? 'Abroad' : 'Germany',
        })),
    },
    {
        id: 'cores',
        header: 'Cores',
        align: 'end',
        editable: true,
        renderEditor: ({ value, setValue, commit, cancel }) => (
            <span className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => setValue(Math.max(1, Number(value) / 2))}>
                    ÷ 2
                </Button>
                <span className="w-8 text-center tabular-nums">{String(value)}</span>
                <Button size="sm" variant="outline" onClick={() => setValue(Number(value) * 2)}>
                    × 2
                </Button>
                <Button size="sm" onClick={commit}>
                    OK
                </Button>
                <Button size="sm" variant="text" onClick={cancel}>
                    Cancel
                </Button>
            </span>
        ),
    },
    {
        id: 'services',
        header: 'Services',
        editable: true,
        editor: 'multiSelect',
        editOptions: ['Web', 'Database', 'Cache', 'Backup'],
        format: (value) => (value as string[]).join(', '),
    },
    {
        id: 'maintenance',
        header: 'Maintenance',
        editable: true,
        editor: 'datetime',
        format: (value) => new Date(String(value)).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
    },
    { id: 'notes', header: 'Note', editable: true, editor: 'textarea' },
];

function EditorsTable() {
    const [rows, setRows] = useState(() => plans.map((plan) => ({ ...plan })));
    return (
        <DataTable<PlanRow>
            data={rows}
            columns={planColumns}
            caption="Maintenance schedule"
            getRowId={(row) => row.id}
            rowLabel={(row) => row.name}
            className={`${card} max-w-[1100px]`}
            onCellEdit={({ rowId, columnId, value }) =>
                setRows((old) => old.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)))
            }
        />
    );
}

/**
 * Editors: a choice with groups, several choices, date with time, text over several lines (Ctrl+Enter saves), an
 * own editor (`renderEditor`) and a check that asks the server
 */
export const Editors: Story = { name: 'Custom editors', render: () => <EditorsTable /> };

const excelColumns: DataTableColumn<MachineRow>[] = [
    { id: 'name', header: 'Name', width: 150, sortable: true },
    { id: 'location', header: 'Location', width: 150, groupable: true },
    { id: 'os', header: 'System', width: 150 },
    { id: 'cores', header: 'Cores', width: 110, align: 'end', aggregate: 'sum' },
    { id: 'load', header: 'Load', width: 140, align: 'end', aggregate: 'avg', format: (value) => `${value}%` },
    { id: 'since', header: 'In service since', width: 170, filter: 'date', format: shortDate },
    { id: 'online', header: 'Online', width: 110, format: (value) => (value ? 'Yes' : 'No') },
];

/**
 * Excel export without a library (`exportFormats={['csv', 'xlsx']}`): numbers stay numbers, dates become dates,
 * the header row is bold and frozen, column widths fit, a bold row per group and the totals at the end.
 * `generateXlsx()` returns the file as bytes, `exportXlsx()` downloads it.
 */
export const ExcelExport: Story = {
    name: 'Excel export',
    render: () => (
        <DataTable<MachineRow>
            data={machines(12)}
            columns={excelColumns}
            caption="Machines"
            getRowId={machineId}
            rowLabel={machineName}
            groupBy="location"
            selectable
            exportFilename="machines"
            exportFormats={['csv', 'xlsx']}
            className={`${card} max-w-[1000px]`}
        />
    ),
};

const sheetColumns: DataTableColumn<MachineRow>[] = [
    { id: 'name', header: 'Name', width: 140 },
    { id: 'location', header: 'Location', width: 150, editable: true, editor: 'select', editOptions: locations },
    {
        id: 'cores',
        header: 'Cores',
        width: 110,
        align: 'end',
        editable: true,
        editor: 'number',
        validate: (value) => (Number(value) >= 1 && Number(value) <= 128 ? undefined : 'Between 1 and 128'),
    },
    { id: 'load', header: 'Load', width: 130, align: 'end', format: (value) => `${value}%` },
    { id: 'since', header: 'In service since', width: 170, editable: true, editor: 'date', format: shortDate },
];

function SpreadsheetTable() {
    const [rows, setRows] = useState(() => machines(8));
    const [marked, setMarked] = useState('–');
    const [problems, setProblems] = useState<string[]>([]);
    return (
        <div className="flex max-w-[900px] flex-col gap-3">
            <DataTable<MachineRow>
                data={rows}
                columns={sheetColumns}
                caption="Machines"
                getRowId={machineId}
                rowLabel={machineName}
                navigation="grid"
                cellSelection
                className={card}
                onCellSelectionChange={(selection) =>
                    setMarked(
                        selection
                            ? `${selection.rowIds.length * selection.columnIds.length} cells (${selection.rowIds[0]} to ${selection.rowIds.at(-1)})`
                            : '–'
                    )
                }
                onCellPaste={(paste) =>
                    setProblems(paste.errors.map((error) => `${error.rowId}, ${error.columnId}: ${error.message}`))
                }
                onCellEdit={({ rowId, columnId, value }) =>
                    setRows((old) => old.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)))
                }
            />
            <p className="text-xs text-muted" aria-live="polite">
                Marked: {marked}
            </p>
            {problems.length > 0 && (
                <ul className="list-disc ps-5 text-xs text-danger">
                    {problems.map((problem) => (
                        <li key={problem}>{problem}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/**
 * Like a spreadsheet (`cellSelection`): drag over cells, Shift+click or Shift+arrow keys mark a range, Ctrl+C
 * copies it as tab-separated text, Ctrl+V pastes text from Excel from the active cell on – numbers and dates in
 * the notation of the locale, choices by their label, every cell checked – and Ctrl+Z/Ctrl+Y undo and redo.
 */
export const Spreadsheet: Story = {
    name: 'Like a spreadsheet: select, copy, paste',
    render: () => <SpreadsheetTable />,
};

function BatchTable() {
    const [rows, setRows] = useState(() => machines(8));
    const [saved, setSaved] = useState('');
    return (
        <div className="flex max-w-[900px] flex-col gap-3">
            <DataTable<MachineRow>
                data={rows}
                columns={sheetColumns}
                caption="Machines"
                getRowId={machineId}
                rowLabel={machineName}
                editMode="batch"
                navigation="grid"
                cellSelection
                className={card}
                onSave={({ rows: changed }) => {
                    setRows((old) =>
                        old.map((row) => {
                            const change = changed.find((item) => item.rowId === row.id);
                            return change ? { ...row, ...change.values } : row;
                        })
                    );
                    setSaved(`Saved: ${changed.map((item) => item.rowId).join(', ')}`);
                }}
            />
            <p className="text-xs text-muted" aria-live="polite">
                {saved || 'Nothing saved yet'}
            </p>
        </div>
    );
}

/**
 * Collect and save (`editMode="batch"`): changes stay in the table, marked, until "Save" (`onSave` gets all of
 * them) or "Discard". Ctrl+Z and Ctrl+Y (or the buttons) undo and redo edits and pastes.
 */
export const Batch: Story = { name: 'Collect and save', render: () => <BatchTable /> };

/** A pretend server: 250 machines, answers after a moment, can be made to fail */
const serverMachines = machines(250);
const failNext = { current: false };
const getMachines = (request: RowsRequest) =>
    new Promise<{ rows: MachineRow[]; rowCount: number }>((resolve, reject) => {
        const timer = setTimeout(() => {
            if (failNext.current) {
                failNext.current = false;
                return reject(new Error('Server unreachable'));
            }
            const search = request.search.toLowerCase();
            const location = request.filters.location as string | undefined;
            let rows = serverMachines.filter(
                (row) =>
                    (!search || `${row.name} ${row.location} ${row.os}`.toLowerCase().includes(search)) &&
                    (!location || row.location === location)
            );
            const sort = request.sorting[0];
            if (sort)
                rows = [...rows].sort((a, b) => {
                    const left = a[sort.id as keyof MachineRow];
                    const right = b[sort.id as keyof MachineRow];
                    const order = left < right ? -1 : left > right ? 1 : 0;
                    return sort.desc ? -order : order;
                });
            const start = (request.page - 1) * request.pageSize;
            resolve({ rows: rows.slice(start, start + request.pageSize), rowCount: rows.length });
        }, 400);
        request.signal.addEventListener('abort', () => clearTimeout(timer));
    });

function ServerSourceTable() {
    const table = useRef<DataTableHandle>(null);
    const [fail, setFail] = useState(false);
    return (
        <div className="flex max-w-[900px] flex-col gap-3">
            <DataTable<MachineRow>
                ref={table}
                columns={[
                    { id: 'name', header: 'Name', width: 150, sortable: true },
                    {
                        id: 'location',
                        header: 'Location',
                        width: 170,
                        sortable: true,
                        filter: 'select',
                        filterOptions: locations,
                    },
                    { id: 'os', header: 'System', width: 160 },
                    { id: 'cores', header: 'Cores', width: 110, align: 'end', sortable: true },
                    { id: 'load', header: 'Load', width: 130, align: 'end', sortable: true },
                ]}
                caption="Machines"
                getRowId={machineId}
                rowLabel={machineName}
                dataSource={{ getRows: getMachines }}
                cacheTime={30_000}
                pageSize={10}
                pageSizeOptions={[10, 25, 50]}
                search
                className={card}
                toolbarEnd={
                    <Button variant="outline" size="sm" onClick={() => void table.current?.refresh()}>
                        Reload
                    </Button>
                }
            />
            <Switch
                checked={fail}
                onCheckedChange={(checked) => {
                    setFail(checked);
                    failNext.current = checked;
                }}
            >
                Next request fails
            </Switch>
        </div>
    );
}

/**
 * Server data source (`dataSource={{ getRows }}`): the table asks for the page with sorting, filters and search,
 * cancels outdated requests, waits for a pause in typing, goes back to page 1 on new filters, keeps answers for 30
 * seconds (`cacheTime`) and shows errors with "Try again". `refresh()` asks again.
 */
export const ServerSource: Story = { name: 'Server data source', render: () => <ServerSourceTable /> };

const pivotColumns: DataTableColumn<MachineRow>[] = [
    { id: 'name', header: 'Name' },
    { id: 'location', header: 'Location' },
    { id: 'os', header: 'System' },
    { id: 'cores', header: 'Cores' },
    { id: 'load', header: 'Load' },
    { id: 'year', header: 'Since', accessor: (row) => row.since.slice(0, 4) },
];
const dimensions = [
    { value: 'location', label: 'Location' },
    { value: 'os', label: 'System' },
    { value: 'year', label: 'Since' },
];
const aggregates = [
    { value: 'sum', label: 'Sum of cores' },
    { value: 'avg', label: 'Average of cores' },
    { value: 'count', label: 'Number of machines' },
];

function PivotTable() {
    const [rowsBy, setRowsBy] = useState('location');
    const [columnsBy, setColumnsBy] = useState('os');
    const [aggregate, setAggregate] = useState<'sum' | 'avg' | 'count'>('sum');
    const pivot: DataTablePivot = {
        rows: [rowsBy],
        columns: columnsBy === rowsBy ? [] : [columnsBy],
        values: [{ id: 'cores', aggregate }],
    };
    return (
        <div className="flex max-w-[1000px] flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
                <span>Rows</span>
                <Select
                    aria-label="Rows"
                    className="w-40"
                    items={dimensions}
                    value={rowsBy}
                    onValueChange={(value) => value && setRowsBy(value)}
                />
                <span>Columns</span>
                <Select
                    aria-label="Columns"
                    className="w-40"
                    items={dimensions}
                    value={columnsBy}
                    onValueChange={(value) => value && setColumnsBy(value)}
                />
                <span>Values</span>
                <Select
                    aria-label="Values"
                    className="w-56"
                    items={aggregates}
                    value={aggregate}
                    onValueChange={(value) => value && setAggregate(value as 'sum' | 'avg' | 'count')}
                />
            </div>
            <DataTable<MachineRow>
                data={machines(40)}
                columns={pivotColumns}
                caption="Cores by location and system"
                pivot={pivot}
                gridlines
                className={card}
            />
        </div>
    );
}

/**
 * Pivot (`pivot={{ rows, columns, values }}`): rows grouped by the values of one column, a column per value of
 * another, the cores summed up (or averaged, counted), totals per row and column. The panel above is built from
 * Selects in the story – the table only needs the configuration.
 */
export const Pivot: Story = { name: 'Pivot', render: () => <PivotTable /> };

const mergedRows = [...machines(10)].sort(
    (a, b) => a.location.localeCompare(b.location) || a.os.localeCompare(b.os) || a.name.localeCompare(b.name)
);

/**
 * Merged cells: equal values one below the other become one cell (`rowSpan: 'auto'`, here the location and inside
 * it the system); a cell can span the next columns (`colSpan`, here machines out of service). Each cell names its
 * columns (`headers`) for screen readers. Not with virtual scrolling.
 */
export const MergedCells: Story = {
    name: 'Merged cells',
    render: () => (
        <DataTable<MachineRow>
            data={mergedRows}
            columns={[
                { id: 'location', header: 'Location', rowSpan: 'auto' },
                { id: 'os', header: 'System', rowSpan: 'auto' },
                { id: 'name', header: 'Name' },
                {
                    id: 'cores',
                    header: 'Cores',
                    align: 'end',
                    accessor: (row) => (row.online ? row.cores : 'Out of service'),
                    colSpan: (row) => (row.online ? 1 : 2),
                },
                { id: 'load', header: 'Load', align: 'end', format: (value) => `${value}%` },
            ]}
            caption="Machines by location and system"
            getRowId={machineId}
            rowLabel={machineName}
            gridlines
            className={`${card} max-w-[800px]`}
        />
    ),
};

/**
 * Find in the table (`find`): the button "Find in table" opens a field; matches are marked, "Match x of y",
 * Enter/Shift+Enter or the arrows go to the next/previous one – also to rows not rendered yet (2.000 rows,
 * virtual scrolling). Escape closes the field. The rows stay as they are (unlike the search filter).
 */
export const Find: Story = {
    name: 'Find',
    render: () => (
        <DataTable<MachineRow>
            data={machines(2000)}
            columns={keyboardColumns.map((column) => ({ ...column, editable: false }))}
            caption="Machines"
            getRowId={machineId}
            rowLabel={machineName}
            find
            virtual
            scrollHeight="420px"
            className={`${card} max-w-[900px]`}
        />
    ),
};

function PrintTable() {
    const table = useRef<DataTableHandle>(null);
    return (
        <DataTable<MachineRow>
            ref={table}
            data={machines(60)}
            columns={excelColumns}
            caption="Machines"
            getRowId={machineId}
            rowLabel={machineName}
            pageSize={10}
            search
            className={`${card} max-w-[1000px]`}
            toolbarEnd={
                <Button variant="outline" size="sm" onClick={() => table.current?.print({ title: 'Machines' })}>
                    Print
                </Button>
            }
        />
    );
}

/**
 * Print (`print()`): all filtered and sorted rows – not only the current page – as plain text, the header on every
 * page, the totals at the end, no buttons or inputs. Filter with the search first, then "Print".
 */
export const Print: Story = { name: 'Print', render: () => <PrintTable /> };

function MoveRowsTables() {
    const [rows, setRows] = useState(() => machines(8));
    const [files, setFiles] = useState(fileRows);
    return (
        <div className="flex max-w-[800px] flex-col gap-6">
            <DataTable<MachineRow>
                data={rows}
                columns={machineColumns.slice(0, 4).map((column) => ({ ...column, filter: undefined }))}
                caption="Machines by location"
                getRowId={machineId}
                rowLabel={machineName}
                groupBy="location"
                reorderableRows
                className={card}
                onRowReorder={({ from, to, group }) =>
                    setRows((old) => {
                        const next = moveItem(old, from, to);
                        if (group) next[to] = { ...next[to]!, ...group };
                        return next;
                    })
                }
            />
            <DataTable<FileRow>
                data={files}
                columns={fileColumns}
                caption="Files"
                getRowId={(row) => row.id}
                rowLabel={(row) => row.name}
                getSubRows={(row) => row.children}
                defaultExpanded={['projects', 'customers']}
                reorderableRows
                className={card}
                onRowReorder={(move) => setFiles((old) => moveTreeRow(old, move, (row) => row.id, 'children'))}
            />
        </div>
    );
}

/**
 * Moving rows between groups and levels: drag a row into another group (or onto its heading) – it takes the
 * values of that group (`group` in `onRowReorder`). With the keyboard: arrow keys on the handle, past the edge of a
 * group into the next one. In a tree: before, after or into a row; arrow left/right on the handle move out of or
 * into the row above. Every move is announced.
 */
export const MoveRows: Story = { name: 'Moving rows: groups and tree', render: () => <MoveRowsTables /> };

/**
 * Column groups in the column menu (`columnToggle`): a group shows or hides all its columns, "Move … back" and
 * "Move … forward" move it as a whole (`reorderableColumns`).
 */
export const ColumnGroups: Story = {
    name: 'Managing column groups',
    render: () => (
        <DataTable<MachineRow>
            data={machines(6)}
            columns={[
                {
                    id: 'machine',
                    header: 'Machine',
                    columns: [
                        { id: 'name', header: 'Name', width: 140 },
                        { id: 'os', header: 'System', width: 150 },
                    ],
                },
                {
                    id: 'usage',
                    header: 'Usage',
                    columns: [
                        { id: 'cores', header: 'Cores', width: 110, align: 'end' },
                        { id: 'load', header: 'Load', width: 130, align: 'end' },
                    ],
                },
                {
                    id: 'operation',
                    header: 'Operations',
                    columns: [
                        { id: 'location', header: 'Location', width: 140 },
                        { id: 'since', header: 'In service since', width: 170, format: shortDate },
                    ],
                },
            ]}
            caption="Machines"
            getRowId={machineId}
            rowLabel={machineName}
            columnToggle
            reorderableColumns
            className={`${card} max-w-[1000px]`}
        />
    ),
};

/** A condition tree with one rule "load over <value>" – no rule without a value */
const loadOver = (value: number | null): ConditionGroup => ({
    type: 'group',
    id: 'root',
    combinator: 'and',
    children: value === null ? [] : [{ type: 'rule', id: 'r1', field: 'load', operator: 'gt', value }],
});
const loadOf = (tree: ConditionGroup) => {
    const rule = tree.children[0];
    return rule?.type === 'rule' && typeof rule.value === 'number' ? rule.value : null;
};

function AdvancedFilterTable() {
    const [rows] = useState(() => machines(40));
    const [tree, setTree] = useState(() => loadOver(50));
    return (
        <DataTable
            data={rows}
            columns={machineColumns}
            caption="Machines"
            getRowId={machineId}
            rowLabel={(row) => row.name}
            advancedFilter
            advancedFilterValue={tree}
            onAdvancedFilterValueChange={setTree}
            renderAdvancedFilter={({ value, onValueChange }) => (
                <Field label="Load over (%)">
                    <NumberInput
                        value={loadOf(value)}
                        onValueChange={(next) => onValueChange(loadOver(next))}
                        min={0}
                        max={100}
                        size="sm"
                    />
                </Field>
            )}
            pageSize={10}
            className={`${card} max-w-[1100px]`}
        />
    );
}

/**
 * Advanced filter: the rows pass a condition tree; the toolbar button opens the editor from `renderAdvancedFilter`
 * – here a small own one. The full editor (nested and/or rules) is ConditionBuilder from `@wirecore/wirelayer-blocks-react`:
 * Blocks › ConditionBuilder › In the DataTable
 */
export const AdvancedFilter: Story = { name: 'Advanced filter', render: () => <AdvancedFilterTable /> };
