import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { CloudUpload, ShieldAlert, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { NotificationCenter, type NotificationItem } from './NotificationCenter.js';

const now = new Date('2026-10-21T12:00:00');
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 3_600_000);

const initial: NotificationItem[] = [
    { id: '1', title: 'Backup complete', description: 'web-01 · 12.4 GB', date: hoursAgo(1), icon: CloudUpload },
    {
        id: '2',
        title: 'New sign-up',
        description: 'Erika Musterfrau joined the team',
        date: hoursAgo(5),
        icon: UserPlus,
    },
    { id: '3', title: 'Certificate renewed', date: hoursAgo(26), read: true, icon: ShieldAlert },
];
const older: NotificationItem[] = [
    { id: '4', title: 'Maintenance finished', date: hoursAgo(80), read: true },
    { id: '5', title: 'October invoice', description: 'Ready to download', date: hoursAgo(120), read: true },
];

function Demo() {
    const [items, setItems] = useState(initial);
    const [loading, setLoading] = useState(false);
    const hasMore = !items.some((item) => item.id === '4');
    return (
        <View className="items-start gap-3">
            <NotificationCenter
                items={items}
                now={now}
                hasMore={hasMore}
                loading={loading}
                onMarkRead={(id) => setItems(items.map((item) => (item.id === id ? { ...item, read: true } : item)))}
                onMarkAllRead={() => setItems(items.map((item) => ({ ...item, read: true })))}
                onLoadMore={() => {
                    setLoading(true);
                    setTimeout(() => {
                        setItems((current) => [...current, ...older]);
                        setLoading(false);
                    }, 500);
                }}
            />
            <Button
                size="sm"
                variant="outline"
                onPress={() =>
                    setItems((current) => [
                        {
                            id: String(Date.now()),
                            title: 'Deployment done',
                            description: 'customer-portal · v2.4.2',
                            date: now,
                        },
                        ...current,
                    ])
                }
            >
                Simulate new notification
            </Button>
        </View>
    );
}

const meta = {
    title: 'Feedback/NotificationCenter',
    component: NotificationCenter,
    render: () => <Demo />,
} satisfies Meta<typeof NotificationCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
