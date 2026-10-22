import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { PieChart } from './PieChart.js';

const meta = {
    title: 'Data/PieChart',
    component: PieChart,
    args: {
        title: 'Revenue by segment',
        slices: [
            { label: 'Software & Web', value: 420 },
            { label: 'Hosting', value: 260 },
            { label: 'Consulting', value: 180 },
            { label: 'Training', value: 90 },
        ],
        formatValue: (value: number) => `€${value.toLocaleString('en-US')}k`,
        donut: false,
        legend: true,
        table: true,
    },
    argTypes: { slices: { control: false }, formatValue: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pie with a legend of value and share; the data list below is the text alternative */
export const Playground: Story = {};

export const Donut: Story = { name: 'Donut', args: { donut: true, height: 140 } };

export const Single: Story = {
    name: 'Single slice, no legend',
    args: { title: 'Utilization', slices: [{ label: 'Occupied', value: 1, tone: 'success' }], legend: false },
};
