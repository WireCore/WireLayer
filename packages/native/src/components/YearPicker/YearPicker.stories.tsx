import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { YearPicker } from './YearPicker.js';

const meta = {
    title: 'Forms/YearPicker',
    component: YearPicker,
    args: { defaultValue: '2026', min: '2020', max: '2030', clearable: true },
    render: (args) => (
        <View className="w-80">
            <Field label="Fiscal year">
                <YearPicker {...args} />
            </Field>
        </View>
    ),
} satisfies Meta<typeof YearPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
