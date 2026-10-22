import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { announce, LiveAnnouncer } from './LiveAnnouncer.js';

function Demo() {
    const [count, setCount] = useState(3);
    return (
        <LiveAnnouncer>
            <View className="items-start gap-3">
                <Text variant="muted">{`${count} items in the trash`}</Text>
                <Button
                    size="sm"
                    variant="danger"
                    onPress={() => {
                        setCount(0);
                        announce(`${count} items deleted`);
                    }}
                >
                    Empty trash
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onPress={() => announce('Disconnected', { politeness: 'assertive' })}
                >
                    Urgent announcement
                </Button>
            </View>
        </LiveAnnouncer>
    );
}

const meta = {
    title: 'Utilities/LiveAnnouncer',
    component: LiveAnnouncer,
    render: () => <Demo />,
} satisfies Meta<typeof LiveAnnouncer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
