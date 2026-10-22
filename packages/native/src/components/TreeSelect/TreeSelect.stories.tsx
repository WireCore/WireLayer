import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import type { TreeNode } from '../Tree/Tree.js';
import { TreeSelect } from './TreeSelect.js';

const items: TreeNode[] = [
    {
        id: 'sales',
        label: 'Sales',
        children: [
            { id: 'sales-north', label: 'Sales North' },
            { id: 'sales-south', label: 'Sales South' },
        ],
    },
    {
        id: 'technology',
        label: 'Technology',
        children: [
            {
                id: 'engineering',
                label: 'Engineering',
                children: [
                    { id: 'frontend', label: 'Frontend' },
                    { id: 'backend', label: 'Backend' },
                ],
            },
            { id: 'operations', label: 'Operations' },
        ],
    },
    {
        id: 'administration',
        label: 'Administration',
        children: [
            { id: 'hr', label: 'HR' },
            { id: 'accounting', label: 'Accounting', disabled: true },
        ],
    },
];

function Demo({ leavesOnly = false, filter = false }: { leavesOnly?: boolean; filter?: boolean }) {
    const [value, setValue] = useState<string | null>('backend');
    return (
        <View className="gap-3">
            <Field label="Department" helperText="Cost center of the order">
                <TreeSelect
                    items={items}
                    value={value}
                    onValueChange={setValue}
                    leavesOnly={leavesOnly}
                    filter={filter}
                    clearable
                />
            </Field>
            <Text variant="muted">Value: {value ?? '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/TreeSelect',
    component: TreeSelect,
    args: { items },
    decorators: [(Story) => <View className="w-80">{Story()}</View>],
    render: () => <Demo />,
} satisfies Meta<typeof TreeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Only leaves can be chosen: pressing a branch opens it; with a search field */
export const LeavesOnly: Story = { name: 'Leaves only', render: () => <Demo leavesOnly filter /> };

function MultipleDemo() {
    const [value, setValue] = useState<string[]>(['sales', 'frontend']);
    return (
        <View className="gap-3">
            <Field label="Departments">
                <TreeSelect
                    items={items}
                    multiple
                    value={value}
                    onValueChange={setValue}
                    maxShown={2}
                    clearable
                    filter
                />
            </Field>
            <Text variant="muted">Value: {value.join(', ') || '–'}</Text>
        </View>
    );
}

/** Several nodes with check boxes (cascade, `checkedStrategy` parent) – chips in the field, "+N" beyond maxShown */
export const Multiple: Story = { name: 'Multiple', render: () => <MultipleDemo /> };

const regions: TreeNode[] = [
    { id: 'north', label: 'Region North', hasChildren: true },
    { id: 'south', label: 'Region South', hasChildren: true },
];

function LazyDemo() {
    const [value, setValue] = useState<string | null>(null);
    const loadChildren = (node: TreeNode) =>
        new Promise<TreeNode[]>((resolve) =>
            setTimeout(
                () =>
                    resolve(
                        node.id === 'north'
                            ? [
                                  { id: 'hamburg', label: 'Hamburg branch' },
                                  { id: 'bremen', label: 'Bremen branch' },
                              ]
                            : [
                                  { id: 'munich', label: 'Munich branch' },
                                  { id: 'stuttgart', label: 'Stuttgart branch' },
                              ]
                    ),
                800
            )
        );
    return (
        <View className="gap-3">
            <Field label="Branch">
                <TreeSelect
                    items={regions}
                    value={value}
                    onValueChange={setValue}
                    leavesOnly
                    loadChildren={loadChildren}
                />
            </Field>
            <Text variant="muted">Value: {value ?? '–'}</Text>
        </View>
    );
}

/** Children of the regions load when they open (0.8 s); loaded nodes stay known when the sheet closes */
export const LazyLoading: Story = { name: 'Lazy loading', render: () => <LazyDemo /> };

/** Invalid, disabled and loading fields */
export const States: Story = {
    name: 'States',
    render: () => (
        <View className="gap-4">
            <Field label="Department" error="Choose a department" invalid>
                <TreeSelect items={items} />
            </Field>
            <Field label="Department (locked)" disabled>
                <TreeSelect items={items} defaultValue="operations" />
            </Field>
            <TreeSelect items={items} aria-label="Department (loading)" loading size="sm" />
        </View>
    ),
};
