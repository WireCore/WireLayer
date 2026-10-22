import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartColumn, House, LogOut, Server, Settings, Users } from 'lucide-react';
import { useState } from 'react';
import { SidebarNav, type SidebarNavItem, type SidebarNavProps } from './SidebarNav.js';

const items: SidebarNavItem[] = [
    { label: 'Overview', href: '#overview', icon: House },
    {
        label: 'Infrastructure',
        icon: Server,
        children: [
            { label: 'Server', href: '#server', current: true },
            { label: 'Networks', href: '#networks' },
            { label: 'Backups', href: '#backups' },
        ],
    },
    {
        label: 'Reports',
        icon: ChartColumn,
        children: [
            { label: 'Load', href: '#load' },
            { label: 'Costs', href: '#costs' },
        ],
    },
    { label: 'Team', href: '#team', icon: Users, badge: 2 },
    { label: 'Settings', href: '#settings', icon: Settings },
];

function Demo(args: SidebarNavProps) {
    const [nav, setNav] = useState(args.items);
    const mark = (list: SidebarNavItem[], item: SidebarNavItem): SidebarNavItem[] =>
        list.map((entry) => ({
            ...entry,
            current: entry === item,
            children: entry.children && mark(entry.children, item),
        }));
    return (
        <SidebarNav
            {...args}
            items={nav}
            className={args.rail ? undefined : 'w-60'}
            onNavigate={(item, event) => {
                event.preventDefault();
                setNav((old) => mark(old, item));
            }}
        />
    );
}

const meta = {
    title: 'Navigation/SidebarNav',
    component: SidebarNav,
    args: { items, label: 'Main navigation' },
    argTypes: { items: { control: false } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof SidebarNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** With a header, a footer and counters */
export const HeaderAndFooter: Story = {
    args: {
        header: <span className="px-2.5 font-semibold">WireLayer</span>,
        footer: (
            <a href="#sign-out" className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm hover:bg-line">
                <LogOut className="size-4 text-muted" aria-hidden="true" /> Sign out
            </a>
        ),
    },
    render: (args) => (
        <div className="flex h-[28rem]">
            <Demo {...args} />
        </div>
    ),
};

/** Icons only; the labels show as tooltips and stay the names of the links */
export const Rail: Story = {
    args: { rail: true },
    render: (args) => (
        <div className="w-16">
            <Demo {...args} />
        </div>
    ),
};

/** The rail shows the labels while hovered or focused */
export const RailExpandOnHover: Story = {
    args: { rail: true, expandOnHover: true },
    render: (args) => (
        <div className="w-16 hover:w-60 focus-within:w-60">
            <Demo {...args} />
        </div>
    ),
};
