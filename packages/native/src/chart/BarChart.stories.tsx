import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { BarChart } from './BarChart.js';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const revenue = months.slice(0, 6).map((month, index) => ({
    month,
    web: 120 + index * 9 + (index % 3) * 14,
    hosting: 60 + index * 4,
}));
const regions = [
    { region: 'North', newCustomers: 42, existing: 118 },
    { region: 'East', newCustomers: 28, existing: 74 },
    { region: 'South', newCustomers: 55, existing: 131 },
    { region: 'West', newCustomers: 37, existing: 96 },
    { region: 'Austria', newCustomers: 19, existing: 48 },
];
const euro = (value: number) => `€${value.toLocaleString('en-US')}k`;

const meta = {
    title: 'Data/BarChart',
    component: BarChart,
    args: {
        title: 'Revenue by month',
        categoryKey: 'month',
        data: revenue,
        series: [
            { key: 'web', label: 'Software & Web' },
            { key: 'hosting', label: 'Hosting', tone: 'info' },
        ],
        formatValue: euro,
        horizontal: false,
        stacked: false,
    },
    argTypes: { data: { control: false }, series: { control: false }, formatValue: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Grouped bars; tapping a month shows its values, the data list below is the text alternative */
export const Playground: Story = {};

export const Stacked: Story = { name: 'Stacked', args: { stacked: true } };

export const Horizontal: Story = {
    name: 'Horizontal and stacked',
    args: {
        title: 'Customers by region',
        categoryKey: 'region',
        data: regions,
        series: [
            { key: 'existing', label: 'Existing' },
            { key: 'newCustomers', label: 'New customers', tone: 'success' },
        ],
        formatValue: undefined,
        horizontal: true,
        stacked: true,
        height: 260,
    },
};

export const References: Story = {
    name: 'With reference values',
    args: {
        series: [{ key: 'web', label: 'Software & Web' }],
        references: [
            { value: 170, label: 'Target', tone: 'success' },
            { from: 120, to: 150, label: 'Corridor', tone: 'warn' },
        ],
    },
};

export const SingleSeries: Story = {
    name: 'Single series, no data list',
    args: { series: [{ key: 'hosting', label: 'Hosting', tone: 'info' }], table: false, hideTitle: true },
};
