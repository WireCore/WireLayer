import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { Combobox } from './Combobox.js';

const items = ['Berlin', 'Cologne', 'Dusseldorf', 'Frankfurt', 'Hamburg', 'Munich', 'Nuremberg', 'Stuttgart'].map(
    (city) => ({ value: city.toLowerCase(), label: city })
);

function Demo() {
    const [value, setValue] = useState<string | null>(null);
    return (
        <View className="w-80 gap-3">
            <Field label="Location" helperText="Typing filters the list">
                <Combobox items={items} value={value} onValueChange={setValue} />
            </Field>
            <Text variant="muted">Value: {value ?? '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/Combobox',
    component: Combobox,
    args: { items },
    render: () => <Demo />,
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
