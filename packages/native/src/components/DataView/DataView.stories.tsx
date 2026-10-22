import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes/native';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { SearchField } from '../SearchField/SearchField.js';
import { Text } from '../Text/Text.js';
import { DataView } from './DataView.js';

interface Server {
    id: number;
    name: string;
    city: string;
    status: 'online' | 'maintenance' | 'offline';
    load: number;
}

const cities = ['Frankfurt', 'Berlin', 'Hamburg', 'Munich', 'Vienna'];
const statuses: Server['status'][] = ['online', 'online', 'maintenance', 'online', 'offline'];
const servers: Server[] = Array.from({ length: 42 }, (_, index) => ({
    id: index + 1,
    name: `srv-${String(index + 1).padStart(2, '0')}`,
    city: cities[index % cities.length]!,
    status: statuses[(index * 3) % statuses.length]!,
    load: (index * 37) % 100,
}));

const statusLabel = { online: 'Online', maintenance: 'Maintenance', offline: 'Offline' } as const;

function ServerItem({ server, layout }: { server: Server; layout: 'list' | 'grid' }) {
    return (
        <View
            className={
                layout === 'grid'
                    ? 'gap-2 rounded-card border border-line bg-card p-4'
                    : 'flex-row items-center gap-3 rounded-card border border-line bg-card px-4 py-3'
            }
        >
            <View className="min-w-0 flex-1 gap-0.5">
                <Text className="font-sans-semibold">{server.name}</Text>
                <Text variant="muted">
                    {server.city} · Load {server.load}%
                </Text>
            </View>
            <Badge variant={server.status === 'offline' ? 'outline' : 'soft'}>{statusLabel[server.status]}</Badge>
        </View>
    );
}

const meta = {
    title: 'Data/DataView',
    component: DataView,
    args: {
        label: 'Servers',
        items: servers,
        pageSize: 6,
        children: (item: unknown, layout: 'list' | 'grid') => <ServerItem server={item as Server} layout={layout} />,
    },
    argTypes: {
        layout: { control: 'inline-radio', options: ['list', 'grid'] },
        loadMode: { control: 'inline-radio', options: ['pages', 'infinite'] },
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof DataView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Six servers per page, switch between list and grid */
export const Playground: Story = {};

function ListGridDemo() {
    const [search, setSearch] = useState('');
    const found = servers.filter((server) =>
        `${server.name} ${server.city}`.toLowerCase().includes(search.toLowerCase())
    );
    return (
        <DataView
            label="Servers"
            items={found}
            defaultLayout="grid"
            filtered={!!search}
            header={
                <View className="w-full">
                    <SearchField label="Search servers" value={search} onValueChange={setSearch} />
                </View>
            }
            pageSize={8}
            pageSizes={[8, 16, 32]}
        >
            {(server, layout) => <ServerItem server={server} layout={layout} />}
        </DataView>
    );
}

/** Grid at the start, a search in the header (no results: "No results"), page sizes below */
export const ListAndGrid: Story = { name: 'List/grid', render: () => <ListGridDemo /> };

const wait = (ms: number, signal: AbortSignal) =>
    new Promise<void>((done, fail) => {
        const timer = setTimeout(done, ms);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            fail(signal.reason);
        });
    });

const serverSource: DataSource<Server> = {
    getItems: async ({ search, page = 1, pageSize = 6, signal }) => {
        await wait(600, signal);
        const found = servers.filter(
            (server) => !search || `${server.name} ${server.city}`.toLowerCase().includes(search.toLowerCase())
        );
        return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
    },
};

function PagesDemo() {
    const [search, setSearch] = useState('');
    return (
        <DataView
            label="Servers"
            dataSource={serverSource}
            query={{ search }}
            pageSize={6}
            layoutToggle={false}
            toolbar={
                <View className="w-full">
                    <SearchField label="Search servers" value={search} onValueChange={setSearch} />
                </View>
            }
        >
            {(server, layout) => <ServerItem server={server} layout={layout} />}
        </DataView>
    );
}

/** dataSource with pages: one request per page, placeholders while loading, the search starts at page 1 */
export const Pages: Story = { name: 'Pages', render: () => <PagesDemo /> };

function InfiniteDemo() {
    return (
        <View className="h-[520px]">
            <DataView
                label="Servers"
                dataSource={serverSource}
                loadMode="infinite"
                autoLoad
                pageSize={8}
                className="flex-1"
            >
                {(server, layout) => <ServerItem server={server} layout={layout} />}
            </DataView>
        </View>
    );
}

/** loadMode "infinite" + autoLoad: the end of the scrolling loads the next 8 – "Load more" stays as fallback */
export const Infinite: Story = { name: 'Infinite', render: () => <InfiniteDemo /> };

function ManualInfiniteDemo() {
    const [shown, setShown] = useState(servers.slice(0, 6));
    const [loading, setLoading] = useState(false);
    return (
        <DataView
            label="Servers"
            items={shown}
            loadMode="infinite"
            totalCount={servers.length}
            hasMore={shown.length < servers.length}
            loading={loading}
            onLoadMore={() => {
                setLoading(true);
                setTimeout(() => {
                    setShown(servers.slice(0, shown.length + 6));
                    setLoading(false);
                }, 500);
            }}
        >
            {(server, layout) => <ServerItem server={server} layout={layout} />}
        </DataView>
    );
}

/** Without a data source: hasMore + onLoadMore, "6 of 42 shown" */
export const LoadMore: Story = { name: 'Load more', render: () => <ManualInfiniteDemo /> };

/** No items */
export const Empty: Story = { name: 'Empty', args: { items: [], emptyText: 'No servers created yet' } };

/** Placeholders while the first items load */
export const Loading: Story = { name: 'Loading', args: { items: [], loading: true } };

const failingSource: DataSource<Server> = {
    getItems: async ({ signal }) => {
        await wait(400, signal);
        throw new Error('Server unreachable');
    },
};

/** A failed request: the error with "Try again" */
export const Failed: Story = {
    name: 'Error',
    render: () => (
        <DataView label="Servers" dataSource={failingSource} pageSize={6}>
            {(server, layout) => <ServerItem server={server} layout={layout} />}
        </DataView>
    ),
};

/** renderError: an own error content with the retry */
export const CustomError: Story = {
    name: 'Custom error',
    args: {
        error: new Error('Timeout'),
        renderError: (error: unknown, retry: () => void) => (
            <View className="items-center gap-2">
                <Text>The servers could not be loaded ({(error as Error).message}).</Text>
                <Button size="sm" variant="outline" onPress={retry}>
                    Retry
                </Button>
            </View>
        ),
    },
};
