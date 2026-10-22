import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { LayoutGrid, List } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { SegmentedControl } from './SegmentedControl.js';

const items = [
    { value: 'list', label: 'List', icon: List },
    { value: 'grid', label: 'Grid', icon: LayoutGrid },
];

function Demo() {
    const [value, setValue] = useState('list');
    return (
        <View className="gap-3">
            <SegmentedControl items={items} value={value} onValueChange={setValue} label="View" />
            <Text variant="muted">View: {value}</Text>
        </View>
    );
}

const meta = {
    title: 'Buttons/SegmentedControl',
    component: SegmentedControl,
    args: { items, label: 'View' },
    render: () => <Demo />,
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SizesAndBlock: Story = {
    render: () => (
        <View className="w-80 gap-3">
            <SegmentedControl items={items} defaultValue="grid" label="View (small)" size="sm" />
            <SegmentedControl items={items} label="View (full width)" block />
            <SegmentedControl items={items} label="View (disabled)" disabled />
        </View>
    ),
};
