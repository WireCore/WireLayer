import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Result } from './Result.js';

const meta = {
    title: 'Feedback/Result',
    component: Result,
    args: {
        status: 'success',
        title: 'Order placed',
        description: 'You will receive a confirmation email in a few minutes.',
        actions: <Button size="sm">Go to overview</Button>,
    },
    argTypes: {
        status: { control: 'select', options: ['success', 'info', 'warn', 'error', '403', '404', '500'] },
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Result>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const NotFound: Story = {
    name: 'Not found',
    args: {
        status: '404',
        title: undefined,
        description: undefined,
        actions: (
            <Button size="sm" variant="outline">
                Go to home page
            </Button>
        ),
    },
};
