import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Card } from '../Card/Card.js';
import { Text } from '../Text/Text.js';
import { Watermark } from './Watermark.js';

const meta = {
    title: 'Data/Watermark',
    component: Watermark,
    args: { text: ['Draft', 'Northside Utilities'] },
    render: (args) => (
        <View className="w-[340px]">
            <Watermark {...args} className="rounded-card">
                <Card className="h-56">
                    <Text variant="title">Quote 2026-118</Text>
                    <Text variant="muted">Managed Hosting, 24 months, Frankfurt data center.</Text>
                </Card>
            </Watermark>
        </View>
    ),
} satisfies Meta<typeof Watermark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
