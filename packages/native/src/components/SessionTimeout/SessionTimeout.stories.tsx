import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { SessionTimeout } from './SessionTimeout.js';

function Demo() {
    const [expiresAt, setExpiresAt] = useState<number | null>(null);
    const [state, setState] = useState('Signed in');
    return (
        <View className="items-start gap-3">
            <Text variant="muted">{state}</Text>
            <Button size="sm" onPress={() => setExpiresAt(Date.now() + 65_000)}>
                Session ends in one minute
            </Button>
            {expiresAt !== null && (
                <SessionTimeout
                    expiresAt={expiresAt}
                    warnBefore={60}
                    onExtend={() => {
                        setExpiresAt(Date.now() + 30 * 60_000);
                        setState('Extended by 30 minutes');
                    }}
                    onSignOut={() => setState('Signed out')}
                    onExpire={() => setState('Expired')}
                />
            )}
        </View>
    );
}

const meta = {
    title: 'Feedback/SessionTimeout',
    component: SessionTimeout,
    args: { expiresAt: 0 },
    render: () => <Demo />,
} satisfies Meta<typeof SessionTimeout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
