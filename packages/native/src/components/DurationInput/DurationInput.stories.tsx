import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { DurationInput } from './DurationInput.js';

const meta = {
    title: 'Forms/DurationInput',
    component: DurationInput,
    args: { defaultValue: 90, withSeconds: false, withDays: false },
    render: (args) => (
        <View className="w-80">
            <Field label="Duration">
                <DurationInput {...args} />
            </Field>
        </View>
    ),
} satisfies Meta<typeof DurationInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const WithSeconds: Story = { args: { defaultValue: 3725, valueType: 'seconds', withSeconds: true } };
