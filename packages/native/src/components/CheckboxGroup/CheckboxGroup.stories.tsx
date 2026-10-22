import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Cloud, Database, Server } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { CheckboxCard } from '../SelectionCard/SelectionCard.js';
import { Text } from '../Text/Text.js';
import { CheckboxGroup } from './CheckboxGroup.js';

function Demo() {
    const [value, setValue] = useState(['mail']);
    return (
        <View className="w-80 gap-3">
            <CheckboxGroup
                label="Notifications"
                helperText="At most two"
                max={2}
                value={value}
                onValueChange={setValue}
            >
                <Checkbox value="mail">Email</Checkbox>
                <Checkbox value="sms">SMS</Checkbox>
                <Checkbox value="push">Push</Checkbox>
            </CheckboxGroup>
            <Text variant="muted">Value: {value.join(', ') || '–'}</Text>
        </View>
    );
}

const meta = {
    title: 'Forms/CheckboxGroup',
    component: CheckboxGroup,
    render: () => <Demo />,
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Cards: Story = {
    render: () => (
        <View className="w-[360px]">
            <CheckboxGroup label="Services" defaultValue={['hosting']} columns={2} error="Select at least one service">
                <CheckboxCard
                    value="hosting"
                    title="Hosting"
                    description="Managed Server"
                    price="from €49"
                    icon={Server}
                />
                <CheckboxCard value="db" title="Database" description="PostgreSQL" price="from €29" icon={Database} />
                <CheckboxCard value="cloud" title="Cloud" description="Kubernetes" price="from €99" icon={Cloud} />
            </CheckboxGroup>
        </View>
    ),
};
