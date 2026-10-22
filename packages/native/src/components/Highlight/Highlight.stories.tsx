import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Highlight } from './Highlight.js';

const meta = {
    title: 'Data/Highlight',
    component: Highlight,
    args: {
        text: 'Managed Hosting in Frankfurt and Nuremberg, with backup and monitoring',
        query: ['hosting', 'backup'],
        colors: ['warn', 'info'],
    },
    render: (args) => (
        <View className="w-[320px]">
            <Text>
                <Highlight {...args} />
            </Text>
        </View>
    ),
} satisfies Meta<typeof Highlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
