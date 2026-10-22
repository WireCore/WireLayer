import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { PinInput } from './PinInput.js';

function Demo() {
    const [code, setCode] = useState('');
    const [done, setDone] = useState('');
    return (
        <View className="gap-4">
            <Field label="Verification code" helperText="Enter the code from the SMS">
                <PinInput
                    length={6}
                    otp
                    value={code}
                    onValueChange={setCode}
                    onValueComplete={setDone}
                    placeholder="○"
                />
            </Field>
            <Field label="PIN">
                <PinInput mask />
            </Field>
            <Text variant="muted">
                Code: {code || '–'} {done ? `(complete: ${done})` : ''}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/PinInput',
    component: PinInput,
    render: () => <Demo />,
} satisfies Meta<typeof PinInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
