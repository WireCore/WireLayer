import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { filterTableRows, pageTableRows, sortTableRows } from '@wirecore/wirelayer-recipes/native';
import { Eye, Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge } from '../components/Badge/Badge.js';
import { Text } from '../components/Text/Text.js';
import { DataTable } from './DataTable.js';
import type { DataTableColumn, DataTableExportFile, DataTableFilterValue, RowsRequest } from './types.js';

interface Customer {
    id: string;
    name: string;
    city: string;
    status: 'active' | 'paused' | 'canceled';
    revenue: number;
    /** Customer since (ISO date) */
    since: string;
    premium: boolean;
}

const names = [
    'Lindner Bakery',
    'Miller & Sons',
    'Ostrowski Law Office',
    'Haas Garden Center',
    'Brandt Motors',
    'Dr. Yilmaz Practice',
    'Koehler Winery',
    'Fuchs Printing',
    'Sunshine Café',
    'Wagner Carpentry',
    'Petersen Optics',
    'Lakeview Hotel',
];
const cities = ['Berlin', 'Hamburg', 'Cologne', 'Leipzig', 'Munich', 'Vienna'];
const statuses: Customer['status'][] = ['active', 'active', 'paused', 'active', 'canceled'];
const pad = (value: number) => String(value).padStart(2, '0');
const customers: Customer[] = Array.from({ length: 36 }, (_, index) => ({
    id: `k-${String(index + 1).padStart(3, '0')}`,
    name: index < names.length ? names[index]! : `${names[index % names.length]} ${index + 1}`,
    city: cities[(index * 5) % cities.length]!,
    status: statuses[(index * 3) % statuses.length]!,
    revenue: 800 + ((index * 7919) % 42000),
    since: `${2018 + (index % 8)}-${pad((index % 12) + 1)}-${pad((index % 27) + 1)}`,
    premium: index % 4 === 0,
}));

const statusLabel = { active: 'Active', paused: 'Paused', canceled: 'Canceled' } as const;
const statusVariant = { active: 'success', paused: 'warn', canceled: 'outline' } as const;
const euro = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

const columns: DataTableColumn<Customer>[] = [
    { id: 'name', header: 'Customer', sortable: true, filter: 'text', width: 200 },
    { id: 'city', header: 'City', sortable: true, filter: 'select', width: 120 },
    {
        id: 'status',
        header: 'Status',
        sortable: true,
        filter: 'multiSelect',
        width: 130,
        format: (value) => statusLabel[value as Customer['status']],
        cell: (row) => <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>,
    },
    {
        id: 'revenue',
        header: 'Revenue',
        sortable: true,
        align: 'end',
        filter: 'number',
        filterMatchMode: 'gte',
        width: 130,
        format: (value) => euro.format(value as number),
        aggregate: 'sum',
    },
    {
        id: 'since',
        header: 'Customer since',
        sortable: true,
        filter: 'date',
        filterMatchMode: 'between',
        width: 140,
        format: (value) => day.format(new Date(value as string)),
    },
    {
        id: 'premium',
        header: 'Premium',
        filter: 'boolean',
        width: 110,
        format: (value) => (value ? 'Yes' : 'No'),
    },
];

/** DataTable for customers – generic components need their row type in the story */
const CustomerTable = DataTable<Customer>;

const meta = {
    title: 'Data/DataTable',
    component: CustomerTable,
    args: {
        caption: 'Customers',
        columns,
        data: customers,
        getRowId: (row) => row.id,
        rowLabel: (row) => row.name,
        search: true,
        pageSize: 8,
    },
    argTypes: {
        layout: { control: 'inline-radio', options: ['auto', 'table', 'cards'] },
        selectionMode: { control: 'inline-radio', options: ['multiple', 'single'] },
    },
    decorators: [(Story) => <View className="w-full max-w-[760px]">{Story()}</View>],
} satisfies Meta<typeof CustomerTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** layout "auto": a table from 640 pt, cards below – search, sorting (header or "Sort"), filters, revenue sum */
export const Playground: Story = {};

/** One card per customer with "header: value" lines – the mobile default below 640 pt */
export const Cards: Story = {
    name: 'Cards',
    args: { layout: 'cards' },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
};

/** The table on a phone: scrolls sideways, sorted by revenue (descending) at the start */
export const Table: Story = {
    name: 'Table',
    args: { layout: 'table', defaultSorting: { id: 'revenue', desc: true } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
};

function SelectionDemo(props: { selectionMode?: 'multiple' | 'single' }) {
    const [selection, setSelection] = useState<string[]>(['k-002']);
    return (
        <View className="gap-3">
            <CustomerTable
                caption="Customers"
                columns={columns.slice(0, 4)}
                data={customers}
                getRowId={(row) => row.id}
                rowLabel={(row) => row.name}
                pageSize={6}
                selectable
                selectionMode={props.selectionMode}
                selection={selection}
                onSelectionChange={setSelection}
                isRowSelectable={(row) => row.status !== 'canceled'}
            />
            <Text variant="muted">Selected: {selection.join(', ') || '–'}</Text>
        </View>
    );
}

/** Checkboxes per row or card and "Select all rows on this page"; cancelled customers cannot be selected */
export const Selection: Story = {
    name: 'Selection',
    render: (args) => <SelectionDemo selectionMode={args.selectionMode} />,
};

/** selectionMode "single": radio buttons */
export const SingleSelection: Story = {
    name: 'Selection (single)',
    render: () => <SelectionDemo selectionMode="single" />,
};

function FilterDemo() {
    const [filters, setFilters] = useState<Record<string, DataTableFilterValue>>({
        status: { operator: 'and', constraints: [{ matchMode: 'in', value: ['Active', 'Paused'] }] },
        revenue: { operator: 'and', constraints: [{ matchMode: 'gte', value: 10000 }] },
    });
    return (
        <View className="gap-3">
            <CustomerTable
                caption="Customers"
                columns={columns}
                data={customers}
                getRowId={(row) => row.id}
                rowLabel={(row) => row.name}
                search
                highlightSearch
                filters={filters}
                onFiltersChange={setFilters}
                pageSize={8}
            />
            <Text variant="muted">Filter: {Object.keys(filters).join(', ') || 'none'}</Text>
        </View>
    );
}

/**
 * The "Filter" sheet: text, a choice (City), several choices (Status), a minimum (Revenue), a range of dates (Customer
 * since) and yes/no (Premium) – here with two filters set; the search marks its hits
 */
export const Filters: Story = { name: 'Filter', render: () => <FilterDemo /> };

const wait = (ms: number, signal: AbortSignal) =>
    new Promise<void>((done, fail) => {
        const timer = setTimeout(done, ms);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            fail(signal.reason);
        });
    });

/** A server simulated with the table logic of @wirecore/wirelayer-recipes: search, filters, sorting, page */
async function getRows({ page, pageSize, sorting, filters, search, signal }: RowsRequest) {
    await wait(600, signal);
    const found = sortTableRows(
        filterTableRows(customers, columns, {
            search,
            filters: filters as Record<string, DataTableFilterValue>,
            locale: 'en-US',
        }),
        columns,
        sorting,
        'en-US'
    );
    return { rows: pageTableRows(found, page, pageSize), rowCount: found.length };
}

/** dataSource: the table asks the server per page, sorting, filter and search (after a typing pause) */
export const ServerData: Story = {
    name: 'Server data',
    args: { data: undefined, dataSource: { getRows }, pageSize: 6, pageSizeOptions: [6, 12, 24] },
};

function ActionsDemo() {
    const [last, setLast] = useState('');
    return (
        <View className="gap-3">
            <CustomerTable
                caption="Customers"
                columns={columns.slice(0, 4)}
                data={customers}
                getRowId={(row) => row.id}
                rowLabel={(row) => row.name}
                pageSize={5}
                rowActions={(row) => [
                    { value: 'open', label: 'Open', icon: Eye },
                    { value: 'edit', label: 'Edit', icon: Pencil },
                    { type: 'separator' },
                    {
                        value: 'delete',
                        label: 'Delete',
                        icon: Trash2,
                        danger: true,
                        disabled: row.status === 'active',
                    },
                ]}
                onRowAction={({ value, row }) => setLast(`${value}: ${row.name}`)}
                onRowClick={({ row }) => setLast(`Opened: ${row.name}`)}
            />
            <Text variant="muted">Last: {last || '–'}</Text>
        </View>
    );
}

/** "Actions for …" per row opens a sheet; a tap on the row (or its first value) opens the customer */
export const RowActions: Story = { name: 'Row actions', render: () => <ActionsDemo /> };

function ExportDemo() {
    const [file, setFile] = useState<DataTableExportFile | null>(null);
    const size = file ? (typeof file.data === 'string' ? file.data.length : file.data.byteLength) : 0;
    return (
        <View className="gap-3">
            <CustomerTable
                caption="Customers"
                columns={columns}
                data={customers}
                getRowId={(row) => row.id}
                rowLabel={(row) => row.name}
                pageSize={6}
                selectable
                exportFilename="customers"
                exportFormats={['csv', 'xlsx']}
                // In an app: onExport={shareFile} from @wirecore/wirelayer-native/expo-sharing
                onExport={setFile}
            />
            {file ? (
                <View className="gap-1" role="status">
                    <Text>
                        {file.filename} · {file.mimeType} · {size}{' '}
                        {typeof file.data === 'string' ? 'characters' : 'bytes'}
                    </Text>
                    {typeof file.data === 'string' && (
                        <Text variant="muted" numberOfLines={4}>
                            {file.data.replace('﻿', '')}
                        </Text>
                    )}
                </View>
            ) : (
                <Text variant="muted">Nothing exported yet</Text>
            )}
        </View>
    );
}

/**
 * "Export" offers CSV and Excel (all rows, or the selection): `onExport` gets the file – here it is shown, an
 * app hands it to `shareFile` (share sheet)
 */
export const Export: Story = { name: 'Export', render: () => <ExportDemo /> };

function InfiniteDemo() {
    const [rows, setRows] = useState(customers.slice(0, 12));
    const [loading, setLoading] = useState(false);
    return (
        <View className="h-[560px]">
            <CustomerTable
                caption="Customers"
                columns={columns.slice(0, 4)}
                data={rows}
                getRowId={(row) => row.id}
                rowLabel={(row) => row.name}
                className="flex-1"
                loading={loading}
                hasMore={rows.length < customers.length}
                onLoadMore={() => {
                    setLoading(true);
                    setTimeout(() => {
                        setRows(customers.slice(0, rows.length + 12));
                        setLoading(false);
                    }, 700);
                }}
            />
        </View>
    );
}

/** onLoadMore + hasMore: the end of the rows loads 12 more – "Load more" does the same */
export const Infinite: Story = { name: 'Infinite', render: () => <InfiniteDemo /> };

/** groupBy: a heading per city ("City: Berlin, 6 entries") */
export const Groups: Story = {
    name: 'Groups',
    args: { groupBy: 'city', defaultSorting: { id: 'city', desc: false }, pageSize: 12 },
};

/** No rows */
export const Empty: Story = { name: 'Empty', args: { data: [], emptyText: 'No customers yet' } };
