import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { NumberInput } from './NumberInput.js';

function Demo() {
    const [value, setValue] = useState<number | null>(8);
    return (
        <View className="w-72 gap-3">
            <Field label="Number of servers" helperText="1 to 50">
                <NumberInput value={value} onValueChange={setValue} min={1} max={50} />
            </Field>
            <Text variant="muted">Value: {value ?? '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/NumberInput',
    component: NumberInput,
    render: () => <Demo />,
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function OptionsDemo() {
    const [price, setPrice] = useState<number | null>(1234.5);
    return (
        <View className="w-72 gap-4">
            <Field label="Price" helperText="Comma or period – both work">
                <NumberInput
                    value={price}
                    onValueChange={setPrice}
                    decimals={2}
                    formatOptions={{ style: 'currency', currency: 'EUR' }}
                    clearable
                />
            </Field>
            <Field label="Quantity">
                <NumberInput defaultValue={3} suffix="pcs" min={0} allowDecimal={false} stepper={false} />
            </Field>
            <Field label="Discount" helperText="At most 30 – limited while typing">
                <NumberInput defaultValue={10} suffix="%" min={0} max={30} clampBehavior="strict" />
            </Field>
            <Text variant="muted">Price: {price ?? '–'}</Text>
        </View>
    );
}

/** Currency format, decimals, suffix, no stepper, strict clamping */
export const Options: Story = {
    render: () => <OptionsDemo />,
};
