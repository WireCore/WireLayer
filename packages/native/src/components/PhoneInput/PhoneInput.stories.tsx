import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { PhoneInput } from './PhoneInput.js';

function Demo() {
    const [phone, setPhone] = useState('+4930123456');
    const [valid, setValid] = useState(true);
    return (
        <View className="w-80 gap-3">
            <Field label="Phone" helperText="Typing “+43 …” switches the country">
                <PhoneInput value={phone} onValueChange={setPhone} onValidChange={setValid} />
            </Field>
            <Text variant="muted">
                E.164: {phone || '–'} ({valid ? 'valid' : 'invalid'})
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/PhoneInput',
    component: PhoneInput,
    render: () => <Demo />,
} satisfies Meta<typeof PhoneInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
