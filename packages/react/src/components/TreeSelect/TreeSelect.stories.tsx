import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../Field/Field.js';
import type { TreeNode } from '../Tree/Tree.js';
import { TreeSelect, type TreeSelectProps } from './TreeSelect.js';

const departments: TreeNode[] = [
    {
        id: 'technology',
        label: 'Technology',
        children: [
            { id: 'engineering', label: 'Engineering' },
            { id: 'operations', label: 'Operations' },
            { id: 'security', label: 'IT security' },
        ],
    },
    {
        id: 'sales',
        label: 'Sales',
        children: [
            { id: 'inside-sales', label: 'Inside sales' },
            { id: 'field-sales', label: 'Field sales' },
        ],
    },
    { id: 'administration', label: 'Administration' },
];

function Demo(args: TreeSelectProps) {
    const [value, setValue] = useState<string | null>('operations');
    return (
        <div className="flex w-72 flex-col gap-3">
            <Field label="Department">
                <TreeSelect {...args} value={value} onValueChange={setValue} />
            </Field>
            <span className="text-xs text-muted">Value: {value ?? '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Forms/TreeSelect',
    component: TreeSelect,
    args: { items: departments, leavesOnly: false, disabled: false, invalid: false },
    argTypes: { items: { control: false } },
    render: (args) => <Demo {...(args as TreeSelectProps)} />,
} satisfies Meta<typeof TreeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LeavesOnly: Story = { args: { leavesOnly: true } };

function MultipleDemo() {
    const [value, setValue] = useState<string[]>(['engineering', 'sales']);
    return (
        <div className="flex w-96 flex-col gap-3">
            <Field label="Departments">
                <TreeSelect<string[]>
                    items={departments}
                    multiple
                    maxShown={2}
                    clearable
                    filter
                    value={value}
                    onValueChange={setValue}
                />
            </Field>
            <span className="text-xs text-muted">Value: {value.join(', ') || '–'}</span>
        </div>
    );
}

/** Several departments with check boxes: chips in the field, "+N" beyond maxShown, a clear button */
export const Multiple: Story = { name: 'Multiple selection', render: () => <MultipleDemo /> };

/** A search field above the tree */
export const Search: Story = {
    name: 'Search',
    render: () => (
        <div className="w-72">
            <Field label="Department">
                <TreeSelect items={departments} filter clearable />
            </Field>
        </div>
    ),
};

const regions: TreeNode[] = [
    { id: 'north', label: 'Region North', hasChildren: true },
    { id: 'south', label: 'Region South', hasChildren: true },
];
async function loadCities(node: TreeNode): Promise<TreeNode[]> {
    await new Promise((done) => setTimeout(done, 700));
    return ['Hamburg', 'Bremen', 'Kiel'].map((city) => ({
        id: `${node.id}-${city}`,
        label: `${city} (${node.label})`,
    }));
}

/** Sub-departments load when a branch opens; they stay known while the field lives */
export const LazyChildren: Story = {
    name: 'Lazy-loaded children',
    render: () => (
        <div className="w-72">
            <Field label="Location">
                <TreeSelect items={regions} loadChildren={loadCities} />
            </Field>
        </div>
    ),
};

/** Heights of 32, 40 and 48 px; a spinner while the field waits for data */
export const SizesLoading: Story = {
    name: 'Sizes and loading',
    render: () => (
        <div className="flex w-72 flex-col gap-3">
            <TreeSelect items={departments} size="sm" aria-label="Small" defaultValue="operations" clearable />
            <TreeSelect items={departments} aria-label="Medium" defaultValue="operations" />
            <TreeSelect items={departments} size="lg" aria-label="Large" loading />
        </div>
    ),
};
