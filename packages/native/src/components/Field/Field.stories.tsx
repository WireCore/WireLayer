import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { AtSign, Globe, Search } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Input } from '../Input/Input.js';
import { Textarea } from '../Textarea/Textarea.js';
import { Field } from './Field.js';

const meta = {
    title: 'Forms/Field',
    component: Field,
    args: { label: 'Email', helperText: 'For questions about your request', required: true },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
    render: (args) => (
        <Field {...args}>
            <Input placeholder="name@company.com" keyboardType="email-address" autoComplete="email" />
        </Field>
    ),
};

function ValidationDemo() {
    const [value, setValue] = useState('max@');
    const error = /^\S+@\S+\.\S+$/.test(value) ? undefined : 'Please enter a valid address';
    return (
        <Field label="Email" error={error} required>
            <Input value={value} onChangeText={setValue} keyboardType="email-address" />
        </Field>
    );
}

export const Validation: Story = {
    render: () => <ValidationDemo />,
};

export const Inputs: Story = {
    render: () => (
        <View className="gap-4">
            <Field label="Search">
                <Input leadingIcon={Search} placeholder="Servers, customers …" />
            </Field>
            <Field label="Domain">
                <Input prefix="https://" suffix=".com" placeholder="company" leadingIcon={Globe} />
            </Field>
            <Field label="Size sm">
                <Input size="sm" placeholder="Small" />
            </Field>
            <Field label="Disabled" disabled>
                <Input value="Cannot be changed" />
            </Field>
            <Field label="Message" helperText="Up to 500 characters">
                <Textarea placeholder="What is it about?" />
            </Field>
        </View>
    ),
};

function StatesDemo() {
    const [name, setName] = useState('wirecore');
    return (
        <View className="gap-4">
            <Field
                label="Username"
                success={name.length >= 3 ? 'Username is available' : undefined}
                labelHelp="Lowercase letters and digits only, at least 3 characters."
            >
                <Input value={name} onChangeText={setName} leadingIcon={AtSign} clearable autoCapitalize="none" />
            </Field>
            <Field label="Company" optional>
                <Input placeholder="Acme Inc." />
            </Field>
            <Field label="Checking">
                <Input value="anna" loading />
            </Field>
            <Field label="Size lg">
                <Input size="lg" placeholder="Large" />
            </Field>
        </View>
    );
}

/** Success, labelHelp ((i) button), optional, loading and clearable */
export const States: Story = {
    render: () => <StatesDemo />,
};

export const TextareaOptions: Story = {
    render: () => (
        <View className="gap-4">
            <Field label="Message" helperText="Grows with the text (2 to 6 lines)">
                <Textarea
                    autoResize
                    minRows={2}
                    maxRows={6}
                    maxLength={200}
                    showCount
                    clearable
                    placeholder="What is it about?"
                />
            </Field>
            <Field label="Short" helperText="Size sm">
                <Textarea size="sm" minRows={2} placeholder="Note" />
            </Field>
        </View>
    ),
};
