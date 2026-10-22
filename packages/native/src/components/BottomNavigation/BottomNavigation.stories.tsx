import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Bell, FolderKanban, House, User } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { BottomNavigation, type BottomNavigationItem } from './BottomNavigation.js';

const items: BottomNavigationItem[] = [
    { label: 'Home', href: 'home', icon: House },
    { label: 'Projects', href: 'projects', icon: FolderKanban },
    { label: 'Alerts', href: 'inbox', icon: Bell, badge: 4 },
    { label: 'Profile', href: 'profile', icon: User },
];

function Demo() {
    const [current, setCurrent] = useState('home');
    return (
        <View className="h-[300px] w-[360px] justify-between overflow-hidden rounded-xl border border-line bg-bg">
            <View className="p-4">
                <Text variant="title">{items.find((item) => item.href === current)?.label}</Text>
            </View>
            <BottomNavigation items={items} currentHref={current} onNavigate={(item) => setCurrent(item.href)} inline />
        </View>
    );
}

const meta = {
    title: 'Navigation/BottomNavigation',
    component: BottomNavigation,
    args: { items },
    render: () => <Demo />,
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
