import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Spinner } from '../Spinner/Spinner.js';
import { Center } from './Center.js';

const meta = {
    title: 'Layout/Center',
    component: Center,
    render: (args) => (
        <View className="h-[160px] w-[300px] rounded-xl border border-line">
            <Center {...args} className="flex-1">
                <Spinner label="Loading projects" />
            </Center>
        </View>
    ),
} satisfies Meta<typeof Center>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
