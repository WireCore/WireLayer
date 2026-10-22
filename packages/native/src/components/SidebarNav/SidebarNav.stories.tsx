import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ChartColumn, FolderKanban, House, Settings, Users } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { SidebarNav, type SidebarNavItem } from './SidebarNav.js';

const items: SidebarNavItem[] = [
    { label: 'Overview', href: '/', icon: House },
    { label: 'Projects', href: '/projects', icon: FolderKanban, badge: 12 },
    {
        label: 'Reports',
        icon: ChartColumn,
        children: [
            { label: 'Revenue', href: '/reports/revenue' },
            { label: 'Load', href: '/reports/load' },
        ],
    },
    { label: 'Team', href: '/team', icon: Users },
    { label: 'Settings', href: '/settings', icon: Settings },
];

function Demo() {
    const [current, setCurrent] = useState('/reports/revenue');
    return (
        <View className="w-[300px]">
            <SidebarNav
                items={items}
                label="Main navigation"
                currentHref={current}
                onNavigate={(item) => setCurrent(item.href ?? '')}
            />
        </View>
    );
}

const meta = {
    title: 'Navigation/SidebarNav',
    component: SidebarNav,
    args: { items, label: 'Main navigation' },
    render: () => <Demo />,
} satisfies Meta<typeof SidebarNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
