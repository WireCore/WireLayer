import { House, Server, Settings } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AppShell from '../AppShell/AppShell.vue';
import Button from '../Button/Button.vue';
import SearchField from '../SearchField/SearchField.vue';
import SidebarNav from '../SidebarNav/SidebarNav.vue';
import LandmarkNavigation from './LandmarkNavigation.vue';

const nav = [
    { label: 'Overview', href: '#', icon: House, current: true },
    { label: 'Server', href: '#', icon: Server },
    { label: 'Settings', href: '#', icon: Settings },
];

const meta = {
    title: 'Utilities/LandmarkNavigation',
    component: LandmarkNavigation,
    parameters: { layout: 'fullscreen' },
    render: () => ({
        components: { AppShell, Button, LandmarkNavigation, SearchField, SidebarNav },
        setup: () => ({ nav }),
        template: `
            <LandmarkNavigation>
                <AppShell :skip-links="[{ href: '#search', label: 'Skip to search' }]">
                    <template #header>
                        <span class="font-semibold">WireLayer Admin</span>
                        <SearchField id="search" size="sm" class="ml-auto max-w-72" />
                    </template>
                    <template #navbar><SidebarNav :items="nav" label="Main navigation" /></template>
                    <h1 class="text-2xl font-semibold">Overview</h1>
                    <p class="mt-2 max-w-prose text-sm text-muted">
                        F6 jumps to the next region (header, search, navigation, content, sidebar), Shift+F6 goes back.
                        The screen reader announces the name of the region.
                    </p>
                    <Button class="mt-4">Save</Button>
                    <template #aside><p class="text-sm text-muted">Notes on this page</p></template>
                </AppShell>
            </LandmarkNavigation>`,
    }),
} satisfies Meta<typeof LandmarkNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** F6 / Shift+F6 move between the landmarks of the page (opt-in) – here an AppShell with several skip links */
export const Playground: Story = {};
