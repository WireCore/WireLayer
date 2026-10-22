import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { MaskInput } from './MaskInput.js';

function Demo() {
    const [iban, setIban] = useState('');
    const [raw, setRaw] = useState('');
    return (
        <View className="w-80 gap-4">
            <Field label="IBAN">
                <MaskInput
                    mask="DE99 9999 9999 9999 9999 99"
                    value={iban}
                    onValueChange={(value, typed) => {
                        setIban(value);
                        setRaw(typed);
                    }}
                />
            </Field>
            <Field label="ZIP code" helperText="Cleared on leave if incomplete">
                <MaskInput mask="99999" autoClear />
            </Field>
            <Text variant="muted">
                Value: {iban || '–'} · typed: {raw || '–'}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/MaskInput',
    component: MaskInput,
    args: { mask: '99999' },
    render: () => <Demo />,
} satisfies Meta<typeof MaskInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
