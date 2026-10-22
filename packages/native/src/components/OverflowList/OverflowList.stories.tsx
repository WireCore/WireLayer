import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Badge } from '../Badge/Badge.js';
import { OverflowList } from './OverflowList.js';

const tags = ['Hosting', 'Maintenance', 'Frankfurt', 'High priority', 'SLA Gold', 'Backup', 'Monitoring', 'GDPR'];

const meta = {
    title: 'Data/OverflowList',
    component: OverflowList<string>,
    args: { items: tags, renderItem: (tag: string) => <Badge>{tag}</Badge>, label: 'Tags' },
    decorators: [(Story) => <View className="w-[280px]">{Story()}</View>],
} satisfies Meta<typeof OverflowList<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TwoRows: Story = { name: 'Two rows', args: { maxRows: 2 } };
