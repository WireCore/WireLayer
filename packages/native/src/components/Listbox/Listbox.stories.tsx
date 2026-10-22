import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Listbox } from './Listbox.js';

const items = [
    { value: 'fra', label: 'Frankfurt', group: 'Germany' },
    { value: 'ber', label: 'Berlin', group: 'Germany' },
    { value: 'vie', label: 'Vienna', group: 'Austria' },
    { value: 'zrh', label: 'Zurich', group: 'Switzerland', disabled: true },
];

function Demo() {
    const [single, setSingle] = useState(['ber']);
    const [many, setMany] = useState<string[]>([]);
    return (
        <View className="w-80 gap-4">
            <Listbox label="Data center" items={items} value={single} onValueChange={setSingle} />
            <Listbox label="Mirroring" items={items} multiple selectAll filter value={many} onValueChange={setMany} />
            <Text variant="muted">
                Values: {single.join(', ') || '–'} · {many.join(', ') || '–'}
            </Text>
        </View>
    );
}

const meta = {
    title: 'Forms/Listbox',
    component: Listbox,
    args: { items },
    render: () => <Demo />,
} satisfies Meta<typeof Listbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
