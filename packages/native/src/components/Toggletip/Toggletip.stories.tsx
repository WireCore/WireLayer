import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Toggletip } from './Toggletip.js';

const meta = {
    title: 'Forms/Toggletip',
    component: Toggletip,
    args: {
        label: 'Cost center',
        content: 'The cost center is on your order, or ask Accounting.',
    },
    decorators: [
        (Story) => (
            <View className="h-[200px] w-[320px] flex-row items-start gap-2">
                <Text>Cost center</Text>
                {Story()}
            </View>
        ),
    ],
} satisfies Meta<typeof Toggletip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
