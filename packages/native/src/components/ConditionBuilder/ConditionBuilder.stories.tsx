import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ConditionField, ConditionGroup } from '@wirecore/wirelayer-recipes/native';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Text } from '../Text/Text.js';
import { ConditionBuilder } from './ConditionBuilder.js';

const fields: ConditionField[] = [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'load', label: 'Load', type: 'number' },
    {
        id: 'region',
        label: 'Region',
        type: 'select',
        options: [
            { value: 'fra', label: 'Frankfurt' },
            { value: 'ber', label: 'Berlin' },
        ],
    },
    { id: 'online', label: 'Online', type: 'boolean' },
];

function Demo() {
    const [tree, setTree] = useState<ConditionGroup>({
        type: 'group',
        id: 'root',
        combinator: 'and',
        children: [
            { type: 'rule', id: 'r1', field: 'load', operator: 'gt', value: 80 },
            {
                type: 'group',
                id: 'g1',
                combinator: 'or',
                children: [{ type: 'rule', id: 'r2', field: 'region', operator: 'equals', value: 'fra' }],
            },
        ],
    });
    return (
        <ScrollView className="h-[640px] w-[360px]" contentContainerClassName="gap-3">
            <ConditionBuilder fields={fields} value={tree} onValueChange={setTree} label="Filter" negatable />
            <Text variant="muted">{JSON.stringify(tree)}</Text>
        </ScrollView>
    );
}

const meta = {
    title: 'Forms/ConditionBuilder',
    component: ConditionBuilder,
    args: { fields },
    render: () => <Demo />,
} satisfies Meta<typeof ConditionBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
