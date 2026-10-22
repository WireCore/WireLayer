import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartColumn, House, Mail, Server, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { SidebarNav } from '../SidebarNav/SidebarNav.js';
import { AppShell } from './AppShell.js';

const nav = [
    { label: 'Overview', href: '#', icon: House, current: true },
    { label: 'Server', href: '#', icon: Server },
    { label: 'Reports', href: '#', icon: ChartColumn },
    { label: 'Settings', href: '#', icon: Settings },
];

// With a counter and a group, for the rail
const railNav = [
    { label: 'Overview', href: '#', icon: House, current: true },
    { label: 'Messages', href: '#messages', icon: Mail, badge: 3 },
    { label: 'Server', href: '#server', icon: Server },
    {
        label: 'Reports',
        icon: ChartColumn,
        children: [
            { label: 'Utilization', href: '#utilization' },
            { label: 'Costs', href: '#costs' },
        ],
    },
    { label: 'Settings', href: '#settings', icon: Settings },
];

const content = (
    <>
        <h1 className="text-2xl font-semibold">Overview</h1>
        {Array.from({ length: 12 }, (_, index) => (
            <p key={index} className="mt-3 max-w-prose text-sm text-muted">
                Paragraph {index + 1}: page content, long enough to scroll.
            </p>
        ))}
    </>
);

const meta = {
    title: 'Layout/AppShell',
    component: AppShell,
    parameters: { layout: 'fullscreen' },
    args: { children: null },
    argTypes: { children: { control: false } },
    render: () => (
        <AppShell
            header={
                <>
                    <span className="font-semibold">WireLayer Admin</span>
                    <Button size="sm" variant="outline" className="ml-auto">
                        Sign out
                    </Button>
                </>
            }
            navbar={<SidebarNav items={nav} label="Main navigation" />}
            aside={<p className="text-sm text-muted">Notes on this page</p>}
        >
            <h1 className="text-2xl font-semibold">Overview</h1>
            <p className="mt-2 text-sm text-muted">
                Page content. Below 1024 px, the button at the top left opens the navigation.
            </p>
        </AppShell>
    ),
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

function RailDemo({ expandOnHover = false }: { expandOnHover?: boolean }) {
    const [collapsed, setCollapsed] = useState(true);
    return (
        <AppShell
            collapsible
            navbarCollapsed={collapsed}
            onNavbarCollapsedChange={setCollapsed}
            navbarExpandOnHover={expandOnHover}
            header={<span className="font-semibold">WireLayer Admin</span>}
            navbar={<SidebarNav items={railNav} label="Main navigation" />}
        >
            {content}
        </AppShell>
    );
}

/** The navbar folds into a rail of icons (desktop); the labels show as tooltips */
export const Rail: Story = { render: () => <RailDemo /> };

/** The rail opens over the content while hovered or focused */
export const RailExpandOnHover: Story = { render: () => <RailDemo expandOnHover /> };

/** Navbar and aside resizable (drag, arrow keys, Home/End, double click resets), remembered in localStorage */
export const Resizable: Story = {
    render: () => (
        <AppShell
            navbarResizable
            asideResizable
            storageKey="wirecore-story-app-shell"
            header={<span className="font-semibold">WireLayer Admin</span>}
            navbar={<SidebarNav items={nav} label="Main navigation" />}
            aside={<p className="text-sm text-muted">Notes on this page</p>}
        >
            {content}
        </AppShell>
    ),
};

/** The navbar runs the full height; the header hides while scrolling down (headroom); a footer */
export const NavbarFirstHeadroom: Story = {
    render: () => (
        <AppShell
            layout="navbar-first"
            headroom
            header={<span className="font-semibold">WireLayer Admin</span>}
            navbar={<SidebarNav items={nav} label="Main navigation" />}
            footer={<p>© 2026 WireLayer · Legal notice · Privacy</p>}
        >
            {content}
        </AppShell>
    ),
};
