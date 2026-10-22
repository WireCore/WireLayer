import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Heatmap } from './Heatmap.js';

const meta = {
    title: 'Data/Heatmap',
    component: Heatmap,
    args: {
        caption: 'Requests per hour',
        rows: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        columns: ['08', '10', '12', '14', '16', '18'],
        values: [
            [12, 48, 61, 55, 40, 9],
            [15, 52, 70, 62, 44, 11],
            [10, 45, 58, null, 39, 8],
            [18, 60, 80, 74, 51, 14],
            [9, 31, 42, 35, 20, 4],
        ],
        showValues: true,
        legend: true,
    },
    argTypes: { rows: { control: false }, columns: { control: false }, values: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Rows and columns name every value; the colour only adds to the number */
export const Playground: Story = {};

export const WithoutValues: Story = { name: 'Colors only', args: { showValues: false } };

export const Wide: Story = {
    name: 'Wide (scroll sideways)',
    args: {
        caption: 'Utilization per hour in percent',
        rows: ['Mon', 'Tue', 'Wed'],
        columns: Array.from({ length: 12 }, (_, index) => String(index * 2).padStart(2, '0')),
        values: [0, 1, 2].map((row) => Array.from({ length: 12 }, (_, index) => (index * 7 + row * 13) % 100)),
        formatOptions: { maximumFractionDigits: 0 },
    },
};
