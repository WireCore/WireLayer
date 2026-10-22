import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { ProgressCircle } from './ProgressCircle.js';

const meta = {
    title: 'Feedback/ProgressCircle',
    component: ProgressCircle,
    args: { value: 72, label: 'Storage used' },
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        status: { control: 'inline-radio', options: ['neutral', 'success', 'warn', 'danger'] },
    },
} satisfies Meta<typeof ProgressCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Status: Story = {
    render: () => (
        <View className="flex-row gap-6">
            <ProgressCircle value={92} label="Availability" status="success" size="sm" />
            <ProgressCircle value={78} label="Quota" status="warn" size="sm" />
            <ProgressCircle value={97} label="Disk" status="danger" size="sm" />
        </View>
    ),
};
