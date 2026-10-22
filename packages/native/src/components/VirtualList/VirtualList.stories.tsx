import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes/native';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { SearchField } from '../SearchField/SearchField.js';
import { Text } from '../Text/Text.js';
import { VirtualList, type VirtualListHandle } from './VirtualList.js';

interface Customer {
    id: number;
    name: string;
    city: string;
    revenue: number;
}

const names = ['Lindner Bakery', 'Miller & Sons', 'Ostrowski Law Office', 'Haas Garden Center', 'Brandt Motors'];
const cities = ['Berlin', 'Hamburg', 'Cologne', 'Leipzig', 'Munich'];
const customers: Customer[] = Array.from({ length: 500 }, (_, index) => ({
    id: index + 1,
    name: `${names[index % names.length]} ${Math.floor(index / names.length) + 1}`,
    city: cities[index % cities.length]!,
    revenue: 1200 + ((index * 7919) % 48000),
}));
const euro = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function CustomerRow({ customer }: { customer: Customer }) {
    return (
        <View className="h-14 justify-center border-b border-line px-3">
            <Text>{customer.name}</Text>
            <Text variant="muted">
                {customer.city} · {euro.format(customer.revenue)}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Data/VirtualList',
    component: VirtualList,
    args: {
        label: 'Customers',
        items: customers,
        itemHeight: 56,
        height: 360,
        children: (item: unknown) => <CustomerRow customer={item as Customer} />,
    },
    decorators: [(Story) => <View className="w-[360px] rounded-card border border-line">{Story()}</View>],
} satisfies Meta<typeof VirtualList>;

export default meta;
type Story = StoryObj<typeof meta>;

function PlaygroundDemo() {
    const list = useRef<VirtualListHandle>(null);
    return (
        <View>
            <View className="flex-row gap-2 border-b border-line p-2">
                <Button
                    size="sm"
                    variant="outline"
                    onPress={() => list.current?.scrollToIndex(249, { align: 'start' })}
                >
                    Go to customer 250
                </Button>
            </View>
            <VirtualList ref={list} label="Customers" items={customers} itemHeight={56} height={360}>
                {(customer) => <CustomerRow customer={customer} />}
            </VirtualList>
        </View>
    );
}

/** 500 customers – only the rows in view are rendered (fixed height: getItemLayout) */
export const Playground: Story = { render: () => <PlaygroundDemo /> };

const sorted = [...customers].sort((a, b) => a.city.localeCompare(b.city, 'en') || a.id - b.id);

/** itemGroup: a SectionList, the heading of the city in view sticks to the top */
export const Groups: Story = {
    name: 'Groups',
    render: () => (
        <VirtualList label="Customers by city" items={sorted.slice(0, 120)} itemGroup="city" height={360}>
            {(customer) => <CustomerRow customer={customer} />}
        </VirtualList>
    ),
};

function LoadMoreDemo() {
    const [shown, setShown] = useState(customers.slice(0, 20));
    const [loading, setLoading] = useState(false);
    return (
        <VirtualList
            label="Customers"
            items={shown}
            itemHeight={56}
            height={360}
            hasMore={shown.length < 100}
            loading={loading}
            onLoadMore={() => {
                setLoading(true);
                setTimeout(() => {
                    setShown(customers.slice(0, shown.length + 20));
                    setLoading(false);
                }, 600);
            }}
        >
            {(customer) => <CustomerRow customer={customer} />}
        </VirtualList>
    );
}

/** hasMore + onLoadMore: the end of the list loads 20 more (up to 100) – "Load more" does the same */
export const LoadMore: Story = { name: 'Loading more', render: () => <LoadMoreDemo /> };

const wait = (ms: number, signal: AbortSignal) =>
    new Promise<void>((done, fail) => {
        const timer = setTimeout(done, ms);
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            fail(signal.reason);
        });
    });

const customerSource: DataSource<Customer> = {
    getItems: async ({ search, page = 1, pageSize = 50, signal }) => {
        await wait(500, signal);
        const found = customers.filter(
            (customer) => !search || `${customer.name} ${customer.city}`.toLowerCase().includes(search.toLowerCase())
        );
        return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
    },
};

function DataSourceDemo() {
    const [search, setSearch] = useState('');
    return (
        <View className="gap-2 p-2">
            <SearchField label="Search customers" value={search} onValueChange={setSearch} />
            <VirtualList label="Customers" dataSource={customerSource} query={{ search }} pageSize={30} height={360}>
                {(customer) => <CustomerRow customer={customer} />}
            </VirtualList>
        </View>
    );
}

/** dataSource: 30 per request while scrolling, the search starts over after a typing pause; states are announced */
export const ServerData: Story = { name: 'Data source', render: () => <DataSourceDemo /> };

const failingSource: DataSource<Customer> = {
    getItems: async ({ signal }) => {
        await wait(400, signal);
        throw new Error('Server unreachable');
    },
};

/** A failed request: the error with "Try again" */
export const Failed: Story = {
    name: 'Error',
    render: () => (
        <VirtualList label="Customers" dataSource={failingSource} height={200}>
            {(customer) => <CustomerRow customer={customer} />}
        </VirtualList>
    ),
};

/** No items */
export const Empty: Story = {
    name: 'Empty',
    render: () => (
        <VirtualList label="Customers" items={[] as Customer[]} height={160} emptyText="No customers yet">
            {(customer) => <CustomerRow customer={customer} />}
        </VirtualList>
    ),
};
