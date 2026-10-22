import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { Text } from '../Text/Text.js';
import { DialogHost } from './DialogHost.js';
import { openDialog } from './dialogs.js';

function RenameForm({ close, initial }: { close: (result?: string) => void; initial: string }) {
    const [name, setName] = useState(initial);
    return (
        <View className="gap-3 pt-2">
            <Field label="Name">
                <Input value={name} onChangeText={setName} autoFocus />
            </Field>
            <View className="flex-row justify-end gap-2">
                <Button size="sm" variant="outline" onPress={() => close()}>
                    Cancel
                </Button>
                <Button size="sm" onPress={() => close(name)}>
                    Save
                </Button>
            </View>
        </View>
    );
}

function Demo() {
    const [result, setResult] = useState('–');
    return (
        <View className="items-start gap-3">
            <Button
                size="sm"
                onPress={async () => {
                    const name = await openDialog<string>({
                        title: 'Rename server',
                        description: 'The name appears on invoices and reports.',
                        data: 'web-01',
                        content: (close, data) => <RenameForm close={close} initial={String(data)} />,
                    });
                    setResult(name ?? 'canceled');
                }}
            >
                Open dialog
            </Button>
            <Button
                size="sm"
                variant="outline"
                onPress={() =>
                    void openDialog({
                        title: 'Terms of use',
                        fullscreen: true,
                        content: () => (
                            <Text variant="muted">
                                {Array.from(
                                    { length: 12 },
                                    () => 'These terms govern the use of the customer portal.'
                                ).join(' ')}
                            </Text>
                        ),
                    })
                }
            >
                Fullscreen
            </Button>
            <Text variant="muted">{`Result: ${result}`}</Text>
            <DialogHost />
        </View>
    );
}

const meta = {
    title: 'Overlays/DialogService',
    component: DialogHost,
    render: () => <Demo />,
} satisfies Meta<typeof DialogHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
