import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { FormErrorSummary } from './FormErrorSummary.js';

const meta = {
    title: 'Forms/FormErrorSummary',
    component: FormErrorSummary,
    args: {
        errors: [
            { id: 'summary-name', message: 'Please enter your name' },
            { id: 'summary-email', message: 'Please enter a valid email address' },
        ],
        autoFocus: false,
    },
    render: (args) => (
        <View className="w-80 gap-3">
            <FormErrorSummary {...args} />
            <Field id="summary-name" label="Name" error="Please enter your name">
                <Input />
            </Field>
            <Field id="summary-email" label="Email" error="Please enter a valid email address">
                <Input value="max@" />
            </Field>
        </View>
    ),
} satisfies Meta<typeof FormErrorSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each message leads to its field (Field `id`) */
export const Playground: Story = {};
