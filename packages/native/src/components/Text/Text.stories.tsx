import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Text } from './Text.js';

const meta = {
    title: 'Basics/Text',
    component: Text,
    args: { variant: 'body', children: 'Software, hosting and cloud from a single source.' },
    argTypes: { variant: { control: 'inline-radio', options: ['body', 'muted', 'title', 'label'] } },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
    render: () => (
        <View className="max-w-[360px] gap-2">
            <Text variant="label">Services</Text>
            <Text variant="title">Managed Hosting</Text>
            <Text>Operations, updates and monitoring of your applications in German data centers.</Text>
            <Text variant="muted">Available now.</Text>
        </View>
    ),
};
