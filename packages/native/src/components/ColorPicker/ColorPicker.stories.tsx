import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { ColorPicker } from './ColorPicker.js';

function Demo() {
    const [color, setColor] = useState('#1e66f5');
    return (
        <View className="w-80 gap-3">
            <Field label="Brand color">
                <ColorPicker
                    value={color}
                    onValueChange={setColor}
                    swatches={['#1e66f5', '#40a02b', '#d20f39', '#8839ef']}
                />
            </Field>
            <Text variant="muted">Value: {color}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/ColorPicker',
    component: ColorPicker,
    render: () => <Demo />,
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
