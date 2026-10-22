import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Chip } from './Chip.js';

function Demo() {
    const [filters, setFilters] = useState(['Frankfurt', 'Berlin', 'Vienna']);
    return (
        <View className="w-80 gap-3">
            <View className="flex-row flex-wrap gap-1.5">
                {filters.map((filter) => (
                    <Chip
                        key={filter}
                        label={filter}
                        icon={MapPin}
                        removable
                        onRemove={() => setFilters(filters.filter((entry) => entry !== filter))}
                    />
                ))}
            </View>
            <Text variant="muted">Filter: {filters.join(', ') || '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/Chip',
    component: Chip,
    render: () => <Demo />,
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
    render: () => (
        <View className="flex-row flex-wrap items-center gap-2">
            <Chip size="sm" label="Small" />
            <Chip label="Medium" icon={MapPin} />
            <Chip size="lg" label="Large" removable />
            <Chip label="Pressable" onPress={() => {}} />
            <Chip label="Locked" disabled removable />
        </View>
    ),
};
