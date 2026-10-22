import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { useEffect, useRef, useState } from 'react';
import { Field } from '../Field/Field.js';
import type { SelectItem } from '../Select/Select.js';
import { Combobox, type ComboboxProps } from './Combobox.js';

const cities = [
    'Berlin',
    'Dusseldorf',
    'Frankfurt am Main',
    'Hamburg',
    'Cologne',
    'Leipzig',
    'Munich',
    'Nuremberg',
    'Stuttgart',
];
const items = cities.map((city) => ({ value: city.toLowerCase(), label: city }));

// "Server": 500 customers, 20 per page, search by name – answers after 400 ms
const customers = Array.from({ length: 500 }, (_, index) => ({
    id: index + 1,
    name: `Customer ${String(index + 1).padStart(3, '0')}`,
}));
async function fetchCustomers(query: string, page: number) {
    await new Promise((done) => setTimeout(done, 400));
    const matches = customers.filter((customer) => customer.name.toLowerCase().includes(query.trim().toLowerCase()));
    return { items: matches.slice(page * 20, page * 20 + 20), hasMore: (page + 1) * 20 < matches.length };
}
const people = [
    { id: 1, name: 'Anna Berg', team: 'Sales' },
    { id: 2, name: 'Jonas Weber', team: 'Engineering' },
    { id: 3, name: 'Lea Schulz', team: 'Engineering' },
    { id: 4, name: 'Mehmet Yılmaz', team: 'Project management' },
];

function Demo(args: ComboboxProps<SelectItem, string>) {
    const [value, setValue] = useState<string | null>(null);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Location" helperText="Typing filters the suggestions">
                <Combobox {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

// 500 customers on a "server": pages of 20, a search, labels by key for chosen values
interface Customer {
    id: number;
    name: string;
}
const serverCustomers: Customer[] = Array.from({ length: 500 }, (_, index) => ({
    id: index + 1,
    name: `Customer ${String(index + 1).padStart(3, '0')}`,
}));
const customerSource: DataSource<Customer> = {
    async getItems({ page = 1, pageSize = 20, search = '', signal }) {
        await new Promise((done) => setTimeout(done, 400));
        if (signal.aborted) throw new DOMException('aborted', 'AbortError');
        const found = serverCustomers.filter((customer) => customer.name.toLowerCase().includes(search.toLowerCase()));
        return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
    },
    async getItemsByKeys(keys) {
        await new Promise((done) => setTimeout(done, 200));
        return serverCustomers.filter((customer) => keys.includes(String(customer.id)));
    },
};

const meta = {
    title: 'Forms/Combobox',
    component: Combobox<SelectItem, string>,
    args: { items, placeholder: 'Search city …', disabled: false, invalid: false },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Combobox<SelectItem, string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * `allowCustomValue`: text that matches no item becomes the value (a string) on Enter or when leaving the field –
 * the editable select
 */
export const CustomValue: Story = {
    name: 'Custom values',
    args: { allowCustomValue: true, placeholder: 'Search or enter a city …' },
};

function ObjectValuesDemo() {
    const [value, setValue] = useState<number | null>(2);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Contact">
                <Combobox<(typeof people)[number], number>
                    value={value}
                    onValueChange={setValue}
                    items={people}
                    itemValue="id"
                    itemLabel="name"
                    itemGroup="team"
                    size="lg"
                />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

/** Objects as items and values, under group headings; `size` and a loading spinner */
export const ObjectValues: Story = {
    name: 'Objects as values',
    render: () => <ObjectValuesDemo />,
};

function ServerDataDemo() {
    const [list, setList] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [value, setValue] = useState<number | null>(null);
    const state = useRef({ query: '', page: 0, request: 0 });
    async function load(reset: boolean) {
        if (reset) state.current.page = 0;
        const current = ++state.current.request;
        setLoading(true);
        const result = await fetchCustomers(state.current.query, state.current.page);
        if (current !== state.current.request) return;
        setList((previous) => (reset ? result.items : [...previous, ...result.items]));
        setHasMore(result.hasMore);
        setLoading(false);
        state.current.page++;
    }
    // First page on mount
    useEffect(() => {
        let active = true;
        const current = ++state.current.request;
        void fetchCustomers('', 0).then((result) => {
            if (!active || current !== state.current.request) return;
            setList(result.items);
            setHasMore(result.hasMore);
            setLoading(false);
            state.current.page = 1;
        });
        return () => {
            active = false;
        };
    }, []);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Customer" helperText="500 customers, 20 per page">
                <Combobox<{ id: number; name: string }, number>
                    value={value}
                    onValueChange={setValue}
                    items={list}
                    itemValue="id"
                    itemLabel="name"
                    manualFilter
                    loading={loading}
                    hasMore={hasMore}
                    onFilterChange={(text) => {
                        state.current.query = text;
                        void load(true);
                    }}
                    onLoadMore={() => void load(false)}
                />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

/** Server-side search (`manualFilter` + onFilterChange) with paging (`hasMore` + onLoadMore) */
export const ServerData: Story = {
    name: 'Loading more from the server',
    render: () => <ServerDataDemo />,
};

function DataSourceDemo() {
    const [value, setValue] = useState<number | null>(42);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Customer" helperText="From 2 characters">
                <Combobox<Customer, number>
                    items={[]}
                    dataSource={customerSource}
                    itemValue="id"
                    itemLabel="name"
                    minSearchLength={2}
                    value={value}
                    onValueChange={setValue}
                />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

/** The typed text asks the data source (from 2 characters, after a typing pause; outdated answers are dropped) */
export const WithDataSource: Story = { name: 'Data source', render: () => <DataSourceDemo /> };
