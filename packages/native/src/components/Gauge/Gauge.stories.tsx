import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Gauge } from './Gauge.js';

const thresholds = [
    { from: 0, status: 'success' as const },
    { from: 70, status: 'warn' as const },
    { from: 90, status: 'danger' as const },
];

const meta = {
    title: 'Data/Gauge',
    component: Gauge,
    args: { value: 76, label: 'CPU load', thresholds, formatOptions: { style: 'unit', unit: 'percent' } },
    argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
} satisfies Meta<typeof Gauge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
    name: 'Sizes',
    render: () => (
        <View className="flex-row items-end gap-4">
            <Gauge value={42} label="Storage" size="sm" thresholds={thresholds} />
            <Gauge value={93} label="Disk" size="md" thresholds={thresholds} />
        </View>
    ),
};
