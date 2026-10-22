import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Bell, Moon } from 'lucide-react-native';
import { View } from 'react-native';
import { Switch } from './Switch.js';

const meta = {
    title: 'Forms/Switch',
    component: Switch,
    args: { children: 'Notifications', description: 'By email and push', icon: Bell, defaultChecked: true },
    argTypes: { icon: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
    render: () => (
        <View>
            <Switch icon={Bell} description="By email and push" defaultChecked>
                Notifications
            </Switch>
            <Switch icon={Moon}>Dark theme</Switch>
            <Switch disabled>Disabled</Switch>
        </View>
    ),
};
