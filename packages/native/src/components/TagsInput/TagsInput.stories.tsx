import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { TagsInput } from './TagsInput.js';

const skills = ['TypeScript', 'React', 'React Native', 'Vue', 'Kubernetes', 'PostgreSQL', 'Tailwind CSS'];

function Demo() {
    const [value, setValue] = useState(['React']);
    return (
        <View className="w-80 gap-3">
            <Field label="Skills" helperText="Enter or comma adds, five at most">
                <TagsInput value={value} onValueChange={setValue} suggestions={skills} max={5} placeholder="Add …" />
            </Field>
            <Field label="Mailing list" helperText="Valid addresses only">
                <TagsInput validate={(entry) => /^\S+@\S+\.\S+$/.test(entry)} placeholder="name@company.com" />
            </Field>
            <Text variant="muted">Value: {value.join(', ') || '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/TagsInput',
    component: TagsInput,
    render: () => <Demo />,
} satisfies Meta<typeof TagsInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
