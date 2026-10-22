import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Heart } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Rating } from './Rating.js';

function Demo() {
    const [value, setValue] = useState(3);
    return (
        <View className="gap-4">
            <Rating label="Rating" value={value} onValueChange={setValue} allowClear />
            <Rating label="With half stars" defaultValue={3.5} allowHalf size="lg" />
            <Rating label="Like" defaultValue={2} icon={Heart} size="sm" />
            <Rating label="Read-only" defaultValue={4} readOnly />
            <Text variant="muted">Value: {value}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/Rating',
    component: Rating,
    render: () => <Demo />,
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
