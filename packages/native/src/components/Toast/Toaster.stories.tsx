import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { toast } from './toaster.js';
import { Toaster, type ToasterProps } from './Toaster.js';

function Demo(props: ToasterProps) {
    return (
        <View className="h-[420px] w-[420px] items-start gap-2">
            <Button
                variant="secondary"
                size="sm"
                onPress={() =>
                    toast({
                        title: 'Deployment complete',
                        description: 'customer-portal · v2.4.1',
                        type: 'success',
                        action: { label: 'Open', onPress: () => {} },
                    })
                }
            >
                Success with action
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onPress={() => toast({ title: 'Connection lost', description: 'North site', type: 'error' })}
            >
                Error
            </Button>
            <Button variant="secondary" size="sm" onPress={() => toast({ title: 'Backup running …', type: 'loading' })}>
                Loading
            </Button>
            <Toaster {...props} />
        </View>
    );
}

const meta = {
    title: 'Overlays/Toast',
    component: Toaster,
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function PromiseDemo() {
    const [fail, setFail] = useState(false);
    return (
        <View className="h-[420px] w-[420px] items-start gap-3">
            <Text variant="muted">{fail ? 'The next export will fail.' : 'The next export will succeed.'}</Text>
            <View className="flex-row gap-2">
                <Button
                    size="sm"
                    onPress={() => {
                        const failing = fail;
                        toast.promise(
                            new Promise<number>((resolve, reject) =>
                                setTimeout(() => (failing ? reject(new Error('Timeout')) : resolve(128)), 600)
                            ),
                            {
                                loading: { title: 'Export running …', description: 'October invoices' },
                                success: (count) => ({ title: 'Export finished', description: `${count} invoices` }),
                                error: (error) => ({
                                    title: 'Export failed',
                                    description: String((error as Error).message),
                                }),
                            }
                        );
                    }}
                >
                    Export
                </Button>
                <Button variant="outline" size="sm" onPress={() => setFail(!fail)}>
                    {fail ? 'Simulate success' : 'Simulate error'}
                </Button>
                <Button variant="text" size="sm" onPress={() => toast.dismiss()}>
                    Close all
                </Button>
            </View>
            <Toaster />
        </View>
    );
}

/** toast.promise: loading until the promise settles, then success or error (toast.update underneath) */
export const WithPromise: Story = {
    name: 'Promise',
    render: () => <PromiseDemo />,
};

/** Placement at the top, the time left as a bar (stands still while pressed) and swipe to dismiss */
export const TopWithProgress: Story = {
    name: 'Top with progress',
    args: { placement: 'top', showProgress: true, swipeToDismiss: true },
};
