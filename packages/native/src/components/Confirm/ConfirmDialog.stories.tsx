import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { choose, confirm, prompt } from './confirm.js';
import { ConfirmDialog } from './ConfirmDialog.js';

function Demo() {
    const [answer, setAnswer] = useState('–');
    return (
        <View className="items-start gap-3">
            <View className="flex-row flex-wrap gap-2">
                <Button
                    size="sm"
                    variant="danger"
                    leadingIcon={Trash2}
                    onPress={async () => {
                        const ok = await confirm({
                            title: 'Delete server?',
                            description: 'web-01 and all backups will be permanently removed.',
                            status: 'danger',
                            icon: Trash2,
                            confirmLabel: 'Delete',
                        });
                        setAnswer(ok ? 'deleted' : 'canceled');
                    }}
                >
                    Delete
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onPress={async () => {
                        const ok = await confirm({
                            title: 'Archive project?',
                            description: 'Enter the name to confirm.',
                            typeToConfirm: 'customer-portal',
                            confirmLabel: 'Archive',
                        });
                        setAnswer(ok ? 'archived' : 'canceled');
                    }}
                >
                    Confirm by typing
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    onPress={async () => {
                        const name = await prompt({
                            title: 'Rename server',
                            label: 'New name',
                            defaultValue: 'web-01',
                            confirmLabel: 'Rename',
                            validate: (value) => (value.trim() ? undefined : 'Please enter a name'),
                        });
                        setAnswer(name === null ? 'canceled' : `new name: ${name}`);
                    }}
                >
                    Rename
                </Button>
            </View>
            <Text variant="muted">{`Answer: ${answer}`}</Text>
            <ConfirmDialog />
        </View>
    );
}

const meta = {
    title: 'Overlays/Confirm',
    component: ConfirmDialog,
    render: () => <Demo />,
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function ChooseDemo() {
    const [answer, setAnswer] = useState('–');
    return (
        <View className="items-start gap-3">
            <Button
                size="sm"
                variant="outline"
                onPress={async () => {
                    const choice = await choose({
                        title: 'Assign the riders automatically?',
                        description: 'Otherwise you assign them by hand.',
                        confirmLabel: 'Assign',
                        cancelLabel: 'Assign by hand',
                    });
                    setAnswer(choice);
                }}
            >
                Assign riders
            </Button>
            <Text variant="muted">{`Answer: ${answer}`}</Text>
            <ConfirmDialog />
        </View>
    );
}

/**
 * `choose()` tells the buttons from closing: `'confirm'`, `'cancel'` or `'dismiss'` (back button, Escape, ×) – for a
 * second button that is an action of its own, where closing does nothing
 */
export const Choose: Story = { render: () => <ChooseDemo /> };
