import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { Dialog } from './Dialog.js';

const meta = {
    title: 'Overlays/Dialog',
    component: Dialog,
    args: { open: false, onOpenChange: () => {}, title: '' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function ConfirmDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button variant="danger" leadingIcon={Trash2} onPress={() => setOpen(true)}>
                Delete server
            </Button>
            <Dialog
                open={open}
                onOpenChange={setOpen}
                role="alertdialog"
                status="danger"
                icon={Trash2}
                title="Delete server?"
                description="web-01 and all backups will be permanently removed."
                footer={
                    <>
                        <Button variant="outline" size="sm" onPress={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" size="sm" onPress={() => setOpen(false)}>
                            Delete
                        </Button>
                    </>
                }
            />
        </>
    );
}

export const Confirm: Story = {
    render: () => <ConfirmDemo />,
};

function OptionsDemo() {
    const [open, setOpen] = useState<string | null>(null);
    const close = () => setOpen(null);
    const footer = (
        <Button size="sm" onPress={close}>
            Got it
        </Button>
    );
    const text = 'We adjusted the prices for managed hosting as of January 1. Existing contracts continue unchanged.';
    return (
        <View className="flex-row flex-wrap gap-2">
            <Button size="sm" variant="outline" onPress={() => setOpen('sm')}>
                Small
            </Button>
            <Button size="sm" variant="outline" onPress={() => setOpen('bottom')}>
                Docked at the bottom
            </Button>
            <Button size="sm" variant="outline" onPress={() => setOpen('full')}>
                Fullscreen
            </Button>
            <Button size="sm" variant="outline" onPress={() => setOpen('locked')}>
                Not closable
            </Button>
            <Dialog
                open={open === 'sm'}
                onOpenChange={close}
                size="sm"
                title="Price change"
                description={text}
                footer={footer}
            />
            <Dialog
                open={open === 'bottom'}
                onOpenChange={close}
                position="bottom"
                title="Price change"
                description={text}
                footer={footer}
            />
            <Dialog open={open === 'full'} onOpenChange={close} fullscreen title="Price change" footer={footer}>
                <Text variant="muted">{Array.from({ length: 8 }, () => text).join('\n\n')}</Text>
            </Dialog>
            <Dialog
                open={open === 'locked'}
                onOpenChange={close}
                closable={false}
                closeOnInteractOutside={false}
                title="Please confirm"
                description="This notice only closes via the button."
                footer={footer}
            />
        </View>
    );
}

/** Sizes, docked to the bottom, fullscreen and a dialog that only its button closes */
export const Options: Story = { name: 'Variants', render: () => <OptionsDemo /> };
