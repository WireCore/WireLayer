import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';
import { Badge } from './Badge.js';

const meta = {
    title: 'Data/Badge',
    component: Badge,
    args: { variant: 'soft', children: 'Beta' },
    argTypes: {
        variant: {
            control: 'select',
            options: ['solid', 'soft', 'outline', 'success', 'info', 'warn', 'danger'],
        },
        icon: { control: false },
    },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
    render: () => (
        <View className="flex-row flex-wrap items-center gap-2">
            <Badge variant="solid">New</Badge>
            <Badge>Beta</Badge>
            <Badge variant="outline">v3.2</Badge>
            <Badge variant="success" icon={Check}>
                Active
            </Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="warn">Maintenance</Badge>
            <Badge variant="danger">Disruption</Badge>
        </View>
    ),
};

export const Circle: Story = {
    render: () => (
        <View className="flex-row items-center gap-2">
            <Badge circle variant="danger">
                3
            </Badge>
            <Badge circle variant="solid">
                12
            </Badge>
            <Badge circle variant="info">
                A
            </Badge>
        </View>
    ),
};
