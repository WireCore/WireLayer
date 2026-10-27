import { Container, Database, EllipsisVertical, HardDrive, Pencil, Server } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { ConditionGroup } from '@wirecore/wirelayer-recipes';
import { computed, ref, type ConcreteComponent } from 'vue';
import { dateInput, defineMatchMode, moveItem, moveTreeRow, numberInput, type RowsRequest } from './index.js';
import { virtualRows } from '../virtual/index.js';
import Badge from '../components/Badge/Badge.vue';
import Button from '../components/Button/Button.vue';
import Checkbox from '../components/Checkbox/Checkbox.vue';
import Field from '../components/Field/Field.vue';
import IconButton from '../components/IconButton/IconButton.vue';
import NumberInput from '../components/NumberInput/NumberInput.vue';
import Progress from '../components/Progress/Progress.vue';
import Select from '../components/Select/Select.vue';
import Switch from '../components/Switch/Switch.vue';
import DataTable from './DataTable.vue';

// The feature modules of the tables below, each imported on its own: virtual rows, DatePicker and NumberInput
const features = [virtualRows, dateInput, numberInput];

interface ServerRow {
    id: string;
    name: string;
    ip: string;
    location: string;
    status: 'ONLINE' | 'MAINTENANCE' | 'OUTAGE';
    load: number;
    icon: unknown;
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

const columns = [
    { id: 'name', header: 'Name', sortable: true },
    { id: 'location', header: 'Location', sortable: true },
    { id: 'status', header: 'Status' },
    { id: 'load', header: 'Load', sortable: true },
    { id: 'actions', header: 'Actions', accessor: () => null, align: 'end' as const },
];

const statusVariant = { ONLINE: 'success', MAINTENANCE: 'warn', OUTAGE: 'danger' } as const;

const meta = {
    title: 'Data/DataTable',
    // Generic component / required field prop: Storybook's Vue types can't infer args here
    component: DataTable as ConcreteComponent,
    args: { data: servers, columns, caption: 'Servers', pageSize: 4, selectable: true, loading: false },
    argTypes: { data: { control: false }, columns: { control: false } },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { Badge, DataTable: DataTable as ConcreteComponent, IconButton, Progress },
        setup: () => ({
            features,
            args,
            selection: ref<string[]>([]),
            statusVariant,
            Pencil,
            EllipsisVertical,
            getRowId: (row: ServerRow) => row.id,
            rowLabel: (row: ServerRow) => row.name,
        }),
        template: `
            <div class="flex max-w-[900px] flex-col gap-2">
                <DataTable
                    :features="features"
                    v-bind="args"
                    v-model:selection="selection"
                    :get-row-id="getRowId"
                    :row-label="rowLabel"
                    class="overflow-hidden rounded-2xl border border-line bg-card"
                >
                    <template #cell-name="{ row }">
                        <span class="flex items-center gap-2.5">
                            <span class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-2">
                                <component :is="row.icon" class="size-4" aria-hidden="true" />
                            </span>
                            <span class="flex flex-col">
                                <span class="font-semibold">{{ row.name }}</span>
                                <span class="font-mono text-[11px] text-muted">{{ row.ip }}</span>
                            </span>
                        </span>
                    </template>
                    <template #cell-location="{ value }"><span class="text-muted">{{ value }}</span></template>
                    <template #cell-status="{ row }">
                        <Badge :variant="statusVariant[row.status]">{{ row.status }}</Badge>
                    </template>
                    <template #cell-load="{ row }">
                        <span class="flex items-center gap-2.5">
                            <Progress :value="row.load" :show-value="false" :aria-label="'Load ' + row.name" class="flex-1" />
                            <span class="w-9 text-right font-mono text-[11px] text-muted">{{ row.load }}%</span>
                        </span>
                    </template>
                    <template #cell-actions="{ row }">
                        <span class="flex justify-end gap-0.5">
                            <IconButton :icon="Pencil" :label="'Edit ' + row.name" variant="text" size="sm" />
                            <IconButton :icon="EllipsisVertical" :label="'More actions for ' + row.name" variant="text" size="sm" />
                        </span>
                    </template>
                </DataTable>
                <p class="text-xs text-muted" aria-live="polite">Selected: {{ selection.join(', ') || '–' }}</p>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

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

/** TreeTable: rows with child rows, expanded with the button in the first cell */
export const Tree: Story = {
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: fileRows,
            columns: [
                { id: 'name', header: 'Name' },
                { id: 'size', header: 'Size', align: 'end' as const },
                { id: 'modified', header: 'Modified' },
            ],
            expanded: ref(['projects']),
            getRowId: (row: FileRow) => row.id,
            rowLabel: (row: FileRow) => row.name,
            getSubRows: (row: FileRow) => row.children,
        }),
        template: `
            <DataTable
                :features="features"
                v-model:expanded="expanded"
                :data="rows"
                :columns="columns"
                caption="Files"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                :get-sub-rows="getSubRows"
                class="max-w-[640px] overflow-hidden rounded-2xl border border-line bg-card"
            />`,
    }),
};

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

const hostColumns = [
    {
        id: 'name',
        header: 'Name',
        sortable: true,
        filter: 'text' as const,
        pinned: 'start' as const,
        width: 160,
        editable: true,
    },
    { id: 'location', header: 'Location', sortable: true, filter: 'select' as const, width: 170 },
    { id: 'os', header: 'Operating system', width: 180 },
    { id: 'owner', header: 'Owner', filter: 'select' as const, width: 180, editable: true },
    { id: 'load', header: 'Load', sortable: true, align: 'end' as const, width: 130 },
];

/** Search, column filters, pinned first column, resizable widths, column menu, CSV export, editing */
export const Tools: Story = {
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const rows = ref(hosts.map((host) => ({ ...host })));
            const lastEdit = ref('–');
            return {
                features,
                rows,
                lastEdit,
                columns: hostColumns,
                getRowId: (row: HostRow) => row.id,
                rowLabel: (row: HostRow) => row.name,
                onEdit: ({ rowId, columnId, value }: { rowId: string; columnId: keyof HostRow; value: unknown }) => {
                    rows.value = rows.value.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row));
                    lastEdit.value = `${rowId}: ${columnId} = ${value}`;
                },
            };
        },
        template: `
            <div class="flex max-w-[720px] flex-col gap-2">
                <DataTable
                    :features="features"
                    :data="rows"
                    :columns="columns"
                    caption="Servers"
                    :get-row-id="getRowId"
                    :row-label="rowLabel"
                    search
                    resizable
                    column-toggle
                    export-filename="server"
                    selectable
                    class="overflow-hidden rounded-2xl border border-line bg-card"
                    @cell-edit="onEdit"
                />
                <p class="text-xs text-muted">Last changed: {{ lastEdit }}</p>
            </div>`,
    }),
};

/** Rows grouped by location – each group opens and closes */
export const Grouped: Story = {
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: hosts,
            columns: [
                { id: 'name', header: 'Name', sortable: true },
                { id: 'location', header: 'Location' },
                { id: 'owner', header: 'Owner' },
                { id: 'load', header: 'Load', sortable: true, align: 'end' as const },
            ],
            getRowId: (row: HostRow) => row.id,
        }),
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Servers by location"
                :get-row-id="getRowId"
                group-by="location"
                class="max-w-[720px] overflow-hidden rounded-2xl border border-line bg-card"
            />`,
    }),
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

const machineColumns = [
    { id: 'name', header: 'Name', width: 170, sortable: true, filter: 'text' as const, copyable: true },
    { id: 'location', header: 'Location', width: 180, sortable: true, filter: 'multiSelect' as const, groupable: true },
    { id: 'os', header: 'System', width: 170, filter: 'select' as const, hideBelow: 'md' as const, groupable: true },
    { id: 'cores', header: 'Cores', width: 130, sortable: true, align: 'end' as const, filter: 'number' as const },
    {
        id: 'load',
        header: 'Load',
        width: 170,
        sortable: true,
        align: 'end' as const,
        filter: 'number' as const,
        format: (value: unknown) => `${value}%`,
    },
    {
        id: 'since',
        header: 'In service since',
        width: 200,
        sortable: true,
        filter: 'date' as const,
        format: (value: unknown) => new Date(String(value)).toLocaleDateString('en-US'),
    },
    {
        id: 'online',
        header: 'Online',
        width: 130,
        filter: 'boolean' as const,
        format: (value: unknown) => (value ? 'Yes' : 'No'),
    },
];
const machineId = (row: MachineRow) => row.id;
const machineName = (row: MachineRow) => row.name;
const card = 'overflow-hidden rounded-2xl border border-line bg-card';
const rowColumns = machineColumns.slice(0, 5).map((column) => ({ ...column, filter: undefined }));
const shortDate = (value: unknown) => new Date(String(value)).toLocaleDateString('en-US');

/**
 * Filter menu per column (match modes, several conditions with and/or), sorting by several columns
 * (Shift+click), column menu (sort, pin, move, hide, group), columns by drag and drop, search with marked hits,
 * rows per page
 */
export const FilterMenu: Story = {
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: machines(40),
            columns: machineColumns,
            card,
            getRowId: machineId,
            rowLabel: machineName,
            sorting: ref([{ id: 'location', desc: false }]),
        }),
        template: `
            <DataTable
                :features="features"
                v-model:sorting="sorting"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                filter-display="menu"
                sort-mode="multiple"
                column-menu
                reorderable-columns
                resizable
                search
                highlight-search
                column-toggle
                :page-size="8"
                :page-size-options="[8, 20, 50]"
                :class="card"
                class="max-w-[1000px]"
            />`,
    }),
};

/** Details per row, row numbers, actions (menu and right click), rows by drag and drop or arrow keys, one choice */
export const Rows: Story = {
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const rows = ref(machines(6));
            const last = ref('–');
            return {
                features,
                rows,
                last,
                card,
                selection: ref(['vm-0002']),
                columns: rowColumns,
                getRowId: machineId,
                rowLabel: machineName,
                actions: [
                    { value: 'restart', label: 'Restart' },
                    { value: 'snapshot', label: 'Create snapshot' },
                    { type: 'separator' as const },
                    { value: 'delete', label: 'Delete', danger: true },
                ],
                onReorder: ({ from, to }: { from: number; to: number }) =>
                    (rows.value = moveItem(rows.value, from, to)),
                onAction: ({ value, rowId }: { value: string; rowId: string }) => (last.value = `${value}: ${rowId}`),
            };
        },
        template: `
            <div class="flex max-w-[900px] flex-col gap-2">
                <DataTable
                    :features="features"
                    v-model:selection="selection"
                    :data="rows"
                    :columns="columns"
                    caption="Machines"
                    :get-row-id="getRowId"
                    :row-label="rowLabel"
                    selectable
                    selection-mode="single"
                    reorderable-rows
                    row-numbers
                    :row-actions="actions"
                    context-menu
                    :default-expanded="['vm-0001']"
                    :class="card"
                    @row-reorder="onReorder"
                    @row-action="onAction"
                >
                    <template #expansion="{ row }">
                        <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
                            <dt class="text-muted">System</dt><dd>{{ row.os }}</dd>
                            <dt class="text-muted">In service since</dt><dd>{{ row.since }}</dd>
                        </dl>
                    </template>
                </DataTable>
                <p class="text-xs text-muted">Selection: {{ selection.join(', ') || '–' }} · Action: {{ last }}</p>
            </div>`,
    }),
};

/** Details on some rows only (`row-expandable`): the others have no button, their cell keeps its width */
export const RowDetails: Story = {
    name: 'Details on some rows',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            rows: machines(4),
            columns: rowColumns,
            getRowId: machineId,
            rowLabel: machineName,
            card,
            withDetails: (row: MachineRow) => row.id !== 'vm-0002',
        }),
        template: `
            <DataTable
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                :row-expandable="withDetails"
                :default-expanded="['vm-0001']"
                :class="['max-w-[900px]', card]"
            >
                <template #expansion="{ row }">
                    <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
                        <dt class="text-muted">System</dt><dd>{{ row.os }}</dd>
                    </dl>
                </template>
            </DataTable>`,
    }),
};

/** `bordered` frames the table (here with `gridlines`); `paginator-edges` adds first/last page, `paginator-align` centres */
export const BorderAndPagination: Story = {
    name: 'Border and pagination',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({ rows: machines(12), columns: rowColumns, getRowId: machineId }),
        template: `
            <DataTable
                class="max-w-[900px]"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                gridlines
                bordered
                :page-size="4"
                paginator-edges
                paginator-align="center"
            />`,
    }),
};

/** Editing a whole row: text, number, choice, date and checkbox, with a check per value */
export const RowEditing: Story = {
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const rows = ref(machines(5));
            return {
                features,
                rows,
                card,
                getRowId: machineId,
                rowLabel: machineName,
                columns: [
                    {
                        id: 'name',
                        header: 'Name',
                        editable: true,
                        validate: (value: unknown) => (value ? undefined : 'Please enter a name'),
                    },
                    { id: 'location', header: 'Location', editable: true, editor: 'select', editOptions: locations },
                    {
                        id: 'cores',
                        header: 'Cores',
                        align: 'end',
                        editable: true,
                        editor: 'number',
                        validate: (value: unknown) => (Number(value) > 0 ? undefined : 'At least 1 core'),
                    },
                    { id: 'since', header: 'In service since', editable: true, editor: 'date', format: shortDate },
                    {
                        id: 'online',
                        header: 'Online',
                        editable: true,
                        editor: 'checkbox',
                        format: (value: unknown) => (value ? 'Yes' : 'No'),
                    },
                ],
                onRowEdit: ({ rowId, values }: { rowId: string; values: Partial<MachineRow> }) =>
                    (rows.value = rows.value.map((row) => (row.id === rowId ? { ...row, ...values } : row))),
            };
        },
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                edit-mode="row"
                :class="card"
                class="max-w-[1000px]"
                @row-edit="onRowEdit"
            />`,
    }),
};

/** Column groups in the header, totals in the footer and per group */
export const Totals: Story = {
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: machines(12),
            card,
            getRowId: machineId,
            columns: [
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
                    format: (value: unknown) => (value ? 'Yes' : 'No'),
                    aggregate: (values: unknown[]) => `${values.filter(Boolean).length} online`,
                },
            ],
        }),
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Resources by location"
                :get-row-id="getRowId"
                group-by="location"
                gridlines
                :class="card"
                class="max-w-[820px]"
            />`,
    }),
};

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
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: widthRows,
            card,
            columns: machineColumns.slice(0, 3).map((column) => ({ ...column, filter: undefined, copyable: false })),
            getRowId: machineId,
        }),
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                virtual
                scroll-height="320px"
                resizable
                :class="[card, 'max-w-[900px]']"
            />`,
    }),
};

/**
 * 5.000 rows, only the visible ones are rendered. The first row (vm-0001) is frozen on purpose (`frozenRows`) and stays
 * below the header while the rest scrolls. Row height, full screen and more rows when scrolled to the end.
 */
export const Large: Story = {
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const rows = ref(machines(2000));
            const loading = ref(false);
            return {
                features,
                rows,
                loading,
                card,
                count: computed(() => rows.value.length),
                columns: machineColumns.slice(0, 5),
                getRowId: machineId,
                onLoadMore: () => {
                    if (rows.value.length >= 5000) return;
                    loading.value = true;
                    setTimeout(() => {
                        rows.value = [...rows.value, ...machines(1000, rows.value.length)];
                        loading.value = false;
                    }, 400);
                },
            };
        },
        template: `
            <div class="flex max-w-[900px] flex-col gap-2">
                <DataTable
                    :features="features"
                    :data="rows"
                    :columns="columns"
                    caption="All machines"
                    :get-row-id="getRowId"
                    virtual
                    scroll-height="420px"
                    :frozen-rows="['vm-0001']"
                    :loading="loading"
                    density-toggle
                    fullscreen-toggle
                    striped
                    :class="card"
                    @load-more="onLoadMore"
                />
                <p class="text-xs text-muted" aria-live="polite">{{ count }} rows loaded</p>
            </div>`,
    }),
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
const serviceColumns = [
    { id: 'name', header: 'Name', sortable: true, filter: 'text' as const },
    {
        id: 'team',
        header: 'Team',
        // Own filter input (slot #filter-team) with an own comparison
        filterFn: (value: unknown, filter: unknown) => !filter || value === filter,
    },
    {
        id: 'tags',
        header: 'Tags',
        format: (value: unknown) => (value as string[]).join(', '),
        filter: 'select' as const,
        filterMatchMode: 'arrayContains',
        filterOptions: ['web', 'db', 'internal', 'external'],
    },
    {
        id: 'priority',
        header: 'Priority',
        format: (value: unknown) => priorities[Number(value)]!,
        filter: 'multiSelect' as const,
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
        align: 'end' as const,
        sortable: true,
        format: euro,
        filter: 'number' as const,
        // From and to in the filter row, either may stay empty
        filterMatchMode: 'between',
    },
    {
        id: 'since',
        header: 'Since',
        format: shortDate,
        filter: 'date' as const,
        filterMatchMode: 'between',
    },
];

/**
 * Own filters: an own input per column (slot), an own comparison (`filterFn`), an own match mode for lists,
 * ranges in the filter row, choices with values of their own (grouped, several). The filter row can be hidden.
 */
export const OwnFilters: Story = {
    name: 'Custom filters',
    render: () => ({
        components: { Badge, Checkbox, DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: services,
            columns: serviceColumns,
            card,
            getRowId: (row: ServiceRow) => row.id,
        }),
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Services"
                :get-row-id="getRowId"
                filter-toggle
                no-results-text="No service matches the filters."
                :class="card"
                class="max-w-[1100px]"
            >
                <template #toolbarStart><Badge>15 services</Badge></template>
                <template #filter-team="{ value, setValue }">
                    <Checkbox :checked="value === 'Team Web'" @update:checked="setValue($event === true ? 'Team Web' : null)">
                        Only Team Web
                    </Checkbox>
                </template>
            </DataTable>`,
    }),
};

const keyboardColumns = [
    { id: 'name', header: 'Name', width: 170, sortable: true, pinned: 'start' as const, editable: true },
    {
        id: 'location',
        header: 'Location',
        width: 170,
        editable: true,
        editor: 'select' as const,
        editOptions: locations,
    },
    { id: 'os', header: 'System', width: 170 },
    { id: 'cores', header: 'Cores', width: 120, align: 'end' as const, editable: true, editor: 'number' as const },
    { id: 'load', header: 'Load', width: 150, align: 'end' as const },
    { id: 'since', header: 'In service since', width: 190, format: shortDate },
    { id: 'online', header: 'Online', width: 130, format: (value: unknown) => (value ? 'Yes' : 'No') },
];

/**
 * Keyboard like a spreadsheet (`navigation="grid"`): one Tab stop, arrow keys from cell to cell, Home/End,
 * Ctrl+Home/End, Page Up/Down, Enter or F2 edits, Escape leaves the editor, Space selects the row. 2.000 rows
 * (only the visible ones rendered), a pinned column and a frozen row.
 */
export const Keyboard: Story = {
    name: 'Keyboard like a spreadsheet',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const rows = ref(machines(2000));
            return {
                features,
                rows,
                card,
                columns: keyboardColumns,
                getRowId: machineId,
                rowLabel: machineName,
                onEdit: ({ rowId, columnId, value }: { rowId: string; columnId: string; value: unknown }) =>
                    (rows.value = rows.value.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row))),
            };
        },
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                navigation="grid"
                selectable
                virtual
                scroll-height="420px"
                :frozen-rows="['vm-0001']"
                status-bar
                :class="card"
                class="max-w-[900px]"
                @cell-edit="onEdit"
            />`,
    }),
};

/** Keyboard navigation with grouped rows: Enter on a group opens or closes it */
export const KeyboardGrouped: Story = {
    name: 'Keyboard with groups',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: machines(12),
            card,
            columns: machineColumns.slice(0, 5).map((column) => ({ ...column, filter: undefined })),
            getRowId: machineId,
            rowLabel: machineName,
        }),
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Machines by location"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                navigation="grid"
                group-by="location"
                selectable
                :class="card"
                class="max-w-[900px]"
            />`,
    }),
};

/**
 * Status bar below the table: rows, filtered and selected rows, sum and average of the selected numbers. Long
 * headers wrap, a double click on a column edge fits its width; the selection as CSV text (`generateCsv`).
 */
export const StatusBar: Story = {
    name: 'Status bar',
    render: () => ({
        components: { Button, DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const table = ref<{ generateCsv: (options?: object) => string } | null>(null);
            const csv = ref('');
            return {
                features,
                table,
                csv,
                rows: machines(12),
                card,
                selection: ref(['vm-0002', 'vm-0003', 'vm-0005']),
                getRowId: machineId,
                rowLabel: machineName,
                columns: [
                    { id: 'name', header: 'Name', width: 150 },
                    { id: 'location', header: 'Location', width: 150 },
                    { id: 'cores', header: 'Cores per machine', width: 120, align: 'end' as const },
                    {
                        id: 'load',
                        header: 'Average monthly load',
                        width: 150,
                        align: 'end' as const,
                        exportHeader: 'Load (%)',
                    },
                ],
                showCsv: () => (csv.value = table.value?.generateCsv({ selectionOnly: true, bom: false }) ?? ''),
            };
        },
        template: `
            <div class="flex max-w-[760px] flex-col gap-3">
                <DataTable
                    :features="features"
                    ref="table"
                    v-model:selection="selection"
                    :data="rows"
                    :columns="columns"
                    caption="Machines"
                    :get-row-id="getRowId"
                    :row-label="rowLabel"
                    selectable
                    search
                    resizable
                    wrap-headers
                    status-bar
                    :class="card"
                />
                <Button variant="outline" size="sm" class="self-start" @click="showCsv">Selection as CSV</Button>
                <pre v-if="csv" class="overflow-auto rounded-lg bg-bg-2 p-3 text-xs">{{ csv }}</pre>
            </div>`,
    }),
};

/**
 * Rows as links: the name is a real link (Ctrl+click or middle click opens a new tab), a click anywhere on the
 * row follows it. `row-click` reports the click – `event.preventDefault()` there navigates with a router instead.
 */
export const RowLinks: Story = {
    name: 'Rows as links',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const last = ref('–');
            return {
                features,
                last,
                card,
                rows: machines(6),
                columns: rowColumns.map((column) => ({ ...column, copyable: undefined })),
                getRowId: machineId,
                rowHref: (row: MachineRow) => `#/machines/${row.id}`,
                onRowClick: ({ href }: { href?: string }) => (last.value = href ?? '–'),
            };
        },
        template: `
            <div class="flex max-w-[900px] flex-col gap-2">
                <DataTable
                    :features="features"
                    :data="rows"
                    :columns="columns"
                    caption="Machines"
                    :get-row-id="getRowId"
                    :row-href="rowHref"
                    :class="card"
                    @row-click="onRowClick"
                />
                <p class="text-xs text-muted" aria-live="polite">Last opened: {{ last }}</p>
            </div>`,
    }),
};

/** While loading, placeholder rows keep the layout (`loading-variant="skeleton"`) */
export const SkeletonLoading: Story = {
    name: 'Loading with skeleton',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent, Switch },
        setup: () => ({
            features,
            loading: ref(true),
            rows: machines(8),
            card,
            columns: rowColumns,
            getRowId: machineId,
        }),
        template: `
            <div class="flex max-w-[900px] flex-col gap-3">
                <Switch v-model:checked="loading">Loading</Switch>
                <DataTable
                    :features="features"
                    :data="rows"
                    :columns="columns"
                    caption="Machines"
                    :get-row-id="getRowId"
                    :loading="loading"
                    loading-variant="skeleton"
                    :page-size="4"
                    selectable
                    :class="card"
                />
            </div>`,
    }),
};

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
const planColumns = [
    {
        id: 'name',
        header: 'Name',
        editable: true,
        // Asks the "server": vm-0002 is taken
        validate: (value: unknown) =>
            new Promise<string | undefined>((done) =>
                setTimeout(() => done(value === 'vm-0002' ? 'This name is already taken' : undefined), 300)
            ),
    },
    {
        id: 'location',
        header: 'Location',
        editable: true,
        editor: 'select' as const,
        editOptions: locations.map((location) => ({
            value: location,
            label: location,
            group: location === 'Vienna' || location === 'Zurich' ? 'Abroad' : 'Germany',
        })),
    },
    { id: 'cores', header: 'Cores', align: 'end' as const, editable: true },
    {
        id: 'services',
        header: 'Services',
        editable: true,
        editor: 'multiSelect' as const,
        editOptions: ['Web', 'Database', 'Cache', 'Backup'],
        format: (value: unknown) => (value as string[]).join(', '),
    },
    {
        id: 'maintenance',
        header: 'Maintenance',
        editable: true,
        editor: 'datetime' as const,
        format: (value: unknown) =>
            new Date(String(value)).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
    },
    { id: 'notes', header: 'Note', editable: true, editor: 'textarea' as const },
];

/**
 * Editors: a choice with groups, several choices, date with time, text over several lines (Ctrl+Enter saves), an
 * own editor (slot `#editor-cores`) and a check that asks the server
 */
export const Editors: Story = {
    name: 'Custom editors',
    render: () => ({
        components: { Button, DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const rows = ref(plans.map((plan) => ({ ...plan })));
            return {
                features,
                rows,
                card,
                columns: planColumns,
                getRowId: (row: PlanRow) => row.id,
                rowLabel: (row: PlanRow) => row.name,
                onEdit: ({ rowId, columnId, value }: { rowId: string; columnId: string; value: unknown }) =>
                    (rows.value = rows.value.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row))),
            };
        },
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Maintenance schedule"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                :class="card"
                class="max-w-[1100px]"
                @cell-edit="onEdit"
            >
                <template #editor-cores="{ value, setValue, commit, cancel }">
                    <span class="flex items-center gap-1">
                        <Button size="sm" variant="outline" @click="setValue(Math.max(1, Number(value) / 2))">÷ 2</Button>
                        <span class="w-8 text-center tabular-nums">{{ value }}</span>
                        <Button size="sm" variant="outline" @click="setValue(Number(value) * 2)">× 2</Button>
                        <Button size="sm" @click="commit">OK</Button>
                        <Button size="sm" variant="text" @click="cancel">Cancel</Button>
                    </span>
                </template>
            </DataTable>`,
    }),
};

const excelColumns = [
    { id: 'name', header: 'Name', width: 150, sortable: true },
    { id: 'location', header: 'Location', width: 150, groupable: true },
    { id: 'os', header: 'System', width: 150 },
    { id: 'cores', header: 'Cores', width: 110, align: 'end' as const, aggregate: 'sum' as const },
    {
        id: 'load',
        header: 'Load',
        width: 140,
        align: 'end' as const,
        aggregate: 'avg' as const,
        format: (value: unknown) => `${value}%`,
    },
    { id: 'since', header: 'In service since', width: 170, filter: 'date' as const, format: shortDate },
    { id: 'online', header: 'Online', width: 110, format: (value: unknown) => (value ? 'Yes' : 'No') },
];

/**
 * Excel export without a library (`export-formats="['csv', 'xlsx']"`): numbers stay numbers, dates become dates,
 * the header row is bold and frozen, column widths fit, a bold row per group and the totals at the end.
 * `generateXlsx()` returns the file as bytes, `exportXlsx()` downloads it.
 */
export const ExcelExport: Story = {
    name: 'Excel export',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: machines(12),
            columns: excelColumns,
            card,
            getRowId: machineId,
            rowLabel: machineName,
        }),
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                group-by="location"
                selectable
                export-filename="machines"
                :export-formats="['csv', 'xlsx']"
                :class="card"
                class="max-w-[1000px]"
            />`,
    }),
};

const sheetColumns = [
    { id: 'name', header: 'Name', width: 140 },
    {
        id: 'location',
        header: 'Location',
        width: 150,
        editable: true,
        editor: 'select' as const,
        editOptions: locations,
    },
    {
        id: 'cores',
        header: 'Cores',
        width: 110,
        align: 'end' as const,
        editable: true,
        editor: 'number' as const,
        validate: (value: unknown) => (Number(value) >= 1 && Number(value) <= 128 ? undefined : 'Between 1 and 128'),
    },
    { id: 'load', header: 'Load', width: 130, align: 'end' as const, format: (value: unknown) => `${value}%` },
    { id: 'since', header: 'In service since', width: 170, editable: true, editor: 'date' as const, format: shortDate },
];
type Edit = { rowId: string; columnId: string; value: unknown };

/**
 * Like a spreadsheet (`cell-selection`): drag over cells, Shift+click or Shift+arrow keys mark a range, Ctrl+C
 * copies it as tab-separated text, Ctrl+V pastes text from Excel from the active cell on – numbers and dates in
 * the notation of the locale, choices by their label, every cell checked – and Ctrl+Z/Ctrl+Y undo and redo.
 */
export const Spreadsheet: Story = {
    name: 'Like a spreadsheet: select, copy, paste',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const rows = ref(machines(8));
            const marked = ref('–');
            const problems = ref<string[]>([]);
            return {
                features,
                rows,
                marked,
                problems,
                card,
                columns: sheetColumns,
                getRowId: machineId,
                rowLabel: machineName,
                onRange: (selection: { rowIds: string[]; columnIds: string[] } | null) =>
                    (marked.value = selection
                        ? `${selection.rowIds.length * selection.columnIds.length} cells (${selection.rowIds[0]} to ${selection.rowIds.at(-1)})`
                        : '–'),
                onPaste: (paste: { errors: { rowId: string; columnId: string; message: string }[] }) =>
                    (problems.value = paste.errors.map(
                        (error) => `${error.rowId}, ${error.columnId}: ${error.message}`
                    )),
                onEdit: ({ rowId, columnId, value }: Edit) =>
                    (rows.value = rows.value.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row))),
            };
        },
        template: `
            <div class="flex max-w-[900px] flex-col gap-3">
                <DataTable
                    :features="features"
                    :data="rows"
                    :columns="columns"
                    caption="Machines"
                    :get-row-id="getRowId"
                    :row-label="rowLabel"
                    navigation="grid"
                    cell-selection
                    :class="card"
                    @cell-selection-change="onRange"
                    @cell-paste="onPaste"
                    @cell-edit="onEdit"
                />
                <p class="text-xs text-muted" aria-live="polite">Marked: {{ marked }}</p>
                <ul v-if="problems.length" class="list-disc ps-5 text-xs text-danger">
                    <li v-for="problem in problems" :key="problem">{{ problem }}</li>
                </ul>
            </div>`,
    }),
};

/**
 * Collect and save (`edit-mode="batch"`): changes stay in the table, marked, until "Save" (`save` gets all of
 * them) or "Discard". Ctrl+Z and Ctrl+Y (or the buttons) undo and redo edits and pastes.
 */
export const Batch: Story = {
    name: 'Collect and save',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const rows = ref(machines(8));
            const saved = ref('');
            return {
                features,
                rows,
                saved,
                card,
                columns: sheetColumns,
                getRowId: machineId,
                rowLabel: machineName,
                onSave: ({ rows: changed }: { rows: { rowId: string; values: Record<string, unknown> }[] }) => {
                    rows.value = rows.value.map((row) => {
                        const change = changed.find((item) => item.rowId === row.id);
                        return change ? { ...row, ...change.values } : row;
                    });
                    saved.value = `Saved: ${changed.map((item) => item.rowId).join(', ')}`;
                },
            };
        },
        template: `
            <div class="flex max-w-[900px] flex-col gap-3">
                <DataTable
                    :features="features"
                    :data="rows"
                    :columns="columns"
                    caption="Machines"
                    :get-row-id="getRowId"
                    :row-label="rowLabel"
                    edit-mode="batch"
                    navigation="grid"
                    cell-selection
                    :class="card"
                    @save="onSave"
                />
                <p class="text-xs text-muted" aria-live="polite">{{ saved || 'Nothing saved yet' }}</p>
            </div>`,
    }),
};

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

/**
 * Server data source (`:data-source="{ getRows }"`): the table asks for the page with sorting, filters and search,
 * cancels outdated requests, waits for a pause in typing, goes back to page 1 on new filters, keeps answers for 30
 * seconds (`cache-time`) and shows errors with "Try again". `refresh()` asks again.
 */
export const ServerSource: Story = {
    name: 'Server data source',
    render: () => ({
        components: { Button, DataTable: DataTable as ConcreteComponent, Switch },
        setup: () => {
            const table = ref<{ refresh: () => Promise<void> } | null>(null);
            const fail = ref(false);
            return {
                features,
                table,
                fail,
                card,
                source: { getRows: getMachines },
                getRowId: machineId,
                rowLabel: machineName,
                columns: [
                    { id: 'name', header: 'Name', width: 150, sortable: true },
                    {
                        id: 'location',
                        header: 'Location',
                        width: 170,
                        sortable: true,
                        filter: 'select' as const,
                        filterOptions: locations,
                    },
                    { id: 'os', header: 'System', width: 160 },
                    { id: 'cores', header: 'Cores', width: 110, align: 'end' as const, sortable: true },
                    { id: 'load', header: 'Load', width: 130, align: 'end' as const, sortable: true },
                ],
                setFail: (value: boolean) => {
                    fail.value = value;
                    failNext.current = value;
                },
            };
        },
        template: `
            <div class="flex max-w-[900px] flex-col gap-3">
                <DataTable
                    :features="features"
                    ref="table"
                    :columns="columns"
                    caption="Machines"
                    :get-row-id="getRowId"
                    :row-label="rowLabel"
                    :data-source="source"
                    :cache-time="30000"
                    :page-size="10"
                    :page-size-options="[10, 25, 50]"
                    search
                    :class="card"
                >
                    <template #toolbarEnd>
                        <Button variant="outline" size="sm" @click="table?.refresh()">Reload</Button>
                    </template>
                </DataTable>
                <Switch :checked="fail" @update:checked="setFail">Next request fails</Switch>
            </div>`,
    }),
};

const pivotColumns = [
    { id: 'name', header: 'Name' },
    { id: 'location', header: 'Location' },
    { id: 'os', header: 'System' },
    { id: 'cores', header: 'Cores' },
    { id: 'load', header: 'Load' },
    { id: 'year', header: 'Since', accessor: (row: MachineRow) => row.since.slice(0, 4) },
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

/**
 * Pivot (`:pivot="{ rows, columns, values }"`): rows grouped by the values of one column, a column per value of
 * another, the cores summed up (or averaged, counted), totals per row and column. The panel above is built from
 * Selects in the story – the table only needs the configuration.
 */
export const Pivot: Story = {
    name: 'Pivot',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent, Select },
        setup: () => {
            const rowsBy = ref('location');
            const columnsBy = ref('os');
            const aggregate = ref<'sum' | 'avg' | 'count'>('sum');
            return {
                features,
                rowsBy,
                columnsBy,
                aggregate,
                dimensions,
                aggregates,
                card,
                rows: machines(40),
                columns: pivotColumns,
                pivot: computed(() => ({
                    rows: [rowsBy.value],
                    columns: columnsBy.value === rowsBy.value ? [] : [columnsBy.value],
                    values: [{ id: 'cores', aggregate: aggregate.value }],
                })),
            };
        },
        template: `
            <div class="flex max-w-[1000px] flex-col gap-3">
                <div class="flex flex-wrap items-center gap-3 text-sm">
                    <span>Rows</span>
                    <Select v-model="rowsBy" aria-label="Rows" class="w-40" :items="dimensions" />
                    <span>Columns</span>
                    <Select v-model="columnsBy" aria-label="Columns" class="w-40" :items="dimensions" />
                    <span>Values</span>
                    <Select v-model="aggregate" aria-label="Values" class="w-56" :items="aggregates" />
                </div>
                <DataTable
                    :features="features"
                    :data="rows"
                    :columns="columns"
                    caption="Cores by location and system"
                    :pivot="pivot"
                    gridlines
                    :class="card"
                />
            </div>`,
    }),
};

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
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: mergedRows,
            card,
            getRowId: machineId,
            rowLabel: machineName,
            columns: [
                { id: 'location', header: 'Location', rowSpan: 'auto' as const },
                { id: 'os', header: 'System', rowSpan: 'auto' as const },
                { id: 'name', header: 'Name' },
                {
                    id: 'cores',
                    header: 'Cores',
                    align: 'end' as const,
                    accessor: (row: MachineRow) => (row.online ? row.cores : 'Out of service'),
                    colSpan: (row: MachineRow) => (row.online ? 1 : 2),
                },
                {
                    id: 'load',
                    header: 'Load',
                    align: 'end' as const,
                    format: (value: unknown) => `${value}%`,
                },
            ],
        }),
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Machines by location and system"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                gridlines
                :class="card"
                class="max-w-[800px]"
            />`,
    }),
};

/**
 * Find in the table (`find`): the button "Find in table" opens a field; matches are marked, "Match x of y",
 * Enter/Shift+Enter or the arrows go to the next/previous one – also to rows not rendered yet (2.000 rows,
 * virtual scrolling). Escape closes the field. The rows stay as they are (unlike the search filter).
 */
export const Find: Story = {
    name: 'Find',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: machines(2000),
            columns: keyboardColumns.map((column) => ({ ...column, editable: false })),
            card,
            getRowId: machineId,
            rowLabel: machineName,
        }),
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                find
                virtual
                scroll-height="420px"
                :class="card"
                class="max-w-[900px]"
            />`,
    }),
};

/**
 * Print (`print()`): all filtered and sorted rows – not only the current page – as plain text, the header on every
 * page, the totals at the end, no buttons or inputs. Filter with the search first, then "Print".
 */
export const Print: Story = {
    name: 'Print',
    render: () => ({
        components: { Button, DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            table: ref<{ print: (options?: object) => void } | null>(null),
            rows: machines(60),
            columns: excelColumns,
            card,
            getRowId: machineId,
            rowLabel: machineName,
        }),
        template: `
            <DataTable
                :features="features"
                ref="table"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                :page-size="10"
                search
                :class="card"
                class="max-w-[1000px]"
            >
                <template #toolbarEnd>
                    <Button variant="outline" size="sm" @click="table?.print({ title: 'Machines' })">Print</Button>
                </template>
            </DataTable>`,
    }),
};

/**
 * Moving rows between groups and levels: drag a row into another group (or onto its heading) – it takes the
 * values of that group (`group` in `row-reorder`). With the keyboard: arrow keys on the handle, past the edge of a
 * group into the next one. In a tree: before, after or into a row; arrow left/right on the handle move out of or
 * into the row above. Every move is announced.
 */
export const MoveRows: Story = {
    name: 'Moving rows: groups and tree',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => {
            const rows = ref(machines(8));
            const files = ref(fileRows);
            return {
                features,
                rows,
                files,
                card,
                machineColumns: machineColumns.slice(0, 4).map((column) => ({ ...column, filter: undefined })),
                fileColumns: [
                    { id: 'name', header: 'Name' },
                    { id: 'size', header: 'Size', align: 'end' as const },
                    { id: 'modified', header: 'Modified' },
                ],
                getRowId: machineId,
                rowLabel: machineName,
                fileId: (row: FileRow) => row.id,
                fileLabel: (row: FileRow) => row.name,
                children: (row: FileRow) => row.children,
                onMove: ({ from, to, group }: { from: number; to: number; group?: Record<string, unknown> }) => {
                    const next = moveItem(rows.value, from, to);
                    if (group) next[to] = { ...next[to]!, ...group };
                    rows.value = next;
                },
                onTreeMove: (move: { rowId: string; parentId?: string | null; index?: number; to: number }) =>
                    (files.value = moveTreeRow(files.value, move, (row) => row.id, 'children')),
            };
        },
        template: `
            <div class="flex max-w-[800px] flex-col gap-6">
                <DataTable
                    :features="features"
                    :data="rows"
                    :columns="machineColumns"
                    caption="Machines by location"
                    :get-row-id="getRowId"
                    :row-label="rowLabel"
                    group-by="location"
                    reorderable-rows
                    :class="card"
                    @row-reorder="onMove"
                />
                <DataTable
                    :features="features"
                    :data="files"
                    :columns="fileColumns"
                    caption="Files"
                    :get-row-id="fileId"
                    :row-label="fileLabel"
                    :get-sub-rows="children"
                    :default-expanded="['projects', 'customers']"
                    reorderable-rows
                    :class="card"
                    @row-reorder="onTreeMove"
                />
            </div>`,
    }),
};

/**
 * Column groups in the column menu (`column-toggle`): a group shows or hides all its columns, "Move … back" and
 * "Move … forward" move it as a whole (`reorderable-columns`).
 */
export const ColumnGroups: Story = {
    name: 'Managing column groups',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            features,
            rows: machines(6),
            card,
            getRowId: machineId,
            rowLabel: machineName,
            columns: [
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
                        { id: 'cores', header: 'Cores', width: 110, align: 'end' as const },
                        { id: 'load', header: 'Load', width: 130, align: 'end' as const },
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
            ],
        }),
        template: `
            <DataTable
                :features="features"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                column-toggle
                reorderable-columns
                :class="card"
                class="max-w-[1000px]"
            />`,
    }),
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

/**
 * Advanced filter: the rows pass a condition tree (v-model:advanced-filter-value); the toolbar button opens the
 * editor from the `#advancedFilter` slot – here a small own one. The full editor (nested and/or rules) is
 * ConditionBuilder from `@wirecore/wirelayer-blocks-vue`: Blocks › ConditionBuilder › In the DataTable
 */
export const AdvancedFilter: Story = {
    name: 'Advanced filter',
    render: () => ({
        components: { DataTable: DataTable as ConcreteComponent, Field, NumberInput },
        setup: () => ({
            features,
            rows: machines(40),
            columns: machineColumns,
            card,
            getRowId: machineId,
            rowLabel: machineName,
            tree: ref(loadOver(50)),
            loadOver,
            loadOf,
        }),
        template: `
            <DataTable
                :features="features"
                v-model:advanced-filter-value="tree"
                :data="rows"
                :columns="columns"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="rowLabel"
                advanced-filter
                :page-size="10"
                :class="card"
                class="max-w-[1100px]"
            >
                <template #advancedFilter="{ value, setValue }">
                    <Field label="Load over (%)">
                        <NumberInput
                            :model-value="loadOf(value)"
                            :min="0"
                            :max="100"
                            size="sm"
                            @update:model-value="(next) => setValue(loadOver(next))"
                        />
                    </Field>
                </template>
            </DataTable>`,
    }),
};

const resetColumns = [
    { id: 'name', header: 'Name', sortable: true, filter: 'text' as const },
    { id: 'location', header: 'Location', sortable: true, filter: 'select' as const },
    { id: 'load', header: 'Load', sortable: true, align: 'end' as const, format: (value: unknown) => `${value}%` },
];

/**
 * "Reset filters" in the toolbar (`filter-reset`) clears the column filters and the search; `resetState()` also
 * sorts as at the start and forgets the saved state. `state-key` keeps sorting, filters, page, rows per page and
 * whether the filter row shows – not the selection (`state-exclude`, default `['selection']`). The selection as row
 * objects: v-model:selected-rows
 */
export const ResetAndState: Story = {
    name: 'Reset filters and saved state',
    render: () => ({
        components: { Button, DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            servers,
            columns: resetColumns,
            card,
            picked: ref<ServerRow[]>([]),
            table: ref<{ resetState: () => void } | null>(null),
            getRowId: (row: ServerRow) => row.id,
            rowLabel: (row: ServerRow) => row.name,
        }),
        template: `
            <div class="flex max-w-[900px] flex-col gap-2">
                <DataTable
                    ref="table"
                    v-model:selected-rows="picked"
                    :data="servers"
                    :columns="columns"
                    caption="Servers"
                    :get-row-id="getRowId"
                    :row-label="rowLabel"
                    state-key="storybook-reset"
                    :default-sorting="{ id: 'name', desc: false }"
                    :page-size="4"
                    :page-size-options="[4, 6]"
                    search
                    filter-toggle
                    filter-reset
                    selectable
                    :class="card"
                >
                    <template #toolbar>
                        <Button variant="outline" size="sm" @click="table?.resetState()">Reset everything</Button>
                    </template>
                </DataTable>
                <p class="text-xs text-muted" aria-live="polite">
                    Selected: {{ picked.map((row) => row.name).join(', ') || '–' }}
                </p>
            </div>`,
    }),
};

const statusOptions = [
    { value: 'ONLINE', label: 'Online', keywords: ['up'] },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'OUTAGE', label: 'Outage', keywords: ['down'] },
];
const settingsColumns = [
    {
        id: 'name',
        header: 'Name',
        sortable: true,
        filter: 'text' as const,
        cellClass: 'font-semibold',
        filterInputProps: { placeholder: 'Host name …' },
    },
    {
        id: 'status',
        header: 'Status',
        filter: 'multiSelect' as const,
        filterOptions: statusOptions,
        filterInputProps: { filter: true, clearable: true, maxShown: 1, placeholder: 'Any status' },
    },
    {
        id: 'load',
        header: 'Load',
        sortable: true,
        align: 'end' as const,
        headerClass: 'w-28',
        cellClass: (row: ServerRow) => (row.load > 90 ? 'tabular-nums font-semibold text-danger' : 'tabular-nums'),
        format: (value: unknown) => `${value}%`,
    },
    { id: 'actions', header: 'Actions', headerHidden: true, accessor: () => null, align: 'end' as const },
];

/**
 * Per column: `cellClass` (a text or per row) and `headerClass`; `headerHidden` keeps the header text for screen
 * readers only (a column of buttons). `filterInputProps` set up the built-in filter inputs (placeholder; search, clear
 * button and shown values of the list), `#option-<id>` shows the choices – here as badges; `keywords` of a choice are
 * found by the list's search ("down"). `row-keywords`: the search above also finds the IP address, which has no
 * column of its own
 */
export const ColumnSettings: Story = {
    name: 'Column settings and filter inputs',
    render: () => ({
        components: { Badge, DataTable: DataTable as ConcreteComponent, IconButton },
        setup: () => ({
            servers,
            columns: settingsColumns,
            card,
            statusVariant,
            Pencil,
            getRowId: (row: ServerRow) => row.id,
            rowKeywords: (row: ServerRow) => row.ip,
        }),
        template: `
            <DataTable
                :data="servers"
                :columns="columns"
                caption="Servers"
                :get-row-id="getRowId"
                :row-keywords="rowKeywords"
                search
                filter-reset
                :class="card"
                class="max-w-[900px]"
            >
                <template #cell-status="{ row }">
                    <Badge :variant="statusVariant[row.status]">{{ row.status }}</Badge>
                </template>
                <template #option-status="{ item }">
                    <Badge :variant="statusVariant[item.value]">{{ item.label }}</Badge>
                </template>
                <template #cell-actions="{ row }">
                    <IconButton :icon="Pencil" :label="'Edit ' + row.name" variant="text" size="sm" />
                </template>
            </DataTable>`,
    }),
};
