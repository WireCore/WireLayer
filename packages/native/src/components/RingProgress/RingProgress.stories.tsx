import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { RingProgress } from './RingProgress.js';

const meta = {
    title: 'Feedback/RingProgress',
    component: RingProgress,
    args: {
        label: 'Storage by type',
        size: 'lg',
        segments: [
            { value: 38, label: 'Databases' },
            { value: 21, label: 'Files' },
            { value: 9, label: 'Backups', color: 'warn' },
        ],
    },
} satisfies Meta<typeof RingProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SingleValue: Story = {
    name: 'Single value',
    args: { segments: undefined, value: 64, label: 'Quota', roundCaps: true, size: 'md' },
};
