import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Badge } from '../Badge/Badge.js';
import { DataList, DataListItem } from './DataList.js';

const meta = {
    title: 'Data/DataList',
    component: DataList,
    args: { orientation: 'horizontal', divided: true },
    argTypes: { orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] } },
    render: (args) => (
        <View className="w-[340px]">
            <DataList {...args}>
                <DataListItem label="Order number">2026-0815</DataListItem>
                <DataListItem label="Status">
                    <Badge variant="success">Shipped</Badge>
                </DataListItem>
                <DataListItem label="Shipping address">12 Harbor Street, Hamburg</DataListItem>
            </DataList>
        </View>
    ),
} satisfies Meta<typeof DataList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
