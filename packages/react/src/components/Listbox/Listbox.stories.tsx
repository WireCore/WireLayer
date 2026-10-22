import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { Cloud, Code, Server, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Listbox, type ListboxItem, type ListboxProps } from './Listbox.js';

const items = [
    { value: 'software', label: 'Software & Web', icon: Code },
    { value: 'hosting', label: 'Hosting', icon: Server },
    { value: 'cloud', label: 'Cloud & DevOps', icon: Cloud },
    { value: 'ai', label: 'AI integration', icon: Sparkles, disabled: true },
];

const people = [
    { id: 1, name: 'Anna Berg', team: 'Sales' },
    { id: 2, name: 'Jonas Weber', team: 'Engineering' },
    { id: 3, name: 'Lea Schulz', team: 'Engineering' },
    { id: 4, name: 'Mehmet Yılmaz', team: 'Project management' },
    { id: 5, name: 'Sophie Krämer', team: 'Sales' },
];

function Demo(args: ListboxProps<ListboxItem, string>) {
    const [value, setValue] = useState(['hosting']);
    return (
        <div className="flex w-64 flex-col gap-3">
            <Listbox {...args} value={value} onValueChange={setValue} />
            <span className="text-xs text-muted">Value: {value.join(', ') || '–'}</span>
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
    title: 'Forms/Listbox',
    component: Listbox<ListboxItem, string>,
    args: { items, label: 'Services', multiple: false, disabled: false },
    argTypes: { items: { control: false } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Listbox<ListboxItem, string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = { args: { multiple: true } };

function PeopleDemo({ filter, multiple }: { filter?: boolean; multiple?: boolean }) {
    const [value, setValue] = useState<number[]>(multiple ? [2] : []);
    return (
        <div className="flex w-64 flex-col gap-3">
            <Listbox<(typeof people)[number], number>
                value={value}
                onValueChange={setValue}
                label="Contact"
                items={people}
                itemValue="id"
                itemLabel="name"
                itemGroup={filter ? undefined : 'team'}
                multiple={multiple}
                filter={filter}
            />
            <span className="text-xs text-muted">Value: {value.join(', ') || '–'}</span>
        </div>
    );
}

/** Objects as items, grouped by `itemGroup` (role="group", named by the heading) */
export const Groups: Story = {
    name: 'Groups',
    render: () => <PeopleDemo multiple />,
};

/** `filter`: search field above the list – arrow keys move in the list, Enter chooses */
export const WithSearch: Story = {
    name: 'With search',
    render: () => <PeopleDemo filter />,
};

function DataSourceDemo() {
    const [value, setValue] = useState<number[]>([7]);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Listbox<Customer, number>
                items={[]}
                label="Customers"
                dataSource={customerSource}
                itemValue="id"
                itemLabel="name"
                multiple
                filter
                value={value}
                onValueChange={setValue}
            />
            <span className="text-xs text-muted">Value: {value.join(', ') || '–'}</span>
        </div>
    );
}

/** Options from a data source: pages while scrolling, the search field asks the server */
export const WithDataSource: Story = { name: 'Data source', render: () => <DataSourceDemo /> };

function SelectAllDemo() {
    const [value, setValue] = useState<string[]>(['hosting']);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Listbox
                items={items}
                label="Services"
                multiple
                checkboxes
                selectAll
                value={value}
                onValueChange={setValue}
            />
            <span className="text-xs text-muted">Value: {value.join(', ') || '–'}</span>
        </div>
    );
}

/** Check boxes before the options and "Select all" above them */
export const CheckboxesSelectAll: Story = { name: 'Checkboxes and select all', render: () => <SelectAllDemo /> };
