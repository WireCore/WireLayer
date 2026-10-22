import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Alert } from './Alert.js';

const meta = {
    title: 'Feedback/Alert',
    component: Alert,
    args: {
        status: 'info',
        title: 'Maintenance window',
        children: 'Saturday, 2:00–4:00 AM. Brief interruptions are possible.',
        dismissible: true,
    },
    argTypes: { status: { control: 'inline-radio', options: ['success', 'info', 'warn', 'danger'] } },
    decorators: [(Story) => <View className="w-[420px]">{Story()}</View>],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Statuses: Story = {
    render: () => (
        <View className="gap-2.5">
            <Alert status="success" title="Deployment complete">
                Version 3.2 is live.
            </Alert>
            <Alert status="info" title="Maintenance window">
                Saturday, 2:00–4:00 AM.
            </Alert>
            <Alert status="warn" title="Certificate expiring">
                Valid for 7 more days.
            </Alert>
            <Alert status="danger" title="Connection lost" dismissible>
                The North site is unreachable.
            </Alert>
        </View>
    ),
};

export const SimpleAndSmall: Story = {
    render: () => (
        <View className="gap-2.5">
            <Alert status="danger" variant="simple">
                Please enter a valid email address
            </Alert>
            <Alert status="success" variant="simple" title="Saved" />
            <Alert status="info" size="sm" title="Note">
                Changes take effect after saving.
            </Alert>
            <Alert status="neutral" title="No status">
                Neutral note without color.
            </Alert>
        </View>
    ),
};
