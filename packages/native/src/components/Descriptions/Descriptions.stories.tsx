import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Input } from '../Input/Input.js';
import { Descriptions, type DescriptionsItem } from './Descriptions.js';

const initial: DescriptionsItem[] = [
    { id: 'customer', label: 'Customer', value: 'Northside Utilities' },
    { id: 'contract', label: 'Contract', value: 'MH-2026-118' },
    { id: 'location', label: 'Location', value: 'Frankfurt' },
    { id: 'notes', label: 'Notes', value: 'Maintenance Saturdays 10 PM–midnight', span: 'full' },
];

function Demo() {
    const [items, setItems] = useState(initial);
    const [editing, setEditing] = useState(false);
    return (
        <View className="w-[360px]">
            <Descriptions
                title="Contract"
                items={items}
                bordered
                columns={{ base: 2 }}
                editing={editing}
                actions={
                    <Button size="sm" variant="outline" leadingIcon={Pencil} onPress={() => setEditing(!editing)}>
                        {editing ? 'Done' : 'Edit'}
                    </Button>
                }
                renderEdit={(item, { labelId }) => (
                    <Input
                        aria-labelledby={labelId}
                        size="sm"
                        value={String(item.value ?? '')}
                        onChangeText={(value) =>
                            setItems(items.map((entry) => (entry.id === item.id ? { ...entry, value } : entry)))
                        }
                    />
                )}
            />
        </View>
    );
}

const meta = {
    title: 'Data/Descriptions',
    component: Descriptions,
    args: { items: initial },
    render: () => <Demo />,
} satisfies Meta<typeof Descriptions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
