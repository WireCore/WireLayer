import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Treemap } from './Treemap.js';

const meta = {
    title: 'Data/Treemap',
    component: Treemap,
    args: {
        label: 'Storage by project',
        showTitle: true,
        height: 240,
        items: [
            { label: 'Customer portal', value: 420 },
            { label: 'Intranet', value: 180 },
            { label: 'Archive', value: 160 },
            { label: 'Backups', value: 120 },
            { label: 'Logs', value: 60, tone: 'warn' },
            { label: 'Tests', value: 25 },
        ],
        formatOptions: { style: 'unit', unit: 'gigabyte' },
    },
    argTypes: { items: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Treemap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A list of the items with value and share, laid out as tiles */
export const Playground: Story = {};
