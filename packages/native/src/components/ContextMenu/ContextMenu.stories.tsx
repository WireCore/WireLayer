import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Copy, Pencil, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../Text/Text.js';
import { ContextMenu } from './ContextMenu.js';

function Demo() {
    const [chosen, setChosen] = useState('–');
    return (
        <View className="w-[320px] gap-3">
            <ContextMenu
                label="Actions for Quote.pdf"
                items={[
                    { value: 'rename', label: 'Rename', icon: Pencil },
                    { value: 'copy', label: 'Copy link', icon: Copy },
                    { value: 'delete', label: 'Delete', icon: Trash2, danger: true },
                ]}
                onSelect={setChosen}
            >
                <Pressable role="button" className="rounded-xl border border-line bg-card p-4">
                    <Text>Quote.pdf</Text>
                    <Text variant="muted">Long-press for actions</Text>
                </Pressable>
            </ContextMenu>
            <Text variant="muted">{`Selected: ${chosen}`}</Text>
        </View>
    );
}

const meta = {
    title: 'Overlays/ContextMenu',
    component: ContextMenu,
    args: { items: [], children: <View /> },
    render: () => <Demo />,
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
