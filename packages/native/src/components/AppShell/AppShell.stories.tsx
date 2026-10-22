import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Bell, FolderKanban, House, Settings, User } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BottomNavigation } from '../BottomNavigation/BottomNavigation.js';
import { SidebarNav } from '../SidebarNav/SidebarNav.js';
import { Text } from '../Text/Text.js';
import { AppShell } from './AppShell.js';

function Demo() {
    const [current, setCurrent] = useState('home');
    const [open, setOpen] = useState(false);
    const navigate = (href?: string) => {
        if (href) setCurrent(href);
        setOpen(false);
    };
    return (
        <View className="h-[520px] w-[360px] overflow-hidden rounded-xl border border-line">
            <AppShell
                header={<Text variant="title">Customer portal</Text>}
                navbarOpen={open}
                onNavbarOpenChange={setOpen}
                navbar={
                    <SidebarNav
                        label="Main navigation"
                        currentHref={current}
                        onNavigate={(item) => navigate(item.href)}
                        items={[
                            { label: 'Home', href: 'home', icon: House },
                            { label: 'Projects', href: 'projects', icon: FolderKanban },
                            { label: 'Settings', href: 'settings', icon: Settings },
                        ]}
                    />
                }
                footer={
                    <BottomNavigation
                        inline
                        currentHref={current}
                        onNavigate={(item) => navigate(item.href)}
                        items={[
                            { label: 'Home', href: 'home', icon: House },
                            { label: 'Projects', href: 'projects', icon: FolderKanban },
                            { label: 'Alerts', href: 'inbox', icon: Bell, badge: 2 },
                            { label: 'Profile', href: 'profile', icon: User },
                        ]}
                    />
                }
            >
                <ScrollView contentContainerClassName="gap-3 p-4">
                    {Array.from({ length: 8 }, (_, index) => (
                        <Text key={index} variant="muted">{`Item ${index + 1} on “${current}”`}</Text>
                    ))}
                </ScrollView>
            </AppShell>
        </View>
    );
}

const meta = {
    title: 'Layout/AppShell',
    component: AppShell,
    args: { children: null },
    render: () => <Demo />,
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
