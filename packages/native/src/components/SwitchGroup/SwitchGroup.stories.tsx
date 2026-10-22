import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Switch } from '../Switch/Switch.js';
import { Text } from '../Text/Text.js';
import { SwitchGroup } from './SwitchGroup.js';

function Demo() {
    const [value, setValue] = useState(['backups']);
    return (
        <View className="w-80 gap-3">
            <SwitchGroup label="Services" helperText="Changes apply immediately" value={value} onValueChange={setValue}>
                <Switch value="backups" description="Daily at 2:00 AM">
                    Backups
                </Switch>
                <Switch value="monitoring">Monitoring</Switch>
                <Switch value="updates">Automatic updates</Switch>
            </SwitchGroup>
            <Text variant="muted">Value: {value.join(', ') || '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/SwitchGroup',
    component: SwitchGroup,
    render: () => <Demo />,
} satisfies Meta<typeof SwitchGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
