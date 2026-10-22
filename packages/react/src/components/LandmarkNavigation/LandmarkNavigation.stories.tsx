import type { Meta, StoryObj } from '@storybook/react-vite';
import { House, Server, Settings } from 'lucide-react';
import { AppShell } from '../AppShell/AppShell.js';
import { Button } from '../Button/Button.js';
import { SearchField } from '../SearchField/SearchField.js';
import { SidebarNav } from '../SidebarNav/SidebarNav.js';
import { LandmarkNavigation } from './LandmarkNavigation.js';

const nav = [
    { label: 'Overview', href: '#', icon: House, current: true },
    { label: 'Server', href: '#', icon: Server },
    { label: 'Settings', href: '#', icon: Settings },
];

const meta = {
    title: 'Utilities/LandmarkNavigation',
    component: LandmarkNavigation,
    parameters: { layout: 'fullscreen' },
    render: () => (
        <LandmarkNavigation>
            <AppShell
                skipLinks={[{ href: '#search', label: 'Skip to search' }]}
                header={
                    <>
                        <span className="font-semibold">WireLayer Admin</span>
                        <SearchField id="search" size="sm" className="ml-auto max-w-72" />
                    </>
                }
                navbar={<SidebarNav items={nav} label="Main navigation" />}
                aside={<p className="text-sm text-muted">Notes on this page</p>}
            >
                <h1 className="text-2xl font-semibold">Overview</h1>
                <p className="mt-2 max-w-prose text-sm text-muted">
                    F6 jumps to the next region (header, search, navigation, content, sidebar), Shift+F6 goes back. The
                    screen reader announces the name of the region.
                </p>
                <Button className="mt-4">Save</Button>
            </AppShell>
        </LandmarkNavigation>
    ),
} satisfies Meta<typeof LandmarkNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** F6 / Shift+F6 move between the landmarks of the page (opt-in) – here an AppShell with several skip links */
export const Playground: Story = {};
