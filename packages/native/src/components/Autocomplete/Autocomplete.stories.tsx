import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { Autocomplete } from './Autocomplete.js';

const cities = [
    'Berlin',
    'Bremen',
    'Cologne',
    'Dortmund',
    'Dresden',
    'Dusseldorf',
    'Frankfurt',
    'Hamburg',
    'Munich',
    'Nuremberg',
];

function Demo() {
    const [city, setCity] = useState('');
    const [tags, setTags] = useState(['Hamburg']);
    return (
        <View className="w-80 gap-4">
            <Field label="City" helperText="Free text with suggestions">
                <Autocomplete
                    items={cities}
                    value={city}
                    onValueChange={setCity}
                    clearable
                    placeholder="e.g. Cologne"
                />
            </Field>
            <Field label="Locations" helperText="Multiple entries (multiple)">
                <Autocomplete items={cities} multiple values={tags} onValuesChange={setTags} max={4} />
            </Field>
            <Text variant="muted">
                City: {city || '–'} · Locations: {tags.join(', ') || '–'}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/Autocomplete',
    component: Autocomplete,
    args: { items: cities },
    render: () => <Demo />,
} satisfies Meta<typeof Autocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
