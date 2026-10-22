import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Box } from '../../../.storybook/Box.js';
import { Stack } from './Stack.js';

const meta = {
    title: 'Layout/Stack',
    component: Stack,
    args: { gap: 'md', align: 'stretch' },
    argTypes: {
        gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
        align: { control: 'inline-radio', options: ['stretch', 'start', 'center', 'end'] },
    },
    render: (args) => (
        <View className="w-[300px]">
            <Stack {...args}>
                <Box label="Contact" />
                <Box label="Billing address" />
                <Box label="Payment method" />
            </Stack>
        </View>
    ),
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
