import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { LineChart } from './LineChart.js';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const visits = months.map((month, index) => ({
    month,
    app: 3200 + Math.round(Math.sin(index / 2) * 600) + index * 120,
    web: 2100 + Math.round(Math.cos(index / 3) * 400) + index * 60,
    plan: 3000 + index * 150,
}));

const meta = {
    title: 'Data/LineChart',
    component: LineChart,
    args: {
        title: 'Visits by month',
        categoryKey: 'month',
        data: visits,
        series: [
            { key: 'app', label: 'App' },
            { key: 'web', label: 'Website', tone: 'info' },
        ],
        curved: false,
        area: false,
        stacked: false,
    },
    argTypes: { data: { control: false }, series: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Lines over the months; tapping marks the nearest month and shows its values */
export const Playground: Story = {};

export const Curved: Story = {
    name: 'Smoothed with plan',
    args: {
        curved: true,
        series: [
            { key: 'app', label: 'App' },
            { key: 'plan', label: 'Plan', tone: 'muted', dashed: true },
        ],
    },
};

export const Area: Story = { name: 'Stacked areas', args: { area: true, stacked: true, curved: true } };

export const Gaps: Story = {
    name: 'With gap and marker',
    args: {
        data: visits.map((row, index) => (index === 5 ? { month: row.month, web: row.web } : row)),
        references: [{ value: 7, axis: 'x', label: 'Relaunch', tone: 'success' }],
    },
};
