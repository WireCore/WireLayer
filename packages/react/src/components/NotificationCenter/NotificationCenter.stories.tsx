import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreditCard, HardDrive, ShieldAlert, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { NotificationCenter, type NotificationItem } from './NotificationCenter.js';

const now = new Date();
const at = (daysAgo: number, hours: number, minutes = 0) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hours, minutes).toISOString();

const start: NotificationItem[] = [
    {
        id: '1',
        title: 'Backup complete',
        description: 'web-01 · 2.3 GB',
        date: at(0, 7, 30),
        icon: HardDrive,
        href: '#backup',
    },
    {
        id: '2',
        title: 'New team member',
        description: 'Julia Berg joined the team',
        date: at(0, 6, 5),
        icon: UserPlus,
    },
    { id: '3', title: 'October invoice ready', date: at(1, 16), read: true, icon: CreditCard, href: '#invoice' },
    {
        id: '4',
        title: 'Certificate expires in 14 days',
        description: 'portal.example.de',
        date: at(9, 9),
        icon: ShieldAlert,
    },
];

function Demo(args: Parameters<typeof NotificationCenter>[0]) {
    const [items, setItems] = useState(args.items ?? []);
    const [loading, setLoading] = useState(false);
    const [more, setMore] = useState(args.hasMore ?? true);
    return (
        <div className="flex items-center gap-3">
            <NotificationCenter
                {...args}
                items={items}
                hasMore={more}
                loading={loading}
                onMarkRead={(id) => setItems(items.map((item) => (item.id === id ? { ...item, read: true } : item)))}
                onMarkAllRead={() => setItems(items.map((item) => ({ ...item, read: true })))}
                onLoadMore={() => {
                    setLoading(true);
                    setTimeout(() => {
                        setItems((list) => [
                            ...list,
                            { id: `old-${list.length}`, title: 'Maintenance complete', date: at(20, 23), read: true },
                        ]);
                        setLoading(false);
                        setMore(false);
                    }, 800);
                }}
                renderActions={(item) =>
                    item.href ? null : (
                        <IconButton icon={HardDrive} label={`Details: ${item.title}`} variant="text" size="xs" />
                    )
                }
            />
            <Button
                size="sm"
                variant="outline"
                onClick={() =>
                    setItems((list) => [
                        {
                            id: `new-${list.length}`,
                            title: 'Deployment succeeded',
                            description: 'portal v4.2',
                            date: new Date().toISOString(),
                        },
                        ...list,
                    ])
                }
            >
                Simulate new notification
            </Button>
        </div>
    );
}

const meta = {
    title: 'Feedback/NotificationCenter',
    component: NotificationCenter,
    args: { items: start },
    argTypes: { items: { control: false }, display: { control: 'inline-radio', options: ['popover', 'drawer'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof NotificationCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Bell with counter; grouped by day, mark as read, load more; new notifications are announced politely */
export const Playground: Story = {};

/** In a drawer from the side */
export const Drawer: Story = { args: { display: 'drawer' } };

/** Nothing there */
export const Empty: Story = { args: { items: [], hasMore: false } };
