import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { ColorSwatchPicker } from './ColorSwatchPicker.js';

const items = [
    { value: '#1e66f5', label: 'Blue' },
    { value: '#40a02b', label: 'Green' },
    { value: '#df8e1d', label: 'Yellow' },
    { value: '#d20f39', label: 'Red' },
    { value: '#8839ef', label: 'Violet' },
    { value: '#eff1f5', label: 'Light gray' },
];

function Demo() {
    const [value, setValue] = useState<string | null>('#1e66f5');
    return (
        <View className="w-80 gap-4">
            <ColorSwatchPicker label="Accent color" items={items} value={value} onValueChange={setValue} />
            <ColorSwatchPicker label="With names" items={items.slice(0, 4)} showLabels size="lg" />
            <Text variant="muted">Value: {value ?? '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/ColorSwatchPicker',
    component: ColorSwatchPicker,
    args: { items },
    render: () => <Demo />,
} satisfies Meta<typeof ColorSwatchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
