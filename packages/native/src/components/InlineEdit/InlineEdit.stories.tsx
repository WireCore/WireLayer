import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { InlineEdit } from './InlineEdit.js';

function Demo() {
    const [name, setName] = useState('Customer portal relaunch');
    return (
        <View className="w-80 gap-3">
            <InlineEdit
                label="Project name"
                value={name}
                onValueChange={(next) => setName(next ?? '')}
                validate={(next) => (next && next.trim().length >= 3 ? null : 'At least 3 characters')}
            />
            <InlineEdit label="Description" placeholder="No description yet" />
            <Text variant="muted">Name: {name}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/InlineEdit',
    component: InlineEdit,
    args: { label: 'Project name' },
    render: () => <Demo />,
} satisfies Meta<typeof InlineEdit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
