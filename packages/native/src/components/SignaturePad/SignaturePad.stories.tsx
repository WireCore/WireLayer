import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { SignaturePad } from './SignaturePad.js';

function Demo() {
    const [value, setValue] = useState('');
    return (
        <View className="w-80 gap-3">
            <SignaturePad typedAlternative onValueChange={setValue} />
            <Text variant="muted">{value ? `Signature: ${value.length} characters (SVG)` : 'Not signed yet'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/SignaturePad',
    component: SignaturePad,
    render: () => <Demo />,
} satisfies Meta<typeof SignaturePad>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
