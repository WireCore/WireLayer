import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Fieldset } from './Fieldset.js';

const meta = {
    title: 'Forms/Fieldset',
    component: Fieldset,
    args: {
        legend: 'Shipping address',
        helperText: 'Where should we send the devices?',
        collapsible: true,
        children: (
            <>
                <Field label="Street">
                    <Input autoComplete="street-address" />
                </Field>
                <Field label="ZIP code and city">
                    <Input autoComplete="postal-code" />
                </Field>
            </>
        ),
    },
    decorators: [(Story) => <View className="w-[340px]">{Story()}</View>],
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Invalid: Story = {
    name: 'With error',
    args: { collapsible: false, invalid: true, errorText: 'Please enter a complete address' },
};
