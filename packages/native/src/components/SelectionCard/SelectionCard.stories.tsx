import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Server, Shield } from 'lucide-react-native';
import { View } from 'react-native';
import { CheckboxCard } from './SelectionCard.js';

const meta = {
    title: 'Forms/SelectionCard',
    component: CheckboxCard,
    args: { title: 'Backups', description: 'Daily, kept for 30 days', price: '€9 / month', defaultChecked: true },
    render: (args) => (
        <View className="w-80 gap-2">
            <CheckboxCard {...args} icon={Server} />
            <CheckboxCard title="DDoS protection" description="Always on" icon={Shield} disabled />
        </View>
    ),
} satisfies Meta<typeof CheckboxCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** CheckboxCard alone – in groups see CheckboxGroup › Cards and RadioGroup › Cards (RadioCard) */
export const Playground: Story = {};
