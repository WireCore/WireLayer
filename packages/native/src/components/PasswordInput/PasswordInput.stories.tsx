import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { PasswordInput } from './PasswordInput.js';

const requirements = [
    { label: 'At least 12 characters', test: (value: string) => value.length >= 12 },
    { label: 'One digit', test: /\d/ },
    { label: 'One special character', test: /[^\p{L}\d]/u },
];

function Demo() {
    const [password, setPassword] = useState('');
    return (
        <View className="w-80 gap-4">
            <Field label="New password">
                <PasswordInput
                    value={password}
                    onChangeText={setPassword}
                    strength
                    requirements={requirements}
                    autoComplete="new-password"
                    textContentType="newPassword"
                />
            </Field>
            <Field label="Password">
                <PasswordInput defaultValue="secret" autoComplete="current-password" />
            </Field>
        </View>
    );
}

const meta = {
    title: 'Forms/PasswordInput',
    component: PasswordInput,
    render: () => <Demo />,
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
