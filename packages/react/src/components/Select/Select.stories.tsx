import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { Cloud, CodeXml, Cpu, Network, Server, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Combobox } from '../Combobox/Combobox.js';
import { Field } from '../Field/Field.js';
import { Select } from './Select.js';

const items = [
    { value: 'web', label: 'Software & Web', icon: CodeXml },
    { value: 'ai', label: 'AI & LLM', icon: Sparkles },
    { value: 'hosting', label: 'Hosting', icon: Server },
    { value: 'cloud', label: 'Cloud & DevOps', icon: Cloud },
    { value: 'hardware', label: 'Hardware', icon: Cpu },
    { value: 'network', label: 'Network', icon: Network, disabled: true },
];
const grouped = [
    { value: 'web', label: 'Software & Web', group: 'Engineering' },
    { value: 'ai', label: 'AI & LLM', group: 'Engineering', description: 'Assistants, search, analytics' },
    { value: 'fra', label: 'Frankfurt', group: 'Data centers', description: 'Tier III, ISO 27001' },
    { value: 'nbg', label: 'Nuremberg', group: 'Data centers' },
    { value: 'vienna', label: 'Vienna', group: 'Data centers', disabled: true },
    { value: 'support', label: 'Support 24/7', group: 'Operations' },
];
interface Person {
    id: number;
    name: string;
    team: string;
}
const people: Person[] = [
    { id: 1, name: 'Anna Berg', team: 'Sales' },
    { id: 2, name: 'Jonas Weber', team: 'Engineering' },
    { id: 3, name: 'Lea Schulz', team: 'Engineering' },
    { id: 4, name: 'Mehmet Yılmaz', team: 'Project management' },
];

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
    title: 'Forms/Select',
    component: Select,
    args: { items, defaultValue: 'hosting', placeholder: 'Select', disabled: false, invalid: false },
    argTypes: { items: { control: false } },
    render: (args) => (
        <Field label="Service" className="w-[380px]">
            <Select {...args} />
        </Field>
    ),
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Items with `group` are listed under their heading; `description` adds a second line */
export const Groups: Story = {
    name: 'Groups',
    args: { items: grouped, defaultValue: 'fra' },
};

/** `filter`: search field at the top of the list – ignores case and accents ("nu" finds "Nuremberg") */
export const WithSearch: Story = {
    name: 'With search',
    args: { items: grouped, defaultValue: undefined, filter: true },
};

function ObjectValuesDemo() {
    const [person, setPerson] = useState<Person | null>(people[1]!);
    const [id, setId] = useState<number | null>(3);
    return (
        <div className="flex w-[380px] flex-col gap-4">
            <Field label="Contact (object)">
                <Select
                    value={person}
                    onValueChange={setPerson}
                    items={people}
                    itemLabel="name"
                    itemGroup="team"
                    valueKey="id"
                />
            </Field>
            <span className="text-xs text-muted">Value: {JSON.stringify(person)}</span>
            <Field label="Contact (number)">
                <Select<Person, number>
                    value={id}
                    onValueChange={setId}
                    items={people}
                    itemValue="id"
                    itemLabel="name"
                />
            </Field>
            <span className="text-xs text-muted">
                Value: {id} ({typeof id})
            </span>
        </div>
    );
}

/** Any objects as items and values: itemValue/itemLabel name the fields, the value comes back unchanged */
export const ObjectValues: Story = {
    name: 'Objects as values',
    render: () => <ObjectValuesDemo />,
};

/** `clearable`: button in the field (not a tab stop – Backspace/Delete clear as well) */
export const Clearable: Story = {
    name: 'Clear button',
    args: { clearable: true },
};

/** `size`: 32, 40 (default) and 48 px – like Button and Input */
export const Sizes: Story = {
    name: 'Sizes',
    render: () => (
        <div className="flex w-[380px] flex-col gap-4">
            <Field label="Small">
                <Select items={items} size="sm" defaultValue="web" />
            </Field>
            <Field label="Medium">
                <Select items={items} size="md" defaultValue="ai" />
            </Field>
            <Field label="Large">
                <Select items={items} size="lg" defaultValue="hosting" />
            </Field>
        </div>
    ),
};

/** Own content per option (`renderItem`) and for the value in the field (`renderValue`) */
export const CustomContent: Story = {
    name: 'Custom rendering',
    render: () => (
        <Field label="Contact" className="w-[380px]">
            <Select
                items={people}
                itemValue="id"
                itemLabel="name"
                defaultValue={2}
                renderItem={(item, { selected }) => (
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className={selected ? 'font-semibold' : ''}>{item.name}</span>
                        <span className="text-xs text-muted">{item.team}</span>
                    </span>
                )}
                renderValue={(item) => `${item.name} · ${item.team}`}
            />
        </Field>
    ),
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
        <div className="flex w-[380px] flex-col gap-3">
            <Field label="Customer" helperText="500 customers, 20 per page">
                <Select<{ id: number; name: string }, number>
                    value={value}
                    onValueChange={setValue}
                    items={list}
                    itemValue="id"
                    itemLabel="name"
                    filter
                    manualFilter
                    loading={loading}
                    hasMore={hasMore}
                    clearable
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

/**
 * Items from a server: `manualFilter` sends the search text (onFilterChange), `hasMore` + onLoadMore fetch the
 * next page when the list is scrolled to its end, `loading` shows the spinner
 */
export const ServerData: Story = {
    name: 'Loading more from the server',
    render: () => <ServerDataDemo />,
};

function DataSourceDemo() {
    const [value, setValue] = useState<number | null>(250);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Customer">
                <Select<Customer, number>
                    items={[]}
                    dataSource={customerSource}
                    itemValue="id"
                    itemLabel="name"
                    filter
                    clearable
                    value={value}
                    onValueChange={setValue}
                />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

/**
 * Options from a data source: the first page when the list opens, more while scrolling, the search asks the server
 * after a typing pause; the preselected customer gets its label by key (getItemsByKeys)
 */
export const WithDataSource: Story = { name: 'Data source', render: () => <DataSourceDemo /> };

const statusItems = [
    { value: null, label: 'All' },
    { value: true, label: 'Active' },
    { value: false, label: 'Archived' },
];

function NullValueDemo() {
    const [value, setValue] = useState<boolean | null>(null);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Status">
                <Select items={statusItems} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value === null ? 'null' : String(value)}</span>
        </div>
    );
}

/**
 * An item with the value `null` – e.g. "All" – is a choice of its own: the value `null` shows it. Without such an
 * item `null` means nothing chosen (the placeholder)
 */
export const NullValue: Story = { name: 'Null as a value', render: () => <NullValueDemo /> };

const categories = [
    { value: 'rent', label: 'Rent', parent: 'Housing' },
    { value: 'power', label: 'Electricity', parent: 'Housing' },
    { value: 'fuel', label: 'Fuel', parent: 'Car' },
    { value: 'insurance', label: 'Insurance', parent: 'Car' },
];

/**
 * The search finds items by more than their label: `itemKeywords` names a field or a function (one text or a list)
 * – here the main category: "car" finds Fuel and Insurance. Items can also bring their own `keywords`
 */
export const Keywords: Story = {
    name: 'Search by keywords',
    render: () => (
        <Field label="Category" className="w-72">
            <Select items={categories} itemGroup="parent" itemKeywords="parent" filter />
        </Field>
    ),
};

const protocols = [
    { value: 'ssh', label: 'SSH' },
    { value: 'sftp', label: 'SFTP' },
    { value: 'rdp', label: 'RDP' },
];

function KeysInADialogDemo() {
    const [lastKey, setLastKey] = useState('–');
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Enter' || event.key === 'Escape') setLastKey(event.key);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
    return (
        <div className="flex w-[380px] flex-col gap-3.5">
            <Field label="Protocol">
                <Select open={open} onOpenChange={setOpen} items={protocols} filter stopKeyPropagation />
            </Field>
            <Field label="Jump host">
                <Combobox items={protocols} stopKeyPropagation />
            </Field>
            <span className="text-xs text-muted">
                List open: {String(open)} · Last key on the window: {lastKey}
            </span>
        </div>
    );
}

/**
 * In a dialog that saves with Enter and cancels with Escape on the window: `stopKeyPropagation` keeps the keys the
 * list handles itself (Enter choosing or opening, Escape closing, Tab leaving) in the Select or Combobox.
 * `open`/`onOpenChange` report whether the list is open
 */
export const KeysInADialog: Story = { name: 'Keys in a dialog', render: () => <KeysInADialogDemo /> };
