import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { StatusDot } from './StatusDot.js';

const meta = {
    title: 'Feedback/StatusDot',
    component: StatusDot,
    args: { status: 'success', pulse: true, children: 'Online' },
    argTypes: { status: { control: 'inline-radio', options: ['neutral', 'success', 'info', 'warn', 'danger'] } },
} satisfies Meta<typeof StatusDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Statuses: Story = {
    render: () => (
        <View className="flex-row flex-wrap items-center gap-2">
            <StatusDot status="success" pulse>
                Online
            </StatusDot>
            <StatusDot status="info">Deployment</StatusDot>
            <StatusDot status="warn">Maintenance</StatusDot>
            <StatusDot status="danger">Offline</StatusDot>
            <StatusDot>Paused</StatusDot>
        </View>
    ),
};

export const WithIcon: Story = {
    render: () => (
        <View className="flex-row flex-wrap gap-2">
            <StatusDot status="success" icon>
                Running
            </StatusDot>
            <StatusDot status="warn" icon>
                Maintenance
            </StatusDot>
            <StatusDot status="danger" icon>
                Disrupted
            </StatusDot>
            <StatusDot status="info" icon>
                Planned
            </StatusDot>
        </View>
    ),
};
