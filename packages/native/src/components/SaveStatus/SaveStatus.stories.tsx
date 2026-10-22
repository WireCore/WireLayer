import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { SaveStatus } from './SaveStatus.js';

const meta = {
    title: 'Feedback/SaveStatus',
    component: SaveStatus,
    args: { status: 'saved' },
    argTypes: { status: { control: 'inline-radio', options: ['idle', 'saving', 'saved', 'error'] } },
} satisfies Meta<typeof SaveStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function AutosaveDemo() {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    return (
        <View className="items-start gap-3">
            <Button
                size="sm"
                onPress={() => {
                    setStatus('saving');
                    setTimeout(() => setStatus('saved'), 800);
                }}
            >
                Save draft
            </Button>
            <SaveStatus status={status} />
        </View>
    );
}

export const Autosave: Story = { name: 'Autosave', render: () => <AutosaveDemo /> };
