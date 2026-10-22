import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Bell, Plus } from 'lucide-react-native';
import { useRef, useState, type ComponentRef } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Text } from '../Text/Text.js';
import { Tour } from './Tour.js';

function Demo() {
    const [open, setOpen] = useState(false);
    const [done, setDone] = useState(false);
    const create = useRef<ComponentRef<typeof View>>(null);
    const inbox = useRef<ComponentRef<typeof View>>(null);
    return (
        <View className="h-[420px] w-[360px] gap-4 p-4">
            <View className="flex-row items-center justify-between">
                <Text variant="title">Projects</Text>
                <View ref={inbox} collapsable={false}>
                    <IconButton icon={Bell} label="Alerts" badge={2} />
                </View>
            </View>
            <View ref={create} collapsable={false} className="self-start">
                <Button leadingIcon={Plus}>New project</Button>
            </View>
            <Button variant="outline" size="sm" onPress={() => setOpen(true)}>
                Start tour
            </Button>
            <Text variant="muted">{done ? 'Tour completed' : ''}</Text>
            <Tour
                open={open}
                onOpenChange={setOpen}
                onComplete={() => setDone(true)}
                steps={[
                    {
                        id: 'welcome',
                        title: 'Welcome',
                        description: 'In two steps we show you the essentials.',
                    },
                    {
                        id: 'create',
                        title: 'Create project',
                        description: 'Create a new project here.',
                        target: create,
                    },
                    {
                        id: 'inbox',
                        title: 'Alerts',
                        description: 'New alerts appear here with their count.',
                        target: inbox,
                    },
                ]}
            />
        </View>
    );
}

const meta = {
    title: 'Overlays/Tour',
    component: Tour,
    args: { steps: [] },
    render: () => <Demo />,
} satisfies Meta<typeof Tour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
