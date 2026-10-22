import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { Mentions } from './Mentions.js';

const people = [
    { value: 'anna', label: 'Anna Berg' },
    { value: 'ben', label: 'Ben Hofmann' },
    { value: 'clara', label: 'Clara Weiß' },
    { value: 'david', label: 'David Krüger' },
];

function Demo() {
    const [value, setValue] = useState('Hi @[Anna Berg](anna), ');
    return (
        <View className="w-80 gap-3">
            <Field label="Comment" helperText="@ mentions people">
                <Mentions items={people} value={value} onValueChange={setValue} />
            </Field>
            <Text variant="muted">Value: {value}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/Mentions',
    component: Mentions,
    render: () => <Demo />,
} satisfies Meta<typeof Mentions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
