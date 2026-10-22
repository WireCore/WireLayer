import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import { Autocomplete, type AutocompleteProps } from './Autocomplete.js';

const departments = ['Accounting', 'Purchasing', 'Engineering', 'Management', 'Marketing', 'HR', 'Sales'];

const grouped = [
    { label: 'Accounting', group: 'Administration' },
    { label: 'HR', group: 'Administration' },
    { label: 'Engineering', group: 'Technology' },
    { label: 'Operations', group: 'Technology' },
    { label: 'Marketing', group: 'Market' },
    { label: 'Sales', group: 'Market' },
];

function Demo(args: AutocompleteProps<string | (typeof grouped)[number]>) {
    const [value, setValue] = useState('');
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Department" helperText="Pick a suggestion or type freely">
                <Autocomplete {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value || '–'}</span>
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
    title: 'Forms/Autocomplete',
    component: Autocomplete<string | (typeof grouped)[number]>,
    args: { items: departments, placeholder: 'e.g. Sales', disabled: false, invalid: false },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Autocomplete<string | (typeof grouped)[number]>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Suggestions as objects under group headings; `clearable` empties the field */
export const Groups: Story = {
    name: 'Groups',
    args: { items: grouped, clearable: true },
};

function MultipleDemo() {
    const [values, setValues] = useState(['Vertrieb']);
    return (
        <div className="flex w-96 flex-col gap-3">
            <Field label="Departments" helperText="Down arrow shows suggestions, Enter accepts">
                <Autocomplete
                    values={values}
                    onValuesChange={setValues}
                    items={departments}
                    multiple
                    placeholder="Department"
                />
            </Field>
            <span className="text-xs text-muted">Value: {values.join(', ') || '–'}</span>
        </div>
    );
}

/** `multiple`: several entries as chips – free text or a suggestion (values/onValuesChange) */
export const Multiple: Story = {
    name: 'Multiple entries',
    render: () => <MultipleDemo />,
};

function DataSourceDemo() {
    const [value, setValue] = useState('');
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Customer">
                <Autocomplete<Customer>
                    items={[]}
                    dataSource={customerSource}
                    itemLabel="name"
                    value={value}
                    onValueChange={setValue}
                />
            </Field>
            <span className="text-xs text-muted">Text: {value || '–'}</span>
        </div>
    );
}

/** Suggestions from a data source for the typed text */
export const WithDataSource: Story = { name: 'Data source', render: () => <DataSourceDemo /> };
