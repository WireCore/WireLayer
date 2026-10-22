import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
import { Collapse } from './Collapse.js';

function Demo() {
    const [open, setOpen] = useState(false);
    return (
        <View className="w-[320px] items-start gap-3">
            <Button size="sm" variant="outline" aria-expanded={open} onPress={() => setOpen(!open)}>
                {open ? 'Hide details' : 'Show details'}
            </Button>
            <Collapse open={open}>
                <Text variant="muted">
                    Managed hosting with daily backups, around-the-clock monitoring and data centers in Frankfurt and
                    Nuremberg.
                </Text>
            </Collapse>
        </View>
    );
}

const meta = {
    title: 'Layout/Collapse',
    component: Collapse,
    render: () => <Demo />,
} satisfies Meta<typeof Collapse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
