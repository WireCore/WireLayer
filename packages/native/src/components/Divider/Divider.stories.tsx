import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Divider } from './Divider.js';

const meta = {
    title: 'Layout/Divider',
    component: Divider,
    args: { label: 'or' },
    render: (args) => (
        <View className="w-80 gap-5">
            <Text>Sign in with email</Text>
            <Divider {...args} />
            <Text>Sign in with single sign-on</Text>
            <Divider />
            <View className="h-6 flex-row items-center gap-3">
                <Text>Hosting</Text>
                <Divider orientation="vertical" />
                <Text>Cloud</Text>
            </View>
        </View>
    ),
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Dashed and dotted lines, the label at the start or end */
export const LineStyles: Story = {
    name: 'Lines and labels',
    render: () => (
        <View className="w-[320px] gap-5">
            <Divider lineStyle="dashed" />
            <Divider lineStyle="dotted" label="Optional" />
            <Divider label="Invoice" labelPosition="start" />
            <Divider label="End" labelPosition="end" lineStyle="dashed" />
        </View>
    ),
};
