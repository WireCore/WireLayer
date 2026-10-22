import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { ChipGroup } from './ChipGroup.js';

const items = [
    { value: 'fra', label: 'Frankfurt' },
    { value: 'nue', label: 'Nuremberg' },
    { value: 'vie', label: 'Vienna' },
    { value: 'zrh', label: 'Zurich', disabled: true },
];

function Demo() {
    const [value, setValue] = useState(['fra']);
    return (
        <View className="w-80 gap-3">
            <ChipGroup items={items} value={value} onValueChange={setValue} label="Filter locations" />
            <Text variant="muted">Selected: {value.join(', ') || '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/ChipGroup',
    component: ChipGroup,
    args: { items, label: 'Filter locations' },
    render: () => <Demo />,
} satisfies Meta<typeof ChipGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
