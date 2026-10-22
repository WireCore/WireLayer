import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { Cloud, CodeXml, Cpu, Server } from 'lucide-react';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import type { SelectItem } from '../Select/Select.js';
import { MultiSelect, type MultiSelectProps } from './MultiSelect.js';

const items = [
    { value: 'web', label: 'Software & Web', icon: CodeXml },
    { value: 'hosting', label: 'Managed Hosting', icon: Server },
    { value: 'cloud', label: 'Cloud & DevOps', icon: Cloud },
    { value: 'hardware', label: 'Hardware', icon: Cpu, disabled: true },
];
const grouped = [
    { value: 'web', label: 'Software & Web', group: 'Engineering' },
    { value: 'ai', label: 'AI & LLM', group: 'Engineering' },
    { value: 'apps', label: 'Apps', group: 'Engineering' },
    { value: 'fra', label: 'Frankfurt', group: 'Data centers', description: 'Tier III' },
    { value: 'nbg', label: 'Nuremberg', group: 'Data centers', description: 'Tier III' },
    { value: 'vienna', label: 'Vienna', group: 'Data centers', disabled: true },
    { value: 'support', label: 'Support 24/7', group: 'Operations' },
    { value: 'backup', label: 'Backup', group: 'Operations' },
];

function Demo(args: MultiSelectProps<SelectItem, string>) {
    const [value, setValue] = useState(['web', 'cloud']);
    return (
        <div className="flex w-80 flex-col gap-3">
            <Field label="Services" helperText="Multiple selection possible">
                <MultiSelect {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Selection: {value.join(', ') || '–'}</span>
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
    title: 'Forms/MultiSelect',
    component: MultiSelect<SelectItem, string>,
    args: { items, placeholder: 'Choose services', disabled: false, invalid: false, maxShown: 2 },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof MultiSelect<SelectItem, string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `display="chips"`: one chip per value with a remove button; Backspace on the field removes the last one */
export const Chips: Story = {
    args: { display: 'chips', clearable: true },
};

/** `selectAll` above the options (takes the options in view) and `max`: at most three, the rest is disabled */
export const SelectAll: Story = {
    name: 'Select all',
    args: { items: grouped, selectAll: true, max: 3, display: 'chips' },
};

/** `filter`: search field at the top of the list; groups and two-line options */
export const WithSearch: Story = {
    name: 'With search',
    args: { items: grouped, filter: true, selectAll: true, clearable: true },
};

/** `size`: 32, 40 (default) and 48 px; `checkboxes: false` shows check marks instead of boxes */
export const Sizes: Story = {
    name: 'Sizes',
    render: () => (
        <div className="flex w-80 flex-col gap-4">
            <Field label="Small">
                <MultiSelect items={items} size="sm" defaultValue={['web']} />
            </Field>
            <Field label="Medium">
                <MultiSelect items={items} defaultValue={['web']} checkboxes={false} />
            </Field>
            <Field label="Large">
                <MultiSelect items={items} size="lg" display="chips" defaultValue={['web', 'cloud']} />
            </Field>
        </div>
    ),
};

function DataSourceDemo() {
    const [value, setValue] = useState<number[]>([3, 480]);
    return (
        <div className="flex w-80 flex-col gap-3">
            <Field label="Customers">
                <MultiSelect<Customer, number>
                    items={[]}
                    dataSource={customerSource}
                    itemValue="id"
                    itemLabel="name"
                    filter
                    display="chips"
                    clearable
                    value={value}
                    onValueChange={setValue}
                />
            </Field>
            <span className="text-xs text-muted">Value: {value.join(', ') || '–'}</span>
        </div>
    );
}

/** Options from a data source with a server search; preselected customers get their labels by key */
export const WithDataSource: Story = { name: 'Data source', render: () => <DataSourceDemo /> };
