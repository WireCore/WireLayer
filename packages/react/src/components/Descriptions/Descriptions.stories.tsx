import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { Input } from '../Input/Input.js';
import { Descriptions, type DescriptionsItem } from './Descriptions.js';

const items: DescriptionsItem[] = [
    { id: 'customer', label: 'Customer', value: 'Northside Utilities Inc.' },
    { id: 'number', label: 'Contract number', value: 'V-2026-0815' },
    { id: 'status', label: 'Status', value: 'Active' },
    { id: 'start', label: 'Start', value: '03/01/2026' },
    { id: 'term', label: 'Term', value: '24 months', span: 2 },
    {
        id: 'note',
        label: 'Note',
        value: 'Renews for 12 months at a time, cancelable with three months of notice.',
        span: 'full',
    },
];

const meta = {
    title: 'Data/Descriptions',
    component: Descriptions,
    args: { items, title: 'Contract' },
    argTypes: {
        items: { control: false },
        orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    },
    render: (args) => (
        <Descriptions
            {...args}
            renderValue={(item) => (item.id === 'status' ? <Badge variant="success">{item.value}</Badge> : undefined)}
        />
    ),
} satisfies Meta<typeof Descriptions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Columns per breakpoint (1, from sm 2, from lg 3); items can span columns */
export const Playground: Story = {};

/** Table look with the label beside the value */
export const Bordered: Story = { args: { bordered: true, orientation: 'horizontal', columns: { base: 1, md: 2 } } };

function EditDemo() {
    const [editing, setEditing] = useState(false);
    const [values, setValues] = useState<Record<string, string>>(
        Object.fromEntries(items.map((item) => [item.id!, String(item.value)]))
    );
    return (
        <Descriptions
            title="Contract"
            items={items.map((item) => ({ ...item, value: values[item.id!] }))}
            editing={editing}
            actions={
                <Button size="sm" variant={editing ? 'primary' : 'outline'} onClick={() => setEditing(!editing)}>
                    {editing ? 'Save' : 'Edit'}
                </Button>
            }
            renderEdit={(item, { labelId }) =>
                item.id === 'number' ? undefined : (
                    <Input
                        aria-labelledby={labelId}
                        value={values[item.id!]}
                        onChange={(event) => setValues({ ...values, [item.id!]: event.target.value })}
                    />
                )
            }
        />
    );
}

/** Edit mode: the values turn into inputs, labelled by their term (labelId) */
export const Editing: Story = { render: () => <EditDemo /> };
