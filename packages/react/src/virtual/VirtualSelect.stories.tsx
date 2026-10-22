import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { Field } from '../components/Field/Field.js';
import type { SelectItem } from '../components/Select/Select.js';
import { VirtualSelect } from './VirtualSelect.js';

const items = Array.from({ length: 10_000 }, (_, index) => ({
    value: `customer-${index + 1}`,
    label: `Customer ${String(index + 1).padStart(5, '0')}`,
}));

const meta = {
    title: 'Forms/VirtualSelect',
    component: VirtualSelect<SelectItem, string>,
    args: { items, placeholder: 'Choose customer' },
    argTypes: { items: { control: false } },
    render: (args) => (
        <Field label="Customer (10,000 entries)" className="w-[380px]">
            <VirtualSelect {...args} />
        </Field>
    ),
} satisfies Meta<typeof VirtualSelect<SelectItem, string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `filter`: search field over the 10,000 entries */
export const WithSearch: Story = {
    name: 'With search',
    args: { filter: true, clearable: true },
};

function EndlessDemo() {
    const [list, setList] = useState(() => items.slice(0, 50));
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    function more() {
        setLoading(true);
        setTimeout(() => {
            setList((previous) => items.slice(0, previous.length + 50));
            setLoading(false);
        }, 400);
    }
    return (
        <Field label="Customer" helperText="Loads 50 more at a time while scrolling" className="w-[380px]">
            <VirtualSelect
                value={value}
                onValueChange={setValue}
                items={list}
                loading={loading}
                hasMore={list.length < 10_000}
                placeholder="Choose customer"
                onLoadMore={more}
            />
        </Field>
    );
}

/** Endless list: `hasMore` + onLoadMore fetch the next 50 entries when the end of the list comes into view */
export const Endless: Story = {
    name: 'Infinite loading',
    render: () => <EndlessDemo />,
};

// A server over the 10,000 customers: pages of 50, a search over the labels, after a short pause
const customerSource: DataSource<{ value: string; label: string }> = {
    async getItems({ page = 1, pageSize = 50, search = '', signal }) {
        await new Promise((done) => setTimeout(done, 300));
        if (signal.aborted) throw new DOMException('aborted', 'AbortError');
        const found = items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()));
        return { items: found.slice((page - 1) * pageSize, page * pageSize), hasMore: page * pageSize < found.length };
    },
};

function ServerDemo() {
    const [value, setValue] = useState<string | null>(null);
    return (
        <Field
            label="Customer"
            helperText="50 entries per page from the server, search on the server"
            className="w-[380px]"
        >
            <VirtualSelect
                value={value}
                onValueChange={setValue}
                items={[]}
                dataSource={customerSource}
                filter
                placeholder="Choose customer"
            />
        </Field>
    );
}

/** `dataSource`: pages of 50 from a server while scrolling; the search field asks the server */
export const FromServer: Story = { name: 'From the server', render: () => <ServerDemo /> };
