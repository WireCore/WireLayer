import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { BulletChart } from './BulletChart.js';

const euro = (value: number) => `€${value.toLocaleString('en-US')}k`;

const meta = {
    title: 'Data/BulletChart',
    component: BulletChart,
    args: {
        label: 'Revenue',
        description: 'k€ per quarter',
        value: 270,
        target: 250,
        max: 300,
        ranges: [150, 225, 300],
        formatValue: euro,
        tone: 'primary',
    },
    argTypes: {
        value: { control: { type: 'range', min: 0, max: 300 } },
        formatValue: { control: false },
        tone: { control: 'inline-radio', options: ['primary', 'info', 'success', 'warn', 'danger'] },
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof BulletChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A meter: value, end of the scale and target are its text */
export const Playground: Story = {};

export const Several: Story = {
    name: 'Several measures',
    render: () => (
        <View className="gap-5">
            <BulletChart
                label="Revenue"
                value={270}
                target={250}
                max={300}
                ranges={[150, 225, 300]}
                formatValue={euro}
            />
            <BulletChart label="New customers" value={18} target={25} max={40} ranges={[10, 20, 40]} tone="warn" />
            <BulletChart label="Satisfaction" description="Points out of 5" value={4.4} max={5} tone="success" />
        </View>
    ),
};
