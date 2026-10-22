import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Copy } from 'lucide-react-native';
import { View } from 'react-native';
import { IconButton } from '../IconButton/IconButton.js';
import { Tooltip } from './Tooltip.js';

const meta = {
    title: 'Overlays/Tooltip',
    component: Tooltip,
    args: { content: 'Copy configuration', children: <View /> },
    render: (args) => (
        <View className="pt-12">
            <Tooltip content={args.content}>
                <IconButton icon={Copy} label="Copy" />
            </Tooltip>
        </View>
    ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Bottom: Story = {
    render: () => (
        <View className="pb-12">
            <Tooltip content="Below the button" placement="bottom">
                <IconButton icon={Copy} label="Copy" />
            </Tooltip>
        </View>
    ),
};
