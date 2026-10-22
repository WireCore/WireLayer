import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { MeterGroup } from './MeterGroup.js';

const meta = {
    title: 'Data/MeterGroup',
    component: MeterGroup,
    args: {
        label: 'Storage (100 GB)',
        max: 100,
        items: [
            { label: 'Databases', value: 38 },
            { label: 'Files', value: 21 },
            { label: 'Backups', value: 9 },
        ],
        formatValue: (value: number) => `${value} GB`,
    },
    decorators: [(Story) => <View className="w-[320px]">{Story()}</View>],
} satisfies Meta<typeof MeterGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LegendAbove: Story = {
    name: 'Legend on top, stacked',
    args: { legendPosition: 'top', legendOrientation: 'vertical' },
};
