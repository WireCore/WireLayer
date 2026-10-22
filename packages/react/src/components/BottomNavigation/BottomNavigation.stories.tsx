import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, House, MessageSquare, Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import { BottomNavigation, type BottomNavigationItem } from './BottomNavigation.js';

const items: BottomNavigationItem[] = [
    { label: 'Home', href: '#home', icon: House },
    { label: 'Search', href: '#search', icon: Search },
    { label: 'Messages', href: '#messages', icon: MessageSquare, badge: 3 },
    { label: 'Alerts', href: '#alerts', icon: Bell, badge: 120 },
    { label: 'Profile', href: '#profile', icon: UserRound },
];

function Demo(args: Parameters<typeof BottomNavigation>[0]) {
    const [current, setCurrent] = useState('#home');
    return (
        <BottomNavigation
            {...args}
            currentHref={current}
            onNavigate={(item, event) => {
                event.preventDefault();
                setCurrent(item.href);
            }}
        />
    );
}

const meta = {
    title: 'Navigation/BottomNavigation',
    component: BottomNavigation,
    args: { items },
    argTypes: { items: { control: false } },
    parameters: { layout: 'fullscreen' },
    globals: { viewport: { value: 'mobile1' } },
    render: (args) => (
        <div className="min-h-dvh p-4 pb-24">
            <p className="text-sm text-muted">Page content. The bar stays at the bottom, above the home indicator.</p>
            <Demo {...args} />
        </div>
    ),
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fixed at the bottom; the current destination with aria-current="page", counters as part of the name */
export const Playground: Story = {};

/** Three destinations in the flow of the page (e.g. inside a frame) */
export const Inline: Story = {
    args: { items: items.slice(0, 3), inline: true },
    render: (args) => (
        <div className="max-w-sm border border-line">
            <Demo {...args} />
        </div>
    ),
};
