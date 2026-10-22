import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { AiLabel } from './AiLabel.js';

const meta = {
    title: 'Data/AiLabel',
    component: AiLabel,
    render: (args) => (
        <View className="h-[200px] w-[320px] gap-2">
            <AiLabel {...args} />
            <Text variant="muted">Summary: Three tickets concern the certificate of web-01.</Text>
        </View>
    ),
} satisfies Meta<typeof AiLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
