import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Kbd } from './Kbd.js';

const meta = {
    title: 'Data/Kbd',
    component: Kbd,
    args: { hotkey: 'mod+k' },
    render: (args) => (
        <View className="flex-row items-center gap-2">
            <Text variant="muted">Open search</Text>
            <Kbd {...args} />
        </View>
    ),
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sequence: Story = { name: 'Sequence', args: { hotkey: 'g i' } };
