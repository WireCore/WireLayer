import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Group } from './Group.js';

const meta = {
    title: 'Layout/Group',
    component: Group,
    args: { gap: 'sm', justify: 'start' },
    argTypes: {
        justify: { control: 'inline-radio', options: ['start', 'center', 'end', 'between'] },
        gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] },
    },
    render: (args) => (
        <View className="w-[340px]">
            <Group {...args}>
                <Button size="sm" variant="outline">
                    Cancel
                </Button>
                <Button size="sm" variant="secondary">
                    Draft
                </Button>
                <Button size="sm">Send</Button>
            </Group>
        </View>
    ),
} satisfies Meta<typeof Group>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `grow`: the buttons share the width */
export const Grow: Story = { name: 'Equal width', args: { grow: true, nowrap: true } };
