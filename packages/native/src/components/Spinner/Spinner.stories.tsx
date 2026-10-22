import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Spinner } from './Spinner.js';

const meta = {
    title: 'Feedback/Spinner',
    component: Spinner,
    args: { size: 'md' },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
    render: () => (
        <View className="flex-row items-center gap-4">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
        </View>
    ),
};

/** A fixed value draws a filling ring (role progressbar with the value) */
export const WithValue: Story = {
    name: 'With value',
    render: () => (
        <View className="flex-row items-center gap-4">
            <Spinner size="sm" value={25} label="Upload" />
            <Spinner size="md" value={60} label="Upload" />
            <Spinner size="lg" value={90} label="Upload" />
        </View>
    ),
};
