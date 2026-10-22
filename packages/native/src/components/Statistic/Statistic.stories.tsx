import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Euro, Users } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Statistic } from './Statistic.js';

const meta = {
    title: 'Data/Statistic',
    component: Statistic,
    args: {
        label: 'Revenue October',
        value: 48250,
        formatOptions: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
        trend: 12.4,
        trendLabel: 'vs. last month',
        icon: Euro,
        bordered: true,
    },
    decorators: [(Story) => <View className="w-[300px]">{Story()}</View>],
} satisfies Meta<typeof Statistic>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function LiveDemo() {
    const [value, setValue] = useState(128);
    return (
        <View className="gap-3">
            <Statistic label="Active users" value={value} icon={Users} animate live trend={-3} invertTrend bordered />
            <Button size="sm" variant="outline" onPress={() => setValue(value + 37)}>
                New users
            </Button>
        </View>
    );
}

/** Counts up to a new value (only with motion allowed) and announces it */
export const Animated: Story = { name: 'Animated and live', render: () => <LiveDemo /> };

export const Loading: Story = { name: 'Loading', args: { loading: true } };
