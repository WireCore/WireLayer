import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { QuarterPicker } from './QuarterPicker.js';

const meta = {
    title: 'Forms/QuarterPicker',
    component: QuarterPicker,
    args: { defaultValue: '2026-Q4', presets: ['thisQuarter', 'lastQuarter'] },
    render: (args) => (
        <View className="w-80">
            <Field label="Quarter">
                <QuarterPicker {...args} />
            </Field>
        </View>
    ),
} satisfies Meta<typeof QuarterPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
