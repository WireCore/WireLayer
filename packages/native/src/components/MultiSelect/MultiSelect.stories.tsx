import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Cloud, CodeXml, Cpu, Server } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Field } from '../Field/Field.js';
import { Text } from '../Text/Text.js';
import { MultiSelect } from './MultiSelect.js';

const items = [
    { value: 'web', label: 'Software & Web', icon: CodeXml },
    { value: 'hosting', label: 'Managed Hosting', icon: Server },
    { value: 'cloud', label: 'Cloud & DevOps', icon: Cloud },
    { value: 'hardware', label: 'Hardware', icon: Cpu, disabled: true },
];

function Demo() {
    const [value, setValue] = useState(['hosting']);
    return (
        <View className="w-80 gap-3">
            <Field label="Services">
                <MultiSelect items={items} value={value} onValueChange={setValue} />
            </Field>
            <Text variant="muted">Value: {value.join(', ') || '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/MultiSelect',
    component: MultiSelect,
    args: { items },
    render: () => <Demo />,
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const regions = [
    { value: 'fra', label: 'Frankfurt', group: 'Germany' },
    { value: 'ber', label: 'Berlin', group: 'Germany' },
    { value: 'muc', label: 'Munich', group: 'Germany' },
    { value: 'vie', label: 'Vienna', group: 'Austria' },
    { value: 'zrh', label: 'Zurich', group: 'Switzerland' },
    { value: 'gva', label: 'Geneva', group: 'Switzerland' },
];

function ChipsDemo() {
    const [value, setValue] = useState(['fra', 'vie']);
    return (
        <View className="w-80 gap-3">
            <Field label="Locations" helperText="Three at most">
                <MultiSelect
                    items={regions}
                    value={value}
                    onValueChange={setValue}
                    display="chips"
                    selectAll
                    filter
                    clearable
                    max={3}
                />
            </Field>
            <Text variant="muted">Value: {value.join(', ') || '–'}</Text>
        </View>
    );
}

/** Chips, groups, search in the sheet, "Select all", clear and a limit */
export const Chips: Story = {
    render: () => <ChipsDemo />,
};
