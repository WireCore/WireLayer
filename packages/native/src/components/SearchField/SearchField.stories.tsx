import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { SearchField } from './SearchField.js';

function Demo() {
    const [query, setQuery] = useState('');
    const [submitted, setSubmitted] = useState('');
    return (
        <View className="w-80 gap-3">
            <SearchField
                value={query}
                onValueChange={setQuery}
                onSubmit={(text, scope) => setSubmitted(`${text} in ${scope}`)}
                scopes={[
                    { value: 'all', label: 'Everywhere' },
                    { value: 'servers', label: 'Server' },
                    { value: 'customers', label: 'Customers' },
                ]}
                suggestions={['web-01', 'web-02', 'db-01', 'Example Inc.']}
            />
            <Text variant="muted">Searched: {submitted || '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/SearchField',
    component: SearchField,
    render: () => <Demo />,
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
