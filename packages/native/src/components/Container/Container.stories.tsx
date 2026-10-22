import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Box } from '../../../.storybook/Box.js';
import { Container } from './Container.js';

const meta = {
    title: 'Layout/Container',
    component: Container,
    args: { size: 'sm' },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', 'full'] } },
    render: (args) => (
        <View className="w-[420px] bg-bg-2 py-3">
            <Container {...args}>
                <Box label="Content with maximum width and padding" />
            </Container>
        </View>
    ),
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
