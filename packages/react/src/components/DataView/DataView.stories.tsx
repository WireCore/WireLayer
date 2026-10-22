import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { useMemo, useState } from 'react';
import { Badge } from '../Badge/Badge.js';
import { Input } from '../Input/Input.js';
import { Select } from '../Select/Select.js';
import { DataView } from './DataView.js';

interface Server {
    name: string;
    location: string;
    status: 'ONLINE' | 'MAINTENANCE' | 'OUTAGE';
    load: number;
}

const servers: Server[] = [
    { name: 'web-01', location: 'Frankfurt', status: 'ONLINE', load: 42 },
    { name: 'web-02', location: 'Frankfurt', status: 'ONLINE', load: 37 },
    { name: 'db-primary', location: 'Frankfurt', status: 'ONLINE', load: 71 },
    { name: 'k8s-node-3', location: 'Nuremberg', status: 'MAINTENANCE', load: 18 },
    { name: 'backup-02', location: 'Nuremberg', status: 'OUTAGE', load: 96 },
    { name: 'cache-01', location: 'Nuremberg', status: 'ONLINE', load: 55 },
    { name: 'mail-01', location: 'Vienna', status: 'ONLINE', load: 12 },
];
const variant = { ONLINE: 'success', MAINTENANCE: 'warn', OUTAGE: 'danger' } as const;

function Demo(args: { label: string; pageSize?: number; layoutToggle?: boolean }) {
    const [layout, setLayout] = useState<'list' | 'grid'>('grid');
    return (
        <DataView {...args} items={servers} layout={layout} onLayoutChange={setLayout} className="max-w-3xl">
            {(item, current) => (
                <div
                    className={
                        current === 'grid'
                            ? 'flex flex-col gap-2 rounded-xl border border-line bg-card p-4'
                            : 'flex items-center gap-4 rounded-xl border border-line bg-card px-4 py-3'
                    }
                >
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-sm text-muted">
                        {item.location} · {item.load}%
                    </span>
                    <Badge variant={variant[item.status]} className={current === 'list' ? 'ml-auto' : 'self-start'}>
                        {item.status}
                    </Badge>
                </div>
            )}
        </DataView>
    );
}

const meta = {
    title: 'Data/DataView',
    component: Demo,
    args: { label: 'Servers', pageSize: 6, layoutToggle: true },
    parameters: { layout: 'padded' },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// A server with 60 machines: pages, search and sorting, answering after a pause
const fleet: Server[] = Array.from({ length: 60 }, (_, index) => ({
    name: `srv-${String(index + 1).padStart(2, '0')}`,
    location: ['Frankfurt', 'Nuremberg', 'Vienna'][index % 3]!,
    status: (['ONLINE', 'ONLINE', 'MAINTENANCE', 'ONLINE', 'OUTAGE'] as const)[index % 5]!,
    load: (index * 37) % 100,
}));
const fleetSource: DataSource<Server> = {
    async getItems({ page = 1, pageSize = 6, search = '', sorting = [], signal }) {
        await new Promise((done) => setTimeout(done, 500));
        if (signal.aborted) throw new DOMException('aborted', 'AbortError');
        const found = fleet.filter((machine) => machine.name.includes(search) || machine.location.includes(search));
        const sort = sorting[0];
        if (sort) found.sort((a, b) => (a[sort.id as 'load'] > b[sort.id as 'load'] ? 1 : -1) * (sort.desc ? -1 : 1));
        return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
    },
};
const card = (item: Server) => (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-card px-4 py-3">
        <span className="font-semibold">{item.name}</span>
        <span className="text-sm text-muted">
            {item.location} · {item.load}%
        </span>
        <Badge variant={variant[item.status]} className="ml-auto">
            {item.status}
        </Badge>
    </div>
);

function ServerDemo() {
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<string | null>('name');
    const query = useMemo(() => ({ search, sorting: [{ id: sort ?? 'name', desc: sort === 'load' }] }), [search, sort]);
    return (
        <DataView
            label="Servers"
            dataSource={fleetSource}
            query={query}
            pageSize={6}
            pageSizes={[6, 12, 24]}
            layoutToggle={false}
            className="max-w-3xl"
            toolbar={
                <>
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search servers"
                        placeholder="Search …"
                        className="max-w-60"
                    />
                    <Select
                        items={[
                            { value: 'name', label: 'Name' },
                            { value: 'load', label: 'Load' },
                        ]}
                        value={sort}
                        onValueChange={setSort}
                        aria-label="Sort order"
                        className="max-w-44"
                    />
                </>
            }
            noResults="No server matches the search."
        >
            {card}
        </DataView>
    );
}

/** Pages from a data source; the toolbar searches and sorts – a change starts at page 1 */
export const ServerData: Story = { name: 'Server data', render: () => <ServerDemo /> };

/** The list grows: "Load more" – and with autoLoad as soon as its end scrolls into view */
export const Infinite: Story = {
    name: 'Infinite loading',
    render: () => (
        <DataView
            label="Servers"
            dataSource={fleetSource}
            pageSize={8}
            loadMode="infinite"
            autoLoad
            layoutToggle={false}
            className="max-w-3xl"
        >
            {card}
        </DataView>
    ),
};

function ManualDemo() {
    const [page, setPage] = useState(1);
    const [items, setItems] = useState(fleet.slice(0, 5));
    const [loading, setLoading] = useState(false);
    const load = async (next: number) => {
        setPage(next);
        setLoading(true);
        await new Promise((done) => setTimeout(done, 400));
        setItems(fleet.slice((next - 1) * 5, next * 5));
        setLoading(false);
    };
    return (
        <DataView
            label="Servers"
            items={items}
            manual
            totalCount={fleet.length}
            pageSize={5}
            page={page}
            loading={loading}
            layoutToggle={false}
            className="max-w-3xl"
            onPageChange={(next) => void load(next)}
        >
            {card}
        </DataView>
    );
}

/** The parent pages (manual): it loads the page the pagination asks for and gives the number of all items */
export const Manual: Story = { name: 'Manual pages', render: () => <ManualDemo /> };

const failing: DataSource<Server> = { getItems: async () => Promise.reject(new Error('Server unreachable')) };

/** Placeholders while loading, an error with "Try again", the empty state */
export const States: Story = {
    name: 'Loading, error and empty',
    render: () => (
        <div className="grid max-w-3xl gap-8">
            <DataView label="Loading" items={[]} loading skeletonCount={3} layoutToggle={false}>
                {card}
            </DataView>
            <DataView label="Error" dataSource={failing} layoutToggle={false}>
                {card}
            </DataView>
            <DataView label="Empty" items={[]} layoutToggle={false} empty="No servers created yet.">
                {card}
            </DataView>
        </div>
    ),
};
