import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';
import { Sparkline } from './Sparkline.js';

const load = [42, 48, 45, 61, 58, 72, 69, 80, 76, 64, 59, 66];

const meta = {
    title: 'Data/Sparkline',
    component: Sparkline,
    args: {
        data: load,
        label: 'Utilization over the last 12 hours',
        formatValue: (value: number) => `${value}%`,
        fill: true,
        width: 128,
        height: 32,
    },
    argTypes: { data: { control: false }, formatValue: { control: false } },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A small curved line, an image named by the trend and the extremes */
export const Playground: Story = {};

export const WithoutFill: Story = { name: 'Without fill', args: { fill: false, width: 96, height: 24 } };

export const InStatistic: Story = {
    name: 'In a statistic',
    render: (args) => (
        <View className="w-[240px] gap-1 rounded-card border border-line bg-card p-4">
            <Text className="font-sans text-[13px] text-muted">Utilization</Text>
            <View className="flex-row items-end justify-between">
                <Text className="font-sans-semibold text-2xl text-fg">66%</Text>
                <Sparkline {...args} />
            </View>
        </View>
    ),
};
