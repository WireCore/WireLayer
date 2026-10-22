import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Persona } from './Persona.js';

const meta = {
    title: 'Data/Persona',
    component: Persona,
    args: { name: 'Erika Musterfrau', description: 'Project lead', presence: 'online' },
    argTypes: {
        presence: { control: 'inline-radio', options: ['online', 'away', 'busy', 'offline'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    },
} satisfies Meta<typeof Persona>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Team: Story = {
    render: () => (
        <View className="gap-3">
            <Persona name="Max Mustermann" description="Engineering" presence="busy" size="sm" />
            <Persona name="Lea Schmidt" description="Support" presence="away" onPress={() => {}} />
            <Persona name="Jonas Weber" description="Sales" presence="offline" size="lg" />
        </View>
    ),
};
