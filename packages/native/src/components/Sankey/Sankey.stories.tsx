import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Sankey } from './Sankey.js';

const meta = {
    title: 'Data/Sankey',
    component: Sankey,
    args: {
        title: 'Visitor flow in October',
        height: 260,
        nodes: [
            { id: 'search', label: 'Search' },
            { id: 'ads', label: 'Ads' },
            { id: 'mail', label: 'Newsletter' },
            { id: 'shop', label: 'Shop' },
            { id: 'order', label: 'Order' },
            { id: 'exit', label: 'Drop-off' },
        ],
        links: [
            { source: 'search', target: 'shop', value: 420 },
            { source: 'ads', target: 'shop', value: 260 },
            { source: 'mail', target: 'shop', value: 120 },
            { source: 'shop', target: 'order', value: 310 },
            { source: 'shop', target: 'exit', value: 490 },
        ],
        table: true,
    },
    argTypes: { nodes: { control: false }, links: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Sankey>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Bands between the nodes; the flows as a list are the text alternative */
export const Playground: Story = {};
